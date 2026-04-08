"use client";

import { useEffect, useRef, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Loader2, Check, X, AlertTriangle, CheckCircle2, Info } from "lucide-react";
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
  warnings?: string[];
  /** Called when extraction is complete and user picks "Open Editor" (or auto-advance fires) */
  onOpenEditor?: () => void;
  /** Called when extraction is complete and user picks "Explore the Canvas" */
  onOpenCanvas?: () => void;
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
  if (error.includes("402") || error.includes("No credits") || error.includes("QUOTA_EXCEEDED")) {
    return "Out of free credits. Add your own Anthropic API key to continue. Go to Settings → API Keys.";
  }
  if (error.includes("500") || error.includes("generation failed")) {
    return "Generation failed. If this keeps happening, add your own Anthropic API key in Settings → API Keys.";
  }
  if (error.includes("API key") || error.includes("api_key")) {
    return "No API key configured. Add your Anthropic API key in Settings → API Keys to generate layout.md files.";
  }
  if (error.includes("401") || error.includes("Unauthorized")) {
    return "No API key set. Add your Anthropic API key in Settings → API Keys, then re-extract.";
  }
  if (error.includes("403") || error.includes("Forbidden")) {
    return "Check your Figma PAT has the required scopes: file_content:read, library_content:read, library_assets:read. Generate a new token at figma.com/settings → Personal Access Tokens.";
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
        layout.md
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

const AUTO_ADVANCE_SECONDS = 8;

function WhatsNextScreen({
  onOpenEditor,
  onOpenCanvas,
}: {
  onOpenEditor: () => void;
  onOpenCanvas: () => void;
}) {
  const [countdown, setCountdown] = useState(AUTO_ADVANCE_SECONDS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onOpenEditorRef = useRef(onOpenEditor);
  useEffect(() => {
    onOpenEditorRef.current = onOpenEditor;
  }, [onOpenEditor]);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          onOpenEditorRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function handleOpenEditor() {
    if (timerRef.current) clearInterval(timerRef.current);
    onOpenEditor();
  }

  function handleOpenCanvas() {
    if (timerRef.current) clearInterval(timerRef.current);
    onOpenCanvas();
  }

  return (
    <div className="flex flex-col items-center py-4">
      <CheckCircle2
        className="mx-auto mb-6 h-16 w-16"
        style={{ color: "#22c55e" }}
      />
      <h2 className="text-2xl font-semibold text-[var(--text-primary)] text-center">
        Your layout.md is ready
      </h2>
      <p className="text-sm text-[var(--text-secondary)] text-center mt-2 mb-8">
        Generate on-brand components using your extracted design system
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={handleOpenEditor}
          className="bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] border border-[var(--studio-border)] text-[var(--text-primary)] text-sm px-5 py-2 rounded-lg transition-all duration-[var(--duration-base)] ease-[cubic-bezier(0,0,0.2,1)]"
        >
          Open Editor
        </button>
        <button
          onClick={handleOpenCanvas}
          className="bg-[var(--studio-accent)] hover:bg-[var(--studio-accent-hover)] text-[var(--text-on-accent)] text-sm px-5 py-2 rounded-lg font-medium transition-all duration-[var(--duration-base)] ease-[cubic-bezier(0,0,0.2,1)]"
        >
          Explore Designs →
        </button>
      </div>
      <p className="text-[var(--text-muted)] text-xs text-center mt-4">
        Opening editor in {countdown}s…
      </p>
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
  warnings,
  onOpenEditor,
  onOpenCanvas,
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

  const allComplete =
    steps.length > 0 &&
    steps.every((s) => s.status === "complete") &&
    !error;

  const showWhatsNext = allComplete && (onOpenEditor != null || onOpenCanvas != null);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-lg space-y-8 rounded-xl border border-[var(--studio-border)] bg-[var(--bg-panel)] p-8">
        {showWhatsNext ? (
          <WhatsNextScreen
            onOpenEditor={onOpenEditor ?? (() => {})}
            onOpenCanvas={onOpenCanvas ?? (() => {})}
          />
        ) : (
          <>
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
                  <span>{elapsed >= 60 ? `${Math.floor(elapsed / 60)}m ${elapsed % 60}s` : `${elapsed}s`} elapsed &middot; typically 3-5 minutes</span>
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

            {warnings && warnings.length > 0 && (
              <div className="space-y-3 mt-4">
                {warnings.map((warning, i) => (
                  <div key={i} className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2">
                    <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <span className="text-xs text-amber-200">{warning}</span>
                  </div>
                ))}

                {warnings.some(w => w.includes("trimmed")) && (
                  <div className="rounded-md border border-[var(--studio-border)] bg-[var(--bg-surface)] px-4 py-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-[var(--text-secondary)] flex-shrink-0" />
                      <span className="text-xs font-medium text-[var(--text-primary)]">How to get the rest of your data</span>
                    </div>
                    <div className="text-xs text-[var(--text-secondary)] space-y-1.5 pl-6">
                      <p>Your core design tokens, typography, and components have been extracted. Your layout.md will still work well for AI coding.</p>
                      <p>To extract the missing data without losing what you have:</p>
                      <ol className="list-decimal pl-4 space-y-1">
                        <li>Open your Figma file and navigate to a specific page</li>
                        <li>Copy the page URL from your browser (it will include <code className="text-[var(--text-muted)] bg-[var(--bg-elevated)] px-1 rounded">?node-id=</code> in the URL)</li>
                        <li>Use the <strong>Re-extract</strong> button in the toolbar and paste the page URL</li>
                      </ol>
                      <p>Each page extraction will show a diff screen where you can review and accept new tokens before they are added to your existing layout.md.</p>
                    </div>
                  </div>
                )}
              </div>
            )}

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
          </>
        )}
      </div>
    </div>
  );
}
