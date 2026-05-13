import { prisma } from "../lib/prisma";
import { getIo } from "../lib/socket";
import type { MeasurementPayload, MeasurementQuery } from "../types/api";
import { aggregateMeasurements } from "../utils/metrics";
import { alertService } from "./alert.service";

const parseSensorIds = (sensorIds?: string[]) => (sensorIds?.length ? { in: sensorIds } : undefined);

export const measurementService = {
  async createMeasurement(payload: MeasurementPayload) {
    const measuredAt = payload.timestamp ? new Date(payload.timestamp) : new Date();

    const sensor = await prisma.sensor.upsert({
      where: { id: payload.sensorId },
      create: {
        id: payload.sensorId,
        name: payload.sensorName,
        type: payload.sensorType,
        location: payload.location ?? null,
        latitude: payload.latitude ?? null,
        longitude: payload.longitude ?? null,
        description: payload.description ?? null,
        firmwareVersion: payload.firmwareVersion ?? null,
        lastSeenAt: measuredAt,
        isOnline: true,
      },
      update: {
        name: payload.sensorName,
        type: payload.sensorType,
        location: payload.location ?? undefined,
        latitude: payload.latitude ?? undefined,
        longitude: payload.longitude ?? undefined,
        description: payload.description ?? undefined,
        firmwareVersion: payload.firmwareVersion ?? undefined,
        lastSeenAt: measuredAt,
        isOnline: true,
      },
    });

    const measurement = await prisma.measurement.create({
      data: {
        sensorId: sensor.id,
        sensorName: payload.sensorName,
        sensorType: payload.sensorType,
        temperature: payload.temperature,
        humidity: payload.humidity,
        pressure: payload.pressure,
        rssi: payload.rssi ?? null,
        batteryVoltage: payload.batteryVoltage ?? null,
        status: payload.status,
        firmwareVersion: payload.firmwareVersion ?? null,
        createdAt: measuredAt,
      },
    });

    const [alerts, latestForSensor] = await Promise.all([
      alertService.evaluateMeasurement(measurement),
      prisma.measurement.findFirst({
        where: { sensorId: sensor.id },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    getIo().emit("measurement:new", {
      measurement,
      sensor: {
        ...sensor,
        latestMeasurement: latestForSensor,
      },
      alerts,
    });

    getIo().emit("sensor:status", {
      sensorId: sensor.id,
      isOnline: true,
      lastSeenAt: measuredAt.toISOString(),
    });

    return { measurement, sensor, alerts };
  },

  async getLatestMeasurements() {
    const sensors = await prisma.sensor.findMany({
      include: {
        measurements: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { name: "asc" },
    });

    return sensors.map((sensor) => ({
      ...sensor,
      latestMeasurement: sensor.measurements[0] ?? null,
    }));
  },

  async getMeasurements(query: MeasurementQuery) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 500;
    const where = {
      sensorId: parseSensorIds(query.sensorIds),
      createdAt: {
        gte: query.from,
        lte: query.to,
      },
    };

    const [total, measurements] = await Promise.all([
      prisma.measurement.count({ where }),
      prisma.measurement.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const chronological = [...measurements].reverse();
    const interval = query.interval ?? "raw";
    const data = aggregateMeasurements(chronological, interval);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        interval,
        count: data.length,
      },
    };
  },
};
