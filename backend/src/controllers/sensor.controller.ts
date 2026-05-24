import type { Request, Response } from "express";
import { sensorService } from "../services/sensor.service";
import { sensorUpdateSchema } from "../utils/schemas";

export const sensorController = {
  async list(_request: Request, response: Response) {
    const sensors = await sensorService.listSensors();
    return response.json(sensors);
  },

  async getById(request: Request, response: Response) {
    const sensor = await sensorService.getSensorById(String(request.params.id));
    return response.json(sensor);
  },

  async update(request: Request, response: Response) {
    const payload = sensorUpdateSchema.parse(request.body);
    const sensor = await sensorService.updateSensor(String(request.params.id), payload);
    return response.json(sensor);
  },

  async remove(request: Request, response: Response) {
    await sensorService.deleteSensor(String(request.params.id));
    return response.status(204).send();
  },
};
