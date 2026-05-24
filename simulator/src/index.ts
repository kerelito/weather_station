import "dotenv/config";
import axios from "axios";
import { z } from "zod";

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const DEFAULT_TIMEZONE = "Europe/Warsaw";
const HISTORY_MONTHS = 3;
const HISTORY_BATCH_SIZE = 12;

const configSchema = z.object({
  backendUrl: z.string().url(),
  apiKey: z.string().min(1),
  sensorCount: z.number().int().positive(),
  intervalMs: z.number().int().positive(),
  startIndex: z.number().int().nonnegative(),
  timezone: z.string().min(1),
  historyMonths: z.number().int().positive(),
  historyBatchSize: z.number().int().positive(),
  skipHistory: z.boolean(),
});

type SensorProfile = {
  sensorId: string;
  sensorName: string;
  sensorType: string;
  location: string;
  phase: number;
  temperatureOffset: number;
  humidityOffset: number;
  pressureOffset: number;
  rssiBase: number;
  batteryBase: number;
};

type LocalDateInfo = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  dayOfYear: number;
  daysInMonth: number;
};

type MeasurementPayload = {
  sensorId: string;
  sensorName: string;
  sensorType: string;
  location: string;
  temperature: number;
  humidity: number;
  pressure: number;
  rssi: number;
  batteryVoltage: number;
  status: string;
  firmwareVersion: string;
  timestamp: string;
};

type LatestSensorResponse = Array<{
  id: string;
  latestMeasurement?: {
    createdAt: string;
  } | null;
}>;

const argumentEntries = process.argv.slice(2).reduce<Record<string, string>>((accumulator, entry) => {
  const [key, value] = entry.replace(/^--/, "").split("=");
  if (key && value != null) {
    accumulator[key] = value;
  }
  return accumulator;
}, {});

const parseBoolean = (value: string | undefined, fallback: boolean) => {
  if (value == null) {
    return fallback;
  }

  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
};

const config = configSchema.parse({
  backendUrl: argumentEntries.backendUrl ?? process.env.SIMULATOR_BACKEND_URL ?? "http://localhost:4000/api/measurements",
  apiKey: argumentEntries.apiKey ?? process.env.API_KEY ?? "change-me",
  sensorCount: Number(argumentEntries.sensorCount ?? process.env.SIMULATOR_SENSOR_COUNT ?? 3),
  intervalMs: Number(argumentEntries.intervalMs ?? process.env.SIMULATOR_INTERVAL_MS ?? 5000),
  startIndex: Number(argumentEntries.startIndex ?? process.env.SIMULATOR_START_INDEX ?? 1),
  timezone: argumentEntries.timezone ?? process.env.SIMULATOR_TIMEZONE ?? DEFAULT_TIMEZONE,
  historyMonths: Number(argumentEntries.historyMonths ?? process.env.SIMULATOR_HISTORY_MONTHS ?? HISTORY_MONTHS),
  historyBatchSize: Number(argumentEntries.historyBatchSize ?? process.env.SIMULATOR_HISTORY_BATCH_SIZE ?? HISTORY_BATCH_SIZE),
  skipHistory: parseBoolean(argumentEntries.skipHistory ?? process.env.SIMULATOR_SKIP_HISTORY, false),
});

const climateNormals = {
  temperature: [-1.5, -0.3, 4.2, 9.6, 14.7, 18.1, 20.4, 19.8, 15.1, 9.8, 4.5, 0.3],
  humidity: [86, 82, 76, 70, 68, 69, 70, 72, 78, 83, 88, 89],
  pressure: [1017, 1016, 1015, 1014, 1013.5, 1013.8, 1014.1, 1014.3, 1015.3, 1016.2, 1017, 1017.3],
  amplitude: [2.4, 2.8, 4.8, 6.2, 7.4, 8.1, 8.4, 7.7, 5.8, 4.2, 3, 2.4],
};

const sensorProfiles = [
  { location: "Warszawa - Taras", sensorType: "weather-station", temperatureOffset: 0.2, humidityOffset: 0, pressureOffset: 0.1, rssiBase: -48, batteryBase: 4.18 },
  { location: "Krakow - Biuro", sensorType: "indoor-climate", temperatureOffset: 0.8, humidityOffset: -4, pressureOffset: -0.2, rssiBase: -54, batteryBase: 4.08 },
  { location: "Poznan - Szklarnia", sensorType: "greenhouse", temperatureOffset: 1.5, humidityOffset: 6, pressureOffset: 0, rssiBase: -58, batteryBase: 4.02 },
  { location: "Gdansk - Dach", sensorType: "weather-station", temperatureOffset: -0.6, humidityOffset: 4, pressureOffset: 0.4, rssiBase: -52, batteryBase: 4.12 },
  { location: "Wroclaw - Warsztat", sensorType: "indoor-climate", temperatureOffset: 0.4, humidityOffset: -2, pressureOffset: -0.1, rssiBase: -60, batteryBase: 4.05 },
];

const localDateFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: config.timezone,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const sensors: SensorProfile[] = Array.from({ length: config.sensorCount }, (_, index) => {
  const ordinal = index + config.startIndex;
  const profile = sensorProfiles[index % sensorProfiles.length];

  return {
    sensorId: `sim-weather-${String(ordinal).padStart(2, "0")}`,
    sensorName: `Simulator ${ordinal}`,
    sensorType: profile.sensorType,
    location: profile.location,
    phase: ordinal * 0.83,
    temperatureOffset: profile.temperatureOffset + (index % 3) * 0.15,
    humidityOffset: profile.humidityOffset + (index % 2) * 1.5,
    pressureOffset: profile.pressureOffset,
    rssiBase: profile.rssiBase - (index % 4) * 2,
    batteryBase: profile.batteryBase - index * 0.03,
  };
});

const simulationWindowEnd = new Date();
const historyStart = new Date(simulationWindowEnd);
historyStart.setMonth(historyStart.getMonth() - config.historyMonths);
historyStart.setMinutes(0, 0, 0);

function clamp(value: number, floor: number, ceil: number) {
  return Math.min(ceil, Math.max(floor, value));
}

function round(value: number, decimals = 2) {
  return Number(value.toFixed(decimals));
}

function wave(position: number, period: number, phase = 0) {
  return Math.sin((position / period) * Math.PI * 2 + phase);
}

function getLocalDateInfo(date: Date): LocalDateInfo {
  const parts = localDateFormatter.formatToParts(date);
  const read = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? "0");
  const year = read("year");
  const month = read("month");
  const day = read("day");
  const hour = read("hour");
  const minute = read("minute");
  const dayOfYear = Math.floor((Date.UTC(year, month - 1, day) - Date.UTC(year, 0, 0)) / DAY_MS);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  return { year, month, day, hour, minute, dayOfYear, daysInMonth };
}

function interpolateMonthly(values: number[], info: LocalDateInfo) {
  const currentIndex = info.month - 1;
  const nextIndex = (currentIndex + 1) % values.length;
  const fraction = (info.day - 1 + info.hour / 24 + info.minute / (24 * 60)) / info.daysInMonth;

  return values[currentIndex] + (values[nextIndex] - values[currentIndex]) * fraction;
}

function resolveHistoryStepMs(timestamp: Date, now: Date) {
  const ageMs = now.getTime() - timestamp.getTime();

  if (ageMs > 14 * DAY_MS) {
    return 3 * HOUR_MS;
  }

  if (ageMs > 2 * DAY_MS) {
    return HOUR_MS;
  }

  return 5 * MINUTE_MS;
}

function buildHistoryTimeline(now: Date) {
  const timeline: Date[] = [];
  let cursor = new Date(historyStart);
  const liveBoundary = new Date(now.getTime() - Math.max(config.intervalMs, 5 * MINUTE_MS));

  while (cursor < liveBoundary) {
    timeline.push(new Date(cursor));
    cursor = new Date(cursor.getTime() + resolveHistoryStepMs(cursor, now));
  }

  return timeline;
}

function resolveLatestMeasurementsUrl(measurementsUrl: string) {
  const url = new URL(measurementsUrl);

  if (url.pathname.endsWith("/measurements")) {
    url.pathname = `${url.pathname}/latest`;
    return url.toString();
  }

  url.pathname = url.pathname.replace(/\/measurements\/?$/, "/measurements/latest");
  return url.toString();
}

function buildMeasurementPayload(sensor: SensorProfile, timestamp: Date): MeasurementPayload {
  const local = getLocalDateInfo(timestamp);
  const hourFraction = local.hour + local.minute / 60;
  const absoluteHours = timestamp.getTime() / HOUR_MS;
  const daysSinceHistoryStart = (timestamp.getTime() - historyStart.getTime()) / DAY_MS;

  const baseTemperature = interpolateMonthly(climateNormals.temperature, local);
  const baseHumidity = interpolateMonthly(climateNormals.humidity, local);
  const basePressure = interpolateMonthly(climateNormals.pressure, local);
  const dailyAmplitude = interpolateMonthly(climateNormals.amplitude, local);

  const frontWave = wave(absoluteHours, 42, sensor.phase) * 0.75 + wave(absoluteHours, 138, sensor.phase * 0.6) * 0.45;
  const dayWave = wave(hourFraction - 9, 24);
  const pressure = clamp(
    basePressure + frontWave * 10.5 + wave(absoluteHours, 24, sensor.phase * 0.4) * 0.6 + sensor.pressureOffset,
    982,
    1042,
  );
  const cloudiness = clamp(0.52 - (pressure - basePressure) / 18 + Math.max(0, -frontWave) * 0.12, 0.05, 0.95);

  let temperature = baseTemperature
    + dailyAmplitude * dayWave * (1 - cloudiness * 0.35)
    + frontWave * 1.7
    + sensor.temperatureOffset
    + wave(local.dayOfYear, 19, sensor.phase) * 0.8;
  let humidity = baseHumidity + cloudiness * 16 - dayWave * 10 - frontWave * 4.5 + sensor.humidityOffset;

  if (sensor.sensorType === "indoor-climate") {
    temperature = 21.2 + (baseTemperature - 10) * 0.18 + dayWave * 1.1 + frontWave * 0.45 + sensor.temperatureOffset;
    humidity = 43 + cloudiness * 8 - dayWave * 4 + sensor.humidityOffset;
  }

  if (sensor.sensorType === "greenhouse") {
    temperature = baseTemperature + 4.2 + Math.max(0, dayWave) * 5.5 + frontWave * 0.9 + sensor.temperatureOffset;
    humidity = baseHumidity + 10 + cloudiness * 10 + Math.max(0, -dayWave) * 6 + sensor.humidityOffset;
  }

  const batteryVoltage = clamp(
    sensor.batteryBase - daysSinceHistoryStart * 0.0025 + Math.max(0, dayWave) * 0.01 + wave(absoluteHours, 72, sensor.phase) * 0.015,
    3.18,
    4.2,
  );
  const rssi = Math.round(clamp(sensor.rssiBase + frontWave * 1.5 + wave(absoluteHours, 18, sensor.phase) * 2.6, -90, -35));

  return {
    sensorId: sensor.sensorId,
    sensorName: sensor.sensorName,
    sensorType: sensor.sensorType,
    location: sensor.location,
    temperature: round(temperature),
    humidity: round(clamp(humidity, 28, 98)),
    pressure: round(pressure),
    rssi,
    batteryVoltage: round(batteryVoltage),
    status: batteryVoltage < 3.35 ? "warning" : "ok",
    firmwareVersion: "simulator-2.0.0",
    timestamp: timestamp.toISOString(),
  };
}

async function sendMeasurement(sensor: SensorProfile, timestamp: Date, mode: "history" | "live") {
  const payload = buildMeasurementPayload(sensor, timestamp);

  try {
    await axios.post(config.backendUrl, payload, {
      headers: {
        "x-api-key": config.apiKey,
      },
      timeout: 5000,
    });

    if (mode === "live") {
      console.log(
        `[LIVE] ${sensor.sensorId} ${payload.timestamp} ${payload.temperature.toFixed(1)}C ${payload.humidity.toFixed(1)}% ${payload.pressure.toFixed(1)}hPa RSSI ${payload.rssi}dBm`,
      );
    }
  } catch (error) {
    console.error(`[ERROR] ${sensor.sensorId}`, error instanceof Error ? error.message : error);
  }
}

async function loadExistingSimulatorIds() {
  try {
    const response = await axios.get<LatestSensorResponse>(resolveLatestMeasurementsUrl(config.backendUrl), {
      timeout: 10000,
    });

    return new Set(
      response.data
        .filter((sensor) => sensor.id.startsWith("sim-") && sensor.latestMeasurement)
        .map((sensor) => sensor.id),
    );
  } catch (error) {
    console.warn("[WARN] Nie udalo sie sprawdzic istniejacych danych symulatora, historia zostanie doslana ponownie.");
    return new Set<string>();
  }
}

async function backfillHistory() {
  if (config.skipHistory) {
    console.log("History backfill skipped.\n");
    return;
  }

  const existingSimulatorIds = await loadExistingSimulatorIds();
  const sensorsToBackfill = sensors.filter((sensor) => !existingSimulatorIds.has(sensor.sensorId));

  if (sensorsToBackfill.length === 0) {
    console.log("History already exists for current simulator sensors.\n");
    return;
  }

  const now = new Date();
  const timeline = buildHistoryTimeline(now);

  console.log(
    `Backfilling ${timeline.length} history points per sensor for ${sensorsToBackfill.length} sensors (${config.historyMonths} months, ${config.timezone}).`,
  );

  const progressStep = Math.max(1, Math.floor(timeline.length / 10));

  for (let index = 0; index < timeline.length; index += config.historyBatchSize) {
    const chunk = timeline.slice(index, index + config.historyBatchSize);
    await Promise.all(
      chunk.flatMap((timestamp) => sensorsToBackfill.map((sensor) => sendMeasurement(sensor, timestamp, "history"))),
    );

    if (index === 0 || index + config.historyBatchSize >= timeline.length || index % progressStep === 0) {
      const completed = Math.min(timeline.length, index + chunk.length);
      console.log(`History progress: ${completed}/${timeline.length} timestamps`);
    }
  }

  console.log("History backfill complete.\n");
}

console.log("\nWeather Station Simulator");
console.log(`Backend: ${config.backendUrl}`);
console.log(`Sensors: ${config.sensorCount}`);
console.log(`Interval: ${config.intervalMs} ms`);
console.log(`Timezone: ${config.timezone}`);
console.log(`History window: ${config.historyMonths} months\n`);

const runLiveTick = async () => {
  const now = new Date();
  await Promise.all(sensors.map((sensor) => sendMeasurement(sensor, now, "live")));
};

const start = async () => {
  await backfillHistory();
  await runLiveTick();

  setInterval(() => {
    void runLiveTick();
  }, config.intervalMs);
};

void start();
