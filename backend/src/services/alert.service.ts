import { AlertMetric, type AlertOperator, type Measurement } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { getIo } from "../lib/socket";
import type { AlertRulePayload } from "../types/api";
import { AppError } from "../utils/errors";

const compareValue = (value: number, operator: AlertOperator, threshold: number) => {
  switch (operator) {
    case "gt":
      return value > threshold;
    case "gte":
      return value >= threshold;
    case "lt":
      return value < threshold;
    case "lte":
      return value <= threshold;
    case "eq":
      return value === threshold;
    case "neq":
      return value !== threshold;
    default:
      return false;
  }
};

const ruleMetricLabels: Record<AlertMetric, string> = {
  temperature: "Temperatura",
  humidity: "Wilgotność",
  pressure: "Ciśnienie",
  batteryVoltage: "Napięcie",
  rssi: "RSSI",
};

const getMetricValue = (measurement: Measurement, metric: AlertMetric) => {
  switch (metric) {
    case "temperature":
      return measurement.temperature;
    case "humidity":
      return measurement.humidity;
    case "pressure":
      return measurement.pressure;
    case "batteryVoltage":
      return measurement.batteryVoltage;
    case "rssi":
      return measurement.rssi;
    default:
      return null;
  }
};

export const alertService = {
  async listRules() {
    return prisma.alertRule.findMany({
      include: {
        sensor: true,
        _count: {
          select: {
            alertEvents: true,
          },
        },
      },
      orderBy: [{ enabled: "desc" }, { createdAt: "desc" }],
    });
  },

  async createRule(payload: AlertRulePayload) {
    return prisma.alertRule.create({
      data: {
        sensorId: payload.sensorId ?? null,
        metric: payload.metric,
        operator: payload.operator,
        threshold: payload.threshold,
        enabled: payload.enabled ?? true,
      },
      include: {
        sensor: true,
      },
    });
  },

  async updateRule(id: string, payload: Partial<AlertRulePayload>) {
    return prisma.alertRule.update({
      where: { id },
      data: payload,
      include: {
        sensor: true,
      },
    });
  },

  async listEvents(options: { sensorId?: string; acknowledged?: boolean; limit?: number }) {
    return prisma.alertEvent.findMany({
      where: {
        sensorId: options.sensorId,
        acknowledged: options.acknowledged,
      },
      include: {
        sensor: true,
        rule: true,
      },
      orderBy: { createdAt: "desc" },
      take: options.limit ?? 100,
    });
  },

  async acknowledgeEvent(id: string) {
    return prisma.alertEvent.update({
      where: { id },
      data: { acknowledged: true },
    });
  },

  async evaluateMeasurement(measurement: Measurement) {
    const rules = await prisma.alertRule.findMany({
      where: {
        enabled: true,
        OR: [{ sensorId: null }, { sensorId: measurement.sensorId }],
      },
      orderBy: { createdAt: "asc" },
    });

    const createdEvents = [];

    for (const rule of rules) {
      const value = getMetricValue(measurement, rule.metric);

      if (value == null || !compareValue(value, rule.operator, rule.threshold)) {
        continue;
      }

      const recentEvent = await prisma.alertEvent.findFirst({
        where: {
          sensorId: measurement.sensorId,
          ruleId: rule.id,
          acknowledged: false,
        },
        orderBy: { createdAt: "desc" },
      });

      if (recentEvent && Date.now() - recentEvent.createdAt.getTime() < 30 * 60 * 1000) {
        continue;
      }

      const event = await prisma.alertEvent.create({
        data: {
          sensorId: measurement.sensorId,
          ruleId: rule.id,
          metric: rule.metric,
          value,
          message: `${ruleMetricLabels[rule.metric]} dla ${measurement.sensorName} spełnia warunek ${rule.operator} ${rule.threshold}.`,
        },
        include: {
          sensor: true,
          rule: true,
        },
      });

      createdEvents.push(event);
    }

    if (createdEvents.length > 0) {
      getIo().emit("alert:event", createdEvents);
    }

    return createdEvents;
  },

  async requireRule(id: string) {
    const rule = await prisma.alertRule.findUnique({ where: { id } });

    if (!rule) {
      throw new AppError("Alert rule not found.", 404);
    }

    return rule;
  },
};
