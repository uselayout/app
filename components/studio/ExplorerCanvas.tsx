"use client";

import { useState, useCallback, useRef } from "react";
import { Sparkles } from "lucide-react";
import { ExplorerToolbar } from "./ExplorerToolbar";
import { VariantCard } from "./VariantCard";
import { FigmaPushModal } from "./FigmaPushModal";
import { FigmaImportModal } from "./FigmaImportModal";
import { ResponsivePreview } from "./ResponsivePreview";
import { ComparisonView } from "./ComparisonView";
import { parseVariants, countCompleteVariants } from "@/lib/explore/parse-variants";
import { friendlyError } from "@/lib/explore/friendly-error";
import { applyChangesToDesignMd } from "@/lib/figma/diff";
import { getStoredApiKey } from "@/lib/hooks/use-api-key";
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
  onPushToFigma,
  onDesignMdUpdate,
}: ExplorerCanvasProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [pushVariant, setPushVariant] = useState<DesignVariant | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [responsiveVariant, setResponsiveVariant] = useState<DesignVariant | null>(null);
  const [comparePrompt, setComparePrompt] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Current exploration is the most recent one
  const currentExploration = explorations.length > 0 ? explorations[explorations.length - 1] : null;
  const variants = currentExploration?.variants ?? [];

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
    },
    [onUpdateExplorations]
  );

  const handleGenerate = useCallback(
    async (prompt: string, variantCount: number) => {
      if (isGenerating) return;

      setIsGenerating(true);
      setSelectedVariantId(null);
      abortRef.current = new AbortController();

      const sessionId = crypto.randomUUID();
      const newExploration: ExplorationSession = {
        id: sessionId,
        projectId,
        prompt,
        variantCount,
        variants: [],
        createdAt: new Date().toISOString(),
      };

      const updatedExplorations = [...explorations, newExploration];
      onUpdateExplorations(updatedExplorations);

      try {
        const apiKey = getStoredApiKey();
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (apiKey) headers["X-Api-Key"] = apiKey;

        const res = await fetch("/api/generate/explore", {
          method: "POST",
          headers,
          body: JSON.stringify({ prompt, designMd, variantCount, projectId }),
          signal: abortRef.current.signal,
        });

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({ error: "Request failed" }));
          throw new Error(friendlyError(errBody));
        }

        await streamVariants(res, sessionId, updatedExplorations);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        console.error("Explore generation failed:", err);
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
        console.error("Refine generation failed:", err);
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
      {/* Canvas area */}
      <div className="flex-1 overflow-y-auto p-4">
        {variants.length === 0 && !isGenerating ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <div className="rounded-xl bg-[--bg-surface] p-4">
              <Sparkles size={24} className="text-[--text-muted]" />
            </div>
            <div>
              <h3 className="mb-1 text-sm font-semibold text-[--text-primary]">
                Design Explorer
              </h3>
              <p className="max-w-xs text-xs text-[--text-secondary]">
                Describe a component or page to explore. Claude will generate
                multiple design variations using your design system.
              </p>
            </div>
          </div>
        ) : (
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
              />
            ))}
            {isGenerating && variants.length < (currentExploration?.variantCount ?? 0) &&
              Array.from({ length: (currentExploration?.variantCount ?? 4) - variants.length }).map((_, i) => (
                <div key={`skeleton-${i}`} className="animate-pulse rounded-xl border border-[--studio-border] bg-[--bg-surface] p-4">
                  <div className="mb-3 h-4 w-2/3 rounded bg-[--bg-hover]" />
                  <div className="aspect-[4/3] rounded-lg bg-[--bg-hover]" />
                </div>
              ))
            }
          </div>
        )}

        {isGenerating && variants.length === 0 && (
          <div className="grid gap-4 grid-cols-2">
            {Array.from({ length: currentExploration?.variantCount ?? 4 }).map((_, i) => (
              <div key={`skeleton-${i}`} className="animate-pulse rounded-xl border border-[--studio-border] bg-[--bg-surface] p-4">
                <div className="mb-3 h-4 w-2/3 rounded bg-[--bg-hover]" />
                <div className="aspect-[4/3] rounded-lg bg-[--bg-hover]" />
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
    </div>
  );
}
