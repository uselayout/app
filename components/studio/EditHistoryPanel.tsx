"use client";

import { useState } from "react";
import { History, RotateCcw, Eye, Pencil, Bot, Undo2, GitCompareArrows, X } from "lucide-react";
import type { EditEntry, EditHistory } from "@/lib/types";

interface EditHistoryPanelProps {
  history: EditHistory;
  onRestore: (entry: EditEntry) => void;
  onPreview: (entry: EditEntry) => void;
  currentPreviewId?: string;
}

function entryIcon(type: EditEntry["type"]) {
  switch (type) {
    case "manual":
      return <Pencil size={10} />;
    case "ai-annotation":
    case "ai-refine":
      return <Bot size={10} />;
    case "rollback":
      return <Undo2 size={10} />;
  }
}

function entryBadgeColour(type: EditEntry["type"]): string {
  switch (type) {
    case "manual":
      return "bg-blue-500/15 text-blue-400";
    case "ai-annotation":
    case "ai-refine":
      return "bg-purple-500/15 text-purple-400";
    case "rollback":
      return "bg-amber-500/15 text-amber-400";
  }
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function DiffView({ before, after, onClose }: { before: string; after: string; onClose: () => void }) {
  const beforeLines = before.split("\n");
  const afterLines = after.split("\n");

  // Simple line-by-line diff
  const maxLen = Math.max(beforeLines.length, afterLines.length);
  const diffLines: Array<{ type: "same" | "removed" | "added"; text: string }> = [];

  for (let i = 0; i < maxLen; i++) {
    const bLine = beforeLines[i];
    const aLine = afterLines[i];
    if (bLine === aLine) {
      if (bLine !== undefined) diffLines.push({ type: "same", text: bLine });
    } else {
      if (bLine !== undefined) diffLines.push({ type: "removed", text: bLine });
      if (aLine !== undefined) diffLines.push({ type: "added", text: aLine });
    }
  }

  return (
    <div className="border-t border-[var(--studio-border)]">
      <div className="flex items-center justify-between px-3 py-1 bg-[var(--bg-surface)]">
        <span className="text-[9px] text-[var(--text-muted)]">Diff</span>
        <button onClick={onClose} className="rounded p-0.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
          <X size={10} />
        </button>
      </div>
      <div className="max-h-[180px] overflow-auto bg-[var(--bg-app)] font-mono text-[9px] leading-relaxed">
        {diffLines.map((line, i) => (
          <div
            key={i}
            className={`px-3 py-px whitespace-pre ${
              line.type === "removed"
                ? "bg-red-500/10 text-red-400"
                : line.type === "added"
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "text-[var(--text-muted)]"
            }`}
          >
            <span className="inline-block w-3 text-right mr-2 opacity-50">
              {line.type === "removed" ? "−" : line.type === "added" ? "+" : " "}
            </span>
            {line.text}
          </div>
        ))}
      </div>
    </div>
  );
}

export function EditHistoryPanel({
  history,
  onRestore,
  onPreview,
  currentPreviewId,
}: EditHistoryPanelProps) {
  const [expanded, setExpanded] = useState(true);
  const [compareEntry, setCompareEntry] = useState<EditEntry | null>(null);

  if (history.length === 0) return null;

  const reversedHistory = [...history].reverse();

  return (
    <div className="border-t border-[var(--studio-border)]">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-1.5 px-3 py-1.5 text-[10px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
      >
        <History size={11} />
        <span>History ({history.length})</span>
        <span className="ml-auto text-[var(--text-muted)]">{expanded ? "▾" : "▸"}</span>
      </button>

      {compareEntry && (
        <DiffView
          before={compareEntry.codeBefore}
          after={compareEntry.codeAfter}
          onClose={() => setCompareEntry(null)}
        />
      )}

      {expanded && (
        <div className="max-h-[200px] overflow-y-auto">
          {reversedHistory.map((entry) => (
            <div
              key={entry.id}
              className={`group flex items-start gap-2 px-3 py-1.5 transition-colors ${
                currentPreviewId === entry.id
                  ? "bg-[var(--studio-accent-subtle)]"
                  : "hover:bg-[var(--bg-hover)]"
              }`}
            >
              <div className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded ${entryBadgeColour(entry.type)}`}>
                {entryIcon(entry.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-[var(--text-primary)] truncate">
                  {entry.description}
                </p>
                <p className="text-[9px] text-[var(--text-muted)]">
                  {formatTime(entry.timestamp)}
                </p>
              </div>
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onPreview(entry)}
                  className="rounded p-0.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-colors"
                  title="Preview this version"
                >
                  <Eye size={10} />
                </button>
                <button
                  onClick={() => setCompareEntry(compareEntry?.id === entry.id ? null : entry)}
                  className={`rounded p-0.5 transition-colors ${
                    compareEntry?.id === entry.id
                      ? "text-indigo-400 bg-indigo-500/10"
                      : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]"
                  }`}
                  title="Compare before/after"
                >
                  <GitCompareArrows size={10} />
                </button>
                <button
                  onClick={() => onRestore(entry)}
                  className="rounded p-0.5 text-[var(--text-muted)] hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                  title="Restore this version"
                >
                  <RotateCcw size={10} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
