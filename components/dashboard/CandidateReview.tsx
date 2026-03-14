"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { extractComponentName, buildSrcdoc } from "@/lib/explore/preview-helpers";
import { CandidateCommentThread } from "@/components/dashboard/CandidateCommentThread";
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
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--studio-border)] bg-[var(--bg-elevated)] px-2.5 py-1 text-xs text-[var(--text-secondary)]">
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

interface VariantPreviewProps {
  code: string;
  name: string;
  rationale?: string;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
}

function VariantPreview({
  code,
  name,
  rationale,
  index,
  isSelected,
  onSelect,
}: VariantPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [previewReady, setPreviewReady] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [showCode, setShowCode] = useState(false);

  useEffect(() => {
    if (!code) return;
    setPreviewReady(false);
    setPreviewError(null);

    let cancelled = false;

    async function transpileAndRender() {
      try {
        const res = await fetch("/api/transpile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });

        if (!res.ok) {
          setPreviewError("Transpilation failed");
          return;
        }

        const { js } = (await res.json()) as { js: string };
        if (cancelled) return;

        const componentName = extractComponentName(code);
        const srcdoc = buildSrcdoc(js, componentName);

        if (iframeRef.current) {
          iframeRef.current.srcdoc = srcdoc;
          setPreviewReady(true);
        }
      } catch (err) {
        if (!cancelled) {
          setPreviewError(
            err instanceof Error ? err.message : "Preview failed"
          );
        }
      }
    }

    transpileAndRender();
    return () => {
      cancelled = true;
    };
  }, [code]);

  return (
    <div
      onClick={onSelect}
      className={`flex cursor-pointer flex-col rounded-xl border transition-all duration-[var(--duration-base)] ${
        isSelected
          ? "border-[var(--studio-accent)] ring-1 ring-[var(--studio-accent)]/30 bg-[var(--bg-elevated)]"
          : "border-[var(--studio-border)] bg-[var(--bg-surface)] hover:border-[var(--studio-border-strong)]"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--studio-border)] px-4 py-3">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          {name || `Variant ${index + 1}`}
        </h3>
        {isSelected && (
          <span className="rounded-full bg-[var(--studio-accent)] px-2 py-0.5 text-[10px] font-semibold text-[--text-on-accent]">
            Selected
          </span>
        )}
      </div>

      {/* Preview */}
      <div className="relative aspect-[4/3] overflow-hidden bg-white">
        {previewError ? (
          <div className="flex h-full items-center justify-center p-4">
            <p className="text-xs text-red-400">{previewError}</p>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            sandbox="allow-scripts"
            className={`h-full w-full origin-top-left scale-50 border-0 transition-opacity ${
              previewReady ? "opacity-100" : "opacity-0"
            }`}
            style={{ width: "200%", height: "200%" }}
            title={`Preview: ${name}`}
          />
        )}
        {!previewReady && !previewError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--studio-border-strong)] border-t-[var(--studio-accent)]" />
          </div>
        )}
      </div>

      {/* Rationale + code toggle */}
      <div className="flex flex-col gap-2 px-4 py-3">
        {rationale && (
          <p className="text-xs text-[var(--text-secondary)]">{rationale}</p>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowCode(!showCode);
          }}
          className="self-start text-xs text-[var(--studio-accent)] hover:text-[var(--studio-accent-hover)] transition-colors"
        >
          {showCode ? "Hide Code" : "View Code"}
        </button>
        {showCode && (
          <pre className="max-h-64 overflow-auto rounded-lg bg-[var(--bg-app)] p-3 text-xs text-[var(--text-secondary)] font-mono">
            {code}
          </pre>
        )}
      </div>
    </div>
  );
}

interface CandidateReviewProps {
  candidate: Candidate;
  orgId: string;
  orgSlug: string;
  canReview: boolean;
  onStatusChange?: () => void;
}

export function CandidateReview({
  candidate,
  orgId,
  orgSlug,
  canReview,
  onStatusChange,
}: CandidateReviewProps) {
  const [selectedVariantIndex, setSelectedVariantIndex] = useState<
    number | null
  >(candidate.selectedVariantIndex);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canAct =
    canReview &&
    (candidate.status === "pending" || candidate.status === "in_review");

  const handleApprove = useCallback(async () => {
    if (selectedVariantIndex === null) {
      toast.error("Please select a variant before approving.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/organizations/${orgId}/candidates/${candidate.id}/approve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ selectedVariantIndex }),
        }
      );
      if (res.ok) {
        toast.success("Candidate approved and added to library");
        onStatusChange?.();
      } else {
        const err = (await res.json()) as { error?: string };
        toast.error(err.error ?? "Failed to approve candidate");
      }
    } finally {
      setSubmitting(false);
    }
  }, [orgId, candidate.id, selectedVariantIndex, onStatusChange]);

  const handleReject = useCallback(async () => {
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/organizations/${orgId}/candidates/${candidate.id}/reject`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: rejectReason }),
        }
      );
      if (res.ok) {
        toast.success("Candidate rejected");
        setShowRejectForm(false);
        setRejectReason("");
        onStatusChange?.();
      } else {
        const err = (await res.json()) as { error?: string };
        toast.error(err.error ?? "Failed to reject candidate");
      }
    } finally {
      setSubmitting(false);
    }
  }, [orgId, candidate.id, rejectReason, onStatusChange]);

  const variantColsClass =
    candidate.variants.length === 1
      ? "grid-cols-1"
      : candidate.variants.length === 2
        ? "grid-cols-1 md:grid-cols-2"
        : "grid-cols-1 md:grid-cols-2 xl:grid-cols-3";

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href={`/${orgSlug}/candidates`}
          className="mb-3 inline-flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          &larr; Candidates
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">
            {candidate.name}
          </h1>
          <StatusBadge status={candidate.status} />
          {candidate.category !== "uncategorised" && (
            <span className="rounded-full border border-[var(--studio-border)] bg-[var(--bg-elevated)] px-2.5 py-1 text-xs text-[var(--text-secondary)]">
              {candidate.category}
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Created {formatDate(candidate.createdAt)}
        </p>
      </div>

      {/* Prompt */}
      <div className="mb-8 rounded-xl border border-[var(--studio-border)] bg-[var(--bg-surface)] px-5 py-4">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          Prompt
        </h2>
        <p className="text-sm leading-relaxed text-[var(--text-primary)]">
          {candidate.prompt}
        </p>
      </div>

      {/* Variant comparison */}
      <div className="mb-8">
        <h2 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">
          Variants ({candidate.variants.length})
        </h2>
        <div className={`grid gap-4 ${variantColsClass}`}>
          {candidate.variants.map((v, i) => (
            <VariantPreview
              key={i}
              code={v.code}
              name={v.name}
              rationale={v.rationale}
              index={i}
              isSelected={selectedVariantIndex === i}
              onSelect={() => setSelectedVariantIndex(i)}
            />
          ))}
        </div>
      </div>

      {/* Action bar */}
      {canAct && (
        <div className="mb-8 flex flex-wrap items-center gap-3 rounded-xl border border-[var(--studio-border)] bg-[var(--bg-surface)] px-5 py-4">
          <button
            onClick={handleApprove}
            disabled={submitting || selectedVariantIndex === null}
            className="rounded-[var(--studio-radius-md)] bg-[#22C55E] px-4 py-2 text-sm font-medium text-white transition-all duration-[var(--duration-base)] hover:bg-[#16A34A] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Approving..." : "Approve"}
          </button>
          {!showRejectForm ? (
            <button
              onClick={() => setShowRejectForm(true)}
              disabled={submitting}
              className="rounded-[var(--studio-radius-md)] border border-[#EF4444] px-4 py-2 text-sm font-medium text-[#EF4444] transition-all duration-[var(--duration-base)] hover:bg-[#EF4444]/10 disabled:opacity-50"
            >
              Reject
            </button>
          ) : (
            <div className="flex flex-1 items-center gap-2">
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Reason for rejection (optional)..."
                rows={2}
                className="flex-1 rounded-[var(--studio-radius-md)] border border-[var(--studio-border)] bg-[var(--bg-app)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--studio-border-focus)] focus:outline-none"
              />
              <button
                onClick={handleReject}
                disabled={submitting}
                className="rounded-[var(--studio-radius-md)] bg-[#EF4444] px-4 py-2 text-sm font-medium text-white transition-all duration-[var(--duration-base)] hover:bg-[#DC2626] disabled:opacity-50"
              >
                {submitting ? "Rejecting..." : "Confirm Reject"}
              </button>
              <button
                onClick={() => {
                  setShowRejectForm(false);
                  setRejectReason("");
                }}
                className="rounded-[var(--studio-radius-md)] px-3 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
          {selectedVariantIndex === null && (
            <p className="text-xs text-[var(--text-muted)]">
              Select a variant to approve
            </p>
          )}
        </div>
      )}

      {/* Comment thread */}
      <CandidateCommentThread candidateId={candidate.id} orgId={orgId} />
    </div>
  );
}
