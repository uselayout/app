"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { X, FlaskConical } from "lucide-react";

const DiffEditor = dynamic(
  () => import("@monaco-editor/react").then((mod) => mod.DiffEditor),
  { ssr: false }
);

interface LayoutMdCompareModalProps {
  snapshotLayoutMd: string;
  currentLayoutMd: string;
  onClose: () => void;
  onTestVariants?: (oldMd: string, newMd: string) => void;
}

export function LayoutMdCompareModal({
  snapshotLayoutMd,
  currentLayoutMd,
  onClose,
  onTestVariants,
}: LayoutMdCompareModalProps) {
  const [view, setView] = useState<"diff" | "side-by-side">("diff");

  const handleTest = useCallback(() => {
    onTestVariants?.(snapshotLayoutMd, currentLayoutMd);
    onClose();
  }, [snapshotLayoutMd, currentLayoutMd, onTestVariants, onClose]);

  // Count differences (rough line count)
  const oldLines = snapshotLayoutMd.split("\n").length;
  const newLines = currentLayoutMd.split("\n").length;
  const lineDiff = newLines - oldLines;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="flex h-[85vh] w-[90vw] max-w-6xl flex-col rounded-xl border border-[var(--studio-border)] bg-[var(--bg-app)] shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-[var(--studio-border)] px-6 py-3">
          <h2 className="flex-1 text-sm font-semibold text-[var(--text-primary)]">
            Compare layout.md Versions
          </h2>

          <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
            <span>Snapshot: {oldLines} lines</span>
            <span>·</span>
            <span>Current: {newLines} lines</span>
            <span>·</span>
            <span className={lineDiff > 0 ? "text-emerald-400" : lineDiff < 0 ? "text-red-400" : ""}>
              {lineDiff > 0 ? `+${lineDiff}` : lineDiff} lines
            </span>
          </div>

          {/* View toggle */}
          <div className="flex items-center rounded-md border border-[var(--studio-border)] bg-[var(--bg-surface)] p-0.5">
            <button
              onClick={() => setView("diff")}
              className={`rounded px-2 py-1 text-[10px] font-medium transition-colors ${
                view === "diff"
                  ? "bg-[var(--studio-accent)] text-[var(--text-on-accent)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              }`}
            >
              Inline Diff
            </button>
            <button
              onClick={() => setView("side-by-side")}
              className={`rounded px-2 py-1 text-[10px] font-medium transition-colors ${
                view === "side-by-side"
                  ? "bg-[var(--studio-accent)] text-[var(--text-on-accent)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              }`}
            >
              Side by Side
            </button>
          </div>

          {/* Test variants button */}
          {onTestVariants && (
            <button
              onClick={handleTest}
              className="flex items-center gap-1.5 rounded-md bg-[var(--studio-accent)] px-3 py-1.5 text-[10px] font-medium text-[var(--text-on-accent)] transition-colors hover:bg-[var(--studio-accent-hover)]"
            >
              <FlaskConical className="h-3 w-3" />
              Test Both
            </button>
          )}

          <button
            onClick={onClose}
            className="rounded p-1 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Diff editor */}
        <div className="flex-1 overflow-hidden">
          <DiffEditor
            original={snapshotLayoutMd}
            modified={currentLayoutMd}
            language="markdown"
            theme="vs-dark"
            options={{
              readOnly: true,
              renderSideBySide: view === "side-by-side",
              fontSize: 12,
              lineHeight: 18,
              minimap: { enabled: false },
              wordWrap: "on",
              scrollBeyondLastLine: false,
              renderIndicators: true,
              originalEditable: false,
            }}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[var(--studio-border)] px-6 py-2">
          <p className="text-[10px] text-[var(--text-muted)]">
            Left: snapshot (previous) · Right: current version
          </p>
          <button
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-xs text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
