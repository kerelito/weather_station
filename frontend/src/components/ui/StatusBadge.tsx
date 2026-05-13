import { Activity, Wifi, WifiOff } from "lucide-react";
import { cx } from "../../lib/format";

export function StatusBadge({ online, live }: { online: boolean; live?: boolean }) {
  return (
    <div
      className={cx(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
        online
          ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
          : "border-rose-400/30 bg-rose-400/10 text-rose-200",
      )}
    >
      {live ? <Activity size={14} /> : online ? <Wifi size={14} /> : <WifiOff size={14} />}
      <span>{online ? "Online" : "Offline"}</span>
    </div>
  );
}
