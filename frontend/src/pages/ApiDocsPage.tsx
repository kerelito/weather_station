import { GlassPanel } from "../components/ui/GlassPanel";
import { SectionHeader } from "../components/ui/SectionHeader";

const endpoints = [
  ["POST /api/measurements", "Przyjmowanie danych z ESP32 lub symulatora przez API key."],
  ["GET /api/measurements/latest", "Najnowszy pomiar dla każdego czujnika."],
  ["GET /api/measurements", "Historia pomiarów z filtrowaniem po czasie, sensorze i interwale."],
  ["GET /api/sensors", "Lista urządzeń wraz z bieżącym statusem."],
  ["GET /api/sensors/:id", "Szczegóły pojedynczego sensora i jego statystyki."],
  ["PATCH /api/sensors/:id", "Aktualizacja nazwy, lokalizacji lub opisu sensora."],
  ["GET /api/stats", "Statystyki min/max/avg, trendy i anomalia."],
  ["GET /api/alerts/rules", "Lista reguł alertowych."],
  ["GET /api/alerts/events", "Historia wygenerowanych alertów."],
  ["GET /api/health", "Healthcheck backendu i bazy danych."],
];

const payload = `{
  "sensorId": "esp32-weather-01",
  "sensorName": "Stacja pogodowa ESP32",
  "sensorType": "weather-station",
  "temperature": 23.4,
  "humidity": 48.2,
  "pressure": 1013.7,
  "rssi": -57,
  "batteryVoltage": 3.9,
  "status": "ok",
  "firmwareVersion": "1.0.0"
}`;

export function ApiDocsPage() {
  return (
    <div className="space-y-8">
      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <GlassPanel className="p-6">
          <SectionHeader title="Endpointy" />
          <div className="space-y-3">
            {endpoints.map(([method, description]) => (
              <div key={method} className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
                <p className="font-mono text-sm font-semibold text-[color:var(--accent)]">{method}</p>
                <p className="mt-2 text-sm text-[var(--muted)]">{description}</p>
              </div>
            ))}
          </div>
        </GlassPanel>

        <GlassPanel className="p-6">
          <SectionHeader title="Payload z ESP32" />
          <pre className="overflow-x-auto rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-subtle)] p-5 text-sm text-[var(--text)]">
            <code>{payload}</code>
          </pre>
        </GlassPanel>
      </div>
    </div>
  );
}
