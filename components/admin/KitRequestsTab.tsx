"use client";

import { useCallback, useEffect, useState } from "react";
import type { KitRequest, KitRequestStatus } from "@/lib/supabase/kit-requests";

type ToastFn = (msg: string, type?: "success" | "error") => void;

interface Props {
  toast: ToastFn;
}

const STATUS_LABEL: Record<KitRequestStatus, string> = {
  pending: "Pending",
  fulfilled: "Fulfilled",
  rejected: "Rejected",
};

export function KitRequestsTab({ toast }: Props) {
  const [requests, setRequests] = useState<KitRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<KitRequestStatus | "all">("pending");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/kit-requests");
      if (!res.ok) throw new Error();
      const json = (await res.json()) as { requests: KitRequest[] };
      setRequests(json.requests);
    } catch {
      toast("Failed to load kit requests", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function setStatus(id: string, status: KitRequestStatus) {
    try {
      const res = await fetch(`/api/admin/kit-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      toast(`Marked ${STATUS_LABEL[status].toLowerCase()}`);
      await load();
    } catch {
      toast("Failed to update", "error");
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this request? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/admin/kit-requests/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast("Deleted");
      await load();
    } catch {
      toast("Failed to delete", "error");
    }
  }

  const filtered = filter === "all" ? requests : requests.filter((r) => r.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div
          className="flex gap-1 p-1 rounded-lg"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--studio-border)" }}
        >
          {(["pending", "fulfilled", "rejected", "all"] as const).map((key) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className="px-3 py-1 rounded-md text-xs font-medium transition-all capitalize"
              style={{
                background: filter === key ? "var(--bg-elevated)" : "transparent",
                color: filter === key ? "var(--text-primary)" : "var(--text-muted)",
                border:
                  filter === key
                    ? "1px solid var(--studio-border)"
                    : "1px solid transparent",
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

      {loading ? (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Loading…
        </p>
      ) : filtered.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          No requests in this view.
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
                <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--text-muted)" }}>
                  Name
                </th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--text-muted)" }}>
                  Hostname
                </th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--text-muted)" }}>
                  Status
                </th>
                <th className="text-right px-4 py-3 font-medium" style={{ color: "var(--text-muted)" }}>
                  Upvotes
                </th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--text-muted)" }}>
                  Created
                </th>
                <th className="text-right px-4 py-3 font-medium" style={{ color: "var(--text-muted)" }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} style={{ borderTop: "1px solid var(--studio-border)" }}>
                  <td className="px-4 py-3">
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:underline"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {r.name}
                    </a>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--text-secondary)" }}>
                    {r.hostname}
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>
                    {STATUS_LABEL[r.status]}
                  </td>
                  <td className="px-4 py-3 text-right" style={{ color: "var(--text-primary)" }}>
                    {r.upvoteCount}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--text-muted)" }}>
                    {new Date(r.createdAt).toLocaleDateString("en-GB")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-2">
                      {r.status !== "fulfilled" && (
                        <button
                          onClick={() => setStatus(r.id, "fulfilled")}
                          className="px-2.5 py-1 rounded text-xs"
                          style={{
                            background: "var(--bg-elevated)",
                            border: "1px solid var(--studio-border)",
                            color: "var(--text-primary)",
                          }}
                        >
                          Fulfil
                        </button>
                      )}
                      {r.status === "fulfilled" && (
                        <button
                          onClick={() => setStatus(r.id, "pending")}
                          className="px-2.5 py-1 rounded text-xs"
                          style={{
                            background: "var(--bg-elevated)",
                            border: "1px solid var(--studio-border)",
                            color: "var(--text-primary)",
                          }}
                        >
                          Reopen
                        </button>
                      )}
                      <button
                        onClick={() => remove(r.id)}
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
