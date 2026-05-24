import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Table2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "../api/client";
import { exportMeasurementsCsv } from "../lib/csv";
import { formatTimestamp } from "../lib/format";
import { EmptyState } from "../components/ui/EmptyState";
import { GlassPanel } from "../components/ui/GlassPanel";
import { useModeSensors } from "../hooks/useModeSensors";

export function MeasurementsPage() {
  const queryClient = useQueryClient();
  const { dataMode, sensorIdFilter, sensorIds, sensors } = useModeSensors();
  const [sensorId, setSensorId] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("newest");

  const activeSensorId = sensorId && sensorIds.includes(sensorId) ? sensorId : "";
  const activeSensorFilter = activeSensorId || sensorIdFilter;

  const measurementsQuery = useQuery({
    queryKey: ["measurements", "table", activeSensorFilter, page],
    queryFn: () =>
      api.getMeasurements({
        sensorId: activeSensorFilter || undefined,
        interval: "raw",
        page,
        limit: 25,
      }),
    enabled: Boolean(activeSensorFilter),
  });

  const clearMeasurementsMutation = useMutation({
    mutationFn: (targetSensorIds: string[]) =>
      api.clearMeasurements({
        sensorId: targetSensorIds.join(","),
      }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["measurements"] });
      queryClient.invalidateQueries({ queryKey: ["latest"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      queryClient.invalidateQueries({ queryKey: ["sensors"] });
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      setPage(1);
      toast.success(`Usunięto ${result.deletedMeasurements} pomiarów.`);
    },
  });

  const rows = useMemo(() => {
    const base = [...(measurementsQuery.data?.data ?? [])];
    if (sort === "temperature-desc") {
      return base.sort((left, right) => right.temperature - left.temperature);
    }
    if (sort === "temperature-asc") {
      return base.sort((left, right) => left.temperature - right.temperature);
    }
    if (sort === "battery-asc") {
      return base.sort((left, right) => (left.batteryVoltage ?? 999) - (right.batteryVoltage ?? 999));
    }
    return base.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }, [measurementsQuery.data, sort]);

  const clearTargetSensorIds = activeSensorId ? [activeSensorId] : sensorIds;
  const clearTargetLabel = activeSensorId
    ? sensors.find((sensor) => sensor.id === activeSensorId)?.name ?? activeSensorId
    : dataMode === "demo"
      ? "wszystkie dane demo"
      : "wszystkie dane z aktualnego trybu";

  const handleClearMeasurements = () => {
    if (clearTargetSensorIds.length === 0) {
      return;
    }

    if (!window.confirm(`Usunąć ${clearTargetLabel}?`)) {
      return;
    }

    clearMeasurementsMutation.mutate(clearTargetSensorIds);
  };

  return (
    <div className="space-y-8">
      <GlassPanel className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid gap-3 sm:grid-cols-2">
          <select
            value={activeSensorId}
            onChange={(event) => {
              setSensorId(event.target.value);
              setPage(1);
            }}
            className="border px-4 py-3 text-sm text-[var(--text)]"
          >
            <option value="">Wszystkie czujniki</option>
            {sensors.map((sensor) => (
              <option key={sensor.id} value={sensor.id}>
                {sensor.name}
              </option>
            ))}
          </select>
          <select value={sort} onChange={(event) => setSort(event.target.value)} className="border px-4 py-3 text-sm text-[var(--text)]">
            <option value="newest">Najnowsze</option>
            <option value="temperature-desc">Najcieplej</option>
            <option value="temperature-asc">Najchłodniej</option>
            <option value="battery-asc">Najniższe napięcie</option>
          </select>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleClearMeasurements}
            disabled={clearTargetSensorIds.length === 0 || clearMeasurementsMutation.isPending}
            className="inline-flex items-center gap-2 rounded-lg border border-[color:var(--danger)]/40 bg-[color:var(--surface)] px-4 py-3 text-sm font-medium text-[color:var(--danger)] transition hover:bg-[color:var(--surface-subtle)] disabled:opacity-50"
          >
            <Trash2 size={16} />
            Wyczyść dane
          </button>
          <button
            type="button"
            onClick={() => exportMeasurementsCsv(rows)}
            className="inline-flex items-center gap-2 rounded-lg border border-[color:var(--accent)] bg-[color:var(--accent)] px-4 py-3 text-sm font-medium text-[color:var(--bg)] transition hover:opacity-90"
          >
            <Download size={16} />
            Eksportuj CSV
          </button>
        </div>
      </GlassPanel>

      {rows.length === 0 ? (
        <EmptyState
          title="Brak pomiarów"
          description={
            dataMode === "demo"
              ? "Uruchom symulator albo poczekaj na kolejne próbki w trybie demonstracyjnym."
              : "Sprawdź połączenie z fizycznymi czujnikami lub zmień filtr widoku."
          }
          icon={<Table2 />}
        />
      ) : (
        <GlassPanel className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[color:var(--surface-subtle)] text-[var(--muted)]">
                <tr>
                  {["Sensor", "Temperatura", "Wilgotność", "Ciśnienie", "RSSI", "Napięcie", "Czas"].map((heading) => (
                    <th key={heading} className="px-5 py-4 font-semibold">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-[color:var(--border)]">
                    <td className="px-5 py-4">
                      <p className="font-bold">{row.sensorName}</p>
                      <p className="text-xs text-[var(--muted)]">{row.sensorId}</p>
                    </td>
                    <td className="px-5 py-4">{row.temperature.toFixed(1)} °C</td>
                    <td className="px-5 py-4">{row.humidity.toFixed(1)} %</td>
                    <td className="px-5 py-4">{row.pressure.toFixed(1)} hPa</td>
                    <td className="px-5 py-4">{row.rssi ?? "n/d"}</td>
                    <td className="px-5 py-4">{row.batteryVoltage?.toFixed(2) ?? "n/d"} V</td>
                    <td className="px-5 py-4">{formatTimestamp(row.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-[color:var(--border)] px-5 py-4">
            <p className="text-sm text-[var(--muted)]">
              Strona {measurementsQuery.data?.meta.page ?? 1} z{" "}
              {Math.max(1, Math.ceil((measurementsQuery.data?.meta.total ?? 1) / (measurementsQuery.data?.meta.limit ?? 25)))}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="rounded-lg border border-[color:var(--border)] px-4 py-2 text-sm font-medium transition hover:bg-[color:var(--surface-subtle)] disabled:opacity-40"
              >
                Poprzednia
              </button>
              <button
                type="button"
                onClick={() => setPage((current) => current + 1)}
                className="rounded-lg border border-[color:var(--border)] px-4 py-2 text-sm font-medium transition hover:bg-[color:var(--surface-subtle)]"
              >
                Następna
              </button>
            </div>
          </div>
        </GlassPanel>
      )}
    </div>
  );
}
