import { useQuery } from "@tanstack/react-query";
import { BatteryCharging, MapPin, RadioTower, Thermometer } from "lucide-react";
import { useParams } from "react-router-dom";
import { api } from "../api/client";
import { useSettings } from "../app/settings-context";
import { ClimateChart } from "../components/charts/ClimateChart";
import { GlassPanel } from "../components/ui/GlassPanel";
import { MetricCard } from "../components/ui/MetricCard";
import { SectionHeader } from "../components/ui/SectionHeader";
import { StatusBadge } from "../components/ui/StatusBadge";
import { formatHumidity, formatPressure, formatRelative, formatRssi, formatTemperature, formatVoltage } from "../lib/format";

export function SensorDetailPage() {
  const { id = "" } = useParams();
  const settings = useSettings();

  const sensorQuery = useQuery({
    queryKey: ["sensor", id],
    queryFn: () => api.getSensor(id),
    enabled: Boolean(id),
  });

  const measurementsQuery = useQuery({
    queryKey: ["measurements", "sensor-detail", id],
    queryFn: () => api.getMeasurements({ sensorId: id, interval: "1h", limit: 240 }),
    enabled: Boolean(id),
  });

  const sensor = sensorQuery.data;

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Sensor"
        title={sensor?.name ?? "Szczegóły czujnika"}
        description={sensor?.description ?? "Podgląd stanu, historii i jakości połączenia dla pojedynczego urządzenia."}
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
          icon={<Thermometer className="text-white" />}
          accent="linear-gradient(135deg,#ff8a62,#ffb76f)"
          trend={sensor?.stats?.temperature?.trend}
        />
        <MetricCard
          title="Wilgotność"
          value={formatHumidity(sensor?.latestMeasurement?.humidity)}
          subtitle="Aktualny odczyt"
          icon={<BatteryCharging className="text-white" />}
          accent="linear-gradient(135deg,#49b6ff,#75d2ff)"
          trend={sensor?.stats?.humidity?.trend}
        />
        <MetricCard
          title="Ciśnienie"
          value={formatPressure(sensor?.latestMeasurement?.pressure, settings)}
          subtitle="Aktualny odczyt"
          icon={<RadioTower className="text-white" />}
          accent="linear-gradient(135deg,#5fd0aa,#77efcf)"
          trend={sensor?.stats?.pressure?.trend}
        />
      </div>

      <GlassPanel className="p-6">
        <SectionHeader title="Historia sensora" description="Wykres godzinowy dla wybranego urządzenia." />
        <ClimateChart
          data={(measurementsQuery.data?.data ?? []).map((item) => ({
            createdAt: item.createdAt,
            temperature: item.temperature,
          }))}
          series={[{ key: "temperature", label: "Temperatura", color: "#7bc7ff" }]}
        />
      </GlassPanel>
    </div>
  );
}
