import type { AlertMetric, AlertOperator } from "@prisma/client";

export type MeasurementPayload = {
  sensorId: string;
  sensorName: string;
  sensorType: string;
  temperature: number;
  humidity: number;
  pressure: number;
  rssi?: number | null;
  batteryVoltage?: number | null;
  status: string;
  firmwareVersion?: string | null;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  description?: string | null;
  timestamp?: string | null;
};

export type MeasurementQuery = {
  sensorIds?: string[];
  from?: Date;
  to?: Date;
  interval?: string;
  limit?: number;
  page?: number;
};

export type MeasurementClearInput = {
  sensorIds?: string[];
};

export type SensorUpdatePayload = {
  name?: string;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  description?: string | null;
};

export type AlertRulePayload = {
  sensorId?: string | null;
  metric: AlertMetric;
  operator: AlertOperator;
  threshold: number;
  enabled?: boolean;
};
