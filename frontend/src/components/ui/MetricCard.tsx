import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import { GlassPanel } from "./GlassPanel";

type Trend = {
  direction: "up" | "down" | "flat";
  delta: number;
};

export function MetricCard({
  title,
  value,
  subtitle,
  trendLabel,
  icon,
  accent,
  trend,
}: {
  title: string;
  value: string;
  subtitle?: string;
  trendLabel?: string;
  icon: ReactNode;
  accent: string;
  trend?: Trend;
}) {
  const TrendIcon = trend?.direction === "up" ? ArrowUpRight : trend?.direction === "down" ? ArrowDownRight : ArrowRight;

  return (
    <GlassPanel className="p-5">
      <motion.div whileHover={{ y: -2 }} className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[var(--muted)]">{title}</p>
          <h3 className="mt-3 text-3xl font-semibold tracking-normal">{value}</h3>
          {subtitle ? <p className="mt-2 text-sm text-[var(--muted)]">{subtitle}</p> : null}
        </div>
        <div
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-subtle)]"
          style={{
            color: accent,
          }}
        >
          {icon}
        </div>
      </motion.div>
      {trend ? (
        <div className="mt-4 inline-flex items-center gap-2 rounded-md border border-[color:var(--border)] bg-[color:var(--surface-subtle)] px-2.5 py-1 text-xs text-[var(--muted)]">
          <TrendIcon size={14} />
          <span>{trend.delta >= 0 ? "+" : ""}{trend.delta.toFixed(2)} {trendLabel ?? "vs poprzednie okno"}</span>
        </div>
      ) : null}
    </GlassPanel>
  );
}
