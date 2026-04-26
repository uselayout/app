"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "@/lib/auth-client";
import Link from "next/link";
import { EmailTab } from "./EmailTab";
import { DashboardTab } from "./DashboardTab";
import { RoadmapTab } from "./RoadmapTab";
import { VariantsTab } from "./VariantsTab";
import { AIModelsTab } from "./AIModelsTab";
import { KitsTab } from "./KitsTab";
import { KitRequestsTab } from "./KitRequestsTab";

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

interface EmailLogEntry {
  type: string;
  sentAt: string;
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
  signedUpAt: string | null;
  createdAt: string;
  emailLog: EmailLogEntry[];
}

function getEmailTypes(row: AccessRequestRow): string[] {
  return row.emailLog.map((e) => e.type);
}

function getEmailEntry(row: AccessRequestRow, type: string): EmailLogEntry | undefined {
  return row.emailLog.find((e) => e.type === type);
}

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
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
          className="px-4 py-3 rounded-lg text-sm font-mono shadow-lg"
          style={{
            // Hardcoded dark-on-light contrast so the toast is readable
            // regardless of which admin route's CSS variables resolve here.
            background: t.type === "success" ? "#1a1a20" : "#3b1010",
            border: `1px solid ${t.type === "success" ? "rgba(255,255,255,0.18)" : "#7f1d1d"}`,
            color: "#ffffff",
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
                        background: i % 2 === 0 ? "var(--bg-surface)" : "var(--bg-panel)",
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

function applyClientFilter(requests: AccessRequestRow[], filter: string): AccessRequestRow[] {
  switch (filter) {
    case "signed_up":
      return requests
        .filter((r) => r.status === "approved" && r.signedUp)
        .sort((a, b) => (b.signedUpAt ?? "").localeCompare(a.signedUpAt ?? ""));
    case "not_signed_up":
      return requests.filter((r) => r.status === "approved" && !r.signedUp);
    case "no_reminder":
      return requests.filter((r) => r.status === "approved" && !r.signedUp && !getEmailTypes(r).includes("reminder") && !getEmailTypes(r).includes("final_reminder"));
    case "reminder_sent":
      return requests.filter((r) => r.status === "approved" && getEmailTypes(r).includes("reminder") && !getEmailTypes(r).includes("final_reminder"));
    case "final_sent":
      return requests.filter((r) => r.status === "approved" && getEmailTypes(r).includes("final_reminder"));
    default:
      return requests;
  }
}

// ─── Access Requests Tab ──────────────────────────────────────────────────────

function AccessRequestsTab({ toast, onPendingCountChange, onAction }: { toast: (msg: string, type?: Toast["type"]) => void; onPendingCountChange?: (count: number) => void; onAction?: () => void }) {
  const [requests, setRequests] = useState<AccessRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"" | "pending" | "approved" | "rejected" | "signed_up" | "not_signed_up" | "no_reminder" | "reminder_sent" | "final_sent">("");
  const [actioning, setActioning] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ id: string; field: "name" | "email"; value: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [senderEmail, setSenderEmail] = useState("matt@layout.design");
  const [sendingTest, setSendingTest] = useState(false);
  const [resending, setResending] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [whatBuildingWidth, setWhatBuildingWidth] = useState(320);
  const [searchQuery, setSearchQuery] = useState("");
  const [backfilling, setBackfilling] = useState(false);

  const filteredRequests = useMemo(() => {
    if (!searchQuery.trim()) return requests;
    const q = searchQuery.toLowerCase();
    return requests.filter((r) => r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q));
  }, [requests, searchQuery]);

  // Background refresh without loading state (preserves scroll position)
  const refreshRequestsQuietly = useCallback(async () => {
    try {
      const clientSideFilters = ["signed_up", "not_signed_up", "no_reminder", "reminder_sent", "final_sent"];
      const apiFilter = clientSideFilters.includes(statusFilter) ? "" : statusFilter;
      const url = apiFilter
        ? `/api/admin/access-requests?status=${apiFilter}`
        : "/api/admin/access-requests";
      const res = await fetch(url);
      if (!res.ok) return;
      const json = await res.json() as { requests: AccessRequestRow[] };
      const filtered = applyClientFilter(json.requests, statusFilter);
      setRequests(filtered);
      if (!statusFilter && onPendingCountChange) {
        onPendingCountChange(json.requests.filter((r) => r.status === "pending").length);
      }
    } catch { /* silent */ }
  }, [statusFilter, onPendingCountChange]);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const clientSideFilters = ["signed_up", "not_signed_up", "no_reminder", "reminder_sent", "final_sent"];
      const apiFilter = clientSideFilters.includes(statusFilter) ? "" : statusFilter;
      const url = apiFilter
        ? `/api/admin/access-requests?status=${apiFilter}`
        : "/api/admin/access-requests";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json() as { requests: AccessRequestRow[] };
      const filtered = applyClientFilter(json.requests, statusFilter);
      setRequests(filtered);
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

      // Update row in-place to avoid table jump from full reload
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r))
      );
      void refreshRequestsQuietly();
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
      setRequests((prev) =>
        prev.map((r) => (r.id === editing.id ? { ...r, [editing.field]: editing.value.trim() } : r))
      );
      setEditing(null);
      void refreshRequestsQuietly();
    } catch {
      toast(`Failed to update ${editing.field}`, "error");
    } finally {
      setSaving(false);
    }
  };

  const getEmailActions = (row: AccessRequestRow): { type: string; label: string }[] => {
    if (row.status !== "approved" || row.signedUp) return [];
    const types = getEmailTypes(row);
    const hasWelcome = types.includes("welcome") || row.inviteCode != null;
    if (types.includes("final_reminder")) return [{ type: "welcome", label: "Resend welcome" }];
    if (types.includes("reminder")) return [{ type: "final_reminder", label: "Send final reminder" }, { type: "welcome", label: "Resend welcome" }];
    if (hasWelcome) return [{ type: "reminder", label: "Send reminder" }, { type: "welcome", label: "Resend welcome" }];
    return [{ type: "welcome", label: "Send welcome" }];
  };

  const getEmailStatusInfo = (row: AccessRequestRow): { label: string; daysAgo: number | null } | null => {
    const types = getEmailTypes(row);
    const finalEntry = getEmailEntry(row, "final_reminder");
    if (finalEntry) {
      return { label: "Final sent", daysAgo: daysSince(finalEntry.sentAt) };
    }
    const reminderEntry = getEmailEntry(row, "reminder");
    if (reminderEntry) {
      return { label: "1st reminder", daysAgo: daysSince(reminderEntry.sentAt) };
    }
    if (types.includes("welcome") || row.inviteCode != null) {
      return { label: "Welcome sent", daysAgo: null };
    }
    return null;
  };

  const handleResend = async (row: AccessRequestRow, actionType: string, actionLabel: string) => {
    setResending(row.id);
    setOpenDropdown(null);
    try {
      const res = await fetch(`/api/admin/access-requests/${row.id}/resend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromEmail: senderEmail, type: actionType }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({ error: "Failed" })) as { error?: string };
        throw new Error(json.error ?? "Failed to send");
      }
      toast(`Sent: ${actionLabel}`);
      // Optimistic update so button/status reflects new state immediately
      setRequests((prev) =>
        prev.map((r) =>
          r.id === row.id
            ? { ...r, emailLog: [...r.emailLog, { type: actionType, sentAt: new Date().toISOString() }] }
            : r
        )
      );
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to send email", "error");
    } finally {
      setResending(null);
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    if (!openDropdown) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-email-dropdown]")) setOpenDropdown(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openDropdown]);

  const statusBadge = (status: AccessRequestRow["status"]) => {
    const styles: Record<string, { bg: string; color: string; border: string }> = {
      pending: { bg: "rgba(251,191,36,0.1)", color: "var(--status-warning)", border: "rgba(251,191,36,0.2)" },
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
          <button
            onClick={async () => {
              setBackfilling(true);
              try {
                const res = await fetch("/api/admin/backfill-email-log", { method: "POST" });
                const json = await res.json() as Record<string, unknown>;
                console.log("[backfill-email-log] Full response:", json);
                if (!res.ok) {
                  toast((json.error as string) || "Backfill failed", "error");
                } else {
                  toast(`Backfill: ${json.inserted} inserted, ${json.skipped} skipped, ${json.matched} matched (${json.fetched} emails from Resend)`);
                  void fetchRequests();
                }
              } catch {
                toast("Backfill failed", "error");
              } finally {
                setBackfilling(false);
              }
            }}
            disabled={backfilling}
            className="text-xs px-3 py-1.5 rounded-lg transition-all"
            style={{
              background: "rgba(245,158,11,0.1)",
              color: "#f59e0b",
              border: "1px solid rgba(245,158,11,0.2)",
              opacity: backfilling ? 0.5 : 1,
              cursor: backfilling ? "not-allowed" : "pointer",
            }}
          >
            {backfilling ? "Backfilling..." : "Sync from Resend"}
          </button>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name or email..."
            className="text-sm px-3 py-1.5 rounded-lg outline-none"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--studio-border)",
              color: "var(--text-primary)",
              width: 220,
            }}
          />
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
            <option value="signed_up">Signed up</option>
            <option value="not_signed_up">Approved (not signed up)</option>
            <option value="no_reminder">No reminder sent</option>
            <option value="reminder_sent">1st reminder sent</option>
            <option value="final_sent">Final reminder sent</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p className="text-sm py-8 text-center" style={{ color: "var(--text-muted)" }}>
          Loading…
        </p>
      ) : filteredRequests.length === 0 ? (
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
                {["Name", "Email"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--text-muted)" }}>{h}</th>
                ))}
                <th
                  className="px-4 py-3 text-left text-xs font-medium relative select-none"
                  style={{ color: "var(--text-muted)", width: whatBuildingWidth }}
                >
                  What building
                  <div
                    className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-white/20"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      const startX = e.clientX;
                      const startW = whatBuildingWidth;
                      const onMove = (ev: MouseEvent) => {
                        const newW = Math.max(150, Math.min(600, startW + ev.clientX - startX));
                        setWhatBuildingWidth(newW);
                      };
                      const onUp = () => {
                        document.removeEventListener("mousemove", onMove);
                        document.removeEventListener("mouseup", onUp);
                      };
                      document.addEventListener("mousemove", onMove);
                      document.addEventListener("mouseup", onUp);
                    }}
                  />
                </th>
                {["How heard", "Status", "Date", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--text-muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((row, i) => (
                <tr
                  key={row.id}
                  style={{
                    background: i % 2 === 0 ? "var(--bg-surface)" : "var(--bg-panel)",
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
                    className="px-4 py-3 truncate"
                    style={{ color: "var(--text-secondary)", maxWidth: whatBuildingWidth }}
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
                      {row.status === "approved" && !row.signedUp && (
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {Math.floor((Date.now() - new Date(row.createdAt).getTime()) / 86400000)}d
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
                      <div className="flex items-center gap-2">
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
                        {(() => {
                          const statusInfo = getEmailStatusInfo(row);
                          const actions = getEmailActions(row);
                          return (
                            <div className="flex items-center gap-2">
                              {statusInfo && (
                                <span className="text-[10px] whitespace-nowrap" style={{ color: statusInfo.label === "1st reminder" ? "var(--status-warning)" : statusInfo.label === "Final sent" ? "#f87171" : "var(--text-muted)" }}>
                                  {statusInfo.label}{statusInfo.daysAgo != null ? ` (${statusInfo.daysAgo}d ago)` : ""}
                                </span>
                              )}
                              {actions.length > 0 && (
                                <div className="relative" data-email-dropdown>
                                  <div className="flex items-center">
                                    <button
                                      onClick={() => void handleResend(row, actions[0].type, actions[0].label)}
                                      disabled={resending === row.id}
                                      className="px-3 py-1 rounded-l-md text-xs font-medium transition-all whitespace-nowrap"
                                      style={{
                                        background: "rgba(96,165,250,0.1)",
                                        color: "#60a5fa",
                                        border: "1px solid rgba(96,165,250,0.2)",
                                        borderRight: actions.length > 1 ? "none" : undefined,
                                        borderRadius: actions.length > 1 ? "6px 0 0 6px" : "6px",
                                        opacity: resending === row.id ? 0.5 : 1,
                                        cursor: resending === row.id ? "not-allowed" : "pointer",
                                      }}
                                    >
                                      {resending === row.id ? "Sending..." : actions[0].label}
                                    </button>
                                    {actions.length > 1 && (
                                      <button
                                        onClick={() => setOpenDropdown(openDropdown === row.id ? null : row.id)}
                                        className="px-1.5 py-1 rounded-r-md text-xs transition-all"
                                        style={{
                                          background: "rgba(96,165,250,0.1)",
                                          color: "#60a5fa",
                                          border: "1px solid rgba(96,165,250,0.2)",
                                          borderLeft: "1px solid rgba(96,165,250,0.3)",
                                          cursor: "pointer",
                                        }}
                                      >
                                        ▾
                                      </button>
                                    )}
                                  </div>
                                  {openDropdown === row.id && actions.length > 1 && (
                                    <div
                                      className="absolute right-0 top-full mt-1 z-50 rounded-md py-1"
                                      style={{
                                        background: "var(--bg-elevated)",
                                        border: "1px solid var(--studio-border-strong)",
                                        minWidth: "140px",
                                      }}
                                    >
                                      {actions.slice(1).map((action) => (
                                        <button
                                          key={action.type}
                                          onClick={() => void handleResend(row, action.type, action.label)}
                                          className="w-full text-left px-3 py-1.5 text-xs transition-colors hover:bg-[var(--bg-hover)]"
                                          style={{ color: "#60a5fa" }}
                                        >
                                          {action.label}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    ) : row.status === "rejected" ? (
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
  signedUp: number;
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
    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
      <StatCard label="Total requests" value={stats.totalRequests} />
      <StatCard label="Pending" value={stats.pending} accent="var(--status-warning)" />
      <StatCard label="Approved" value={stats.approved} accent="#34d399" />
      <StatCard label="Rejected" value={stats.rejected} />
      <StatCard label="Signed up" value={stats.signedUp} accent="#60a5fa" />
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

interface ChangelogItemData {
  text: string;
  product: string;
  category: string;
}

interface CompiledData {
  weekId: string;
  label: string;
  summary: string;
  items: ChangelogItemData[];
}

interface ChangelogWeekData {
  weekId: string;
  label: string;
  summary: string;
  items: ChangelogItemData[];
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
  studio: { bg: "var(--studio-border)", text: "var(--text-primary)", label: "Studio" },
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

const PRODUCT_ORDER = ["studio", "cli", "figma-plugin", "chrome-extension"];

function ChangelogTab({ toast }: { toast: (msg: string, type?: "success" | "error") => void }) {
  const [draft, setDraft] = useState<ChangelogEntryData[]>([]);
  const [published, setPublished] = useState<ChangelogWeekData[]>([]);
  const [compiled, setCompiled] = useState<CompiledData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCompiled, setShowCompiled] = useState(false);

  // Compiled edit state
  const [editSummary, setEditSummary] = useState("");
  const [editItems, setEditItems] = useState<ChangelogItemData[]>([]);

  // Add/edit form state
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formProduct, setFormProduct] = useState("studio");
  const [formCategory, setFormCategory] = useState("new");
  const [formDate, setFormDate] = useState(todayISO());

  const fetchChangelog = useCallback(() => {
    fetch("/api/admin/changelog")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { draft: ChangelogEntryData[]; compiled: CompiledData | null; published: ChangelogWeekData[] } | null) => {
        if (data) {
          setDraft(data.draft);
          setCompiled(data.compiled);
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
          // Re-fetch to get updated compiled data
          fetch("/api/admin/changelog")
            .then((r2) => (r2.ok ? r2.json() : null))
            .then((data: { compiled: CompiledData | null } | null) => {
              if (data) setCompiled(data.compiled);
            });
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
    setShowCompiled(false);
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

  const handleCompile = () => {
    if (!compiled) return;
    setEditSummary(compiled.summary);
    setEditItems([...compiled.items]);
    setShowCompiled(true);
    resetForm();
  };

  const handleRemoveItem = (index: number) => {
    setEditItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateItemText = (index: number, text: string) => {
    setEditItems((prev) => prev.map((item, i) => i === index ? { ...item, text } : item));
  };

  const handlePublish = () => {
    if (!compiled) return;
    setPublishing(true);
    const week = {
      weekId: compiled.weekId,
      label: compiled.label,
      summary: editSummary,
      items: editItems,
    };
    fetch("/api/admin/changelog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(week),
    })
      .then(async (r) => {
        const data = await r.json();
        if (r.ok) {
          toast(`Published ${data.entryCount} items for ${data.label}`);
          setShowCompiled(false);
          fetchChangelog();
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

  const CATEGORY_ORDER = ["new", "improved", "fixed"] as const;

  // Group items by product, then by category within each product
  const groupedItems = PRODUCT_ORDER
    .map((product) => {
      const productItems = editItems.filter((item) => item.product === product);
      const byCategory = CATEGORY_ORDER
        .map((cat) => ({
          category: cat,
          label: categoryLabels[cat],
          items: productItems.filter((item) => item.category === cat),
        }))
        .filter((g) => g.items.length > 0);
      return {
        product,
        badge: productBadgeStyles[product],
        byCategory,
        totalCount: productItems.length,
      };
    })
    .filter((g) => g.totalCount > 0);

  // Generate social copy text
  const generateTwitterText = () => {
    if (!compiled) return "";
    const lines: string[] = [`Layout changelog - ${compiled.label}`, ""];
    for (const cat of CATEGORY_ORDER) {
      const items = editItems.filter((i) => i.category === cat);
      if (items.length === 0) continue;
      const label = cat === "new" ? "New" : cat === "improved" ? "Improved" : "Fixed";
      lines.push(`${label}: ${items.slice(0, 3).map((i) => i.text).join(", ")}`);
    }
    lines.push("", "Full changelog: layout.design/changelog");
    return lines.join("\n");
  };

  const generateLinkedInText = () => {
    if (!compiled) return "";
    const lines: string[] = [`Layout - ${compiled.label}`, "", editSummary, ""];
    for (const group of groupedItems) {
      lines.push(group.badge.label);
      for (const catGroup of group.byCategory) {
        for (const item of catGroup.items) {
          lines.push(`- ${catGroup.label}: ${item.text}`);
        }
      }
      lines.push("");
    }
    lines.push("See the full changelog: layout.design/changelog");
    return lines.join("\n");
  };

  const generateMarkdown = () => {
    if (!compiled) return "";
    const lines: string[] = [`## ${compiled.label}`, "", `${editSummary}`, ""];
    for (const group of groupedItems) {
      lines.push(`### ${group.badge.label}`);
      for (const catGroup of group.byCategory) {
        lines.push(`**${catGroup.label}**`);
        for (const item of catGroup.items) {
          lines.push(`- ${item.text}`);
        }
        lines.push("");
      }
    }
    return lines.join("\n");
  };

  return (
    <div className="space-y-6">
      {/* Compiled preview + publish */}
      {showCompiled && compiled && (
        <div
          className="rounded-lg p-5 space-y-4"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--studio-accent)" }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Compiled: {compiled.label}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { copyToClipboard(generateTwitterText()); toast("Copied for Twitter"); }}
                className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px solid var(--studio-border)" }}
              >
                Copy Twitter
              </button>
              <button
                onClick={() => { copyToClipboard(generateLinkedInText()); toast("Copied for LinkedIn"); }}
                className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px solid var(--studio-border)" }}
              >
                Copy LinkedIn
              </button>
              <button
                onClick={() => { copyToClipboard(generateMarkdown()); toast("Copied as Markdown"); }}
                className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px solid var(--studio-border)" }}
              >
                Copy MD
              </button>
              <button
                onClick={() => setShowCompiled(false)}
                className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px solid var(--studio-border)" }}
              >
                Back to draft
              </button>
              <button
                onClick={handlePublish}
                disabled={publishing || !editSummary.trim() || editItems.length === 0}
                className="px-4 py-1.5 rounded-md text-xs font-semibold transition-all"
                style={{
                  background: "var(--studio-accent)",
                  color: "var(--text-on-accent, #08090a)",
                  opacity: publishing || !editSummary.trim() || editItems.length === 0 ? 0.5 : 1,
                }}
              >
                {publishing ? "Publishing…" : "Publish"}
              </button>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium block mb-1.5" style={{ color: "var(--text-muted)" }}>
              Summary (prose intro)
            </label>
            <textarea
              value={editSummary}
              onChange={(e) => setEditSummary(e.target.value)}
              rows={2}
              className="w-full rounded-md px-3 py-2 text-sm outline-none resize-none focus:ring-1 focus:ring-white/20"
              style={inputStyle}
            />
          </div>

          <div className="space-y-4">
            {groupedItems.map((group) => (
              <div key={group.product}>
                <span
                  className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded inline-block mb-2"
                  style={{ background: group.badge.bg, color: group.badge.text }}
                >
                  {group.badge.label}
                </span>
                <div className="space-y-3">
                  {group.byCategory.map((catGroup) => (
                    <div key={catGroup.category}>
                      <span className="text-[10px] font-semibold block mb-1" style={{ color: catGroup.category === "new" ? "#34d399" : catGroup.category === "improved" ? "#60a5fa" : "var(--status-warning)" }}>
                        {catGroup.label}
                      </span>
                      <div className="space-y-1.5 pl-2">
                        {catGroup.items.map((item) => {
                          const globalIndex = editItems.indexOf(item);
                          return (
                            <div key={globalIndex} className="flex items-center gap-2 group">
                              <input
                                type="text"
                                value={item.text}
                                onChange={(e) => handleUpdateItemText(globalIndex, e.target.value)}
                                className="flex-1 rounded px-2 py-1 text-sm outline-none"
                                style={inputStyle}
                              />
                              <button
                                onClick={() => handleRemoveItem(globalIndex)}
                                className="px-1.5 py-0.5 rounded text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                                style={{ color: "rgb(239,68,68)" }}
                              >
                                ×
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Draft section */}
      {!showCompiled && (
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
                <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold bg-[var(--status-warning)]/20 text-[var(--status-warning)] border border-[var(--status-warning)]/30">
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
                  onClick={handleCompile}
                  disabled={saving}
                  className="px-4 py-1.5 rounded-md text-xs font-semibold transition-all"
                  style={{
                    background: "var(--studio-accent)",
                    color: "var(--text-on-accent, #08090a)",
                    opacity: saving ? 0.6 : 1,
                  }}
                >
                  Compile &amp; review
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
      )}

      {/* Recent published */}
      {published.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Recently published
          </h3>
          {published.map((week) => {
            const weekGroups = PRODUCT_ORDER
              .map((product) => ({
                product,
                badge: productBadgeStyles[product],
                items: week.items.filter((item) => item.product === product),
              }))
              .filter((g) => g.items.length > 0);

            const generatePublishedCopy = (format: "twitter" | "linkedin" | "markdown") => {
              const lines: string[] = [];
              const catOrder = ["new", "improved", "fixed"] as const;
              const catLabels: Record<string, string> = { new: "New", improved: "Improved", fixed: "Fixed" };
              if (format === "twitter") {
                lines.push(`Layout changelog - ${week.label}`, "");
                for (const cat of catOrder) {
                  const items = week.items.filter((i) => i.category === cat);
                  if (items.length === 0) continue;
                  lines.push(`${catLabels[cat]}: ${items.slice(0, 3).map((i) => i.text).join(", ")}`);
                }
                lines.push("", "Full changelog: layout.design/changelog");
              } else if (format === "linkedin") {
                lines.push(`Layout - ${week.label}`, "", week.summary, "");
                for (const g of weekGroups) {
                  lines.push(g.badge.label);
                  for (const cat of catOrder) {
                    const items = g.items.filter((i) => i.category === cat);
                    for (const item of items) lines.push(`- ${catLabels[item.category]}: ${item.text}`);
                  }
                  lines.push("");
                }
                lines.push("See the full changelog: layout.design/changelog");
              } else {
                lines.push(`## ${week.label}`, "", week.summary, "");
                for (const g of weekGroups) {
                  lines.push(`### ${g.badge.label}`);
                  for (const cat of catOrder) {
                    const items = g.items.filter((i) => i.category === cat);
                    if (items.length === 0) continue;
                    lines.push(`**${catLabels[cat]}**`);
                    for (const item of items) lines.push(`- ${item.text}`);
                    lines.push("");
                  }
                }
              }
              return lines.join("\n");
            };

            return (
              <div key={week.weekId} className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                    {week.label}
                  </p>
                  <div className="flex gap-1.5">
                    {(["twitter", "linkedin", "markdown"] as const).map((fmt) => (
                      <button
                        key={fmt}
                        onClick={() => { copyToClipboard(generatePublishedCopy(fmt)); toast(`Copied for ${fmt === "markdown" ? "Markdown" : fmt.charAt(0).toUpperCase() + fmt.slice(1)}`); }}
                        className="px-2 py-0.5 rounded text-[10px] transition-all"
                        style={{ background: "var(--bg-elevated)", color: "var(--text-muted)", border: "1px solid var(--studio-border)" }}
                      >
                        {fmt === "twitter" ? "Twitter" : fmt === "linkedin" ? "LinkedIn" : "MD"}
                      </button>
                    ))}
                  </div>
                </div>
                <div
                  className="rounded-lg p-3 space-y-2"
                  style={{ background: "var(--bg-panel)", border: "1px solid var(--studio-border)" }}
                >
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    {week.summary}
                  </p>
                  {weekGroups.map((group) => (
                    <div key={group.product} className="flex flex-wrap gap-x-3 gap-y-1 items-start">
                      <span
                        className="text-[9px] font-semibold px-1 py-0.5 rounded shrink-0 mt-0.5"
                        style={{ background: group.badge.bg, color: group.badge.text }}
                      >
                        {group.badge.label}
                      </span>
                      {group.items.map((item, i) => (
                        <span key={i} className="text-xs" style={{ color: "var(--text-primary)" }}>
                          {item.text}{i < group.items.length - 1 ? "," : ""}
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Credits Tab ─────────────────────────────────────────────────────────────

interface CreditLookupResult {
  user: { id: string; email: string; name: string };
  balance: {
    layoutMdRemaining: number;
    aiQueryRemaining: number;
    topupLayoutMd: number;
    topupAiQuery: number;
    periodStart: string;
    periodEnd: string;
  } | null;
}

function CreditsTab({ toast }: { toast: (msg: string, type?: "success" | "error") => void }) {
  const [email, setEmail] = useState("");
  const [lookup, setLookup] = useState<CreditLookupResult | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [layoutMdAmount, setLayoutMdAmount] = useState(1);
  const [aiQueryAmount, setAiQueryAmount] = useState(0);
  const [adding, setAdding] = useState(false);
  const [zeroUsers, setZeroUsers] = useState<Array<{ email: string }>>([]);

  // Fetch zero-credit users on mount
  useEffect(() => {
    fetch("/api/admin/credits/zero")
      .then((r) => r.json())
      .then((data) => setZeroUsers(data.users ?? []))
      .catch(() => {});
  }, []);

  const handleLookup = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setLookupError(null);
    setLookup(null);

    try {
      const res = await fetch(`/api/admin/credits?email=${encodeURIComponent(email.trim())}`);
      const json = await res.json();
      if (!res.ok) {
        setLookupError(json.error ?? "Lookup failed");
        return;
      }
      setLookup(json);
    } catch {
      setLookupError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCredits = async () => {
    if (!lookup) return;
    setAdding(true);
    try {
      const res = await fetch("/api/admin/credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: lookup.user.email,
          layoutMd: layoutMdAmount,
          aiQuery: aiQueryAmount,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast(json.error ?? "Failed to add credits", "error");
        return;
      }
      toast(json.message, "success");
      // Refresh balance
      handleLookup();
    } catch {
      toast("Network error", "error");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Zero-credit users */}
      {zeroUsers.length > 0 && (
        <div
          className="rounded-lg p-5 space-y-3"
          style={{ background: "var(--bg-surface)", border: "1px solid rgba(245,158,11,0.4)" }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold" style={{ color: "#f59e0b" }}>
              Users at zero credits ({zeroUsers.length})
            </h3>
          </div>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Click to look up and top up
          </p>
          <div className="flex flex-wrap gap-2">
            {zeroUsers.map((u) => (
              <button
                key={u.email}
                onClick={() => {
                  setEmail(u.email);
                  setLookup(null);
                  setLookupError(null);
                  // Trigger lookup after state update
                  setTimeout(async () => {
                    setLoading(true);
                    try {
                      const res = await fetch(`/api/admin/credits?email=${encodeURIComponent(u.email)}`);
                      const json = await res.json();
                      if (!res.ok) { setLookupError(json.error ?? "Lookup failed"); return; }
                      setLookup(json);
                    } catch { setLookupError("Network error"); }
                    finally { setLoading(false); }
                  }, 0);
                }}
                className="px-2.5 py-1 rounded-md text-xs transition-all"
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--studio-border)",
                  color: "var(--text-secondary)",
                }}
              >
                {u.email}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Lookup */}
      <div
        className="rounded-lg p-5 space-y-4"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--studio-border)" }}
      >
        <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          Look up user credits
        </h3>
        <div className="flex gap-2">
          <input
            type="email"
            placeholder="user@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLookup()}
            className="flex-1 px-3 py-2 rounded-md text-sm outline-none"
            style={{
              background: "var(--bg-panel)",
              border: "1px solid var(--studio-border)",
              color: "var(--text-primary)",
            }}
          />
          <button
            onClick={handleLookup}
            disabled={loading || !email.trim()}
            className="px-4 py-2 rounded-md text-sm font-medium transition-all"
            style={{
              background: "var(--studio-accent)",
              color: "var(--text-on-accent)",
              opacity: loading || !email.trim() ? 0.5 : 1,
            }}
          >
            {loading ? "Looking up…" : "Look up"}
          </button>
        </div>
        {lookupError && (
          <p className="text-sm text-red-400">{lookupError}</p>
        )}
      </div>

      {/* Balance display + top-up */}
      {lookup && (
        <div
          className="rounded-lg p-5 space-y-4"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--studio-border)" }}
        >
          <div className="flex items-baseline gap-2">
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {lookup.user.name ?? lookup.user.email}
            </h3>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              {lookup.user.email}
            </span>
          </div>

          {lookup.balance ? (
            <div className="grid grid-cols-2 gap-4">
              <div
                className="rounded-md p-3"
                style={{ background: "var(--bg-panel)", border: "1px solid var(--studio-border)" }}
              >
                <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>layout.md credits</p>
                <p className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                  {lookup.balance.layoutMdRemaining}
                  {lookup.balance.topupLayoutMd > 0 && (
                    <span className="text-xs font-normal ml-1" style={{ color: "var(--text-muted)" }}>
                      + {lookup.balance.topupLayoutMd} top-up
                    </span>
                  )}
                </p>
              </div>
              <div
                className="rounded-md p-3"
                style={{ background: "var(--bg-panel)", border: "1px solid var(--studio-border)" }}
              >
                <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>AI query credits</p>
                <p className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                  {lookup.balance.aiQueryRemaining}
                  {lookup.balance.topupAiQuery > 0 && (
                    <span className="text-xs font-normal ml-1" style={{ color: "var(--text-muted)" }}>
                      + {lookup.balance.topupAiQuery} top-up
                    </span>
                  )}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              No credit balance yet (will be created on first use)
            </p>
          )}

          {/* Add credits form */}
          <div
            className="rounded-md p-4 space-y-3"
            style={{ background: "var(--bg-panel)", border: "1px solid var(--studio-border)" }}
          >
            <p className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
              Add top-up credits
            </p>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                layout.md
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={layoutMdAmount}
                  onChange={(e) => setLayoutMdAmount(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-16 px-2 py-1 rounded text-sm text-center outline-none"
                  style={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--studio-border)",
                    color: "var(--text-primary)",
                  }}
                />
              </label>
              <label className="flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                AI query
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={aiQueryAmount}
                  onChange={(e) => setAiQueryAmount(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-16 px-2 py-1 rounded text-sm text-center outline-none"
                  style={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--studio-border)",
                    color: "var(--text-primary)",
                  }}
                />
              </label>
              <button
                onClick={handleAddCredits}
                disabled={adding || (layoutMdAmount === 0 && aiQueryAmount === 0)}
                className="px-4 py-1.5 rounded-md text-sm font-medium transition-all"
                style={{
                  background: "var(--studio-accent)",
                  color: "var(--text-on-accent)",
                  opacity: adding || (layoutMdAmount === 0 && aiQueryAmount === 0) ? 0.5 : 1,
                }}
              >
                {adding ? "Adding…" : "Add credits"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Admin Component ────────────────────────────────────────────────────

export function AdminClient() {
  const { data: session, isPending } = useSession();
  const [activeTab, setActiveTab] = useState<"dashboard" | "codes" | "requests" | "changelog" | "credits" | "ai-models" | "email" | "roadmap" | "variants" | "kits" | "kit-requests">("dashboard");
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

  const tabs: { key: typeof activeTab; label: string }[] = [
    { key: "dashboard", label: "Dashboard" },
    { key: "codes", label: "Invite codes" },
    { key: "requests", label: "Access requests" },
    { key: "changelog", label: "Changelog" },
    { key: "roadmap", label: "Roadmap" },
    { key: "credits", label: "Credits" },
    { key: "ai-models", label: "AI Models" },
    { key: "email", label: "Email" },
    { key: "variants", label: "Variants" },
    { key: "kits", label: "Kits" },
    { key: "kit-requests", label: "Kit requests" },
  ];

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{ background: "var(--bg-app)", color: "var(--text-primary)" }}
    >
      {/* Header */}
      <div
        className="sticky top-0 z-10 px-4 sm:px-6 py-4 flex items-center gap-4 overflow-hidden"
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
          className="ml-auto text-xs font-mono truncate max-w-[200px] hidden sm:block"
          style={{ color: "var(--text-muted)" }}
        >
          {session.user.email}
        </span>
      </div>

      <div className="mx-auto px-4 sm:px-6 py-8 space-y-6 overflow-x-hidden">
        {/* Tabs */}
        <div
          className="flex gap-1 p-1 rounded-lg w-fit overflow-x-auto max-w-full"
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
                <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold bg-[var(--status-warning)]/20 text-[var(--status-warning)] border border-[var(--status-warning)]/30">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Stats */}
        <AdminStats stats={stats} />

        {/* Tab content */}
        {activeTab === "dashboard" && (
          <DashboardTab onSwitchTab={(tab) => setActiveTab(tab as typeof activeTab)} />
        )}
        {activeTab === "codes" && (
          <InviteCodesTab toast={toast} />
        )}
        {activeTab === "requests" && (
          <AccessRequestsTab toast={toast} onPendingCountChange={setPendingCount} onAction={fetchStats} />
        )}
        {activeTab === "changelog" && (
          <ChangelogTab toast={toast} />
        )}
        {activeTab === "credits" && (
          <CreditsTab toast={toast} />
        )}
        {activeTab === "ai-models" && (
          <AIModelsTab toast={toast} />
        )}
        {activeTab === "email" && (
          <EmailTab toast={toast} />
        )}
        {activeTab === "roadmap" && (
          <RoadmapTab toast={toast} />
        )}
        {activeTab === "variants" && (
          <VariantsTab />
        )}
        {activeTab === "kits" && (
          <KitsTab toast={toast} />
        )}
        {activeTab === "kit-requests" && (
          <KitRequestsTab toast={toast} />
        )}
      </div>

      <ToastContainer toasts={toasts} />
    </div>
  );
}
