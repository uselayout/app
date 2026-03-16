"use client";

import { useState, useCallback, useRef } from "react";
import { Sparkles, X, Send, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { ExplorerToolbar } from "./ExplorerToolbar";
import { VariantCard } from "./VariantCard";
import { FigmaPushModal } from "./FigmaPushModal";
import { FigmaImportModal } from "./FigmaImportModal";
import { ResponsivePreview } from "./ResponsivePreview";
import { ComparisonView } from "./ComparisonView";
import { PromoteToLibraryModal } from "./PromoteToLibraryModal";
import { SubmitCandidateModal } from "./SubmitCandidateModal";
import { parseVariants, countCompleteVariants } from "@/lib/explore/parse-variants";
import { friendlyError } from "@/lib/explore/friendly-error";
import { applyChangesToDesignMd } from "@/lib/figma/diff";
import { getStoredApiKey } from "@/lib/hooks/use-api-key";
import { processCodeImages } from "@/lib/image/process-code-images";
import type { ExplorationSession, DesignVariant, FigmaChange } from "@/lib/types";

interface ExplorerCanvasProps {
  projectId: string;
  designMd: string;
  explorations: ExplorationSession[];
  onUpdateExplorations: (explorations: ExplorationSession[]) => void;
  onPushToFigma: (variant: DesignVariant) => void;
  onDesignMdUpdate?: (newMd: string) => void;
}

export function ExplorerCanvas({
  projectId,
  designMd,
  explorations,
  onUpdateExplorations,
  onPushToFigma: _onPushToFigma,
  onDesignMdUpdate,
}: ExplorerCanvasProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [pushVariant, setPushVariant] = useState<DesignVariant | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [responsiveVariant, setResponsiveVariant] = useState<DesignVariant | null>(null);
  const [promoteVariant, setPromoteVariant] = useState<DesignVariant | null>(null);
  const [showSubmitCandidate, setShowSubmitCandidate] = useState(false);
  const [comparePrompt, setComparePrompt] = useState<string | null>(null);
  const [activeExplorationIndex, setActiveExplorationIndex] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Active exploration — default to most recent, or user-selected
  const explorationIndex = activeExplorationIndex !== null && activeExplorationIndex < explorations.length
    ? activeExplorationIndex
    : explorations.length - 1;
  const currentExploration = explorations.length > 0 ? explorations[explorationIndex] : null;
  const variants = currentExploration?.variants ?? [];

  const handleDeleteExploration = useCallback(
    (index: number) => {
      const updated = explorations.filter((_, i) => i !== index);
      onUpdateExplorations(updated);
      // Adjust active index
      if (updated.length === 0) {
        setActiveExplorationIndex(null);
      } else if (activeExplorationIndex !== null) {
        if (index <= activeExplorationIndex) {
          setActiveExplorationIndex(Math.max(0, activeExplorationIndex - 1));
        }
      }
      setSelectedVariantId(null);
    },
    [explorations, activeExplorationIndex, onUpdateExplorations]
  );

  const selectedVariant = variants.find((v) => v.id === selectedVariantId) ?? null;

  const streamVariants = useCallback(
    async (
      res: Response,
      sessionId: string,
      updatedExplorations: ExplorationSession[]
    ) => {
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let fullOutput = "";
      let lastCount = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        fullOutput += decoder.decode(value, { stream: true });
        const completeCount = countCompleteVariants(fullOutput);
        if (completeCount > lastCount) {
          lastCount = completeCount;
          const parsed = parseVariants(fullOutput);
          const updated = updatedExplorations.map((e) =>
            e.id === sessionId ? { ...e, variants: parsed } : e
          );
          onUpdateExplorations(updated);
        }
      }

      const finalVariants = parseVariants(fullOutput);
      const finalExplorations = updatedExplorations.map((e) =>
        e.id === sessionId ? { ...e, variants: finalVariants } : e
      );
      onUpdateExplorations(finalExplorations);

      // Debug: check what Claude generated
      console.log("[ExplorerCanvas] Final variants:", finalVariants.length);
      finalVariants.forEach((v, i) => {
        const hasPlaceholder = /data-generate-image/i.test(v.code);
        const hasPlaceholderService = /placehold\.co|placeholder\.com|via\.placeholder/i.test(v.code);
        console.log(`[ExplorerCanvas] Variant ${i + 1}: hasImagePlaceholder=${hasPlaceholder}, hasPlaceholderService=${hasPlaceholderService}, codeLength=${v.code.length}`);
      });

      // Process image placeholders in parallel (non-blocking)
      const variantsWithImages = await Promise.all(
        finalVariants.map(async (v) => {
          const processed = await processCodeImages(v.code);
          return processed !== v.code ? { ...v, code: processed } : v;
        })
      );

      const anyChanged = variantsWithImages.some((v, i) => v !== finalVariants[i]);
      if (anyChanged) {
        const imageExplorations = finalExplorations.map((e) =>
          e.id === sessionId ? { ...e, variants: variantsWithImages } : e
        );
        onUpdateExplorations(imageExplorations);
      }
    },
    [onUpdateExplorations]
  );

  const handleGenerate = useCallback(
    async (prompt: string, variantCount: number, imageDataUrl?: string) => {
      if (isGenerating) return;

      setIsGenerating(true);
      setGenerationError(null);
      setSelectedVariantId(null);
      abortRef.current = new AbortController();

      const sessionId = crypto.randomUUID();
      const newExploration: ExplorationSession = {
        id: sessionId,
        projectId,
        prompt,
        variantCount,
        variants: [],
        referenceImage: imageDataUrl,
        createdAt: new Date().toISOString(),
      };

      const updatedExplorations = [...explorations, newExploration];
      onUpdateExplorations(updatedExplorations);
      setActiveExplorationIndex(updatedExplorations.length - 1);

      try {
        const apiKey = getStoredApiKey();
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (apiKey) headers["X-Api-Key"] = apiKey;

        const res = await fetch("/api/generate/explore", {
          method: "POST",
          headers,
          body: JSON.stringify({ prompt, designMd, variantCount, projectId, imageDataUrl }),
          signal: abortRef.current.signal,
        });

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({ error: "Request failed" }));
          throw new Error(friendlyError(errBody));
        }

        await streamVariants(res, sessionId, updatedExplorations);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
        setGenerationError(message);
      } finally {
        setIsGenerating(false);
        abortRef.current = null;
      }
    },
    [isGenerating, projectId, designMd, explorations, onUpdateExplorations, streamVariants]
  );

  const handleRefine = useCallback(
    async (refinementPrompt: string, variantCount: number) => {
      if (isGenerating || !selectedVariant) return;

      setIsGenerating(true);
      setGenerationError(null);
      abortRef.current = new AbortController();

      const sessionId = crypto.randomUUID();
      const newExploration: ExplorationSession = {
        id: sessionId,
        projectId,
        prompt: `Refine "${selectedVariant.name}": ${refinementPrompt}`,
        variantCount,
        variants: [],
        createdAt: new Date().toISOString(),
      };

      const updatedExplorations = [...explorations, newExploration];
      onUpdateExplorations(updatedExplorations);
      setActiveExplorationIndex(updatedExplorations.length - 1);
      setSelectedVariantId(null);

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
            prompt: refinementPrompt,
            designMd,
            variantCount,
            projectId,
            baseCode: selectedVariant.code,
          }),
          signal: abortRef.current.signal,
        });

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({ error: "Request failed" }));
          throw new Error(friendlyError(errBody));
        }

        await streamVariants(res, sessionId, updatedExplorations);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
        setGenerationError(message);
      } finally {
        setIsGenerating(false);
        abortRef.current = null;
      }
    },
    [isGenerating, selectedVariant, projectId, designMd, explorations, onUpdateExplorations, streamVariants]
  );

  const handleRegenerate = useCallback(() => {
    if (!currentExploration) return;
    handleGenerate(currentExploration.prompt, currentExploration.variantCount);
  }, [currentExploration, handleGenerate]);

  const handleRateVariant = useCallback(
    (variantId: string, rating: "up" | "down") => {
      if (!currentExploration) return;
      const updated = explorations.map((e) =>
        e.id === currentExploration.id
          ? {
              ...e,
              variants: e.variants.map((v) =>
                v.id === variantId
                  ? { ...v, rating: v.rating === rating ? undefined : rating }
                  : v
              ),
            }
          : e
      );
      onUpdateExplorations(updated);
    },
    [currentExploration, explorations, onUpdateExplorations]
  );

  const handlePushToFigma = useCallback((variant: DesignVariant) => {
    setPushVariant(variant);
  }, []);

  const handlePushComplete = useCallback(
    (record: { fileKey: string; nodeId: string; viewports: string[] }) => {
      if (!pushVariant || !currentExploration) return;
      const updated = explorations.map((e) =>
        e.id === currentExploration.id
          ? {
              ...e,
              variants: e.variants.map((v) =>
                v.id === pushVariant.id
                  ? {
                      ...v,
                      figmaPush: {
                        fileKey: record.fileKey,
                        nodeId: record.nodeId,
                        pushedAt: new Date().toISOString(),
                        viewports: record.viewports,
                      },
                    }
                  : v
              ),
            }
          : e
      );
      onUpdateExplorations(updated);
    },
    [pushVariant, currentExploration, explorations, onUpdateExplorations]
  );

  const handleUpdateDesignMdFromImport = useCallback(
    (acceptedChanges: FigmaChange[]) => {
      if (!onDesignMdUpdate) return;
      const updated = applyChangesToDesignMd(designMd, acceptedChanges);
      onDesignMdUpdate(updated);
    },
    [designMd, onDesignMdUpdate]
  );

  return (
    <div className="flex h-full flex-col">
      {/* Error banner */}
      {generationError && (
        <div className="mx-4 mt-4 flex items-start gap-2.5 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3">
          <p className="flex-1 text-xs text-red-300">{generationError}</p>
          <button
            onClick={() => setGenerationError(null)}
            className="shrink-0 text-red-400 hover:text-red-300 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Exploration history bar */}
      {explorations.length > 0 && (
        <div className="flex items-center gap-2 border-b border-[var(--studio-border)] px-4 py-2">
          <button
            disabled={explorationIndex <= 0}
            onClick={() => { setActiveExplorationIndex(explorationIndex - 1); setSelectedVariantId(null); }}
            className="shrink-0 rounded p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          <div className="flex-1 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {explorations.map((e, i) => (
              <button
                key={e.id}
                onClick={() => { setActiveExplorationIndex(i); setSelectedVariantId(null); }}
                className={`shrink-0 max-w-[200px] truncate rounded-md px-2.5 py-1 text-[11px] transition-colors ${
                  i === explorationIndex
                    ? "bg-[var(--studio-accent-subtle)] text-[var(--text-primary)] font-medium"
                    : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                }`}
              >
                {e.prompt.length > 40 ? e.prompt.slice(0, 40) + "…" : e.prompt}
              </button>
            ))}
          </div>
          <button
            disabled={explorationIndex >= explorations.length - 1}
            onClick={() => { setActiveExplorationIndex(explorationIndex + 1); setSelectedVariantId(null); }}
            className="shrink-0 rounded p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <ChevronRight size={14} />
          </button>
          <button
            onClick={() => handleDeleteExploration(explorationIndex)}
            disabled={isGenerating}
            className="shrink-0 rounded p-1 text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 disabled:opacity-30 transition-colors"
            title="Delete this exploration"
          >
            <Trash2 size={13} />
          </button>
          <span className="shrink-0 text-[10px] text-[var(--text-muted)] tabular-nums">
            {explorationIndex + 1}/{explorations.length}
          </span>
        </div>
      )}

      {/* Canvas area */}
      <div className="flex-1 overflow-y-auto p-4">
        {variants.length === 0 && !isGenerating ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <div className="rounded-xl bg-[var(--bg-surface)] p-4">
              <Sparkles size={24} className="text-[var(--text-muted)]" />
            </div>
            <div>
              <h3 className="mb-1 text-sm font-semibold text-[var(--text-primary)]">
                Canvas
              </h3>
              <p className="max-w-xs text-xs text-[var(--text-secondary)]">
                Describe what to explore. Layout will generate
                multiple design variations using your design system.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Reference image card */}
            {currentExploration?.referenceImage && (
              <div className="flex items-center gap-3 rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] p-3">
                <img
                  src={currentExploration.referenceImage}
                  alt="Reference"
                  className="h-16 w-16 rounded-md object-cover border border-[var(--studio-border)]"
                />
                <div>
                  <p className="text-xs font-medium text-[var(--text-primary)]">Reference image</p>
                  <p className="text-[11px] text-[var(--text-muted)]">{currentExploration.prompt}</p>
                </div>
              </div>
            )}
            {/* Submit all as candidate */}
            {variants.length > 0 && !isGenerating && (
              <div className="flex justify-end">
                <button
                  onClick={() => setShowSubmitCandidate(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] px-3 py-1.5 text-[11px] font-medium text-[var(--text-secondary)] hover:border-[var(--studio-border-strong)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <Send size={12} />
                  Submit All as Candidate
                </button>
              </div>
            )}

          <div className={`grid gap-4 ${(currentExploration?.variantCount ?? variants.length) > 4 ? "grid-cols-2 lg:grid-cols-3" : "grid-cols-2"}`}>
            {variants.map((variant) => (
              <VariantCard
                key={variant.id}
                variant={variant}
                isSelected={selectedVariantId === variant.id}
                onSelect={() =>
                  setSelectedVariantId(
                    selectedVariantId === variant.id ? null : variant.id
                  )
                }
                onRate={(rating) => handleRateVariant(variant.id, rating)}
                onCopyCode={() => navigator.clipboard.writeText(variant.code)}
                onPushToFigma={() => handlePushToFigma(variant)}
                onRegenerate={handleRegenerate}
                onResponsive={() => setResponsiveVariant(variant)}
                onPromoteToLibrary={() => setPromoteVariant(variant)}
              />
            ))}
            {isGenerating && variants.length < (currentExploration?.variantCount ?? 0) &&
              Array.from({ length: (currentExploration?.variantCount ?? 2) - variants.length }).map((_, i) => (
                <div key={`skeleton-${i}`} className="rounded-xl border-2 border-dashed border-white/20 bg-white/[0.04] p-4 flex flex-col items-center justify-center">
                  <div className="aspect-[4/3] w-full flex flex-col items-center justify-center gap-3">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
                    <p className="text-xs text-[var(--text-muted)] animate-pulse">
                      Generating variant {variants.length + i + 1}...
                    </p>
                  </div>
                </div>
              ))
            }
          </div>
          </div>
        )}

        {isGenerating && variants.length === 0 && (
          <div className="grid gap-4 grid-cols-2">
            {Array.from({ length: currentExploration?.variantCount ?? 2 }).map((_, i) => (
              <div key={`skeleton-${i}`} className="rounded-xl border-2 border-dashed border-white/20 bg-white/[0.04] p-4 flex flex-col items-center justify-center">
                <div className="aspect-[4/3] w-full flex flex-col items-center justify-center gap-3">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
                  <p className="text-xs text-[var(--text-muted)] animate-pulse">
                    Generating variant {i + 1}...
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Prompt bar — pinned to bottom */}
      <ExplorerToolbar
        onGenerate={handleGenerate}
        onRefine={handleRefine}
        onCompare={(prompt) => setComparePrompt(prompt)}
        onRegenerate={handleRegenerate}
        onPushToFigma={() => selectedVariant && handlePushToFigma(selectedVariant)}
        onImportFromFigma={() => setShowImport(true)}
        isGenerating={isGenerating}
        hasVariants={variants.length > 0}
        hasSelection={!!selectedVariant}
        selectedVariantName={selectedVariant?.name}
      />

      {pushVariant && (
        <FigmaPushModal
          variant={pushVariant}
          onClose={() => setPushVariant(null)}
          onPushComplete={handlePushComplete}
        />
      )}

      {responsiveVariant && (
        <ResponsivePreview
          variant={responsiveVariant}
          onClose={() => setResponsiveVariant(null)}
        />
      )}

      {comparePrompt && (
        <ComparisonView
          prompt={comparePrompt}
          designMd={designMd}
          onClose={() => setComparePrompt(null)}
        />
      )}

      {showImport && (
        <FigmaImportModal
          onClose={() => setShowImport(false)}
          designMd={designMd}
          onUpdateDesignMd={handleUpdateDesignMdFromImport}
        />
      )}

      {promoteVariant && (
        <PromoteToLibraryModal
          variant={promoteVariant}
          onClose={() => setPromoteVariant(null)}
        />
      )}

      {showSubmitCandidate && currentExploration && (
        <SubmitCandidateModal
          variants={variants}
          prompt={currentExploration.prompt}
          onClose={() => setShowSubmitCandidate(false)}
        />
      )}
    </div>
  );
}
