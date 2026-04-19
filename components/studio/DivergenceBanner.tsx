"use client";

import { useMemo, useState, useCallback } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, X, Sparkles, Loader2 } from "lucide-react";
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
  removeTokenFromLayoutMd,
} from "@/lib/tokens/add-remove-token";
import { replaceTokenInLayoutMd } from "@/lib/tokens/replace-token";
import { getStoredApiKey } from "@/lib/hooks/use-api-key";

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

  const bulkAddAllToLayoutMd = useCallback(() => {
    if (!projectId) return;
    let next = layoutMd;
    for (const t of report.tokensInDataNotInMd) {
      const cssVar = t.name.startsWith("--") ? t.name : `--${t.name}`;
      next = addTokenToLayoutMd(next, {
        name: t.name.replace(/^--/, ""),
        value: t.value,
        type: t.type,
        category: "semantic",
        cssVariable: cssVar,
      });
    }
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

  // AI-backed bulk merge for `in extraction but not in layout.md`. Sends the
  // tokens plus the current layout.md to Claude, which returns a rewritten
  // file with each token placed in its correct section (typography in §3,
  // effects in §7, gradients get their own sub-block in §2, etc.) along
  // with short semantic descriptions. Falls back to dumb append on error.
  const [aiBulkState, setAiBulkState] = useState<"idle" | "loading" | "error">("idle");
  const [aiBulkError, setAiBulkError] = useState<string | null>(null);

  const aiBulkAddAllToLayoutMd = useCallback(async () => {
    if (!projectId) return;
    if (report.tokensInDataNotInMd.length === 0) return;

    setAiBulkState("loading");
    setAiBulkError(null);

    const tokensForPrompt = report.tokensInDataNotInMd
      .map((t) => {
        const cssVar = t.name.startsWith("--") ? t.name : `--${t.name}`;
        return `- ${cssVar}: ${t.value} [${t.type}${t.mode ? `, mode:${t.mode}` : ""}]`;
      })
      .join("\n");

    const instruction = `Merge the following extracted tokens into the correct sections of this layout.md. Rules:

- Place each token in the section matching its type:
  - color → Section 2 (Colour System). If a token's value is a linear-/radial-gradient, group them into a "Gradients" sub-block within Section 2.
  - typography → Section 3 (Typography System). Font metrics like ascent/descent/units-per-em belong here as a "Font Metrics" sub-block.
  - spacing → Section 4 (Spacing & Layout).
  - radius → Section 4 or wherever radius tokens already live.
  - effect → Section 7 (Elevation & Depth).
  - motion → Section 8 (Motion).
- If a section doesn't exist, create it in the right position.
- For each token, add a short one-line usage comment explaining when to use it, inferred from its name and value.
- Do NOT touch sections, tokens, or prose that aren't related to the tokens being added.
- Do NOT re-add any tokens that are already present in the file.
- Use the existing naming conventions and formatting (fenced css blocks, table styles, heading levels).

Tokens to add (${report.tokensInDataNotInMd.length} total):

${tokensForPrompt}`;

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      const apiKey = getStoredApiKey();
      if (apiKey) headers["X-Api-Key"] = apiKey;

      const res = await fetch("/api/generate/edit-layout-md", {
        method: "POST",
        headers,
        body: JSON.stringify({ instruction, layoutMd }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(errBody.error || `Request failed (${res.status})`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");
      const decoder = new TextDecoder();
      let accumulated = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        // Progressive update so the editor shows the rewrite as it streams.
        updateLayoutMd(projectId, accumulated);
      }

      if (accumulated.startsWith("\n\n[Error:")) {
        throw new Error(accumulated);
      }

      setAiBulkState("idle");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "AI merge failed";
      console.error("AI divergence resolve failed:", err);
      setAiBulkError(msg);
      setAiBulkState("error");
      // Don't fall back automatically — let the user choose to dump.
    }
  }, [projectId, layoutMd, updateLayoutMd, report.tokensInDataNotInMd]);

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
          <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400" />
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
              description="Tokens the AI knows about that aren't documented in layout.md. Merging with AI places each in the correct section (typography → §3, effects → §7, gradients as their own sub-block in §2) with short usage descriptions."
              primaryBulkAction={{
                label:
                  aiBulkState === "loading"
                    ? `Merging ${report.tokensInDataNotInMd.length}…`
                    : `Merge ${report.tokensInDataNotInMd.length} with AI`,
                icon:
                  aiBulkState === "loading" ? (
                    <Loader2 size={11} className="animate-spin" />
                  ) : (
                    <Sparkles size={11} />
                  ),
                onClick: aiBulkAddAllToLayoutMd,
                disabled: aiBulkState === "loading",
              }}
              secondaryBulkAction={{
                label: "Dump without AI",
                onClick: bulkAddAllToLayoutMd,
              }}
              statusNote={
                aiBulkState === "error"
                  ? `AI merge failed: ${aiBulkError}. Try "Dump without AI" as a fallback.`
                  : aiBulkState === "loading"
                    ? "Rewriting layout.md — the editor will update progressively."
                    : null
              }
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
  primaryBulkAction,
  secondaryBulkAction,
  statusNote,
}: {
  heading: string;
  description: string;
  bulkAction?: { label: string; onClick: () => void };
  primaryBulkAction?: { label: string; icon?: React.ReactNode; onClick: () => void; disabled?: boolean };
  secondaryBulkAction?: { label: string; onClick: () => void };
  statusNote?: string | null;
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
          {secondaryBulkAction && (
            <button
              type="button"
              onClick={secondaryBulkAction.onClick}
              className="rounded-md border border-[var(--studio-border)] bg-[var(--bg-surface)] px-2 py-1 text-[10px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
              title="Dump tokens into the CORE TOKENS block without AI rewrite"
            >
              {secondaryBulkAction.label}
            </button>
          )}
          {primaryBulkAction && (
            <button
              type="button"
              onClick={primaryBulkAction.onClick}
              disabled={primaryBulkAction.disabled}
              className="flex items-center gap-1 rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-[10px] font-medium text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {primaryBulkAction.icon}
              {primaryBulkAction.label}
            </button>
          )}
          {!primaryBulkAction && bulkAction && (
            <button
              type="button"
              onClick={bulkAction.onClick}
              className="rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-[10px] font-medium text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 transition-colors"
            >
              {bulkAction.label}
            </button>
          )}
        </div>
      </div>
      {statusNote && (
        <div className="text-[10px] text-[var(--text-muted)]">{statusNote}</div>
      )}
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
