import type { Request, Response } from "express";
import { alertService } from "../services/alert.service";
import { alertEventQuerySchema, alertRuleSchema } from "../utils/schemas";

export const alertController = {
  async listRules(_request: Request, response: Response) {
    const rules = await alertService.listRules();
    return response.json(rules);
  },

  async createRule(request: Request, response: Response) {
    const payload = alertRuleSchema.parse(request.body);
    const rule = await alertService.createRule(payload);
    return response.status(201).json(rule);
  },

  async updateRule(request: Request, response: Response) {
    const id = String(request.params.id);
    await alertService.requireRule(id);
    const payload = alertRuleSchema.partial().parse(request.body);
    const rule = await alertService.updateRule(id, payload);
    return response.json(rule);
  },

  async listEvents(request: Request, response: Response) {
    const query = alertEventQuerySchema.parse(request.query);
    const events = await alertService.listEvents({
      sensorId: query.sensorId,
      acknowledged: query.acknowledged ? query.acknowledged === "true" : undefined,
      limit: query.limit,
    });
    return response.json(events);
  },

  async acknowledgeEvent(request: Request, response: Response) {
    const event = await alertService.acknowledgeEvent(String(request.params.id));
    return response.json(event);
  },
};
