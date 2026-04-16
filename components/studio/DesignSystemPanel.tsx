"use client";

import { useRef, useCallback, useMemo, useState, useEffect } from "react";
import { X, Sparkles } from "lucide-react";
import type { ExtractionResult, ExtractedToken } from "@/lib/types";
import { useProjectStore } from "@/lib/store/project";
import { DesignSystemSection } from "./design-system/DesignSystemSection";
import { ColourPalette } from "./design-system/ColourPalette";
import { TypographyScale } from "./design-system/TypographyScale";
import { SpacingScale } from "./design-system/SpacingScale";
import { RadiusPreview } from "./design-system/RadiusPreview";
import { EffectsPreview } from "./design-system/EffectsPreview";
import { ScreenshotGallery } from "./design-system/ScreenshotGallery";
import { ComponentsView } from "./design-system/ComponentsView";
import { CuratedTokenView } from "./design-system/CuratedTokenView";
import { FontManager } from "./FontManager";
import { useOrgStore } from "@/lib/store/organization";
import { standardiseTokens, applyStandardisation } from "@/lib/tokens/standardise";
import type { StandardisedTokenMap } from "@/lib/tokens/standard-schema";
import type { ProjectStandardisation } from "@/lib/types";

const GUIDANCE_DISMISSED_KEY = "layout_ds_guidance_dismissed";

interface DesignSystemPanelProps {
  extractionData?: ExtractionResult;
  projectId: string;
  onNavigateToEditor?: () => void;
}

const SECTIONS = [
  { id: "colours", label: "Colours" },
  { id: "typography", label: "Typography" },
  { id: "spacing", label: "Spacing" },
  { id: "radius", label: "Radius" },
  { id: "effects", label: "Effects" },
  { id: "components", label: "Components" },
  { id: "screenshots", label: "Screenshots" },
] as const;

export function DesignSystemPanel({
  extractionData,
  projectId,
  onNavigateToEditor,
}: DesignSystemPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const updateToken = useProjectStore((s) => s.updateToken);
  const renameToken = useProjectStore((s) => s.renameToken);
  const removeTokens = useProjectStore((s) => s.removeTokens);
  const updateExtractionData = useProjectStore((s) => s.updateExtractionData);

  const [guidanceDismissed, setGuidanceDismissed] = useState(true);
  useEffect(() => {
    setGuidanceDismissed(localStorage.getItem(GUIDANCE_DISMISSED_KEY) === "true");
  }, []);
  const dismissGuidance = useCallback(() => {
    setGuidanceDismissed(true);
    localStorage.setItem(GUIDANCE_DISMISSED_KEY, "true");
  }, []);

  const project = useProjectStore((s) => s.projects.find((p) => p.id === projectId));
  const updateStandardisation = useProjectStore((s) => s.updateStandardisation);
  const createSnapshot = useProjectStore((s) => s.createSnapshot);
  const tokens = extractionData?.tokens;
  const screenshots = extractionData?.screenshots ?? [];
  const scannedComponents = project?.scannedComponents ?? [];
  const extractedComponents = extractionData?.components ?? [];

  // View mode: curated (standardised) vs all (raw)
  const [viewMode, setViewMode] = useState<"curated" | "all">(
    project?.standardisation ? "curated" : "all"
  );
  const [standardising, setStandardising] = useState(false);

  // Run standardisation if tokens exist but no standardisation data yet
  useEffect(() => {
    if (project?.standardisation || standardising) return;
    if (!tokens || !project?.sourceUrl) return;

    setStandardising(true);
    try {
      const tokenMap = standardiseTokens(tokens, project.sourceUrl);
      applyStandardisation(tokens, tokenMap);

      const serialisable: ProjectStandardisation = {
        kitPrefix: tokenMap.kitPrefix,
        assignments: Object.fromEntries(tokenMap.assignments),
        unassigned: tokenMap.unassigned,
        antiPatterns: tokenMap.antiPatterns,
        standardisedAt: new Date().toISOString(),
      };

      updateStandardisation(projectId, serialisable);
      setViewMode("curated");
    } catch (e) {
      console.error("[standardise] Failed:", e);
      setViewMode("all");
    } finally {
      setStandardising(false);
    }
  }, [tokens, project?.sourceUrl, project?.standardisation, standardising, projectId, updateStandardisation]);

  // Re-standardise handler (for manual refresh)
  const handleRestandardise = useCallback(() => {
    if (!tokens || !project?.sourceUrl) return;
    createSnapshot(projectId, "Before re-standardisation");
    const tokenMap = standardiseTokens(tokens, project.sourceUrl);
    applyStandardisation(tokens, tokenMap);
    const serialisable: ProjectStandardisation = {
      kitPrefix: tokenMap.kitPrefix,
      assignments: Object.fromEntries(tokenMap.assignments),
      unassigned: tokenMap.unassigned,
      antiPatterns: tokenMap.antiPatterns,
      standardisedAt: new Date().toISOString(),
    };
    updateStandardisation(projectId, serialisable);
    setViewMode("curated");
  }, [tokens, project, projectId, updateStandardisation, createSnapshot]);

  // Flatten all tokens for the curated view lookup
  const allTokensFlat = useMemo<ExtractedToken[]>(() => {
    if (!tokens) return [];
    return [
      ...tokens.colors,
      ...tokens.typography,
      ...tokens.spacing,
      ...tokens.radius,
      ...tokens.effects,
      ...(tokens.motion ?? []),
    ];
  }, [tokens]);

  const handleScrollTo = useCallback((sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const handleUpdateToken = useCallback(
    (tokenType: "colors" | "typography" | "spacing" | "radius" | "effects", name: string, value: string) => {
      updateToken(projectId, tokenType, name, value);
    },
    [projectId, updateToken]
  );

  const handleRemoveToken = useCallback(
    (tokenType: "colors" | "typography" | "spacing" | "radius" | "effects", names: string[]) => {
      removeTokens(projectId, tokenType, names);
    },
    [projectId, removeTokens]
  );

  const handleRenameToken = useCallback(
    (tokenType: "colors" | "typography" | "spacing" | "radius" | "effects", oldName: string, newName: string) => {
      renameToken(projectId, tokenType, oldName, newName);
    },
    [projectId, renameToken]
  );

  const handleAddScreenshot = useCallback(
    (dataUrl: string) => {
      if (!extractionData) return;
      updateExtractionData(projectId, {
        ...extractionData,
        screenshots: [...extractionData.screenshots, dataUrl],
      });
    },
    [projectId, extractionData, updateExtractionData]
  );

  const handleDeleteScreenshot = useCallback(
    (index: number) => {
      if (!extractionData) return;
      updateExtractionData(projectId, {
        ...extractionData,
        screenshots: extractionData.screenshots.filter((_, i) => i !== index),
      });
    },
    [projectId, extractionData, updateExtractionData]
  );

  // Deduplicate tokens that have the same resolved value within a category.
  // Prefer tokens from Figma Variables (no "reconstructed"/"computed" in metadata) over mined ones.
  const deduplicatedTokens = useMemo(() => {
    if (!tokens) return null;
    const dedup = (tokenList: typeof tokens.colors) => {
      const byValue = new Map<string, typeof tokenList[0]>();
      for (const t of tokenList) {
        const key = t.value.trim().toLowerCase();
        const existing = byValue.get(key);
        if (!existing) {
          byValue.set(key, t);
        } else {
          // Prefer the token without "reconstructed"/"computed" in description or originalName
          const existingIsReconstructed = (existing.description ?? "").includes("reconstructed") || (existing.originalName ?? "").includes("computed");
          const newIsReconstructed = (t.description ?? "").includes("reconstructed") || (t.originalName ?? "").includes("computed");
          if (existingIsReconstructed && !newIsReconstructed) {
            byValue.set(key, t);
          }
        }
      }
      return Array.from(byValue.values());
    };
    return {
      colors: dedup(tokens.colors),
      typography: tokens.typography, // Typography values are composites, rarely duplicate
      spacing: dedup(tokens.spacing),
      radius: dedup(tokens.radius),
      effects: tokens.effects,
      motion: tokens.motion ?? [],
    };
  }, [tokens]);

  const cssVariables = useMemo(() => {
    if (!tokens) return {};
    const vars: Record<string, string> = {};
    const allTokens = [
      ...tokens.colors,
      ...tokens.typography,
      ...tokens.spacing,
      ...tokens.radius,
      ...tokens.effects,
    ];
    for (const t of allTokens) {
      if (t.cssVariable) {
        vars[t.cssVariable] = t.value;
      }
    }
    return vars;
  }, [tokens]);

  if (!tokens) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-[var(--text-secondary)]">No design system extracted yet.</p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Extract from a Figma file or website to see your design system here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-[var(--bg-app)]">
      {/* Section nav */}
      <div className="sticky top-0 z-10 flex items-center gap-1 border-b border-[var(--studio-border)] bg-[var(--bg-app)] px-6 py-2">
        {/* Curated / All toggle */}
        <div className="mr-2 flex items-center rounded-md border border-[var(--studio-border)] bg-[var(--bg-surface)] p-0.5">
          <button
            onClick={() => setViewMode("curated")}
            className={`flex items-center gap-1 rounded px-2 py-1 text-[10px] font-medium transition-colors ${
              viewMode === "curated"
                ? "bg-[var(--studio-accent)] text-[var(--text-on-accent)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            }`}
            title="Curated: standardised token roles for AI code generation"
          >
            <Sparkles className="h-3 w-3" />
            Curated
          </button>
          <button
            onClick={() => setViewMode("all")}
            className={`rounded px-2 py-1 text-[10px] font-medium transition-colors ${
              viewMode === "all"
                ? "bg-[var(--studio-accent)] text-[var(--text-on-accent)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            }`}
            title="All: every extracted token"
          >
            All Tokens
          </button>
        </div>

        <span
          className="mr-2 rounded-md bg-[var(--bg-surface)] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)]"
          title={`${tokens.colors.length} colours, ${tokens.typography.length} typography, ${tokens.spacing.length} spacing, ${tokens.radius.length} radius, ${tokens.effects.length} effects, ${(tokens.motion ?? []).length} motion`}
        >
          {tokens.colors.length + tokens.typography.length + tokens.spacing.length + tokens.radius.length + tokens.effects.length + (tokens.motion ?? []).length} tokens
        </span>
        {viewMode === "all" && SECTIONS.map((section) => {
          const count = section.id === "screenshots"
            ? screenshots.length
            : section.id === "components"
              ? extractedComponents.filter(c => !c.name.toLowerCase().startsWith("icon/")).length + scannedComponents.length
              : section.id === "colours"
                ? tokens.colors.length
                : section.id === "typography"
                  ? tokens.typography.length
                  : section.id === "spacing"
                    ? tokens.spacing.length
                    : section.id === "radius"
                      ? tokens.radius.length
                      : tokens.effects.length;

          // Always show the Components nav item even when empty
          if (count === 0 && section.id !== "components") return null;

          return (
            <button
              key={section.id}
              onClick={() => handleScrollTo(section.id)}
              className="rounded-md px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
            >
              {section.label}
              {count > 0 && <span className="ml-1.5 text-[var(--text-muted)]">{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Editing guidance */}
      {!guidanceDismissed && (
        <div className="flex items-center gap-3 border-b border-[var(--studio-border)] bg-[var(--bg-panel)] px-8 py-2.5">
          <p className="flex-1 text-xs text-[var(--text-muted)]">
            <span className="text-[var(--text-secondary)]">Quick edits:</span> click any value to edit, click swatches to pick colours, double-click names to rename.{" "}
            <span className="text-[var(--text-secondary)]">Complex changes:</span>{" "}
            {onNavigateToEditor ? (
              <button onClick={onNavigateToEditor} className="underline text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                open the Editor
              </button>
            ) : (
              "open the Editor"
            )}{" "}
            to edit your layout.md directly.
          </p>
          <button
            onClick={dismissGuidance}
            className="shrink-0 flex items-center justify-center h-5 w-5 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Scrollable content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-8 py-6">
        {/* Curated view */}
        {viewMode === "curated" && project?.standardisation && (
          <CuratedTokenView
            projectId={projectId}
            standardisation={project.standardisation}
            allTokens={allTokensFlat}
            cssVariables={cssVariables}
            snapshots={project.snapshots ?? []}
            currentLayoutMd={project.layoutMd}
            onUpdateToken={handleUpdateToken}
            onRemoveToken={(tokenType, names) => handleRemoveToken(tokenType, names)}
            onRenameToken={handleRenameToken}
          />
        )}

        {/* Curated view loading */}
        {viewMode === "curated" && !project?.standardisation && standardising && (
          <div className="flex h-64 items-center justify-center">
            <div className="text-center">
              <Sparkles className="mx-auto h-8 w-8 text-[var(--text-muted)] mb-3" />
              <p className="text-sm text-[var(--text-secondary)]">Standardising your design system...</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Mapping extracted tokens to standard roles.
              </p>
            </div>
          </div>
        )}

        {/* Curated view but standardisation failed or not available */}
        {viewMode === "curated" && !project?.standardisation && !standardising && (
          <div className="flex h-64 items-center justify-center">
            <div className="text-center">
              <p className="text-sm text-[var(--text-secondary)]">No standardisation data available.</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Switch to All Tokens or re-extract to generate the curated view.
              </p>
              <button
                onClick={() => setViewMode("all")}
                className="mt-3 rounded-md bg-[var(--studio-accent)] px-3 py-1.5 text-xs font-medium text-[var(--text-on-accent)] transition-colors hover:bg-[var(--studio-accent-hover)]"
              >
                View All Tokens
              </button>
            </div>
          </div>
        )}

        {/* All tokens view (original) */}
        {viewMode === "all" && tokens.colors.length > 0 && (
          <DesignSystemSection id="colours" title="Colours" count={deduplicatedTokens?.colors.length ?? tokens.colors.length}>
            <ColourPalette
              tokens={deduplicatedTokens?.colors ?? tokens.colors}
              cssVariables={cssVariables}
              onUpdateToken={(name, value) => handleUpdateToken("colors", name, value)}
              onRemoveToken={(name) => handleRemoveToken("colors", [name])}
              onRenameToken={(oldName, newName) => handleRenameToken("colors", oldName, newName)}
            />
          </DesignSystemSection>
        )}

        {viewMode === "all" && tokens.typography.length > 0 && (
          <DesignSystemSection id="typography" title="Typography" count={tokens.typography.length}>
            <TypographyScale
              tokens={tokens.typography}
              onUpdateToken={(name, value) => handleUpdateToken("typography", name, value)}
              onRemoveToken={(name) => handleRemoveToken("typography", [name])}
              extractedFonts={extractionData?.fonts ?? []}
              uploadedFonts={useProjectStore.getState().projects.find((p) => p.id === projectId)?.uploadedFonts}
            />
            <div className="mt-6 pt-6 border-t border-[var(--studio-border)]">
              <FontManager
                projectId={projectId}
                orgId={useOrgStore.getState().currentOrgId ?? undefined}
                extractedFonts={extractionData?.fonts ?? []}
                uploadedFonts={useProjectStore.getState().projects.find((p) => p.id === projectId)?.uploadedFonts ?? []}
                typographyTokens={tokens.typography}
              />
            </div>
          </DesignSystemSection>
        )}

        {viewMode === "all" && tokens.spacing.length > 0 && (
          <DesignSystemSection id="spacing" title="Spacing" count={deduplicatedTokens?.spacing.length ?? tokens.spacing.length}>
            <SpacingScale
              tokens={deduplicatedTokens?.spacing ?? tokens.spacing}
              onUpdateToken={(name, value) => handleUpdateToken("spacing", name, value)}
              onRemoveToken={(name) => handleRemoveToken("spacing", [name])}
            />
          </DesignSystemSection>
        )}

        {viewMode === "all" && tokens.radius.length > 0 && (
          <DesignSystemSection id="radius" title="Radius" count={deduplicatedTokens?.radius.length ?? tokens.radius.length}>
            <RadiusPreview
              tokens={deduplicatedTokens?.radius ?? tokens.radius}
              onUpdateToken={(name, value) => handleUpdateToken("radius", name, value)}
              onRemoveToken={(name) => handleRemoveToken("radius", [name])}
            />
          </DesignSystemSection>
        )}

        {viewMode === "all" && tokens.effects.length > 0 && (
          <DesignSystemSection id="effects" title="Effects" count={tokens.effects.length}>
            <EffectsPreview
              tokens={tokens.effects}
              onUpdateToken={(name, value) => handleUpdateToken("effects", name, value)}
              onRemoveToken={(name) => handleRemoveToken("effects", [name])}
            />
          </DesignSystemSection>
        )}

        {viewMode === "all" && <DesignSystemSection
          id="components"
          title="Components"
          count={extractedComponents.filter(c => !c.name.toLowerCase().startsWith("icon/")).length + scannedComponents.length}
        >
          {extractedComponents.length === 0 && scannedComponents.length === 0 ? (
            <div className="px-4 py-6 text-center space-y-3">
              <p className="text-xs text-[var(--text-muted)]">
                No codebase components detected yet.
              </p>
              <div className="rounded-md border border-[var(--studio-border)] bg-[var(--bg-surface)] px-3 py-2">
                <code className="text-[10px] font-mono text-[var(--text-secondary)]">
                  npx @layoutdesign/context scan --sync
                </code>
              </div>
              <p className="text-[10px] text-[var(--text-muted)]">
                Run this in your project to detect existing components.
                AI agents will then reuse them instead of generating duplicates.
              </p>
            </div>
          ) : (
            <ComponentsView
              extractedComponents={extractedComponents}
              scannedComponents={scannedComponents}
            />
          )}
        </DesignSystemSection>}

        {viewMode === "all" && screenshots.length > 0 && (
          <DesignSystemSection id="screenshots" title="Screenshots" count={screenshots.length}>
            <ScreenshotGallery
              screenshots={screenshots}
              onAdd={handleAddScreenshot}
              onDelete={handleDeleteScreenshot}
            />
          </DesignSystemSection>
        )}
      </div>
    </div>
  );
}
