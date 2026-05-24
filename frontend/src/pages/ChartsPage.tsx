import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  addDays,
  addMonths,
  addWeeks,
  format,
  getDay,
  parseISO,
  subDays,
  subMonths,
  subWeeks,
} from "date-fns";
import { pl } from "date-fns/locale";
import { CalendarDays, ChevronLeft, ChevronRight, LineChart, RotateCcw } from "lucide-react";
import { api } from "../api/client";
import { useSettings } from "../app/use-settings";
import { DailySensorChart } from "../components/charts/DailySensorChart";
import { EmptyState } from "../components/ui/EmptyState";
import { GlassPanel } from "../components/ui/GlassPanel";
import { RangeTabs } from "../components/ui/RangeTabs";
import { SectionHeader } from "../components/ui/SectionHeader";
import { useModeSensors } from "../hooks/useModeSensors";
import {
  getDaySummary,
  getMonthSummaries,
  getPeriodRange,
  getWeekSummaries,
  isFutureDay,
  sensorMetrics,
  type DailyMetricSummary,
  type DailySensorSummary,
  type SensorMetric,
} from "../lib/sensor-aggregation";
import { cx, formatHumidity, formatPressure, formatTemperature } from "../lib/format";

type ViewMode = "day" | "week" | "month";

const viewOptions: Array<{ label: string; value: ViewMode }> = [
  { label: "Day", value: "day" },
  { label: "Week", value: "week" },
  { label: "Month", value: "month" },
];

const metricOptions: Array<{ label: string; value: SensorMetric }> = [
  { label: "Temperatura", value: "temperature" },
  { label: "Wilgotność", value: "humidity" },
  { label: "Ciśnienie", value: "pressure" },
];

const weekdayLabels = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Nd"];

function getInterval(view: ViewMode, mode: string) {
  if (view === "day") return mode === "demo" ? "5m" : "15m";
  if (view === "week") return "1h";
  return "6h";
}

function formatPeriodLabel(view: ViewMode, date: Date) {
  if (view === "day") return format(date, "d MMMM yyyy", { locale: pl });

  if (view === "week") {
    const { from, to } = getPeriodRange("week", date);
    const end = subDays(to, 1);
    return `${format(from, "d MMM", { locale: pl })} - ${format(end, "d MMM yyyy", { locale: pl })}`;
  }

  return format(date, "LLLL yyyy", { locale: pl });
}

function formatMetricValue(metric: "temperature" | "humidity" | "pressure", value: number | null, settings: ReturnType<typeof useSettings>) {
  if (metric === "temperature") return formatTemperature(value, settings);
  if (metric === "humidity") return formatHumidity(value);
  return formatPressure(value, settings);
}

function formatShortNumber(value: number | null, suffix = "") {
  if (value == null) return "n/d";
  return `${value.toFixed(1)}${suffix}`;
}

function formatTemperatureCompact(value: number | null, settings: ReturnType<typeof useSettings>) {
  if (value == null) return "n/d";
  if (settings.temperatureUnit === "F") return `${((value * 9) / 5 + 32).toFixed(1)}°`;
  return `${value.toFixed(1)}°`;
}

function formatMetricRange(metric: "temperature" | "humidity" | "pressure", summary: DailyMetricSummary, settings: ReturnType<typeof useSettings>) {
  if (summary.min == null || summary.max == null) return null;
  if (metric === "temperature") {
    return `${formatTemperatureCompact(summary.min, settings)} - ${formatTemperatureCompact(summary.max, settings)}`;
  }

  const suffix = metric === "humidity" ? "%" : "hPa";
  const precision = metric === "pressure" ? 1 : 1;
  return `${summary.min.toFixed(precision)} - ${summary.max.toFixed(precision)} ${suffix}`;
}

function CompletenessBadge({ completeness }: { completeness: DailySensorSummary["completeness"] }) {
  if (completeness === "complete") return null;

  return (
    <span
      className={cx(
        "rounded-full border px-2 py-0.5 text-[11px] font-medium",
        completeness === "empty"
          ? "border-[color:var(--border)] text-[var(--muted)]"
          : "border-[color:var(--warning)] text-[var(--warning)]",
      )}
    >
      {completeness === "empty" ? "Brak" : "Niepełne"}
    </span>
  );
}

function MetricRange({
  label,
  metric,
  summary,
  compact = false,
  settings,
}: {
  label: string;
  metric: "temperature" | "humidity" | "pressure";
  summary: DailyMetricSummary;
  compact?: boolean;
  settings: ReturnType<typeof useSettings>;
}) {
  const range = formatMetricRange(metric, summary, settings);

  return (
    <div className={compact ? "text-xs" : "text-sm"}>
      <p className="text-[var(--muted)]">{label}</p>
      <div className="mt-1 flex items-baseline gap-2">
        <p className="font-medium text-[var(--text)]">{formatMetricValue(metric, summary.avg, settings)}</p>
        <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">śr.</p>
      </div>
      {!compact && range ? <p className="mt-1 text-xs text-[var(--muted)]">min-max: {range}</p> : null}
    </div>
  );
}

function WeekDayCard({
  summary,
  onSelect,
  settings,
}: {
  summary: DailySensorSummary;
  onSelect: (summary: DailySensorSummary) => void;
  settings: ReturnType<typeof useSettings>;
}) {
  const disabled = summary.completeness === "empty" || isFutureDay(summary.date);

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(summary)}
      className="group min-h-[250px] rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5 text-left transition duration-200 hover:-translate-y-0.5 hover:border-[color:var(--border-strong)] hover:bg-[color:var(--surface-subtle)] disabled:pointer-events-none disabled:opacity-60"
    >
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold capitalize">{summary.label}</p>
            <p className="mt-1 text-sm text-[var(--muted)]">{format(parseISO(summary.date), "d MMMM", { locale: pl })}</p>
          </div>
          <CompletenessBadge completeness={summary.completeness} />
        </div>

        {summary.completeness === "empty" ? (
          <div className="mt-12 text-sm text-[var(--muted)]">Brak danych</div>
        ) : (
          <>
            <div className="mt-8">
              <p className="text-4xl font-semibold tracking-[-0.04em] text-[var(--text)]">
                {formatTemperature(summary.temperature.avg, settings)}
              </p>
              <p className="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-[var(--muted)]">średnia</p>
            </div>
            <div className="mt-5 border-t border-[color:var(--border)] pt-4">
              <p className="text-sm font-medium">
                {formatTemperatureCompact(summary.temperature.min, settings)} / {formatTemperatureCompact(summary.temperature.max, settings)}
              </p>
              <p className="mt-1 text-xs text-[var(--muted)]">min / max</p>
            </div>
            <div className="mt-5 grid gap-3">
              <MetricRange label="Wilgotność" metric="humidity" summary={summary.humidity} settings={settings} />
              <MetricRange label="Ciśnienie" metric="pressure" summary={summary.pressure} settings={settings} />
            </div>
          </>
        )}
      </div>
    </button>
  );
}

function MonthDayCard({
  summary,
  onSelect,
  settings,
}: {
  summary: DailySensorSummary;
  onSelect: (summary: DailySensorSummary) => void;
  settings: ReturnType<typeof useSettings>;
}) {
  const disabled = summary.completeness === "empty" || isFutureDay(summary.date);

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(summary)}
      className="group min-h-[156px] rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 text-left transition duration-200 hover:border-[color:var(--border-strong)] hover:bg-[color:var(--surface-subtle)] disabled:pointer-events-none disabled:opacity-60"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--muted)] capitalize">{summary.shortLabel}</p>
          <p className="mt-1 text-2xl font-semibold">{summary.dayOfMonth}</p>
        </div>
        <CompletenessBadge completeness={summary.completeness} />
      </div>

      {summary.completeness === "empty" ? (
        <p className="mt-8 text-sm text-[var(--muted)]">Brak danych</p>
      ) : (
        <>
          <p className="mt-6 text-3xl font-semibold tracking-[-0.04em]">{formatTemperature(summary.temperature.avg, settings)}</p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            min-max: {formatTemperatureCompact(summary.temperature.min, settings)} / {formatTemperatureCompact(summary.temperature.max, settings)}
          </p>
          <div className="mt-4 grid gap-2 text-xs">
            <p><span className="text-[var(--muted)]">Wilg.</span> {formatHumidity(summary.humidity.avg)}</p>
            <p><span className="text-[var(--muted)]">Ciśn.</span> {formatPressure(summary.pressure.avg, settings)}</p>
          </div>
          <div className="mt-4 hidden rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-3 text-xs text-[var(--muted)] group-hover:block">
            Wilgotność {formatShortNumber(summary.humidity.min)}-{formatShortNumber(summary.humidity.max)}% · Ciśnienie {formatShortNumber(summary.pressure.min)}-{formatShortNumber(summary.pressure.max)} hPa
          </div>
        </>
      )}
    </button>
  );
}

export function ChartsPage() {
  const settings = useSettings();
  const { dataMode, sensorIds, sensors, isLoading: sensorsLoading } = useModeSensors();
  const [view, setView] = useState<ViewMode>("day");
  const [periodDate, setPeriodDate] = useState(() => new Date());
  const [selectedMetric, setSelectedMetric] = useState<SensorMetric>("temperature");
  const [selectedSensors, setSelectedSensors] = useState<string[]>([]);
  const [returnContext, setReturnContext] = useState<{ view: Exclude<ViewMode, "day">; date: Date } | null>(null);

  const availableSelectedSensors = useMemo(
    () => selectedSensors.filter((sensorId) => sensorIds.includes(sensorId)),
    [selectedSensors, sensorIds],
  );
  const activeSensorIds = availableSelectedSensors.length > 0 ? availableSelectedSensors : sensorIds;
  const periodRange = useMemo(() => getPeriodRange(view, periodDate), [periodDate, view]);
  const measurementParams = useMemo(
    () => ({
      sensorId: activeSensorIds.join(","),
      from: periodRange.from.toISOString(),
      to: periodRange.to.toISOString(),
      interval: getInterval(view, dataMode),
      limit: 5000,
    }),
    [activeSensorIds, dataMode, periodRange.from, periodRange.to, view],
  );

  const measurementsQuery = useQuery({
    queryKey: ["measurements", "overview-detail", view, measurementParams],
    queryFn: () => api.getMeasurements(measurementParams),
    enabled: activeSensorIds.length > 0,
  });

  const measurements = useMemo(() => measurementsQuery.data?.data ?? [], [measurementsQuery.data?.data]);
  const daySummary = useMemo(() => getDaySummary(measurements, periodDate), [measurements, periodDate]);
  const weekSummaries = useMemo(() => getWeekSummaries(measurements, periodDate), [measurements, periodDate]);
  const monthSummaries = useMemo(() => getMonthSummaries(measurements, periodDate), [measurements, periodDate]);
  const monthOffset = useMemo(() => (getDay(parseISO(monthSummaries[0]?.date ?? format(periodDate, "yyyy-MM-dd"))) + 6) % 7, [monthSummaries, periodDate]);

  const toggleSensor = (sensorId: string) => {
    setSelectedSensors((current) =>
      current.includes(sensorId) ? current.filter((value) => value !== sensorId) : [...current, sensorId],
    );
  };

  const changeView = (nextView: string) => {
    setView(nextView as ViewMode);
    setReturnContext(null);
  };

  const movePeriod = (direction: -1 | 1) => {
    setReturnContext(null);
    setPeriodDate((current) => {
      if (view === "day") return direction > 0 ? addDays(current, 1) : subDays(current, 1);
      if (view === "week") return direction > 0 ? addWeeks(current, 1) : subWeeks(current, 1);
      return direction > 0 ? addMonths(current, 1) : subMonths(current, 1);
    });
  };

  const openDay = (summary: DailySensorSummary) => {
    setReturnContext(view === "day" ? null : { view, date: periodDate });
    setPeriodDate(parseISO(summary.date));
    setView("day");
  };

  const goBackToOverview = () => {
    if (!returnContext) return;
    setPeriodDate(returnContext.date);
    setView(returnContext.view);
    setReturnContext(null);
  };

  if (!sensorsLoading && sensors.length === 0) {
    return (
      <EmptyState
        title="Brak danych do analizy"
        description="Brak aktywnych czujników."
        icon={<CalendarDays />}
      />
    );
  }

  return (
    <div className="space-y-8">
      <GlassPanel className="p-5 lg:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-[-0.03em]">{formatPeriodLabel(view, periodDate)}</h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <RangeTabs value={view} onChange={changeView} options={viewOptions} />
            <div className="inline-flex rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-subtle)] p-1">
              <button type="button" onClick={() => movePeriod(-1)} className="rounded-md px-3 py-2 text-[var(--muted)] transition hover:bg-[color:var(--surface)] hover:text-[var(--text)]" aria-label="Poprzedni okres">
                <ChevronLeft size={18} />
              </button>
              <button type="button" onClick={() => setPeriodDate(new Date())} className="rounded-md px-3 py-2 text-sm font-medium text-[var(--muted)] transition hover:bg-[color:var(--surface)] hover:text-[var(--text)]">
                Dzisiaj
              </button>
              <button type="button" onClick={() => movePeriod(1)} className="rounded-md px-3 py-2 text-[var(--muted)] transition hover:bg-[color:var(--surface)] hover:text-[var(--text)]" aria-label="Następny okres">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2 border-t border-[color:var(--border)] pt-5">
          {sensors.slice(0, 8).map((sensor) => (
            <button
              key={sensor.id}
              type="button"
              onClick={() => toggleSensor(sensor.id)}
              className={cx(
                "rounded-lg border px-3.5 py-2 text-sm font-medium transition",
                selectedSensors.includes(sensor.id)
                  ? "border-[color:var(--border-strong)] bg-[color:var(--surface-muted)] text-[var(--text)]"
                  : "border-[color:var(--border)] bg-[color:var(--surface)] text-[var(--muted)] hover:bg-[color:var(--surface-subtle)] hover:text-[var(--text)]",
              )}
            >
              {sensor.name}
            </button>
          ))}
        </div>
      </GlassPanel>

      {measurementsQuery.isLoading ? (
        <GlassPanel className="p-8 text-center text-sm text-[var(--muted)]">Ładowanie danych z czujników...</GlassPanel>
      ) : null}

      {measurementsQuery.isError ? (
        <EmptyState
          title="Nie udało się pobrać danych"
          description={measurementsQuery.error instanceof Error ? measurementsQuery.error.message : "Spróbuj ponownie za chwilę."}
          icon={<RotateCcw />}
        />
      ) : null}

      {!measurementsQuery.isLoading && !measurementsQuery.isError && view === "day" ? (
        <GlassPanel className="p-6 lg:p-8">
          <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <SectionHeader
              title="Dzień"
            />
            <div className="flex flex-wrap items-center gap-2">
              {returnContext ? (
                <button
                  type="button"
                  onClick={goBackToOverview}
                  className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-3.5 py-2 text-sm font-medium text-[var(--muted)] transition hover:bg-[color:var(--surface-subtle)] hover:text-[var(--text)]"
                >
                  Wróć do {returnContext.view === "week" ? "tygodnia" : "miesiąca"}
                </button>
              ) : null}
              {sensorMetrics.map((metric) => (
                <button
                  key={metric}
                  type="button"
                  onClick={() => setSelectedMetric(metric)}
                  className={cx(
                    "rounded-lg border px-3.5 py-2 text-sm font-medium transition",
                    selectedMetric === metric
                      ? "border-[color:var(--border-strong)] bg-[color:var(--surface-muted)] text-[var(--text)]"
                      : "border-[color:var(--border)] bg-[color:var(--surface)] text-[var(--muted)] hover:bg-[color:var(--surface-subtle)] hover:text-[var(--text)]",
                  )}
                >
                  {metricOptions.find((option) => option.value === metric)?.label}
                </button>
              ))}
            </div>
          </div>

          {daySummary.completeness === "empty" ? (
            <EmptyState title="Brak danych dla tego dnia" description="Wybierz inny dzień." icon={<LineChart />} />
          ) : (
            <>
              <div className="mb-7 grid gap-3 sm:grid-cols-3">
                <MetricRange label="Temperatura" metric="temperature" summary={daySummary.temperature} settings={settings} />
                <MetricRange label="Wilgotność" metric="humidity" summary={daySummary.humidity} settings={settings} />
                <MetricRange label="Ciśnienie" metric="pressure" summary={daySummary.pressure} settings={settings} />
              </div>
              <DailySensorChart data={daySummary.points} metric={selectedMetric} />
            </>
          )}
        </GlassPanel>
      ) : null}

      {!measurementsQuery.isLoading && !measurementsQuery.isError && view === "week" ? (
        <div>
          <SectionHeader
            title="Tydzień"
          />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
            {weekSummaries.map((summary) => (
              <WeekDayCard key={summary.date} summary={summary} onSelect={openDay} settings={settings} />
            ))}
          </div>
        </div>
      ) : null}

      {!measurementsQuery.isLoading && !measurementsQuery.isError && view === "month" ? (
        <div>
          <SectionHeader
            title="Miesiąc"
          />
          <div className="mb-3 hidden grid-cols-7 gap-3 px-1 text-xs font-medium uppercase tracking-[0.16em] text-[var(--muted)] lg:grid">
            {weekdayLabels.map((day) => <span key={day}>{day}</span>)}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7">
            {Array.from({ length: monthOffset }).map((_, index) => (
              <div key={`blank-${index}`} className="hidden rounded-2xl border border-transparent lg:block" />
            ))}
            {monthSummaries.map((summary) => (
              <MonthDayCard key={summary.date} summary={summary} onSelect={openDay} settings={settings} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
