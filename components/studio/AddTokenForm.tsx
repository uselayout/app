"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ExtractedToken, TokenType } from "@/lib/types";

interface AddTokenFormProps {
  /** Token type to create. Drives placeholder, colour picker, CSS prefix. */
  tokenType: TokenType;
  /** Called with a ready-to-save ExtractedToken on submit. */
  onSubmit: (token: ExtractedToken) => void;
  /** Called when the user dismisses the form. */
  onCancel: () => void;
  /**
   * When true: after a successful submit, clear the fields but keep the form
   * mounted and refocus the Name input. Button label becomes "Add another".
   * Useful for batch token authoring. Default false.
   */
  autoKeepOpen?: boolean;
  /**
   * Compact layout for narrow surfaces like the Source Panel (240-px column).
   * Default false — renders the comfortable Design System layout.
   */
  compact?: boolean;
}

function placeholderFor(tokenType: TokenType): string {
  switch (tokenType) {
    case "color":
      return "#e4f222";
    case "spacing":
      return "16px";
    case "radius":
      return "8px";
    case "typography":
      return "Inter, sans-serif";
    case "effect":
      return "0 1px 2px rgba(0,0,0,0.1)";
    case "motion":
      return "200ms cubic-bezier(0,0,0.2,1)";
    default:
      return "value";
  }
}

/**
 * Shared token-creation form. Used inside the Source Panel (compact) and the
 * Design System page (comfortable). Routes the resulting token through the
 * caller, which is expected to call `useProjectStore.addToken` — that handler
 * already persists to Supabase and updates layout.md's CORE TOKENS block.
 */
export function AddTokenForm({
  tokenType,
  onSubmit,
  onCancel,
  autoKeepOpen = false,
  compact = false,
}: AddTokenFormProps) {
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [justAdded, setJustAdded] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const isColor = tokenType === "color";
  const canSubmit = name.trim().length > 0 && value.trim().length > 0;
  const colourPreview =
    isColor && /^#([0-9a-f]{3}|[0-9a-f]{6,8})$/i.test(value.trim());
  const placeholder = placeholderFor(tokenType);

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!canSubmit) return;
      const cleanName = name.trim().replace(/^--/, "");
      onSubmit({
        name: cleanName,
        value: value.trim(),
        type: tokenType,
        category: "semantic",
        cssVariable: `--${cleanName}`,
      });
      if (autoKeepOpen) {
        setName("");
        setValue("");
        setJustAdded(true);
        // Refocus the name input for rapid batch entry.
        requestAnimationFrame(() => nameInputRef.current?.focus());
      }
    },
    [autoKeepOpen, canSubmit, name, value, tokenType, onSubmit]
  );

  const submitLabel = autoKeepOpen && justAdded ? "Add another" : "Add";

  const containerClass = compact
    ? "mx-2 mb-2 rounded-md border border-[var(--studio-border)] bg-[var(--bg-elevated)] p-2"
    : "mb-4 rounded-md border border-[var(--studio-border)] bg-[var(--bg-surface)] p-3";

  const inputClass = compact
    ? "min-w-0 flex-1 rounded bg-[var(--bg-surface)] px-2 py-1 font-mono text-[10px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none border border-transparent focus:border-[var(--studio-border-focus)]"
    : "min-w-0 flex-1 rounded bg-[var(--bg-elevated)] px-2 py-1 font-mono text-[11px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none border border-transparent focus:border-[var(--studio-border-focus)]";

  const labelClass =
    "text-[9px] font-medium uppercase tracking-wider text-[var(--text-muted)]";

  return (
    <form onSubmit={handleSubmit} className={containerClass}>
      <div className="flex items-end gap-2">
        {isColor && (
          <div className="shrink-0">
            <div className={`${labelClass} invisible`}>swatch</div>
            <input
              type="color"
              value={colourPreview ? value.trim() : "#6366f1"}
              onChange={(e) => setValue(e.target.value)}
              className="h-7 w-7 shrink-0 cursor-pointer rounded border border-[var(--studio-border)] bg-transparent p-0 [&::-webkit-color-swatch-wrapper]:p-0.5 [&::-webkit-color-swatch]:rounded-sm [&::-webkit-color-swatch]:border-none"
              title="Pick a colour"
            />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <label className={labelClass}>Name</label>
          <input
            ref={nameInputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="token-name"
            className={inputClass}
            autoComplete="off"
          />
        </div>
        <div className="min-w-0 flex-1">
          <label className={labelClass}>Value</label>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            className={inputClass}
            autoComplete="off"
          />
        </div>
      </div>
      <div className="mt-2 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded px-2 py-1 text-[11px] text-[var(--text-muted)] transition-colors hover:text-[var(--text-secondary)]"
        >
          {autoKeepOpen && justAdded ? "Done" : "Cancel"}
        </button>
        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded bg-[var(--studio-accent)] px-3 py-1 text-[11px] font-medium text-[var(--text-on-accent)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
