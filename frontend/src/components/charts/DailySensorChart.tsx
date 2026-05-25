import { format, parseISO } from "date-fns";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DailySensorPoint, SensorMetric } from "../../lib/sensor-aggregation";

const metricConfig: Record<SensorMetric, { label: string; color: string; unit: string }> = {
  temperature: { label: "Temperatura", color: "var(--temp)", unit: "°C" },
  humidity: { label: "Wilgotność", color: "var(--humidity)", unit: "%" },
  pressure: { label: "Ciśnienie", color: "var(--pressure)", unit: "hPa" },
};

type ChartPoint = {
  timestamp: number;
  createdAt: string;
  temperature: number | null;
  humidity: number | null;
  pressure: number | null;
  samples: number;
  gap?: {
    start: number;
    end: number;
    durationMs: number;
  };
};

type GapRange = {
  start: number;
  end: number;
  durationMs: number;
};

function formatAxisTime(value: string | number) {
  return format(typeof value === "string" ? parseISO(value) : new Date(value), "HH:mm");
}

function formatValue(value: number, metric: SensorMetric) {
  const precision = metric === "pressure" ? 0 : 1;
  return `${value.toFixed(precision)} ${metricConfig[metric].unit}`;
}

function formatGapDuration(durationMs: number) {
  const totalMinutes = Math.max(1, Math.round(durationMs / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${totalMinutes} min`;
  }

  if (minutes === 0) {
    return `${hours} h`;
  }

  return `${hours} h ${minutes} min`;
}

function intervalToMilliseconds(interval: string) {
  const match = interval.match(/^(\d+)(m|h|d)$/);

  if (!match) {
    return 0;
  }

  const value = Number(match[1]);
  const unit = match[2];

  if (unit === "m") return value * 60 * 1000;
  if (unit === "h") return value * 60 * 60 * 1000;
  return value * 24 * 60 * 60 * 1000;
}

function buildChartData(data: DailySensorPoint[], expectedInterval: string) {
  const expectedIntervalMs = intervalToMilliseconds(expectedInterval);
  const gapThresholdMs = expectedIntervalMs > 0 ? expectedIntervalMs * 1.75 : 0;
  const chartData: ChartPoint[] = [];
  const gaps: GapRange[] = [];

  data.forEach((point, index) => {
    const timestamp = parseISO(point.createdAt).getTime();
    chartData.push({
      ...point,
      timestamp,
    });

    const next = data[index + 1];
    if (!next || gapThresholdMs === 0) {
      return;
    }

    const nextTimestamp = parseISO(next.createdAt).getTime();
    const gapDurationMs = nextTimestamp - timestamp;

    if (gapDurationMs <= gapThresholdMs) {
      return;
    }

    gaps.push({
      start: timestamp,
      end: nextTimestamp,
      durationMs: gapDurationMs,
    });

    chartData.push({
      timestamp: timestamp + gapDurationMs / 2,
      createdAt: new Date(timestamp + gapDurationMs / 2).toISOString(),
      temperature: null,
      humidity: null,
      pressure: null,
      samples: 0,
      gap: {
        start: timestamp,
        end: nextTimestamp,
        durationMs: gapDurationMs,
      },
    });
  });

  chartData.sort((left, right) => left.timestamp - right.timestamp);

  return { chartData, gaps };
}

function DailyTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ payload?: ChartPoint }>;
  label?: string | number;
}) {
  if (!active || !payload?.length) return null;

  const point = payload[0]?.payload as ChartPoint | undefined;
  if (!point) return null;

  if (point.gap) {
    return (
      <div className="rounded-xl border border-[color:var(--warning)]/45 bg-[color:var(--surface)] px-4 py-3 text-sm shadow-[0_18px_48px_rgba(15,23,18,0.08)]">
        <p className="font-semibold text-[var(--text)]">Brak danych</p>
        <div className="mt-2 grid gap-1.5 text-[var(--muted)]">
          <p>
            od <span className="text-[var(--text)]">{formatAxisTime(point.gap.start)}</span> do{" "}
            <span className="text-[var(--text)]">{formatAxisTime(point.gap.end)}</span>
          </p>
          <p>
            długość przerwy: <span className="text-[var(--text)]">{formatGapDuration(point.gap.durationMs)}</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3 text-sm shadow-[0_18px_48px_rgba(15,23,18,0.08)]">
      <p className="font-semibold text-[var(--text)]">{formatAxisTime(label as string | number)}</p>
      <div className="mt-2 grid gap-1.5 text-[var(--muted)]">
        <p>Temperatura: <span className="text-[var(--text)]">{formatValue(point.temperature ?? 0, "temperature")}</span></p>
        <p>Wilgotność: <span className="text-[var(--text)]">{formatValue(point.humidity ?? 0, "humidity")}</span></p>
        <p>Ciśnienie: <span className="text-[var(--text)]">{formatValue(point.pressure ?? 0, "pressure")}</span></p>
      </div>
    </div>
  );
}

export function DailySensorChart({
  data,
  metric,
  expectedInterval,
}: {
  data: DailySensorPoint[];
  metric: SensorMetric;
  expectedInterval: string;
}) {
  const config = metricConfig[metric];
  const { chartData, gaps } = buildChartData(data, expectedInterval);

  return (
    <div className="w-full">
      {gaps.length > 0 ? (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-[color:var(--warning)]/35 bg-[color:var(--surface-subtle)] px-4 py-3 text-sm">
          <div className="mt-1 h-2.5 w-2.5 rounded-full bg-[color:var(--warning)]" />
          <div>
            <p className="font-medium text-[var(--text)]">Wykryto przerwy w danych pomiarowych.</p>
            <p className="mt-1 text-[var(--muted)]">
              Linia jest przerywana, a luki są zaznaczone na tle wykresu, żeby nie sugerować ciągłego odczytu.
            </p>
          </div>
        </div>
      ) : null}
      <div className="h-[340px] w-full">
        <ResponsiveContainer>
          <LineChart data={chartData} margin={{ top: 18, right: 18, bottom: 6, left: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="2 8" />
            <XAxis
              axisLine={false}
              dataKey="timestamp"
              domain={["dataMin", "dataMax"]}
              minTickGap={36}
              scale="time"
              tickFormatter={formatAxisTime}
              tick={{ fill: "var(--chart-axis)", fontSize: 12 }}
              tickLine={false}
              type="number"
            />
            <YAxis
              axisLine={false}
              domain={["dataMin", "dataMax"]}
              tick={{ fill: "var(--chart-axis)", fontSize: 12 }}
              tickFormatter={(value) => formatValue(Number(value), metric)}
              tickLine={false}
              width={62}
            />
            {gaps.map((gap) => (
              <ReferenceArea
                key={`${gap.start}-${gap.end}`}
                fill="var(--warning)"
                fillOpacity={0.08}
                ifOverflow="extendDomain"
                stroke="var(--warning)"
                strokeDasharray="4 6"
                strokeOpacity={0.18}
                x1={gap.start}
                x2={gap.end}
              />
            ))}
            <Tooltip content={<DailyTooltip />} cursor={{ stroke: "var(--border-strong)", strokeWidth: 1 }} />
            <Line
              type="monotoneX"
              dataKey={metric}
              connectNulls={false}
              isAnimationActive={false}
              name={config.label}
              stroke={config.color}
              strokeLinecap="round"
              strokeWidth={1.8}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--surface)" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
