"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import { useProjectStore } from "@/lib/store/project";

export function ProjectSwitcher() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();

  const projects = useProjectStore((s) => s.projects);

  const orgSlug = typeof params?.org === "string" ? params.org : "";
  const projectId = typeof params?.projectId === "string" ? params.projectId : "";

  const activeProject = projects.find((p) => p.id === projectId);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (ref.current && !ref.current.contains(e.target as Node)) {
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  /** Extract the current sub-page (tokens, library, etc.) from the URL */
  function currentSubPage(): string {
    if (!projectId || !pathname) return "studio";
    const prefix = `/${orgSlug}/projects/${projectId}/`;
    if (pathname.startsWith(prefix)) {
      const rest = pathname.slice(prefix.length).split("/")[0];
      return rest || "studio";
    }
    return "studio";
  }

  function handleSelect(id: string) {
    setOpen(false);
    const subPage = currentSubPage();
    router.push(`/${orgSlug}/projects/${id}/${subPage}`);
  }

  return (
    <div className="relative" ref={ref}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-2 rounded-[var(--studio-radius-md)] px-3 py-2 text-sm font-medium text-[var(--text-primary)] transition-all duration-[var(--duration-base)] hover:bg-[var(--bg-hover)]"
      >
        <span className="truncate">
          {activeProject ? activeProject.name : "Select project"}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          className={`shrink-0 transition-transform duration-[var(--duration-base)] ${open ? "rotate-180" : ""}`}
        >
          <path
            d="M3 4.5L6 7.5L9 4.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-[var(--studio-radius-lg)] border border-[var(--studio-border)] bg-[var(--bg-elevated)] py-1 shadow-lg">
          {projects.map((project) => (
            <button
              key={project.id}
              type="button"
              onClick={() => handleSelect(project.id)}
              className={`flex w-full items-center px-3 py-2 text-left text-sm transition-all duration-[var(--duration-base)] hover:bg-[var(--bg-hover)] ${
                activeProject?.id === project.id
                  ? "text-[var(--studio-accent)]"
                  : "text-[var(--text-secondary)]"
              }`}
            >
              <span className="truncate">{project.name}</span>
            </button>
          ))}

          <div className="my-1 border-t border-[var(--studio-border)]" />

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              router.push(`/${orgSlug}`);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[var(--text-muted)] transition-all duration-[var(--duration-base)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 4a1 1 0 011-1h3.586a1 1 0 01.707.293L8.414 4.414A1 1 0 009.12 4.707H11a1 1 0 011 1V10a1 1 0 01-1 1H3a1 1 0 01-1-1V4z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            View all projects
          </button>
        </div>
      )}
    </div>
  );
}
