"use client";

import { useState, useEffect, useCallback } from "react";
import { useOrgStore } from "@/lib/store/organization";
import { DriftReportViewer } from "@/components/dashboard/DriftReportViewer";
import { toast } from "sonner";
import type { DriftReport, DriftStatus } from "@/lib/types/drift";
import type { Project } from "@/lib/types";

// ─── Status Config ───────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<DriftStatus, { label: string; dotClass: string }> = {
  pending: { label: "Pending", dotClass: "bg-[#F59E0B]" },
  reviewed: { label: "Reviewed", dotClass: "bg-[#3B82F6]" },
  resolved: { label: "Resolved", dotClass: "bg-[#22C55E]" },
};

function StatusBadge({ status }: { status: DriftStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
      <span className={`inline-block h-2 w-2 rounded-full ${config.dotClass}`} />
      {config.label}
    </span>
  );
}

function SourceTypeBadge({ type }: { type: "figma" | "website" }) {
  const className =
    type === "figma"
      ? "bg-purple-500/15 text-purple-400"
      : "bg-sky-500/15 text-sky-400";
  return (
    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${className}`}>
      {type === "figma" ? "Figma" : "Website"}
    </span>
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function truncateUrl(url: string, maxLen = 60): string {
  if (url.length <= maxLen) return url;
  return url.slice(0, maxLen - 3) + "...";
}

// ─── Check for Drift Modal ──────────────────────────────────────────────────

function CheckDriftModal({
  orgId,
  onClose,
  onCreated,
}: {
  orgId: string;
  onClose: () => void;
  onCreated: (report: DriftReport) => void;
}) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadProjects() {
      try {
        const res = await fetch(`/api/organizations/${orgId}/projects`);
        if (!cancelled && res.ok) {
          const data: Project[] = await res.json();
          // Only show projects with extraction data
          setProjects(data.filter((p) => p.extractionData));
        }
      } catch {
        if (!cancelled) toast.error("Failed to load projects");
      } finally {
        if (!cancelled) setLoadingProjects(false);
      }
    }

    loadProjects();
    return () => {
      cancelled = true;
    };
  }, [orgId]);

  async function handleScan() {
    if (!selectedProjectId) return;
    setScanning(true);

    try {
      const res = await fetch(`/api/organizations/${orgId}/drift`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: selectedProjectId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as Record<string, string>).error ?? "Scan failed");
      }

      const report: DriftReport = await res.json();
      onCreated(report);
      toast.success("Drift scan complete");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Scan failed");
    } finally {
      setScanning(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md rounded-xl border border-[var(--studio-border)] bg-[var(--bg-panel)] p-6 shadow-xl">
        <h2 className="mb-1 text-lg font-semibold text-[var(--text-primary)]">
          Check for Drift
        </h2>
        <p className="mb-4 text-sm text-[var(--text-secondary)]">
          Select a project to compare its extracted tokens against your current
          design tokens.
        </p>

        {loadingProjects ? (
          <p className="py-4 text-sm text-[var(--text-muted)]">Loading projects...</p>
        ) : projects.length === 0 ? (
          <p className="py-4 text-sm text-[var(--text-muted)]">
            No projects with extraction data found.
          </p>
        ) : (
          <div className="mb-4 flex max-h-64 flex-col gap-2 overflow-y-auto">
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedProjectId(p.id)}
                className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-all duration-[var(--duration-base)] ${
                  selectedProjectId === p.id
                    ? "border-[var(--studio-accent)] bg-[var(--studio-accent-subtle)]"
                    : "border-[var(--studio-border)] bg-[var(--bg-surface)] hover:border-[var(--studio-border-strong)]"
                }`}
              >
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-medium text-[var(--text-primary)]">
                    {p.name}
                  </span>
                  {p.sourceUrl && (
                    <span className="truncate text-xs text-[var(--text-muted)]">
                      {truncateUrl(p.sourceUrl, 50)}
                    </span>
                  )}
                </div>
                <SourceTypeBadge type={p.sourceType === "figma" ? "figma" : "website"} />
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-[var(--studio-radius-md)] px-4 py-2 text-sm text-[var(--text-secondary)] transition-all duration-[var(--duration-base)] hover:text-[var(--text-primary)]"
          >
            Cancel
          </button>
          <button
            onClick={handleScan}
            disabled={!selectedProjectId || scanning}
            className="rounded-[var(--studio-radius-md)] bg-[var(--studio-accent)] px-4 py-2 text-sm text-white transition-all duration-[var(--duration-base)] hover:bg-[var(--studio-accent-hover)] disabled:opacity-50"
          >
            {scanning ? (
              <span className="inline-flex items-center gap-2">
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Scanning...
              </span>
            ) : (
              "Run Scan"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Drift Page ──────────────────────────────────────────────────────────────

export default function DriftPage() {
  const orgId = useOrgStore((s) => s.currentOrgId);

  const [reports, setReports] = useState<DriftReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [showModal, setShowModal] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.set("status", filterStatus);
      const res = await fetch(
        `/api/organizations/${orgId}/drift?${params.toString()}`
      );
      if (res.ok) {
        const data: DriftReport[] = await res.json();
        setReports(data);
      }
    } finally {
      setLoading(false);
    }
  }, [orgId, filterStatus]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  function handleReportCreated(report: DriftReport) {
    setReports((prev) => [report, ...prev]);
    setExpandedId(report.id);
  }

  function handleStatusChange(reportId: string, newStatus: DriftStatus) {
    setReports((prev) =>
      prev.map((r) =>
        r.id === reportId
          ? {
              ...r,
              status: newStatus,
              reviewedAt:
                newStatus !== "pending" ? new Date().toISOString() : r.reviewedAt,
            }
          : r
      )
    );
  }

  if (!orgId) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-[var(--text-muted)]">Loading organisation...</p>
      </div>
    );
  }

  const statusTabs = [
    { value: "", label: "All" },
    { value: "pending", label: "Pending" },
    { value: "reviewed", label: "Reviewed" },
    { value: "resolved", label: "Resolved" },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">
            Drift Detection
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Compare extracted tokens against your design system to detect changes.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="rounded-[var(--studio-radius-md)] bg-[var(--studio-accent)] px-4 py-2 text-sm text-white transition-all duration-[var(--duration-base)] hover:bg-[var(--studio-accent-hover)]"
        >
          Check for Drift
        </button>
      </div>

      {/* Status filter tabs */}
      <div className="mb-6 flex items-center gap-1 border-b border-[var(--studio-border)]">
        {statusTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilterStatus(tab.value)}
            className={`border-b-2 px-4 py-2.5 text-sm transition-all duration-[var(--duration-base)] ${
              filterStatus === tab.value
                ? "border-[var(--studio-accent)] text-[var(--studio-accent)]"
                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <p className="text-sm text-[var(--text-muted)]">Loading...</p>
      ) : reports.length === 0 ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-[var(--text-muted)]">
              No drift reports yet.
            </p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Run a scan to compare a project&apos;s extracted tokens against your current design tokens.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {reports.map((report) => {
            const isExpanded = expandedId === report.id;
            return (
              <div key={report.id}>
                <button
                  onClick={() => setExpandedId(isExpanded ? null : report.id)}
                  className="w-full rounded-xl border border-[var(--studio-border)] bg-[var(--bg-surface)] px-5 py-4 text-left transition-all duration-[var(--duration-base)] hover:border-[var(--studio-border-strong)] hover:bg-[var(--bg-hover)]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex items-center gap-3">
                        <span className="truncate text-sm font-medium text-[var(--text-primary)]">
                          {truncateUrl(report.sourceUrl)}
                        </span>
                        <SourceTypeBadge type={report.sourceType} />
                        <StatusBadge status={report.status} />
                      </div>
                      {report.summary && (
                        <p className="text-xs text-[var(--text-secondary)]">
                          <SummaryLine
                            additions={report.tokenAdditions}
                            changes={report.tokenChanges}
                            removals={report.tokenRemovals}
                          />
                        </p>
                      )}
                    </div>
                    <span className="ml-4 shrink-0 text-xs text-[var(--text-muted)]">
                      {formatDate(report.detectedAt)}
                    </span>
                  </div>
                </button>

                {isExpanded && (
                  <DriftReportViewer
                    report={report}
                    orgId={orgId}
                    onStatusChange={handleStatusChange}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <CheckDriftModal
          orgId={orgId}
          onClose={() => setShowModal(false)}
          onCreated={handleReportCreated}
        />
      )}
    </div>
  );
}

// ─── Summary Line ────────────────────────────────────────────────────────────

function SummaryLine({
  additions,
  changes,
  removals,
}: {
  additions: number;
  changes: number;
  removals: number;
}) {
  if (additions === 0 && changes === 0 && removals === 0) {
    return <span>No changes detected</span>;
  }

  return (
    <span className="inline-flex items-center gap-2">
      {additions > 0 && (
        <span className="text-emerald-400">+{additions} added</span>
      )}
      {changes > 0 && (
        <span className="text-amber-400">~{changes} changed</span>
      )}
      {removals > 0 && (
        <span className="text-red-400">-{removals} removed</span>
      )}
    </span>
  );
}
