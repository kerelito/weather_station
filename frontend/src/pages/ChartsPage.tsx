import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import { ClimateChart } from "../components/charts/ClimateChart";
import { GlassPanel } from "../components/ui/GlassPanel";
import { RangeTabs } from "../components/ui/RangeTabs";
import { SectionHeader } from "../components/ui/SectionHeader";

const ranges = [
  { label: "1h", value: "1h" },
  { label: "24h", value: "24h" },
  { label: "7 dni", value: "7d" },
  { label: "30 dni", value: "30d" },
  { label: "Własny", value: "custom" },
];

function resolveRange(range: string, customFrom: string, customTo: string) {
  const to = customTo ? new Date(customTo) : new Date();
  const from = customFrom ? new Date(customFrom) : new Date(to);
  if (range === "1h") from.setHours(to.getHours() - 1);
  if (range === "24h") from.setHours(to.getHours() - 24);
  if (range === "7d") from.setDate(to.getDate() - 7);
  if (range === "30d") from.setDate(to.getDate() - 30);
  return { from: from.toISOString(), to: to.toISOString(), interval: range === "30d" ? "6h" : range === "7d" ? "1h" : "15m" };
}

export function ChartsPage() {
  const [range, setRange] = useState("24h");
  const [selectedSensors, setSelectedSensors] = useState<string[]>([]);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const sensorsQuery = useQuery({
    queryKey: ["sensors"],
    queryFn: api.getSensors,
  });

  const params = useMemo(() => {
    const resolved = resolveRange(range, customFrom, customTo);
    return {
      ...resolved,
      sensorId: selectedSensors.length > 0 ? selectedSensors.join(",") : undefined,
      limit: 600,
    };
  }, [customFrom, customTo, range, selectedSensors]);

  const measurementsQuery = useQuery({
    queryKey: ["measurements", "charts", params],
    queryFn: () => api.getMeasurements(params),
  });

  const palette = ["#7bc7ff", "#58d5b3", "#ff9d76"];

  const seriesData = useMemo(() => {
    const rows = measurementsQuery.data?.data ?? [];
    const selected = selectedSensors.length > 0
      ? (sensorsQuery.data ?? []).filter((sensor) => selectedSensors.includes(sensor.id))
      : (sensorsQuery.data ?? []).slice(0, 3);

    const byTimestamp = new Map<string, Record<string, string | number>>();
    for (const row of rows) {
      const key = row.createdAt;
      const current = byTimestamp.get(key) ?? { createdAt: row.createdAt };
      current[`${row.sensorId}-temperature`] = row.temperature;
      current[`${row.sensorId}-humidity`] = row.humidity;
      current[`${row.sensorId}-pressure`] = row.pressure;
      byTimestamp.set(key, current);
    }

    return {
      data: [...byTimestamp.values()],
      series: selected.map((sensor, index) => ({
        sensorId: sensor.id,
        label: sensor.name,
        color: palette[index % palette.length],
      })),
    };
  }, [measurementsQuery.data, selectedSensors, sensorsQuery.data]);

  const toggleSensor = (sensorId: string) => {
    setSelectedSensors((current) =>
      current.includes(sensorId) ? current.filter((value) => value !== sensorId) : [...current.slice(-2), sensorId],
    );
  };

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Analytics"
        title="Wykresy historyczne i porównawcze"
        description="Zmieniaj zakres czasu i skupiaj się na pojedynczym sensorze lub całej sieci urządzeń."
      />

      <GlassPanel className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
        <RangeTabs value={range} onChange={setRange} options={ranges} />
        <div className="flex flex-wrap gap-2">
          {(sensorsQuery.data ?? []).slice(0, 6).map((sensor) => (
            <button
              key={sensor.id}
              type="button"
              onClick={() => toggleSensor(sensor.id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${selectedSensors.includes(sensor.id) ? "bg-[var(--accent)] text-slate-950" : "border border-white/10 bg-white/5 text-[var(--muted)]"}`}
            >
              {sensor.name}
            </button>
          ))}
        </div>
      </GlassPanel>

      {range === "custom" ? (
        <GlassPanel className="grid gap-4 p-5 md:grid-cols-2">
          <input type="datetime-local" value={customFrom} onChange={(event) => setCustomFrom(event.target.value)} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm" />
          <input type="datetime-local" value={customTo} onChange={(event) => setCustomTo(event.target.value)} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm" />
        </GlassPanel>
      ) : null}

      <GlassPanel className="p-5">
        <p className="text-sm text-[var(--muted)]">Porównanie: wybierz do 3 czujników. Bez wyboru dashboard pokaże pierwsze trzy sensory.</p>
      </GlassPanel>

      <div className="grid gap-6">
        <GlassPanel className="p-6">
          <SectionHeader title="Temperatura" description="Trend zmian temperatury w czasie." />
          <ClimateChart
            data={seriesData.data}
            series={seriesData.series.map((item) => ({
              key: `${item.sensorId}-temperature`,
              label: item.label,
              color: item.color,
            }))}
          />
        </GlassPanel>
        <GlassPanel className="p-6">
          <SectionHeader title="Wilgotność" description="Zmiany wilgotności względnej dla wybranego zakresu." />
          <ClimateChart
            data={seriesData.data}
            series={seriesData.series.map((item) => ({
              key: `${item.sensorId}-humidity`,
              label: item.label,
              color: item.color,
            }))}
          />
        </GlassPanel>
        <GlassPanel className="p-6">
          <SectionHeader title="Ciśnienie" description="Historia ciśnienia i odchyleń barometrycznych." />
          <ClimateChart
            data={seriesData.data}
            series={seriesData.series.map((item) => ({
              key: `${item.sensorId}-pressure`,
              label: item.label,
              color: item.color,
            }))}
          />
        </GlassPanel>
      </div>
    </div>
  );
}
