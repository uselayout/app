"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  AffiliateWithStats,
  CommissionTier,
  PayoutMethod,
} from "@/lib/supabase/affiliates";

type ToastFn = (msg: string, type?: "success" | "error") => void;

interface Props {
  toast: ToastFn;
}

const COMMISSION_LABEL: Record<CommissionTier, string> = {
  standard: "Standard (20%)",
  flagship: "Flagship (40/35/30)",
};

const PAYOUT_METHODS: PayoutMethod[] = ["wise", "stripe-connect", "paypal", "manual"];

function fmtGbp(n: number): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n);
}

export function AffiliatesTab({ toast }: Props) {
  const [affiliates, setAffiliates] = useState<AffiliateWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/affiliates");
      if (!res.ok) throw new Error();
      const json = (await res.json()) as { affiliates: AffiliateWithStats[] };
      setAffiliates(json.affiliates);
    } catch {
      toast("Failed to load affiliates", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function generateCodes(id: string, name: string, tier: CommissionTier) {
    const defaultCount = tier === "flagship" ? 30 : 20;
    const input = prompt(`How many codes to generate for ${name}?`, String(defaultCount));
    if (!input) return;
    const count = Number(input);
    if (!Number.isInteger(count) || count < 1 || count > 100) {
      toast("Count must be 1-100", "error");
      return;
    }
    try {
      const res = await fetch(`/api/admin/affiliates/${id}/codes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count }),
      });
      if (!res.ok) throw new Error();
      toast(`Generated ${count} codes`);
      await load();
    } catch {
      toast("Failed to generate codes", "error");
    }
  }

  async function setTier(id: string, tier: CommissionTier) {
    try {
      const res = await fetch(`/api/admin/affiliates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commissionTier: tier }),
      });
      if (!res.ok) throw new Error();
      toast(`Set to ${tier}`);
      await load();
    } catch {
      toast("Failed to update", "error");
    }
  }

  async function remove(id: string, name: string) {
    if (!confirm(`Delete affiliate ${name}? Their conversions and payouts stay (FK).`)) return;
    try {
      const res = await fetch(`/api/admin/affiliates/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(json.error);
      }
      toast("Deleted");
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to delete", "error");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowCreate(true)}
          className="px-3 py-1.5 rounded-md text-xs font-medium"
          style={{
            background: "var(--studio-accent)",
            color: "var(--text-on-accent)",
          }}
        >
          + New affiliate
        </button>
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

      {showCreate && (
        <CreateAffiliateForm
          toast={toast}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            void load();
          }}
        />
      )}

      {loading ? (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading…</p>
      ) : affiliates.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          No affiliates yet. Use New affiliate to add one, then generate codes.
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
                <Th>Name</Th>
                <Th>Tier</Th>
                <Th>Email</Th>
                <Th right>Codes</Th>
                <Th right>Redeemed</Th>
                <Th right>Unpaid</Th>
                <Th right>Owed</Th>
                <Th right>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {affiliates.map((a) => (
                <tr key={a.id} style={{ borderTop: "1px solid var(--studio-border)" }}>
                  <td className="px-4 py-3 font-medium" style={{ color: "var(--text-primary)" }}>
                    {a.name}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={a.commissionTier}
                      onChange={(e) => void setTier(a.id, e.target.value as CommissionTier)}
                      className="text-xs px-2 py-1 rounded"
                      style={{
                        background: "var(--bg-elevated)",
                        border: "1px solid var(--studio-border)",
                        color: "var(--text-primary)",
                      }}
                    >
                      <option value="standard">{COMMISSION_LABEL.standard}</option>
                      <option value="flagship">{COMMISSION_LABEL.flagship}</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--text-secondary)" }}>
                    {a.payoutEmail ?? a.email ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right" style={{ color: "var(--text-secondary)" }}>
                    {a.codesIssued}
                  </td>
                  <td className="px-4 py-3 text-right" style={{ color: "var(--text-secondary)" }}>
                    {a.codesRedeemed}
                  </td>
                  <td className="px-4 py-3 text-right" style={{ color: "var(--text-secondary)" }}>
                    {a.unpaidConversionsCount}
                  </td>
                  <td className="px-4 py-3 text-right font-medium" style={{ color: "var(--text-primary)" }}>
                    {a.unpaidCommissionGbp > 0 ? fmtGbp(a.unpaidCommissionGbp) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-2">
                      <button
                        onClick={() => void generateCodes(a.id, a.name, a.commissionTier)}
                        className="px-2.5 py-1 rounded text-xs"
                        style={{
                          background: "var(--bg-elevated)",
                          border: "1px solid var(--studio-border)",
                          color: "var(--text-primary)",
                        }}
                      >
                        Generate codes
                      </button>
                      <button
                        onClick={() => void remove(a.id, a.name)}
                        className="px-2.5 py-1 rounded text-xs"
                        style={{
                          background: "transparent",
                          border: "1px solid #7f1d1d",
                          color: "#fca5a5",
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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

function CreateAffiliateForm({
  toast,
  onClose,
  onCreated,
}: {
  toast: ToastFn;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [tier, setTier] = useState<CommissionTier>("standard");
  const [payoutEmail, setPayoutEmail] = useState("");
  const [payoutMethod, setPayoutMethod] = useState<PayoutMethod | "">("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!name.trim()) {
      toast("Name is required", "error");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/affiliates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim() || null,
          commissionTier: tier,
          payoutEmail: payoutEmail.trim() || null,
          payoutMethod: payoutMethod || null,
        }),
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(json.error);
      }
      toast(`Created ${name}`);
      onCreated();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to create", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="p-4 rounded-xl space-y-3"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--studio-border)",
      }}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Name (or @handle)">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="@indydevdan"
            className="w-full px-2 py-1.5 rounded text-sm"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--studio-border)",
              color: "var(--text-primary)",
            }}
          />
        </Field>
        <Field label="Tier">
          <select
            value={tier}
            onChange={(e) => setTier(e.target.value as CommissionTier)}
            className="w-full px-2 py-1.5 rounded text-sm"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--studio-border)",
              color: "var(--text-primary)",
            }}
          >
            <option value="standard">{COMMISSION_LABEL.standard}</option>
            <option value="flagship">{COMMISSION_LABEL.flagship}</option>
          </select>
        </Field>
        <Field label="Contact email (optional)">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            className="w-full px-2 py-1.5 rounded text-sm"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--studio-border)",
              color: "var(--text-primary)",
            }}
          />
        </Field>
        <Field label="Payout email (for transfers)">
          <input
            value={payoutEmail}
            onChange={(e) => setPayoutEmail(e.target.value)}
            type="email"
            className="w-full px-2 py-1.5 rounded text-sm"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--studio-border)",
              color: "var(--text-primary)",
            }}
          />
        </Field>
        <Field label="Payout method">
          <select
            value={payoutMethod}
            onChange={(e) => setPayoutMethod(e.target.value as PayoutMethod | "")}
            className="w-full px-2 py-1.5 rounded text-sm"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--studio-border)",
              color: "var(--text-primary)",
            }}
          >
            <option value="">— Not set —</option>
            {PAYOUT_METHODS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </Field>
      </div>
      <div className="flex gap-2 justify-end">
        <button
          onClick={onClose}
          disabled={busy}
          className="px-3 py-1.5 rounded-md text-xs"
          style={{
            background: "transparent",
            border: "1px solid var(--studio-border)",
            color: "var(--text-secondary)",
          }}
        >
          Cancel
        </button>
        <button
          onClick={() => void submit()}
          disabled={busy}
          className="px-3 py-1.5 rounded-md text-xs font-medium"
          style={{
            background: "var(--studio-accent)",
            color: "var(--text-on-accent)",
            opacity: busy ? 0.5 : 1,
          }}
        >
          {busy ? "Creating…" : "Create"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</span>
      {children}
    </label>
  );
}
