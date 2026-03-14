"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import type { CandidateComment } from "@/lib/types/candidate";

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

interface CandidateCommentThreadProps {
  candidateId: string;
  orgId: string;
}

export function CandidateCommentThread({
  candidateId,
  orgId,
}: CandidateCommentThreadProps) {
  const [comments, setComments] = useState<CandidateComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/organizations/${orgId}/candidates/${candidateId}/comments`
      );
      if (res.ok) {
        const data: CandidateComment[] = await res.json();
        setComments(data);
      }
    } finally {
      setLoading(false);
    }
  }, [orgId, candidateId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!body.trim()) return;

      setSubmitting(true);
      try {
        const res = await fetch(
          `/api/organizations/${orgId}/candidates/${candidateId}/comments`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ body: body.trim() }),
          }
        );

        if (res.ok) {
          setBody("");
          await fetchComments();
        } else {
          const err = (await res.json()) as { error?: string };
          toast.error(err.error ?? "Failed to post comment");
        }
      } finally {
        setSubmitting(false);
      }
    },
    [orgId, candidateId, body, fetchComments]
  );

  return (
    <div>
      <h2 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">
        Comments
      </h2>

      {loading ? (
        <p className="text-xs text-[var(--text-muted)]">Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className="mb-4 text-xs text-[var(--text-muted)]">
          No comments yet.
        </p>
      ) : (
        <div className="mb-4 flex flex-col gap-3">
          {comments.map((c) => (
            <div
              key={c.id}
              className="rounded-xl border border-[var(--studio-border)] bg-[var(--bg-surface)] px-4 py-3"
            >
              <div className="mb-1 flex items-center gap-2">
                <span className="text-xs font-medium text-[var(--text-primary)]">
                  {c.authorName ?? "Unknown"}
                </span>
                {c.variantIndex !== null && (
                  <span className="rounded-full bg-[var(--studio-accent-subtle)] px-2 py-0.5 text-[10px] font-medium text-[var(--studio-accent)]">
                    Variant {c.variantIndex + 1}
                  </span>
                )}
                <span className="text-[10px] text-[var(--text-muted)]">
                  {relativeTime(c.createdAt)}
                </span>
              </div>
              <p className="text-sm text-[var(--text-secondary)]">{c.body}</p>
            </div>
          ))}
        </div>
      )}

      {/* New comment form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a comment..."
          rows={3}
          className="rounded-xl border border-[var(--studio-border)] bg-[var(--bg-surface)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--studio-border-focus)] focus:outline-none transition-colors"
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting || !body.trim()}
            className="rounded-[var(--studio-radius-md)] bg-[var(--studio-accent)] px-4 py-2 text-sm text-white transition-all duration-[var(--duration-base)] hover:bg-[var(--studio-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Posting..." : "Comment"}
          </button>
        </div>
      </form>
    </div>
  );
}
