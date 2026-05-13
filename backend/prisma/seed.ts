import { PrismaClient, type AlertMetric, type AlertOperator } from "@prisma/client";
import { addMinutes, subDays } from "date-fns";

const prisma = new PrismaClient();

type SensorSeed = {
  id: string;
  name: string;
  type: string;
  location: string;
  latitude: number;
  longitude: number;
  description: string;
  firmwareVersion: string;
};

const sensors: SensorSeed[] = [
  {
    id: "esp32-weather-01",
    name: "Ogród Południowy",
    type: "weather-station",
    location: "Taras południowy",
    latitude: 52.2297,
    longitude: 21.0122,
    description: "Zewnętrzna stacja pogodowa z AHT20 + BMP280.",
    firmwareVersion: "1.0.0",
  },
  {
    id: "esp32-weather-02",
    name: "Warsztat",
    type: "indoor-climate",
    location: "Pracownia IoT",
    latitude: 52.232,
    longitude: 21.01,
    description: "Czujnik wewnętrzny monitorujący temperaturę i wilgotność.",
    firmwareVersion: "1.0.0",
  },
  {
    id: "esp32-weather-03",
    name: "Szklarnia",
    type: "greenhouse",
    location: "Szklarnia przy domu",
    latitude: 52.228,
    longitude: 21.019,
    description: "Czujnik środowiskowy do monitoringu roślin.",
    firmwareVersion: "1.0.0",
  },
];

const rules: Array<{
  sensorId: string | null;
  metric: AlertMetric;
  operator: AlertOperator;
  threshold: number;
}> = [
  { sensorId: null, metric: "temperature", operator: "gt", threshold: 28 },
  { sensorId: null, metric: "humidity", operator: "lt", threshold: 38 },
  { sensorId: null, metric: "batteryVoltage", operator: "lt", threshold: 3.35 },
];

const oscillate = (base: number, amplitude: number, tick: number, phase: number) =>
  base + Math.sin((tick + phase) / 7) * amplitude + Math.cos((tick + phase) / 11) * (amplitude / 3);

async function main() {
  await prisma.alertEvent.deleteMany();
  await prisma.alertRule.deleteMany();
  await prisma.measurement.deleteMany();
  await prisma.sensor.deleteMany();

  for (const sensor of sensors) {
    await prisma.sensor.create({
      data: {
        ...sensor,
        isOnline: true,
        lastSeenAt: new Date(),
      },
    });
  }

  for (const rule of rules) {
    await prisma.alertRule.create({ data: rule });
  }

  const start = subDays(new Date(), 7);
  const intervalMinutes = 15;
  const steps = (7 * 24 * 60) / intervalMinutes;
  const measurementRows = [];

  for (const sensor of sensors) {
    for (let step = 0; step < steps; step += 1) {
      const timestamp = addMinutes(start, step * intervalMinutes);
      const phase = sensor.id.endsWith("01") ? 0 : sensor.id.endsWith("02") ? 5 : 10;
      const temperature = Number((oscillate(23 + phase * 0.05, 4.2, step, phase)).toFixed(2));
      const humidity = Number((oscillate(55 - phase * 0.2, 11, step, phase + 3)).toFixed(2));
      const pressure = Number((oscillate(1009 + phase * 0.4, 7, step, phase + 7)).toFixed(2));
      const rssi = Math.round(-50 - Math.sin(step / 9) * 14 - phase);
      const batteryVoltage = Number((3.55 + Math.cos(step / 20 + phase) * 0.22).toFixed(2));

      measurementRows.push({
        sensorId: sensor.id,
        sensorName: sensor.name,
        sensorType: sensor.type,
        temperature,
        humidity,
        pressure,
        rssi,
        batteryVoltage,
        status: batteryVoltage < 3.3 ? "warning" : "ok",
        firmwareVersion: sensor.firmwareVersion,
        createdAt: timestamp,
      });
    }
  }

  for (let index = 0; index < measurementRows.length; index += 250) {
    await prisma.measurement.createMany({
      data: measurementRows.slice(index, index + 250),
    });
  }

  await prisma.alertEvent.createMany({
    data: [
      {
        sensorId: "esp32-weather-03",
        message: "Wilgotność spadła poniżej rekomendowanego progu dla szklarni.",
        metric: "humidity",
        value: 36.2,
        acknowledged: false,
      },
      {
        sensorId: "esp32-weather-02",
        message: "Napięcie zasilania zbliża się do dolnego limitu.",
        metric: "batteryVoltage",
        value: 3.29,
        acknowledged: true,
      },
    ],
  });

  console.log(`Seed complete: ${measurementRows.length} pomiarów, ${sensors.length} czujniki.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
