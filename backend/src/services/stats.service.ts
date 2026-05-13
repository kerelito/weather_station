import { prisma } from "../lib/prisma";
import { calculateMetricSummary, calculateTrend, isAnomalous, metricNames, resolveComparisonRange } from "../utils/metrics";

type StatsInput = {
  sensorIds?: string[];
  from?: Date;
  to?: Date;
};

const sensorWhere = (sensorIds?: string[]) => (sensorIds?.length ? { in: sensorIds } : undefined);

export const statsService = {
  async getStats(filters: StatsInput) {
    const range = resolveComparisonRange(filters.from, filters.to);
    const currentWhere = {
      sensorId: sensorWhere(filters.sensorIds),
      createdAt: {
        gte: range.current.from,
        lte: range.current.to,
      },
    };

    const previousWhere = {
      sensorId: sensorWhere(filters.sensorIds),
      createdAt: {
        gte: range.previous.from,
        lte: range.previous.to,
      },
    };

    const [currentMeasurements, previousMeasurements, sensors, latestMeasurements] = await Promise.all([
      prisma.measurement.findMany({ where: currentWhere, orderBy: { createdAt: "asc" } }),
      prisma.measurement.findMany({ where: previousWhere, orderBy: { createdAt: "asc" } }),
      prisma.sensor.findMany({
        where: {
          id: sensorWhere(filters.sensorIds),
        },
      }),
      prisma.sensor.findMany({
        where: {
          id: sensorWhere(filters.sensorIds),
        },
        include: {
          measurements: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      }),
    ]);

    const metrics = Object.fromEntries(
      metricNames.map((metric) => {
        const currentValues = currentMeasurements
          .map((measurement) => measurement[metric])
          .filter((value): value is number => value != null);
        const previousValues = previousMeasurements
          .map((measurement) => measurement[metric])
          .filter((value): value is number => value != null);

        return [
          metric,
          {
            ...calculateMetricSummary(currentValues),
            trend: calculateTrend(currentValues, previousValues),
          },
        ];
      }),
    );

    const anomalies = latestMeasurements
      .map((sensor) => {
        const latest = sensor.measurements[0];

        if (!latest) {
          return null;
        }

        const temperatureStats = metrics.temperature as ReturnType<typeof calculateMetricSummary> & {
          trend: ReturnType<typeof calculateTrend>;
        };
        const humidityStats = metrics.humidity as ReturnType<typeof calculateMetricSummary> & {
          trend: ReturnType<typeof calculateTrend>;
        };

        if (isAnomalous(latest.temperature, temperatureStats.avg, temperatureStats.standardDeviation)) {
          return {
            sensorId: sensor.id,
            metric: "temperature",
            value: latest.temperature,
            message: "Temperatura odbiega od typowego profilu ostatniego okresu.",
          };
        }

        if (isAnomalous(latest.humidity, humidityStats.avg, humidityStats.standardDeviation)) {
          return {
            sensorId: sensor.id,
            metric: "humidity",
            value: latest.humidity,
            message: "Wilgotność wygląda nietypowo względem średniej historycznej.",
          };
        }

        if ((latest.batteryVoltage ?? 5) < 3.35) {
          return {
            sensorId: sensor.id,
            metric: "batteryVoltage",
            value: latest.batteryVoltage,
            message: "Napięcie baterii spadło do poziomu ostrzegawczego.",
          };
        }

        return null;
      })
      .filter(Boolean);

    return {
      range: {
        from: range.current.from.toISOString(),
        to: range.current.to.toISOString(),
      },
      measurements: currentMeasurements.length,
      sensors: {
        total: sensors.length,
        online: sensors.filter((sensor) => sensor.isOnline).length,
        offline: sensors.filter((sensor) => !sensor.isOnline).length,
      },
      metrics,
      anomalies,
    };
  },
};
