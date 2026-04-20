"use client";

import { useMemo, useState, useCallback } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, X } from "lucide-react";
import type { ExtractionResult, ExtractedToken, TokenType } from "@/lib/types";
import type { ExtractedTokens } from "@/lib/types";
import {
  detectTokenDivergence,
  divergenceIsEmpty,
  type DivergentToken,
  type ValueDivergence,
} from "@/lib/tokens/detect-divergence";
import { useProjectStore } from "@/lib/store/project";
import {
  addTokenToLayoutMd,
  appendTokensToSections,
  removeTokenFromLayoutMd,
} from "@/lib/tokens/add-remove-token";
import { replaceTokenInLayoutMd } from "@/lib/tokens/replace-token";

interface DivergenceBannerProps {
  layoutMd: string;
  extraction: ExtractionResult | undefined | null;
  /** Project id used as localStorage dismissal key and store-action target. */
  storageKey?: string;
}

/**
 * Amber banner shown above the Monaco editor when layout.md and the
 * structured extractionData disagree. Dismissible per project; re-appears
 * when a new divergence is detected.
 *
 * Every row is actionable: users can add missing tokens to layout.md,
 * remove stale tokens from layout.md, or pick which side of a value
 * conflict to keep. Bulk actions at each section header let them resolve
 * all divergences in a section at once.
 */
export function DivergenceBanner({
  layoutMd,
  extraction,
  storageKey,
}: DivergenceBannerProps) {
  const projectId = storageKey;
  const updateLayoutMd = useProjectStore((s) => s.updateLayoutMd);
  const addToken = useProjectStore((s) => s.addToken);
  const removeTokens = useProjectStore((s) => s.removeTokens);
  const updateToken = useProjectStore((s) => s.updateToken);

  const [dismissedSignature, setDismissedSignature] = useState<string | null>(
    () => {
      if (typeof window === "undefined" || !storageKey) return null;
      return window.localStorage.getItem(`divergence-dismissed:${storageKey}`);
    }
  );
  const [expanded, setExpanded] = useState(false);

  const report = useMemo(
    () => detectTokenDivergence(layoutMd, extraction),
    [layoutMd, extraction]
  );

  const signature = useMemo(() => {
    const parts = [
      ...report.tokensInMdNotInData.map((t) => `mdonly:${t.name}:${t.value}`),
      ...report.tokensInDataNotInMd.map((t) => `dataonly:${t.name}:${t.value}`),
      ...report.valueDivergences.map(
        (v) => `diff:${v.name}:${v.mdValue}:${v.dataValue}`
      ),
    ];
    return parts.sort().join("|");
  }, [report]);

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

  const removeFromLayoutMd = useCallback(
    (token: { name: string }) => {
      if (!projectId) return;
      const next = removeTokenFromLayoutMd(layoutMd, { name: token.name });
      updateLayoutMd(projectId, next);
    },
    [projectId, layoutMd, updateLayoutMd]
  );

  const addToExtraction = useCallback(
    (token: DivergentToken) => {
      if (!projectId) return;
      const newToken: ExtractedToken = {
        name: token.name.replace(/^--/, ""),
        value: token.value,
        type: token.type,
        category: "semantic",
        cssVariable: token.name.startsWith("--") ? token.name : `--${token.name}`,
        ...(token.mode ? { mode: token.mode } : {}),
      };
      addToken(projectId, newToken);
    },
    [projectId, addToken]
  );

  const addToLayoutMd = useCallback(
    (token: DivergentToken) => {
      if (!projectId) return;
      const newToken: ExtractedToken = {
        name: token.name.replace(/^--/, ""),
        value: token.value,
        type: token.type,
        category: "semantic",
        cssVariable: token.name.startsWith("--") ? token.name : `--${token.name}`,
      };
      const next = addTokenToLayoutMd(layoutMd, newToken);
      updateLayoutMd(projectId, next);
    },
    [projectId, layoutMd, updateLayoutMd]
  );

  const removeFromExtraction = useCallback(
    (token: DivergentToken) => {
      if (!projectId) return;
      removeTokens(projectId, bucketForType(token.type), [token.name.replace(/^--/, "")], token.mode);
    },
    [projectId, removeTokens, bucketForType]
  );

  const useLayoutMdValue = useCallback(
    (diff: ValueDivergence) => {
      if (!projectId) return;
      updateToken(projectId, bucketForType(diff.type), diff.name.replace(/^--/, ""), diff.mdValue, diff.mode);
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

  const bulkRemoveFromLayoutMd = useCallback(() => {
    if (!projectId) return;
    let next = layoutMd;
    for (const t of report.tokensInMdNotInData) {
      next = removeTokenFromLayoutMd(next, { name: t.name });
    }
    updateLayoutMd(projectId, next);
  }, [projectId, layoutMd, updateLayoutMd, report.tokensInMdNotInData]);

  // Section-aware programmatic merge. Places each token in the CSS block
  // of its type's section (colour \u2192 \u00a72, typography \u2192 \u00a73, spacing/radius \u2192 \u00a74,
  // effect \u2192 \u00a77, motion \u2192 \u00a78). Tokens whose section is absent fall back
  // to CORE TOKENS. Instant, deterministic, no AI.
  const mergeAllIntoLayoutMd = useCallback(() => {
    if (!projectId) return;
    if (report.tokensInDataNotInMd.length === 0) return;
    const asExtractedTokens: ExtractedToken[] = report.tokensInDataNotInMd.map((t) => ({
      name: t.name.replace(/^--/, ""),
      value: t.value,
      type: t.type,
      category: "semantic" as const,
      cssVariable: t.name.startsWith("--") ? t.name : `--${t.name}`,
    }));
    const next = appendTokensToSections(layoutMd, asExtractedTokens);
    updateLayoutMd(projectId, next);
  }, [projectId, layoutMd, updateLayoutMd, report.tokensInDataNotInMd]);

  const bulkUseExtractionForAllDiffs = useCallback(() => {
    if (!projectId) return;
    let next = layoutMd;
    for (const d of report.valueDivergences) {
      const cssVar = d.name.startsWith("--") ? d.name : `--${d.name}`;
      const after = replaceTokenInLayoutMd(next, cssVar, d.dataValue);
      if (after !== null) next = after;
    }
    updateLayoutMd(projectId, next);
  }, [projectId, layoutMd, updateLayoutMd, report.valueDivergences]);

  if (!extraction) return null;
  if (divergenceIsEmpty(report)) return null;
  if (signature === dismissedSignature) return null;

  const total =
    report.tokensInMdNotInData.length +
    report.tokensInDataNotInMd.length +
    report.valueDivergences.length;

  const handleDismiss = () => {
    setDismissedSignature(signature);
    if (typeof window !== "undefined" && storageKey) {
      window.localStorage.setItem(
        `divergence-dismissed:${storageKey}`,
        signature
      );
    }
  };

  return (
    <div
      className="border-b border-amber-500/40 bg-amber-500/10 px-4 py-2 text-xs text-[var(--text-primary)]"
      role="status"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangle size={14} className="text-[var(--status-warning)]" />
          <span>
            {total} token{total === 1 ? "" : "s"} in layout.md{" "}
            {total === 1 ? "diverges" : "diverge"} from extraction data.
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
                Review & fix
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
        <div className="mt-3 space-y-4 text-[var(--text-secondary)]">
          {report.tokensInMdNotInData.length > 0 && (
            <ActionableSection
              heading="In layout.md but missing from extraction"
              description="These are likely stale references the extraction no longer knows about. Either remove them from layout.md or register them in extraction so they round-trip."
              bulkAction={{
                label: `Remove all ${report.tokensInMdNotInData.length} from layout.md`,
                onClick: bulkRemoveFromLayoutMd,
              }}
              items={report.tokensInMdNotInData}
              renderItem={(t) => (
                <Row
                  key={`${t.name}:${t.value}`}
                  name={t.name}
                  value={t.value}
                  actions={[
                    { label: "Remove from layout.md", onClick: () => removeFromLayoutMd(t) },
                    { label: "Add to extraction", onClick: () => addToExtraction(t), variant: "secondary" },
                  ]}
                />
              )}
            />
          )}

          {report.tokensInDataNotInMd.length > 0 && (
            <ActionableSection
              heading="In extraction but not in layout.md"
              description="Tokens that aren't documented in layout.md yet. Merging places each in the correct section (colour → §2, typography → §3, spacing → §4, effects → §7, motion → §8)."
              bulkAction={{
                label: `Merge ${report.tokensInDataNotInMd.length} into layout.md`,
                onClick: mergeAllIntoLayoutMd,
              }}
              items={report.tokensInDataNotInMd}
              renderItem={(t) => (
                <Row
                  key={`${t.name}:${t.value}`}
                  name={t.name}
                  value={t.value}
                  actions={[
                    { label: "Add to layout.md", onClick: () => addToLayoutMd(t) },
                    { label: "Remove from extraction", onClick: () => removeFromExtraction(t), variant: "secondary" },
                  ]}
                />
              )}
            />
          )}

          {report.valueDivergences.length > 0 && (
            <ActionableSection
              heading="Values differ"
              description="Same token name but different values. Pick which side is right."
              bulkAction={{
                label: `Use extraction value for all ${report.valueDivergences.length}`,
                onClick: bulkUseExtractionForAllDiffs,
              }}
              items={report.valueDivergences}
              renderItem={(d) => (
                <DiffRow
                  key={`${d.name}:${d.mdValue}:${d.dataValue}`}
                  diff={d}
                  onUseLayoutMd={() => useLayoutMdValue(d)}
                  onUseExtraction={() => useExtractionValue(d)}
                />
              )}
            />
          )}
        </div>
      )}
    </div>
  );
}

function ActionableSection<T>({
  heading,
  description,
  bulkAction,
  items,
  renderItem,
}: {
  heading: string;
  description: string;
  bulkAction?: { label: string; onClick: () => void };
  items: T[];
  renderItem: (item: T) => React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[11px] font-medium text-[var(--text-primary)]">{heading}</div>
          <div className="mt-0.5 text-[10px] text-[var(--text-muted)]">{description}</div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {bulkAction && (
            <button
              type="button"
              onClick={bulkAction.onClick}
              className="rounded-md border border-transparent bg-[var(--status-warning)] px-2 py-1 text-[10px] font-medium text-white hover:opacity-90 transition-opacity"
            >
              {bulkAction.label}
            </button>
          )}
        </div>
      </div>
      <div className="max-h-60 space-y-1 overflow-y-auto rounded-md border border-[var(--studio-border)] bg-[var(--bg-surface)] p-2">
        {items.slice(0, 50).map((item) => renderItem(item))}
        {items.length > 50 && (
          <div className="px-2 py-1 text-[10px] italic text-[var(--text-muted)]">
            … and {items.length - 50} more. Use the bulk action above to resolve them all.
          </div>
        )}
      </div>
    </div>
  );
}

interface RowAction {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary";
}

function Row({
  name,
  value,
  actions,
}: {
  name: string;
  value: string;
  actions: RowAction[];
}) {
  return (
    <div className="group flex items-center gap-3 rounded px-2 py-1 text-[11px] hover:bg-[var(--bg-hover)]">
      <code className="shrink-0 font-mono text-[var(--text-secondary)]">{name}</code>
      <code className="min-w-0 flex-1 truncate font-mono text-[10px] text-[var(--text-muted)]" title={value}>
        {value}
      </code>
      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        {actions.map((a, i) => (
          <button
            key={i}
            type="button"
            onClick={a.onClick}
            className={`rounded px-1.5 py-0.5 text-[10px] transition-colors ${
              a.variant === "secondary"
                ? "text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                : "bg-[var(--studio-accent)] text-[var(--text-on-accent)] hover:bg-[var(--studio-accent-hover)]"
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function DiffRow({
  diff,
  onUseLayoutMd,
  onUseExtraction,
}: {
  diff: ValueDivergence;
  onUseLayoutMd: () => void;
  onUseExtraction: () => void;
}) {
  return (
    <div className="group space-y-1 rounded px-2 py-1.5 text-[11px] hover:bg-[var(--bg-hover)]">
      <code className="block font-mono text-[var(--text-secondary)]">{diff.name}</code>
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
