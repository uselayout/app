'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { Check, X, ChevronDown, ChevronRight, Lightbulb, FileText, Wand2, Loader2 } from 'lucide-react';
import { analyseCompleteness } from '@/lib/health/completeness';
import { getStoredApiKey } from '@/lib/hooks/use-api-key';
import { toast } from 'sonner';
import type { CompletenessReport, SectionScore } from '@/lib/health/completeness';

interface CompletenessPanelProps {
  layoutMd: string;
  onLayoutMdChange?: (value: string) => void;
  projectId?: string;
  orgId?: string;
  className?: string;
}

function scoreColour(score: number): string {
  if (score >= 70) return 'text-emerald-400';
  if (score >= 40) return 'text-amber-400';
  return 'text-red-400';
}

function scoreBarColour(score: number): string {
  if (score >= 70) return 'bg-emerald-400';
  if (score >= 40) return 'bg-amber-400';
  return 'bg-red-400';
}

function scoreStrokeColour(score: number): string {
  if (score >= 70) return '#34d399'; // emerald-400
  if (score >= 40) return '#fbbf24'; // amber-400
  return '#f87171'; // red-400
}

const CIRCLE_RADIUS = 36;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;

interface CircleScoreProps {
  score: number;
}

function CircleScore({ score }: CircleScoreProps) {
  const strokeColour = scoreStrokeColour(score);
  const dashOffset = CIRCLE_CIRCUMFERENCE - (score / 100) * CIRCLE_CIRCUMFERENCE;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative inline-flex items-center justify-center">
        <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
          {/* Track */}
          <circle
            cx="48"
            cy="48"
            r={CIRCLE_RADIUS}
            fill="none"
            stroke="var(--studio-border)"
            strokeWidth="6"
          />
          {/* Progress */}
          <circle
            cx="48"
            cy="48"
            r={CIRCLE_RADIUS}
            fill="none"
            stroke={strokeColour}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={CIRCLE_CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 0.4s cubic-bezier(0.0, 0.0, 0.2, 1)' }}
          />
        </svg>
        <span
          className={`absolute text-2xl font-semibold tabular-nums ${scoreColour(score)}`}
          style={{ fontFamily: 'var(--font-geist-sans, sans-serif)' }}
        >
          {score}
        </span>
      </div>
      <p className="text-xs text-[var(--text-muted)]">Quality score</p>
    </div>
  );
}

interface SectionRowProps {
  section: SectionScore;
}

function SectionRow({ section }: SectionRowProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-[var(--studio-border)] rounded-md overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full flex items-center gap-3 px-3 py-2.5 bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] transition-all duration-[150ms] ease-[cubic-bezier(0,0,0.2,1)] text-left"
        aria-expanded={expanded}
      >
        <span className="text-[var(--text-muted)] flex-shrink-0">
          {expanded ? (
            <ChevronDown size={14} />
          ) : (
            <ChevronRight size={14} />
          )}
        </span>

        <span className="flex-1 text-sm text-[var(--text-primary)] font-medium truncate">
          {section.section}
        </span>

        <span className={`text-xs tabular-nums font-semibold flex-shrink-0 ${scoreColour(section.score)}`}>
          {section.score}
        </span>

        {/* Score bar */}
        <div className="w-20 h-1.5 rounded-full bg-[var(--bg-elevated)] flex-shrink-0 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-[150ms] ease-[cubic-bezier(0,0,0.2,1)] ${scoreBarColour(section.score)}`}
            style={{ width: `${section.score}%` }}
          />
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 pt-2 bg-[var(--bg-panel)] flex flex-col gap-1.5">
          {section.found.map((item) => (
            <div key={item} className="flex items-start gap-2">
              <Check size={13} className="text-emerald-400 flex-shrink-0 mt-0.5" />
              <span className="text-xs text-[var(--text-secondary)] leading-snug">{item}</span>
            </div>
          ))}
          {section.missing.map((item) => (
            <div key={item} className="flex items-start gap-2">
              <X size={13} className="text-red-400 flex-shrink-0 mt-0.5" />
              <span className="text-xs text-[var(--text-muted)] leading-snug">{item}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function buildFixInstruction(report: CompletenessReport): string {
  const lines: string[] = [];

  for (const section of report.sections) {
    if (section.missing.length === 0) continue;

    const isMissing = section.missing[0]?.startsWith(`Section "${section.section}" not found`);
    if (isMissing) {
      lines.push(`Generate a complete "${section.section}" section with:`);
    } else {
      lines.push(`Add missing content for the "${section.section}" section:`);
    }

    for (const missing of section.missing) {
      if (!missing.startsWith("Section ")) {
        lines.push(`- ${missing}`);
      }
    }
    lines.push("");
  }

  return lines.join("\n");
}

export function CompletenessPanel({ layoutMd, onLayoutMdChange, projectId, orgId, className = '' }: CompletenessPanelProps) {
  const [report, setReport] = useState<CompletenessReport | null>(null);
  const [fixStatus, setFixStatus] = useState<string | null>(null);

  const trimmed = useMemo(() => layoutMd.trim(), [layoutMd]);

  useEffect(() => {
    if (!trimmed) {
      setReport(null);
      return;
    }
    const result = analyseCompleteness(trimmed);
    setReport(result);
  }, [trimmed]);

  const handleAutoFix = useCallback(async () => {
    if (!report || !onLayoutMdChange) return;
    setFixStatus("Connecting...");

    // Save current version before AI overwrites it
    if (projectId && orgId && layoutMd.trim()) {
      fetch(`/api/organizations/${orgId}/projects/${projectId}/layout-md-versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ layoutMd, source: "manual" }),
      }).catch(() => {});
    }

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      const apiKey = getStoredApiKey();
      if (apiKey) headers["X-Api-Key"] = apiKey;

      const instruction = buildFixInstruction(report);
      const res = await fetch("/api/generate/fix-layout-md", {
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
        const lineCount = accumulated.split("\n").length;
        setFixStatus(`Adding... ${lineCount} lines`);
      }

      if (accumulated.startsWith("\n\n[Error:")) {
        throw new Error(accumulated);
      }

      const newContent = accumulated.replace(/^```(?:markdown|md)?\n?/, "").replace(/\n?```$/, "").trim();
      if (!newContent) {
        toast.error("Auto-fix produced no changes. Try editing manually.");
      } else {
        // Append new content to existing layout.md
        const updatedMd = layoutMd.trimEnd() + "\n\n" + newContent;
        onLayoutMdChange(updatedMd);
        // Re-analyse immediately so the score updates
        setReport(analyseCompleteness(updatedMd.trim()));
        toast.success("layout.md improved — new content added");
      }
    } catch (err) {
      console.error("[CompletenessPanel] Auto-fix error:", err);
      const msg = err instanceof Error ? err.message : "Auto-fix failed";
      toast.error(msg);
    } finally {
      setFixStatus(null);
    }
  }, [report, layoutMd, onLayoutMdChange]);

  if (!trimmed) {
    return (
      <div className={`flex flex-col items-center justify-center gap-3 py-12 px-4 ${className}`}>
        <FileText size={32} className="text-[var(--text-muted)]" />
        <p className="text-sm text-[var(--text-muted)] text-center">
          No layout.md generated yet
        </p>
        <p className="text-xs text-[var(--text-muted)] text-center max-w-[200px]">
          Generate a layout.md to see the quality score and improvement suggestions.
        </p>
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className={`flex flex-col gap-5 p-4 ${className}`}>
      {/* Circular score */}
      <div className="flex justify-center pt-1">
        <CircleScore score={report.totalScore} />
      </div>

      {/* Section scores */}
      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] px-0.5">
          Sections
        </h3>
        <div className="flex flex-col gap-1.5">
          {report.sections.map((section) => (
            <SectionRow key={section.section} section={section} />
          ))}
        </div>
      </div>

      {/* Suggestions */}
      {report.suggestions.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] px-0.5">
            Suggestions
          </h3>
          <div className="flex flex-col gap-1.5">
            {report.suggestions.map((suggestion) => (
              <div
                key={suggestion}
                className="flex items-start gap-2.5 px-3 py-2 rounded-md bg-[var(--bg-surface)] border border-[var(--studio-border)]"
              >
                <Lightbulb
                  size={13}
                  className="text-[var(--studio-accent)] flex-shrink-0 mt-0.5"
                />
                <span className="text-xs text-[var(--text-secondary)] leading-snug">{suggestion}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Auto-fix button */}
      {report.totalScore < 100 && onLayoutMdChange && (
        <button
          type="button"
          onClick={handleAutoFix}
          disabled={fixStatus !== null}
          className="flex items-center justify-center gap-2 w-full px-3 py-2.5 rounded-md bg-[var(--studio-accent)] text-[var(--text-on-accent)] text-xs font-semibold hover:bg-[var(--studio-accent-hover)] transition-all duration-[150ms] ease-[cubic-bezier(0,0,0.2,1)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {fixStatus ? (
            <>
              <Loader2 size={13} className="animate-spin" />
              {fixStatus}
            </>
          ) : (
            <>
              <Wand2 size={13} />
              Fix all issues
            </>
          )}
        </button>
      )}
    </div>
  );
}
