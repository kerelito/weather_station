import type { Measurement } from "@prisma/client";
import { differenceInMilliseconds, subMilliseconds } from "date-fns";

type MetricName = "temperature" | "humidity" | "pressure" | "batteryVoltage" | "rssi";

const intervalToMsMap: Record<string, number> = {
  raw: 0,
  "5m": 5 * 60 * 1000,
  "15m": 15 * 60 * 1000,
  "1h": 60 * 60 * 1000,
  "6h": 6 * 60 * 60 * 1000,
  "1d": 24 * 60 * 60 * 1000,
};

export const metricNames: MetricName[] = ["temperature", "humidity", "pressure", "batteryVoltage", "rssi"];

export function intervalToMilliseconds(interval = "raw") {
  return intervalToMsMap[interval] ?? 0;
}

export function aggregateMeasurements(measurements: Measurement[], interval = "raw") {
  const bucketMs = intervalToMilliseconds(interval);

  if (bucketMs === 0) {
    return [...measurements].sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime());
  }

  const bucketed = new Map<
    string,
    {
      count: number;
      sensorId: string;
      sensorName: string;
      sensorType: string;
      createdAt: Date;
      temperature: number;
      humidity: number;
      pressure: number;
      rssiTotal: number;
      rssiCount: number;
      batteryTotal: number;
      batteryCount: number;
      status: string;
      firmwareVersion: string | null;
    }
  >();

  for (const item of measurements) {
    const bucketTime = Math.floor(item.createdAt.getTime() / bucketMs) * bucketMs;
    const key = `${item.sensorId}:${bucketTime}`;
    const current = bucketed.get(key);

    if (!current) {
      bucketed.set(key, {
        count: 1,
        sensorId: item.sensorId,
        sensorName: item.sensorName,
        sensorType: item.sensorType,
        createdAt: new Date(bucketTime),
        temperature: item.temperature,
        humidity: item.humidity,
        pressure: item.pressure,
        rssiTotal: item.rssi ?? 0,
        rssiCount: item.rssi == null ? 0 : 1,
        batteryTotal: item.batteryVoltage ?? 0,
        batteryCount: item.batteryVoltage == null ? 0 : 1,
        status: item.status,
        firmwareVersion: item.firmwareVersion ?? null,
      });
      continue;
    }

    current.count += 1;
    current.temperature += item.temperature;
    current.humidity += item.humidity;
    current.pressure += item.pressure;
    current.status = item.status;
    current.firmwareVersion = item.firmwareVersion ?? current.firmwareVersion;

    if (item.rssi != null) {
      current.rssiTotal += item.rssi;
      current.rssiCount += 1;
    }

    if (item.batteryVoltage != null) {
      current.batteryTotal += item.batteryVoltage;
      current.batteryCount += 1;
    }
  }

  return [...bucketed.values()]
    .map((item) => ({
      id: `${item.sensorId}-${item.createdAt.toISOString()}`,
      sensorId: item.sensorId,
      sensorName: item.sensorName,
      sensorType: item.sensorType,
      temperature: Number((item.temperature / item.count).toFixed(2)),
      humidity: Number((item.humidity / item.count).toFixed(2)),
      pressure: Number((item.pressure / item.count).toFixed(2)),
      rssi: item.rssiCount > 0 ? Math.round(item.rssiTotal / item.rssiCount) : null,
      batteryVoltage: item.batteryCount > 0 ? Number((item.batteryTotal / item.batteryCount).toFixed(2)) : null,
      status: item.status,
      firmwareVersion: item.firmwareVersion,
      createdAt: item.createdAt,
    }))
    .sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime());
}

export function calculateMetricSummary(values: number[]) {
  if (values.length === 0) {
    return {
      min: null,
      max: null,
      avg: null,
      latest: null,
      standardDeviation: null,
    };
  }

  const sum = values.reduce((accumulator, value) => accumulator + value, 0);
  const avg = sum / values.length;
  const variance = values.reduce((accumulator, value) => accumulator + (value - avg) ** 2, 0) / values.length;

  return {
    min: Number(Math.min(...values).toFixed(2)),
    max: Number(Math.max(...values).toFixed(2)),
    avg: Number(avg.toFixed(2)),
    latest: Number(values.at(-1)!.toFixed(2)),
    standardDeviation: Number(Math.sqrt(variance).toFixed(2)),
  };
}

export function calculateTrend(currentValues: number[], previousValues: number[]) {
  if (currentValues.length === 0 || previousValues.length === 0) {
    return {
      direction: "flat",
      delta: 0,
      percentage: 0,
    };
  }

  const currentAvg = currentValues.reduce((accumulator, value) => accumulator + value, 0) / currentValues.length;
  const previousAvg = previousValues.reduce((accumulator, value) => accumulator + value, 0) / previousValues.length;
  const delta = currentAvg - previousAvg;
  const percentage = previousAvg === 0 ? 0 : (delta / previousAvg) * 100;

  return {
    direction: delta > 0.1 ? "up" : delta < -0.1 ? "down" : "flat",
    delta: Number(delta.toFixed(2)),
    percentage: Number(percentage.toFixed(2)),
  };
}

export function resolveComparisonRange(from: Date | undefined, to: Date | undefined) {
  if (!from || !to) {
    const resolvedTo = new Date();
    const resolvedFrom = subMilliseconds(resolvedTo, 24 * 60 * 60 * 1000);
    return {
      current: { from: resolvedFrom, to: resolvedTo },
      previous: { from: subMilliseconds(resolvedFrom, 24 * 60 * 60 * 1000), to: resolvedFrom },
    };
  }

  const rangeMs = differenceInMilliseconds(to, from);
  return {
    current: { from, to },
    previous: { from: subMilliseconds(from, rangeMs), to: from },
  };
}

export function isAnomalous(value: number | null | undefined, average: number | null, standardDeviation: number | null) {
  if (value == null || average == null || standardDeviation == null) {
    return false;
  }

  if (standardDeviation === 0) {
    return false;
  }

  return Math.abs(value - average) >= standardDeviation * 2;
}
