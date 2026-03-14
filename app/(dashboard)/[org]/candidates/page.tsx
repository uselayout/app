"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useOrgStore } from "@/lib/store/organization";
import { CreateCandidateModal } from "@/components/dashboard/CreateCandidateModal";
import type { Candidate, CandidateStatus } from "@/lib/types/candidate";

const STATUS_CONFIG: Record<
  CandidateStatus,
  { label: string; dotClass: string }
> = {
  pending: { label: "Pending", dotClass: "bg-[#F59E0B]" },
  in_review: { label: "In Review", dotClass: "bg-[#3B82F6]" },
  approved: { label: "Approved", dotClass: "bg-[#22C55E]" },
  rejected: { label: "Rejected", dotClass: "bg-[#EF4444]" },
};

function StatusBadge({ status }: { status: CandidateStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
      <span className={`inline-block h-2 w-2 rounded-full ${config.dotClass}`} />
      {config.label}
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

export default function CandidatesPage() {
  const params = useParams();
  const orgSlug = (params?.org as string) ?? "";
  const orgId = useOrgStore((s) => s.currentOrgId);

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreated = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (!orgId) return;

    let cancelled = false;

    async function fetchCandidates() {
      setLoading(true);
      try {
        const searchParams = new URLSearchParams();
        if (filterStatus) searchParams.set("status", filterStatus);
        if (search) searchParams.set("search", search);

        const res = await fetch(
          `/api/organizations/${orgId}/candidates?${searchParams.toString()}`
        );

        if (!cancelled && res.ok) {
          const data: Candidate[] = await res.json();
          setCandidates(data);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchCandidates();
    return () => {
      cancelled = true;
    };
  }, [orgId, filterStatus, search, refreshKey]);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">
            Candidates
          </h1>
          {!loading && (
            <span className="text-sm text-[var(--text-muted)]">
              {candidates.length} candidate{candidates.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="rounded-[var(--studio-radius-md)] bg-[var(--studio-accent)] px-4 py-2 text-sm text-white transition-all duration-[var(--duration-base)] hover:bg-[var(--studio-accent-hover)]"
        >
          New Candidate
        </button>
      </div>

      {/* Filter bar */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-[var(--studio-radius-md)] border border-[var(--studio-border)] bg-[var(--bg-surface)] px-3 py-1.5 text-sm text-[var(--text-primary)]"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="in_review">In Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search candidates..."
          className="rounded-[var(--studio-radius-md)] border border-[var(--studio-border)] bg-[var(--bg-surface)] px-3 py-1.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
        />
      </div>

      {/* Content */}
      {loading ? (
        <p className="text-sm text-[var(--text-muted)]">Loading...</p>
      ) : candidates.length === 0 ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <p className="text-sm text-[var(--text-muted)]">
            No candidates yet.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {candidates.map((c) => (
            <Link
              key={c.id}
              href={`/${orgSlug}/candidates/${c.id}`}
              className="group flex items-center justify-between rounded-xl border border-[var(--studio-border)] bg-[var(--bg-surface)] px-5 py-4 transition-all duration-[var(--duration-base)] hover:border-[var(--studio-border-strong)] hover:bg-[var(--bg-hover)]"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate">
                    {c.name}
                  </h3>
                  <StatusBadge status={c.status} />
                </div>
                <p className="truncate text-xs text-[var(--text-secondary)]">
                  &ldquo;{c.prompt}&rdquo;
                </p>
                <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                  <span>
                    {c.variants.length} variant{c.variants.length !== 1 ? "s" : ""}
                  </span>
                  {c.category !== "uncategorised" && (
                    <>
                      <span>&middot;</span>
                      <span>{c.category}</span>
                    </>
                  )}
                </div>
              </div>
              <span className="ml-4 shrink-0 text-xs text-[var(--text-muted)]">
                {formatDate(c.createdAt)}
              </span>
            </Link>
          ))}
        </div>
      )}

      {showCreate && orgId && (
        <CreateCandidateModal
          orgId={orgId}
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
