import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameDay,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { pl } from "date-fns/locale";
import type { Measurement } from "../types/domain";

export type SensorMetric = "temperature" | "humidity" | "pressure";

export type DailyMetricSummary = {
  avg: number | null;
  min: number | null;
  max: number | null;
};

export type DailySensorPoint = {
  createdAt: string;
  temperature: number;
  humidity: number;
  pressure: number;
  samples: number;
};

export type DayCompleteness = "empty" | "partial" | "complete";

export type DailySensorSummary = {
  date: string;
  label: string;
  shortLabel: string;
  dayOfMonth: string;
  temperature: DailyMetricSummary;
  humidity: DailyMetricSummary;
  pressure: DailyMetricSummary;
  points: DailySensorPoint[];
  measurementCount: number;
  sensorCount: number;
  completeness: DayCompleteness;
};

const metrics: SensorMetric[] = ["temperature", "humidity", "pressure"];

function round(value: number) {
  return Number(value.toFixed(1));
}

function toDate(value: string | Date) {
  return typeof value === "string" ? parseISO(value) : value;
}

export function getDayKey(value: string | Date) {
  return format(toDate(value), "yyyy-MM-dd");
}

function createMetricSummary(values: number[]): DailyMetricSummary {
  if (values.length === 0) {
    return { avg: null, min: null, max: null };
  }

  const total = values.reduce((sum, value) => sum + value, 0);

  return {
    avg: round(total / values.length),
    min: round(Math.min(...values)),
    max: round(Math.max(...values)),
  };
}

function aggregatePoints(measurements: Measurement[]): DailySensorPoint[] {
  const byTimestamp = new Map<
    string,
    {
      createdAt: string;
      temperature: number;
      humidity: number;
      pressure: number;
      samples: number;
    }
  >();

  for (const item of measurements) {
    const current = byTimestamp.get(item.createdAt) ?? {
      createdAt: item.createdAt,
      temperature: 0,
      humidity: 0,
      pressure: 0,
      samples: 0,
    };

    current.temperature += item.temperature;
    current.humidity += item.humidity;
    current.pressure += item.pressure;
    current.samples += 1;
    byTimestamp.set(item.createdAt, current);
  }

  return [...byTimestamp.values()]
    .sort((left, right) => parseISO(left.createdAt).getTime() - parseISO(right.createdAt).getTime())
    .map((item) => ({
      createdAt: item.createdAt,
      temperature: round(item.temperature / item.samples),
      humidity: round(item.humidity / item.samples),
      pressure: round(item.pressure / item.samples),
      samples: item.samples,
    }));
}

function resolveCompleteness(date: Date, points: DailySensorPoint[]): DayCompleteness {
  if (points.length === 0) return "empty";
  if (isSameDay(date, new Date())) return "partial";

  const hours = new Set(points.map((point) => format(parseISO(point.createdAt), "HH")));
  return hours.size >= 18 ? "complete" : "partial";
}

function buildEmptySummary(date: Date): DailySensorSummary {
  return {
    date: getDayKey(date),
    label: format(date, "EEEE", { locale: pl }),
    shortLabel: format(date, "EEE", { locale: pl }),
    dayOfMonth: format(date, "d"),
    temperature: createMetricSummary([]),
    humidity: createMetricSummary([]),
    pressure: createMetricSummary([]),
    points: [],
    measurementCount: 0,
    sensorCount: 0,
    completeness: "empty",
  };
}

export function aggregateDailySensorData(measurements: Measurement[]): DailySensorSummary[] {
  const byDay = new Map<string, Measurement[]>();

  for (const item of measurements) {
    const dayKey = getDayKey(item.createdAt);
    const current = byDay.get(dayKey) ?? [];
    current.push(item);
    byDay.set(dayKey, current);
  }

  return [...byDay.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([dayKey, items]) => getDaySummary(items, parseISO(dayKey)));
}

export function getDaySummary(measurements: Measurement[], date: string | Date): DailySensorSummary {
  const day = startOfDay(toDate(date));
  const dayKey = getDayKey(day);
  const items = measurements.filter((item) => getDayKey(item.createdAt) === dayKey);

  if (items.length === 0) {
    return buildEmptySummary(day);
  }

  const points = aggregatePoints(items);
  const sensorIds = new Set(items.map((item) => item.sensorId));
  const summary = buildEmptySummary(day);

  return {
    ...summary,
    temperature: createMetricSummary(items.map((item) => item.temperature)),
    humidity: createMetricSummary(items.map((item) => item.humidity)),
    pressure: createMetricSummary(items.map((item) => item.pressure)),
    points,
    measurementCount: items.length,
    sensorCount: sensorIds.size,
    completeness: resolveCompleteness(day, points),
  };
}

export function getWeekSummaries(measurements: Measurement[], anchorDate: string | Date) {
  const start = startOfWeek(toDate(anchorDate), { weekStartsOn: 1 });
  const end = endOfWeek(toDate(anchorDate), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start, end });

  return days.map((day) => getDaySummary(measurements, day));
}

export function getMonthSummaries(measurements: Measurement[], anchorDate: string | Date) {
  const start = startOfMonth(toDate(anchorDate));
  const end = endOfMonth(toDate(anchorDate));
  const days = eachDayOfInterval({ start, end });

  return days.map((day) => getDaySummary(measurements, day));
}

export function getPeriodRange(view: "day" | "week" | "month", anchorDate: Date) {
  if (view === "day") {
    return {
      from: startOfDay(anchorDate),
      to: addDays(startOfDay(anchorDate), 1),
    };
  }

  if (view === "week") {
    const from = startOfWeek(anchorDate, { weekStartsOn: 1 });
    return {
      from,
      to: addDays(endOfWeek(anchorDate, { weekStartsOn: 1 }), 1),
    };
  }

  const from = startOfMonth(anchorDate);
  return {
    from,
    to: addDays(endOfMonth(anchorDate), 1),
  };
}

export function clampMeasurementsToRange(measurements: Measurement[], from: Date, to: Date) {
  return measurements.filter((item) => {
    const createdAt = parseISO(item.createdAt);
    return !isBefore(createdAt, from) && isBefore(createdAt, to);
  });
}

export function isFutureDay(date: string | Date) {
  return isAfter(startOfDay(toDate(date)), startOfDay(new Date()));
}

export { metrics as sensorMetrics };
