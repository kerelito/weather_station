import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format, parseISO } from "date-fns";
import type { ReactNode } from "react";

function parseChartDate(value: string | number) {
  if (typeof value === "string") {
    return parseISO(value);
  }

  return new Date(value);
}

function formatAxisTime(value: string | number) {
  return format(parseChartDate(value), "HH:mm");
}

function formatTooltipTime(value: string | number) {
  return format(parseChartDate(value), "dd.MM.yyyy HH:mm");
}

function formatValue(value: unknown): ReactNode {
  if (typeof value === "number") return Number(value.toFixed(2));
  if (value == null) return "n/d";
  return String(value);
}

export function ClimateChart({
  data,
  series,
}: {
  data: Array<Record<string, string | number>>;
  series: Array<{ key: string; label: string; color: string }>;
}) {
  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 20, right: 12, bottom: 6, left: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 6" />
          <XAxis
            axisLine={false}
            dataKey="createdAt"
            minTickGap={32}
            tickFormatter={formatAxisTime}
            tick={{ fill: "var(--chart-axis)", fontSize: 12 }}
            tickLine={false}
          />
          <YAxis
            axisLine={false}
            tick={{ fill: "var(--chart-axis)", fontSize: 12 }}
            tickLine={false}
            width={42}
          />
          <Tooltip
            cursor={{ stroke: "var(--border-strong)", strokeWidth: 1 }}
            formatter={formatValue}
            labelFormatter={(value) => formatTooltipTime(value as string | number)}
          />
          {series.map((item) => (
            <Line
              key={item.key}
              type="monotoneX"
              dataKey={item.key}
              name={item.label}
              stroke={item.color}
              strokeLinecap="round"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--surface)" }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
