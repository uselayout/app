"use client";

import { useState, useCallback } from "react";
import { X, Copy, Check } from "lucide-react";
import type { ExtractedToken } from "@/lib/types";
import { copyToClipboard } from "@/lib/util/copy-to-clipboard";

interface SpacingScaleProps {
  tokens: ExtractedToken[];
  onUpdateToken: (name: string, value: string) => void;
  onRemoveToken: (name: string) => void;
}

function parsePixelValue(value: string): number | null {
  const match = value.match(/^([\d.]+)\s*px/i);
  if (match) return parseFloat(match[1]);
  // rem → px (assume 16px base)
  const remMatch = value.match(/^([\d.]+)\s*rem/i);
  if (remMatch) return parseFloat(remMatch[1]) * 16;
  // clamp(min, preferred, max) — use the min value for bar sizing
  const clampMatch = value.match(/clamp\(\s*([\d.]+)\s*(px|rem)/i);
  if (clampMatch) {
    const num = parseFloat(clampMatch[1]);
    return clampMatch[2].toLowerCase() === "rem" ? num * 16 : num;
  }
  return null;
}

function SpacingBar({
  token,
  maxValue,
  onUpdate,
  onRemove,
}: {
  token: ExtractedToken;
  maxValue: number;
  onUpdate: (value: string) => void;
  onRemove: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(token.value);
  const [justCopied, setJustCopied] = useState(false);

  const pxValue = parsePixelValue(token.value);
  const barWidth = pxValue && maxValue > 0 ? Math.max(4, (pxValue / maxValue) * 100) : 0;
  const displayName = token.cssVariable ?? `--${token.name}`;

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

  const handleStep = useCallback(
    (delta: number) => {
      if (!pxValue) return;
      const newVal = Math.max(0, pxValue + delta);
      const newStr = `${newVal}px`;
      setEditValue(newStr);
      onUpdate(newStr);
    },
    [pxValue, onUpdate]
  );

  return (
    <div className="group flex items-center gap-3 rounded-lg px-3 py-1.5 hover:bg-[var(--bg-surface)] transition-colors">
      {/* Token name */}
      <button
        onClick={handleCopy}
        className="w-56 shrink-0 flex items-center gap-1.5 text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors text-left"
      >
        {justCopied ? (
          <Check className="h-3 w-3 text-emerald-400 shrink-0" />
        ) : (
          <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 shrink-0" />
        )}
        <span className="truncate">{displayName.replace(/^--/, "")}</span>
      </button>

      {/* Value */}
      <div className="w-20 shrink-0">
        {editing ? (
          <input
            autoFocus
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleCommit}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCommit();
              if (e.key === "Escape") {
                setEditValue(token.value);
                setEditing(false);
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                handleStep(e.shiftKey ? 10 : 1);
              }
              if (e.key === "ArrowDown") {
                e.preventDefault();
                handleStep(e.shiftKey ? -10 : -1);
              }
            }}
            className="w-full rounded border border-[var(--studio-border-focus)] bg-[var(--bg-elevated)] px-1.5 py-0.5 font-mono text-[11px] text-[var(--text-primary)] outline-none"
          />
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="font-mono text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors cursor-text"
          >
            {token.value}
          </button>
        )}
      </div>

      {/* Bar */}
      <div className="flex-1 flex items-center h-6">
        <div
          className="h-4 rounded-sm bg-[var(--studio-accent)] opacity-20 transition-all"
          style={{ width: `${barWidth}%` }}
        />
        {/* Actual size indicator block */}
        {pxValue !== null && pxValue <= 120 && (
          <div
            className="ml-2 shrink-0 rounded-[2px] border border-[var(--studio-border-strong)] bg-[var(--studio-accent)] opacity-30"
            style={{ width: pxValue, height: pxValue, maxWidth: 64, maxHeight: 24 }}
            title={`${pxValue}px`}
          />
        )}
      </div>

      {/* Delete */}
      <button
        onClick={onRemove}
        className="shrink-0 opacity-0 group-hover:opacity-100 flex items-center justify-center h-5 w-5 rounded text-[var(--text-muted)] hover:text-red-400 transition-all"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function SpacingScale({
  tokens,
  onUpdateToken,
  onRemoveToken,
}: SpacingScaleProps) {
  // Sort by pixel value ascending
  const sorted = [...tokens].sort((a, b) => {
    const aVal = parsePixelValue(a.value) ?? 0;
    const bVal = parsePixelValue(b.value) ?? 0;
    return aVal - bVal;
  });

  const maxValue = sorted.reduce((max, t) => {
    const val = parsePixelValue(t.value) ?? 0;
    return Math.max(max, val);
  }, 0);

  return (
    <div className="space-y-1">
      {sorted.map((token) => (
        <SpacingBar
          key={token.cssVariable ?? token.name}
          token={token}
          maxValue={maxValue}
          onUpdate={(value) => onUpdateToken(token.name, value)}
          onRemove={() => onRemoveToken(token.name)}
        />
      ))}
    </div>
  );
}
