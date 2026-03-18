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

function AccessRequestsTab({ toast }: { toast: (msg: string, type?: Toast["type"]) => void }) {
  const [requests, setRequests] = useState<AccessRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"" | "pending" | "approved" | "rejected">("");
  const [actioning, setActioning] = useState<string | null>(null);

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
    } catch {
      toast("Failed to load access requests", "error");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, toast]);

  useEffect(() => {
    void fetchRequests();
  }, [fetchRequests]);

  const handleAction = async (
    id: string,
    status: "approved" | "rejected"
  ) => {
    setActioning(id);
    try {
      const res = await fetch(`/api/admin/access-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update");
      const json = await res.json() as { inviteCode?: string };

      if (status === "approved" && json.inviteCode) {
        copyToClipboard(json.inviteCode);
        toast(`Approved — invite code ${json.inviteCode} copied to clipboard`);
      } else {
        toast(status === "approved" ? "Request approved" : "Request rejected");
      }

      void fetchRequests();
    } catch {
      toast("Failed to update request", "error");
    } finally {
      setActioning(null);
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
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="ml-auto text-sm px-3 py-1.5 rounded-lg outline-none"
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
          className="rounded-xl overflow-hidden"
          style={{ border: "1px solid var(--studio-border)" }}
        >
          <table className="w-full text-sm">
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
                    {row.name}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--text-secondary)" }}>
                    {row.email}
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
                  <td className="px-4 py-3">{statusBadge(row.status)}</td>
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

export function AdminClient() {
  const { data: session, isPending } = useSession();
  const [activeTab, setActiveTab] = useState<"codes" | "requests">("codes");
  const { toasts, show: toast } = useToast();

  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

  if (isPending) {
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

  // Client-side access denied (real security is on the API)
  const isAdmin =
    session?.user?.email &&
    (adminEmail ? session.user.email === adminEmail : true);

  if (!session || !isAdmin) {
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

  const tabs: { key: "codes" | "requests"; label: string }[] = [
    { key: "codes", label: "Invite codes" },
    { key: "requests", label: "Access requests" },
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

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Tabs */}
        <div
          className="flex gap-1 p-1 rounded-lg w-fit"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--studio-border)" }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="px-4 py-1.5 rounded-md text-sm font-medium transition-all"
              style={{
                background: activeTab === tab.key ? "var(--bg-elevated)" : "transparent",
                color: activeTab === tab.key ? "var(--text-primary)" : "var(--text-muted)",
                border: activeTab === tab.key ? "1px solid var(--studio-border)" : "1px solid transparent",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "codes" ? (
          <InviteCodesTab toast={toast} />
        ) : (
          <AccessRequestsTab toast={toast} />
        )}
      </div>

      <ToastContainer toasts={toasts} />
    </div>
  );
}
