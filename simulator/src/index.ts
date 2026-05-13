import "dotenv/config";
import axios from "axios";
import { z } from "zod";

const configSchema = z.object({
  backendUrl: z.string().url(),
  apiKey: z.string().min(1),
  sensorCount: z.number().int().positive(),
  intervalMs: z.number().int().positive(),
  startIndex: z.number().int().nonnegative(),
});

type SimulatorState = {
  sensorId: string;
  sensorName: string;
  sensorType: string;
  phase: number;
  temperature: number;
  humidity: number;
  pressure: number;
  rssi: number;
  batteryVoltage: number;
};

const argumentEntries = process.argv.slice(2).reduce<Record<string, string>>((accumulator, entry) => {
  const [key, value] = entry.replace(/^--/, "").split("=");
  if (key && value != null) {
    accumulator[key] = value;
  }
  return accumulator;
}, {});

const config = configSchema.parse({
  backendUrl: argumentEntries.backendUrl ?? process.env.SIMULATOR_BACKEND_URL ?? "http://localhost:4000/api/measurements",
  apiKey: argumentEntries.apiKey ?? process.env.API_KEY ?? "change-me",
  sensorCount: Number(argumentEntries.sensorCount ?? process.env.SIMULATOR_SENSOR_COUNT ?? 3),
  intervalMs: Number(argumentEntries.intervalMs ?? process.env.SIMULATOR_INTERVAL_MS ?? 5000),
  startIndex: Number(argumentEntries.startIndex ?? process.env.SIMULATOR_START_INDEX ?? 1),
});

const sensorTypes = ["weather-station", "indoor-climate", "greenhouse"];
const sensorLocations = ["Taras", "Warsztat", "Szklarnia", "Dach", "Piwnica"];

const sensors: SimulatorState[] = Array.from({ length: config.sensorCount }, (_, index) => {
  const ordinal = index + config.startIndex;
  return {
    sensorId: `sim-weather-${String(ordinal).padStart(2, "0")}`,
    sensorName: `Simulator ${ordinal}`,
    sensorType: sensorTypes[index % sensorTypes.length],
    phase: ordinal * 1.7,
    temperature: 20 + index * 1.8,
    humidity: 48 + index * 4,
    pressure: 1002 + index * 3,
    rssi: -48 - index * 4,
    batteryVoltage: 4.1 - index * 0.08,
  };
});

function drift(value: number, step: number, amplitude: number, frequency: number, floor?: number, ceil?: number) {
  const nextValue = value + Math.sin(step / frequency) * amplitude + (Math.random() - 0.5) * amplitude * 0.15;
  const bounded = Math.min(ceil ?? Number.POSITIVE_INFINITY, Math.max(floor ?? Number.NEGATIVE_INFINITY, nextValue));
  return Number(bounded.toFixed(2));
}

async function sendMeasurement(sensor: SimulatorState, tick: number) {
  sensor.temperature = drift(sensor.temperature, tick + sensor.phase, 0.45, 5, 18, 30);
  sensor.humidity = drift(sensor.humidity, tick + sensor.phase, 1.2, 7, 35, 80);
  sensor.pressure = drift(sensor.pressure, tick + sensor.phase, 0.7, 11, 980, 1035);
  sensor.rssi = Math.round(drift(sensor.rssi, tick + sensor.phase, 2.3, 9, -85, -30));
  sensor.batteryVoltage = drift(sensor.batteryVoltage, tick + sensor.phase, 0.03, 25, 3.1, 4.2);

  const payload = {
    sensorId: sensor.sensorId,
    sensorName: sensor.sensorName,
    sensorType: sensor.sensorType,
    location: sensorLocations[tick % sensorLocations.length],
    temperature: sensor.temperature,
    humidity: sensor.humidity,
    pressure: sensor.pressure,
    rssi: sensor.rssi,
    batteryVoltage: sensor.batteryVoltage,
    status: sensor.batteryVoltage < 3.35 ? "warning" : "ok",
    firmwareVersion: "simulator-1.0.0",
  };

  try {
    await axios.post(config.backendUrl, payload, {
      headers: {
        "x-api-key": config.apiKey,
      },
      timeout: 5000,
    });

    console.log(
      `[POST] ${sensor.sensorId} ${payload.temperature.toFixed(1)}C ${payload.humidity.toFixed(1)}% ${payload.pressure.toFixed(1)}hPa RSSI ${payload.rssi}dBm`,
    );
  } catch (error) {
    console.error(`[ERROR] ${sensor.sensorId}`, error instanceof Error ? error.message : error);
  }
}

console.log("\nWeather Station Simulator");
console.log(`Backend: ${config.backendUrl}`);
console.log(`Sensors: ${config.sensorCount}`);
console.log(`Interval: ${config.intervalMs} ms\n`);

let tick = 0;

const run = async () => {
  await Promise.all(sensors.map((sensor) => sendMeasurement(sensor, tick)));
  tick += 1;
};

void run();
setInterval(() => {
  void run();
}, config.intervalMs);
