import type { Request, Response } from "express";
import { statsService } from "../services/stats.service";
import { measurementQuerySchema } from "../utils/schemas";

export const statsController = {
  async get(request: Request, response: Response) {
    const query = measurementQuerySchema.parse(request.query);
    const sensorIds = query.sensorId?.split(",").map((value) => value.trim()).filter(Boolean);
    const stats = await statsService.getStats({
      sensorIds,
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
    });

    return response.json(stats);
  },
};
