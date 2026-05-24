import { prisma } from "../lib/prisma";
import type { SensorUpdatePayload } from "../types/api";
import { AppError } from "../utils/errors";
import { calculateMetricSummary } from "../utils/metrics";

export const sensorService = {
  async listSensors() {
    const sensors = await prisma.sensor.findMany({
      include: {
        measurements: {
          take: 1,
          orderBy: { createdAt: "desc" },
        },
        alertRules: {
          where: { enabled: true },
        },
        _count: {
          select: {
            measurements: true,
            alertEvents: true,
          },
        },
      },
      orderBy: [{ isOnline: "desc" }, { name: "asc" }],
    });

    return sensors.map((sensor) => ({
      ...sensor,
      latestMeasurement: sensor.measurements[0] ?? null,
    }));
  },

  async getSensorById(id: string) {
    const sensor = await prisma.sensor.findUnique({
      where: { id },
      include: {
        measurements: {
          orderBy: { createdAt: "desc" },
          take: 96,
        },
        alertRules: {
          orderBy: { createdAt: "desc" },
        },
        alertEvents: {
          orderBy: { createdAt: "desc" },
          take: 12,
        },
      },
    });

    if (!sensor) {
      throw new AppError("Sensor not found.", 404);
    }

    const chronological = [...sensor.measurements].reverse();
    const temperatures = chronological.map((item) => item.temperature);
    const humidity = chronological.map((item) => item.humidity);
    const pressure = chronological.map((item) => item.pressure);
    const battery = chronological.map((item) => item.batteryVoltage).filter((value): value is number => value != null);

    return {
      ...sensor,
      latestMeasurement: sensor.measurements[0] ?? null,
      recentMeasurements: chronological,
      stats: {
        temperature: calculateMetricSummary(temperatures),
        humidity: calculateMetricSummary(humidity),
        pressure: calculateMetricSummary(pressure),
        batteryVoltage: calculateMetricSummary(battery),
      },
    };
  },

  async updateSensor(id: string, payload: SensorUpdatePayload) {
    try {
      return await prisma.sensor.update({
        where: { id },
        data: payload,
      });
    } catch {
      throw new AppError("Sensor not found.", 404);
    }
  },

  async deleteSensor(id: string) {
    try {
      return await prisma.$transaction(async (transaction) => {
        await transaction.alertRule.deleteMany({
          where: { sensorId: id },
        });

        return transaction.sensor.delete({
          where: { id },
        });
      });
    } catch {
      throw new AppError("Sensor not found.", 404);
    }
  },

  async markOffline(staleBefore: Date) {
    const staleSensors = await prisma.sensor.findMany({
      where: {
        isOnline: true,
        lastSeenAt: {
          lt: staleBefore,
        },
      },
      select: {
        id: true,
        lastSeenAt: true,
      },
    });

    if (staleSensors.length === 0) {
      return [];
    }

    await prisma.sensor.updateMany({
      where: {
        id: {
          in: staleSensors.map((sensor) => sensor.id),
        },
      },
      data: {
        isOnline: false,
      },
    });

    return staleSensors;
  },
};
