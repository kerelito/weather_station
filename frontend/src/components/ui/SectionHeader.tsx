export function SectionHeader({ eyebrow, title, description }: { eyebrow?: string; title: string; description?: string }) {
  return (
    <div className="mb-5">
      {eyebrow ? <p className="text-xs font-medium uppercase text-[var(--muted)]">{eyebrow}</p> : null}
      <h2 className="text-2xl font-semibold tracking-normal">{title}</h2>
      {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">{description}</p> : null}
    </div>
  );
}
