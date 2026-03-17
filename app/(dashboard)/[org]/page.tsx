"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Trash2, Plus } from "lucide-react";
import { useProjectStore } from "@/lib/store/project";
import { useOnboardingStore } from "@/lib/store/onboarding";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { NewExtractionModal } from "@/components/studio/NewExtractionModal";
import { OnboardingChecklist } from "@/components/onboarding/OnboardingChecklist";

function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function sourceLabel(sourceType: string): string {
  switch (sourceType) {
    case "figma":
      return "Figma";
    case "website":
      return "Website";
    case "manual":
      return "Manual";
    default:
      return sourceType;
  }
}

export default function OrgProjectsPage() {
  const params = useParams();
  const orgSlug = typeof params?.org === "string" ? params.org : "";
  const projects = useProjectStore((s) => s.projects);
  const hydrating = useProjectStore((s) => s.hydrating);
  const deleteProject = useProjectStore((s) => s.deleteProject);
  const markStep = useOnboardingStore((s) => s.markStep);

  const [showNewExtraction, setShowNewExtraction] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Mark 'extracted' step complete whenever at least one project exists
  useEffect(() => {
    if (projects.length > 0) {
      markStep("extracted");
    }
  }, [projects.length, markStep]);

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">
          Projects
        </h1>
        <button
          onClick={() => setShowNewExtraction(true)}
          className="flex items-center gap-1.5 rounded-lg bg-[var(--studio-accent)] px-3.5 py-2 text-xs font-medium text-[var(--text-on-accent)] hover:bg-[var(--studio-accent-hover)] transition-colors"
        >
          <Plus size={14} />
          New Project
        </button>
      </div>

      <div className="mb-6">
        <OnboardingChecklist
          onOpenExtraction={() => setShowNewExtraction(true)}
          onOpenApiKeyModal={() => {}}
          firstProjectId={projects[0]?.id}
          orgSlug={orgSlug}
        />
      </div>

      {hydrating ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--studio-border-strong)] border-t-[var(--studio-accent)]" />
          <p className="text-sm text-[var(--text-muted)]">Loading projects...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
          <p className="text-sm text-[var(--text-muted)]">No projects yet — extract your first design system</p>
          <button
            onClick={() => setShowNewExtraction(true)}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--studio-border)] px-4 py-2 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors"
          >
            <Plus size={14} />
            Extract a design system
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <div
              key={project.id}
              className="group relative rounded-[var(--studio-radius-lg)] border border-[var(--studio-border)] bg-[var(--bg-surface)] transition-all duration-[var(--duration-base)] hover:border-[var(--studio-border-strong)] hover:bg-[var(--bg-hover)]"
            >
              <Link
                href={`/${orgSlug}/projects/${project.id}/studio`}
                className="block p-5"
              >
                <h3 className="mb-2 truncate text-sm font-medium text-[var(--text-primary)]">
                  {project.name}
                </h3>

                <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[var(--studio-accent-subtle)] px-2 py-0.5 text-[var(--studio-accent)]">
                    {sourceLabel(project.sourceType)}
                  </span>

                  {typeof project.tokenCount === "number" && (
                    <span>{project.tokenCount} tokens</span>
                  )}
                </div>

                <p className="mt-3 text-xs text-[var(--text-muted)]">
                  Updated {formatDate(project.updatedAt)}
                </p>
              </Link>
              <button
                onClick={() =>
                  setDeleteTarget({ id: project.id, name: project.name })
                }
                className="absolute right-3 top-3 rounded p-1.5 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 hover:bg-[var(--bg-active)] hover:text-red-400 transition-all"
                aria-label={`Delete ${project.name}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {showNewExtraction && (
        <NewExtractionModal onClose={() => setShowNewExtraction(false)} />
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Delete project"
          message={`Are you sure you want to delete "${deleteTarget.name}"? This action cannot be undone.`}
          confirmLabel="Delete"
          destructive
          onConfirm={() => {
            deleteProject(deleteTarget.id);
            setDeleteTarget(null);
          }}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
