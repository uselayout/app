"use client";

import { use, useEffect, useRef, useCallback, useState, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
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
import type { DesignVariant, ExtractionResult, SourceType } from "@/lib/types";
import { SavedLibraryView } from "@/components/studio/SavedLibraryView";

export default function StudioPage({
  params,
}: {
  params: Promise<{ org: string; projectId: string }>;
}) {
  const { projectId: id } = use(params);
  const projects = useProjectStore((s) => s.projects);
  const hydrating = useProjectStore((s) => s.hydrating);
  const updateProjectName = useProjectStore((s) => s.updateProjectName);
  const updateProjectSource = useProjectStore((s) => s.updateProjectSource);
  const updateLayoutMd = useProjectStore((s) => s.updateLayoutMd);
  const updateExtractionData = useProjectStore((s) => s.updateExtractionData);
  const updateExplorations = useProjectStore((s) => s.updateExplorations);
  const refreshProject = useProjectStore((s) => s.refreshProject);
  const saveError = useProjectStore((s) => s.saveError);
  const clearSaveError = useProjectStore((s) => s.clearSaveError);
  const project = projects.find((p) => p.id === id);

  // Fetch full project data if we only have summary data (list endpoint omits layout_md + extraction_data)
  useEffect(() => {
    if (project && !project.layoutMd && !project.extractionData) {
      refreshProject(id);
    }
  }, [id, project, refreshProject]);

  // Auto-dismiss save error after 8 seconds
  useEffect(() => {
    if (!saveError) return;
    const timer = setTimeout(clearSaveError, 8000);
    return () => clearTimeout(timer);
  }, [saveError, clearSaveError]);

  const extractionProjectId = useExtractionStore((s) => s.projectId);
  const extractionStatus = useExtractionStore((s) => s.status);
  const extractionProgress = useExtractionStore((s) => s.progress);
  const extractionSteps = useExtractionStore((s) => s.steps);
  const extractionError = useExtractionStore((s) => s.error);
  const streamingContent = useExtractionStore((s) => s.streamingContent);
  const isThisProjectExtracting = extractionProjectId === id;

  const { runExtraction } = useExtraction();
  const extractionStarted = useRef(false);
  const [showExport, setShowExport] = useState(false);
  const [centreView, setCentreView] = useState<"editor" | "canvas" | "saved">("editor");
  const [showSourcePanel, setShowSourcePanel] = useState(true);
  const [whatsNextDismissed, setWhatsNextDismissed] = useState(false);

  // Sync centreView with ?view= query param
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const view = searchParams.get("view");
    if (view === "saved") {
      setCentreView("saved");
    } else if (centreView === "saved") {
      setCentreView("editor");
    }
  }, [searchParams]);

  // Clean up URL when navigating away from saved view via TopBar toggle
  const handleCentreViewChange = useCallback(
    (view: "editor" | "canvas" | "saved") => {
      setCentreView(view);
      const currentView = searchParams.get("view");
      if (view === "saved" && currentView !== "saved") {
        router.replace(`${pathname}?view=saved`, { scroll: false });
      } else if (view !== "saved" && currentView === "saved") {
        router.replace(pathname, { scroll: false });
      }
    },
    [searchParams, pathname, router]
  );

  const markStep = useOnboardingStore((s) => s.markStep);
  const onboardingSteps = useOnboardingStore((s) => s.steps);

  // Mark viewedLayoutMd step when studio is open with non-empty layout.md
  // and the user has dismissed the "What's next?" screen
  useEffect(() => {
    if (project?.layoutMd && project.layoutMd.length > 0 && whatsNextDismissed && !onboardingSteps.viewedLayoutMd) {
      markStep("viewedLayoutMd");
    }
  }, [project?.layoutMd, whatsNextDismissed, onboardingSteps.viewedLayoutMd, markStep]);

  // Extraction diff state
  const previousExtractionRef = useRef<ExtractionResult | null>(null);
  const previousLayoutMdRef = useRef<string | null>(null);
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
      previousLayoutMdRef.current = project.layoutMd;
    }
    extractionStarted.current = false;
    sessionStorage.setItem(`extract-${id}`, "true");
    // Clear stale sessionStorage PAT — persistent localStorage PAT is now preferred
    sessionStorage.removeItem(`pat-${id}`);
    runExtraction(project);
  }, [id, project, runExtraction]);

  const handleExtractFromPanel = useCallback(
    (url: string, sourceType: SourceType, pat?: string) => {
      if (!project) return;
      updateProjectSource(project.id, url, sourceType);
      const isDefaultName = !project.sourceUrl || project.name === "New Project";
      if (isDefaultName) {
        const newName = sourceType === "figma"
          ? "Figma Extraction"
          : new URL(url).hostname.replace("www.", "");
        updateProjectName(project.id, newName);
      }
      if (pat) sessionStorage.setItem(`pat-${id}`, pat);
      const updatedProject = { ...project, sourceUrl: url, sourceType };
      extractionStarted.current = false;
      runExtraction(updatedProject, pat);
    },
    [id, project, updateProjectSource, updateProjectName, runExtraction]
  );

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
        previousLayoutMdRef.current = null;
      }
    }
  }, [extractionStatus, project?.extractionData]);

  const handleAcceptDiff = useCallback(() => {
    previousExtractionRef.current = null;
    previousLayoutMdRef.current = null;
    setPendingDiff(null);
  }, []);

  const handleDiscardDiff = useCallback(() => {
    // Revert to previous extraction data and layout.md
    if (previousExtractionRef.current) {
      updateExtractionData(id, previousExtractionRef.current);
    }
    if (previousLayoutMdRef.current !== null) {
      updateLayoutMd(id, previousLayoutMdRef.current);
    }
    previousExtractionRef.current = null;
    previousLayoutMdRef.current = null;
    setPendingDiff(null);
  }, [id, updateExtractionData, updateLayoutMd]);

  const handleLayoutMdChange = useCallback(
    (value: string) => {
      updateLayoutMd(id, value);
    },
    [id, updateLayoutMd]
  );

  const shortcutHandlers = useMemo(
    () => ({
      onSave: () => {
        if (project) updateLayoutMd(id, project.layoutMd);
      },
      onExport: () => setShowExport(true),
    }),
    [id, project, updateLayoutMd]
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

  const handleOpenSavedInCanvas = useCallback(
    (code: string, name: string) => {
      const sessionId = crypto.randomUUID();
      const variant: DesignVariant = {
        id: crypto.randomUUID(),
        name,
        rationale: "Loaded from saved library",
        code,
      };
      const newExploration: import("@/lib/types").ExplorationSession = {
        id: sessionId,
        projectId: id,
        prompt: `Refine: ${name}`,
        variantCount: 1,
        variants: [variant],
        createdAt: new Date().toISOString(),
      };
      const existing = project?.explorations ?? [];
      updateExplorations(id, [...existing, newExploration]);
      handleCentreViewChange("canvas");
    },
    [id, project?.explorations, updateExplorations, handleCentreViewChange]
  );

  if (!project && hydrating) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--studio-border-strong)] border-t-[var(--studio-accent)]" />
          <p className="text-sm text-[var(--text-secondary)]">Loading project…</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="space-y-4 text-center">
          <h2 className="text-lg font-medium text-[var(--text-primary)]">
            Project not found
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            This project may have been deleted or the URL is incorrect.
          </p>
        </div>
      </div>
    );
  }

  // Show progress screen when actively running, failed with no data,
  // or just completed (only if extraction was triggered in THIS session)
  const extractionWasTriggered = extractionStarted.current;
  if (
    isThisProjectExtracting && (
      extractionStatus === "running" ||
      (extractionStatus === "failed" && !project.extractionData) ||
      (extractionStatus === "complete" && !whatsNextDismissed && extractionWasTriggered)
    )
  ) {
    return (
      <ExtractionProgress
        sourceName={project.name}
        sourceType={project.sourceType === "figma" ? "figma" : "website"}
        progress={extractionProgress}
        steps={extractionSteps}
        error={extractionError}
        streamingContent={streamingContent ?? project.layoutMd}
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
      <p className="mt-6 text-xs text-[var(--text-muted)]">
        Please use a desktop browser for Studio.
      </p>
    </div>
    {/* Desktop studio */}
    <div className="hidden md:flex h-full flex-col">
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
        onToggleSource={() => setShowSourcePanel((prev) => !prev)}
        sourcePanelOpen={showSourcePanel}
        onExport={() => setShowExport(true)}
        centreView={centreView}
        onCentreViewChange={handleCentreViewChange}
      />
      <div className="flex-1 overflow-hidden">
        <StudioLayout
          centreView={centreView}
          showSourcePanel={showSourcePanel && centreView !== "saved"}
          sourcePanel={
            <SourcePanel
              extractionData={project.extractionData}
              sourceType={project.sourceType}
              sourceUrl={project.sourceUrl}
              layoutMd={project.layoutMd}
              projectId={project.id}
              onLayoutMdChange={handleLayoutMdChange}
              onExtract={handleExtractFromPanel}
            />
          }
          editorPanel={
            <EditorPanel
              value={project.layoutMd}
              onChange={handleLayoutMdChange}
              tokenSuggestions={tokenSuggestions}
              projectId={project.id}
              orgId={project.orgId}
            />
          }
          canvasPanel={
            <ExplorerCanvas
              projectId={id}
              layoutMd={project.layoutMd}
              explorations={project.explorations ?? []}
              onUpdateExplorations={handleUpdateExplorations}
              onPushToFigma={handlePushToFigma}
              onLayoutMdUpdate={handleLayoutMdChange}
              extractedFonts={extractedFonts}
              iconPacks={project.iconPacks}
            />
          }
          savedPanel={
            <SavedLibraryView
              onNavigateToCanvas={() => handleCentreViewChange("canvas")}
              onOpenInCanvas={handleOpenSavedInCanvas}
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
      {saveError && (
        <div
          onClick={clearSaveError}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 cursor-pointer backdrop-blur-sm animate-in slide-in-from-bottom-2 fade-in duration-200"
        >
          <span className="text-xs text-red-400">Failed to save changes — your edits may be lost on refresh</span>
          <button className="text-[10px] text-red-400/60 hover:text-red-400 shrink-0">Dismiss</button>
        </div>
      )}
    </div>
    </>
  );
}
