"use client";

import { useState, useEffect } from "react";
import {
  CreditCard,
  Zap,
  ArrowUpRight,
  Loader2,
  ShoppingCart,
  ExternalLink,
} from "lucide-react";

interface CreditBalance {
  designMdRemaining: number;
  testQueryRemaining: number;
  topupDesignMd: number;
  topupTestQuery: number;
  periodStart: string | null;
  periodEnd: string | null;
}

interface Subscription {
  tier: string;
  status: string;
  seatCount: number;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd?: string;
}

const TIER_LABELS: Record<string, string> = {
  free: "Free",
  pro: "Pro",
  team: "Team",
};

const TIER_ALLOCATIONS: Record<string, { designMd: number; testQuery: number }> = {
  free: { designMd: 2, testQuery: 5 },
  pro: { designMd: 50, testQuery: 100 },
  team: { designMd: 50, testQuery: 100 },
};

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-400",
  past_due: "bg-amber-500/10 text-amber-400",
  cancelled: "bg-red-500/10 text-red-400",
  trialing: "bg-blue-500/10 text-blue-400",
};

export default function BillingPage() {
  const [credits, setCredits] = useState<CreditBalance | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      const [creditsRes, subRes] = await Promise.all([
        fetch("/api/billing/credits"),
        fetch("/api/billing/subscription"),
      ]);

      if (creditsRes.ok) {
        const data = await creditsRes.json();
        setCredits(data.credits);
      }
      if (subRes.ok) {
        const data = await subRes.json();
        setSubscription(data.subscription);
      }

      setLoading(false);
    }

    fetchData();
  }, []);

  async function handleCheckout(type: "pro" | "team" | "topup") {
    setCheckoutLoading(type);

    const body =
      type === "topup" ? { type: "topup" } : { tier: type };

    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
    }

    setCheckoutLoading(null);
  }

  async function handlePortal() {
    const res = await fetch("/api/billing/portal", {
      method: "POST",
    });

    if (res.ok) {
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    }
  }

  const tier = subscription?.tier || "free";
  const allocation = TIER_ALLOCATIONS[tier] || TIER_ALLOCATIONS.free;
  const isFree = tier === "free";
  const isPaid = tier === "pro" || tier === "team";

  const designMdTotal =
    (credits?.designMdRemaining ?? 0) + (credits?.topupDesignMd ?? 0);
  const testQueryTotal =
    (credits?.testQueryRemaining ?? 0) + (credits?.topupTestQuery ?? 0);

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

      {loading ? (
        <div className="mt-12 flex items-center justify-center">
          <Loader2
            size={20}
            className="animate-spin text-[var(--text-muted)]"
          />
        </div>
      ) : (
        <>
          {/* Current plan */}
          <div className="mt-8 rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                  Current plan
                </p>
                <p className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
                  {TIER_LABELS[tier] || tier}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  STATUS_STYLES[subscription?.status || "active"] ||
                  STATUS_STYLES.active
                }`}
              >
                {subscription?.status === "past_due"
                  ? "Past due"
                  : subscription?.cancelAtPeriodEnd
                    ? "Cancelling"
                    : (subscription?.status || "active").charAt(0).toUpperCase() +
                      (subscription?.status || "active").slice(1)}
              </span>
            </div>

            {/* Credit balance */}
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="rounded-md bg-[var(--bg-panel)] p-3">
                <p className="text-xs text-[var(--text-muted)]">
                  DESIGN.md credits
                </p>
                <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
                  {credits ? (
                    <>
                      <span
                        className={
                          designMdTotal === 0 ? "text-red-400" : ""
                        }
                      >
                        {designMdTotal}
                      </span>
                      <span className="text-[var(--text-muted)]">
                        {" "}
                        / {allocation.designMd} monthly
                      </span>
                    </>
                  ) : (
                    `${allocation.designMd} / month`
                  )}
                </p>
                {(credits?.topupDesignMd ?? 0) > 0 && (
                  <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">
                    incl. {credits!.topupDesignMd} top-up
                  </p>
                )}
              </div>
              <div className="rounded-md bg-[var(--bg-panel)] p-3">
                <p className="text-xs text-[var(--text-muted)]">
                  Test query credits
                </p>
                <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
                  {credits ? (
                    <>
                      <span
                        className={
                          testQueryTotal === 0 ? "text-red-400" : ""
                        }
                      >
                        {testQueryTotal}
                      </span>
                      <span className="text-[var(--text-muted)]">
                        {" "}
                        / {allocation.testQuery} monthly
                      </span>
                    </>
                  ) : (
                    `${allocation.testQuery} / month`
                  )}
                </p>
                {(credits?.topupTestQuery ?? 0) > 0 && (
                  <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">
                    incl. {credits!.topupTestQuery} top-up
                  </p>
                )}
              </div>
            </div>

            {credits?.periodEnd && (
              <p className="mt-3 text-[10px] text-[var(--text-muted)]">
                Credits reset{" "}
                {new Date(credits.periodEnd).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            )}

            {/* Manage subscription (paid users) */}
            {isPaid && (
              <button
                onClick={handlePortal}
                className="mt-4 flex items-center gap-1.5 text-xs text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
              >
                <ExternalLink size={12} />
                Manage subscription
              </button>
            )}
          </div>

          {/* Buy more credits */}
          <div className="mt-4 rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] p-5">
            <div className="flex items-start gap-3">
              <ShoppingCart className="mt-0.5 h-4 w-4 text-[var(--text-muted)]" />
              <div className="flex-1">
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  Buy more credits
                </p>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                  Top up with 30 DESIGN.md extractions and 80 test queries.
                  Top-up credits never expire and carry over between billing
                  periods.
                </p>
                <button
                  onClick={() => handleCheckout("topup")}
                  disabled={checkoutLoading === "topup"}
                  className="mt-3 flex items-center gap-1.5 rounded-lg bg-[var(--studio-accent)] px-4 py-2 text-sm font-medium text-[var(--text-on-accent)] transition-colors hover:bg-[var(--studio-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {checkoutLoading === "topup" ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <ShoppingCart size={14} />
                  )}
                  Buy credit pack
                </button>
              </div>
            </div>
          </div>

          {/* Upgrade prompt (free users only) */}
          {isFree && (
            <div className="mt-4 rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] p-5">
              <div className="flex items-start gap-3">
                <Zap className="mt-0.5 h-4 w-4 text-[var(--studio-accent)]" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    Upgrade to Pro
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">
                    Get 50 DESIGN.md extractions and 100 test queries per month,
                    plus priority support.
                  </p>
                  <button
                    onClick={() => handleCheckout("pro")}
                    disabled={checkoutLoading === "pro"}
                    className="mt-3 flex items-center gap-1.5 rounded-lg bg-[var(--studio-accent)] px-4 py-2 text-sm font-medium text-[var(--text-on-accent)] transition-colors hover:bg-[var(--studio-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {checkoutLoading === "pro" ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : null}
                    Upgrade to Pro
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* BYOK section */}
          <div className="mt-4 rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] p-5">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              Bring your own key
            </p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              Use your own Anthropic API key to bypass credit limits entirely.
              Your key is stored locally in your browser — we never persist it.
            </p>
            <p className="mt-3 text-xs text-[var(--text-muted)]">
              Configure your API key from the key icon in the top bar.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
