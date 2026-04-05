"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useParams, usePathname, useSearchParams } from "next/navigation";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";
import { UserMenu } from "./UserMenu";
import { PanelLeftClose, PanelLeftOpen, BookMarked, Palette, Pencil, Sparkles, MessageCircle, Mail } from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  segment: string;
  icon: React.ReactNode;
}

const COLLAPSED_KEY = "layout_sidebar_collapsed";

const DocsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 2.5A1.5 1.5 0 013.5 1H10l4 4v8.5a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 012 13.5v-11z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 1v4h4M5.5 8h5M5.5 10.5h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export function Sidebar() {
  return (
    <Suspense>
      <SidebarInner />
    </Suspense>
  );
}

function SidebarInner() {
  const params = useParams();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const orgSlug = typeof params?.org === "string" ? params.org : "";
  const projectId = typeof params?.projectId === "string" ? params.projectId : "";

  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(COLLAPSED_KEY) === "true";
  });
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const feedbackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem(COLLAPSED_KEY, String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    if (!feedbackOpen) return;
    function handleClick(e: MouseEvent) {
      if (feedbackRef.current && !feedbackRef.current.contains(e.target as Node)) {
        setFeedbackOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [feedbackOpen]);

  const projectBase = projectId
    ? `/${orgSlug}/projects/${projectId}`
    : `/${orgSlug}`;

  const navItems: NavItem[] = [
    { label: "Editor", href: `${projectBase}/studio`, segment: "editor", icon: <Pencil size={16} /> },
    { label: "Explore", href: `${projectBase}/studio?view=explore`, segment: "explore", icon: <Sparkles size={16} /> },
    { label: "Design System", href: `${projectBase}/studio?view=design-system`, segment: "design-system", icon: <Palette size={16} /> },
    { label: "Library", href: `${projectBase}/studio?view=saved`, segment: "saved", icon: <BookMarked size={16} /> },
  ];

  function isActive(segment: string): boolean {
    if (!pathname || !projectId) return false;
    const prefix = `/${orgSlug}/projects/${projectId}/`;
    if (pathname.startsWith(prefix)) {
      const current = pathname.slice(prefix.length).split("/")[0];
      const viewParam = searchParams.get("view");
      if (segment === "saved") {
        return current === "studio" && viewParam === "saved";
      }
      if (segment === "design-system") {
        return current === "studio" && viewParam === "design-system";
      }
      if (segment === "explore") {
        return current === "studio" && viewParam === "explore";
      }
      // "Editor" is active when on studio without a view param
      if (segment === "editor") {
        return current === "studio" && !viewParam;
      }
      return current === segment;
    }
    return false;
  }

  return (
    <aside
      className={`flex h-full flex-col border-r border-[var(--studio-border)] bg-[var(--bg-panel)] transition-all duration-200 ${
        collapsed ? "w-14" : "w-60"
      }`}
    >
      {/* Workspace Switcher */}
      <div className="border-b border-[var(--studio-border)] p-2">
        <WorkspaceSwitcher collapsed={collapsed} />
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto p-2">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.segment} className="relative group">
              <Link
                href={projectId ? item.href : `/${orgSlug}`}
                aria-disabled={!projectId}
                tabIndex={projectId ? undefined : -1}
                onClick={projectId ? undefined : (e) => e.preventDefault()}
                className={`flex items-center gap-2.5 rounded-[var(--studio-radius-md)] px-3 py-2 text-sm transition-all duration-[var(--duration-base)] ${
                  collapsed ? "justify-center" : ""
                } ${
                  isActive(item.segment)
                    ? "bg-[var(--studio-accent-subtle)] text-[var(--studio-accent)]"
                    : projectId
                      ? "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                      : "text-[var(--text-muted)] cursor-default pointer-events-none"
                }`}
              >
                <span className="shrink-0">{item.icon}</span>
                {!collapsed && item.label}
              </Link>
              {/* Tooltip when collapsed */}
              {collapsed && (
                <div className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 rounded-md bg-[var(--bg-elevated)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-primary)] opacity-0 shadow-lg border border-[var(--studio-border)] transition-opacity group-hover:opacity-100">
                  {item.label}
                </div>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom: User + Docs + Collapse */}
      <div className="border-t border-[var(--studio-border)] p-2 space-y-1">
        <UserMenu collapsed={collapsed} />

        <div className="relative group">
          <Link
            href="/docs"
            className={`flex items-center gap-2.5 rounded-[var(--studio-radius-md)] px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-all duration-[var(--duration-base)] ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <DocsIcon />
            {!collapsed && "Docs"}
          </Link>
          {collapsed && (
            <div className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 rounded-md bg-[var(--bg-elevated)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-primary)] opacity-0 shadow-lg border border-[var(--studio-border)] transition-opacity group-hover:opacity-100">
              Docs
            </div>
          )}
        </div>

        {/* Feedback */}
        <div className="relative" ref={feedbackRef}>
          <button
            type="button"
            onClick={() => setFeedbackOpen((prev) => !prev)}
            className={`flex w-full items-center gap-2.5 rounded-[var(--studio-radius-md)] px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-all duration-[var(--duration-base)] ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <MessageCircle size={16} />
            {!collapsed && "Feedback"}
          </button>
          {collapsed && !feedbackOpen && (
            <div className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 rounded-md bg-[var(--bg-elevated)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-primary)] opacity-0 shadow-lg border border-[var(--studio-border)] transition-opacity group-hover:opacity-100">
              Feedback
            </div>
          )}
          {feedbackOpen && (
            <div
              className={`absolute z-50 rounded-lg border border-[var(--studio-border)] bg-[var(--bg-elevated)] p-1 shadow-lg ${
                collapsed ? "left-full ml-2 top-1/2 -translate-y-1/2 w-40" : "bottom-full mb-1 left-0 w-full"
              }`}
            >
              <a
                href="mailto:hello@layout.design"
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-all duration-[var(--duration-base)]"
                onClick={() => setFeedbackOpen(false)}
              >
                <Mail size={14} />
                Email
              </a>
              <a
                href="https://layout.design/discord"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-all duration-[var(--duration-base)]"
                onClick={() => setFeedbackOpen(false)}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M13.545 2.907a13.227 13.227 0 00-3.257-1.011.05.05 0 00-.052.025c-.141.25-.297.577-.406.833a12.19 12.19 0 00-3.658 0 8.258 8.258 0 00-.412-.833.051.051 0 00-.052-.025c-1.125.194-2.22.534-3.257 1.011a.041.041 0 00-.021.018C.356 6.024-.213 9.047.066 12.032c.001.014.01.028.021.037a13.276 13.276 0 003.995 2.02.05.05 0 00.056-.019c.308-.42.582-.863.818-1.329a.05.05 0 00-.028-.07 8.735 8.735 0 01-1.248-.595.05.05 0 01-.005-.083c.084-.063.168-.129.248-.195a.05.05 0 01.051-.007c2.619 1.196 5.454 1.196 8.041 0a.05.05 0 01.053.007c.08.066.164.132.248.195a.05.05 0 01-.004.083c-.399.233-.813.44-1.249.595a.05.05 0 00-.027.07c.24.466.514.909.817 1.329a.05.05 0 00.056.019 13.235 13.235 0 004.001-2.02.049.049 0 00.021-.037c.334-3.451-.559-6.449-2.366-9.106a.034.034 0 00-.02-.019z"/></svg>
                Discord
              </a>
            </div>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          className={`flex w-full items-center gap-2.5 rounded-[var(--studio-radius-md)] px-3 py-2 text-sm text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-all duration-[var(--duration-base)] ${
            collapsed ? "justify-center" : ""
          }`}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <>
              <PanelLeftClose className="h-4 w-4" />
              Collapse
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
