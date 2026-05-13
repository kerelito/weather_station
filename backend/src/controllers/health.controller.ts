import type { Request, Response } from "express";
import { healthService } from "../services/health.service";

export const healthController = {
  async get(_request: Request, response: Response) {
    const health = await healthService.getHealth();
    return response.json(health);
  },
};
