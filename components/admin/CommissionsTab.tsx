"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  AffiliateConversion,
  AffiliateWithStats,
  PayoutMethod,
} from "@/lib/supabase/affiliates";

type ToastFn = (msg: string, type?: "success" | "error") => void;

interface Props {
  toast: ToastFn;
}

const PAYOUT_METHODS: PayoutMethod[] = ["wise", "stripe-connect", "paypal", "manual"];
const MIN_PAYOUT_GBP = 40;

function fmtGbp(n: number): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n);
}

interface AffiliateGroup {
  affiliate: AffiliateWithStats;
  conversions: AffiliateConversion[];
  total: number;
}

export function CommissionsTab({ toast }: Props) {
  const [affiliates, setAffiliates] = useState<AffiliateWithStats[]>([]);
  const [conversions, setConversions] = useState<AffiliateConversion[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [aRes, cRes] = await Promise.all([
        fetch("/api/admin/affiliates"),
        fetch("/api/admin/affiliate-conversions"),
      ]);
      if (!aRes.ok || !cRes.ok) throw new Error();
      const aJson = (await aRes.json()) as { affiliates: AffiliateWithStats[] };
      const cJson = (await cRes.json()) as { conversions: AffiliateConversion[] };
      setAffiliates(aJson.affiliates);
      setConversions(cJson.conversions);
    } catch {
      toast("Failed to load commissions", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const groups: AffiliateGroup[] = useMemo(() => {
    const byId = new Map<string, AffiliateGroup>();
    for (const a of affiliates) {
      byId.set(a.id, { affiliate: a, conversions: [], total: 0 });
    }
    for (const c of conversions) {
      const g = byId.get(c.affiliateId);
      if (!g) continue;
      g.conversions.push(c);
      g.total += c.commissionGbp;
    }
    return Array.from(byId.values())
      .filter((g) => g.conversions.length > 0)
      .sort((a, b) => b.total - a.total);
  }, [affiliates, conversions]);

  async function createPayout(affiliateId: string, name: string, total: number) {
    if (total < MIN_PAYOUT_GBP) {
      if (!confirm(`Total ${fmtGbp(total)} is below the ${fmtGbp(MIN_PAYOUT_GBP)} minimum. Create payout anyway?`)) return;
    }
    const method = window.prompt(
      `Payout method for ${name}? One of: ${PAYOUT_METHODS.join(", ")}. Leave blank for none.`,
      "wise"
    );
    if (method === null) return;
    if (method && !PAYOUT_METHODS.includes(method as PayoutMethod)) {
      toast(`Invalid method. Must be one of: ${PAYOUT_METHODS.join(", ")}`, "error");
      return;
    }
    const reference = window.prompt("Payout reference (transfer id, optional)?", "");
    if (reference === null) return;
    const notes = window.prompt("Notes (optional)?", "");
    if (notes === null) return;

    try {
      const res = await fetch("/api/admin/affiliate-payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          affiliateId,
          payoutMethod: method || null,
          payoutReference: reference || null,
          notes: notes || null,
        }),
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(json.error);
      }
      toast(`Payout draft created for ${name}. Mark paid from the Payouts tab.`);
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to create payout", "error");
    }
  }

  const grandTotal = groups.reduce((sum, g) => sum + g.total, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Total owed across all affiliates</p>
          <p className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>
            {fmtGbp(grandTotal)}
          </p>
        </div>
        <div className="ml-auto">
          <button
            onClick={() => void load()}
            className="px-3 py-1.5 rounded-md text-xs"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--studio-border)",
              color: "var(--text-primary)",
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading…</p>
      ) : groups.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          No unpaid conversions. They appear here once the Stripe webhook
          attributes a paid invoice to an affiliate&apos;s invite code.
        </p>
      ) : (
        groups.map((g) => (
          <div
            key={g.affiliate.id}
            className="rounded-xl overflow-hidden"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--studio-border)",
            }}
          >
            <div
              className="px-4 py-3 flex items-center gap-4"
              style={{ borderBottom: "1px solid var(--studio-border)" }}
            >
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  {g.affiliate.name}
                </p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {g.conversions.length} conversion{g.conversions.length === 1 ? "" : "s"} · {g.affiliate.commissionTier}
                </p>
              </div>
              <div className="ml-auto flex items-center gap-3">
                <span className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                  {fmtGbp(g.total)}
                </span>
                <button
                  onClick={() => void createPayout(g.affiliate.id, g.affiliate.name, g.total)}
                  className="px-3 py-1.5 rounded-md text-xs font-medium"
                  style={{
                    background: "var(--studio-accent)",
                    color: "var(--text-on-accent)",
                  }}
                >
                  Create payout
                </button>
              </div>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: "var(--bg-elevated)" }}>
                  <Th>Invoice paid</Th>
                  <Th>Month since redeem</Th>
                  <Th>Rate</Th>
                  <Th right>Invoice</Th>
                  <Th right>Commission</Th>
                  <Th>Stripe invoice</Th>
                </tr>
              </thead>
              <tbody>
                {g.conversions.map((c) => (
                  <tr key={c.id} style={{ borderTop: "1px solid var(--studio-border)" }}>
                    <td className="px-4 py-2" style={{ color: "var(--text-secondary)" }}>
                      {new Date(c.invoicePaidAt).toLocaleDateString("en-GB")}
                    </td>
                    <td className="px-4 py-2" style={{ color: "var(--text-secondary)" }}>
                      m{c.monthsSinceRedeem}
                    </td>
                    <td className="px-4 py-2" style={{ color: "var(--text-secondary)" }}>
                      {c.commissionPct}%
                    </td>
                    <td className="px-4 py-2 text-right" style={{ color: "var(--text-secondary)" }}>
                      {fmtGbp(c.invoiceTotalGbp)}
                    </td>
                    <td className="px-4 py-2 text-right font-medium" style={{ color: "var(--text-primary)" }}>
                      {fmtGbp(c.commissionGbp)}
                    </td>
                    <td className="px-4 py-2 font-mono text-[10px]" style={{ color: "var(--text-muted)" }}>
                      {c.stripeInvoiceId}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  );
}

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <th
      className={`px-4 py-2 font-medium ${right ? "text-right" : "text-left"}`}
      style={{ color: "var(--text-muted)" }}
    >
      {children}
    </th>
  );
}
