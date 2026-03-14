"use client";

import { Zap, Key } from "lucide-react";

interface UpgradePromptProps {
  onBuyCredits: () => void;
  onSwitchToByok: () => void;
}

export function UpgradePrompt({ onBuyCredits, onSwitchToByok }: UpgradePromptProps) {
  return (
    <div className="rounded-xl border border-[--studio-border-strong] bg-[--bg-elevated] p-4">
      <p className="mb-3 text-sm font-medium text-[--text-primary]">
        You&apos;ve used all your hosted AI credits this month.
      </p>
      <p className="mb-4 text-xs text-[--text-secondary]">
        Top up for more credits, or switch to your own Anthropic API key.
      </p>
      <div className="flex gap-2">
        <button
          onClick={onBuyCredits}
          className="flex items-center gap-1.5 rounded-lg bg-[--studio-accent] px-3 py-1.5 text-xs font-semibold text-[--text-on-accent] transition-all hover:bg-[--studio-accent-hover]"
        >
          <Zap className="h-3 w-3" />
          Buy Credits
        </button>
        <button
          onClick={onSwitchToByok}
          className="flex items-center gap-1.5 rounded-lg border border-[--studio-border-strong] bg-[--bg-surface] px-3 py-1.5 text-xs font-medium text-[--text-secondary] transition-all hover:bg-[--bg-hover] hover:text-[--text-primary]"
        >
          <Key className="h-3 w-3" />
          Use Own API Key
        </button>
      </div>
    </div>
  );
}
