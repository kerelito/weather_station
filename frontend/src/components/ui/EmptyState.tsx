import type { ReactNode } from "react";
import { GlassPanel } from "./GlassPanel";

export function EmptyState({ title, description, icon }: { title: string; description: string; icon: ReactNode }) {
  return (
    <GlassPanel className="p-8 text-center">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-subtle)] text-[color:var(--muted)]">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{description}</p>
    </GlassPanel>
  );
}
