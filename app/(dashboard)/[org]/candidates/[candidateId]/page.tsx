"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useOrgStore } from "@/lib/store/organization";
import { CandidateReview } from "@/components/dashboard/CandidateReview";
import type { Candidate } from "@/lib/types/candidate";

export default function CandidateReviewPage() {
  const params = useParams();
  const orgSlug = (params?.org as string) ?? "";
  const candidateId = (params?.candidateId as string) ?? "";
  const orgId = useOrgStore((s) => s.currentOrgId);
  const hasPermission = useOrgStore((s) => s.hasPermission);
  const canReview = hasPermission("reviewCandidate");

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!orgId || !candidateId) return;

    let cancelled = false;

    async function fetchCandidate() {
      setLoading(true);
      setNotFound(false);
      try {
        const res = await fetch(
          `/api/organizations/${orgId}/candidates/${candidateId}`
        );

        if (!cancelled) {
          if (res.ok) {
            const data: Candidate = await res.json();
            setCandidate(data);
          } else if (res.status === 404) {
            setNotFound(true);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchCandidate();
    return () => {
      cancelled = true;
    };
  }, [orgId, candidateId, refreshKey]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-[var(--text-muted)]">Loading...</p>
      </div>
    );
  }

  if (notFound || !candidate) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-[var(--text-muted)]">Candidate not found.</p>
      </div>
    );
  }

  return (
    <CandidateReview
      candidate={candidate}
      orgId={orgId ?? ""}
      orgSlug={orgSlug}
      canReview={canReview}
      onStatusChange={() => setRefreshKey((k) => k + 1)}
    />
  );
}
