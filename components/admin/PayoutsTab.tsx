"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  AffiliatePayout,
  AffiliateWithStats,
  PayoutMethod,
} from "@/lib/supabase/affiliates";

type ToastFn = (msg: string, type?: "success" | "error") => void;

interface Props {
  toast: ToastFn;
}

type Filter = "all" | "unpaid" | "paid";

const PAYOUT_METHODS: PayoutMethod[] = ["wise", "stripe-connect", "paypal", "manual"];

function fmtGbp(n: number): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n);
}

export function PayoutsTab({ toast }: Props) {
  const [payouts, setPayouts] = useState<AffiliatePayout[]>([]);
  const [affiliates, setAffiliates] = useState<AffiliateWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("unpaid");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, aRes] = await Promise.all([
        fetch("/api/admin/affiliate-payouts"),
        fetch("/api/admin/affiliates"),
      ]);
      if (!pRes.ok || !aRes.ok) throw new Error();
      const pJson = (await pRes.json()) as { payouts: AffiliatePayout[] };
      const aJson = (await aRes.json()) as { affiliates: AffiliateWithStats[] };
      setPayouts(pJson.payouts);
      setAffiliates(aJson.affiliates);
    } catch {
      toast("Failed to load payouts", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const affiliateById = useMemo(() => {
    const m = new Map<string, AffiliateWithStats>();
    for (const a of affiliates) m.set(a.id, a);
    return m;
  }, [affiliates]);

  const filtered = useMemo(() => {
    if (filter === "all") return payouts;
    if (filter === "unpaid") return payouts.filter((p) => !p.paidAt);
    return payouts.filter((p) => p.paidAt);
  }, [payouts, filter]);

  async function markPaid(payout: AffiliatePayout) {
    const method = window.prompt(
      `Payout method? One of: ${PAYOUT_METHODS.join(", ")}`,
      payout.payoutMethod ?? "wise"
    );
    if (method === null) return;
    if (method && !PAYOUT_METHODS.includes(method as PayoutMethod)) {
      toast(`Invalid method`, "error");
      return;
    }
    const reference = window.prompt("Transfer reference (id from Wise/Stripe/PayPal)?", payout.payoutReference ?? "");
    if (reference === null) return;

    try {
      const res = await fetch(`/api/admin/affiliate-payouts/${payout.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paidAt: new Date().toISOString(),
          payoutMethod: method || null,
          payoutReference: reference || null,
        }),
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(json.error);
      }
      toast("Marked paid");
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed", "error");
    }
  }

  const unpaidTotal = payouts.filter((p) => !p.paidAt).reduce((s, p) => s + p.totalGbp, 0);
  const paidTotal = payouts.filter((p) => p.paidAt).reduce((s, p) => s + p.totalGbp, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-6">
        <div>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Pending payouts</p>
          <p className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>
            {fmtGbp(unpaidTotal)}
          </p>
        </div>
        <div>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Total paid (all time)</p>
          <p className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>
            {fmtGbp(paidTotal)}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <div
            className="flex gap-1 p-1 rounded-lg"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--studio-border)" }}
          >
            {(["unpaid", "paid", "all"] as const).map((key) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className="px-3 py-1 rounded-md text-xs font-medium capitalize"
                style={{
                  background: filter === key ? "var(--bg-elevated)" : "transparent",
                  color: filter === key ? "var(--text-primary)" : "var(--text-muted)",
                  border: filter === key ? "1px solid var(--studio-border)" : "1px solid transparent",
                }}
              >
                {key}
              </button>
            ))}
          </div>
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
      ) : filtered.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          No payouts in this view. Create one from the Commissions tab.
        </p>
      ) : (
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--studio-border)",
          }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--studio-border)" }}>
                <Th>Affiliate</Th>
                <Th>Period</Th>
                <Th right>Conversions</Th>
                <Th right>Total</Th>
                <Th>Status</Th>
                <Th>Method</Th>
                <Th>Reference</Th>
                <Th right>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const aff = affiliateById.get(p.affiliateId);
                return (
                  <tr key={p.id} style={{ borderTop: "1px solid var(--studio-border)" }}>
                    <td className="px-4 py-3 font-medium" style={{ color: "var(--text-primary)" }}>
                      {aff?.name ?? p.affiliateId.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--text-secondary)" }}>
                      {p.periodStart} → {p.periodEnd}
                    </td>
                    <td className="px-4 py-3 text-right" style={{ color: "var(--text-secondary)" }}>
                      {p.conversionCount}
                    </td>
                    <td className="px-4 py-3 text-right font-medium" style={{ color: "var(--text-primary)" }}>
                      {fmtGbp(p.totalGbp)}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {p.paidAt ? (
                        <span style={{ color: "var(--status-success, #10b981)" }}>
                          Paid {new Date(p.paidAt).toLocaleDateString("en-GB")}
                        </span>
                      ) : (
                        <span style={{ color: "var(--status-warning, #f59e0b)" }}>
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--text-secondary)" }}>
                      {p.payoutMethod ?? "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-[10px]" style={{ color: "var(--text-muted)" }}>
                      {p.payoutReference ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!p.paidAt && (
                        <button
                          onClick={() => void markPaid(p)}
                          className="px-2.5 py-1 rounded text-xs font-medium"
                          style={{
                            background: "var(--studio-accent)",
                            color: "var(--text-on-accent)",
                          }}
                        >
                          Mark paid
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <th
      className={`px-4 py-3 font-medium ${right ? "text-right" : "text-left"}`}
      style={{ color: "var(--text-muted)" }}
    >
      {children}
    </th>
  );
}
