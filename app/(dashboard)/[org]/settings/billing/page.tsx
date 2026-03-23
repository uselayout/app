"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  CreditCard,
  Zap,
  ArrowUpRight,
  Loader2,
  ShoppingCart,
  ExternalLink,
  Check,
  Key,
  Users,
  Plus,
  Minus,
} from "lucide-react";
import { getStoredApiKey, getStoredGoogleApiKey } from "@/lib/hooks/use-api-key";

interface CreditBalance {
  layoutMdRemaining: number;
  aiQueryRemaining: number;
  topupLayoutMd: number;
  topupAiQuery: number;
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

const TIER_ALLOCATIONS: Record<string, { layoutMd: number; aiQuery: number }> = {
  free: { layoutMd: 2, aiQuery: 5 },
  pro: { layoutMd: 50, aiQuery: 100 },
  team: { layoutMd: 50, aiQuery: 100 },
};

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-400",
  past_due: "bg-amber-500/10 text-amber-400",
  cancelled: "bg-red-500/10 text-red-400",
  trialing: "bg-blue-500/10 text-blue-400",
};

interface SeatInfo {
  memberCount: number;
  pendingInvites: number;
}

export default function BillingPage() {
  const params = useParams<{ org: string }>();
  const [credits, setCredits] = useState<CreditBalance | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [seatInfo, setSeatInfo] = useState<SeatInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [seatLoading, setSeatLoading] = useState(false);
  const [hasClaudeKey, setHasClaudeKey] = useState(false);
  const [hasGoogleKey, setHasGoogleKey] = useState(false);

  useEffect(() => {
    setHasClaudeKey(!!getStoredApiKey());
    setHasGoogleKey(!!getStoredGoogleApiKey());
  }, []);

  const isByok = hasClaudeKey;

  const fetchData = useCallback(async () => {
    const [creditsRes, subRes, membersRes] = await Promise.all([
      fetch("/api/billing/credits"),
      fetch("/api/billing/subscription"),
      fetch(`/api/organizations/${params.org}/members`),
    ]);

    if (creditsRes.ok) {
      const data = await creditsRes.json();
      setCredits(data.credits);
    }
    if (subRes.ok) {
      const data = await subRes.json();
      setSubscription(data.subscription);
    }
    if (membersRes.ok) {
      const members = await membersRes.json();
      setSeatInfo({ memberCount: members.length, pendingInvites: 0 });
    }

    setLoading(false);
  }, [params.org]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  async function handleSeatChange(delta: number) {
    if (!subscription || seatLoading) return;
    const newCount = subscription.seatCount + delta;
    if (newCount < 1) return;

    setSeatLoading(true);
    const res = await fetch("/api/billing/seats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seatCount: newCount }),
    });

    if (res.ok) {
      setSubscription((prev) => prev ? { ...prev, seatCount: newCount } : prev);
    }
    setSeatLoading(false);
  }

  const tier = subscription?.tier || "free";
  const allocation = TIER_ALLOCATIONS[tier] || TIER_ALLOCATIONS.free;
  const isFree = tier === "free";
  const isPaid = tier === "pro" || tier === "team";

  const layoutMdTotal =
    (credits?.layoutMdRemaining ?? 0) + (credits?.topupLayoutMd ?? 0);
  const aiQueryTotal =
    (credits?.aiQueryRemaining ?? 0) + (credits?.topupAiQuery ?? 0);

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
                  {isByok ? "Bring your own key" : (TIER_LABELS[tier] || tier)}
                </p>
                {isByok && (
                  <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                    Underlying plan: {TIER_LABELS[tier] || tier}
                  </p>
                )}
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  isByok
                    ? STATUS_STYLES.active
                    : STATUS_STYLES[subscription?.status || "active"] ||
                      STATUS_STYLES.active
                }`}
              >
                {isByok
                  ? "Active"
                  : subscription?.status === "past_due"
                    ? "Past due"
                    : subscription?.cancelAtPeriodEnd
                      ? "Cancelling"
                      : (subscription?.status || "active").charAt(0).toUpperCase() +
                        (subscription?.status || "active").slice(1)}
              </span>
            </div>

            {/* BYOK key status */}
            {isByok && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 rounded-md bg-[var(--bg-panel)] p-3">
                  <Check size={14} className="shrink-0 text-emerald-400" />
                  <span className="text-sm text-[var(--text-primary)]">Anthropic API key</span>
                  <span className="ml-auto text-xs text-emerald-400">Connected</span>
                </div>
                <div className="flex items-center gap-2 rounded-md bg-[var(--bg-panel)] p-3">
                  {hasGoogleKey ? (
                    <Check size={14} className="shrink-0 text-emerald-400" />
                  ) : (
                    <Key size={14} className="shrink-0 text-[var(--text-muted)]" />
                  )}
                  <span className="text-sm text-[var(--text-primary)]">Google AI key</span>
                  <span className={`ml-auto text-xs ${hasGoogleKey ? "text-emerald-400" : "text-[var(--text-muted)]"}`}>
                    {hasGoogleKey ? "Connected" : "Not configured"}
                  </span>
                </div>
                <p className="text-[10px] text-[var(--text-muted)]">
                  All AI queries use your own keys — no credits consumed.
                  {!hasGoogleKey && " Add a Google AI key to enable image generation."}
                </p>
                {isPaid && (
                  <p className="text-[10px] text-amber-400/80">
                    Your {TIER_LABELS[tier]} credits are preserved while using your own keys.
                  </p>
                )}
              </div>
            )}

            {/* Credit balance — only shown when not on BYOK */}
            {!isByok && (
              <>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="rounded-md bg-[var(--bg-panel)] p-3">
                    <p className="text-xs text-[var(--text-muted)]">
                      layout.md credits
                    </p>
                    <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">
                      Design system extractions
                    </p>
                    <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
                      {credits ? (
                        <>
                          <span
                            className={
                              layoutMdTotal === 0 ? "text-red-400" : ""
                            }
                          >
                            {layoutMdTotal}
                          </span>
                          <span className="text-[var(--text-muted)]">
                            {" "}
                            / {allocation.layoutMd} monthly
                          </span>
                        </>
                      ) : (
                        `${allocation.layoutMd} / month`
                      )}
                    </p>
                    {(credits?.topupLayoutMd ?? 0) > 0 && (
                      <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">
                        incl. {credits!.topupLayoutMd} top-up
                      </p>
                    )}
                  </div>
                  <div className="rounded-md bg-[var(--bg-panel)] p-3">
                    <p className="text-xs text-[var(--text-muted)]">
                      AI query credits
                    </p>
                    <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">
                      Test panel · Explorer · layout.md edits
                    </p>
                    <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
                      {credits ? (
                        <>
                          <span
                            className={
                              aiQueryTotal === 0 ? "text-red-400" : ""
                            }
                          >
                            {aiQueryTotal}
                          </span>
                          <span className="text-[var(--text-muted)]">
                            {" "}
                            / {allocation.aiQuery} monthly
                          </span>
                        </>
                      ) : (
                        `${allocation.aiQuery} / month`
                      )}
                    </p>
                    {(credits?.topupAiQuery ?? 0) > 0 && (
                      <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">
                        incl. {credits!.topupAiQuery} top-up
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
              </>
            )}

            {/* Team seat management */}
            {tier === "team" && subscription && (
              <div className="mt-4 rounded-md bg-[var(--bg-panel)] p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-[var(--text-muted)]" />
                    <span className="text-xs text-[var(--text-muted)]">
                      Team seats
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[var(--text-primary)]">
                      {seatInfo?.memberCount ?? "–"}{" "}
                      <span className="text-[var(--text-muted)]">
                        / {subscription.seatCount} used
                      </span>
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleSeatChange(-1)}
                        disabled={seatLoading || subscription.seatCount <= (seatInfo?.memberCount ?? 1)}
                        className="flex h-6 w-6 items-center justify-center rounded border border-[var(--studio-border)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Minus size={12} />
                      </button>
                      <button
                        onClick={() => handleSeatChange(1)}
                        disabled={seatLoading}
                        className="flex h-6 w-6 items-center justify-center rounded border border-[var(--studio-border)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        {seatLoading ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Plus size={12} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
                <p className="mt-2 text-[10px] text-[var(--text-muted)]">
                  {allocation.layoutMd} layout.md + {allocation.aiQuery} AI queries per seat/month
                  {subscription.seatCount > 1 && (
                    <> = {allocation.layoutMd * subscription.seatCount} layout.md + {allocation.aiQuery * subscription.seatCount} AI queries total</>
                  )}
                </p>
              </div>
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

          {/* Buy more credits — only when not on BYOK */}
          {!isByok && (
            <div className="mt-4 rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] p-5">
              <div className="flex items-start gap-3">
                <ShoppingCart className="mt-0.5 h-4 w-4 text-[var(--text-muted)]" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    Buy more credits
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">
                    Top up with 30 layout.md extractions and 80 AI queries.
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
          )}

          {/* Upgrade prompt (free users only, not on BYOK) */}
          {isFree && !isByok && (
            <div className="mt-4 rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] p-5">
              <div className="flex items-start gap-3">
                <Zap className="mt-0.5 h-4 w-4 text-[var(--studio-accent)]" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    Upgrade to Pro
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">
                    Get 50 layout.md extractions and 100 AI queries per month,
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
            <div className="flex items-start gap-3">
              <Key className="mt-0.5 h-4 w-4 text-[var(--text-muted)]" />
              <div className="flex-1">
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  Bring your own key
                </p>
                {isByok ? (
                  <>
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">
                      Your API keys are stored locally in your browser — we never persist them on our servers.
                      Manage your keys from the key icon in the studio top bar.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-3">
                      <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                        <Check size={12} />
                        Anthropic
                      </div>
                      {hasGoogleKey && (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                          <Check size={12} />
                          Google AI
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">
                      Use your own Anthropic API key to bypass credit limits entirely.
                      Your key is stored locally in your browser — we never persist it.
                    </p>
                    <p className="mt-3 text-xs text-[var(--text-muted)]">
                      Configure your API key in{" "}
                      <a href={`/${params.org}/settings/api-keys`} className="text-[var(--studio-accent)] hover:text-[var(--studio-accent-hover)] underline underline-offset-2 transition-colors">
                        Settings → API Keys
                      </a>.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
