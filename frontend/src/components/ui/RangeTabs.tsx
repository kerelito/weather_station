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
    <div className="inline-flex flex-wrap gap-2 rounded-full border border-white/10 bg-white/5 p-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cx(
            "rounded-full px-4 py-2 text-sm font-semibold transition",
            value === option.value
              ? "bg-[var(--accent)] text-slate-950"
              : "text-[var(--muted)] hover:bg-white/10 hover:text-[var(--text)]",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
