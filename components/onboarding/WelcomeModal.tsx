"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useOnboardingStore } from "@/lib/store/onboarding";
import {
  OnboardingChecklist,
  useOnboardingProgress,
} from "@/components/onboarding/OnboardingChecklist";
import { ApiKeyModal } from "@/components/shared/ApiKeyModal";

interface WelcomeModalProps {
  firstProjectId?: string;
  orgSlug: string;
}

export function WelcomeModal({ firstProjectId, orgSlug }: WelcomeModalProps) {
  const _hasHydrated = useOnboardingStore((s) => s._hasHydrated);
  const modalOpen = useOnboardingStore((s) => s.modalOpen);
  const closeModal = useOnboardingStore((s) => s.closeModal);
  const dismiss = useOnboardingStore((s) => s.dismiss);
  const { completed, total, requiredDone } = useOnboardingProgress();

  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);

  useEffect(() => {
    if (requiredDone && modalOpen) {
      const t = setTimeout(() => dismiss(), 4000);
      return () => clearTimeout(t);
    }
  }, [requiredDone, modalOpen, dismiss]);

  if (!_hasHydrated) return null;

  return (
    <>
      <Dialog
        open={modalOpen}
        onOpenChange={(open) => {
          if (!open) closeModal();
        }}
      >
        <DialogContent
          showCloseButton
          className="max-w-[640px] border-[var(--studio-border)] bg-[var(--bg-elevated)] p-0 sm:max-w-[640px]"
        >
          <div className="flex max-h-[85vh] flex-col">
            {/* Header */}
            <div className="flex flex-col gap-2 px-8 pt-8">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Welcome to Layout
              </div>
              <h2 className="text-[22px] font-semibold leading-tight text-[var(--text-primary)]">
                {requiredDone ? "You're all set." : "Let's get you set up."}
              </h2>
              <p className="max-w-[500px] text-sm text-[var(--text-secondary)]">
                {requiredDone
                  ? "Everything's wired up. Keep exploring, or close this to dismiss."
                  : "Turn any Figma file or website into context your AI coding agent understands. Work through these steps to feel the full loop."}
              </p>
              <a
                href="https://www.youtube.com/@layoutdesign"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex w-fit items-center gap-1.5 text-xs text-[var(--text-secondary)] underline decoration-[var(--studio-border-strong)] underline-offset-4 transition-colors hover:text-[var(--text-primary)]"
              >
                Watch a 90-second overview
              </a>

              {/* Progress */}
              <div className="mt-5 flex items-center gap-3">
                <div className="h-1 flex-1 rounded-full bg-[var(--bg-app)]">
                  <div
                    className="h-1 rounded-full bg-[var(--studio-accent)] transition-all duration-[var(--duration-base)] ease-[cubic-bezier(0,0,0.2,1)]"
                    style={{ width: `${(completed / total) * 100}%` }}
                  />
                </div>
                <span className="shrink-0 font-mono text-xs tabular-nums text-[var(--text-muted)]">
                  {completed} of {total}
                </span>
              </div>
            </div>

            {/* Scrollable checklist */}
            <div className="flex-1 overflow-y-auto px-5 py-6">
              <OnboardingChecklist
                onOpenApiKeyModal={() => setApiKeyModalOpen(true)}
                onClose={closeModal}
                firstProjectId={firstProjectId}
                orgSlug={orgSlug}
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-[var(--studio-border)] px-8 py-4">
              <button
                onClick={dismiss}
                className="text-xs font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
              >
                Skip for now
              </button>
              <button
                onClick={closeModal}
                className="rounded-[var(--studio-radius-md)] bg-[var(--studio-accent)] px-4 py-2 text-xs font-medium text-[var(--text-on-accent)] transition-all duration-[var(--duration-base)] ease-[cubic-bezier(0,0,0.2,1)] hover:bg-[var(--studio-accent-hover)]"
              >
                {requiredDone ? "Close" : "I'll come back to this"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {apiKeyModalOpen && (
        <ApiKeyModal onClose={() => setApiKeyModalOpen(false)} />
      )}
    </>
  );
}
