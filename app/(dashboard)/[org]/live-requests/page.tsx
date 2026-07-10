"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Pin } from "lucide-react";
import { useOrgStore } from "@/lib/store/organization";
import type {
  LiveRequestStatus,
  LiveSyncRequest,
} from "@/lib/types/live-request";

type StatusFilter = "all" | LiveRequestStatus;

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "in-progress", label: "In progress" },
  { value: "done", label: "Done" },
];

const STATUS_META: Record<
  LiveRequestStatus,
  { label: string; className: string }
> = {
  pending: { label: "Pending", className: "bg-amber-400/10 text-amber-400" },
  "in-progress": {
    label: "In progress",
    className: "bg-blue-400/10 text-blue-400",
  },
  done: { label: "Done", className: "bg-emerald-400/10 text-emerald-400" },
};

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** "file:line" when the pinned target carries file/line, else null. */
function targetSummary(target: Record<string, unknown>): string | null {
  const file = typeof target.file === "string" && target.file ? target.file : null;
  if (!file) return null;
  const line =
    typeof target.line === "number" || typeof target.line === "string"
      ? target.line
      : null;
  return line !== null && line !== "" ? `${file}:${line}` : file;
}

export default function LiveRequestsPage() {
  const currentOrg = useOrgStore((s) => s.currentOrg)();

  const [requests, setRequests] = useState<LiveSyncRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>("all");

  const orgId = currentOrg?.id;

  useEffect(() => {
    if (!orgId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/organizations/${orgId}/live-requests`);
        if (!res.ok) {
          const body = await res
            .json()
            .catch(() => ({ error: "Failed to load requests" }));
          throw new Error(body.error ?? "Failed to load requests");
        }
        const body = (await res.json()) as { requests: LiveSyncRequest[] };
        if (!cancelled) setRequests(body.requests);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Something went wrong"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [orgId]);

  // Requests arrive newest-first; group by project preserving that order so
  // the most recently active project sits at the top.
  const grouped = useMemo(() => {
    const visible =
      filter === "all"
        ? requests
        : requests.filter((r) => r.status === filter);
    const groups = new Map<string, LiveSyncRequest[]>();
    for (const request of visible) {
      const existing = groups.get(request.projectRef);
      if (existing) {
        existing.push(request);
      } else {
        groups.set(request.projectRef, [request]);
      }
    }
    return [...groups.entries()];
  }, [requests, filter]);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">
          Live Requests
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Requests your team has pinned in Layout Live, synced across devices.
        </p>
      </div>

      {/* Filter row */}
      <div className="mb-6 flex items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-[var(--duration-base)] ${
              filter === f.value
                ? "bg-[var(--studio-accent-subtle)] text-[var(--studio-accent)] border border-[var(--studio-border-strong)]"
                : "border border-[var(--studio-border)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading || !currentOrg ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-[var(--text-muted)]" />
          <p className="text-sm text-[var(--text-muted)]">
            Loading requests...
          </p>
        </div>
      ) : error ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
          <Pin className="h-6 w-6 text-[var(--text-muted)]" />
          <p className="text-sm font-medium text-[var(--text-primary)]">
            No synced requests yet
          </p>
          <p className="max-w-sm text-sm text-[var(--text-muted)]">
            Requests pinned in Layout Live appear here when cloud sync is
            enabled in the app.
          </p>
        </div>
      ) : grouped.length === 0 ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <p className="text-sm text-[var(--text-muted)]">
            No requests match this filter.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map(([projectRef, projectRequests]) => (
            <section key={projectRef}>
              <h2 className="mb-3 font-mono text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
                {projectRef}
              </h2>
              <div className="overflow-hidden rounded-[var(--studio-radius-lg)] border border-[var(--studio-border)]">
                {projectRequests.map((request, index) => {
                  const status = STATUS_META[request.status];
                  const summary = targetSummary(request.target);
                  return (
                    <div
                      key={request.requestId}
                      className={`flex items-start gap-4 bg-[var(--bg-surface)] px-4 py-3 transition-all duration-[var(--duration-base)] hover:bg-[var(--bg-hover)] ${
                        index > 0
                          ? "border-t border-[var(--studio-border)]"
                          : ""
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-[var(--text-primary)]">
                          {request.message}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--text-muted)]">
                          {summary && (
                            <span className="font-mono">{summary}</span>
                          )}
                          {request.deviceLabel && (
                            <span>{request.deviceLabel}</span>
                          )}
                          <span>{relativeTime(request.updatedAt)}</span>
                        </div>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
