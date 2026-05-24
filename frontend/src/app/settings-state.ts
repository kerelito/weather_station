import { createContext } from "react";
import type { DataMode } from "../lib/data-mode";

export type SettingsState = {
  theme: "dark" | "light";
  dataMode: DataMode;
  refreshInterval: number;
  temperatureUnit: "C" | "F";
  pressureUnit: "hPa" | "inHg";
  setTheme: (value: "dark" | "light") => void;
  setDataMode: (value: DataMode) => void;
  setRefreshInterval: (value: number) => void;
  setTemperatureUnit: (value: "C" | "F") => void;
  setPressureUnit: (value: "hPa" | "inHg") => void;
};

export const SettingsContext = createContext<SettingsState | null>(null);

export function readStorage<T>(key: string, fallback: T) {
  const value = localStorage.getItem(key);
  if (!value) return fallback;
  return JSON.parse(value) as T;
}
