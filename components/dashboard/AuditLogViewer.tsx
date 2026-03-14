"use client";

import { useCallback, useEffect, useState } from "react";
import type { AuditAction, AuditEntry, AuditResourceType } from "@/lib/types/audit";

// ─── Action Labels ────────────────────────────────────────────────────────────

const ACTION_LABELS: Record<AuditAction, string> = {
  "component.created": "Created component",
  "component.updated": "Updated component",
  "component.deleted": "Deleted component",
  "component.approved": "Approved component",
  "component.deprecated": "Deprecated component",
  "candidate.created": "Created candidate",
  "candidate.approved": "Approved candidate",
  "candidate.rejected": "Rejected candidate",
  "token.created": "Created token",
  "token.updated": "Updated token",
  "token.deleted": "Deleted token",
  "token.imported": "Imported tokens",
  "typeface.created": "Created typeface",
  "typeface.updated": "Updated typeface",
  "typeface.deleted": "Deleted typeface",
  "icon.created": "Created icon",
  "icon.updated": "Updated icon",
  "icon.deleted": "Deleted icon",
  "api_key.created": "Created API key",
  "api_key.revoked": "Revoked API key",
  "member.invited": "Invited member",
  "member.joined": "Member joined",
  "member.removed": "Removed member",
  "member.role_changed": "Changed member role",
  "project.created": "Created project",
  "project.deleted": "Deleted project",
  "drift.detected": "Drift detected",
  "drift.resolved": "Drift resolved",
};

const RESOURCE_TYPE_OPTIONS: { value: AuditResourceType; label: string }[] = [
  { value: "component", label: "Component" },
  { value: "candidate", label: "Candidate" },
  { value: "token", label: "Token" },
  { value: "typeface", label: "Typeface" },
  { value: "icon", label: "Icon" },
  { value: "api_key", label: "API Key" },
  { value: "member", label: "Member" },
  { value: "project", label: "Project" },
  { value: "drift_report", label: "Drift Report" },
];

const ACTION_OPTIONS: { value: AuditAction; label: string }[] = (
  Object.entries(ACTION_LABELS) as [AuditAction, string][]
).map(([value, label]) => ({ value, label }));

// ─── Props ────────────────────────────────────────────────────────────────────

interface AuditLogViewerProps {
  orgSlug: string;
  orgId: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AuditLogViewer({ orgId }: AuditLogViewerProps) {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filters
  const [actionFilter, setActionFilter] = useState("");
  const [resourceTypeFilter, setResourceTypeFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Pagination
  const limit = 50;
  const [offset, setOffset] = useState(0);
  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (actionFilter) params.set("action", actionFilter);
      if (resourceTypeFilter) params.set("resourceType", resourceTypeFilter);
      if (fromDate) params.set("from", new Date(fromDate).toISOString());
      if (toDate) params.set("to", new Date(toDate + "T23:59:59").toISOString());
      params.set("limit", String(limit));
      params.set("offset", String(offset));

      const res = await fetch(
        `/api/organizations/${orgId}/audit?${params.toString()}`
      );

      if (res.ok) {
        const data = (await res.json()) as { entries: AuditEntry[]; total: number };
        setEntries(data.entries);
        setTotal(data.total);
      }
    } catch (err) {
      console.error("Failed to fetch audit log:", err);
    } finally {
      setLoading(false);
    }
  }, [orgId, actionFilter, resourceTypeFilter, fromDate, toDate, offset]);

  useEffect(() => {
    void fetchEntries();
  }, [fetchEntries]);

  // Reset offset when filters change
  useEffect(() => {
    setOffset(0);
  }, [actionFilter, resourceTypeFilter, fromDate, toDate]);

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex flex-wrap gap-3">
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="rounded-md border border-[var(--studio-border)] bg-[var(--bg-surface)] px-3 py-1.5 text-sm text-[var(--text-primary)] outline-none transition-all duration-[var(--duration-base)] focus:border-[var(--studio-border-focus)]"
        >
          <option value="">All actions</option>
          {ACTION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          value={resourceTypeFilter}
          onChange={(e) => setResourceTypeFilter(e.target.value)}
          className="rounded-md border border-[var(--studio-border)] bg-[var(--bg-surface)] px-3 py-1.5 text-sm text-[var(--text-primary)] outline-none transition-all duration-[var(--duration-base)] focus:border-[var(--studio-border-focus)]"
        >
          <option value="">All resources</option>
          {RESOURCE_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          placeholder="From"
          className="rounded-md border border-[var(--studio-border)] bg-[var(--bg-surface)] px-3 py-1.5 text-sm text-[var(--text-primary)] outline-none transition-all duration-[var(--duration-base)] focus:border-[var(--studio-border-focus)]"
        />

        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          placeholder="To"
          className="rounded-md border border-[var(--studio-border)] bg-[var(--bg-surface)] px-3 py-1.5 text-sm text-[var(--text-primary)] outline-none transition-all duration-[var(--duration-base)] focus:border-[var(--studio-border-focus)]"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-[var(--studio-border)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--studio-border)] bg-[var(--bg-surface)]">
              <th className="px-4 py-2.5 text-left font-medium text-[var(--text-secondary)]">
                Time
              </th>
              <th className="px-4 py-2.5 text-left font-medium text-[var(--text-secondary)]">
                Actor
              </th>
              <th className="px-4 py-2.5 text-left font-medium text-[var(--text-secondary)]">
                Action
              </th>
              <th className="px-4 py-2.5 text-left font-medium text-[var(--text-secondary)]">
                Resource
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-[var(--text-muted)]">
                  Loading...
                </td>
              </tr>
            ) : entries.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-[var(--text-muted)]">
                  No audit events found
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <AuditRow
                  key={entry.id}
                  entry={entry}
                  isExpanded={expandedId === entry.id}
                  onToggle={() =>
                    setExpandedId(expandedId === entry.id ? null : entry.id)
                  }
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-[var(--text-muted)]">
            {total} total events
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0}
              className="rounded-md border border-[var(--studio-border)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs text-[var(--text-primary)] transition-all duration-[var(--duration-base)] hover:bg-[var(--bg-hover)] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-xs text-[var(--text-secondary)]">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setOffset(offset + limit)}
              disabled={currentPage >= totalPages}
              className="rounded-md border border-[var(--studio-border)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs text-[var(--text-primary)] transition-all duration-[var(--duration-base)] hover:bg-[var(--bg-hover)] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Row Component ────────────────────────────────────────────────────────────

function ActorTypeBadge({ type }: { type: string }) {
  if (type === "user") return null;

  const classes =
    type === "api_key"
      ? "bg-amber-500/15 text-amber-400"
      : "bg-white/10 text-[var(--text-muted)]";

  return (
    <span className={`ml-1.5 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${classes}`}>
      {type === "api_key" ? "API" : "System"}
    </span>
  );
}

function AuditRow({
  entry,
  isExpanded,
  onToggle,
}: {
  entry: AuditEntry;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const actionLabel =
    ACTION_LABELS[entry.action] ?? entry.action;

  const hasDetails = Object.keys(entry.details).length > 0;

  function formatTime(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <>
      <tr
        onClick={hasDetails ? onToggle : undefined}
        className={`border-b border-[var(--studio-border)] transition-all duration-[var(--duration-base)] ${
          hasDetails ? "cursor-pointer hover:bg-[var(--bg-hover)]" : ""
        }`}
      >
        <td className="whitespace-nowrap px-4 py-2.5 text-[var(--text-muted)]">
          {formatTime(entry.createdAt)}
        </td>
        <td className="px-4 py-2.5 text-[var(--text-primary)]">
          {entry.actorName ?? entry.actorId}
          <ActorTypeBadge type={entry.actorType} />
        </td>
        <td className="px-4 py-2.5 text-[var(--text-primary)]">
          {actionLabel}
        </td>
        <td className="px-4 py-2.5 text-[var(--text-secondary)]">
          {entry.resourceName ?? entry.resourceId ?? "-"}
        </td>
      </tr>
      {isExpanded && hasDetails && (
        <tr className="border-b border-[var(--studio-border)] bg-[var(--bg-surface)]">
          <td colSpan={4} className="px-4 py-3">
            <pre className="max-h-48 overflow-auto rounded bg-[var(--bg-app)] p-3 font-mono text-xs text-[var(--text-secondary)]">
              {JSON.stringify(entry.details, null, 2)}
            </pre>
          </td>
        </tr>
      )}
    </>
  );
}
