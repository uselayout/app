"use client";

import { useParams } from "next/navigation";
import { useOrgStore } from "@/lib/store/organization";
import { CreditCard, Zap, ArrowUpRight } from "lucide-react";

export default function BillingPage() {
  const params = useParams();
  const orgSlug = typeof params?.org === "string" ? params.org : "";
  const currentOrg = useOrgStore((s) => s.currentOrg);
  const activeOrg = currentOrg();

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="flex items-center gap-3">
        <CreditCard className="h-5 w-5 text-[var(--studio-accent)]" />
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
          Billing
        </h1>
      </div>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">
        Manage your subscription and usage
      </p>

      {/* Current plan */}
      <div className="mt-8 rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
              Current plan
            </p>
            <p className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
              Free
            </p>
          </div>
          <span className="rounded-full bg-[var(--studio-accent-subtle)] px-3 py-1 text-xs font-medium text-[var(--studio-accent)]">
            Active
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="rounded-md bg-[var(--bg-panel)] p-3">
            <p className="text-xs text-[var(--text-muted)]">DESIGN.md credits</p>
            <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
              2 / month
            </p>
          </div>
          <div className="rounded-md bg-[var(--bg-panel)] p-3">
            <p className="text-xs text-[var(--text-muted)]">Test query credits</p>
            <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
              5 / month
            </p>
          </div>
        </div>
      </div>

      {/* Upgrade prompt */}
      <div className="mt-4 rounded-lg border border-[var(--studio-accent)]/20 bg-[var(--studio-accent-subtle)] p-5">
        <div className="flex items-start gap-3">
          <Zap className="mt-0.5 h-4 w-4 text-[var(--studio-accent)]" />
          <div className="flex-1">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              Upgrade to Pro
            </p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              Get 50 DESIGN.md extractions and 100 test queries per month, plus
              priority support.
            </p>
            <button
              disabled
              className="mt-3 flex items-center gap-1.5 rounded-lg bg-[var(--studio-accent)] px-4 py-2 text-sm font-medium text-[var(--text-on-accent)] transition-colors hover:bg-[var(--studio-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Coming soon
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* BYOK section */}
      <div className="mt-6 rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] p-5">
        <p className="text-sm font-medium text-[var(--text-primary)]">
          Bring your own key
        </p>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">
          Use your own Anthropic API key to bypass credit limits entirely. Your
          key is stored locally in your browser — we never persist it.
        </p>
        <p className="mt-3 text-xs text-[var(--text-muted)]">
          Configure your API key from the key icon in the top bar.
        </p>
      </div>
    </div>
  );
}
