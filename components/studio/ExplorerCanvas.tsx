"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { Sparkles, X, ChevronLeft, ChevronRight, Trash2, Plus } from "lucide-react";
import { ExplorerToolbar } from "./ExplorerToolbar";
import { VariantCard } from "./VariantCard";
import { FigmaPushModal } from "./FigmaPushModal";
import { FigmaImportModal } from "./FigmaImportModal";
import { ResponsivePreview } from "./ResponsivePreview";
import { ComparisonView } from "./ComparisonView";
import { PromoteToLibraryModal } from "./PromoteToLibraryModal";
import { parseVariants, countCompleteVariants } from "@/lib/explore/parse-variants";
import { friendlyError } from "@/lib/explore/friendly-error";
import { applyChangesToDesignMd } from "@/lib/figma/diff";
import { getStoredApiKey } from "@/lib/hooks/use-api-key";
import { processCodeImages, type ProcessCodeImagesResult } from "@/lib/image/process-code-images";
import { calculateHealthScore } from "@/lib/health/score";
import { useOnboardingStore } from "@/lib/store/onboarding";
import type { ExplorationSession, DesignVariant, FigmaChange, ContextFile } from "@/lib/types";

interface ExplorerCanvasProps {
  projectId: string;
  designMd: string;
  explorations: ExplorationSession[];
  onUpdateExplorations: (explorations: ExplorationSession[]) => void;
  onPushToFigma: (variant: DesignVariant) => void;
  onDesignMdUpdate?: (newMd: string) => void;
  initialImage?: string;
  extractedFonts?: string[];
}

export function ExplorerCanvas({
  projectId,
  designMd,
  explorations,
  onUpdateExplorations,
  onPushToFigma: _onPushToFigma,
  onDesignMdUpdate,
  initialImage,
  extractedFonts = [],
}: ExplorerCanvasProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isProcessingImages, setIsProcessingImages] = useState(false);
  const [imageNotice, setImageNotice] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [pushVariant, setPushVariant] = useState<DesignVariant | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [responsiveVariant, setResponsiveVariant] = useState<DesignVariant | null>(null);
  const [promoteVariant, setPromoteVariant] = useState<DesignVariant | null>(null);
  const [comparePrompt, setComparePrompt] = useState<string | null>(null);
  const [expandedBatchId, setExpandedBatchId] = useState<string | null>(null);
  const [activeExplorationIndex, setActiveExplorationIndex] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const streamingBatchRef = useRef<string | null>(null);
  const pendingBatchCountRef = useRef(0);

  const { steps, markStep } = useOnboardingStore();
  const stepsRef = useRef(steps);
  stepsRef.current = steps;

  // Warn user before navigating away during generation
  useEffect(() => {
    if (!isGenerating) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isGenerating]);

  // Active exploration — default to most recent, or user-selected
  const explorationIndex = activeExplorationIndex !== null && activeExplorationIndex < explorations.length
    ? activeExplorationIndex
    : explorations.length - 1;
  const currentExploration = explorations.length > 0 ? explorations[explorationIndex] : null;
  const variants = currentExploration?.variants ?? [];

  // Auto-scroll to bottom when new variants stream in
  useEffect(() => {
    if (isGenerating && scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [isGenerating, variants.length]);

  // Group variants by batch for rendering
  const batches = useMemo(() => {
    const groups: { batchId: string; prompt: string; variants: DesignVariant[] }[] = [];
    for (const v of variants) {
      const bid = v.batchId ?? "initial";
      const last = groups[groups.length - 1];
      if (last?.batchId === bid) {
        last.variants.push(v);
      } else {
        groups.push({
          batchId: bid,
          prompt: v.batchPrompt ?? currentExploration?.prompt ?? "",
          variants: [v],
        });
      }
    }
    return groups;
  }, [variants, currentExploration?.prompt]);

  const handleClearAllExplorations = useCallback(() => {
    onUpdateExplorations([]);
    setActiveExplorationIndex(null);
    setSelectedVariantId(null);
  }, [onUpdateExplorations]);

  const handleDeleteExploration = useCallback(
    (index: number) => {
      const updated = explorations.filter((_, i) => i !== index);
      onUpdateExplorations(updated);
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

  const handleNewExploration = useCallback(() => {
    const sessionId = crypto.randomUUID();
    const newExploration: ExplorationSession = {
      id: sessionId,
      projectId,
      prompt: "",
      variantCount: 0,
      variants: [],
      createdAt: new Date().toISOString(),
    };
    const updated = [...explorations, newExploration];
    onUpdateExplorations(updated);
    setActiveExplorationIndex(updated.length - 1);
    setSelectedVariantId(null);
  }, [explorations, projectId, onUpdateExplorations]);

  const selectedVariant = variants.find((v) => v.id === selectedVariantId) ?? null;

  const streamVariants = useCallback(
    async (
      res: Response,
      sessionId: string,
      updatedExplorations: ExplorationSession[],
      existingVariants: DesignVariant[],
      batchId: string,
      batchPrompt: string,
    ) => {
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let fullOutput = "";
      let lastCount = 0;
      const parseOpts = { idOffset: existingVariants.length, batchId, batchPrompt };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        fullOutput += decoder.decode(value, { stream: true });
        const completeCount = countCompleteVariants(fullOutput);
        if (completeCount > lastCount) {
          lastCount = completeCount;
          const parsed = parseVariants(fullOutput, parseOpts);
          const merged = [...existingVariants, ...parsed];
          const updated = updatedExplorations.map((e) =>
            e.id === sessionId ? { ...e, variants: merged } : e
          );
          onUpdateExplorations(updated);
        }
      }

      const finalNew = parseVariants(fullOutput, parseOpts);
      const finalMerged = [...existingVariants, ...finalNew];
      const finalExplorations = updatedExplorations.map((e) =>
        e.id === sessionId ? { ...e, variants: finalMerged } : e
      );
      onUpdateExplorations(finalExplorations);

      // Mark onboarding step on first live generation
      if (!stepsRef.current.generatedVariant && finalNew.length > 0) {
        markStep("generatedVariant");
      }

      // Process image placeholders in the new batch only
      setIsProcessingImages(true);
      setImageNotice(null);
      try {
        const results: ProcessCodeImagesResult[] = await Promise.all(
          finalNew.map((v) => processCodeImages(v.code))
        );

        // Check for issues
        const anySkippedNoKey = results.some((r) => r.skippedNoKey);
        const totalFailed = results.reduce((sum, r) => sum + r.failedCount, 0);
        const totalPlaceholders = results.reduce((sum, r) => sum + r.placeholderCount, 0);

        // Collect all error messages across variants
        const allErrors = results.flatMap((r) => r.errors);
        const hasSafetyErrors = allErrors.some((e) => e.includes("Safety policy"));

        if (anySkippedNoKey && totalPlaceholders > 0) {
          setImageNotice(`${totalPlaceholders} image(s) skipped — add a Google AI API key in Settings to enable image generation.`);
        } else if (totalFailed > 0 && hasSafetyErrors) {
          setImageNotice(`${totalFailed} of ${totalPlaceholders} image(s) blocked by safety policy. Headshots auto-retried as illustrations — try more abstract descriptions if still failing.`);
        } else if (totalFailed > 0) {
          setImageNotice(`${totalFailed} of ${totalPlaceholders} image(s) failed to generate.`);
        }

        const newWithImages = finalNew.map((v, i) =>
          results[i].code !== v.code ? { ...v, code: results[i].code } : v
        );
        const anyChanged = newWithImages.some((v, i) => v !== finalNew[i]);
        if (anyChanged) {
          const imageMerged = [...existingVariants, ...newWithImages];
          const imageExplorations = finalExplorations.map((e) =>
            e.id === sessionId ? { ...e, variants: imageMerged } : e
          );
          onUpdateExplorations(imageExplorations);
        }
        // Compute health scores for newly generated variants
        const variantsToScore = anyChanged ? newWithImages : finalNew;
        const scored = variantsToScore.map((v) => ({
          ...v,
          healthScore: calculateHealthScore(v.code, extractedFonts, designMd),
        }));
        const scoredMerged = [...existingVariants, ...scored];
        const scoredExplorations = finalExplorations.map((e) =>
          e.id === sessionId ? { ...e, variants: scoredMerged } : e
        );
        onUpdateExplorations(scoredExplorations);
      } finally {
        setIsProcessingImages(false);
        streamingBatchRef.current = null;
        pendingBatchCountRef.current = 0;
      }
    },
    [onUpdateExplorations, extractedFonts, designMd, markStep]
  );

  /** Shared fetch + stream logic used by all generation handlers */
  const runGeneration = useCallback(
    async (
      sessionId: string,
      existingVariants: DesignVariant[],
      batchId: string,
      batchPrompt: string,
      latestExplorations: ExplorationSession[],
      fetchBody: Record<string, unknown>,
      variantCount: number,
    ) => {
      streamingBatchRef.current = batchId;
      pendingBatchCountRef.current = variantCount;

      const apiKey = getStoredApiKey();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (apiKey) headers["X-Api-Key"] = apiKey;

      const res = await fetch("/api/generate/explore", {
        method: "POST",
        headers,
        body: JSON.stringify(fetchBody),
        signal: abortRef.current!.signal,
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(friendlyError(errBody));
      }

      await streamVariants(res, sessionId, latestExplorations, existingVariants, batchId, batchPrompt);
    },
    [streamVariants]
  );

  const handleGenerate = useCallback(
    async (prompt: string, variantCount: number, imageDataUrl?: string, contextFiles?: ContextFile[]) => {
      if (isGenerating) return;

      setIsGenerating(true);
      setGenerationError(null);
      setSelectedVariantId(null);
      abortRef.current = new AbortController();

      const batchId = crypto.randomUUID();
      const batchPrompt = prompt;

      // Append to current exploration if it exists; otherwise create new
      let sessionId: string;
      let existingVariants: DesignVariant[];
      let updatedExplorations: ExplorationSession[];

      if (currentExploration) {
        sessionId = currentExploration.id;
        existingVariants = currentExploration.variants;
        // Update the exploration's prompt if it was empty (new tab)
        updatedExplorations = explorations.map((e) =>
          e.id === sessionId
            ? { ...e, ...(e.prompt === "" && { prompt }), variantCount }
            : e
        );
        onUpdateExplorations(updatedExplorations);
      } else {
        sessionId = crypto.randomUUID();
        existingVariants = [];
        const newExploration: ExplorationSession = {
          id: sessionId,
          projectId,
          prompt,
          variantCount,
          variants: [],
          referenceImage: imageDataUrl,
          createdAt: new Date().toISOString(),
        };
        updatedExplorations = [...explorations, newExploration];
        onUpdateExplorations(updatedExplorations);
        setActiveExplorationIndex(updatedExplorations.length - 1);
      }

      try {
        await runGeneration(
          sessionId,
          existingVariants,
          batchId,
          batchPrompt,
          updatedExplorations,
          { prompt, designMd, variantCount, projectId, imageDataUrl, contextFiles },
          variantCount,
        );
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
        setGenerationError(message);
      } finally {
        setIsGenerating(false);
        abortRef.current = null;
      }
    },
    [isGenerating, projectId, designMd, explorations, currentExploration, onUpdateExplorations, runGeneration]
  );

  const handleRefine = useCallback(
    async (refinementPrompt: string, variantCount: number, imageDataUrl?: string, contextFiles?: ContextFile[]) => {
      if (isGenerating || !selectedVariant || !currentExploration) return;

      setIsGenerating(true);
      setGenerationError(null);
      abortRef.current = new AbortController();

      const batchId = crypto.randomUUID();
      const batchPrompt = `Refine "${selectedVariant.name}": ${refinementPrompt}`;
      const sessionId = currentExploration.id;
      const existingVariants = currentExploration.variants;

      setSelectedVariantId(null);

      try {
        await runGeneration(
          sessionId,
          existingVariants,
          batchId,
          batchPrompt,
          explorations,
          {
            prompt: refinementPrompt,
            designMd,
            variantCount,
            projectId,
            baseCode: selectedVariant.code,
            imageDataUrl,
            contextFiles,
          },
          variantCount,
        );
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
        setGenerationError(message);
      } finally {
        setIsGenerating(false);
        abortRef.current = null;
      }
    },
    [isGenerating, selectedVariant, currentExploration, projectId, designMd, explorations, runGeneration]
  );

  const handleRegenerate = useCallback(() => {
    if (!currentExploration) return;
    handleGenerate(currentExploration.prompt, currentExploration.variantCount);
  }, [currentExploration, handleGenerate]);

  const handleRefineVariant = useCallback(
    async (variant: DesignVariant, feedback: string) => {
      if (isGenerating || !currentExploration) return;

      setIsGenerating(true);
      setGenerationError(null);
      abortRef.current = new AbortController();

      const batchId = crypto.randomUUID();
      const batchPrompt = `Refine "${variant.name}": ${feedback}`;
      const sessionId = currentExploration.id;
      const existingVariants = currentExploration.variants;

      setSelectedVariantId(null);

      try {
        await runGeneration(
          sessionId,
          existingVariants,
          batchId,
          batchPrompt,
          explorations,
          {
            prompt: feedback,
            designMd,
            variantCount: 1,
            projectId,
            baseCode: variant.code,
          },
          1,
        );
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        const message = err instanceof Error ? err.message : "Generation failed";
        setGenerationError(friendlyError({ error: message }));
      } finally {
        setIsGenerating(false);
        abortRef.current = null;
      }
    },
    [isGenerating, currentExploration, projectId, designMd, explorations, runGeneration]
  );

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

  // Calculate skeleton count for the current streaming batch
  const skeletonCount = isGenerating && streamingBatchRef.current
    ? Math.max(0, pendingBatchCountRef.current - variants.filter((v) => v.batchId === streamingBatchRef.current).length)
    : 0;

  const gridClassName = "grid grid-cols-2 gap-4";

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
                {e.prompt ? (e.prompt.length > 40 ? e.prompt.slice(0, 40) + "…" : e.prompt) : "New exploration"}
              </button>
            ))}
            <button
              onClick={handleNewExploration}
              disabled={isGenerating}
              className="shrink-0 flex items-center justify-center size-6 rounded-md text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] disabled:opacity-30 transition-colors"
              title="New exploration"
            >
              <Plus size={13} />
            </button>
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
          {explorations.length > 1 && (
            <button
              onClick={handleClearAllExplorations}
              disabled={isGenerating}
              className="shrink-0 rounded px-1.5 py-1 text-[10px] text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 disabled:opacity-30 transition-colors"
              title="Clear all explorations"
            >
              Clear all
            </button>
          )}
          <span className="shrink-0 text-[10px] text-[var(--text-muted)] tabular-nums">
            {explorationIndex + 1}/{explorations.length}
          </span>
        </div>
      )}

      {/* Canvas area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
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
            {/* Grouped variant batches */}
            {batches.map((batch, batchIdx) => (
              <div key={batch.batchId}>
                {/* Batch separator */}
                {batchIdx === 0 && batch.prompt && !currentExploration?.referenceImage && (
                  <div className="flex items-center gap-3 pb-3">
                    <div className="h-px flex-1 bg-[var(--studio-border)]" />
                    <button
                      onClick={() => setExpandedBatchId(expandedBatchId === batch.batchId ? null : batch.batchId)}
                      className={`shrink-0 text-[11px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors text-center ${
                        expandedBatchId === batch.batchId ? "max-w-md" : "max-w-[300px] truncate"
                      }`}
                    >
                      {batch.prompt}
                    </button>
                    <div className="h-px flex-1 bg-[var(--studio-border)]" />
                  </div>
                )}
                {batchIdx > 0 && (
                  <div className="flex items-center gap-3 py-3">
                    <div className="h-px flex-1 bg-[var(--studio-border)]" />
                    <button
                      onClick={() => setExpandedBatchId(expandedBatchId === batch.batchId ? null : batch.batchId)}
                      className={`shrink-0 text-[11px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors text-center ${
                        expandedBatchId === batch.batchId ? "max-w-md" : "max-w-[300px] truncate"
                      }`}
                    >
                      {batch.prompt}
                    </button>
                    <div className="h-px flex-1 bg-[var(--studio-border)]" />
                  </div>
                )}
                <div className={gridClassName}>
                  {batch.variants.map((variant) => (
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
                      onRegenerate={(feedback) => {
                        if (feedback) {
                          handleRefineVariant(variant, feedback);
                        } else {
                          handleRegenerate();
                        }
                      }}
                      onResponsive={() => setResponsiveVariant(variant)}
                      onPromoteToLibrary={() => setPromoteVariant(variant)}
                    />
                  ))}
                </div>
              </div>
            ))}

            {/* Skeleton loaders for in-progress batch */}
            {skeletonCount > 0 && (
              <>
                {batches.length > 0 && (
                  <div className="flex items-center gap-3 py-3">
                    <div className="h-px flex-1 bg-[var(--studio-border)]" />
                    <span className="shrink-0 text-[11px] text-[var(--text-muted)] animate-pulse">
                      Generating…
                    </span>
                    <div className="h-px flex-1 bg-[var(--studio-border)]" />
                  </div>
                )}
                <div className={gridClassName}>
                  {Array.from({ length: skeletonCount }).map((_, i) => (
                    <div key={`skeleton-${i}`} className="rounded-xl border-2 border-dashed border-white/20 bg-white/[0.04] p-4 flex flex-col items-center justify-center">
                      <div className="aspect-[4/3] w-full flex flex-col items-center justify-center gap-3">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
                        <p className="text-xs text-[var(--text-muted)] animate-pulse">
                          Generating variant…
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {isGenerating && variants.length > 0 && (
              <div className="flex items-center gap-2 rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] px-4 py-2.5">
                <span className="text-xs text-[var(--text-muted)]">Images will generate after all variants complete.</span>
              </div>
            )}

            {isProcessingImages && (
              <div className="flex items-center gap-2 rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] px-4 py-2.5">
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[var(--studio-border-strong)] border-t-[var(--studio-accent)]" />
                <span className="text-xs text-[var(--text-secondary)]">Generating images — this may take a moment...</span>
              </div>
            )}

            {imageNotice && !isProcessingImages && (
              <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2.5">
                <span className="text-xs text-amber-400">{imageNotice}</span>
                <button
                  onClick={() => setImageNotice(null)}
                  className="ml-auto text-amber-400/60 hover:text-amber-400 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            )}
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
        currentPrompt={currentExploration?.prompt}
        initialImage={initialImage}
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

    </div>
  );
}
