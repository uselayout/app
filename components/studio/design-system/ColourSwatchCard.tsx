"use client";

import { useState, useCallback } from "react";
import { X, Copy, Check } from "lucide-react";
import { ColorPickerPopover } from "@/components/studio/ColorPickerPopover";
import { toHex } from "@/lib/util/color";
import { copyToClipboard } from "@/lib/util/copy-to-clipboard";

interface ColourSwatchCardProps {
  name: string;
  cssVariable?: string;
  value: string;
  resolvedValue: string;
  description?: string;
  onUpdate: (newValue: string) => void;
  onRemove: () => void;
  onRename: (newName: string) => void;
}

export function ColourSwatchCard({
  name,
  cssVariable,
  value,
  resolvedValue,
  description,
  onUpdate,
  onRemove,
  onRename,
}: ColourSwatchCardProps) {
  const [justCopied, setJustCopied] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(name);

  const displayHex = toHex(resolvedValue) ?? resolvedValue;
  const swatchColour = toHex(resolvedValue) ?? "#000000";
  const displayName = cssVariable ?? `--${name}`;

  const handleCopy = useCallback(() => {
    copyToClipboard(displayName);
    setJustCopied(true);
    setTimeout(() => setJustCopied(false), 1500);
  }, [displayName]);

  const handleRenameCommit = useCallback(() => {
    setRenaming(false);
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== name) {
      onRename(trimmed);
    } else {
      setRenameValue(name);
    }
  }, [renameValue, name, onRename]);

  return (
    <div
      className="group relative flex flex-col items-center gap-2"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Delete button */}
      {hovered && (
        <button
          onClick={onRemove}
          className="absolute -right-1 -top-1 z-10 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--bg-elevated)] border border-[var(--studio-border)] text-[var(--text-muted)] hover:text-red-400 hover:border-red-400/50 transition-colors"
        >
          <X className="h-2.5 w-2.5" />
        </button>
      )}

      {/* Swatch */}
      <ColorPickerPopover value={resolvedValue} onChange={onUpdate}>
        <button
          className="h-12 w-12 rounded-lg border border-[var(--studio-border)] transition-all hover:border-[var(--studio-border-strong)] hover:scale-105 cursor-pointer"
          style={{ backgroundColor: swatchColour }}
          title={description ?? `${displayName}: ${value}`}
        />
      </ColorPickerPopover>

      {/* Name + value */}
      <div className="flex flex-col items-center gap-0.5">
        {renaming ? (
          <input
            autoFocus
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={handleRenameCommit}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRenameCommit();
              if (e.key === "Escape") {
                setRenameValue(name);
                setRenaming(false);
              }
            }}
            className="w-28 rounded border border-[var(--studio-border-focus)] bg-[var(--bg-elevated)] px-1 py-0.5 text-center font-mono text-[10px] text-[var(--text-primary)] outline-none"
          />
        ) : (
          <button
            onClick={handleCopy}
            onDoubleClick={() => {
              setRenameValue(name);
              setRenaming(true);
            }}
            className="flex items-center gap-1 text-[10px] font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors text-center leading-tight"
            title={`Click to copy, double-click to rename`}
          >
            {justCopied ? (
              <Check className="h-2.5 w-2.5 text-emerald-400 shrink-0" />
            ) : (
              <Copy className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 shrink-0" />
            )}
            <span>{displayName.replace(/^--/, "")}</span>
          </button>
        )}
        <span className="text-[10px] font-mono text-[var(--text-muted)]">
          {displayHex}
        </span>
      </div>
    </div>
  );
}
