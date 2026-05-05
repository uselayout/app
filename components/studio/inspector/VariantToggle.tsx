"use client";

interface Props {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}

/**
 * Segmented control for variant axes (Size, State, Theme). Keeps the design
 * consistent with the rest of the inspector — minimal chrome, dark-on-darker.
 */
export function VariantToggle({ label, value, options, onChange }: Props) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[11px] font-medium text-[var(--text-secondary)]">{label}</span>
      <div className="flex gap-0.5 rounded-md border border-[var(--studio-border)] bg-[var(--bg-app)] p-0.5">
        {options.map((opt) => {
          const active = opt === value;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              className={
                "rounded px-2 py-1 text-[10px] font-medium transition-colors " +
                (active
                  ? "bg-[var(--studio-accent)] text-[var(--text-on-accent)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]")
              }
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
