"use client";

import { useState, useCallback } from "react";
import { X, Copy, Check } from "lucide-react";
import type { ExtractedToken } from "@/lib/types";
import { copyToClipboard } from "@/lib/util/copy-to-clipboard";

interface RadiusPreviewProps {
  tokens: ExtractedToken[];
  onUpdateToken: (name: string, value: string) => void;
  onRemoveToken: (name: string) => void;
}

function parsePixelValue(value: string): number | null {
  if (value === "0") return 0;
  const match = value.match(/^([\d.]+)\s*px/i);
  if (match) return parseFloat(match[1]);
  if (value.includes("%")) return null;
  const remMatch = value.match(/^([\d.]+)\s*rem/i);
  if (remMatch) return parseFloat(remMatch[1]) * 16;
  return null;
}

function RadiusCard({
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
  const pxValue = parsePixelValue(token.value);

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
      if (pxValue === null) return;
      const newVal = Math.max(0, pxValue + delta);
      const newStr = `${newVal}px`;
      setEditValue(newStr);
      onUpdate(newStr);
    },
    [pxValue, onUpdate]
  );

  return (
    <div className="group relative flex flex-col items-center gap-2">
      {/* Delete */}
      <button
        onClick={onRemove}
        className="absolute -right-1 -top-1 z-10 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--bg-elevated)] border border-[var(--studio-border)] text-[var(--text-muted)] hover:text-red-400 hover:border-red-400/50 opacity-0 group-hover:opacity-100 transition-all"
      >
        <X className="h-2.5 w-2.5" />
      </button>

      {/* Radius preview shape */}
      <div
        className="h-16 w-16 border-2 border-[var(--studio-accent)] bg-[var(--studio-accent-subtle)]"
        style={{ borderRadius: token.value }}
      />

      {/* Name + value */}
      <div className="flex flex-col items-center gap-0.5">
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[10px] font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          {justCopied ? (
            <Check className="h-2.5 w-2.5 text-emerald-400 shrink-0" />
          ) : (
            <Copy className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 shrink-0" />
          )}
          <span className="truncate max-w-[80px]">{displayName.replace(/^--/, "")}</span>
        </button>
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
            className="w-16 rounded border border-[var(--studio-border-focus)] bg-[var(--bg-elevated)] px-1 py-0.5 text-center font-mono text-[10px] text-[var(--text-primary)] outline-none"
          />
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="text-[10px] font-mono text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors cursor-text"
          >
            {token.value}
          </button>
        )}
      </div>
    </div>
  );
}

export function RadiusPreview({
  tokens,
  onUpdateToken,
  onRemoveToken,
}: RadiusPreviewProps) {
  // Sort by pixel value ascending
  const sorted = [...tokens].sort((a, b) => {
    const aVal = parsePixelValue(a.value) ?? 999;
    const bVal = parsePixelValue(b.value) ?? 999;
    return aVal - bVal;
  });

  return (
    <div className="flex flex-wrap gap-6">
      {sorted.map((token) => (
        <RadiusCard
          key={token.cssVariable ?? token.name}
          token={token}
          onUpdate={(value) => onUpdateToken(token.name, value)}
          onRemove={() => onRemoveToken(token.name)}
        />
      ))}
    </div>
  );
}
