import type { Request, Response } from "express";
import { env } from "../config/env";
import { measurementService } from "../services/measurement.service";
import { measurementQuerySchema, measurementSchema } from "../utils/schemas";

export const measurementController = {
  async create(request: Request, response: Response) {
    const payload = measurementSchema.parse(request.body);
    const result = await measurementService.createMeasurement(payload);

    return response.status(201).json(result);
  },

  async latest(_request: Request, response: Response) {
    const result = await measurementService.getLatestMeasurements();
    return response.json(result);
  },

  async list(request: Request, response: Response) {
    const query = measurementQuerySchema.parse(request.query);
    const sensorIds = query.sensorId?.split(",").map((value) => value.trim()).filter(Boolean);

    const result = await measurementService.getMeasurements({
      sensorIds,
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
      interval: query.interval,
      limit: query.limit ?? env.DEFAULT_HISTORY_LIMIT,
      page: query.page ?? 1,
    });

    return response.json(result);
  },
};
