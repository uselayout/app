"use client";

import { useState, useCallback } from "react";
import { X, Copy, Check } from "lucide-react";
import type { ExtractedToken, FontDeclaration } from "@/lib/types";
import { groupTokensByPurpose } from "@/lib/tokens/group-tokens";
import { copyToClipboard } from "@/lib/util/copy-to-clipboard";

interface TypographyScaleProps {
  tokens: ExtractedToken[];
  onUpdateToken: (name: string, value: string) => void;
  onRemoveToken: (name: string) => void;
  extractedFonts: FontDeclaration[];
}

function parseNumericValue(value: string): number | null {
  const match = value.match(/^([\d.]+)/);
  return match ? parseFloat(match[1]) : null;
}

function TypographyRow({
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
  const isFontSize = token.name.includes("size") || token.name.includes("font-size");
  const isFontFamily = token.name.includes("font-family") || token.name.includes("font-sans") || token.name.includes("font-mono") || token.name.includes("font-serif");
  const isFontWeight = token.name.includes("weight");
  const isLineHeight = token.name.includes("line-height") || token.name.includes("leading");

  const numericValue = parseNumericValue(token.value);

  // Determine specimen style
  const specimenStyle: React.CSSProperties = {};
  if (isFontSize && numericValue) {
    specimenStyle.fontSize = `${Math.min(numericValue, 48)}px`;
  } else if (isFontFamily) {
    specimenStyle.fontFamily = token.value;
  } else if (isFontWeight && numericValue) {
    specimenStyle.fontWeight = numericValue;
  } else if (isLineHeight) {
    specimenStyle.lineHeight = token.value;
    specimenStyle.fontSize = "16px";
  }

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
    <div className="group flex items-center gap-4 rounded-lg px-3 py-2 hover:bg-[var(--bg-surface)] transition-colors">
      {/* Token info */}
      <div className="w-48 shrink-0 space-y-0.5">
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
            }}
            className="w-full rounded border border-[var(--studio-border-focus)] bg-[var(--bg-elevated)] px-1.5 py-0.5 font-mono text-[11px] text-[var(--text-primary)] outline-none"
          />
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="text-[11px] font-mono text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors cursor-text"
          >
            {token.value}
          </button>
        )}
      </div>

      {/* Specimen */}
      <div className="flex-1 min-w-0">
        <p
          className="truncate text-[var(--text-primary)]"
          style={specimenStyle}
        >
          {isFontFamily ? "The quick brown fox jumps over the lazy dog" : "Aa Bb Cc 123"}
        </p>
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

export function TypographyScale({
  tokens,
  onUpdateToken,
  onRemoveToken,
  extractedFonts,
}: TypographyScaleProps) {
  const groups = groupTokensByPurpose(tokens, "typography");

  const displayGroups = groups.length > 0
    ? groups
    : [{ label: "All Typography", tokens }];

  // Sort font-size tokens by numeric value (largest first)
  const sortedGroups = displayGroups.map((group) => {
    if (group.label === "Sizes" || group.label === "Font Sizes") {
      const sorted = [...group.tokens].sort((a, b) => {
        const aVal = parseNumericValue(a.value) ?? 0;
        const bVal = parseNumericValue(b.value) ?? 0;
        return bVal - aVal;
      });
      return { ...group, tokens: sorted };
    }
    return group;
  });

  return (
    <div className="space-y-6">
      {/* Font families overview */}
      {extractedFonts.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
            Font Families
          </h3>
          <div className="flex flex-wrap gap-3">
            {extractedFonts.map((font) => (
              <div
                key={font.family}
                className="rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] px-4 py-3"
              >
                <p
                  className="text-lg text-[var(--text-primary)]"
                  style={{ fontFamily: font.family }}
                >
                  {font.family}
                </p>
                <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                  {font.weight || "400"} {font.style !== "normal" ? font.style : ""}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {sortedGroups.map((group) => (
        <div key={group.label}>
          <h3 className="mb-2 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
            {group.label}
          </h3>
          <div className="space-y-0.5">
            {group.tokens.map((token) => (
              <TypographyRow
                key={token.cssVariable ?? token.name}
                token={token}
                onUpdate={(value) => onUpdateToken(token.name, value)}
                onRemove={() => onRemoveToken(token.name)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
