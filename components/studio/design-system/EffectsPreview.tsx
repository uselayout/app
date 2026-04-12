"use client";

import { useState, useCallback } from "react";
import { X, Copy, Check } from "lucide-react";
import type { ExtractedToken } from "@/lib/types";
import { copyToClipboard } from "@/lib/util/copy-to-clipboard";

interface EffectsPreviewProps {
  tokens: ExtractedToken[];
  onUpdateToken: (name: string, value: string) => void;
  onRemoveToken: (name: string) => void;
}

function EffectCard({
  token,
  onUpdate,
  onRemove,
}: {
  token: ExtractedToken;
  onUpdate: (value: string) => void;
  onRemove: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(token.value);
  const [justCopied, setJustCopied] = useState(false);

  const displayName = token.cssVariable ?? `--${token.name}`;
  const trimmedValue = token.value.trim();
  const lowerValue = trimmedValue.toLowerCase();
  const isShadow = trimmedValue.includes("px") && (trimmedValue.includes("rgba") || trimmedValue.includes("#") || trimmedValue.includes("rgb("));
  const isColour = /^(#|rgb|hsl|oklch|oklab|lch|lab|color\()/i.test(lowerValue)
    || /^[\d.]+\s+[\d.]+%\s+[\d.]+%$/.test(trimmedValue);
  const isFont = /var\(--font-/i.test(trimmedValue);

  const handleCopy = useCallback(() => {
    copyToClipboard(displayName);
    setJustCopied(true);
    setTimeout(() => setJustCopied(false), 1500);
  }, [displayName]);

  const handleCommit = useCallback(() => {
    setEditing(false);
    if (editValue.trim() && editValue !== token.value) {
      onUpdate(editValue.trim());
    } else {
      setEditValue(token.value);
    }
  }, [editValue, token.value, onUpdate]);

  return (
    <div className="group relative rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] p-4">
      {/* Delete */}
      <button
        onClick={onRemove}
        className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded text-[var(--text-muted)] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      {/* Effect preview */}
      {isShadow && (
        <div className="mb-3 flex justify-center">
          <div
            className="h-16 w-24 rounded-lg bg-[#e8e8e8]"
            style={{ boxShadow: token.value }}
          />
        </div>
      )}
      {!isShadow && isColour && (
        <div className="mb-3 flex justify-center">
          <div
            className="h-8 w-8 rounded-full border border-[var(--studio-border)]"
            style={{ backgroundColor: trimmedValue }}
          />
        </div>
      )}
      {!isShadow && !isColour && isFont && (
        <div className="mb-3 flex justify-center">
          <span
            className="text-xl text-[var(--text-primary)]"
            style={{ fontFamily: trimmedValue.replace(/var\(--font-([^)]+)\)/, "$1") }}
          >
            Aa
          </span>
        </div>
      )}

      {/* Name */}
      <button
        onClick={handleCopy}
        className="flex items-center gap-1.5 text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
      >
        {justCopied ? (
          <Check className="h-3 w-3 text-emerald-400 shrink-0" />
        ) : (
          <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 shrink-0" />
        )}
        <span className="truncate">{displayName.replace(/^--/, "")}</span>
      </button>

      {/* Value */}
      {editing ? (
        <textarea
          autoFocus
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleCommit}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleCommit();
            }
            if (e.key === "Escape") {
              setEditValue(token.value);
              setEditing(false);
            }
          }}
          rows={2}
          className="mt-1 w-full rounded border border-[var(--studio-border-focus)] bg-[var(--bg-elevated)] px-1.5 py-1 font-mono text-[10px] text-[var(--text-primary)] outline-none resize-none"
        />
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="mt-1 text-left text-[10px] font-mono text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors cursor-text line-clamp-2"
        >
          {token.value}
        </button>
      )}
    </div>
  );
}

export function EffectsPreview({
  tokens,
  onUpdateToken,
  onRemoveToken,
}: EffectsPreviewProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {tokens.map((token) => (
        <EffectCard
          key={token.cssVariable ?? token.name}
          token={token}
          onUpdate={(value) => onUpdateToken(token.name, value)}
          onRemove={() => onRemoveToken(token.name)}
        />
      ))}
    </div>
  );
}
