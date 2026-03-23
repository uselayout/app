"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useOrgStore } from "@/lib/store/organization";
import { ArrowLeft, Loader2, Minus, Plus } from "lucide-react";
import Link from "next/link";

const BASE_PRICE = 29;
const SEAT_PRICE = 15;
const MIN_SEATS = 2;
const MAX_SEATS = 100;

export default function CreateTeamPage() {
  const router = useRouter();
  const addOrganization = useOrgStore((s) => s.addOrganization);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [seatCount, setSeatCount] = useState(MIN_SEATS);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const autoSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 48);

  const effectiveSlug = slugTouched ? slug : autoSlug;
  const seatTotal = seatCount * SEAT_PRICE;
  const monthlyTotal = BASE_PRICE + seatTotal;

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!name.trim() || saving) return;

      setSaving(true);
      setError(null);

      try {
        // Step 1: Create the organisation
        const orgRes = await fetch("/api/organizations/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            slug: effectiveSlug || undefined,
          }),
        });

        if (!orgRes.ok) {
          const body = await orgRes
            .json()
            .catch(() => ({ error: "Failed to create organisation" }));
          throw new Error(
            (body as { error?: string }).error ??
              "Failed to create organisation"
          );
        }

        const org = await orgRes.json();
        addOrganization(org);

        // Step 2: Create Stripe checkout session
        const checkoutRes = await fetch("/api/billing/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tier: "team",
            seatCount,
            orgId: org.id,
          }),
        });

        if (!checkoutRes.ok) {
          const body = await checkoutRes
            .json()
            .catch(() => ({ error: "Failed to create checkout session" }));
          throw new Error(
            (body as { error?: string }).error ??
              "Failed to create checkout session"
          );
        }

        const { url } = await checkoutRes.json();
        window.location.href = url;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
        setSaving(false);
      }
    },
    [name, effectiveSlug, seatCount, saving, addOrganization]
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-app)]">
      <div className="w-full max-w-md">
        <Link
          href="/pricing"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          <ArrowLeft size={14} />
          Back to pricing
        </Link>

        <div className="rounded-xl border border-[var(--studio-border)] bg-[var(--bg-panel)] p-6">
          <h1 className="text-lg font-semibold text-[var(--text-primary)]">
            Start a Team plan
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Create your team and choose how many seats you need.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            {/* Team name */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                Team name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
                maxLength={50}
                placeholder="e.g. Acme Design"
                className="w-full rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--studio-border-focus)] transition-colors"
              />
            </div>

            {/* Slug */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                Slug
              </label>
              <input
                type="text"
                value={effectiveSlug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value);
                }}
                minLength={3}
                maxLength={48}
                pattern="[a-z0-9][a-z0-9-]*[a-z0-9]"
                placeholder="e.g. acme-design"
                className="w-full rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--studio-border-focus)] transition-colors font-mono"
              />
              <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                Lowercase letters, numbers, and hyphens only. Used in URLs.
              </p>
            </div>

            {/* Divider */}
            <div className="h-px bg-[var(--studio-border)]" />

            {/* Seat picker */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                Team seats
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSeatCount((c) => Math.max(MIN_SEATS, c - 1))}
                  disabled={seatCount <= MIN_SEATS}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-hover)] disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Minus size={14} />
                </button>
                <span className="min-w-[3ch] text-center text-sm font-medium text-[var(--text-primary)] tabular-nums">
                  {seatCount}
                </span>
                <button
                  type="button"
                  onClick={() => setSeatCount((c) => Math.min(MAX_SEATS, c + 1))}
                  disabled={seatCount >= MAX_SEATS}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-hover)] disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Plus size={14} />
                </button>
                <span className="text-xs text-[var(--text-muted)]">
                  seats (you + {seatCount - 1} teammate{seatCount > 2 ? "s" : ""})
                </span>
              </div>
            </div>

            {/* Price breakdown */}
            <div className="rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--text-secondary)]">Team base</span>
                <span className="text-[var(--text-primary)] tabular-nums">${BASE_PRICE}/mo</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--text-secondary)]">
                  {seatCount} seat{seatCount > 1 ? "s" : ""} × ${SEAT_PRICE}
                </span>
                <span className="text-[var(--text-primary)] tabular-nums">${seatTotal}/mo</span>
              </div>
              <div className="h-px bg-[var(--studio-border)]" />
              <div className="flex items-center justify-between text-sm font-medium">
                <span className="text-[var(--text-primary)]">Total</span>
                <span className="text-[var(--text-primary)] tabular-nums">${monthlyTotal}/mo</span>
              </div>
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--studio-accent)] px-4 py-2.5 text-sm font-medium text-[var(--text-on-accent)] transition-colors hover:bg-[var(--studio-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Setting up...
                </>
              ) : (
                "Continue to payment →"
              )}
            </button>

            <p className="text-center text-[11px] text-[var(--text-muted)]">
              You can add or remove seats at any time from billing settings.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
