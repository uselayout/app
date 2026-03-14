"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { DriftChange, DriftReport, DriftStatus } from "@/lib/types/drift";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isHexColour(value: string): boolean {
  return /^#[0-9a-f]{3,8}$/i.test(value.trim());
}

function ColourSwatch({ value }: { value: string }) {
  if (!isHexColour(value)) return null;
  return (
    <span
      className="inline-block h-4 w-4 shrink-0 rounded border border-[var(--studio-border)]"
      style={{ backgroundColor: value }}
    />
  );
}

function ChangeBadge({ type }: { type: DriftChange["type"] }) {
  const config = {
    added: { label: "Added", className: "bg-emerald-500/15 text-emerald-400" },
    changed: { label: "Changed", className: "bg-amber-500/15 text-amber-400" },
    removed: { label: "Removed", className: "bg-red-500/15 text-red-400" },
  };
  const c = config[type];
  return (
    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${c.className}`}>
      {c.label}
    </span>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

interface DriftReportViewerProps {
  report: DriftReport;
  orgId: string;
  onStatusChange: (reportId: string, newStatus: DriftStatus) => void;
}

export function DriftReportViewer({
  report,
  orgId,
  onStatusChange,
}: DriftReportViewerProps) {
  const [updating, setUpdating] = useState(false);

  async function handleStatusUpdate(newStatus: DriftStatus) {
    setUpdating(true);
    try {
      const res = await fetch(
        `/api/organizations/${orgId}/drift/${report.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as Record<string, string>).error ?? "Failed to update status");
      }

      onStatusChange(report.id, newStatus);
      toast.success(`Report marked as ${newStatus}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="mt-3 rounded-lg border border-[var(--studio-border)] bg-[var(--bg-panel)] p-4">
      {/* Changes table */}
      {report.changes.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">No token changes detected.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--studio-border)] text-left text-xs text-[var(--text-muted)]">
                <th className="pb-2 pr-4 font-medium">Type</th>
                <th className="pb-2 pr-4 font-medium">Token Name</th>
                <th className="pb-2 pr-4 font-medium">Old Value</th>
                <th className="pb-2 font-medium">New Value</th>
              </tr>
            </thead>
            <tbody>
              {report.changes.map((change, i) => (
                <tr
                  key={`${change.tokenName}-${i}`}
                  className="border-b border-[var(--studio-border)] last:border-b-0"
                >
                  <td className="py-2 pr-4">
                    <ChangeBadge type={change.type} />
                  </td>
                  <td className="py-2 pr-4 font-mono text-xs text-[var(--text-primary)]">
                    {change.tokenName}
                    {change.cssVariable && (
                      <span className="ml-2 text-[var(--text-muted)]">
                        {change.cssVariable}
                      </span>
                    )}
                  </td>
                  <td className="py-2 pr-4">
                    {change.oldValue ? (
                      <span className="inline-flex items-center gap-1.5 font-mono text-xs text-[var(--text-secondary)]">
                        <ColourSwatch value={change.oldValue} />
                        {change.oldValue}
                      </span>
                    ) : (
                      <span className="text-xs text-[var(--text-muted)]">&mdash;</span>
                    )}
                  </td>
                  <td className="py-2">
                    {change.newValue ? (
                      <span className="inline-flex items-center gap-1.5 font-mono text-xs text-[var(--text-secondary)]">
                        <ColourSwatch value={change.newValue} />
                        {change.newValue}
                      </span>
                    ) : (
                      <span className="text-xs text-[var(--text-muted)]">&mdash;</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Action buttons */}
      <div className="mt-4 flex items-center gap-2">
        {report.status === "pending" && (
          <button
            onClick={() => handleStatusUpdate("reviewed")}
            disabled={updating}
            className="rounded-[var(--studio-radius-md)] bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-all duration-[var(--duration-base)] hover:bg-blue-500 disabled:opacity-50"
          >
            {updating ? "Updating..." : "Mark Reviewed"}
          </button>
        )}
        {report.status === "reviewed" && (
          <button
            onClick={() => handleStatusUpdate("resolved")}
            disabled={updating}
            className="rounded-[var(--studio-radius-md)] bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-all duration-[var(--duration-base)] hover:bg-emerald-500 disabled:opacity-50"
          >
            {updating ? "Updating..." : "Mark Resolved"}
          </button>
        )}
        {report.status === "resolved" && (
          <span className="text-xs text-[var(--text-muted)]">
            Resolved
            {report.reviewedAt &&
              ` on ${new Date(report.reviewedAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}`}
          </span>
        )}
      </div>
    </div>
  );
}
