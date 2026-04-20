"use client";

import { useMemo, useState, useCallback } from "react";
import {
  AlertTriangle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  X,
  Plus,
  Minus,
  EyeOff,
} from "lucide-react";
import type { ExtractionResult, ExtractedToken, TokenType } from "@/lib/types";
import type { ExtractedTokens } from "@/lib/types";
import {
  detectTokenDivergence,
  divergenceIsEmpty,
  type DivergentToken,
  type ValueDivergence,
  type TokenDivergenceReport,
} from "@/lib/tokens/detect-divergence";
import { isCuratedTokenName } from "@/lib/tokens/curated-filter";
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
  storageKey?: string;
}

type TypeTab = "all" | TokenType;

const TYPE_LABEL: Record<TokenType, string> = {
  color: "Colours",
  typography: "Typography",
  spacing: "Spacing",
  radius: "Radius",
  effect: "Effects",
  motion: "Motion",
};

const TYPE_ORDER: TokenType[] = ["color", "typography", "spacing", "radius", "effect", "motion"];

function normaliseName(name: string): string {
  return name.replace(/^--/, "");
}

/** Per-project localStorage-backed ignore list for divergence rows. */
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
  const [activeTab, setActiveTab] = useState<TypeTab>("all");
  const [showAll, setShowAll] = useState(false);

  const { ignoredCount, add: ignoreToken, clear: clearIgnored, isIgnored } =
    useIgnoreList(projectId);

  const rawReport = useMemo(
    () => detectTokenDivergence(layoutMd, extraction),
    [layoutMd, extraction]
  );

  const signature = useMemo(() => {
    const parts = [
      ...rawReport.tokensInMdNotInData.map((t) => `mdonly:${t.name}:${t.value}`),
      ...rawReport.tokensInDataNotInMd.map((t) => `dataonly:${t.name}:${t.value}`),
      ...rawReport.valueDivergences.map(
        (v) => `diff:${v.name}:${v.mdValue}:${v.dataValue}`
      ),
    ];
    return parts.sort().join("|");
  }, [rawReport]);

  /**
   * Apply the curated filter + ignore list. Tokens flagged as non-curated
   * only appear when `showAll` is on. Ignored tokens never appear.
   */
  const filteredReport = useMemo<TokenDivergenceReport>(() => {
    const keep = (name: string): boolean => {
      if (isIgnored(name)) return false;
      if (showAll) return true;
      return isCuratedTokenName(name);
    };
    return {
      tokensInMdNotInData: rawReport.tokensInMdNotInData.filter((d) => keep(d.name)),
      tokensInDataNotInMd: rawReport.tokensInDataNotInMd.filter((d) => keep(d.name)),
      valueDivergences: rawReport.valueDivergences.filter((v) => keep(v.name)),
    };
  }, [rawReport, showAll, isIgnored]);

  /** Report scoped to the active type tab. `all` is the full filtered report. */
  const scopedReport = useMemo<TokenDivergenceReport>(() => {
    if (activeTab === "all") return filteredReport;
    return {
      tokensInMdNotInData: filteredReport.tokensInMdNotInData.filter((t) => t.type === activeTab),
      tokensInDataNotInMd: filteredReport.tokensInDataNotInMd.filter((t) => t.type === activeTab),
      valueDivergences: filteredReport.valueDivergences.filter((v) => v.type === activeTab),
    };
  }, [filteredReport, activeTab]);

  /** Counts per tab label (including `all`). */
  const countsByType = useMemo(() => {
    const counts: Record<string, number> = { all: 0 };
    for (const t of filteredReport.tokensInMdNotInData) {
      counts[t.type] = (counts[t.type] ?? 0) + 1;
      counts.all++;
    }
    for (const t of filteredReport.tokensInDataNotInMd) {
      counts[t.type] = (counts[t.type] ?? 0) + 1;
      counts.all++;
    }
    for (const v of filteredReport.valueDivergences) {
      counts[v.type] = (counts[v.type] ?? 0) + 1;
      counts.all++;
    }
    return counts;
  }, [filteredReport]);

  /** Non-curated items still hidden (for the "Show all (N)" toggle label). */
  const nonCuratedHiddenCount = useMemo(() => {
    if (showAll) return 0;
    const count = (name: string) => !isCuratedTokenName(name) && !isIgnored(name);
    const a = rawReport.tokensInMdNotInData.filter((d) => count(d.name)).length;
    const b = rawReport.tokensInDataNotInMd.filter((d) => count(d.name)).length;
    const c = rawReport.valueDivergences.filter((v) => count(v.name)).length;
    return a + b + c;
  }, [rawReport, showAll, isIgnored]);

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
      const next = appendTokensToSections(layoutMd, [
        {
          name: token.name.replace(/^--/, ""),
          value: token.value,
          type: token.type,
          category: "semantic",
          cssVariable: token.name.startsWith("--") ? token.name : `--${token.name}`,
        },
      ]);
      updateLayoutMd(projectId, next);
    },
    [projectId, layoutMd, updateLayoutMd]
  );

  const removeFromExtraction = useCallback(
    (token: DivergentToken) => {
      if (!projectId) return;
      removeTokens(
        projectId,
        bucketForType(token.type),
        [token.name.replace(/^--/, "")],
        token.mode
      );
    },
    [projectId, removeTokens, bucketForType]
  );

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

  const bulkMergeScoped = useCallback(() => {
    if (!projectId) return;
    if (scopedReport.tokensInDataNotInMd.length === 0) return;
    const asExtractedTokens: ExtractedToken[] = scopedReport.tokensInDataNotInMd.map((t) => ({
      name: t.name.replace(/^--/, ""),
      value: t.value,
      type: t.type,
      category: "semantic" as const,
      cssVariable: t.name.startsWith("--") ? t.name : `--${t.name}`,
    }));
    const next = appendTokensToSections(layoutMd, asExtractedTokens);
    updateLayoutMd(projectId, next);
  }, [projectId, layoutMd, updateLayoutMd, scopedReport.tokensInDataNotInMd]);

  const bulkRemoveScoped = useCallback(() => {
    if (!projectId) return;
    let next = layoutMd;
    for (const t of scopedReport.tokensInMdNotInData) {
      next = removeTokenFromLayoutMd(next, { name: t.name });
    }
    updateLayoutMd(projectId, next);
  }, [projectId, layoutMd, updateLayoutMd, scopedReport.tokensInMdNotInData]);

  const bulkUseExtractionScoped = useCallback(() => {
    if (!projectId) return;
    let next = layoutMd;
    for (const d of scopedReport.valueDivergences) {
      const cssVar = d.name.startsWith("--") ? d.name : `--${d.name}`;
      const after = replaceTokenInLayoutMd(next, cssVar, d.dataValue);
      if (after !== null) next = after;
    }
    updateLayoutMd(projectId, next);
  }, [projectId, layoutMd, updateLayoutMd, scopedReport.valueDivergences]);

  if (!extraction) return null;
  if (divergenceIsEmpty(rawReport)) return null;
  if (signature === dismissedSignature) return null;

  const filteredTotal =
    filteredReport.tokensInMdNotInData.length +
    filteredReport.tokensInDataNotInMd.length +
    filteredReport.valueDivergences.length;

  // Everything is either ignored or non-curated → show a slim info bar only.
  if (filteredTotal === 0) {
    if (nonCuratedHiddenCount > 0) {
      return (
        <div className="border-b border-[var(--studio-border)] bg-[var(--bg-surface)] px-4 py-1.5 text-[10px] text-[var(--text-muted)]">
          {nonCuratedHiddenCount} non-curated divergence{nonCuratedHiddenCount === 1 ? "" : "s"} hidden.{" "}
          <button
            type="button"
            onClick={() => {
              setShowAll(true);
              setExpanded(true);
            }}
            className="underline hover:text-[var(--text-secondary)]"
          >
            Show all
          </button>
          {ignoredCount > 0 && (
            <>
              {" · "}
              {ignoredCount} ignored.{" "}
              <button
                type="button"
                onClick={clearIgnored}
                className="underline hover:text-[var(--text-secondary)]"
              >
                Unignore all
              </button>
            </>
          )}
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

  const availableTabs: TypeTab[] = [
    "all",
    ...TYPE_ORDER.filter((t) => (countsByType[t] ?? 0) > 0),
  ];

  return (
    <div
      className="border-b border-amber-500/40 bg-amber-500/10 px-4 py-2 text-xs text-[var(--text-primary)]"
      role="status"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangle size={14} className="text-[var(--status-warning)]" />
          <span>
            {filteredTotal} token{filteredTotal === 1 ? "" : "s"} in layout.md{" "}
            {filteredTotal === 1 ? "diverges" : "diverge"} from extraction data.
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
        <div className="mt-3 space-y-3 text-[var(--text-secondary)]">
          {/* Tabs */}
          <div className="flex flex-wrap items-center gap-1 border-b border-amber-500/30 pb-2">
            {availableTabs.map((tab) => {
              const isActive = activeTab === tab;
              const label = tab === "all" ? "All" : TYPE_LABEL[tab];
              const count = countsByType[tab] ?? 0;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                    isActive
                      ? "bg-[var(--bg-elevated)] text-[var(--text-primary)]"
                      : "text-[var(--text-secondary)] hover:bg-amber-500/10 hover:text-[var(--text-primary)]"
                  }`}
                >
                  {label}
                  <span className="ml-1.5 text-[var(--text-muted)]">{count}</span>
                </button>
              );
            })}
          </div>

          {/* Toolbar: show-all + ignored count */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-[var(--text-muted)]">
            <label className="flex cursor-pointer items-center gap-1.5">
              <input
                type="checkbox"
                checked={showAll}
                onChange={(e) => setShowAll(e.target.checked)}
                className="h-3 w-3"
              />
              <span>
                Show non-curated tokens
                {nonCuratedHiddenCount > 0 && !showAll && (
                  <span className="text-[var(--text-muted)]"> ({nonCuratedHiddenCount} hidden)</span>
                )}
              </span>
            </label>
            {ignoredCount > 0 && (
              <button
                type="button"
                onClick={clearIgnored}
                className="flex items-center gap-1 underline hover:text-[var(--text-secondary)]"
                title="Clear the project's ignore list"
              >
                <EyeOff size={10} />
                {ignoredCount} ignored · Unignore all
              </button>
            )}
          </div>

          {/* Severity-grouped sections for the scoped report */}
          {scopedReport.valueDivergences.length > 0 && (
            <SeveritySection
              icon={<AlertCircle size={12} className="text-[var(--status-error)]" />}
              heading="Value conflicts"
              description="Same token name, different values. Pick which side is right."
              count={scopedReport.valueDivergences.length}
              bulkAction={{
                label: `Use extraction for all ${scopedReport.valueDivergences.length}`,
                onClick: bulkUseExtractionScoped,
              }}
            >
              {scopedReport.valueDivergences.map((d) => (
                <DiffRow
                  key={`${d.name}:${d.mdValue}:${d.dataValue}`}
                  diff={d}
                  onUseLayoutMd={() => useLayoutMdValue(d)}
                  onUseExtraction={() => useExtractionValue(d)}
                  onIgnore={() => ignoreToken(d.name)}
                />
              ))}
            </SeveritySection>
          )}

          {scopedReport.tokensInDataNotInMd.length > 0 && (
            <SeveritySection
              icon={<Plus size={12} className="text-[var(--status-warning)]" />}
              heading="New from extraction"
              description="Tokens the extraction knows about that aren't in layout.md yet."
              count={scopedReport.tokensInDataNotInMd.length}
              bulkAction={{
                label: `Merge ${scopedReport.tokensInDataNotInMd.length} into layout.md`,
                onClick: bulkMergeScoped,
              }}
            >
              {scopedReport.tokensInDataNotInMd.map((t) => (
                <Row
                  key={`${t.name}:${t.value}`}
                  name={t.name}
                  value={t.value}
                  actions={[
                    { label: "Add to layout.md", onClick: () => addToLayoutMd(t) },
                    { label: "Remove from extraction", onClick: () => removeFromExtraction(t), variant: "secondary" },
                  ]}
                  onIgnore={() => ignoreToken(t.name)}
                />
              ))}
            </SeveritySection>
          )}

          {scopedReport.tokensInMdNotInData.length > 0 && (
            <SeveritySection
              icon={<Minus size={12} className="text-[var(--text-muted)]" />}
              heading="Removed upstream"
              description="Tokens referenced in layout.md that the extraction no longer knows about."
              count={scopedReport.tokensInMdNotInData.length}
              bulkAction={{
                label: `Remove ${scopedReport.tokensInMdNotInData.length} from layout.md`,
                onClick: bulkRemoveScoped,
              }}
            >
              {scopedReport.tokensInMdNotInData.map((t) => (
                <Row
                  key={`${t.name}:${t.value}`}
                  name={t.name}
                  value={t.value}
                  actions={[
                    { label: "Remove from layout.md", onClick: () => removeFromLayoutMd(t) },
                    { label: "Add to extraction", onClick: () => addToExtraction(t), variant: "secondary" },
                  ]}
                  onIgnore={() => ignoreToken(t.name)}
                />
              ))}
            </SeveritySection>
          )}
        </div>
      )}
    </div>
  );
}

function SeveritySection({
  icon,
  heading,
  description,
  count,
  bulkAction,
  children,
}: {
  icon: React.ReactNode;
  heading: string;
  description: string;
  count: number;
  bulkAction: { label: string; onClick: () => void };
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--text-primary)]">
            {icon}
            {heading}
            <span className="text-[var(--text-muted)]">{count}</span>
          </div>
          <div className="mt-0.5 text-[10px] text-[var(--text-muted)]">{description}</div>
        </div>
        <button
          type="button"
          onClick={bulkAction.onClick}
          className="shrink-0 rounded-md border border-transparent bg-[var(--status-warning)] px-2 py-1 text-[10px] font-medium text-white transition-opacity hover:opacity-90"
        >
          {bulkAction.label}
        </button>
      </div>
      <div className="max-h-60 space-y-1 overflow-y-auto rounded-md border border-[var(--studio-border)] bg-[var(--bg-surface)] p-2">
        {children}
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
  onIgnore,
}: {
  name: string;
  value: string;
  actions: RowAction[];
  onIgnore: () => void;
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
        <button
          type="button"
          onClick={onIgnore}
          className="flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
          title="Ignore this token on this project forever"
        >
          <EyeOff size={10} />
          Ignore
        </button>
      </div>
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
