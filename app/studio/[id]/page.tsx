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
import { TestPanel } from "@/components/studio/TestPanel";
import { ExportModal } from "@/components/studio/ExportModal";

export default function StudioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const projects = useProjectStore((s) => s.projects);
  const updateProjectName = useProjectStore((s) => s.updateProjectName);
  const updateDesignMd = useProjectStore((s) => s.updateDesignMd);
  const project = projects.find((p) => p.id === id);

  const extractionStatus = useExtractionStore((s) => s.status);
  const extractionProgress = useExtractionStore((s) => s.progress);
  const extractionSteps = useExtractionStore((s) => s.steps);
  const extractionError = useExtractionStore((s) => s.error);

  const { runExtraction } = useExtraction();
  const extractionStarted = useRef(false);
  const [showExport, setShowExport] = useState(false);

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
    <div className="flex h-screen flex-col">
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
        onExport={() => setShowExport(true)}
      />
      <div className="flex-1 overflow-hidden">
        <StudioLayout
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
          testPanel={
            <TestPanel
              projectId={id}
              designMd={project.designMd}
              components={componentNames}
              extractedFonts={extractedFonts}
              initialResults={project.testResults ?? []}
            />
          }
        />
      </div>
      {showExport && (
        <ExportModal project={project} onClose={() => setShowExport(false)} />
      )}
    </div>
  );
}
