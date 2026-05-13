import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Table2 } from "lucide-react";
import { api } from "../api/client";
import { exportMeasurementsCsv } from "../lib/csv";
import { formatTimestamp } from "../lib/format";
import { EmptyState } from "../components/ui/EmptyState";
import { GlassPanel } from "../components/ui/GlassPanel";
import { SectionHeader } from "../components/ui/SectionHeader";

export function MeasurementsPage() {
  const [sensorId, setSensorId] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("newest");

  const sensorsQuery = useQuery({
    queryKey: ["sensors"],
    queryFn: api.getSensors,
  });

  const measurementsQuery = useQuery({
    queryKey: ["measurements", "table", sensorId, page],
    queryFn: () =>
      api.getMeasurements({
        sensorId: sensorId || undefined,
        interval: "raw",
        page,
        limit: 25,
      }),
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

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Data Table"
        title="Tabela pomiarów z filtrowaniem i eksportem CSV"
        description="Podgląd surowych odczytów wraz z paginacją gotową do analizy i eksportu."
      />

      <GlassPanel className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid gap-3 sm:grid-cols-2">
          <select
            value={sensorId}
            onChange={(event) => {
              setSensorId(event.target.value);
              setPage(1);
            }}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-[var(--text)]"
          >
            <option value="">Wszystkie czujniki</option>
            {(sensorsQuery.data ?? []).map((sensor) => (
              <option key={sensor.id} value={sensor.id}>
                {sensor.name}
              </option>
            ))}
          </select>
          <select value={sort} onChange={(event) => setSort(event.target.value)} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-[var(--text)]">
            <option value="newest">Najnowsze</option>
            <option value="temperature-desc">Najcieplej</option>
            <option value="temperature-asc">Najchłodniej</option>
            <option value="battery-asc">Najniższe napięcie</option>
          </select>
        </div>
        <button
          type="button"
          onClick={() => exportMeasurementsCsv(rows)}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-bold text-slate-950"
        >
          <Download size={16} />
          Eksportuj CSV
        </button>
      </GlassPanel>

      {rows.length === 0 ? (
        <EmptyState title="Brak pomiarów" description="Zmień filtry lub uruchom symulator danych." icon={<Table2 />} />
      ) : (
        <GlassPanel className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-white/5 text-[var(--muted)]">
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
                  <tr key={row.id} className="border-t border-white/8">
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
          <div className="flex items-center justify-between border-t border-white/8 px-5 py-4">
            <p className="text-sm text-[var(--muted)]">
              Strona {measurementsQuery.data?.meta.page ?? 1} z{" "}
              {Math.max(1, Math.ceil((measurementsQuery.data?.meta.total ?? 1) / (measurementsQuery.data?.meta.limit ?? 25)))}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold disabled:opacity-40"
              >
                Poprzednia
              </button>
              <button
                type="button"
                onClick={() => setPage((current) => current + 1)}
                className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold"
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
