"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useParams, usePathname, useSearchParams } from "next/navigation";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";
import { UserMenu } from "./UserMenu";
import { PanelLeftClose, PanelLeftOpen, BookMarked } from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  segment: string;
  icon: React.ReactNode;
}

const COLLAPSED_KEY = "layout_sidebar_collapsed";

const StudioIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M5.5 2.5v11M10.5 2.5v11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

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

  useEffect(() => {
    localStorage.setItem(COLLAPSED_KEY, String(collapsed));
  }, [collapsed]);

  const projectBase = projectId
    ? `/${orgSlug}/projects/${projectId}`
    : `/${orgSlug}`;

  const navItems: NavItem[] = [
    { label: "Studio", href: `${projectBase}/studio`, segment: "studio", icon: <StudioIcon /> },
    { label: "Saved", href: `${projectBase}/studio?tab=saved`, segment: "saved", icon: <BookMarked size={16} /> },
  ];

  function isActive(segment: string): boolean {
    if (!pathname || !projectId) return false;
    const prefix = `/${orgSlug}/projects/${projectId}/`;
    if (pathname.startsWith(prefix)) {
      const current = pathname.slice(prefix.length).split("/")[0];
      // "Saved" uses studio path + ?tab=saved query param
      if (segment === "saved") {
        return current === "studio" && searchParams.get("tab") === "saved";
      }
      // "Studio" is active when on studio without the saved tab
      if (segment === "studio") {
        return current === "studio" && searchParams.get("tab") !== "saved";
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
                className={`flex items-center gap-2.5 rounded-[var(--studio-radius-md)] px-3 py-2 text-sm transition-all duration-[var(--duration-base)] ${
                  collapsed ? "justify-center" : ""
                } ${
                  isActive(item.segment)
                    ? "bg-[var(--studio-accent-subtle)] text-[var(--studio-accent)]"
                    : projectId
                      ? "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                      : "text-[var(--text-muted)] cursor-default"
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
