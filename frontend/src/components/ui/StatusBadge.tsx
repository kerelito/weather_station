import { Activity, Wifi, WifiOff } from "lucide-react";
import { cx } from "../../lib/format";

export function StatusBadge({ online, live }: { online: boolean; live?: boolean }) {
  return (
    <div
      className={cx(
        "inline-flex items-center gap-2 rounded-md border px-2.5 py-1 text-xs font-medium",
        online
          ? "border-[color:var(--border)] bg-[color:var(--surface-subtle)] text-[color:var(--success)]"
          : "border-[color:var(--border)] bg-[color:var(--surface-subtle)] text-[color:var(--danger)]",
      )}
    >
      {live ? <Activity size={14} /> : online ? <Wifi size={14} /> : <WifiOff size={14} />}
      <span>{online ? "Online" : "Offline"}</span>
    </div>
  );
}
