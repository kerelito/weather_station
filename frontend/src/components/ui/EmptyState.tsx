import type { ReactNode } from "react";
import { GlassPanel } from "./GlassPanel";

export function EmptyState({ title, description, icon }: { title: string; description: string; icon: ReactNode }) {
  return (
    <GlassPanel className="p-8 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
        {icon}
      </div>
      <h3 className="mt-4 text-xl font-bold">{title}</h3>
      <p className="mt-2 text-sm text-[var(--muted)]">{description}</p>
    </GlassPanel>
  );
}
