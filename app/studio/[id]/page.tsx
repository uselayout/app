"use client";

import { use, useEffect, useRef, useCallback, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useProjectStore } from "@/lib/store/project";
import { useExtractionStore } from "@/lib/store/extraction";
import { useOnboardingStore } from "@/lib/store/onboarding";
import { useExtraction } from "@/lib/hooks/use-extraction";
import { useKeyboardShortcuts } from "@/lib/hooks/use-keyboard-shortcuts";
import { TopBar } from "@/components/shared/TopBar";
import { StudioLayout } from "@/components/studio/StudioLayout";
import { ExtractionProgress } from "@/components/studio/ExtractionProgress";
import { EditorPanel } from "@/components/studio/EditorPanel";
import { SourcePanel } from "@/components/studio/SourcePanel";
import { ExplorerCanvas } from "@/components/studio/ExplorerCanvas";
import { ExportModal } from "@/components/studio/ExportModal";
import { ExtractionDiffModal } from "@/components/studio/ExtractionDiffModal";
import { diffExtractions } from "@/lib/extraction/diff";
import type { ExtractionDiff } from "@/lib/extraction/diff";
import type { DesignVariant, ExtractionResult } from "@/lib/types";

export default function StudioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const projects = useProjectStore((s) => s.projects);
  const hydrating = useProjectStore((s) => s.hydrating);
  const updateProjectName = useProjectStore((s) => s.updateProjectName);
  const updateDesignMd = useProjectStore((s) => s.updateDesignMd);
  const updateExtractionData = useProjectStore((s) => s.updateExtractionData);
  const updateExplorations = useProjectStore((s) => s.updateExplorations);
  const setCurrentProject = useProjectStore((s) => s.setCurrentProject);
  const project = projects.find((p) => p.id === id);

  const markStep = useOnboardingStore((s) => s.markStep);
  const onboardingSteps = useOnboardingStore((s) => s.steps);

  const [whatsNextDismissed, setWhatsNextDismissed] = useState(false);

  // Mark viewedDesignMd step when studio is open with non-empty DESIGN.md
  // and the user has dismissed the "What's next?" screen
  useEffect(() => {
    if (project?.designMd && project.designMd.length > 0 && whatsNextDismissed && !onboardingSteps.viewedDesignMd) {
      markStep("viewedDesignMd");
    }
  }, [project?.designMd, whatsNextDismissed, onboardingSteps.viewedDesignMd, markStep]);

  // Set currentProjectId so TopBar can resolve the project (e.g. for Push button)
  useEffect(() => {
    setCurrentProject(id);
  }, [id, setCurrentProject]);

  // Grace period before showing "Project not found" — when switching projects
  // the store may momentarily not contain the target project (e.g. navigating
  // from dashboard while hydration is settling, or the project was just created
  // in another tab). Show spinner for 2s before giving up.
  const [notFoundConfirmed, setNotFoundConfirmed] = useState(false);
  useEffect(() => {
    if (project) {
      setNotFoundConfirmed(false);
      return;
    }
    setNotFoundConfirmed(false);
    const timer = setTimeout(() => setNotFoundConfirmed(true), 2000);
    return () => clearTimeout(timer);
  }, [id, project]);

  const extractionStatus = useExtractionStore((s) => s.status);
  const extractionProgress = useExtractionStore((s) => s.progress);
  const extractionSteps = useExtractionStore((s) => s.steps);
  const extractionError = useExtractionStore((s) => s.error);

  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const sourceParam = searchParams.get("source");

  const { runExtraction } = useExtraction();
  const extractionStarted = useRef(false);
  const [showExport, setShowExport] = useState(false);
  const [centreView, setCentreView] = useState<"editor" | "canvas">(
    tabParam === "explorer" ? "canvas" : "editor"
  );

  // Figma push-to-canvas: pre-load screenshot as reference image
  const pendingFigmaImage = useRef<string | null>(
    sourceParam === "figma"
      ? project?.extractionData?.screenshots?.at(-1) ?? null
      : null
  );

  // Clear URL params after consuming so refresh doesn't re-trigger
  useEffect(() => {
    if (tabParam || sourceParam) {
      window.history.replaceState({}, "", `/studio/${id}`);
    }
  }, [id, tabParam, sourceParam]);

  // Extraction diff state
  const previousExtractionRef = useRef<ExtractionResult | null>(null);
  const previousDesignMdRef = useRef<string | null>(null);
  const [pendingDiff, setPendingDiff] = useState<ExtractionDiff | null>(null);

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
    // Capture previous state for diff comparison
    if (project.extractionData) {
      previousExtractionRef.current = project.extractionData;
      previousDesignMdRef.current = project.designMd;
    }
    extractionStarted.current = false;
    sessionStorage.setItem(`extract-${id}`, "true");
    const pat = sessionStorage.getItem(`pat-${id}`);
    runExtraction(project, pat ?? undefined);
  }, [id, project, runExtraction]);

  // Show diff modal when re-extraction completes
  useEffect(() => {
    if (
      extractionStatus === "complete" &&
      previousExtractionRef.current &&
      project?.extractionData &&
      project.extractionData !== previousExtractionRef.current
    ) {
      const diff = diffExtractions(previousExtractionRef.current, project.extractionData);
      const totalChanges =
        diff.tokens.changes.length +
        diff.components.changes.length +
        diff.fonts.added.length +
        diff.fonts.removed.length;

      if (totalChanges > 0) {
        setPendingDiff(diff);
      } else {
        previousExtractionRef.current = null;
        previousDesignMdRef.current = null;
      }
    }
  }, [extractionStatus, project?.extractionData]);

  const handleAcceptDiff = useCallback(() => {
    previousExtractionRef.current = null;
    previousDesignMdRef.current = null;
    setPendingDiff(null);
  }, []);

  const handleDiscardDiff = useCallback(() => {
    // Revert to previous extraction data and DESIGN.md
    if (previousExtractionRef.current) {
      updateExtractionData(id, previousExtractionRef.current);
    }
    if (previousDesignMdRef.current !== null) {
      updateDesignMd(id, previousDesignMdRef.current);
    }
    previousExtractionRef.current = null;
    previousDesignMdRef.current = null;
    setPendingDiff(null);
  }, [id, updateExtractionData, updateDesignMd]);

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
    // Show spinner while store is hydrating, or during the grace period
    // when switching projects (store may not have the project yet)
    if (hydrating || !notFoundConfirmed) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[var(--bg-app)]">
          <div className="flex flex-col items-center gap-3">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--studio-border-strong)] border-t-[var(--studio-accent)]" />
            <p className="text-sm text-[var(--text-secondary)]">Loading project…</p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="space-y-4 text-center">
          <h2 className="text-lg font-medium text-[var(--text-primary)]">
            Project not found
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            This project may have been deleted or the URL is incorrect.
          </p>
          <a
            href="/"
            className="inline-block rounded-md bg-[var(--studio-accent)] px-4 py-2 text-sm text-[var(--text-on-accent)] transition-colors hover:bg-[var(--studio-accent-hover)]"
          >
            Start a new extraction
          </a>
        </div>
      </div>
    );
  }

  // Show progress screen when running, or when failed with no extraction data yet,
  // or when complete but the "What's next?" screen hasn't been dismissed yet
  if (
    extractionStatus === "running" ||
    (extractionStatus === "failed" && !project.extractionData) ||
    (extractionStatus === "complete" && !whatsNextDismissed)
  ) {
    return (
      <ExtractionProgress
        sourceName={project.name}
        sourceType={project.sourceType === "figma" ? "figma" : "website"}
        progress={extractionProgress}
        steps={extractionSteps}
        error={extractionError}
        streamingContent={project.designMd}
        onOpenEditor={() => {
          setCentreView("editor");
          setWhatsNextDismissed(true);
        }}
        onOpenCanvas={() => {
          setCentreView("canvas");
          setWhatsNextDismissed(true);
        }}
      />
    );
  }

  const extractedFonts =
    project.extractionData?.fonts.map((f) => f.family) ?? [];

  return (
    <>
    {/* Mobile gate */}
    <div className="flex md:hidden h-screen flex-col items-center justify-center px-6 text-center">
      <img src="/marketing/logo-white.svg" alt="Layout" width={100} height={24} className="mb-6" />
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">Desktop only</h2>
      <p className="mt-2 max-w-xs text-sm text-[var(--text-secondary)]">
        Layout needs a larger screen to work properly. Please open this page on a desktop browser.
      </p>
      <a
        href="/studio"
        className="mt-6 rounded-md bg-[var(--bg-surface)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
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
        project={project}
        onNameChange={(name) => updateProjectName(id, name)}
        onReExtract={handleReExtract}
        onExport={() => setShowExport(true)}
        centreView={centreView}
        onCentreViewChange={setCentreView}
      />
      <div className="flex-1 overflow-hidden">
        <StudioLayout
          centreView={centreView}
          sourcePanel={
            <SourcePanel
              extractionData={project.extractionData}
              sourceType={project.sourceType}
              sourceUrl={project.sourceUrl}
              designMd={project.designMd}
              projectId={project.id}
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
              initialImage={pendingFigmaImage.current ?? undefined}
              extractedFonts={extractedFonts}
            />
          }
        />
      </div>
      {showExport && (
        <ExportModal project={project} onClose={() => setShowExport(false)} />
      )}
      {pendingDiff && (
        <ExtractionDiffModal
          diff={pendingDiff}
          onClose={handleDiscardDiff}
          onAccept={handleAcceptDiff}
        />
      )}
    </div>
    </>
  );
}
