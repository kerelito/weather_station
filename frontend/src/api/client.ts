import type {
  AlertEvent,
  AlertRule,
  HealthResponse,
  MeasurementResponse,
  Sensor,
  StatsResponse,
} from "../types/domain";

const API_URL = import.meta.env.VITE_API_URL ?? "/api";

type QueryValue = string | number | undefined | null;

function buildQuery(params: Record<string, QueryValue>) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value == null || value === "") continue;
    searchParams.set(key, String(value));
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed." }));
    throw new Error(error.message ?? "Request failed.");
  }

  return response.json() as Promise<T>;
}

export const api = {
  getHealth: () => request<HealthResponse>("/health"),
  getSensors: () => request<Sensor[]>("/sensors"),
  getSensor: (id: string) => request<Sensor>(`/sensors/${id}`),
  updateSensor: (id: string, body: Partial<Sensor>) =>
    request<Sensor>(`/sensors/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  getLatestMeasurements: () => request<Sensor[]>("/measurements/latest"),
  getMeasurements: (params: Record<string, QueryValue>) =>
    request<MeasurementResponse>(`/measurements${buildQuery(params)}`),
  getStats: (params: Record<string, QueryValue>) => request<StatsResponse>(`/stats${buildQuery(params)}`),
  getAlertRules: () => request<AlertRule[]>("/alerts/rules"),
  createAlertRule: (body: Partial<AlertRule>) =>
    request<AlertRule>("/alerts/rules", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateAlertRule: (id: string, body: Partial<AlertRule>) =>
    request<AlertRule>(`/alerts/rules/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  getAlertEvents: (params: Record<string, QueryValue>) =>
    request<AlertEvent[]>(`/alerts/events${buildQuery(params)}`),
  acknowledgeAlert: (id: string) =>
    request<AlertEvent>(`/alerts/events/${id}/acknowledge`, {
      method: "PATCH",
    }),
};
