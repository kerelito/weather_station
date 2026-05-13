export function SectionHeader({ eyebrow, title, description }: { eyebrow?: string; title: string; description?: string }) {
  return (
    <div className="mb-6">
      {eyebrow ? <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--accent-secondary)]">{eyebrow}</p> : null}
      <h2 className="mt-2 text-3xl font-extrabold">{title}</h2>
      {description ? <p className="mt-2 max-w-3xl text-sm text-[var(--muted)]">{description}</p> : null}
    </div>
  );
}
