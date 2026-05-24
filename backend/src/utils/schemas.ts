import { AlertMetric, AlertOperator } from "@prisma/client";
import { z } from "zod";

const isoDate = z
  .string()
  .datetime({ offset: true })
  .or(z.string().datetime())
  .optional();

export const measurementSchema = z.object({
  sensorId: z.string().min(2),
  sensorName: z.string().min(2),
  sensorType: z.string().min(2),
  temperature: z.number().min(-50).max(80),
  humidity: z.number().min(0).max(100),
  pressure: z.number().min(850).max(1200),
  rssi: z.number().int().min(-120).max(0).optional().nullable(),
  batteryVoltage: z.number().min(0).max(10).optional().nullable(),
  status: z.string().min(2).max(32),
  firmwareVersion: z.string().max(40).optional().nullable(),
  location: z.string().max(120).optional().nullable(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  description: z.string().max(300).optional().nullable(),
  timestamp: isoDate.nullable(),
});

export const measurementQuerySchema = z.object({
  sensorId: z.string().optional(),
  from: isoDate,
  to: isoDate,
  interval: z.enum(["raw", "5m", "15m", "1h", "6h", "1d"]).optional(),
  limit: z.coerce.number().int().positive().max(5000).optional(),
  page: z.coerce.number().int().positive().optional(),
});

export const measurementClearSchema = z.object({
  sensorId: z.string().optional(),
});

export const sensorUpdateSchema = z
  .object({
    name: z.string().min(2).max(80).optional(),
    location: z.string().max(120).nullable().optional(),
    latitude: z.number().min(-90).max(90).nullable().optional(),
    longitude: z.number().min(-180).max(180).nullable().optional(),
    description: z.string().max(300).nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided.",
  });

export const alertRuleSchema = z.object({
  sensorId: z.string().optional().nullable(),
  metric: z.nativeEnum(AlertMetric),
  operator: z.nativeEnum(AlertOperator),
  threshold: z.number(),
  enabled: z.boolean().optional(),
});

export const alertEventQuerySchema = z.object({
  sensorId: z.string().optional(),
  acknowledged: z.enum(["true", "false"]).optional(),
  limit: z.coerce.number().int().positive().max(500).optional(),
});
