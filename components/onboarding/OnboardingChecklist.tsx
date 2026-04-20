"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Check, Circle, Copy, CheckCheck } from "lucide-react";
import {
  useOnboardingStore,
  type StepKey,
} from "@/lib/store/onboarding";
import {
  PHASE_LABELS,
  groupStepsByPhase,
  getVisibleSteps,
  type StepDef,
} from "@/lib/onboarding/steps";
import { useKeyStatus } from "@/lib/hooks/use-api-key";
import { useProjectStore } from "@/lib/store/project";
import { useMounted } from "@/lib/hooks/use-mounted";
import { copyToClipboard } from "@/lib/util/copy-to-clipboard";

const CLI_COMMAND = "npx @layoutdesign/context install";

interface OnboardingChecklistProps {
  onOpenApiKeyModal: () => void;
  onClose?: () => void;
  firstProjectId?: string;
  orgSlug: string;
}

export function OnboardingChecklist({
  onOpenApiKeyModal,
  onClose,
  firstProjectId,
  orgSlug,
}: OnboardingChecklistProps) {
  const mounted = useMounted();
  const steps = useOnboardingStore((s) => s.steps);
  const markStep = useOnboardingStore((s) => s.markStep);

  const keyStatus = useKeyStatus();
  const anyPluginPushed = useProjectStore((s) =>
    s.projects.some((p) => !!p.pluginTokensPushedAt)
  );
  const hasWebsiteProject = useProjectStore((s) =>
    s.projects.some((p) => p.sourceType === "website")
  );
  const hasFigmaProject = useProjectStore((s) =>
    s.projects.some((p) => p.sourceType === "figma")
  );
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (keyStatus.hasAnthropicKey && !steps.apiKeyAdded) markStep("apiKeyAdded");
    if (keyStatus.hasFigmaKey && !steps.figmaTokenAdded) markStep("figmaTokenAdded");
    if (keyStatus.hasGoogleKey && !steps.geminiKeyAdded) markStep("geminiKeyAdded");
    if (anyPluginPushed && !steps.figmaPluginInstalled) markStep("figmaPluginInstalled");
  }, [
    keyStatus,
    anyPluginPushed,
    steps.apiKeyAdded,
    steps.figmaTokenAdded,
    steps.geminiKeyAdded,
    steps.figmaPluginInstalled,
    markStep,
  ]);

  if (!mounted) return null;

  const visibleSteps = getVisibleSteps({ hasWebsiteProject, hasFigmaProject });
  const grouped = groupStepsByPhase(visibleSteps);

  const handleCopy = async () => {
    const ok = await copyToClipboard(CLI_COMMAND);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const goAfter = (fn?: () => void) => () => {
    fn?.();
    onClose?.();
  };

  const renderCta = (def: StepDef): ReactNode => {
    if (steps[def.key]) return null;

    switch (def.key) {
      case "apiKeyAdded":
      case "figmaTokenAdded":
      case "geminiKeyAdded":
        return <GoButton onClick={goAfter(onOpenApiKeyModal)}>Add key</GoButton>;

      case "extracted":
        return (
          <GoLink href={`/${orgSlug}?new=true`} onClick={onClose}>
            Extract now
          </GoLink>
        );

      case "viewedLayoutMd":
        return firstProjectId ? (
          <GoLink
            href={`/${orgSlug}/projects/${firstProjectId}/studio`}
            onClick={onClose}
          >
            Open studio
          </GoLink>
        ) : (
          <GoLink href={`/${orgSlug}?new=true`} onClick={onClose}>
            Extract first
          </GoLink>
        );

      case "generatedVariant":
        return firstProjectId ? (
          <GoLink
            href={`/${orgSlug}/projects/${firstProjectId}/studio?view=explore`}
            onClick={onClose}
          >
            Open Explore
          </GoLink>
        ) : null;

      case "componentSaved":
        return firstProjectId ? (
          <GoLink
            href={`/${orgSlug}/projects/${firstProjectId}/studio?view=explore`}
            onClick={onClose}
          >
            Generate a variant
          </GoLink>
        ) : null;

      case "cliInstalled":
        return (
          <div className="flex flex-wrap items-center gap-2">
            <code className="font-mono text-[11px] bg-[var(--bg-app)] border border-[var(--studio-border)] px-2 py-1 rounded-[var(--studio-radius-sm)] text-[var(--text-secondary)]">
              {CLI_COMMAND}
            </code>
            <button
              onClick={handleCopy}
              aria-label="Copy install command"
              className="flex items-center justify-center rounded-[var(--studio-radius-sm)] border border-[var(--studio-border)] bg-[var(--bg-surface)] p-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-all duration-[var(--duration-base)]"
            >
              {copied ? <CheckCheck className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            </button>
            <MarkDoneButton onClick={() => markStep("cliInstalled")}>
              Mark as done
            </MarkDoneButton>
          </div>
        );

      case "figmaPluginInstalled":
        return (
          <div className="flex flex-wrap items-center gap-2">
            <GoLink
              href="/docs/figma-plugin"
              onClick={() => {
                markStep("readDocs");
                onClose?.();
              }}
            >
              Open instructions
            </GoLink>
            <MarkDoneButton onClick={() => markStep("figmaPluginInstalled")}>
              Mark as done
            </MarkDoneButton>
          </div>
        );

      case "extensionInstalled":
        return (
          <div className="flex flex-wrap items-center gap-2">
            <GoLink
              href="/docs/chrome-extension"
              onClick={() => {
                markStep("readDocs");
                onClose?.();
              }}
            >
              Open instructions
            </GoLink>
            <MarkDoneButton onClick={() => markStep("extensionInstalled")}>
              Mark as done
            </MarkDoneButton>
          </div>
        );

      case "readDocs":
        return (
          <GoLink
            href="/docs"
            onClick={() => {
              markStep("readDocs");
              onClose?.();
            }}
          >
            Open docs
          </GoLink>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {grouped.map(({ phase, steps: phaseSteps }) => (
        <div key={phase} className="flex flex-col gap-1">
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            {PHASE_LABELS[phase]}
          </div>
          <ul className="flex flex-col">
            {phaseSteps.map((def) => (
              <ChecklistRow
                key={def.key}
                def={def}
                complete={steps[def.key]}
                cta={renderCta(def)}
              />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function ChecklistRow({
  def,
  complete,
  cta,
}: {
  def: StepDef;
  complete: boolean;
  cta: ReactNode;
}) {
  return (
    <li
      className="group flex items-start gap-3 rounded-[var(--studio-radius-md)] px-3 py-3 transition-all duration-[var(--duration-base)] ease-[cubic-bezier(0,0,0.2,1)] hover:bg-[var(--bg-hover)]"
      aria-current={complete ? undefined : "step"}
    >
      <span
        className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center"
        role="checkbox"
        aria-checked={complete}
        aria-disabled="true"
      >
        {complete ? (
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[var(--studio-accent)]">
            <Check
              className="h-2.5 w-2.5"
              style={{ color: "var(--text-on-accent)" }}
              aria-hidden="true"
            />
          </span>
        ) : (
          <Circle
            className="h-4 w-4"
            style={{ color: "var(--studio-border-strong)" }}
            strokeWidth={1.5}
            aria-hidden="true"
          />
        )}
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span
          className={
            complete
              ? "text-sm font-medium text-[var(--text-muted)]"
              : "text-sm font-medium text-[var(--text-primary)]"
          }
        >
          {def.label}
        </span>
        {!complete && (
          <>
            <span className="text-xs text-[var(--text-secondary)]">
              {def.description}
            </span>
            {cta && <div className="mt-1">{cta}</div>}
          </>
        )}
      </div>
    </li>
  );
}

function GoButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-[var(--studio-radius-sm)] bg-[var(--studio-accent)] px-2.5 py-1 text-xs font-medium text-[var(--text-on-accent)] transition-all duration-[var(--duration-base)] ease-[cubic-bezier(0,0,0.2,1)] hover:bg-[var(--studio-accent-hover)]"
    >
      {children}
      <ArrowRight className="h-3 w-3" />
    </button>
  );
}

function GoLink({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-[var(--studio-radius-sm)] border border-[var(--studio-border)] bg-[var(--bg-surface)] px-2.5 py-1 text-xs font-medium text-[var(--text-primary)] transition-all duration-[var(--duration-base)] ease-[cubic-bezier(0,0,0.2,1)] hover:bg-[var(--bg-hover)]"
    >
      {children}
      <ArrowRight className="h-3 w-3" />
    </Link>
  );
}

function MarkDoneButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center rounded-[var(--studio-radius-sm)] border border-[var(--studio-border)] bg-transparent px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)] transition-all duration-[var(--duration-base)] ease-[cubic-bezier(0,0,0.2,1)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
    >
      {children}
    </button>
  );
}

export function useOnboardingProgress(): {
  completed: number;
  total: number;
  requiredDone: boolean;
} {
  const steps = useOnboardingStore((s) => s.steps);
  const hasWebsiteProject = useProjectStore((s) =>
    s.projects.some((p) => p.sourceType === "website")
  );
  const hasFigmaProject = useProjectStore((s) =>
    s.projects.some((p) => p.sourceType === "figma")
  );

  const visibleSteps = getVisibleSteps({ hasWebsiteProject, hasFigmaProject });
  const total = visibleSteps.length;
  const completed = visibleSteps.reduce(
    (sum, def) => sum + (steps[def.key as StepKey] ? 1 : 0),
    0
  );
  const requiredDone = visibleSteps
    .filter((d) => !d.optional)
    .every((d) => steps[d.key as StepKey]);
  return { completed, total, requiredDone };
}
