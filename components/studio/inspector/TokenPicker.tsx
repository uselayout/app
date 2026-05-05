"use client";

import { useState } from "react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { ChevronDown } from "lucide-react";
import type { ExtractedToken, TokenType } from "@/lib/types";

interface Props {
  label: string;
  /** The bare CSS variable name without var() wrapper, e.g. "--color-primary". */
  value: string;
  /** Token category this picker draws from. */
  category: TokenType;
  /** Project tokens — caller passes the full list, picker filters by category. */
  tokens: ExtractedToken[];
  onChange: (newCssVarName: string) => void;
}

/**
 * Token-driven property picker. Shows a button with the current swatch /
 * label, opens a popover with all matching tokens. Non-coders can only ever
 * pick from the design system's token list, so off-brand values are
 * structurally impossible.
 */
export function TokenPicker({ label, value, category, tokens, onChange }: Props) {
  const [open, setOpen] = useState(false);

  const candidates = tokens.filter((t) => t.type === category);
  const current = candidates.find((t) => `--${t.name}` === value || t.cssVariable === value);

  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[11px] text-[var(--text-secondary)]">{label}</span>
      <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
        <PopoverPrimitive.Trigger asChild>
          <button
            type="button"
            className="flex min-w-[160px] items-center gap-2 rounded border border-[var(--studio-border)] bg-[var(--bg-app)] px-2 py-1 text-[10px] font-mono text-[var(--text-secondary)] transition-colors hover:border-[var(--studio-border-strong)]"
          >
            {category === "color" ? <Swatch token={current} /> : null}
            <span className="flex-1 truncate text-left">
              {current ? `--${current.name}` : value}
            </span>
            <ChevronDown className="h-3 w-3 opacity-60" />
          </button>
        </PopoverPrimitive.Trigger>
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            sideOffset={4}
            align="end"
            className="z-[60] w-[280px] max-h-[320px] overflow-y-auto rounded-md border border-[var(--studio-border)] bg-[var(--bg-elevated)] p-1 shadow-2xl outline-none"
          >
            {candidates.length === 0 ? (
              <p className="px-2 py-3 text-[10px] text-[var(--text-muted)]">
                No {category} tokens in this project. Extract or push a design system to add some.
              </p>
            ) : (
              <ul className="space-y-0.5">
                {candidates.map((t) => {
                  const varName = `--${t.name}`;
                  const isActive = varName === value || t.cssVariable === value;
                  return (
                    <li key={t.name}>
                      <button
                        type="button"
                        onClick={() => {
                          onChange(varName);
                          setOpen(false);
                        }}
                        className={
                          "flex w-full items-center gap-2 rounded px-2 py-1.5 text-[10px] font-mono text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-hover)] " +
                          (isActive ? "bg-[var(--studio-accent-subtle)] text-[var(--text-primary)]" : "")
                        }
                      >
                        {category === "color" ? <Swatch token={t} /> : null}
                        <span className="flex-1 truncate text-left">--{t.name}</span>
                        <span className="truncate text-[var(--text-muted)] opacity-70">{t.value}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    </div>
  );
}

function Swatch({ token }: { token?: ExtractedToken }) {
  return (
    <span
      className="inline-block h-3 w-3 shrink-0 rounded-sm border border-black/10"
      style={{ background: token?.value ?? "transparent" }}
      aria-hidden
    />
  );
}
