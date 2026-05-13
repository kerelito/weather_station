import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Gauge, Thermometer, Waves, Wind } from "lucide-react";
import { api } from "../api/client";
import { useSettings } from "../app/settings-context";
import { ClimateChart } from "../components/charts/ClimateChart";
import { GlassPanel } from "../components/ui/GlassPanel";
import { MetricCard } from "../components/ui/MetricCard";
import { SectionHeader } from "../components/ui/SectionHeader";
import { StatusBadge } from "../components/ui/StatusBadge";
import { formatHumidity, formatPressure, formatRelative, formatTemperature } from "../lib/format";

export function DashboardPage() {
  const settings = useSettings();

  const latestQuery = useQuery({
    queryKey: ["latest"],
    queryFn: api.getLatestMeasurements,
    refetchInterval: settings.refreshInterval,
  });

  const statsQuery = useQuery({
    queryKey: ["stats", "24h"],
    queryFn: () => api.getStats({}),
    refetchInterval: settings.refreshInterval,
  });

  const chartQuery = useQuery({
    queryKey: ["measurements", "dashboard"],
    queryFn: () => api.getMeasurements({ interval: "1h", limit: 48 }),
    refetchInterval: settings.refreshInterval,
  });

  const highlights = useMemo(() => {
    const metrics = statsQuery.data?.metrics;
    return [
      {
        title: "Średnia temperatura",
        value: formatTemperature(metrics?.temperature?.avg, settings),
        subtitle: "Średnia z aktualnego okna analitycznego",
        icon: <Thermometer className="text-white" />,
        accent: "linear-gradient(135deg,#ff8a62,#ffb76f)",
        trend: metrics?.temperature?.trend,
      },
      {
        title: "Średnia wilgotność",
        value: formatHumidity(metrics?.humidity?.avg),
        subtitle: "Wilgotność ze wszystkich aktywnych odczytów",
        icon: <Waves className="text-white" />,
        accent: "linear-gradient(135deg,#49b6ff,#75d2ff)",
        trend: metrics?.humidity?.trend,
      },
      {
        title: "Ciśnienie",
        value: formatPressure(metrics?.pressure?.avg, settings),
        subtitle: "Stabilność ciśnienia atmosferycznego",
        icon: <Gauge className="text-white" />,
        accent: "linear-gradient(135deg,#5fd0aa,#77efcf)",
        trend: metrics?.pressure?.trend,
      },
      {
        title: "Aktywne sensory",
        value: `${statsQuery.data?.sensors.online ?? 0}/${statsQuery.data?.sensors.total ?? 0}`,
        subtitle: "Urządzenia aktualnie online",
        icon: <Wind className="text-white" />,
        accent: "linear-gradient(135deg,#8e92ff,#6cc8ff)",
      },
    ];
  }, [settings, statsQuery.data]);

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Overview"
        title="Centrum operacyjne stacji pogodowej"
        description="Szybki wgląd w bieżące warunki, aktywność sensorów i trendy z ostatniego okresu."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {highlights.map((card) => (
          <MetricCard key={card.title} {...card} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <GlassPanel className="p-6">
          <SectionHeader title="Krzywa temperatury" description="Ostatnie punkty pomiarowe w ujęciu godzinnym." />
          <ClimateChart
            data={(chartQuery.data?.data ?? []).map((item) => ({
              createdAt: item.createdAt,
              temperature: item.temperature,
            }))}
            series={[{ key: "temperature", label: "Temperatura", color: "#7bc7ff" }]}
          />
        </GlassPanel>

        <GlassPanel className="p-6">
          <SectionHeader title="Anomalie i stan systemu" description="Sygnalizacja sytuacji wymagających uwagi." />
          <div className="space-y-4">
            {(statsQuery.data?.anomalies ?? []).length === 0 ? (
              <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">
                Brak wykrytych anomalii. Wszystkie czujniki pracują w oczekiwanym zakresie.
              </div>
            ) : (
              statsQuery.data?.anomalies.map((anomaly) => (
                <div key={`${anomaly.sensorId}-${anomaly.metric}`} className="rounded-3xl border border-amber-400/20 bg-amber-400/10 p-4">
                  <p className="text-sm font-bold">{anomaly.metric}</p>
                  <p className="mt-2 text-sm text-[var(--muted)]">{anomaly.message}</p>
                </div>
              ))
            )}
            <div className="grid gap-3">
              {(latestQuery.data ?? []).slice(0, 4).map((sensor) => (
                <div key={sensor.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold">{sensor.name}</h3>
                      <p className="mt-1 text-sm text-[var(--muted)]">{sensor.location ?? "Brak lokalizacji"}</p>
                    </div>
                    <StatusBadge online={sensor.isOnline} />
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-[var(--muted)]">Temp.</p>
                      <p className="mt-1 font-bold">{formatTemperature(sensor.latestMeasurement?.temperature, settings)}</p>
                    </div>
                    <div>
                      <p className="text-[var(--muted)]">Wilg.</p>
                      <p className="mt-1 font-bold">{formatHumidity(sensor.latestMeasurement?.humidity)}</p>
                    </div>
                    <div>
                      <p className="text-[var(--muted)]">Ostatnio</p>
                      <p className="mt-1 font-bold">{formatRelative(sensor.lastSeenAt)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}
