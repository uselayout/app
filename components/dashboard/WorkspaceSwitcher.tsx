"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import { useOrgStore } from "@/lib/store/organization";
import { useProjectStore } from "@/lib/store/project";
import { ChevronRight } from "lucide-react";

interface WorkspaceSwitcherProps {
  collapsed?: boolean;
}

export function WorkspaceSwitcher({ collapsed }: WorkspaceSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [showOrgList, setShowOrgList] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();

  const organizations = useOrgStore((s) => s.organizations);
  const currentOrg = useOrgStore((s) => s.currentOrg);
  const activeOrg = currentOrg();

  const projects = useProjectStore((s) => s.projects);
  const orgSlug = typeof params?.org === "string" ? params.org : "";
  const projectId =
    typeof params?.projectId === "string" ? params.projectId : "";
  const activeProject = projects.find((p) => p.id === projectId);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (ref.current && !ref.current.contains(e.target as Node)) {
      setOpen(false);
      setShowOrgList(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  function displayOrgName(slug: string, name: string): string {
    return slug.startsWith("personal-") ? "Personal" : name;
  }

  function currentSubPage(): string {
    if (!projectId || !pathname) return "studio";
    const prefix = `/${orgSlug}/projects/${projectId}/`;
    if (pathname.startsWith(prefix)) {
      const rest = pathname.slice(prefix.length).split("/")[0];
      return rest || "studio";
    }
    return "studio";
  }

  function handleSelectProject(id: string) {
    setOpen(false);
    setShowOrgList(false);
    const subPage = currentSubPage();
    router.push(`/${orgSlug}/projects/${id}/${subPage}`);
  }

  function handleSelectOrg(slug: string) {
    setOpen(false);
    setShowOrgList(false);
    router.push(`/${slug}`);
  }

  const orgName = activeOrg
    ? displayOrgName(activeOrg.slug, activeOrg.name)
    : "Workspace";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => {
          setOpen((prev) => !prev);
          setShowOrgList(false);
        }}
        title={activeProject ? `${orgName} / ${activeProject.name}` : orgName}
        className={`flex w-full items-center gap-2 rounded-[var(--studio-radius-md)] px-3 py-2 text-sm font-medium text-[var(--text-primary)] transition-all duration-[var(--duration-base)] hover:bg-[var(--bg-hover)] ${
          collapsed ? "justify-center" : ""
        }`}
      >
        {/* Org avatar */}
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[var(--bg-hover)] text-[10px] font-bold text-[var(--text-secondary)]">
          {orgName.charAt(0).toUpperCase()}
        </div>
        {!collapsed && (
          <>
            <div className="flex min-w-0 flex-1 flex-col">
              {activeProject ? (
                <>
                  <span className="truncate text-[11px] text-[var(--text-muted)]">{orgName}</span>
                  <span className="truncate text-sm font-medium text-[var(--text-primary)]">
                    {activeProject.name}
                  </span>
                </>
              ) : (
                <span className="truncate text-sm font-medium text-[var(--text-primary)]">{orgName}</span>
              )}
            </div>
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              className={`shrink-0 text-[var(--text-muted)] transition-transform duration-[var(--duration-base)] ${open ? "rotate-180" : ""}`}
            >
              <path
                d="M3 4.5L6 7.5L9 4.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </>
        )}
      </button>

      {open && (
        <div
          className={`absolute z-50 mt-1 rounded-[var(--studio-radius-lg)] border border-[var(--studio-border)] bg-[var(--bg-elevated)] py-1 shadow-lg ${
            collapsed
              ? "left-full top-0 ml-2 w-56"
              : "left-0 right-0 top-full"
          }`}
        >
          {!showOrgList ? (
            <>
              {/* Project list header */}
              <div className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                Projects
              </div>

              {projects.length === 0 ? (
                <p className="px-3 py-2 text-xs text-[var(--text-muted)]">
                  No projects yet
                </p>
              ) : (
                projects.map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => handleSelectProject(project.id)}
                    className={`flex w-full items-center px-3 py-2 text-left text-sm transition-all duration-[var(--duration-base)] hover:bg-[var(--bg-hover)] ${
                      activeProject?.id === project.id
                        ? "text-[var(--studio-accent)]"
                        : "text-[var(--text-secondary)]"
                    }`}
                  >
                    <span className="truncate">{project.name}</span>
                  </button>
                ))
              )}

              <div className="my-1 border-t border-[var(--studio-border)]" />

              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  router.push(`/${orgSlug}?new=true`);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[var(--text-muted)] transition-all duration-[var(--duration-base)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M7 3v8M3 7h8"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                New project
              </button>

              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  router.push(`/${orgSlug}`);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[var(--text-muted)] transition-all duration-[var(--duration-base)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M2 4a1 1 0 011-1h3.586a1 1 0 01.707.293L8.414 4.414A1 1 0 009.12 4.707H11a1 1 0 011 1V10a1 1 0 01-1 1H3a1 1 0 01-1-1V4z"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                View all projects
              </button>

              {organizations.length > 1 && (
                <>
                  <div className="my-1 border-t border-[var(--studio-border)]" />
                  <button
                    type="button"
                    onClick={() => setShowOrgList(true)}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-[var(--text-muted)] transition-all duration-[var(--duration-base)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                  >
                    Switch organisation
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </>
          ) : (
            <>
              {/* Org list */}
              <button
                type="button"
                onClick={() => setShowOrgList(false)}
                className="flex w-full items-center gap-1.5 px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 10 10"
                  fill="none"
                >
                  <path
                    d="M6 2L3 5L6 8"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Back to projects
              </button>

              {organizations.map((org) => (
                <button
                  key={org.id}
                  type="button"
                  onClick={() => handleSelectOrg(org.slug)}
                  className={`flex w-full items-center px-3 py-2 text-left text-sm transition-all duration-[var(--duration-base)] hover:bg-[var(--bg-hover)] ${
                    activeOrg?.id === org.id
                      ? "text-[var(--studio-accent)]"
                      : "text-[var(--text-secondary)]"
                  }`}
                >
                  <span className="truncate">
                    {displayOrgName(org.slug, org.name)}
                  </span>
                </button>
              ))}

              <div className="my-1 border-t border-[var(--studio-border)]" />

              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setShowOrgList(false);
                  router.push("/create-org");
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[var(--text-muted)] transition-all duration-[var(--duration-base)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M7 3v8M3 7h8"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                Create organisation
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
