"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { Check, Circle, X, Copy, CheckCheck } from "lucide-react";
import { useOnboardingStore } from "@/lib/store/onboarding";
import { copyToClipboard } from "@/lib/util/copy-to-clipboard";

const MCP_COMMAND = "npx @layoutdesign/context install";

interface OnboardingChecklistProps {
  onOpenExtraction: () => void;
  onOpenApiKeyModal: () => void;
  firstProjectId?: string;
  orgSlug: string;
}

export function OnboardingChecklist({
  onOpenExtraction,
  onOpenApiKeyModal,
  firstProjectId,
  orgSlug,
}: OnboardingChecklistProps) {
  const { _hasHydrated, dismissed, steps, markStep, dismiss, allStepsComplete } =
    useOnboardingStore();

  const [isByok, setIsByok] = useState(false);
  const [copied, setCopied] = useState(false);
  const [celebrating, setCelebrating] = useState(false);

  // Detect BYOK on client only (localStorage not available during SSR)
  useEffect(() => {
    setIsByok(!!localStorage.getItem("sd_anthropic_key"));
  }, []);

  // Celebrate + auto-dismiss when all steps complete
  useEffect(() => {
    if (allStepsComplete() && !dismissed) {
      setCelebrating(true);
      const timer = setTimeout(() => {
        dismiss();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [steps, allStepsComplete, dismissed, dismiss]);

  if (!_hasHydrated) return null;
  if (dismissed && !celebrating) return null;

  const handleCopy = async () => {
    const ok = await copyToClipboard(MCP_COMMAND);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Build the visible steps list
  type StepKey = keyof typeof steps;

  interface StepDef {
    key: StepKey;
    label: string;
    description?: string;
    renderCta?: () => ReactNode;
  }

  const allStepDefs: StepDef[] = [
    ...(isByok
      ? [
          {
            key: "apiKeyAdded" as StepKey,
            label: "Add your API key",
            renderCta: () =>
              !steps.apiKeyAdded ? (
                <div className="flex flex-col gap-1 mt-1">
                  <button
                    onClick={onOpenApiKeyModal}
                    className="self-start text-xs px-2.5 py-1 rounded-md bg-[var(--studio-accent)] text-[var(--text-on-accent)] hover:bg-[var(--studio-accent-hover)] border border-transparent transition-all duration-[var(--duration-base)] ease-[cubic-bezier(0,0,0.2,1)]"
                  >
                    Add key
                  </button>
                  <span className="text-[var(--text-muted)] text-xs">
                    Stored locally in your browser. Never sent to our servers.
                  </span>
                </div>
              ) : null,
          },
        ]
      : []),
    {
      key: "extracted",
      label: "Extract a design system",
      renderCta: () =>
        !steps.extracted ? (
          <button
            onClick={onOpenExtraction}
            className="self-start text-xs px-2.5 py-1 rounded-md bg-[var(--studio-accent)] text-[var(--text-on-accent)] hover:bg-[var(--studio-accent-hover)] border border-transparent transition-all duration-[var(--duration-base)] ease-[cubic-bezier(0,0,0.2,1)] mt-1"
          >
            Extract now
          </button>
        ) : null,
    },
    {
      key: "viewedDesignMd",
      label: "Review your DESIGN.md",
      renderCta: () =>
        !steps.viewedDesignMd && firstProjectId ? (
          <Link
            href={`/${orgSlug}/projects/${firstProjectId}/studio`}
            className="self-start text-xs px-2.5 py-1 rounded-md bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--studio-border)] transition-all duration-[var(--duration-base)] ease-[cubic-bezier(0,0,0.2,1)] mt-1 inline-block"
          >
            Open studio
          </Link>
        ) : null,
    },
    {
      key: "installedMcp",
      label: "Try it in Claude Code",
      renderCta: () =>
        !steps.installedMcp ? (
          <div className="flex flex-col gap-2 mt-1">
            <div className="flex items-center gap-2">
              <code className="font-mono text-xs bg-[var(--bg-elevated)] px-2 py-1 rounded text-[var(--text-secondary)]">
                {MCP_COMMAND}
              </code>
              <button
                onClick={handleCopy}
                aria-label="Copy command"
                className="text-xs px-2 py-1 rounded-md bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--studio-border)] transition-all duration-[var(--duration-base)] ease-[cubic-bezier(0,0,0.2,1)] flex items-center gap-1"
              >
                {copied ? (
                  <CheckCheck className="w-3 h-3" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            </div>
            <button
              onClick={() => markStep("installedMcp")}
              className="self-start text-xs px-2.5 py-1 rounded-md bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--studio-border)] transition-all duration-[var(--duration-base)] ease-[cubic-bezier(0,0,0.2,1)]"
            >
              Mark as done
            </button>
          </div>
        ) : null,
    },
    {
      key: "generatedVariant",
      label: "Explore the Canvas",
    },
  ];

  const completedCount = allStepDefs.filter((s) => steps[s.key]).length;
  const totalCount = allStepDefs.length;

  if (celebrating) {
    return (
      <div className="bg-[var(--bg-surface)] border border-[var(--studio-border)] rounded-lg p-5 flex items-center justify-center">
        <span className="text-[var(--text-primary)] text-sm font-medium">
          You&apos;re all set! 🎉
        </span>
      </div>
    );
  }

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--studio-border)] rounded-lg p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[var(--text-primary)] font-medium text-sm">
              Get started
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[var(--text-muted)] text-xs">
                {completedCount}/{totalCount}
              </span>
              <button
                onClick={dismiss}
                aria-label="Dismiss checklist"
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm transition-all duration-[var(--duration-base)] ease-[cubic-bezier(0,0,0.2,1)] leading-none"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          {/* Progress bar */}
          <div className="bg-[var(--bg-elevated)] rounded-full h-1">
            <div
              className="bg-[var(--studio-accent)] rounded-full h-1 transition-all duration-[var(--duration-base)] ease-[cubic-bezier(0,0,0.2,1)]"
              style={{ width: `${(completedCount / totalCount) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="flex flex-col">
        {allStepDefs.map((stepDef) => {
          const complete = steps[stepDef.key];
          return (
            <div key={stepDef.key} className="flex items-start gap-3 py-2">
              {/* Icon */}
              <div className="mt-0.5 shrink-0">
                {complete ? (
                  <Check
                    className="w-4 h-4"
                    style={{ color: "var(--studio-accent)" }}
                    aria-hidden="true"
                  />
                ) : (
                  <Circle
                    className="w-4 h-4"
                    style={{ color: "var(--text-muted)" }}
                    aria-hidden="true"
                  />
                )}
              </div>

              {/* Content */}
              <div className="flex flex-col min-w-0">
                <span
                  className={
                    complete
                      ? "text-[var(--text-muted)] line-through text-sm"
                      : "text-[var(--text-primary)] text-sm"
                  }
                >
                  {stepDef.label}
                </span>
                {!complete && stepDef.renderCta && stepDef.renderCta()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
