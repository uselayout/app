"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "@/lib/auth-client";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

interface InviteCodeRow {
  code: string;
  created_by: string | null;
  batch_name: string | null;
  redeemed_by: string | null;
  redeemed_at: string | null;
  expires_at: string | null;
  created_at: string;
  redeemed_user?: { email: string } | null;
}

interface AccessRequestRow {
  id: string;
  name: string;
  email: string;
  whatBuilding: string;
  howHeard: string;
  status: "pending" | "approved" | "rejected";
  inviteCode: string | null;
  signedUp: boolean;
  createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function copyToClipboard(text: string) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).catch(() => {
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    });
  } else {
    const el = document.createElement("textarea");
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
  }
}

// ─── Toast ────────────────────────────────────────────────────────────────────

interface Toast {
  id: number;
  message: string;
  type: "success" | "error";
}

function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  let counter = 0;

  const show = useCallback((message: string, type: Toast["type"] = "success") => {
    const id = ++counter;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return { toasts, show };
}

function ToastContainer({ toasts }: { toasts: Toast[] }) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="px-4 py-3 rounded-lg text-sm font-mono"
          style={{
            background: t.type === "success" ? "var(--bg-elevated)" : "#3b1010",
            border: `1px solid ${t.type === "success" ? "var(--studio-border-strong)" : "#7f1d1d"}`,
            color: "var(--text-primary)",
          }}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}

// ─── Invite Codes Tab ─────────────────────────────────────────────────────────

function InviteCodesTab({ toast }: { toast: (msg: string, type?: Toast["type"]) => void }) {
  const [codes, setCodes] = useState<InviteCodeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const [batchFilter, setBatchFilter] = useState("");
  const [batchName, setBatchName] = useState("");
  const [count, setCount] = useState(10);

  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);

  // Assign to user state
  const [assignEmail, setAssignEmail] = useState("");
  const [assignCount, setAssignCount] = useState(3);
  const [assigning, setAssigning] = useState(false);
  const [assignedCodes, setAssignedCodes] = useState<string[]>([]);
  const [assignedToName, setAssignedToName] = useState("");

  const fetchCodes = useCallback(async () => {
    setLoading(true);
    try {
      const url = batchFilter
        ? `/api/admin/invite-codes?batchName=${encodeURIComponent(batchFilter)}`
        : "/api/admin/invite-codes";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json() as { codes: InviteCodeRow[] };
      setCodes(json.codes);
    } catch {
      toast("Failed to load invite codes", "error");
    } finally {
      setLoading(false);
    }
  }, [batchFilter, toast]);

  useEffect(() => {
    void fetchCodes();
  }, [fetchCodes]);

  const handleAssign = async () => {
    const email = assignEmail.trim();
    if (!email) {
      toast("Enter a user email", "error");
      return;
    }
    setAssigning(true);
    setAssignedCodes([]);
    try {
      const lookupRes = await fetch(
        `/api/admin/users/lookup?email=${encodeURIComponent(email)}`
      );
      if (!lookupRes.ok) {
        const err = await lookupRes.json().catch(() => ({ error: "User not found" })) as { error: string };
        toast(err.error ?? "User not found", "error");
        return;
      }
      const user = (await lookupRes.json()) as { userId: string; name: string };

      const assignRes = await fetch("/api/admin/invite-codes/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.userId, count: assignCount }),
      });
      if (!assignRes.ok) throw new Error("Failed to assign codes");
      const json = (await assignRes.json()) as { codes: string[] };
      setAssignedCodes(json.codes);
      setAssignedToName(user.name || email);
      toast(`Assigned ${json.codes.length} codes to ${user.name || email}`);
      void fetchCodes();
    } catch {
      toast("Failed to assign codes", "error");
    } finally {
      setAssigning(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setGeneratedCodes([]);
    try {
      const res = await fetch("/api/admin/invite-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          count,
          batchName: batchName.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to generate");
      const json = await res.json() as { codes: string[] };
      setGeneratedCodes(json.codes);
      toast(`Generated ${json.codes.length} codes`);
      void fetchCodes();
    } catch {
      toast("Failed to generate codes", "error");
    } finally {
      setGenerating(false);
    }
  };

  const batchNames = Array.from(
    new Set(codes.map((c) => c.batch_name).filter(Boolean) as string[])
  );

  return (
    <div className="space-y-8">
      {/* Generate form */}
      <div
        className="rounded-xl p-6 space-y-4"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--studio-border)",
        }}
      >
        <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
          Generate codes
        </h2>
        <div className="flex gap-3 flex-wrap">
          <input
            type="text"
            placeholder="Batch name (optional, e.g. @influencername)"
            value={batchName}
            onChange={(e) => setBatchName(e.target.value)}
            className="flex-1 min-w-48 px-3 py-2 rounded-lg text-sm outline-none"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--studio-border)",
              color: "var(--text-primary)",
            }}
          />
          <input
            type="number"
            min={1}
            max={50}
            value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(50, Number(e.target.value))))}
            className="w-24 px-3 py-2 rounded-lg text-sm outline-none"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--studio-border)",
              color: "var(--text-primary)",
            }}
          />
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: "var(--studio-accent)",
              color: "var(--text-on-accent, #08090a)",
              opacity: generating ? 0.6 : 1,
              cursor: generating ? "not-allowed" : "pointer",
            }}
          >
            {generating ? "Generating…" : "Generate codes"}
          </button>
        </div>

        {generatedCodes.length > 0 && (
          <div
            className="rounded-lg p-4 space-y-3"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--studio-border)",
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                {generatedCodes.length} codes generated
              </span>
              <button
                onClick={() => {
                  copyToClipboard(generatedCodes.join("\n"));
                  toast("Copied all codes");
                }}
                className="text-xs px-3 py-1 rounded-md transition-all"
                style={{
                  background: "var(--bg-hover)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--studio-border)",
                }}
              >
                Copy all
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {generatedCodes.map((code) => (
                <button
                  key={code}
                  onClick={() => {
                    copyToClipboard(code);
                    toast(`Copied ${code}`);
                  }}
                  className="px-3 py-1.5 rounded-md text-sm font-mono text-left transition-all"
                  style={{
                    background: "var(--bg-app)",
                    border: "1px solid var(--studio-border)",
                    color: "var(--text-primary)",
                  }}
                >
                  {code}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Assign to user */}
      <div
        className="rounded-xl p-6 space-y-4"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--studio-border)",
        }}
      >
        <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
          Assign codes to user
        </h2>
        <div className="flex gap-3 flex-wrap">
          <input
            type="email"
            placeholder="User email"
            value={assignEmail}
            onChange={(e) => setAssignEmail(e.target.value)}
            className="flex-1 min-w-48 px-3 py-2 rounded-lg text-sm outline-none"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--studio-border)",
              color: "var(--text-primary)",
            }}
          />
          <input
            type="number"
            min={1}
            max={50}
            value={assignCount}
            onChange={(e) => setAssignCount(Math.max(1, Math.min(50, Number(e.target.value))))}
            className="w-24 px-3 py-2 rounded-lg text-sm outline-none"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--studio-border)",
              color: "var(--text-primary)",
            }}
          />
          <button
            onClick={handleAssign}
            disabled={assigning}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: "var(--studio-accent)",
              color: "var(--text-on-accent, #08090a)",
              opacity: assigning ? 0.6 : 1,
              cursor: assigning ? "not-allowed" : "pointer",
            }}
          >
            {assigning ? "Assigning…" : "Assign codes"}
          </button>
        </div>

        {assignedCodes.length > 0 && (
          <div
            className="rounded-lg p-4 space-y-3"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--studio-border)",
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                {assignedCodes.length} codes assigned to {assignedToName}
              </span>
              <button
                onClick={() => {
                  copyToClipboard(assignedCodes.join("\n"));
                  toast("Copied all codes");
                }}
                className="text-xs px-3 py-1 rounded-md transition-all"
                style={{
                  background: "var(--bg-hover)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--studio-border)",
                }}
              >
                Copy all
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {assignedCodes.map((code) => (
                <button
                  key={code}
                  onClick={() => {
                    copyToClipboard(code);
                    toast(`Copied ${code}`);
                  }}
                  className="px-3 py-1.5 rounded-md text-sm font-mono text-left transition-all"
                  style={{
                    background: "var(--bg-app)",
                    border: "1px solid var(--studio-border)",
                    color: "var(--text-primary)",
                  }}
                >
                  {code}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filter + table */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            All codes
          </h2>
          <select
            value={batchFilter}
            onChange={(e) => setBatchFilter(e.target.value)}
            className="ml-auto text-sm px-3 py-1.5 rounded-lg outline-none"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--studio-border)",
              color: "var(--text-secondary)",
            }}
          >
            <option value="">All batches</option>
            {batchNames.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <p className="text-sm py-8 text-center" style={{ color: "var(--text-muted)" }}>
            Loading…
          </p>
        ) : codes.length === 0 ? (
          <p className="text-sm py-8 text-center" style={{ color: "var(--text-muted)" }}>
            No codes found
          </p>
        ) : (
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: "1px solid var(--studio-border)" }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--studio-border)" }}>
                  {["Code", "Batch", "Status", "Redeemed by", "Redeemed at", "Created"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-medium"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {codes.map((row, i) => {
                  const used = !!row.redeemed_by;
                  return (
                    <tr
                      key={row.code}
                      style={{
                        background: i % 2 === 0 ? "var(--bg-app)" : "var(--bg-surface)",
                        borderBottom: "1px solid var(--studio-border)",
                        opacity: used ? 0.6 : 1,
                      }}
                    >
                      <td className="px-4 py-3 font-mono" style={{ color: "var(--text-primary)" }}>
                        <button
                          onClick={() => {
                            copyToClipboard(row.code);
                            toast(`Copied ${row.code}`);
                          }}
                          title="Click to copy"
                        >
                          {row.code}
                        </button>
                      </td>
                      <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>
                        {row.batch_name ?? <span style={{ color: "var(--text-muted)" }}>—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            background: used
                              ? "rgba(100,100,120,0.15)"
                              : "rgba(52,211,153,0.1)",
                            color: used ? "var(--text-muted)" : "#34d399",
                            border: `1px solid ${used ? "rgba(100,100,120,0.2)" : "rgba(52,211,153,0.2)"}`,
                          }}
                        >
                          {used ? "Used" : "Available"}
                        </span>
                      </td>
                      <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>
                        {row.redeemed_user?.email ?? <span style={{ color: "var(--text-muted)" }}>—</span>}
                      </td>
                      <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>
                        {row.redeemed_at ? formatDate(row.redeemed_at) : <span style={{ color: "var(--text-muted)" }}>—</span>}
                      </td>
                      <td className="px-4 py-3" style={{ color: "var(--text-muted)" }}>
                        {formatDate(row.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Access Requests Tab ──────────────────────────────────────────────────────

function AccessRequestsTab({ toast, onPendingCountChange, onAction }: { toast: (msg: string, type?: Toast["type"]) => void; onPendingCountChange?: (count: number) => void; onAction?: () => void }) {
  const [requests, setRequests] = useState<AccessRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"" | "pending" | "approved" | "rejected">("");
  const [actioning, setActioning] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ id: string; field: "name" | "email"; value: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [senderEmail, setSenderEmail] = useState("matt@layout.design");
  const [sendingTest, setSendingTest] = useState(false);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const url = statusFilter
        ? `/api/admin/access-requests?status=${statusFilter}`
        : "/api/admin/access-requests";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json() as { requests: AccessRequestRow[] };
      setRequests(json.requests);
      // Update parent pending count when we have unfiltered data
      if (!statusFilter && onPendingCountChange) {
        onPendingCountChange(json.requests.filter((r) => r.status === "pending").length);
      }
    } catch {
      toast("Failed to load access requests", "error");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, toast, onPendingCountChange]);

  useEffect(() => {
    void fetchRequests();
  }, [fetchRequests]);

  const handleAction = async (
    id: string,
    status: "approved" | "rejected"
  ) => {
    setActioning(id);
    try {
      const payload: Record<string, string> = { status };
      if (status === "approved") {
        payload.fromEmail = senderEmail;
      }
      const res = await fetch(`/api/admin/access-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to update");
      const json = await res.json() as { inviteCode?: string; emailSent?: boolean };

      if (status === "approved" && json.inviteCode) {
        copyToClipboard(json.inviteCode);
        const emailMsg = json.emailSent
          ? ", welcome email sent"
          : " (email not sent)";
        toast(`Approved - code ${json.inviteCode} copied${emailMsg}`);
      } else {
        toast(status === "approved" ? "Request approved" : "Request rejected");
      }

      void fetchRequests();
      onAction?.();
    } catch {
      toast("Failed to update request", "error");
    } finally {
      setActioning(null);
    }
  };

  const handleFieldSave = async () => {
    if (!editing || !editing.value.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/access-requests/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [editing.field]: editing.value.trim() }),
      });
      if (!res.ok) throw new Error("Failed to update");
      toast(`Updated ${editing.field}`);
      setEditing(null);
      void fetchRequests();
    } catch {
      toast(`Failed to update ${editing.field}`, "error");
    } finally {
      setSaving(false);
    }
  };

  const statusBadge = (status: AccessRequestRow["status"]) => {
    const styles: Record<string, { bg: string; color: string; border: string }> = {
      pending: { bg: "rgba(251,191,36,0.1)", color: "#fbbf24", border: "rgba(251,191,36,0.2)" },
      approved: { bg: "rgba(52,211,153,0.1)", color: "#34d399", border: "rgba(52,211,153,0.2)" },
      rejected: { bg: "rgba(100,100,120,0.15)", color: "var(--text-muted)", border: "rgba(100,100,120,0.2)" },
    };
    const s = styles[status];
    return (
      <span
        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize"
        style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
          Access requests
        </h2>
        <div className="ml-auto flex items-center gap-2">
          <label className="text-xs" style={{ color: "var(--text-muted)" }}>Send from:</label>
          <select
            value={senderEmail}
            onChange={(e) => setSenderEmail(e.target.value)}
            className="text-sm px-3 py-1.5 rounded-lg outline-none"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--studio-border)",
              color: "var(--text-secondary)",
            }}
          >
            <option value="matt@layout.design">matt@layout.design</option>
            <option value="ben@layout.design">ben@layout.design</option>
            <option value="hello@layout.design">hello@layout.design</option>
          </select>
          <button
            onClick={async () => {
              const to = prompt("Send test welcome email to:");
              if (!to) return;
              setSendingTest(true);
              try {
                const res = await fetch("/api/admin/test-email", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ to, fromEmail: senderEmail }),
                });
                const json = await res.json() as { success?: boolean; skipped?: boolean; error?: string };
                if (!res.ok) {
                  toast(json.error || "Failed to send test email", "error");
                } else if (json.skipped) {
                  toast("RESEND_API_KEY not set, email skipped", "error");
                } else {
                  toast(`Test email sent to ${to}`);
                }
              } catch {
                toast("Failed to send test email", "error");
              } finally {
                setSendingTest(false);
              }
            }}
            disabled={sendingTest}
            className="text-xs px-3 py-1.5 rounded-lg transition-all"
            style={{
              background: "rgba(96,165,250,0.1)",
              color: "#60a5fa",
              border: "1px solid rgba(96,165,250,0.2)",
              opacity: sendingTest ? 0.5 : 1,
              cursor: sendingTest ? "not-allowed" : "pointer",
            }}
          >
            {sendingTest ? "Sending..." : "Send test email"}
          </button>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="text-sm px-3 py-1.5 rounded-lg outline-none"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--studio-border)",
              color: "var(--text-secondary)",
            }}
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p className="text-sm py-8 text-center" style={{ color: "var(--text-muted)" }}>
          Loading…
        </p>
      ) : requests.length === 0 ? (
        <p className="text-sm py-8 text-center" style={{ color: "var(--text-muted)" }}>
          No requests found
        </p>
      ) : (
        <div
          className="rounded-xl overflow-x-auto"
          style={{ border: "1px solid var(--studio-border)" }}
        >
          <table className="w-full text-sm" style={{ minWidth: 900 }}>
            <thead>
              <tr style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--studio-border)" }}>
                {["Name", "Email", "What building", "How heard", "Status", "Date", "Actions"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-medium"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {requests.map((row, i) => (
                <tr
                  key={row.id}
                  style={{
                    background: i % 2 === 0 ? "var(--bg-app)" : "var(--bg-surface)",
                    borderBottom: "1px solid var(--studio-border)",
                  }}
                >
                  <td className="px-4 py-3 font-medium" style={{ color: "var(--text-primary)" }}>
                    {editing?.id === row.id && editing.field === "name" ? (
                      <div className="flex items-center gap-1">
                        <input
                          autoFocus
                          value={editing.value}
                          onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                          onKeyDown={(e) => { if (e.key === "Enter") void handleFieldSave(); if (e.key === "Escape") setEditing(null); }}
                          className="px-2 py-0.5 rounded text-sm w-full outline-none"
                          style={{ background: "var(--bg-elevated)", border: "1px solid var(--studio-border-focus)", color: "var(--text-primary)" }}
                          disabled={saving}
                        />
                        <button onClick={() => void handleFieldSave()} disabled={saving} className="text-xs px-1.5 py-0.5 rounded" style={{ background: "rgba(52,211,153,0.1)", color: "#34d399" }}>✓</button>
                        <button onClick={() => setEditing(null)} className="text-xs px-1.5 py-0.5 rounded" style={{ color: "var(--text-muted)" }}>✗</button>
                      </div>
                    ) : (
                      <span
                        className="cursor-pointer hover:underline"
                        onClick={() => setEditing({ id: row.id, field: "name", value: row.name })}
                        title="Click to edit"
                      >
                        {row.name}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--text-secondary)" }}>
                    {editing?.id === row.id && editing.field === "email" ? (
                      <div className="flex items-center gap-1">
                        <input
                          autoFocus
                          type="email"
                          value={editing.value}
                          onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                          onKeyDown={(e) => { if (e.key === "Enter") void handleFieldSave(); if (e.key === "Escape") setEditing(null); }}
                          className="px-2 py-0.5 rounded text-xs font-mono w-full outline-none"
                          style={{ background: "var(--bg-elevated)", border: "1px solid var(--studio-border-focus)", color: "var(--text-primary)" }}
                          disabled={saving}
                        />
                        <button onClick={() => void handleFieldSave()} disabled={saving} className="text-xs px-1.5 py-0.5 rounded" style={{ background: "rgba(52,211,153,0.1)", color: "#34d399" }}>✓</button>
                        <button onClick={() => setEditing(null)} className="text-xs px-1.5 py-0.5 rounded" style={{ color: "var(--text-muted)" }}>✗</button>
                      </div>
                    ) : (
                      <span
                        className="cursor-pointer hover:underline"
                        onClick={() => setEditing({ id: row.id, field: "email", value: row.email })}
                        title="Click to edit"
                      >
                        {row.email}
                      </span>
                    )}
                  </td>
                  <td
                    className="px-4 py-3 max-w-48 truncate"
                    style={{ color: "var(--text-secondary)" }}
                    title={row.whatBuilding}
                  >
                    {row.whatBuilding}
                  </td>
                  <td
                    className="px-4 py-3 max-w-36 truncate"
                    style={{ color: "var(--text-secondary)" }}
                    title={row.howHeard}
                  >
                    {row.howHeard}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {statusBadge(row.status)}
                      {row.status === "approved" && row.signedUp && (
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            background: "rgba(96,165,250,0.1)",
                            color: "#60a5fa",
                            border: "1px solid rgba(96,165,250,0.2)",
                          }}
                        >
                          Signed up
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                    {formatDate(row.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    {row.status === "pending" ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAction(row.id, "approved")}
                          disabled={actioning === row.id}
                          className="px-3 py-1 rounded-md text-xs font-medium transition-all"
                          style={{
                            background: "rgba(52,211,153,0.1)",
                            color: "#34d399",
                            border: "1px solid rgba(52,211,153,0.2)",
                            opacity: actioning === row.id ? 0.5 : 1,
                            cursor: actioning === row.id ? "not-allowed" : "pointer",
                          }}
                        >
                          {actioning === row.id ? "…" : "Approve"}
                        </button>
                        <button
                          onClick={() => handleAction(row.id, "rejected")}
                          disabled={actioning === row.id}
                          className="px-3 py-1 rounded-md text-xs font-medium transition-all"
                          style={{
                            background: "rgba(100,100,120,0.15)",
                            color: "var(--text-muted)",
                            border: "1px solid rgba(100,100,120,0.2)",
                            opacity: actioning === row.id ? 0.5 : 1,
                            cursor: actioning === row.id ? "not-allowed" : "pointer",
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    ) : row.inviteCode ? (
                      <button
                        onClick={() => {
                          copyToClipboard(row.inviteCode!);
                          toast(`Copied ${row.inviteCode}`);
                        }}
                        className="flex items-center gap-2 px-3 py-1 rounded-md text-xs font-mono transition-all"
                        style={{
                          background: "var(--bg-elevated)",
                          color: "var(--text-secondary)",
                          border: "1px solid var(--studio-border)",
                        }}
                        title="Click to copy invite code"
                      >
                        {row.inviteCode}
                        <span style={{ color: "var(--text-muted)" }}>⧉</span>
                      </button>
                    ) : (
                      <span style={{ color: "var(--text-muted)" }}>—</span>
                    )}
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

// ─── Admin Client ─────────────────────────────────────────────────────────────

// ─── Admin Stats ─────────────────────────────────────────────────────────────

interface AdminStatsData {
  totalRequests: number;
  pending: number;
  approved: number;
  rejected: number;
  totalSignups: number;
  totalUsers: number;
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div
      className="flex flex-col gap-1 px-4 py-3 rounded-lg"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--studio-border)",
      }}
    >
      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
        {label}
      </span>
      <span
        className="text-xl font-semibold font-mono tabular-nums"
        style={{ color: accent ?? "var(--text-primary)" }}
      >
        {value}
      </span>
    </div>
  );
}

function AdminStats({ stats }: { stats: AdminStatsData | null }) {
  if (!stats) return null;
  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
      <StatCard label="Total requests" value={stats.totalRequests} />
      <StatCard label="Pending" value={stats.pending} accent="#fbbf24" />
      <StatCard label="Approved" value={stats.approved} accent="#34d399" />
      <StatCard label="Rejected" value={stats.rejected} />
      <StatCard label="Signups" value={stats.totalSignups} accent="#60a5fa" />
      <StatCard label="Registered users" value={stats.totalUsers} accent="#a78bfa" />
    </div>
  );
}

// ─── Changelog Tab ──────────────────────────────────────────────────────────

interface ChangelogEntryData {
  id: string;
  title: string;
  description: string;
  product: string;
  category: string;
  date: string;
}

interface ChangelogWeekData {
  weekId: string;
  label: string;
  entries: ChangelogEntryData[];
}

const PRODUCTS = [
  { value: "studio", label: "Studio" },
  { value: "cli", label: "CLI" },
  { value: "figma-plugin", label: "Figma Plugin" },
  { value: "chrome-extension", label: "Chrome Extension" },
] as const;

const CATEGORIES = [
  { value: "new", label: "New" },
  { value: "improved", label: "Improved" },
  { value: "fixed", label: "Fixed" },
] as const;

const productBadgeStyles: Record<string, { bg: string; text: string; label: string }> = {
  studio: { bg: "rgba(255,255,255,0.1)", text: "rgba(255,255,255,0.8)", label: "Studio" },
  cli: { bg: "rgba(16,185,129,0.15)", text: "rgb(52,211,153)", label: "CLI" },
  "figma-plugin": { bg: "rgba(139,92,246,0.15)", text: "rgb(167,139,250)", label: "Figma Plugin" },
  "chrome-extension": { bg: "rgba(245,158,11,0.15)", text: "rgb(251,191,36)", label: "Chrome Extension" },
};

const categoryLabels: Record<string, string> = {
  new: "New",
  improved: "Improved",
  fixed: "Fixed",
};

function generateEntryId(title: string): string {
  const now = new Date();
  const jan4 = new Date(now.getFullYear(), 0, 4);
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86400000
  );
  const weekNum = Math.ceil((dayOfYear + jan4.getDay() + 1) / 7);
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
  return `${now.getFullYear()}-w${weekNum}-${slug}`;
}

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const inputStyle = {
  background: "var(--bg-panel)",
  border: "1px solid var(--studio-border)",
  color: "var(--text-primary)",
};

const selectStyle = {
  background: "var(--bg-panel)",
  border: "1px solid var(--studio-border)",
  color: "var(--text-primary)",
  appearance: "none" as const,
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.4)' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 8px center",
};

function ChangelogTab({ toast }: { toast: (msg: string, type?: "success" | "error") => void }) {
  const [draft, setDraft] = useState<ChangelogEntryData[]>([]);
  const [published, setPublished] = useState<ChangelogWeekData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Add/edit form state
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formProduct, setFormProduct] = useState("studio");
  const [formCategory, setFormCategory] = useState("new");
  const [formDate, setFormDate] = useState(todayISO());

  const fetchChangelog = useCallback(() => {
    fetch("/api/admin/changelog")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { draft: ChangelogEntryData[]; published: ChangelogWeekData[] } | null) => {
        if (data) {
          setDraft(data.draft);
          setPublished(data.published);
        }
      })
      .catch(() => toast("Failed to load changelog", "error"))
      .finally(() => setLoading(false));
  }, [toast]);

  useEffect(() => {
    fetchChangelog();
  }, [fetchChangelog]);

  const saveDraft = useCallback((entries: ChangelogEntryData[]) => {
    setSaving(true);
    fetch("/api/admin/changelog", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entries }),
    })
      .then(async (r) => {
        if (r.ok) {
          setDraft(entries);
        } else {
          const data = await r.json();
          toast(data.error || "Save failed", "error");
        }
      })
      .catch(() => toast("Save failed", "error"))
      .finally(() => setSaving(false));
  }, [toast]);

  const resetForm = () => {
    setFormTitle("");
    setFormDescription("");
    setFormProduct("studio");
    setFormCategory("new");
    setFormDate(todayISO());
    setEditingId(null);
    setShowAddForm(false);
  };

  const handleAdd = () => {
    if (!formTitle.trim() || !formDescription.trim()) {
      toast("Title and description are required", "error");
      return;
    }
    const entry: ChangelogEntryData = {
      id: generateEntryId(formTitle),
      title: formTitle.trim(),
      description: formDescription.trim(),
      product: formProduct,
      category: formCategory,
      date: formDate,
    };
    saveDraft([...draft, entry]);
    toast("Entry added");
    resetForm();
  };

  const handleEdit = (entry: ChangelogEntryData) => {
    setEditingId(entry.id);
    setFormTitle(entry.title);
    setFormDescription(entry.description);
    setFormProduct(entry.product);
    setFormCategory(entry.category);
    setFormDate(entry.date);
    setShowAddForm(false);
  };

  const handleSaveEdit = () => {
    if (!formTitle.trim() || !formDescription.trim()) {
      toast("Title and description are required", "error");
      return;
    }
    const updated = draft.map((e) =>
      e.id === editingId
        ? { ...e, title: formTitle.trim(), description: formDescription.trim(), product: formProduct, category: formCategory, date: formDate }
        : e
    );
    saveDraft(updated);
    toast("Entry updated");
    resetForm();
  };

  const handleRemove = (id: string) => {
    saveDraft(draft.filter((e) => e.id !== id));
    toast("Entry removed");
    if (editingId === id) resetForm();
  };

  const handlePublish = () => {
    if (draft.length === 0) return;
    setPublishing(true);
    fetch("/api/admin/changelog", { method: "POST" })
      .then(async (r) => {
        const data = await r.json();
        if (r.ok) {
          toast(`Published ${data.entryCount} entries for ${data.label}`);
          fetchChangelog();
          resetForm();
        } else {
          toast(data.error || "Publish failed", "error");
        }
      })
      .catch(() => toast("Publish failed", "error"))
      .finally(() => setPublishing(false));
  };

  if (loading) {
    return (
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading changelog…</p>
    );
  }

  const isEditing = editingId !== null;
  const showForm = showAddForm || isEditing;

  return (
    <div className="space-y-6">
      {/* Draft section */}
      <div
        className="rounded-lg p-5 space-y-4"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--studio-border)" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Draft entries
            </h3>
            {draft.length > 0 && (
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                {draft.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!showForm && (
              <button
                onClick={() => { resetForm(); setShowAddForm(true); }}
                className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                style={{ background: "var(--bg-elevated)", color: "var(--text-primary)", border: "1px solid var(--studio-border)" }}
              >
                + Add entry
              </button>
            )}
            {draft.length > 0 && (
              <button
                onClick={handlePublish}
                disabled={publishing || saving}
                className="px-4 py-1.5 rounded-md text-xs font-semibold transition-all"
                style={{
                  background: "var(--studio-accent)",
                  color: "var(--text-on-accent, #08090a)",
                  opacity: publishing || saving ? 0.6 : 1,
                }}
              >
                {publishing ? "Publishing…" : "Publish all"}
              </button>
            )}
          </div>
        </div>

        {/* Add/Edit form */}
        {showForm && (
          <div
            className="rounded-md p-4 space-y-3"
            style={{ background: "var(--bg-panel)", border: "1px solid var(--studio-border-strong)" }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
                {isEditing ? "Edit entry" : "New entry"}
              </span>
              <button
                onClick={resetForm}
                className="text-xs transition-opacity hover:opacity-80"
                style={{ color: "var(--text-muted)" }}
              >
                Cancel
              </button>
            </div>

            <input
              type="text"
              placeholder="Title"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="w-full rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-white/20"
              style={inputStyle}
            />

            <textarea
              placeholder="Description (1-2 sentences, user-friendly language)"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              rows={2}
              className="w-full rounded-md px-3 py-2 text-sm outline-none resize-none focus:ring-1 focus:ring-white/20"
              style={inputStyle}
            />

            <div className="flex gap-3">
              <select
                value={formProduct}
                onChange={(e) => setFormProduct(e.target.value)}
                className="rounded-md px-3 py-2 text-sm outline-none pr-7"
                style={selectStyle}
              >
                {PRODUCTS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>

              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="rounded-md px-3 py-2 text-sm outline-none pr-7"
                style={selectStyle}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>

              <input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="rounded-md px-3 py-2 text-sm outline-none"
                style={inputStyle}
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={isEditing ? handleSaveEdit : handleAdd}
                disabled={saving || !formTitle.trim() || !formDescription.trim()}
                className="px-4 py-1.5 rounded-md text-xs font-semibold transition-all"
                style={{
                  background: "var(--studio-accent)",
                  color: "var(--text-on-accent, #08090a)",
                  opacity: saving || !formTitle.trim() || !formDescription.trim() ? 0.5 : 1,
                }}
              >
                {saving ? "Saving…" : isEditing ? "Save changes" : "Add entry"}
              </button>
            </div>
          </div>
        )}

        {/* Draft entries list */}
        {draft.length === 0 && !showForm ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            No draft entries yet. Click &quot;Add entry&quot; to create one.
          </p>
        ) : (
          <div className="space-y-2">
            {draft.map((entry) => {
              const badge = productBadgeStyles[entry.product] || productBadgeStyles.studio;
              const isBeingEdited = editingId === entry.id;
              return (
                <div
                  key={entry.id}
                  className="rounded-md p-3 group"
                  style={{
                    background: isBeingEdited ? "var(--bg-elevated)" : "var(--bg-panel)",
                    border: isBeingEdited ? "1px solid var(--studio-border-strong)" : "1px solid var(--studio-border)",
                  }}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0"
                          style={{ background: badge.bg, color: badge.text }}
                        >
                          {badge.label}
                        </span>
                        <span className="text-[10px] font-medium shrink-0" style={{ color: "var(--text-muted)" }}>
                          {categoryLabels[entry.category] || entry.category}
                        </span>
                        <span className="text-[10px] font-mono shrink-0 ml-auto" style={{ color: "var(--text-muted)" }}>
                          {entry.date}
                        </span>
                      </div>
                      <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                        {entry.title}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                        {entry.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(entry)}
                        className="px-2 py-1 rounded text-[11px] transition-all hover:opacity-80"
                        style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px solid var(--studio-border)" }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleRemove(entry.id)}
                        className="px-2 py-1 rounded text-[11px] transition-all hover:opacity-80"
                        style={{ background: "rgba(239,68,68,0.1)", color: "rgb(239,68,68)", border: "1px solid rgba(239,68,68,0.2)" }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent published */}
      {published.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Recently published
          </h3>
          {published.map((week) => (
            <div key={week.weekId} className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                {week.label}
              </p>
              <div
                className="rounded-lg overflow-hidden"
                style={{ border: "1px solid var(--studio-border)" }}
              >
                {week.entries.map((entry, i) => {
                  const badge = productBadgeStyles[entry.product] || productBadgeStyles.studio;
                  return (
                    <div
                      key={entry.id}
                      className="flex items-center gap-3 px-3 py-2 text-xs"
                      style={{
                        background: i % 2 === 0 ? "var(--bg-surface)" : "var(--bg-panel)",
                        borderTop: i > 0 ? "1px solid var(--studio-border)" : undefined,
                      }}
                    >
                      <span
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0"
                        style={{ background: badge.bg, color: badge.text }}
                      >
                        {badge.label}
                      </span>
                      <span style={{ color: "var(--text-primary)" }}>{entry.title}</span>
                      <span className="ml-auto shrink-0" style={{ color: "var(--text-muted)" }}>
                        {entry.description.length > 60 ? entry.description.slice(0, 60) + "…" : entry.description}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Admin Component ────────────────────────────────────────────────────

export function AdminClient() {
  const { data: session, isPending } = useSession();
  const [activeTab, setActiveTab] = useState<"codes" | "requests" | "changelog">("codes");
  const { toasts, show: toast } = useToast();
  const [pendingCount, setPendingCount] = useState(0);
  const [stats, setStats] = useState<AdminStatsData | null>(null);

  const [adminStatus, setAdminStatus] = useState<"loading" | "granted" | "denied">("loading");

  const fetchStats = useCallback(() => {
    fetch("/api/admin/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((json: AdminStatsData | null) => {
        if (json) {
          setStats(json);
          setPendingCount(json.pending);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (isPending) return;
    if (!session) {
      setAdminStatus("denied");
      return;
    }
    // Verify admin access server-side (env var check happens there)
    fetch("/api/admin/invite-codes", { method: "GET" })
      .then((res) => {
        setAdminStatus(res.ok ? "granted" : "denied");
        if (res.ok) {
          fetchStats();
        }
      })
      .catch(() => setAdminStatus("denied"));
  }, [session, isPending, fetchStats]);

  if (isPending || adminStatus === "loading") {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--bg-app)" }}
      >
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Loading…
        </p>
      </div>
    );
  }

  if (!session || adminStatus === "denied") {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4"
        style={{ background: "var(--bg-app)" }}
      >
        <p className="text-base font-medium" style={{ color: "var(--text-primary)" }}>
          Access denied
        </p>
        <Link
          href="/"
          className="text-sm"
          style={{ color: "var(--studio-accent)" }}
        >
          Back to studio
        </Link>
      </div>
    );
  }

  const tabs: { key: "codes" | "requests" | "changelog"; label: string }[] = [
    { key: "codes", label: "Invite codes" },
    { key: "requests", label: "Access requests" },
    { key: "changelog", label: "Changelog" },
  ];

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--bg-app)", color: "var(--text-primary)" }}
    >
      {/* Header */}
      <div
        className="sticky top-0 z-10 px-6 py-4 flex items-center gap-4"
        style={{
          background: "var(--bg-panel)",
          borderBottom: "1px solid var(--studio-border)",
        }}
      >
        <Link
          href="/"
          className="text-xs transition-all"
          style={{ color: "var(--text-muted)" }}
        >
          ← Studio
        </Link>
        <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          Admin
        </span>
        <span
          className="ml-auto text-xs font-mono"
          style={{ color: "var(--text-muted)" }}
        >
          {session.user.email}
        </span>
      </div>

      <div className="mx-auto px-6 py-8 space-y-6">
        {/* Tabs */}
        <div
          className="flex gap-1 p-1 rounded-lg w-fit"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--studio-border)" }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2"
              style={{
                background: activeTab === tab.key ? "var(--bg-elevated)" : "transparent",
                color: activeTab === tab.key ? "var(--text-primary)" : "var(--text-muted)",
                border: activeTab === tab.key ? "1px solid var(--studio-border)" : "1px solid transparent",
              }}
            >
              {tab.label}
              {tab.key === "requests" && pendingCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Stats */}
        <AdminStats stats={stats} />

        {/* Tab content */}
        {activeTab === "codes" && (
          <InviteCodesTab toast={toast} />
        )}
        {activeTab === "requests" && (
          <AccessRequestsTab toast={toast} onPendingCountChange={setPendingCount} onAction={fetchStats} />
        )}
        {activeTab === "changelog" && (
          <ChangelogTab toast={toast} />
        )}
      </div>

      <ToastContainer toasts={toasts} />
    </div>
  );
}
