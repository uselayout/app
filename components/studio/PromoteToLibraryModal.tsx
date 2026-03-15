"use client";

import { useState, useCallback, useEffect } from "react";
import { X, BookMarked, Loader2 } from "lucide-react";
import { extractComponentName } from "@/lib/explore/preview-helpers";
import { useOrgStore } from "@/lib/store/organization";
import { toast } from "sonner";
import type { DesignVariant } from "@/lib/types";

interface PromoteToLibraryModalProps {
  variant: DesignVariant;
  onClose: () => void;
  onSuccess?: () => void;
}

export function PromoteToLibraryModal({
  variant,
  onClose,
  onSuccess,
}: PromoteToLibraryModalProps) {
  const orgId = useOrgStore((s) => s.currentOrgId);

  const [name, setName] = useState(() => extractComponentName(variant.code));
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState(variant.rationale ?? "");
  const [tagsInput, setTagsInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [submittingCandidate, setSubmittingCandidate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingCategories, setExistingCategories] = useState<string[]>([]);
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);

  // Fetch existing categories for autocomplete
  useEffect(() => {
    if (!orgId) return;
    let cancelled = false;
    fetch(`/api/organizations/${orgId}/components/categories`)
      .then((res) => (res.ok ? res.json() : []))
      .then((cats: string[]) => {
        if (!cancelled) setExistingCategories(cats);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [orgId]);

  const filteredCategories = existingCategories.filter(
    (c) => c.toLowerCase().includes(category.toLowerCase()) && c.toLowerCase() !== category.toLowerCase()
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!orgId || !name.trim()) return;

      setSaving(true);
      setError(null);

      try {
        const tags = tagsInput
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);

        const res = await fetch(`/api/organizations/${orgId}/components`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            code: variant.code,
            description: description.trim() || undefined,
            category: category.trim() || undefined,
            tags: tags.length > 0 ? tags : undefined,
            source: "explorer" as const,
          }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({ error: "Failed to save component" }));
          throw new Error(body.error ?? "Failed to save component");
        }

        onSuccess?.();
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setSaving(false);
      }
    },
    [orgId, name, category, description, tagsInput, variant.code, onClose, onSuccess]
  );

  const handleSubmitAsCandidate = useCallback(async () => {
    if (!orgId || !name.trim() || submittingCandidate) return;

    setSubmittingCandidate(true);
    setError(null);

    try {
      const res = await fetch(`/api/organizations/${orgId}/candidates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          prompt: "Promoted from Explorer variant",
          description: description.trim() || undefined,
          category: category.trim() || undefined,
          variants: [
            {
              name: name.trim(),
              code: variant.code,
              rationale: variant.rationale,
            },
          ],
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

      toast.success("Submitted for review");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmittingCandidate(false);
    }
  }, [orgId, name, description, category, variant.code, variant.rationale, submittingCandidate, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-xl border border-[--studio-border-strong] bg-[var(--bg-elevated)] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[--studio-border] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[--bg-surface]">
              <BookMarked size={16} className="text-[--studio-accent]" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[--text-primary]">
                Add to Library
              </h2>
              <p className="text-xs text-[--text-secondary]">
                Promote this variant to a reusable component
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-[--text-muted] hover:bg-[--bg-hover] hover:text-[--text-primary] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          {/* Name */}
          <div>
            <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-[--text-muted]">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-lg border border-[--studio-border] bg-[--bg-surface] px-3 py-2 text-xs text-[--text-primary] placeholder:text-[--text-muted] outline-none focus:border-[--studio-border-focus] transition-colors"
              placeholder="e.g. PricingCard"
            />
          </div>

          {/* Category */}
          <div className="relative">
            <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-[--text-muted]">
              Category
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setShowCategorySuggestions(true);
              }}
              onFocus={() => setShowCategorySuggestions(true)}
              onBlur={() => setTimeout(() => setShowCategorySuggestions(false), 150)}
              className="w-full rounded-lg border border-[--studio-border] bg-[--bg-surface] px-3 py-2 text-xs text-[--text-primary] placeholder:text-[--text-muted] outline-none focus:border-[--studio-border-focus] transition-colors"
              placeholder="e.g. Cards, Navigation, Forms"
            />
            {showCategorySuggestions && filteredCategories.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-32 overflow-y-auto rounded-lg border border-[--studio-border] bg-[--bg-elevated] shadow-lg">
                {filteredCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setCategory(cat);
                      setShowCategorySuggestions(false);
                    }}
                    className="block w-full px-3 py-1.5 text-left text-xs text-[--text-secondary] hover:bg-[--bg-hover] hover:text-[--text-primary] transition-colors"
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-[--text-muted]">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full resize-none rounded-lg border border-[--studio-border] bg-[--bg-surface] px-3 py-2 text-xs text-[--text-primary] placeholder:text-[--text-muted] outline-none focus:border-[--studio-border-focus] transition-colors"
              placeholder="Brief description of this component"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-[--text-muted]">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full rounded-lg border border-[--studio-border] bg-[--bg-surface] px-3 py-2 text-xs text-[--text-primary] placeholder:text-[--text-muted] outline-none focus:border-[--studio-border-focus] transition-colors"
              placeholder="e.g. hero, marketing, pricing"
            />
          </div>

          {/* Code preview */}
          <details className="group">
            <summary className="flex cursor-pointer items-center gap-1.5 text-xs text-[--text-muted] hover:text-[--text-secondary] transition-colors">
              <span className="group-open:rotate-90 transition-transform">&#9656;</span>
              View component code ({variant.code.split("\n").length} lines)
            </summary>
            <pre className="mt-2 max-h-48 overflow-auto rounded-lg border border-[--studio-border] bg-[--bg-surface] p-3 text-[11px] text-[--text-secondary] font-mono leading-relaxed">
              {variant.code}
            </pre>
          </details>

          {/* Error */}
          {error && (
            <p className="text-xs text-red-400">{error}</p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-[--text-secondary] hover:bg-[--bg-hover] hover:text-[--text-primary] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim() || !orgId}
              className="flex items-center gap-1.5 rounded-lg bg-[--studio-accent] px-4 py-1.5 text-xs font-medium text-[--text-on-accent] hover:bg-[--studio-accent-hover] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <BookMarked size={12} />
                  Add to Library
                </>
              )}
            </button>
          </div>

          <div className="mt-3 text-center">
            <button
              type="button"
              onClick={handleSubmitAsCandidate}
              disabled={submittingCandidate || !name.trim() || !orgId}
              className="text-xs text-[--text-muted] hover:text-[--studio-accent] transition-colors underline underline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submittingCandidate ? "Submitting..." : "Submit for review instead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
