"use client";

import { Zap, Key } from "lucide-react";

interface UpgradePromptProps {
  onBuyCredits: () => void;
  onSwitchToByok: () => void;
}

export function UpgradePrompt({ onBuyCredits, onSwitchToByok }: UpgradePromptProps) {
  return (
    <div className="rounded-xl border border-[var(--studio-border-strong)] bg-[var(--bg-elevated)] p-4">
      <p className="mb-3 text-sm font-medium text-[var(--text-primary)]">
        You&apos;ve used all your hosted AI credits this month.
      </p>
      <p className="mb-4 text-xs text-[var(--text-secondary)]">
        Top up for more credits, or switch to your own Anthropic API key.
      </p>
      <div className="flex gap-2">
        <button
          onClick={onBuyCredits}
          className="flex items-center gap-1.5 rounded-lg bg-[var(--studio-accent)] px-3 py-1.5 text-xs font-semibold text-[var(--text-on-accent)] transition-all hover:bg-[var(--studio-accent-hover)]"
        >
          <Zap className="h-3 w-3" />
          Buy Credits
        </button>
        <button
          onClick={onSwitchToByok}
          className="flex items-center gap-1.5 rounded-lg border border-[var(--studio-border-strong)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-all hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
        >
          <Key className="h-3 w-3" />
          Use Own API Key
        </button>
      </div>
    </div>
  );
}
