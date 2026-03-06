"use client";

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
}

function StepIcon({ status }: { status: ExtractionStepStatus }) {
  switch (status) {
    case "complete":
      return <Check className="h-4 w-4 text-[--status-success]" />;
    case "running":
      return <Loader2 className="h-4 w-4 animate-spin text-[--studio-accent]" />;
    case "failed":
      return <X className="h-4 w-4 text-[--status-error]" />;
    default:
      return <div className="h-4 w-4 rounded-full border border-[--studio-border-strong]" />;
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

export function ExtractionProgress({
  sourceName,
  sourceType,
  progress,
  steps,
  error,
  onRetry,
}: ExtractionProgressProps) {
  const estimatedSeconds = Math.max(0, Math.round(((100 - progress) / 100) * 60));

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-lg space-y-8 rounded-xl border border-[--studio-border] bg-[--bg-panel] p-8">
        <div className="space-y-2">
          <h2 className="text-lg font-medium text-[--text-primary]">
            Extracting {sourceName} design system
          </h2>
          <p className="text-sm text-[--text-secondary]">
            Source: {sourceType === "figma" ? "Figma" : "Website"}
          </p>
        </div>

        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-xs text-[--text-muted]">
            <span>{Math.round(progress)}%</span>
            {progress < 100 && (
              <span>~{estimatedSeconds}s remaining</span>
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
                      ? "text-[--text-primary]"
                      : step.status === "complete"
                        ? "text-[--text-secondary]"
                        : step.status === "failed"
                          ? "text-[--status-error]"
                          : "text-[--text-muted]"
                  }`}
                >
                  {step.label}
                </span>
                {step.detail && (
                  <p className="text-xs text-[--text-muted]">{step.detail}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div className="space-y-3">
            {(() => {
              const errorHelp = getErrorHelp(error);
              return (
                <div className="flex items-start gap-2 rounded-md border border-[--status-error]/20 bg-[--status-error]/5 p-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[--status-error]" />
                  <div className="space-y-1">
                    <p className="text-sm text-[--text-primary]">{error}</p>
                    {errorHelp && (
                      <p className="text-xs text-[--text-muted]">
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
                className="w-full rounded-md bg-[--studio-accent] px-4 py-2 text-sm text-[--text-on-accent] transition-colors hover:bg-[--studio-accent-hover]"
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
