"use client";

import { useState, type ReactNode } from "react";

type TabId = "preview" | "tokens" | "layoutmd";

interface Props {
  preview: ReactNode;
  tokens: ReactNode;
  layoutMd: ReactNode;
}

const TABS: Array<{ id: TabId; label: string }> = [
  { id: "preview", label: "Live Preview" },
  { id: "tokens", label: "Tokens" },
  { id: "layoutmd", label: "layout.md" },
];

export function KitDetailTabs({ preview, tokens, layoutMd }: Props) {
  const [active, setActive] = useState<TabId>("preview");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-1 p-1 rounded-xl border border-[var(--mkt-border)] bg-[var(--mkt-surface)] self-start">
        {TABS.map(({ id, label }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActive(id)}
              className={`px-3 py-1.5 rounded-lg text-[13px] transition-colors ${
                isActive
                  ? "bg-[var(--mkt-bg)] text-[var(--mkt-text-primary)] border border-[var(--mkt-border-strong)]"
                  : "text-[var(--mkt-text-secondary)] hover:text-[var(--mkt-text-primary)] border border-transparent"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className={active === "preview" ? "block" : "hidden"}>{preview}</div>
      <div className={active === "tokens" ? "block" : "hidden"}>{tokens}</div>
      <div className={active === "layoutmd" ? "block" : "hidden"}>{layoutMd}</div>
    </div>
  );
}
