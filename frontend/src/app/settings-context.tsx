import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type SettingsState = {
  theme: "dark" | "light";
  refreshInterval: number;
  temperatureUnit: "C" | "F";
  pressureUnit: "hPa" | "inHg";
  setTheme: (value: "dark" | "light") => void;
  setRefreshInterval: (value: number) => void;
  setTemperatureUnit: (value: "C" | "F") => void;
  setPressureUnit: (value: "hPa" | "inHg") => void;
};

const SettingsContext = createContext<SettingsState | null>(null);

function readStorage<T>(key: string, fallback: T) {
  const value = localStorage.getItem(key);
  if (!value) return fallback;
  return JSON.parse(value) as T;
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<"dark" | "light">(() => readStorage("theme", "dark"));
  const [refreshInterval, setRefreshInterval] = useState<number>(() => readStorage("refreshInterval", 30000));
  const [temperatureUnit, setTemperatureUnit] = useState<"C" | "F">(() => readStorage("temperatureUnit", "C"));
  const [pressureUnit, setPressureUnit] = useState<"hPa" | "inHg">(() => readStorage("pressureUnit", "hPa"));

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("theme", JSON.stringify(theme));
  }, [theme]);

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
      refreshInterval,
      temperatureUnit,
      pressureUnit,
      setTheme,
      setRefreshInterval,
      setTemperatureUnit,
      setPressureUnit,
    }),
    [pressureUnit, refreshInterval, temperatureUnit, theme],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const context = useContext(SettingsContext);

  if (!context) {
    throw new Error("useSettings must be used within SettingsProvider");
  }

  return context;
}
