"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { Sparkles, X, ChevronLeft, ChevronRight, Plus, Copy, KeyRound } from "lucide-react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ExplorerToolbar } from "./ExplorerToolbar";
import { VariantCard } from "./VariantCard";
import { FigmaPushModal } from "./FigmaPushModal";
import { PaperPushModal } from "./PaperPushModal";
import { FigmaImportModal } from "./FigmaImportModal";
import { ResponsivePreview } from "./ResponsivePreview";
import { ComparisonView } from "./ComparisonView";
import { PromoteToLibraryModal } from "./PromoteToLibraryModal";
import { parseVariants, countCompleteVariants } from "@/lib/explore/parse-variants";
import { friendlyError } from "@/lib/explore/friendly-error";
import { applyChangesToLayoutMd } from "@/lib/figma/diff";
import { getStoredApiKey, useKeyStatus, dismissKeyLoss } from "@/lib/hooks/use-api-key";
import { processCodeImages } from "@/lib/image/process-code-images";
import { injectPlaceholderSvgs } from "@/lib/image/placeholder";
import { copyToClipboard } from "@/lib/util/copy-to-clipboard";
import { toast } from "sonner";
import { calculateHealthScore } from "@/lib/health/score";
import { useOnboardingStore } from "@/lib/store/onboarding";
import { getStoredGoogleApiKey } from "@/lib/hooks/use-api-key";
import { DEFAULT_EXPLORE_MODEL, AI_MODELS, BYOK_ONLY_MODELS } from "@/lib/types";
import { parseTokensFromLayoutMd } from "@/lib/tokens/parse-layout-md";
import { buildCssTokenBlock } from "@/lib/explore/preview-helpers";
import { useProjectStore } from "@/lib/store/project";
import { useOrgStore } from "@/lib/store/organization";
import type { ExplorationSession, DesignVariant, FigmaChange, ContextFile, AiModelId, ExtractedToken, FontDeclaration, UploadedFont, ComparisonResult, ScannedComponent } from "@/lib/types";

// Build component context string from scanned + saved components
function buildComponentContext(
  scannedComponents: ScannedComponent[] | undefined,
  savedComponents: Array<{ name: string; description: string | null; code: string }> | undefined
): string {
  const sections: string[] = [];

  if (scannedComponents && scannedComponents.length > 0) {
    const lines = scannedComponents
      .slice(0, 50)
      .map((c) => {
        const propsStr = c.props.length > 0 ? ` props: ${c.props.join(", ")}` : "";
        const importPath = c.importPath.startsWith("src/") ? "@/" + c.importPath.slice(4) : c.importPath;
        return `- ${c.name} (import from '${importPath}')${propsStr}`;
      });
    sections.push(`### From Codebase\n${lines.join("\n")}`);
  }

  if (savedComponents && savedComponents.length > 0) {
    const lines = savedComponents
      .slice(0, 20)
      .map((c) => `- ${c.name}${c.description ? `: ${c.description}` : ""}`);
    sections.push(`### From Saved Library\n${lines.join("\n")}`);
  }

  if (sections.length === 0) return "";

  return `\n\n## Existing Components (REUSE these, do NOT recreate)\n\n${sections.join("\n\n")}\n\nWhen building UI, import existing components instead of generating new ones. Use the exact import paths shown above.`;
}

interface ExplorerCanvasProps {
  projectId: string;
  layoutMd: string;
  explorations: ExplorationSession[];
  onUpdateExplorations: (explorations: ExplorationSession[]) => void;
  onPushToFigma: (variant: DesignVariant) => void;
  onLayoutMdUpdate?: (newMd: string) => void;
  initialImage?: string;
  initialContextFiles?: ContextFile[];
  onInitialImageConsumed?: () => void;
  extractedFonts?: string[];
  extractedFontDeclarations?: FontDeclaration[];
  uploadedFonts?: UploadedFont[];
  iconPacks?: string[];
  sourceUrl?: string;
}

export function ExplorerCanvas({
  projectId,
  layoutMd,
  explorations,
  onUpdateExplorations,
  onPushToFigma: _onPushToFigma,
  onLayoutMdUpdate,
  initialImage,
  initialContextFiles,
  onInitialImageConsumed,
  extractedFonts = [],
  extractedFontDeclarations,
  uploadedFonts,
  iconPacks,
  sourceUrl,
}: ExplorerCanvasProps) {
  // Scanned codebase components from the project store
  const scannedComponents = useProjectStore(
    (s) => s.projects.find((p) => p.id === projectId)?.scannedComponents
  );

  // Saved library components for the Explorer prompt
  const orgId = useOrgStore((s) => s.currentOrgId);
  const [savedLibraryComponents, setSavedLibraryComponents] = useState<
    Array<{ name: string; description: string | null; code: string }>
  >([]);
  useEffect(() => {
    if (!orgId) return;
    fetch(`/api/organizations/${orgId}/components`)
      .then((r) => (r.ok ? r.json() : []))
      .then((comps: Array<{ name: string; description: string | null; code: string; status: string }>) => {
        setSavedLibraryComponents(
          comps.filter((c) => c.status === "approved").map((c) => ({ name: c.name, description: c.description, code: c.code }))
        );
      })
      .catch(() => {});
  }, [orgId]);

  // Parse design tokens from layoutMd for the inspector's token suggestions
  const allDesignTokens: ExtractedToken[] = useMemo(() => {
    if (!layoutMd) return [];
    const parsed = parseTokensFromLayoutMd(layoutMd);
    return [...parsed.colors, ...parsed.typography, ...parsed.spacing, ...parsed.radius, ...parsed.effects];
  }, [layoutMd]);

  // Build CSS :root block from extraction data so preview iframes resolve var(--token) refs
  const extractionData = useProjectStore(
    (s) => s.projects.find((p) => p.id === projectId)?.extractionData
  );
  const cssTokenBlock = useMemo(
    () => buildCssTokenBlock(extractionData?.cssVariables, extractionData?.tokens),
    [extractionData?.cssVariables, extractionData?.tokens]
  );

  const [modelId, setModelId] = useState<AiModelId>(DEFAULT_EXPLORE_MODEL);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isProcessingImages, setIsProcessingImages] = useState(false);
  const [imageProgress, setImageProgress] = useState<{ completed: number; total: number } | null>(null);
  const imageAbortMapRef = useRef<Map<string, AbortController>>(new Map());
  const [imageNotice, setImageNotice] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generationStatus, setGenerationStatus] = useState<string | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [pushVariant, setPushVariant] = useState<DesignVariant | null>(null);
  const [paperPushVariant, setPaperPushVariant] = useState<DesignVariant | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [responsiveVariant, setResponsiveVariant] = useState<DesignVariant | null>(null);
  const [promoteVariant, setPromoteVariant] = useState<DesignVariant | null>(null);
  const [compareData, setCompareData] = useState<{ prompt: string; image?: string; contextFiles?: ContextFile[]; baseCode?: string } | null>(null);
  const [viewSavedComparison, setViewSavedComparison] = useState<import("@/lib/types").ComparisonResult | null>(null);
  const [expandedBatchId, setExpandedBatchId] = useState<string | null>(null);
  const [activeExplorationIndex, setActiveExplorationIndex] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const clearGeneratingRef = useRef<((sessionId: string) => void) | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const streamingBatchRef = useRef<string | null>(null);
  const pendingBatchCountRef = useRef(0);
  const generatingSessionRef = useRef<string | null>(null);

  const { steps, markStep } = useOnboardingStore();
  const stepsRef = useRef(steps);
  stepsRef.current = steps;

  // Keep clearGeneratingRef up to date with latest explorations/onUpdateExplorations
  clearGeneratingRef.current = (sessionId: string) => {
    const cleared = explorations.map((e) =>
      e.id === sessionId ? { ...e, generatingBatchId: undefined, generatingBatchExpected: undefined } : e
    );
    onUpdateExplorations(cleared);
  };

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

      // Detect errors embedded in the stream (e.g. from Gemini)
      if (finalNew.length === 0) {
        const errorMatch = fullOutput.match(/\[Error:\s*(.+?)\]/);
        if (errorMatch) {
          throw new Error(errorMatch[1]);
        }
        if (fullOutput.trim().length > 0) {
          throw new Error("Generation completed but no variants were produced. The model may have hit a content or token limit. Try a simpler prompt.");
        }
      }

      const finalMerged = [...existingVariants, ...finalNew];
      const finalExplorations = updatedExplorations.map((e) =>
        e.id === sessionId ? { ...e, variants: finalMerged } : e
      );
      onUpdateExplorations(finalExplorations);

      // Mark onboarding step on first live generation
      if (!stepsRef.current.generatedVariant && finalNew.length > 0) {
        markStep("generatedVariant");
      }

      // Inject placeholder SVGs instead of auto-generating images.
      // Users can generate images later via Inspector, smart regenerate, or bulk generate.
      let totalPlaceholders = 0;
      const withPlaceholders = finalNew.map((v) => {
        const { code: placeholderCode, count } = injectPlaceholderSvgs(v.code);
        totalPlaceholders += count;
        return count > 0 ? { ...v, code: placeholderCode } : v;
      });

      if (totalPlaceholders > 0) {
        const placeholderMerged = [...existingVariants, ...withPlaceholders];
        const placeholderExplorations = finalExplorations.map((e) =>
          e.id === sessionId ? { ...e, variants: placeholderMerged } : e
        );
        onUpdateExplorations(placeholderExplorations);
        setImageNotice(`${totalPlaceholders} image(s) ready to generate. Use "Generate images" on each variant or click images in Inspector.`);
      }

      // Compute health scores for newly generated variants
      const variantsToScore = totalPlaceholders > 0 ? withPlaceholders : finalNew;
      const scored = variantsToScore.map((v) => ({
        ...v,
        healthScore: calculateHealthScore(v.code, extractedFonts, layoutMd),
      }));
      const scoredMerged = [...existingVariants, ...scored];
      // Clear generation tracking atomically with the final variant update
      // to avoid a race where clearGeneratingRef overwrites variants with stale state.
      const scoredExplorations = finalExplorations.map((e) =>
        e.id === sessionId
          ? { ...e, variants: scoredMerged, generatingBatchId: undefined, generatingBatchExpected: undefined }
          : e
      );
      onUpdateExplorations(scoredExplorations);
      streamingBatchRef.current = null;
      pendingBatchCountRef.current = 0;
    },
    [onUpdateExplorations, extractedFonts, layoutMd, markStep]
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
      const googleKey = getStoredGoogleApiKey();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (apiKey) headers["X-Api-Key"] = apiKey;
      if (googleKey) headers["X-Google-Api-Key"] = googleKey;

      const res = await fetch("/api/generate/explore", {
        method: "POST",
        headers,
        body: JSON.stringify({ ...fetchBody, modelId }),
        signal: abortRef.current!.signal,
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(friendlyError(errBody));
      }

      await streamVariants(res, sessionId, latestExplorations, existingVariants, batchId, batchPrompt);
    },
    [streamVariants, modelId]
  );

  /** Detect URLs in prompt, fetch their content server-side, and merge into contextFiles */
  const fetchUrlsFromPrompt = useCallback(
    async (
      prompt: string,
      existingContextFiles?: ContextFile[],
    ): Promise<{ prompt: string; contextFiles: ContextFile[] | undefined }> => {
      const urlMatches = prompt.match(/https?:\/\/[^\s)]+/g);
      if (!urlMatches || urlMatches.length === 0) {
        return { prompt, contextFiles: existingContextFiles };
      }

      const urls = urlMatches.slice(0, 2); // Max 2 URLs
      setGenerationStatus("Fetching reference sites…");

      const fetched: ContextFile[] = [];
      let updatedPrompt = prompt;

      await Promise.all(
        urls.map(async (url) => {
          try {
            const res = await fetch("/api/fetch-url", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ url }),
            });
            if (!res.ok) return;
            const data = (await res.json()) as { name: string; content: string };
            fetched.push({ name: data.name, content: data.content });
            const hostname = new URL(url).hostname.replace("www.", "");
            updatedPrompt = updatedPrompt.replace(url, `[see context: ${hostname}]`);
          } catch {
            // Silently skip failed URL fetches
          }
        })
      );

      setGenerationStatus(null);

      const merged = [...(existingContextFiles ?? []), ...fetched].slice(0, 3); // API max 3
      return {
        prompt: updatedPrompt,
        contextFiles: merged.length > 0 ? merged : existingContextFiles,
      };
    },
    []
  );

  const handleGenerate = useCallback(
    async (prompt: string, variantCount: number, imageDataUrl?: string, contextFiles?: ContextFile[]) => {
      if (isGenerating) return;

      // Pre-flight key check: catch missing keys before hitting the API
      const model = AI_MODELS[modelId];
      if (model.provider === "gemini" && !getStoredGoogleApiKey()) {
        setGenerationError(`${model.label} requires a Google AI API key. Add one in Settings → API Keys.`);
        return;
      }
      if (BYOK_ONLY_MODELS.has(modelId) && model.provider !== "gemini" && !getStoredApiKey()) {
        setGenerationError(`${model.label} requires an Anthropic API key. Add one in Settings → API Keys.`);
        return;
      }

      setIsGenerating(true);
      setGenerationError(null);
      setSelectedVariantId(null);
      abortRef.current = new AbortController();

      // Fetch any URLs in the prompt before generation
      const { prompt: resolvedPrompt, contextFiles: resolvedContextFiles } =
        await fetchUrlsFromPrompt(prompt, contextFiles);

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
            ? { ...e, ...(e.prompt === "" && { prompt }), variantCount, generatingBatchId: batchId, generatingBatchExpected: variantCount }
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
          contextFiles: resolvedContextFiles,
          createdAt: new Date().toISOString(),
          generatingBatchId: batchId,
          generatingBatchExpected: variantCount,
        };
        updatedExplorations = [...explorations, newExploration];
        onUpdateExplorations(updatedExplorations);
        setActiveExplorationIndex(updatedExplorations.length - 1);
      }

      generatingSessionRef.current = sessionId;
      const componentContext = buildComponentContext(scannedComponents, savedLibraryComponents);
      const enrichedLayoutMd = (layoutMd ?? "") + componentContext;
      try {
        await runGeneration(
          sessionId,
          existingVariants,
          batchId,
          batchPrompt,
          updatedExplorations,
          { prompt: resolvedPrompt, layoutMd: enrichedLayoutMd, variantCount, projectId, imageDataUrl, contextFiles: resolvedContextFiles, iconPacks },
          variantCount,
        );
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
        setGenerationError(message);
        // Only clear generation tracking on error — successful completion
        // clears it atomically inside streamVariants to avoid stale-state overwrite.
        clearGeneratingRef.current?.(sessionId);
      } finally {
        setIsGenerating(false);
        setGenerationStatus(null);
        abortRef.current = null;
        generatingSessionRef.current = null;
      }
    },
    [isGenerating, projectId, layoutMd, modelId, explorations, currentExploration, onUpdateExplorations, runGeneration, fetchUrlsFromPrompt, scannedComponents, savedLibraryComponents]
  );

  const handleRefine = useCallback(
    async (refinementPrompt: string, variantCount: number, imageDataUrl?: string, contextFiles?: ContextFile[]) => {
      if (isGenerating || !selectedVariant || !currentExploration) return;

      setIsGenerating(true);
      setGenerationError(null);
      abortRef.current = new AbortController();

      // Fetch any URLs in the refinement prompt
      const { prompt: resolvedPrompt, contextFiles: resolvedContextFiles } =
        await fetchUrlsFromPrompt(refinementPrompt, contextFiles);

      const batchId = crypto.randomUUID();
      const batchPrompt = `Refine "${selectedVariant.name}": ${refinementPrompt}`;
      const sessionId = currentExploration.id;
      const existingVariants = currentExploration.variants;

      // Persist generation tracking
      const withTracking = explorations.map((e) =>
        e.id === sessionId ? { ...e, generatingBatchId: batchId, generatingBatchExpected: variantCount } : e
      );
      onUpdateExplorations(withTracking);

      setSelectedVariantId(null);
      generatingSessionRef.current = sessionId;

      const refineComponentContext = buildComponentContext(scannedComponents, savedLibraryComponents);
      const refineEnrichedLayoutMd = (layoutMd ?? "") + refineComponentContext;
      try {
        await runGeneration(
          sessionId,
          existingVariants,
          batchId,
          batchPrompt,
          withTracking,
          {
            prompt: resolvedPrompt,
            layoutMd: refineEnrichedLayoutMd,
            variantCount,
            projectId,
            baseCode: selectedVariant.code,
            imageDataUrl,
            contextFiles: resolvedContextFiles,
            iconPacks,
          },
          variantCount,
        );
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
        setGenerationError(message);
        clearGeneratingRef.current?.(sessionId);
      } finally {
        setIsGenerating(false);
        setGenerationStatus(null);
        abortRef.current = null;
        generatingSessionRef.current = null;
      }
    },
    [isGenerating, selectedVariant, currentExploration, projectId, layoutMd, explorations, runGeneration, fetchUrlsFromPrompt, scannedComponents, savedLibraryComponents]
  );

  const handleRegenerate = useCallback(() => {
    if (!currentExploration) return;
    handleGenerate(currentExploration.prompt, currentExploration.variantCount);
  }, [currentExploration, handleGenerate]);

  // Create a new exploration tab when push-to-canvas screenshot arrives
  const pushTabCreated = useRef(false);
  useEffect(() => {
    if (initialImage && !pushTabCreated.current) {
      pushTabCreated.current = true;
      const sessionId = crypto.randomUUID();
      const newExploration: ExplorationSession = {
        id: sessionId,
        projectId,
        prompt: "",
        variantCount: 0,
        variants: [],
        referenceImage: initialImage,
        contextFiles: initialContextFiles,
        createdAt: new Date().toISOString(),
      };
      const updated = [...explorations, newExploration];
      onUpdateExplorations(updated);
      setActiveExplorationIndex(updated.length - 1);
      setSelectedVariantId(null);
      onInitialImageConsumed?.();
    }
  }, [initialImage]);

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

      const variantComponentContext = buildComponentContext(scannedComponents, savedLibraryComponents);
      const variantEnrichedLayoutMd = (layoutMd ?? "") + variantComponentContext;

      try {
        await runGeneration(
          sessionId,
          existingVariants,
          batchId,
          batchPrompt,
          explorations,
          {
            prompt: feedback,
            layoutMd: variantEnrichedLayoutMd,
            variantCount: 1,
            projectId,
            baseCode: variant.code,
            iconPacks,
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
    [isGenerating, currentExploration, projectId, layoutMd, explorations, runGeneration, scannedComponents, savedLibraryComponents]
  );

  const handleRateVariant = useCallback(
    (variantId: string, rating: "up" | "down") => {
      if (!currentExploration) return;
      const variant = currentExploration.variants.find((v) => v.id === variantId);
      const isToggleOff = variant?.rating === rating;
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

      // Log rating (only when setting, not when toggling off)
      if (!isToggleOff) {
        void fetch("/api/log/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            variantId,
            variantName: variant?.name,
            rating,
            prompt: variant?.batchPrompt,
          }),
        });
      }
    },
    [currentExploration, explorations, onUpdateExplorations]
  );

  const handleDeleteVariant = useCallback(
    (variantId: string) => {
      if (!currentExploration) return;
      const updated = explorations.map((e) =>
        e.id === currentExploration.id
          ? { ...e, variants: e.variants.filter((v) => v.id !== variantId) }
          : e
      );
      onUpdateExplorations(updated);
      if (selectedVariantId === variantId) setSelectedVariantId(null);
    },
    [currentExploration, explorations, onUpdateExplorations, selectedVariantId]
  );

  const handleCodeUpdate = useCallback(
    (variantId: string, code: string, editHistory: import("@/lib/types").EditHistory) => {
      if (!currentExploration) return;
      const updated = explorations.map((e) =>
        e.id === currentExploration.id
          ? {
              ...e,
              variants: e.variants.map((v) =>
                v.id === variantId ? { ...v, code, editHistory } : v
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

  const handlePushToPaper = useCallback((variant: DesignVariant) => {
    setPaperPushVariant(variant);
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

  const handleUpdateLayoutMdFromImport = useCallback(
    (acceptedChanges: FigmaChange[]) => {
      if (!onLayoutMdUpdate) return;
      const updated = applyChangesToLayoutMd(layoutMd, acceptedChanges);
      onLayoutMdUpdate(updated);
    },
    [layoutMd, onLayoutMdUpdate]
  );

  const handleRegenerateImages = useCallback(
    async (variantId: string, forceAll?: boolean) => {
      if (!currentExploration) return;
      const variant = currentExploration.variants.find((v) => v.id === variantId);
      if (!variant) return;

      // Check for Google AI key before attempting API call
      if (!getStoredGoogleApiKey()) {
        toast.error("Add a Google AI API key in Settings → API Keys to generate images.");
        return;
      }

      // Cancel any in-progress image generation for THIS variant only
      imageAbortMapRef.current.get(variantId)?.abort();
      const controller = new AbortController();
      imageAbortMapRef.current.set(variantId, controller);

      setIsProcessingImages(true);
      setImageProgress(null);
      setImageNotice(null);
      try {
        // Default: generate only missing images. Shift+click: regenerate all.
        const result = await processCodeImages(variant.code, {
          forceRegenerate: forceAll === true,
          signal: controller.signal,
          onProgress: (completed, total) => {
            setImageProgress({ completed, total });
          },
        });

        if (controller.signal.aborted) return;

        if (result.skippedNoKey && result.placeholderCount > 0) {
          setImageNotice(`${result.placeholderCount} image(s) skipped — add a Google AI API key in Settings to enable image generation.`);
        } else if (result.failedCount > 0) {
          setImageNotice(`${result.failedCount} of ${result.placeholderCount} image(s) failed to generate.`);
        } else if (result.placeholderCount === 0) {
          setImageNotice("This variant doesn't contain any images. Refine it and ask for photos or illustrations.");
        } else {
          toast.success(`${result.placeholderCount} image(s) generated successfully.`);
        }

        if (result.code !== variant.code) {
          const updated = explorations.map((e) =>
            e.id === currentExploration.id
              ? { ...e, variants: e.variants.map((v) => v.id === variantId ? { ...v, code: result.code } : v) }
              : e
          );
          onUpdateExplorations(updated);
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") console.error("Image generation error:", err);
      } finally {
        imageAbortMapRef.current.delete(variantId);
        setIsProcessingImages(imageAbortMapRef.current.size > 0);
        if (imageAbortMapRef.current.size === 0) setImageProgress(null);
      }
    },
    [currentExploration, explorations, onUpdateExplorations]
  );

  const handleCancelImages = useCallback(() => {
    imageAbortMapRef.current.forEach((c) => c.abort());
    imageAbortMapRef.current.clear();
    setIsProcessingImages(false);
    setImageProgress(null);
    setImageNotice("Image generation stopped. Use 'Generate images' on any variant to continue.");
  }, []);

  const handleRemoveReferenceImage = useCallback(() => {
    if (!currentExploration) return;
    const updated = explorations.map((e) =>
      e.id === currentExploration.id ? { ...e, referenceImage: undefined } : e
    );
    onUpdateExplorations(updated);
  }, [explorations, currentExploration, onUpdateExplorations]);

  const copyImageToClipboard = useCallback(async (dataUrl: string) => {
    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob }),
      ]);
    } catch {
      // Fallback: copy the data URL as text
      await copyToClipboard(dataUrl);
    }
  }, []);

  // Is the CURRENT tab the one that's generating?
  const isGeneratingThisTab = isGenerating && generatingSessionRef.current === currentExploration?.id;

  // Calculate skeleton count for the current streaming batch
  const skeletonCount = isGeneratingThisTab && streamingBatchRef.current
    ? Math.max(0, pendingBatchCountRef.current - variants.filter((v) => v.batchId === streamingBatchRef.current).length)
    : 0;

  // Show skeletons for in-progress generation even after remount (user navigated away and back)
  const pendingBatch = !isGenerating && currentExploration?.generatingBatchId
    ? {
        batchId: currentExploration.generatingBatchId,
        expected: currentExploration.generatingBatchExpected ?? 0,
        received: variants.filter((v) => v.batchId === currentExploration.generatingBatchId).length,
      }
    : null;
  const pendingSkeletonCount = pendingBatch
    ? Math.max(0, pendingBatch.expected - pendingBatch.received)
    : 0;

  const keyStatus = useKeyStatus();
  const { hasAnthropicKey, hasGoogleKey, hasLostKeys, lostKeys } = keyStatus;

  const params = useParams();
  const orgSlug = (params?.org as string) ?? "";

  const handleComparisonSave = useCallback((result: ComparisonResult) => {
    if (!currentExploration) return;
    // Tag to selected variant, or fall back to first variant in the exploration
    const variantId = selectedVariantId ?? currentExploration.variants?.[0]?.id;
    const taggedResult = { ...result, sourceVariantId: variantId };
    const updated = explorations.map((e) =>
      e.id === currentExploration.id
        ? { ...e, comparisons: [...(e.comparisons ?? []), taggedResult] }
        : e
    );
    onUpdateExplorations(updated);
  }, [currentExploration, selectedVariantId, explorations, onUpdateExplorations]);

  const gridClassName = "grid grid-cols-2 gap-4";

  return (
    <div className="flex h-full flex-col">
      {/* Error banner */}
      {generationError && (
        <div className="mx-4 mt-4 flex items-start gap-2.5 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3">
          <p className="flex-1 text-xs text-red-300">
            {generationError}
            {generationError.includes("API key") && orgSlug && (
              <>
                {" "}
                <Link
                  href={`/${orgSlug}/settings/api-keys`}
                  className="underline text-red-200 hover:text-red-100"
                >
                  Open API Keys settings
                </Link>
              </>
            )}
          </p>
          <button
            onClick={() => setGenerationError(null)}
            className="shrink-0 text-red-400 hover:text-red-300 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Key-loss warning banner */}
      {hasLostKeys && (
        <div className="mx-4 mt-4 flex items-start gap-2.5 rounded-lg border border-[var(--status-warning)]/20 bg-[var(--status-warning)]/10 px-4 py-3">
          <KeyRound size={14} className="mt-0.5 shrink-0 text-[var(--status-warning)]" />
          <p className="flex-1 text-xs text-[var(--status-warning)]">
            Your {lostKeys.map((k) => k.charAt(0).toUpperCase() + k.slice(1)).join(" and ")} API {lostKeys.length === 1 ? "key is" : "keys are"} no longer available.
            This can happen when switching browser windows or profiles.
            {orgSlug && (
              <>
                {" "}
                <Link
                  href={`/${orgSlug}/settings/api-keys`}
                  className="underline text-[var(--status-warning)] hover:text-[var(--status-warning)]"
                >
                  Re-add them in Settings
                </Link>
              </>
            )}
          </p>
          <button
            onClick={dismissKeyLoss}
            className="shrink-0 text-[var(--status-warning)] hover:text-[var(--status-warning)] transition-colors"
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
                onClick={() => {
                  setActiveExplorationIndex(i);
                  setSelectedVariantId(null);
                }}
                className={`group shrink-0 max-w-[200px] flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] transition-colors ${
                  i === explorationIndex
                    ? "bg-[var(--studio-accent-subtle)] text-[var(--text-primary)] font-medium"
                    : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                }`}
              >
                <span className="truncate">
                  {e.prompt ? (e.prompt.length > 40 ? e.prompt.slice(0, 40) + "…" : e.prompt) : "New exploration"}
                </span>
                <span
                  role="button"
                  tabIndex={-1}
                  onClick={(ev) => { ev.stopPropagation(); handleDeleteExploration(i); }}
                  className={`shrink-0 rounded p-0.5 transition-colors hover:text-red-400 hover:bg-red-500/10 ${
                    i === explorationIndex
                      ? "text-[var(--text-muted)]"
                      : "text-transparent group-hover:text-[var(--text-muted)]"
                  }`}
                >
                  <X size={10} />
                </span>
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
            onClick={handleNewExploration}
            disabled={isGenerating}
            className="shrink-0 flex items-center justify-center size-7 rounded-md bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:bg-[var(--studio-accent)] hover:text-[var(--text-on-accent)] disabled:opacity-30 transition-colors"
            title="New exploration"
          >
            <Plus size={14} />
          </button>
          <span className="shrink-0 text-[10px] text-[var(--text-muted)] tabular-nums">
            {explorationIndex + 1}/{explorations.length}
          </span>
        </div>
      )}

      {/* Canvas area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto bg-[var(--bg-canvas)] p-4">
        {variants.length === 0 && !isGenerating && !currentExploration?.referenceImage && pendingSkeletonCount === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <div className="rounded-xl bg-[var(--bg-surface)] p-4">
              <Sparkles size={24} className="text-[var(--text-muted)]" />
            </div>
            <div>
              <h3 className="mb-1 text-sm font-semibold text-[var(--text-primary)]">
                Explorer
              </h3>
              <p className="max-w-xs text-xs text-[var(--text-secondary)]">
                Describe what to explore. Layout will generate
                multiple design variations using your design system.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Reference image card — VariantCard-style scrollable card */}
            {currentExploration?.referenceImage && (
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-[var(--studio-border)] bg-[var(--bg-surface)]">
                  <div className="relative aspect-[4/3] overflow-y-auto rounded-t-xl bg-white">
                    <img
                      src={currentExploration.referenceImage}
                      alt="Reference"
                      className="w-full object-contain"
                    />
                  </div>
                  <div className="flex items-center justify-between p-3">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">Reference image</p>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); void copyImageToClipboard(currentExploration.referenceImage!); }}
                        title="Copy image to clipboard"
                        className="rounded p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                      >
                        <Copy size={14} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRemoveReferenceImage(); }}
                        title="Remove reference"
                        className="rounded p-1 text-[var(--text-muted)] hover:text-red-400 hover:bg-[var(--bg-hover)] transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
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
                    <button
                      onClick={() => copyToClipboard(batch.prompt)}
                      className="shrink-0 rounded p-0.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                      title="Copy prompt"
                    >
                      <Copy size={10} />
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
                    <button
                      onClick={() => copyToClipboard(batch.prompt)}
                      className="shrink-0 rounded p-0.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                      title="Copy prompt"
                    >
                      <Copy size={10} />
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
                      onPushToPaper={() => handlePushToPaper(variant)}
                      onRegenerate={(feedback) => {
                        if (feedback) {
                          handleRefineVariant(variant, feedback);
                        } else {
                          handleRegenerate();
                        }
                      }}
                      onResponsive={() => setResponsiveVariant(variant)}
                      onPromoteToLibrary={() => setPromoteVariant(variant)}
                      onRegenerateImages={(forceAll) => handleRegenerateImages(variant.id, forceAll)}
                      onDelete={() => handleDeleteVariant(variant.id)}
                      onCodeUpdate={(code, editHistory) => handleCodeUpdate(variant.id, code, editHistory)}
                      layoutMd={layoutMd}
                      designTokens={allDesignTokens}
                      cssTokenBlock={cssTokenBlock}
                      iconPacks={iconPacks}
                      fonts={extractedFontDeclarations}
                      uploadedFonts={uploadedFonts}
                      isProcessingImages={isProcessingImages}
                      onViewComparison={() => {
                        const comparisons = currentExploration?.comparisons?.filter(
                          (c) => c.sourceVariantId === variant.id || !c.sourceVariantId
                        );
                        if (comparisons?.length) setViewSavedComparison(comparisons[comparisons.length - 1]);
                      }}
                      comparisonCount={currentExploration?.comparisons?.filter(
                        (c) => c.sourceVariantId === variant.id || !c.sourceVariantId
                      ).length ?? 0}
                      isNewlyGenerated={variant.batchId === streamingBatchRef.current}
                    />
                  ))}
                  {/* Shimmer skeletons for remaining slots — inline so cards stay in place */}
                  {(() => {
                    // Active generation: show skeletons for slots not yet filled
                    const activeCount = isGeneratingThisTab && batch.batchId === streamingBatchRef.current ? skeletonCount : 0;
                    // Remount case: show skeletons for the pending batch after navigating away and back
                    const pendingCount = !isGeneratingThisTab && pendingBatch && batch.batchId === pendingBatch.batchId ? pendingSkeletonCount : 0;
                    const inlineCount = activeCount || pendingCount;
                    return inlineCount > 0 ? Array.from({ length: inlineCount }).map((_, i) => (
                      <div key={`skeleton-${i}`} className="rounded-xl border border-[var(--studio-border)] bg-[var(--bg-surface)] flex flex-col">
                        <div className="relative aspect-[4/3] overflow-hidden rounded-t-xl bg-white p-6">
                          <div className="flex h-full flex-col gap-3">
                            <div className="h-[35%] w-full animate-shimmer rounded-lg bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%]" />
                            <div className="h-4 w-[60%] animate-shimmer rounded bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%]" style={{ animationDelay: "100ms" }} />
                            <div className="h-3 w-[40%] animate-shimmer rounded bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%]" style={{ animationDelay: "200ms" }} />
                            <div className="mt-2 h-3 w-[90%] animate-shimmer rounded bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%]" style={{ animationDelay: "300ms" }} />
                            <div className="h-3 w-[75%] animate-shimmer rounded bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%]" style={{ animationDelay: "400ms" }} />
                          </div>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2.5">
                          <div className="h-3 w-24 animate-shimmer rounded bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%]" />
                        </div>
                      </div>
                    )) : null;
                  })()}
                </div>
              </div>
            ))}

            {/* URL fetch status */}
            {generationStatus && isGeneratingThisTab && skeletonCount === 0 && (
              <div className="flex items-center gap-2 rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] px-4 py-2.5">
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[var(--studio-border-strong)] border-t-[var(--studio-accent)]" />
                <span className="text-xs text-[var(--text-secondary)]">{generationStatus}</span>
              </div>
            )}

            {/* Shimmer skeletons when no batch variants exist yet (initial generation) */}
            {isGeneratingThisTab && skeletonCount > 0 && !batches.some((b) => b.batchId === streamingBatchRef.current) && (
              <>
                {batches.length > 0 && (
                  <div className="flex items-center gap-3 py-3">
                    <div className="h-px flex-1 bg-[var(--studio-border)]" />
                    <span className="shrink-0 text-[11px] text-[var(--text-muted)] animate-pulse">
                      {generationStatus ?? "Generating…"}
                    </span>
                    <div className="h-px flex-1 bg-[var(--studio-border)]" />
                  </div>
                )}
                <div className={gridClassName}>
                  {Array.from({ length: skeletonCount }).map((_, i) => (
                    <div key={`skeleton-${i}`} className="rounded-xl border border-[var(--studio-border)] bg-[var(--bg-surface)] flex flex-col">
                      <div className="relative aspect-[4/3] overflow-hidden rounded-t-xl bg-white p-6">
                        <div className="flex h-full flex-col gap-3">
                          <div className="h-[35%] w-full animate-shimmer rounded-lg bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%]" />
                          <div className="h-4 w-[60%] animate-shimmer rounded bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%]" style={{ animationDelay: "100ms" }} />
                          <div className="h-3 w-[40%] animate-shimmer rounded bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%]" style={{ animationDelay: "200ms" }} />
                          <div className="mt-2 h-3 w-[90%] animate-shimmer rounded bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%]" style={{ animationDelay: "300ms" }} />
                          <div className="h-3 w-[75%] animate-shimmer rounded bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%]" style={{ animationDelay: "400ms" }} />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-2.5">
                        <div className="h-3 w-24 animate-shimmer rounded bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%]" />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Shimmer skeletons for pending generation when no batch exists yet (remount before any variant arrived) */}
            {pendingSkeletonCount > 0 && !batches.some((b) => b.batchId === pendingBatch?.batchId) && (
              <div className={gridClassName}>
                {Array.from({ length: pendingSkeletonCount }).map((_, i) => (
                  <div key={`pending-${i}`} className="rounded-xl border border-[var(--studio-border)] bg-[var(--bg-surface)] flex flex-col">
                    <div className="relative aspect-[4/3] overflow-hidden rounded-t-xl bg-white p-6">
                      <div className="flex h-full flex-col gap-3">
                        <div className="h-[35%] w-full animate-shimmer rounded-lg bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%]" />
                        <div className="h-4 w-[60%] animate-shimmer rounded bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%]" style={{ animationDelay: "100ms" }} />
                        <div className="h-3 w-[40%] animate-shimmer rounded bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%]" style={{ animationDelay: "200ms" }} />
                        <div className="mt-2 h-3 w-[90%] animate-shimmer rounded bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%]" style={{ animationDelay: "300ms" }} />
                        <div className="h-3 w-[75%] animate-shimmer rounded bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%]" style={{ animationDelay: "400ms" }} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2.5">
                      <div className="h-3 w-24 animate-shimmer rounded bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%]" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {isProcessingImages && (
              <div className="flex items-center gap-2 rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] px-4 py-2.5">
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[var(--studio-border-strong)] border-t-[var(--studio-accent)]" />
                <span className="text-xs text-[var(--text-secondary)]">
                  {imageProgress
                    ? `Generating image ${imageProgress.completed}/${imageProgress.total}...`
                    : "Generating images..."}
                </span>
                <button
                  onClick={handleCancelImages}
                  className="ml-auto text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  Stop
                </button>
              </div>
            )}

            {imageNotice && !isProcessingImages && (
              <div className="flex items-center gap-2 rounded-lg border border-[var(--status-warning)]/30 bg-[var(--status-warning)]/10 px-4 py-2.5">
                <span className="text-xs text-[var(--status-warning)]">{imageNotice}</span>
                <button
                  onClick={() => setImageNotice(null)}
                  className="ml-auto text-[var(--status-warning)]/60 hover:text-[var(--status-warning)] transition-colors"
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
        key={currentExploration?.id ?? "empty"}
        onGenerate={handleGenerate}
        onRefine={handleRefine}
        onCompare={(_toolbarPrompt, image, files) => setCompareData({
          prompt: selectedVariant?.batchPrompt || currentExploration?.prompt || _toolbarPrompt,
          image: image ?? currentExploration?.referenceImage,
          contextFiles: files,
          baseCode: selectedVariant?.code,
        })}
        onRegenerate={handleRegenerate}
        onPushToFigma={() => selectedVariant && handlePushToFigma(selectedVariant)}
        onPushToPaper={() => selectedVariant && handlePushToPaper(selectedVariant)}
        onImportFromFigma={() => setShowImport(true)}
        isGenerating={isGeneratingThisTab}
        hasVariants={variants.length > 0}
        hasSelection={!!selectedVariant}
        selectedVariantName={selectedVariant?.name}
        currentPrompt={currentExploration?.prompt}
        initialImage={initialImage}
        initialContextFiles={initialContextFiles}
        modelId={modelId}
        onModelChange={setModelId}
        hasGoogleKey={hasGoogleKey}
        hasAnthropicKey={hasAnthropicKey}
      />

      {pushVariant && (
        <FigmaPushModal
          variant={pushVariant}
          onClose={() => setPushVariant(null)}
          onPushComplete={handlePushComplete}
          defaultFigmaUrl={sourceUrl}
        />
      )}

      {paperPushVariant && (
        <PaperPushModal
          variant={paperPushVariant}
          onClose={() => setPaperPushVariant(null)}
        />
      )}

      {responsiveVariant && (
        <ResponsivePreview
          variant={responsiveVariant}
          onClose={() => setResponsiveVariant(null)}
          cssTokenBlock={cssTokenBlock}
        />
      )}

      {compareData && (
        <ComparisonView
          prompt={compareData.prompt}
          baseCode={compareData.baseCode}
          imageDataUrl={compareData.image}
          contextFiles={compareData.contextFiles}
          layoutMd={layoutMd}
          cssTokenBlock={cssTokenBlock}
          onSave={handleComparisonSave}
          onClose={() => setCompareData(null)}
          orgSlug={orgSlug}
        />
      )}
      {viewSavedComparison && (
        <ComparisonView
          prompt={viewSavedComparison.prompt}
          layoutMd={layoutMd}
          cssTokenBlock={cssTokenBlock}
          savedResult={viewSavedComparison}
          onClose={() => setViewSavedComparison(null)}
          orgSlug={orgSlug}
        />
      )}

      {showImport && (
        <FigmaImportModal
          onClose={() => setShowImport(false)}
          layoutMd={layoutMd}
          onUpdateLayoutMd={handleUpdateLayoutMdFromImport}
          projectId={projectId}
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
