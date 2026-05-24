import { useQuery } from "@tanstack/react-query";
import { BatteryCharging, Gauge, MapPin, RadioTower, Thermometer, Waves } from "lucide-react";
import { useParams } from "react-router-dom";
import { api } from "../api/client";
import { useSettings } from "../app/use-settings";
import { ClimateChart } from "../components/charts/ClimateChart";
import { EmptyState } from "../components/ui/EmptyState";
import { GlassPanel } from "../components/ui/GlassPanel";
import { MetricCard } from "../components/ui/MetricCard";
import { SectionHeader } from "../components/ui/SectionHeader";
import { StatusBadge } from "../components/ui/StatusBadge";
import { matchesSensorIdToMode } from "../lib/data-mode";
import { formatHumidity, formatPressure, formatRelative, formatRssi, formatTemperature, formatVoltage } from "../lib/format";

export function SensorDetailPage() {
  const { id = "" } = useParams();
  const settings = useSettings();
  const sensorMatchesMode = Boolean(id) && matchesSensorIdToMode(id, settings.dataMode);

  const sensorQuery = useQuery({
    queryKey: ["sensor", id, settings.dataMode],
    queryFn: () => api.getSensor(id),
    enabled: sensorMatchesMode,
  });

  const measurementsQuery = useQuery({
    queryKey: ["measurements", "sensor-detail", id, settings.dataMode],
    queryFn: () => api.getMeasurements({ sensorId: id, interval: "1h", limit: 240 }),
    enabled: sensorMatchesMode,
  });

  const sensor = sensorQuery.data;

  if (!sensorMatchesMode) {
    return (
      <div className="space-y-8">
      <SectionHeader
        title="Szczegóły czujnika"
        description="Widok pojedynczego urządzenia jest dostępny tylko dla sensorów z aktywnego trybu danych."
      />
        <EmptyState
          title="Czujnik nie należy do tego trybu"
          description="Przełącz demo lub wróć do listy urządzeń z aktualnie wybranego źródła danych."
          icon={<Thermometer />}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        title={sensor?.name ?? "Szczegóły czujnika"}
        description={sensor?.description ?? undefined}
      />

      <GlassPanel className="flex flex-col gap-5 p-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <StatusBadge online={sensor?.isOnline ?? false} />
            <span className="text-sm text-[var(--muted)]">Ostatni kontakt {formatRelative(sensor?.lastSeenAt)}</span>
          </div>
          <div className="mt-4 flex flex-wrap gap-6 text-sm">
            <span className="inline-flex items-center gap-2 text-[var(--muted)]"><MapPin size={15} /> {sensor?.location ?? "Brak lokalizacji"}</span>
            <span className="inline-flex items-center gap-2 text-[var(--muted)]"><RadioTower size={15} /> {formatRssi(sensor?.latestMeasurement?.rssi)}</span>
            <span className="inline-flex items-center gap-2 text-[var(--muted)]"><BatteryCharging size={15} /> {formatVoltage(sensor?.latestMeasurement?.batteryVoltage)}</span>
          </div>
        </div>
      </GlassPanel>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="Temperatura"
          value={formatTemperature(sensor?.latestMeasurement?.temperature, settings)}
          subtitle="Aktualny odczyt"
          icon={<Thermometer size={18} />}
          accent="var(--temp)"
          trend={sensor?.stats?.temperature?.trend}
        />
        <MetricCard
          title="Wilgotność"
          value={formatHumidity(sensor?.latestMeasurement?.humidity)}
          subtitle="Aktualny odczyt"
          icon={<Waves size={18} />}
          accent="var(--humidity)"
          trend={sensor?.stats?.humidity?.trend}
        />
        <MetricCard
          title="Ciśnienie"
          value={formatPressure(sensor?.latestMeasurement?.pressure, settings)}
          subtitle="Aktualny odczyt"
          icon={<Gauge size={18} />}
          accent="var(--pressure)"
          trend={sensor?.stats?.pressure?.trend}
        />
      </div>

      <GlassPanel className="p-6">
        <SectionHeader title="Historia" />
        <ClimateChart
          data={(measurementsQuery.data?.data ?? []).map((item) => ({
            createdAt: item.createdAt,
            temperature: item.temperature,
          }))}
          series={[{ key: "temperature", label: "Temperatura", color: "var(--temp)" }]}
        />
      </GlassPanel>
    </div>
  );
}
