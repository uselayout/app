"use client";

import { useRef, useCallback, useMemo, useState, useEffect } from "react";
import { X } from "lucide-react";
import type { ExtractionResult } from "@/lib/types";
import { useProjectStore } from "@/lib/store/project";
import { DesignSystemSection } from "./design-system/DesignSystemSection";
import { ColourPalette } from "./design-system/ColourPalette";
import { TypographyScale } from "./design-system/TypographyScale";
import { SpacingScale } from "./design-system/SpacingScale";
import { RadiusPreview } from "./design-system/RadiusPreview";
import { EffectsPreview } from "./design-system/EffectsPreview";
import { ScreenshotGallery } from "./design-system/ScreenshotGallery";

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

  const tokens = extractionData?.tokens;
  const screenshots = extractionData?.screenshots ?? [];

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
        {SECTIONS.map((section) => {
          const count = section.id === "screenshots"
            ? screenshots.length
            : section.id === "colours"
              ? tokens.colors.length
              : section.id === "typography"
                ? tokens.typography.length
                : section.id === "spacing"
                  ? tokens.spacing.length
                  : section.id === "radius"
                    ? tokens.radius.length
                    : tokens.effects.length;

          if (count === 0) return null;

          return (
            <button
              key={section.id}
              onClick={() => handleScrollTo(section.id)}
              className="rounded-md px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
            >
              {section.label}
              <span className="ml-1.5 text-[var(--text-muted)]">{count}</span>
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
        {tokens.colors.length > 0 && (
          <DesignSystemSection id="colours" title="Colours" count={tokens.colors.length}>
            <ColourPalette
              tokens={tokens.colors}
              cssVariables={cssVariables}
              onUpdateToken={(name, value) => handleUpdateToken("colors", name, value)}
              onRemoveToken={(name) => handleRemoveToken("colors", [name])}
              onRenameToken={(oldName, newName) => handleRenameToken("colors", oldName, newName)}
            />
          </DesignSystemSection>
        )}

        {tokens.typography.length > 0 && (
          <DesignSystemSection id="typography" title="Typography" count={tokens.typography.length}>
            <TypographyScale
              tokens={tokens.typography}
              onUpdateToken={(name, value) => handleUpdateToken("typography", name, value)}
              onRemoveToken={(name) => handleRemoveToken("typography", [name])}
              extractedFonts={extractionData?.fonts ?? []}
            />
          </DesignSystemSection>
        )}

        {tokens.spacing.length > 0 && (
          <DesignSystemSection id="spacing" title="Spacing" count={tokens.spacing.length}>
            <SpacingScale
              tokens={tokens.spacing}
              onUpdateToken={(name, value) => handleUpdateToken("spacing", name, value)}
              onRemoveToken={(name) => handleRemoveToken("spacing", [name])}
            />
          </DesignSystemSection>
        )}

        {tokens.radius.length > 0 && (
          <DesignSystemSection id="radius" title="Radius" count={tokens.radius.length}>
            <RadiusPreview
              tokens={tokens.radius}
              onUpdateToken={(name, value) => handleUpdateToken("radius", name, value)}
              onRemoveToken={(name) => handleRemoveToken("radius", [name])}
            />
          </DesignSystemSection>
        )}

        {tokens.effects.length > 0 && (
          <DesignSystemSection id="effects" title="Effects" count={tokens.effects.length}>
            <EffectsPreview
              tokens={tokens.effects}
              onUpdateToken={(name, value) => handleUpdateToken("effects", name, value)}
              onRemoveToken={(name) => handleRemoveToken("effects", [name])}
            />
          </DesignSystemSection>
        )}

        {screenshots.length > 0 && (
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
