"use client";

import { use, useEffect, useRef, useCallback, useState, useMemo } from "react";
import { useProjectStore } from "@/lib/store/project";
import { useExtractionStore } from "@/lib/store/extraction";
import { useExtraction } from "@/lib/hooks/use-extraction";
import { useKeyboardShortcuts } from "@/lib/hooks/use-keyboard-shortcuts";
import { TopBar } from "@/components/shared/TopBar";
import { StudioLayout } from "@/components/studio/StudioLayout";
import { ExtractionProgress } from "@/components/studio/ExtractionProgress";
import { EditorPanel } from "@/components/studio/EditorPanel";
import { SourcePanel } from "@/components/studio/SourcePanel";
import { TestPanel, type TestPanelHandle } from "@/components/studio/TestPanel";
import { ExplorerCanvas } from "@/components/studio/ExplorerCanvas";
import { ExportModal } from "@/components/studio/ExportModal";
import type { DesignVariant } from "@/lib/types";

export default function StudioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const projects = useProjectStore((s) => s.projects);
  const updateProjectName = useProjectStore((s) => s.updateProjectName);
  const updateDesignMd = useProjectStore((s) => s.updateDesignMd);
  const updateExplorations = useProjectStore((s) => s.updateExplorations);
  const project = projects.find((p) => p.id === id);

  const extractionStatus = useExtractionStore((s) => s.status);
  const extractionProgress = useExtractionStore((s) => s.progress);
  const extractionSteps = useExtractionStore((s) => s.steps);
  const extractionError = useExtractionStore((s) => s.error);

  const { runExtraction } = useExtraction();
  const extractionStarted = useRef(false);
  const [showExport, setShowExport] = useState(false);
  const [centreView, setCentreView] = useState<"editor" | "canvas">("editor");
  const [showTestPanel, setShowTestPanel] = useState(true);
  const [includeContext, setIncludeContext] = useState(true);
  const testPanelRef = useRef<TestPanelHandle>(null);

  useEffect(() => {
    if (extractionStarted.current || !project) return;

    const shouldExtract = sessionStorage.getItem(`extract-${id}`);
    if (!shouldExtract) return;

    extractionStarted.current = true;
    sessionStorage.removeItem(`extract-${id}`);

    const pat = sessionStorage.getItem(`pat-${id}`);
    if (pat) sessionStorage.removeItem(`pat-${id}`);

    runExtraction(project, pat ?? undefined);
  }, [id, project, runExtraction]);

  const handleReExtract = useCallback(() => {
    if (!project) return;
    extractionStarted.current = false;
    sessionStorage.setItem(`extract-${id}`, "true");
    const pat = sessionStorage.getItem(`pat-${id}`);
    runExtraction(project, pat ?? undefined);
  }, [id, project, runExtraction]);

  const handleDesignMdChange = useCallback(
    (value: string) => {
      updateDesignMd(id, value);
    },
    [id, updateDesignMd]
  );

  const shortcutHandlers = useMemo(
    () => ({
      onSave: () => {
        if (project) updateDesignMd(id, project.designMd);
      },
      onExport: () => setShowExport(true),
    }),
    [id, project, updateDesignMd]
  );

  useKeyboardShortcuts(shortcutHandlers);

  // Must be before any early returns (Rules of Hooks)
  const tokenSuggestions = useMemo(() => {
    if (!project?.extractionData?.tokens) return [];
    const allTokens = [
      ...project.extractionData.tokens.colors,
      ...project.extractionData.tokens.typography,
      ...project.extractionData.tokens.spacing,
      ...project.extractionData.tokens.radius,
      ...project.extractionData.tokens.effects,
    ];
    return allTokens
      .filter((t) => t.cssVariable)
      .map((t) => ({ name: t.cssVariable!, value: t.value }));
  }, [project?.extractionData?.tokens]);

  const handlePushToFigma = useCallback((variant: DesignVariant) => {
    // Phase 2: FigmaPushModal — for now copy code to clipboard
    navigator.clipboard.writeText(variant.code);
  }, []);

  const handleUpdateExplorations = useCallback(
    (explorations: import("@/lib/types").ExplorationSession[]) => {
      updateExplorations(id, explorations);
    },
    [id, updateExplorations]
  );

  if (!project) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="space-y-4 text-center">
          <h2 className="text-lg font-medium text-[--text-primary]">
            Project not found
          </h2>
          <p className="text-sm text-[--text-secondary]">
            This project may have been deleted or the URL is incorrect.
          </p>
          <a
            href="/"
            className="inline-block rounded-md bg-[--studio-accent] px-4 py-2 text-sm text-[--text-on-accent] transition-colors hover:bg-[--studio-accent-hover]"
          >
            Start a new extraction
          </a>
        </div>
      </div>
    );
  }

  // Show progress screen when running, or when failed with no extraction data yet
  if (extractionStatus === "running" || (extractionStatus === "failed" && !project.extractionData)) {
    return (
      <ExtractionProgress
        sourceName={project.name}
        sourceType={project.sourceType === "figma" ? "figma" : "website"}
        progress={extractionProgress}
        steps={extractionSteps}
        error={extractionError}
      />
    );
  }

  const componentNames =
    project.extractionData?.components.map((c) => c.name) ?? [];
  const extractedFonts =
    project.extractionData?.fonts.map((f) => f.family) ?? [];

  return (
    <>
    {/* Mobile gate */}
    <div className="flex md:hidden h-screen flex-col items-center justify-center px-6 text-center">
      <img src="/marketing/logo.svg" alt="Layout" width={100} height={24} className="mb-6" />
      <h2 className="text-lg font-semibold text-[--text-primary]">Desktop only</h2>
      <p className="mt-2 max-w-xs text-sm text-[--text-secondary]">
        Layout Studio needs a larger screen to work properly. Please open this page on a desktop browser.
      </p>
      <a
        href="/studio"
        className="mt-6 rounded-md bg-[--bg-surface] px-4 py-2 text-sm font-medium text-[--text-primary] hover:bg-[--bg-hover] transition-colors"
      >
        Back to projects
      </a>
    </div>
    {/* Desktop studio */}
    <div className="hidden md:flex h-screen flex-col">
      <TopBar
        projectName={project.name}
        sourceType={project.sourceType}
        sourceName={
          project.sourceUrl
            ? new URL(project.sourceUrl).hostname
            : undefined
        }
        onNameChange={(name) => updateProjectName(id, name)}
        onReExtract={handleReExtract}
        onTest={() => setShowTestPanel((prev) => !prev)}
        testPanelOpen={showTestPanel}
        onExport={() => setShowExport(true)}
        centreView={centreView}
        onCentreViewChange={setCentreView}
      />
      <div className="flex-1 overflow-hidden">
        <StudioLayout
          centreView={centreView}
          showTestPanel={showTestPanel}
          sourcePanel={
            <SourcePanel
              extractionData={project.extractionData}
              sourceType={project.sourceType}
              sourceUrl={project.sourceUrl}
            />
          }
          editorPanel={
            <EditorPanel
              value={project.designMd}
              onChange={handleDesignMdChange}
              tokenSuggestions={tokenSuggestions}
            />
          }
          canvasPanel={
            <ExplorerCanvas
              projectId={id}
              designMd={project.designMd}
              explorations={project.explorations ?? []}
              onUpdateExplorations={handleUpdateExplorations}
              onPushToFigma={handlePushToFigma}
              onDesignMdUpdate={handleDesignMdChange}
            />
          }
          testPanel={
            <TestPanel
              ref={testPanelRef}
              projectId={id}
              designMd={project.designMd}
              components={componentNames}
              extractedFonts={extractedFonts}
              initialResults={project.testResults ?? []}
              includeContext={includeContext}
              onToggleContext={() => setIncludeContext((v) => !v)}
            />
          }
        />
      </div>
      {showExport && (
        <ExportModal project={project} onClose={() => setShowExport(false)} />
      )}
    </div>
    </>
  );
}
