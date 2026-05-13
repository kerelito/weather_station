import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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
        <LineChart data={data}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="createdAt" tickFormatter={(value: string) => value.slice(11, 16)} tick={{ fill: "#94a3b8", fontSize: 12 }} />
          <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} width={54} />
          <Tooltip labelFormatter={(value) => String(value).replace("T", " ").slice(0, 16)} />
          <Legend />
          {series.map((item) => (
            <Line
              key={item.key}
              type="monotone"
              dataKey={item.key}
              name={item.label}
              stroke={item.color}
              strokeWidth={3}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
