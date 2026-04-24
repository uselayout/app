"use client";

import { useState, useRef, useEffect } from "react";
import { RefreshCw, PanelLeft, Share2 } from "lucide-react";
import type { SourceType } from "@/lib/types";

interface TopBarProps {
  projectName: string;
  sourceType: SourceType;
  sourceName?: string;
  onNameChange?: (name: string) => void;
  onReExtract?: () => void;
  onToggleSource?: () => void;
  sourcePanelOpen?: boolean;
  onExport?: () => void;
  onShareToGallery?: () => void;
  showSourceToggle?: boolean;
}

export function TopBar({
  projectName,
  sourceType,
  sourceName,
  onNameChange,
  onReExtract,
  onToggleSource,
  sourcePanelOpen,
  onExport,
  onShareToGallery,
  showSourceToggle = true,
}: TopBarProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(projectName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    if (editValue.trim() && editValue !== projectName) {
      onNameChange?.(editValue.trim());
    } else {
      setEditValue(projectName);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleBlur();
    } else if (e.key === "Escape") {
      setEditValue(projectName);
      setIsEditing(false);
    }
  };

  return (
    <div className="flex h-12 items-center justify-between border-b border-[var(--studio-border)] bg-[var(--bg-app)] px-4">
      {/* Left: Source panel toggle + Project name + source */}
      <div className="flex flex-1 items-center gap-[17px]">
        {showSourceToggle && (
          <button
            onClick={onToggleSource}
            className={`flex items-center justify-center size-7 rounded-[4px] border border-[var(--studio-border-strong)] transition-colors ${
              sourcePanelOpen
                ? "bg-[var(--studio-accent-subtle)] text-[var(--text-primary)]"
                : "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
            }`}
            title="Toggle source panel"
          >
            <PanelLeft className="h-3.5 w-3.5" />
          </button>
        )}

        {isEditing ? (
          <input
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="h-7 rounded-sm border border-[var(--studio-border-strong)] bg-[var(--bg-surface)] px-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--studio-border-focus)]"
          />
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="text-[14px] font-medium text-[var(--text-primary)] transition-colors hover:text-[var(--studio-accent-hover)]"
          >
            {projectName}
          </button>
        )}

        <span className="inline-flex items-center gap-1.5 rounded-full border border-transparent px-[9px] py-[3px] text-[12px] font-medium text-[var(--text-primary)] overflow-hidden">
          {sourceName || sourceType}
        </span>
      </div>

      {/* Centre spacer */}
      <div className="flex-1" />

      {/* Right: Actions */}
      <div className="flex flex-1 items-center justify-end gap-1.5">
        {sourceType !== "manual" && (
          <button
            onClick={onReExtract}
            className="flex items-center justify-center size-7 rounded-[4px] border border-[var(--studio-border-strong)] bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
            title="Re-extract"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        )}
        {onShareToGallery && (
          <button
            onClick={onShareToGallery}
            className="flex items-center gap-1.5 h-7 px-[10px] rounded-[4px] border border-[var(--studio-border-strong)] bg-transparent text-[12px] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors"
            title="Share this project as a public kit"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span>Share</span>
          </button>
        )}
        <button
          onClick={onExport}
          className="flex items-center justify-center h-7 px-[13px] rounded-[4px] bg-[var(--studio-accent)] border border-[var(--studio-accent)] text-[12px] font-medium text-[var(--text-on-accent)] hover:bg-[var(--studio-accent-hover)] transition-colors"
        >
          Export
        </button>
      </div>
    </div>
  );
}
