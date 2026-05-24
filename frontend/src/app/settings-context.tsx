import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { DataMode } from "../lib/data-mode";
import { SettingsContext, readStorage } from "./settings-state";

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<"dark" | "light">(() => readStorage("theme", "light"));
  const [dataMode, setDataMode] = useState<DataMode>(() => readStorage("dataMode", "real"));
  const [refreshInterval, setRefreshInterval] = useState<number>(() => readStorage("refreshInterval", 30000));
  const [temperatureUnit, setTemperatureUnit] = useState<"C" | "F">(() => readStorage("temperatureUnit", "C"));
  const [pressureUnit, setPressureUnit] = useState<"hPa" | "inHg">(() => readStorage("pressureUnit", "hPa"));

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("theme", JSON.stringify(theme));
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("dataMode", JSON.stringify(dataMode));
  }, [dataMode]);

  useEffect(() => {
    localStorage.setItem("refreshInterval", JSON.stringify(refreshInterval));
  }, [refreshInterval]);

  useEffect(() => {
    localStorage.setItem("temperatureUnit", JSON.stringify(temperatureUnit));
  }, [temperatureUnit]);

  useEffect(() => {
    localStorage.setItem("pressureUnit", JSON.stringify(pressureUnit));
  }, [pressureUnit]);

  const value = useMemo(
    () => ({
      theme,
      dataMode,
      refreshInterval,
      temperatureUnit,
      pressureUnit,
      setTheme,
      setDataMode,
      setRefreshInterval,
      setTemperatureUnit,
      setPressureUnit,
    }),
    [dataMode, pressureUnit, refreshInterval, temperatureUnit, theme],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}
