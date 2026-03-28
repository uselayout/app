"use client";

import type { ChangelogProduct } from "@/lib/types/changelog";

const filters: Array<{ value: ChangelogProduct | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "studio", label: "Studio" },
  { value: "cli", label: "CLI" },
  { value: "figma-plugin", label: "Figma Plugin" },
  { value: "chrome-extension", label: "Chrome Extension" },
];

export function ChangelogFilters({
  active,
  onChange,
}: {
  active: ChangelogProduct | "all";
  onChange: (value: ChangelogProduct | "all") => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => (
        <button
          key={filter.value}
          onClick={() => onChange(filter.value)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-all duration-150 ${
            active === filter.value
              ? "bg-white/15 text-white"
              : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60"
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}
