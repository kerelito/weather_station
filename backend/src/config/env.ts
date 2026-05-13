import { config } from "dotenv";
import { z } from "zod";

config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  API_KEY: z.string().min(8, "API_KEY must be at least 8 characters long"),
  FRONTEND_URL: z.string().optional(),
  BACKEND_URL: z.string().optional(),
  SENSOR_OFFLINE_AFTER_MINUTES: z.coerce.number().positive().default(5),
  DEFAULT_HISTORY_LIMIT: z.coerce.number().positive().default(500),
});

export const env = envSchema.parse(process.env);
