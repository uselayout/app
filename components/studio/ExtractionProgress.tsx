"use client";

import { useEffect, useRef, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Loader2, Check, X, AlertTriangle } from "lucide-react";
import type { ExtractionStep, ExtractionStepStatus } from "@/lib/types";

interface ExtractionProgressProps {
  sourceName: string;
  sourceType: "figma" | "website";
  progress: number;
  steps: ExtractionStep[];
  error?: string | null;
  errorStep?: string | null;
  onRetry?: () => void;
  streamingContent?: string;
}

function StepIcon({ status }: { status: ExtractionStepStatus }) {
  switch (status) {
    case "complete":
      return <Check className="h-4 w-4 text-[var(--status-success)]" />;
    case "running":
      return <Loader2 className="h-4 w-4 animate-spin text-[var(--studio-accent)]" />;
    case "failed":
      return <X className="h-4 w-4 text-[var(--status-error)]" />;
    default:
      return <div className="h-4 w-4 rounded-full border border-[var(--studio-border-strong)]" />;
  }
}

function getErrorHelp(error: string): string | null {
  if (error.includes("401") || error.includes("Unauthorized")) {
    return "No API key set. Click the key icon in the top bar to add your Anthropic API key, then re-extract.";
  }
  if (error.includes("403") || error.includes("Forbidden")) {
    return "The access token may be invalid or expired. Generate a new one at figma.com/settings → Personal Access Tokens.";
  }
  if (error.includes("404") || error.includes("Not Found")) {
    return "The file was not found. Check the URL and ensure the file is shared with your account.";
  }
  if (error.includes("429") || error.includes("rate limit")) {
    return "Rate limited by the API. Wait a moment and try again.";
  }
  if (error.includes("timeout") || error.includes("ETIMEDOUT")) {
    return "The request timed out. Check your connection and try again.";
  }
  return null;
}

function StreamingPreview({ content }: { content: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [content]);

  const lines = content.split("\n");
  const displayLines = lines.slice(-20);

  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
        DESIGN.md
      </p>
      <div className="relative overflow-hidden rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)]">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-10 h-8 bg-gradient-to-b from-[var(--bg-surface)] to-transparent"
        />
        <div
          ref={scrollRef}
          className="h-[120px] overflow-hidden px-3 py-2 font-mono text-[10px] leading-relaxed text-[var(--text-muted)]"
        >
          {displayLines.map((line, i) => (
            <div key={i} className="whitespace-pre-wrap">
              {line || "\u00A0"}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ExtractionProgress({
  sourceName,
  sourceType,
  progress,
  steps,
  error,
  onRetry,
  streamingContent,
}: ExtractionProgressProps) {
  const startTimeRef = useRef(Date.now());
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const isGenerating = steps.some((s) => s.id === "generate" && s.status === "running");
  const showPreview = isGenerating && streamingContent && streamingContent.length > 0;

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-lg space-y-8 rounded-xl border border-[var(--studio-border)] bg-[var(--bg-panel)] p-8">
        <div className="space-y-2">
          <h2 className="text-lg font-medium text-[var(--text-primary)]">
            Extracting {sourceName} design system
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Source: {sourceType === "figma" ? "Figma" : "Website"}
          </p>
        </div>

        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-xs text-[var(--text-muted)]">
            <span>{Math.round(progress)}%</span>
            {progress < 100 && (
              <span>{elapsed}s elapsed &middot; typically 30-90s</span>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {steps.map((step) => (
            <div key={step.id} className="flex items-start gap-3">
              <div className="mt-0.5">
                <StepIcon status={step.status} />
              </div>
              <div className="flex-1">
                <span
                  className={`text-sm ${
                    step.status === "running"
                      ? "text-[var(--text-primary)]"
                      : step.status === "complete"
                        ? "text-[var(--text-secondary)]"
                        : step.status === "failed"
                          ? "text-[var(--status-error)]"
                          : "text-[var(--text-muted)]"
                  }`}
                >
                  {step.label}
                </span>
                {step.detail && (
                  <p className="text-xs text-[var(--text-muted)]">{step.detail}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {showPreview && (
          <StreamingPreview content={streamingContent} />
        )}

        {error && (
          <div className="space-y-3">
            {(() => {
              const errorHelp = getErrorHelp(error);
              return (
                <div className="flex items-start gap-2 rounded-md border border-[var(--status-error)]/20 bg-[var(--status-error)]/5 p-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--status-error)]" />
                  <div className="space-y-1">
                    <p className="text-sm text-[var(--text-primary)]">{error}</p>
                    {errorHelp && (
                      <p className="text-xs text-[var(--text-muted)]">
                        {errorHelp}
                      </p>
                    )}
                  </div>
                </div>
              );
            })()}
            {onRetry && (
              <button
                onClick={onRetry}
                className="w-full rounded-md bg-[var(--studio-accent)] px-4 py-2 text-sm text-[var(--text-on-accent)] transition-colors hover:bg-[var(--studio-accent-hover)]"
              >
                Retry
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
