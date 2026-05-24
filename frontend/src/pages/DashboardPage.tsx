import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Gauge, RadioTower, Thermometer, Trash2, Waves, Wind } from "lucide-react";
import { toast } from "sonner";
import { api } from "../api/client";
import { useSettings } from "../app/use-settings";
import { EmptyState } from "../components/ui/EmptyState";
import { GlassPanel } from "../components/ui/GlassPanel";
import { MetricCard } from "../components/ui/MetricCard";
import { SectionHeader } from "../components/ui/SectionHeader";
import { StatusBadge } from "../components/ui/StatusBadge";
import { useModeSensors } from "../hooks/useModeSensors";
import { filterSensorsByMode } from "../lib/data-mode";
import { formatHumidity, formatPressure, formatRelative, formatTemperature } from "../lib/format";

export function DashboardPage() {
  const queryClient = useQueryClient();
  const settings = useSettings();
  const { dataMode, sensorIdFilter, sensorIds, sensors } = useModeSensors();

  const latestQuery = useQuery({
    queryKey: ["latest", dataMode],
    queryFn: api.getLatestMeasurements,
    refetchInterval: settings.refreshInterval,
  });

  const statsQuery = useQuery({
    queryKey: ["stats", "24h", dataMode, sensorIdFilter],
    queryFn: () => api.getStats({ sensorId: sensorIdFilter }),
    enabled: sensorIds.length > 0,
    refetchInterval: settings.refreshInterval,
  });

  const deleteSensorMutation = useMutation({
    mutationFn: api.deleteSensor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sensors"] });
      queryClient.invalidateQueries({ queryKey: ["latest"] });
      queryClient.invalidateQueries({ queryKey: ["measurements"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      toast.success("Czujnik usunięty.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Nie udało się usunąć czujnika.");
    },
  });

  const latestSensors = useMemo(
    () => filterSensorsByMode(latestQuery.data ?? [], dataMode),
    [dataMode, latestQuery.data],
  );

  const currentConditions = useMemo(() => {
    const latestMeasurements = latestSensors
      .map((sensor) => sensor.latestMeasurement)
      .filter((measurement): measurement is NonNullable<(typeof latestSensors)[number]["latestMeasurement"]> => Boolean(measurement));

    if (latestMeasurements.length === 0) {
      return null;
    }

    const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
    const lastSeenAt = latestSensors
      .map((sensor) => sensor.lastSeenAt)
      .filter((value): value is string => Boolean(value))
      .sort()
      .at(-1);

    return {
      temperature: average(latestMeasurements.map((measurement) => measurement.temperature)),
      humidity: average(latestMeasurements.map((measurement) => measurement.humidity)),
      pressure: average(latestMeasurements.map((measurement) => measurement.pressure)),
      sensors: latestMeasurements.length,
      lastSeenAt: lastSeenAt ?? null,
    };
  }, [latestSensors]);

  const highlights = useMemo(() => {
    const metrics = statsQuery.data?.metrics;
    return [
      {
        title: "Temp. 24h",
        value: formatTemperature(metrics?.temperature?.avg, settings),
        icon: <Thermometer size={18} />,
        accent: "var(--temp)",
        trend: metrics?.temperature?.trend,
        trendLabel: "vs poprzednie 24h",
      },
      {
        title: "Wilg. 24h",
        value: formatHumidity(metrics?.humidity?.avg),
        icon: <Waves size={18} />,
        accent: "var(--humidity)",
        trend: metrics?.humidity?.trend,
        trendLabel: "vs poprzednie 24h",
      },
      {
        title: "Aktywne",
        value: `${statsQuery.data?.sensors.online ?? 0}/${statsQuery.data?.sensors.total ?? sensors.length}`,
        subtitle: "czujniki online",
        icon: <Wind size={18} />,
        accent: "var(--accent)",
      },
      {
        title: "Ciśn. 24h",
        value: formatPressure(metrics?.pressure?.avg, settings),
        icon: <Gauge size={18} />,
        accent: "var(--pressure)",
        trend: metrics?.pressure?.trend,
        trendLabel: "vs poprzednie 24h",
      },
    ];
  }, [sensors.length, settings, statsQuery.data]);

  const handleDeleteSensor = (sensorId: string, sensorName: string) => {
    if (!window.confirm(`Usunąć czujnik "${sensorName}" razem z jego historią pomiarów?`)) {
      return;
    }

    deleteSensorMutation.mutate(sensorId);
  };

  if (!latestQuery.isLoading && sensors.length === 0) {
    return (
      <div className="space-y-8">
        <EmptyState
          title={dataMode === "demo" ? "Brak sensorów demo" : "Brak realnych sensorów"}
          description={
            dataMode === "demo"
              ? "Włącz symulator, aby zobaczyć wersję demonstracyjną dashboardu."
              : "Po pojawieniu się odczytów z fizycznych czujników dashboard automatycznie pokaże ich dane."
          }
          icon={<RadioTower />}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <GlassPanel className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-[var(--muted)]">Aktualne warunki</p>
              <h3 className="mt-4 text-6xl font-semibold tracking-normal sm:text-7xl">{formatTemperature(currentConditions?.temperature, settings)}</h3>
              <p className="mt-3 text-sm text-[var(--muted)]">
                {currentConditions?.lastSeenAt ? `Ostatni odczyt ${formatRelative(currentConditions.lastSeenAt)}` : "Brak świeżych danych"}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-subtle)] text-[color:var(--temp)]">
              <Thermometer size={20} />
            </div>
          </div>
          <div className="mt-8 grid grid-cols-3 divide-x divide-[color:var(--border)] border-t border-[color:var(--border)] pt-5 text-sm">
            <div className="pr-4">
              <p className="text-[var(--muted)]">Wilg.</p>
              <p className="mt-1 text-lg font-semibold">{formatHumidity(currentConditions?.humidity)}</p>
            </div>
            <div className="px-4">
              <p className="text-[var(--muted)]">Ciśn.</p>
              <p className="mt-1 text-lg font-semibold">{formatPressure(currentConditions?.pressure, settings)}</p>
            </div>
            <div className="pl-4">
              <p className="text-[var(--muted)]">Czujniki</p>
              <p className="mt-1 text-lg font-semibold">{currentConditions?.sensors ?? 0}</p>
            </div>
          </div>
        </GlassPanel>
        <div className="grid gap-4 sm:grid-cols-2">
          {highlights.map((card) => (
            <MetricCard key={card.title} {...card} />
          ))}
        </div>
      </div>

      <GlassPanel className="p-6 lg:p-7">
        <SectionHeader title="Czujniki" />
        <div className="space-y-5">
          {(statsQuery.data?.anomalies ?? []).length === 0 ? (
            null
          ) : (
            statsQuery.data?.anomalies.map((anomaly) => (
              <div key={`${anomaly.sensorId}-${anomaly.metric}`} className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-subtle)] p-4">
                <p className="text-sm font-semibold">{anomaly.metric}</p>
                <p className="mt-2 text-sm text-[var(--muted)]">{anomaly.message}</p>
              </div>
            ))
          )}
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {latestSensors.map((sensor) => (
              <div key={sensor.id} className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{sensor.name}</h3>
                    <p className="mt-1 text-sm text-[var(--muted)]">{sensor.location ?? "Brak lokalizacji"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge online={sensor.isOnline} />
                    <button
                      type="button"
                      onClick={() => handleDeleteSensor(sensor.id, sensor.name)}
                      disabled={deleteSensorMutation.isPending}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[color:var(--border)] text-[var(--muted)] transition hover:border-[color:var(--danger)] hover:text-[var(--danger)] disabled:opacity-50"
                      aria-label={`Usuń ${sensor.name}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
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
  );
}
