import { format, formatDistanceToNow, parseISO } from "date-fns";

type UnitSettings = {
  temperatureUnit: "C" | "F";
  pressureUnit: "hPa" | "inHg";
};

export const metricLabels: Record<string, string> = {
  temperature: "Temperatura",
  humidity: "Wilgotność",
  pressure: "Ciśnienie",
  batteryVoltage: "Napięcie",
  rssi: "RSSI",
};

export function formatTemperature(value: number | null | undefined, settings: UnitSettings) {
  if (value == null) return "n/d";
  if (settings.temperatureUnit === "F") {
    return `${((value * 9) / 5 + 32).toFixed(1)} °F`;
  }
  return `${value.toFixed(1)} °C`;
}

export function formatHumidity(value: number | null | undefined) {
  return value == null ? "n/d" : `${value.toFixed(1)} %`;
}

export function formatPressure(value: number | null | undefined, settings: UnitSettings) {
  if (value == null) return "n/d";
  if (settings.pressureUnit === "inHg") {
    return `${(value * 0.02953).toFixed(2)} inHg`;
  }
  return `${value.toFixed(1)} hPa`;
}

export function formatVoltage(value: number | null | undefined) {
  return value == null ? "n/d" : `${value.toFixed(2)} V`;
}

export function formatRssi(value: number | null | undefined) {
  return value == null ? "n/d" : `${value} dBm`;
}

export function formatTimestamp(value: string) {
  return format(parseISO(value), "dd.MM.yyyy HH:mm");
}

export function formatRelative(value?: string | null) {
  if (!value) return "brak danych";
  return formatDistanceToNow(parseISO(value), { addSuffix: true });
}

export function formatTrend(value?: { direction: string; delta: number; percentage: number }) {
  if (!value) {
    return "Brak trendu";
  }

  const sign = value.direction === "up" ? "+" : value.direction === "down" ? "" : "";
  return `${sign}${value.delta.toFixed(2)} (${sign}${value.percentage.toFixed(1)}%)`;
}

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}
