"use client";

import { useMemo, useState, useCallback } from "react";
import { AlertCircle, ChevronDown, ChevronUp, X, EyeOff } from "lucide-react";
import type { ExtractionResult, TokenType } from "@/lib/types";
import type { ExtractedTokens } from "@/lib/types";
import {
  detectTokenDivergence,
  divergenceIsEmpty,
  type ValueDivergence,
} from "@/lib/tokens/detect-divergence";
import { useProjectStore } from "@/lib/store/project";
import { replaceTokenInLayoutMd } from "@/lib/tokens/replace-token";

interface DivergenceBannerProps {
  layoutMd: string;
  extraction: ExtractionResult | undefined | null;
  storageKey?: string;
}

function normaliseName(name: string): string {
  return name.replace(/^--/, "");
}

/** Per-project localStorage-backed ignore list for recurring value conflicts. */
function useIgnoreList(projectId: string | undefined) {
  const storageKey = projectId ? `divergence-ignore:${projectId}` : null;
  const [ignored, setIgnored] = useState<Set<string>>(() => {
    if (typeof window === "undefined" || !storageKey) return new Set();
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return new Set();
      const arr = JSON.parse(raw);
      return new Set(Array.isArray(arr) ? (arr as string[]) : []);
    } catch {
      return new Set();
    }
  });

  const persist = useCallback(
    (next: Set<string>) => {
      if (typeof window === "undefined" || !storageKey) return;
      try {
        window.localStorage.setItem(storageKey, JSON.stringify([...next]));
      } catch {
        /* quota exhausted, non-fatal */
      }
    },
    [storageKey]
  );

  const add = useCallback(
    (name: string) => {
      setIgnored((prev) => {
        const next = new Set(prev);
        next.add(normaliseName(name));
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const clear = useCallback(() => {
    setIgnored(() => {
      const next = new Set<string>();
      persist(next);
      return next;
    });
  }, [persist]);

  const isIgnored = useCallback(
    (name: string) => ignored.has(normaliseName(name)),
    [ignored]
  );

  return { ignoredCount: ignored.size, add, clear, isIgnored };
}

/**
 * Banner that surfaces value conflicts between layout.md and the structured
 * extraction — cases where the user edited a token value in one place but
 * not the other. Rare and actionable; typically 0–3 items.
 *
 * "New tokens found in extraction" and "stale tokens in layout.md" are
 * intentionally NOT shown here. The extraction captures a superset of what
 * the curated layout.md documents, and that's correct — surfacing every
 * delta produced a 100+ item amber wall of noise. Per-token add actions
 * live in the Source Panel instead.
 */
export function DivergenceBanner({
  layoutMd,
  extraction,
  storageKey,
}: DivergenceBannerProps) {
  const projectId = storageKey;
  const updateLayoutMd = useProjectStore((s) => s.updateLayoutMd);
  const updateToken = useProjectStore((s) => s.updateToken);

  const [dismissedSignature, setDismissedSignature] = useState<string | null>(
    () => {
      if (typeof window === "undefined" || !storageKey) return null;
      return window.localStorage.getItem(`divergence-dismissed:${storageKey}`);
    }
  );
  const [expanded, setExpanded] = useState(false);

  const { ignoredCount, add: ignoreToken, clear: clearIgnored, isIgnored } =
    useIgnoreList(projectId);

  const rawReport = useMemo(
    () => detectTokenDivergence(layoutMd, extraction),
    [layoutMd, extraction]
  );

  const conflicts = useMemo(
    () => rawReport.valueDivergences.filter((v) => !isIgnored(v.name)),
    [rawReport, isIgnored]
  );

  const signature = useMemo(() => {
    const parts = rawReport.valueDivergences.map(
      (v) => `${v.name}:${v.mdValue}:${v.dataValue}`
    );
    return parts.sort().join("|");
  }, [rawReport]);

  const bucketForType = useCallback((type: TokenType): keyof ExtractedTokens => {
    switch (type) {
      case "color": return "colors";
      case "typography": return "typography";
      case "spacing": return "spacing";
      case "radius": return "radius";
      case "effect": return "effects";
      case "motion": return "motion";
    }
  }, []);

  const useLayoutMdValue = useCallback(
    (diff: ValueDivergence) => {
      if (!projectId) return;
      updateToken(
        projectId,
        bucketForType(diff.type),
        diff.name.replace(/^--/, ""),
        diff.mdValue,
        diff.mode
      );
    },
    [projectId, updateToken, bucketForType]
  );

  const useExtractionValue = useCallback(
    (diff: ValueDivergence) => {
      if (!projectId) return;
      const cssVar = diff.name.startsWith("--") ? diff.name : `--${diff.name}`;
      const next = replaceTokenInLayoutMd(layoutMd, cssVar, diff.dataValue);
      if (next !== null) updateLayoutMd(projectId, next);
    },
    [projectId, layoutMd, updateLayoutMd]
  );

  const bulkUseExtraction = useCallback(() => {
    if (!projectId) return;
    let next = layoutMd;
    for (const d of conflicts) {
      const cssVar = d.name.startsWith("--") ? d.name : `--${d.name}`;
      const after = replaceTokenInLayoutMd(next, cssVar, d.dataValue);
      if (after !== null) next = after;
    }
    updateLayoutMd(projectId, next);
  }, [projectId, layoutMd, updateLayoutMd, conflicts]);

  if (!extraction) return null;
  if (divergenceIsEmpty(rawReport)) return null;
  if (signature === dismissedSignature) return null;
  if (conflicts.length === 0) {
    // Everything is ignored. Show a slim unignore hint instead of disappearing.
    if (ignoredCount > 0) {
      return (
        <div className="border-b border-[var(--studio-border)] bg-[var(--bg-surface)] px-4 py-1.5 text-[10px] text-[var(--text-muted)]">
          {ignoredCount} value conflict{ignoredCount === 1 ? "" : "s"} ignored.{" "}
          <button
            type="button"
            onClick={clearIgnored}
            className="underline hover:text-[var(--text-secondary)]"
          >
            Unignore all
          </button>
        </div>
      );
    }
    return null;
  }

  const handleDismiss = () => {
    setDismissedSignature(signature);
    if (typeof window !== "undefined" && storageKey) {
      window.localStorage.setItem(`divergence-dismissed:${storageKey}`, signature);
    }
  };

  return (
    <div
      className="border-b border-amber-500/40 bg-amber-500/10 px-4 py-2 text-xs text-[var(--text-primary)]"
      role="status"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <AlertCircle size={14} className="text-[var(--status-error)]" />
          <span>
            {conflicts.length} token{conflicts.length === 1 ? "" : "s"} {conflicts.length === 1 ? "has" : "have"} different values in layout.md vs extraction.
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[var(--text-secondary)] hover:bg-amber-500/20 hover:text-[var(--text-primary)]"
          >
            {expanded ? (
              <>
                <ChevronUp size={12} />
                Hide
              </>
            ) : (
              <>
                <ChevronDown size={12} />
                Review
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="rounded p-1 text-[var(--text-muted)] hover:bg-amber-500/20 hover:text-[var(--text-primary)]"
            title="Dismiss until next change"
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 space-y-2 text-[var(--text-secondary)]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-[10px] text-[var(--text-muted)]">
              Pick which side is right for each token, or use the extraction value for all.
            </div>
            <div className="flex items-center gap-2">
              {ignoredCount > 0 && (
                <button
                  type="button"
                  onClick={clearIgnored}
                  className="flex items-center gap-1 text-[10px] text-[var(--text-muted)] underline hover:text-[var(--text-secondary)]"
                >
                  <EyeOff size={10} />
                  {ignoredCount} ignored · Unignore all
                </button>
              )}
              {conflicts.length > 1 && (
                <button
                  type="button"
                  onClick={bulkUseExtraction}
                  className="shrink-0 rounded-md border border-transparent bg-[var(--status-warning)] px-2 py-1 text-[10px] font-medium text-white transition-opacity hover:opacity-90"
                >
                  Use extraction for all {conflicts.length}
                </button>
              )}
            </div>
          </div>

          <div className="max-h-60 space-y-1 overflow-y-auto rounded-md border border-[var(--studio-border)] bg-[var(--bg-surface)] p-2">
            {conflicts.map((d) => (
              <DiffRow
                key={`${d.name}:${d.mdValue}:${d.dataValue}`}
                diff={d}
                onUseLayoutMd={() => useLayoutMdValue(d)}
                onUseExtraction={() => useExtractionValue(d)}
                onIgnore={() => ignoreToken(d.name)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DiffRow({
  diff,
  onUseLayoutMd,
  onUseExtraction,
  onIgnore,
}: {
  diff: ValueDivergence;
  onUseLayoutMd: () => void;
  onUseExtraction: () => void;
  onIgnore: () => void;
}) {
  return (
    <div className="group space-y-1 rounded px-2 py-1.5 text-[11px] hover:bg-[var(--bg-hover)]">
      <div className="flex items-center justify-between gap-2">
        <code className="font-mono text-[var(--text-secondary)]">{diff.name}</code>
        <button
          type="button"
          onClick={onIgnore}
          className="flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] text-[var(--text-muted)] opacity-0 transition-opacity hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] group-hover:opacity-100"
          title="Ignore this token on this project forever"
        >
          <EyeOff size={10} />
          Ignore
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2 pl-2">
        <div className="flex items-center gap-1 text-[10px]">
          <span className="text-[var(--text-muted)]">layout.md:</span>
          <code className="font-mono text-[var(--text-primary)]" title={diff.mdValue}>
            {diff.mdValue.length > 30 ? diff.mdValue.slice(0, 30) + "…" : diff.mdValue}
          </code>
          <button
            type="button"
            onClick={onUseLayoutMd}
            className="rounded px-1.5 py-0.5 text-[10px] text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
          >
            Use
          </button>
        </div>
        <div className="flex items-center gap-1 text-[10px]">
          <span className="text-[var(--text-muted)]">extraction:</span>
          <code className="font-mono text-[var(--text-primary)]" title={diff.dataValue}>
            {diff.dataValue.length > 30 ? diff.dataValue.slice(0, 30) + "…" : diff.dataValue}
          </code>
          <button
            type="button"
            onClick={onUseExtraction}
            className="rounded bg-[var(--studio-accent)] px-1.5 py-0.5 text-[10px] text-[var(--text-on-accent)] hover:bg-[var(--studio-accent-hover)]"
          >
            Use
          </button>
        </div>
      </div>
    </div>
  );
}
