"use client";

import { useDeploymentCheck } from "@/lib/hooks/use-deployment-check";

export function DeploymentBanner() {
  const { hasNewDeployment, dismiss } = useDeploymentCheck();

  if (!hasNewDeployment) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--studio-border)] px-4 py-2.5 shadow-lg">
      <span className="text-sm text-[var(--text-secondary)]">
        Layout has been updated.
      </span>
      <button
        onClick={() => window.location.reload()}
        className="text-sm font-medium text-[var(--text-primary)] hover:text-[var(--studio-accent)] transition-colors"
      >
        Refresh
      </button>
      <button
        onClick={dismiss}
        className="text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
        aria-label="Dismiss"
      >
        Dismiss
      </button>
    </div>
  );
}
