"use client";

import { useState, useCallback } from "react";
import { X, Send, Loader2 } from "lucide-react";
import { useOrgStore } from "@/lib/store/organization";
import { toast } from "sonner";
import type { DesignVariant } from "@/lib/types";

interface SubmitCandidateModalProps {
  variants: DesignVariant[];
  prompt: string;
  onClose: () => void;
}

export function SubmitCandidateModal({
  variants,
  prompt,
  onClose,
}: SubmitCandidateModalProps) {
  const orgId = useOrgStore((s) => s.currentOrgId);

  const [name, setName] = useState(prompt.slice(0, 60));
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!orgId || !name.trim() || variants.length === 0 || isSubmitting)
        return;

      setIsSubmitting(true);
      setError(null);

      try {
        const candidateVariants = variants.map((v) => ({
          name: v.name,
          code: v.code,
          rationale: v.rationale,
        }));

        const res = await fetch(`/api/organizations/${orgId}/candidates`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            prompt,
            description: description.trim() || undefined,
            variants: candidateVariants,
          }),
        });

        if (!res.ok) {
          const body = await res
            .json()
            .catch(() => ({ error: "Failed to submit candidate" }));
          throw new Error(
            (body as { error?: string }).error ?? "Failed to submit candidate"
          );
        }

        toast.success("Candidate submitted for review");
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setIsSubmitting(false);
      }
    },
    [orgId, name, description, prompt, variants, isSubmitting, onClose]
  );

  if (!orgId) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-xl border border-[var(--studio-border-strong)] bg-[var(--bg-elevated)] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--studio-border)] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--bg-surface)]">
              <Send size={16} className="text-[var(--studio-accent)]" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                Submit as Candidate
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                {variants.length} variant{variants.length !== 1 ? "s" : ""} will
                be submitted for team review
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          {/* Name */}
          <div>
            <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
              Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] px-3 py-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--studio-border-focus)] transition-colors"
              placeholder="e.g. PricingCard"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full resize-none rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] px-3 py-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--studio-border-focus)] transition-colors"
              placeholder="Brief description for reviewers"
            />
          </div>

          {/* Error */}
          {error && <p className="text-xs text-red-400">{error}</p>}

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-[var(--studio-accent)] px-4 py-1.5 text-xs font-medium text-[var(--text-on-accent)] hover:bg-[var(--studio-accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send size={12} />
                  Submit for Review
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
