"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, X } from "lucide-react";
import type { ExtractionResult } from "@/lib/types";
import {
  detectTokenDivergence,
  divergenceIsEmpty,
} from "@/lib/tokens/detect-divergence";

interface DivergenceBannerProps {
  layoutMd: string;
  extraction: ExtractionResult | undefined | null;
  storageKey?: string;
}

/**
 * Amber banner shown above the Monaco editor when layout.md and the
 * structured extractionData disagree (stale token in markdown, missing
 * token in markdown, or mismatched value). Dismissible per project;
 * re-appears when a new divergence is detected.
 */
export function DivergenceBanner({
  layoutMd,
  extraction,
  storageKey,
}: DivergenceBannerProps) {
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
                Review
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="rounded p-1 text-[var(--text-muted)] hover:bg-amber-500/20 hover:text-[var(--text-primary)]"
            title="Dismiss"
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-2 space-y-2 text-[var(--text-secondary)]">
          {report.tokensInMdNotInData.length > 0 && (
            <Section
              heading="In layout.md but missing from extraction"
              items={report.tokensInMdNotInData.map(
                (t) => `${t.name}: ${t.value}`
              )}
            />
          )}
          {report.tokensInDataNotInMd.length > 0 && (
            <Section
              heading="In extraction but not in layout.md"
              items={report.tokensInDataNotInMd.map(
                (t) => `${t.name}: ${t.value}`
              )}
            />
          )}
          {report.valueDivergences.length > 0 && (
            <Section
              heading="Values differ"
              items={report.valueDivergences.map(
                (v) => `${v.name}: layout.md=${v.mdValue} · extraction=${v.dataValue}`
              )}
            />
          )}
        </div>
      )}
    </div>
  );
}

function Section({
  heading,
  items,
}: {
  heading: string;
  items: string[];
}) {
  return (
    <div>
      <div className="font-medium text-[var(--text-primary)]">{heading}</div>
      <ul className="mt-1 max-h-32 overflow-y-auto text-[10px] leading-relaxed text-[var(--text-muted)]">
        {items.slice(0, 20).map((item, i) => (
          <li key={i} className="font-mono">
            {item}
          </li>
        ))}
        {items.length > 20 && (
          <li className="italic">… and {items.length - 20} more</li>
        )}
      </ul>
    </div>
  );
}
