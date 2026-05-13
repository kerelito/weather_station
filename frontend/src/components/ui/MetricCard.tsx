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
  icon,
  accent,
  trend,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: ReactNode;
  accent: string;
  trend?: Trend;
}) {
  const TrendIcon = trend?.direction === "up" ? ArrowUpRight : trend?.direction === "down" ? ArrowDownRight : ArrowRight;

  return (
    <GlassPanel className="p-5">
      <motion.div whileHover={{ y: -4 }} className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[var(--muted)]">{title}</p>
          <h3 className="mt-3 text-3xl font-extrabold">{value}</h3>
          <p className="mt-2 text-sm text-[var(--muted)]">{subtitle}</p>
        </div>
        <div
          className="rounded-2xl p-3"
          style={{
            background: accent,
          }}
        >
          {icon}
        </div>
      </motion.div>
      {trend ? (
        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-[var(--muted)]">
          <TrendIcon size={14} />
          <span>{trend.delta >= 0 ? "+" : ""}{trend.delta.toFixed(2)} vs poprzedni okres</span>
        </div>
      ) : null}
    </GlassPanel>
  );
}
