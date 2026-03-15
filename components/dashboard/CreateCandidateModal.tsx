"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { X, Sparkles, Loader2, Send } from "lucide-react";
import {
  parseVariants,
  countCompleteVariants,
} from "@/lib/explore/parse-variants";
import {
  extractComponentName,
  buildSrcdoc,
} from "@/lib/explore/preview-helpers";
import { toast } from "sonner";
import { getStoredApiKey } from "@/lib/hooks/use-api-key";
import type { DesignVariant } from "@/lib/types";

interface CreateCandidateModalProps {
  orgId: string;
  onClose: () => void;
  onCreated?: () => void;
}

interface VariantPreview {
  variant: DesignVariant;
  srcdoc: string | null;
  transpiling: boolean;
}

export function CreateCandidateModal({
  orgId,
  onClose,
  onCreated,
}: CreateCandidateModalProps) {
  // Form state
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [variantCount, setVariantCount] = useState(3);

  // Generation state
  const [phase, setPhase] = useState<"form" | "preview">("form");
  const [isGenerating, setIsGenerating] = useState(false);
  const [variants, setVariants] = useState<DesignVariant[]>([]);
  const [previews, setPreviews] = useState<VariantPreview[]>([]);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const lastCountRef = useRef(0);

  // Transpile variants when they change
  useEffect(() => {
    if (variants.length === 0) return;

    let cancelled = false;

    async function transpileAll() {
      const results: VariantPreview[] = variants.map((v) => ({
        variant: v,
        srcdoc: null,
        transpiling: true,
      }));

      if (!cancelled) setPreviews([...results]);

      for (let i = 0; i < variants.length; i++) {
        try {
          const res = await fetch("/api/transpile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: variants[i].code }),
          });
          if (res.ok) {
            const { js } = (await res.json()) as { js: string };
            const componentName = extractComponentName(variants[i].code);
            const srcdoc = buildSrcdoc(js, componentName);
            results[i] = {
              variant: variants[i],
              srcdoc,
              transpiling: false,
            };
          } else {
            results[i] = {
              variant: variants[i],
              srcdoc: null,
              transpiling: false,
            };
          }
        } catch {
          results[i] = {
            variant: variants[i],
            srcdoc: null,
            transpiling: false,
          };
        }

        if (!cancelled) setPreviews([...results]);
      }
    }

    transpileAll();
    return () => {
      cancelled = true;
    };
  }, [variants]);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || !name.trim()) return;

    setIsGenerating(true);
    setGenerationError(null);
    setVariants([]);
    setPreviews([]);
    lastCountRef.current = 0;
    abortRef.current = new AbortController();

    try {
      const apiKey = getStoredApiKey();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (apiKey) headers["X-Api-Key"] = apiKey;

      const res = await fetch("/api/generate/explore", {
        method: "POST",
        headers,
        body: JSON.stringify({
          prompt,
          designMd: "",
          variantCount,
          projectId: "",
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const errBody = await res
          .json()
          .catch(() => ({ error: "Request failed" }));
        throw new Error(
          (errBody as { error?: string }).error ?? "Request failed"
        );
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let fullOutput = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullOutput += decoder.decode(value, { stream: true });
        const completeCount = countCompleteVariants(fullOutput);
        if (completeCount > lastCountRef.current) {
          lastCountRef.current = completeCount;
          setVariants(parseVariants(fullOutput));
        }
      }

      const finalVariants = parseVariants(fullOutput);
      setVariants(finalVariants);
      setPhase("preview");
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      setGenerationError(message);
    } finally {
      setIsGenerating(false);
      abortRef.current = null;
    }
  }, [prompt, name, variantCount]);

  const handleSubmit = useCallback(async () => {
    if (variants.length === 0 || isSubmitting) return;

    setIsSubmitting(true);

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
          prompt: prompt.trim(),
          description: description.trim() || undefined,
          category: category.trim() || undefined,
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
      onCreated?.();
      onClose();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [variants, isSubmitting, orgId, name, prompt, description, category, onCreated, onClose]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm">
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-xl border border-[var(--studio-border-strong)] bg-[var(--bg-elevated)] shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--studio-border)] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--bg-surface)]">
              <Sparkles size={16} className="text-[var(--studio-accent)]" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                New Candidate
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                {phase === "form"
                  ? "Generate AI variants for team review"
                  : `${variants.length} variant${variants.length !== 1 ? "s" : ""} generated`}
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
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {phase === "form" ? (
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                  Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] px-3 py-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--studio-border-focus)] transition-colors"
                  placeholder="e.g. PricingCard, HeroSection"
                />
              </div>

              {/* Prompt */}
              <div>
                <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                  Prompt <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={3}
                  className="w-full resize-none rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] px-3 py-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--studio-border-focus)] transition-colors"
                  placeholder="Describe what the component should do or look like"
                />
              </div>

              {/* Category + Variant count row */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                    Category
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] px-3 py-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--studio-border-focus)] transition-colors"
                    placeholder="e.g. Cards, Navigation"
                  />
                </div>
                <div className="w-28">
                  <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                    Variants
                  </label>
                  <input
                    type="number"
                    value={variantCount}
                    onChange={(e) =>
                      setVariantCount(
                        Math.max(1, Math.min(6, Number(e.target.value) || 1))
                      )
                    }
                    min={1}
                    max={6}
                    className="w-full rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] px-3 py-2 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--studio-border-focus)] transition-colors"
                  />
                </div>
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
                  placeholder="Optional description for reviewers"
                />
              </div>

              {/* Generation error */}
              {generationError && (
                <p className="text-xs text-red-400">{generationError}</p>
              )}

              {/* Loading skeletons while generating */}
              {isGenerating && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {Array.from({ length: variantCount }).map((_, i) => {
                    const generatedPreview = previews[i];
                    if (generatedPreview?.srcdoc) {
                      return (
                        <div
                          key={`gen-${i}`}
                          className="rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] p-2"
                        >
                          <iframe
                            srcDoc={generatedPreview.srcdoc}
                            sandbox="allow-scripts"
                            className="aspect-[4/3] w-full rounded bg-white"
                            title={generatedPreview.variant.name}
                          />
                          <p className="mt-1.5 truncate text-[11px] font-medium text-[var(--text-primary)]">
                            {generatedPreview.variant.name}
                          </p>
                        </div>
                      );
                    }
                    return (
                      <div
                        key={`skeleton-${i}`}
                        className="animate-pulse rounded-lg border-2 border-dashed border-white/20 bg-white/[0.04] p-3"
                      >
                        <div className="mb-2 h-3 w-2/3 rounded bg-white/10" />
                        <div className="aspect-[4/3] rounded bg-white/10" />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Phase 2: Preview */
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {previews.map((p, i) => (
                  <div
                    key={p.variant.id ?? i}
                    className="rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] p-2"
                  >
                    {p.transpiling ? (
                      <div className="flex aspect-[4/3] items-center justify-center rounded bg-white/[0.04]">
                        <Loader2
                          size={16}
                          className="animate-spin text-[var(--text-muted)]"
                        />
                      </div>
                    ) : p.srcdoc ? (
                      <iframe
                        srcDoc={p.srcdoc}
                        sandbox="allow-scripts"
                        className="aspect-[4/3] w-full rounded bg-white"
                        title={p.variant.name}
                      />
                    ) : (
                      <div className="flex aspect-[4/3] items-center justify-center rounded bg-white/[0.04]">
                        <p className="text-[10px] text-[var(--text-muted)]">
                          Preview unavailable
                        </p>
                      </div>
                    )}
                    <p className="mt-1.5 truncate text-[11px] font-medium text-[var(--text-primary)]">
                      {p.variant.name}
                    </p>
                    {p.variant.rationale && (
                      <p className="mt-0.5 line-clamp-2 text-[10px] text-[var(--text-muted)]">
                        {p.variant.rationale}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-[var(--studio-border)] px-5 py-3">
          <div className="flex items-center justify-end gap-2">
            {phase === "form" && !isGenerating && (
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors"
              >
                Cancel
              </button>
            )}

            {phase === "form" && (
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating || !name.trim() || !prompt.trim()}
                className="flex items-center gap-1.5 rounded-lg bg-[var(--studio-accent)] px-4 py-1.5 text-xs font-medium text-[var(--text-on-accent)] hover:bg-[var(--studio-accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles size={12} />
                    Generate Variants
                  </>
                )}
              </button>
            )}

            {phase === "preview" && (
              <>
                <button
                  type="button"
                  onClick={() => setPhase("form")}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting || variants.length === 0}
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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
