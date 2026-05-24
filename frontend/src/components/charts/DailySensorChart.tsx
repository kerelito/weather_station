import { format, parseISO } from "date-fns";
import {
  CartesianGrid,
  Line,
  LineChart,
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

function formatAxisTime(value: string | number) {
  return format(typeof value === "string" ? parseISO(value) : new Date(value), "HH:mm");
}

function formatValue(value: number, metric: SensorMetric) {
  const precision = metric === "pressure" ? 0 : 1;
  return `${value.toFixed(precision)} ${metricConfig[metric].unit}`;
}

function DailyTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ payload?: DailySensorPoint }>;
  label?: string | number;
}) {
  if (!active || !payload?.length) return null;

  const point = payload[0]?.payload as DailySensorPoint | undefined;
  if (!point) return null;

  return (
    <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3 text-sm shadow-[0_18px_48px_rgba(15,23,18,0.08)]">
      <p className="font-semibold text-[var(--text)]">{formatAxisTime(label as string)}</p>
      <div className="mt-2 grid gap-1.5 text-[var(--muted)]">
        <p>Temperatura: <span className="text-[var(--text)]">{formatValue(point.temperature, "temperature")}</span></p>
        <p>Wilgotność: <span className="text-[var(--text)]">{formatValue(point.humidity, "humidity")}</span></p>
        <p>Ciśnienie: <span className="text-[var(--text)]">{formatValue(point.pressure, "pressure")}</span></p>
      </div>
    </div>
  );
}

export function DailySensorChart({
  data,
  metric,
}: {
  data: DailySensorPoint[];
  metric: SensorMetric;
}) {
  const config = metricConfig[metric];

  return (
    <div className="h-[340px] w-full">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 18, right: 18, bottom: 6, left: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="2 8" />
          <XAxis
            axisLine={false}
            dataKey="createdAt"
            minTickGap={36}
            tickFormatter={formatAxisTime}
            tick={{ fill: "var(--chart-axis)", fontSize: 12 }}
            tickLine={false}
          />
          <YAxis
            axisLine={false}
            domain={["dataMin", "dataMax"]}
            tick={{ fill: "var(--chart-axis)", fontSize: 12 }}
            tickFormatter={(value) => formatValue(Number(value), metric)}
            tickLine={false}
            width={62}
          />
          <Tooltip content={<DailyTooltip />} cursor={{ stroke: "var(--border-strong)", strokeWidth: 1 }} />
          <Line
            type="monotoneX"
            dataKey={metric}
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
  );
}
