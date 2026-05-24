import { cx } from "../../lib/format";

export function RangeTabs({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
}) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-subtle)] p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cx(
            "rounded-md px-3 py-1.5 text-sm font-medium transition",
            value === option.value
              ? "bg-[color:var(--surface)] text-[color:var(--text)]"
              : "text-[var(--muted)] hover:text-[var(--text)]",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
