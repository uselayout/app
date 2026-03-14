"use client";

import Link from "next/link";
import { useProjectStore } from "@/lib/store/project";

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
  const projects = useProjectStore((s) => s.projects);

  return (
    <div className="p-8">
      <h1 className="mb-6 text-xl font-semibold text-[var(--text-primary)]">
        Projects
      </h1>

      {projects.length === 0 ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <p className="text-sm text-[var(--text-muted)]">No projects yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/studio/${project.id}`}
              className="group rounded-[var(--studio-radius-lg)] border border-[var(--studio-border)] bg-[var(--bg-surface)] p-5 transition-all duration-[var(--duration-base)] hover:border-[var(--studio-border-strong)] hover:bg-[var(--bg-hover)]"
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
          ))}
        </div>
      )}
    </div>
  );
}
