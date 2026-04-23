"use client";

import { useState, useCallback } from "react";
import { Clock, RotateCcw, Trash2, ChevronDown, Diff } from "lucide-react";
import type { DesignSystemSnapshot } from "@/lib/types";
import { useProjectStore } from "@/lib/store/project";

interface SnapshotManagerProps {
  projectId: string;
  snapshots: DesignSystemSnapshot[];
  currentLayoutMd: string;
  onCompare?: (snapshotLayoutMd: string, currentLayoutMd: string) => void;
}

export function SnapshotManager({
  projectId,
  snapshots,
  currentLayoutMd,
  onCompare,
}: SnapshotManagerProps) {
  const restoreSnapshot = useProjectStore((s) => s.restoreSnapshot);
  const deleteSnapshot = useProjectStore((s) => s.deleteSnapshot);
  const createSnapshot = useProjectStore((s) => s.createSnapshot);
  const [expanded, setExpanded] = useState(false);
  const [confirmRestore, setConfirmRestore] = useState<string | null>(null);

  const handleRestore = useCallback(
    (snapshotId: string) => {
      restoreSnapshot(projectId, snapshotId);
      setConfirmRestore(null);
    },
    [projectId, restoreSnapshot]
  );

  const handleCreateManual = useCallback(() => {
    createSnapshot(projectId, `Manual save (${new Date().toLocaleDateString("en-GB")})`);
  }, [projectId, createSnapshot]);

  if (snapshots.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--studio-border)] bg-[var(--bg-surface)] px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-[var(--text-secondary)]">Version History</p>
            <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">
              Snapshots are created automatically before re-extraction and standardisation changes.
            </p>
          </div>
          <button
            onClick={handleCreateManual}
            className="shrink-0 rounded-md bg-[var(--bg-elevated)] px-3 py-1.5 text-[10px] font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
          >
            Save Snapshot
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)]">
      {/* Header */}
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left"
      >
        <Clock className="h-3.5 w-3.5 text-[var(--text-muted)]" />
        <span className="flex-1 text-xs font-medium text-[var(--text-secondary)]">
          Version History
        </span>
        <span className="rounded-full bg-[var(--bg-hover)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-muted)]">
          {snapshots.length}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-[var(--text-muted)] transition-transform ${
            expanded ? "" : "-rotate-90"
          }`}
        />
      </button>

      {expanded && (
        <div className="border-t border-[var(--studio-border)] px-4 py-3 space-y-2">
          {/* Create manual snapshot */}
          <button
            onClick={handleCreateManual}
            className="w-full rounded-md border border-dashed border-[var(--studio-border)] px-3 py-2 text-[10px] font-medium text-[var(--text-muted)] transition-colors hover:border-[var(--studio-border-strong)] hover:text-[var(--text-secondary)]"
          >
            + Save Current State
          </button>

          {/* Snapshot list (newest first) */}
          {[...snapshots].reverse().map((snap) => (
            <div
              key={snap.id}
              className="flex items-center gap-3 rounded-md bg-[var(--bg-elevated)] px-3 py-2"
            >
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-medium text-[var(--text-secondary)] truncate">
                  {snap.label}
                </p>
                <p className="text-[9px] text-[var(--text-muted)]">
                  {new Date(snap.createdAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {" · "}
                  {snap.tokenCount} tokens
                  {snap.healthScore !== undefined && ` · ${snap.healthScore}% health`}
                </p>
              </div>

              {/* Compare button */}
              {onCompare && (
                <button
                  onClick={() => onCompare(snap.layoutMd, currentLayoutMd)}
                  className="shrink-0 rounded p-1 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                  title="Compare with current"
                >
                  <Diff className="h-3.5 w-3.5" />
                </button>
              )}

              {/* Restore button */}
              {confirmRestore === snap.id ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleRestore(snap.id)}
                    className="rounded bg-amber-500/20 px-2 py-0.5 text-[9px] font-medium text-amber-300 hover:bg-amber-500/30 transition-colors"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setConfirmRestore(null)}
                    className="rounded px-2 py-0.5 text-[9px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmRestore(snap.id)}
                  className="shrink-0 rounded p-1 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                  title="Restore this snapshot"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              )}

              {/* Delete button */}
              <button
                onClick={() => deleteSnapshot(projectId, snap.id)}
                className="shrink-0 rounded p-1 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-hover)] hover:text-red-400"
                title="Delete snapshot"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
