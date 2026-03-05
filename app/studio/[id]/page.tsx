"use client";

import { use } from "react";
import { useProjectStore } from "@/lib/store/project";
import { useExtractionStore } from "@/lib/store/extraction";
import { TopBar } from "@/components/shared/TopBar";
import { StudioLayout } from "@/components/studio/StudioLayout";
import { ExtractionProgress } from "@/components/studio/ExtractionProgress";

function SourcePanelPlaceholder() {
  return (
    <div className="flex h-full flex-col bg-[--bg-panel] p-4">
      <h3 className="text-sm font-medium text-[--text-primary]">Source & Tokens</h3>
      <p className="mt-2 text-xs text-[--text-muted]">
        Extraction data will appear here.
      </p>
    </div>
  );
}

function EditorPanelPlaceholder() {
  return (
    <div className="flex h-full items-center justify-center bg-[--bg-surface]">
      <p className="text-sm text-[--text-muted]">
        DESIGN.md editor will load here.
      </p>
    </div>
  );
}

function TestPanelPlaceholder() {
  return (
    <div className="flex h-full flex-col bg-[--bg-panel] p-4">
      <h3 className="text-sm font-medium text-[--text-primary]">AI Preview</h3>
      <p className="mt-2 text-xs text-[--text-muted]">
        Test your DESIGN.md against Claude here.
      </p>
    </div>
  );
}

export default function StudioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const projects = useProjectStore((s) => s.projects);
  const updateProjectName = useProjectStore((s) => s.updateProjectName);
  const project = projects.find((p) => p.id === id);

  const extractionStatus = useExtractionStore((s) => s.status);
  const extractionProgress = useExtractionStore((s) => s.progress);
  const extractionSteps = useExtractionStore((s) => s.steps);
  const extractionError = useExtractionStore((s) => s.error);

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
        </div>
      </div>
    );
  }

  if (extractionStatus === "running") {
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

  return (
    <div className="flex h-screen flex-col">
      <TopBar
        projectName={project.name}
        sourceType={project.sourceType}
        sourceName={project.sourceUrl ? new URL(project.sourceUrl).hostname : undefined}
        onNameChange={(name) => updateProjectName(id, name)}
      />
      <div className="flex-1 overflow-hidden">
        <StudioLayout
          sourcePanel={<SourcePanelPlaceholder />}
          editorPanel={<EditorPanelPlaceholder />}
          testPanel={<TestPanelPlaceholder />}
        />
      </div>
    </div>
  );
}
