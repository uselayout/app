"use client";

import { Zap, Key, ArrowUpRight, X } from "lucide-react";
import Link from "next/link";

interface UpgradePromptProps {
  orgSlug: string;
  /** Remaining credits from the QUOTA_EXCEEDED response */
  remaining?: { layoutMd: number; aiQuery: number };
  /** Error message from the API */
  message?: string;
  /** Callback to dismiss the prompt */
  onDismiss?: () => void;
}

export function UpgradePrompt({ orgSlug, remaining, message, onDismiss }: UpgradePromptProps) {
  return (
    <div className="rounded-xl border border-[var(--studio-border-strong)] bg-[var(--bg-elevated)] p-5 relative">
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 rounded-md p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          <X size={14} />
        </button>
      )}

      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
        Out of credits
      </h3>
      <p className="text-xs text-[var(--text-secondary)] mb-4">
        {message || "You\u2019ve used all your AI credits. Choose an option below to keep generating."}
      </p>

      {remaining && (
        <div className="flex gap-4 mb-4 text-[10px] text-[var(--text-muted)]">
          <span>layout.md: {remaining.layoutMd} remaining</span>
          <span>AI queries: {remaining.aiQuery} remaining</span>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Link
          href={`/${orgSlug}/settings/billing`}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--studio-accent)] px-3.5 py-2 text-xs font-semibold text-[var(--text-on-accent)] transition-all hover:bg-[var(--studio-accent-hover)]"
        >
          <Zap size={13} />
          Buy Credit Pack
          <ArrowUpRight size={11} />
        </Link>

        <Link
          href={`/${orgSlug}/settings/api-keys`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--studio-border-strong)] bg-[var(--bg-surface)] px-3.5 py-2 text-xs font-medium text-[var(--text-secondary)] transition-all hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
        >
          <Key size={13} />
          Use Own API Key
          <ArrowUpRight size={11} />
        </Link>

        <Link
          href={`/${orgSlug}/settings/billing`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--studio-border-strong)] bg-[var(--bg-surface)] px-3.5 py-2 text-xs font-medium text-[var(--text-secondary)] transition-all hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
        >
          <ArrowUpRight size={13} />
          Upgrade Plan
        </Link>
      </div>
    </div>
  );
}
