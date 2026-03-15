"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";
import { UserMenu } from "./UserMenu";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

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

const LibraryIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 2v12M7 2v12M11 2v12M1 3h4M5 13H1M9 3h4M9 13h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CandidatesIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 1H6a1 1 0 00-1 1v1h6V2a1 1 0 00-1-1zM4 3H3a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1V4a1 1 0 00-1-1h-1M7 8l1.5 1.5L11 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const TokensIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="5" cy="5" r="3" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="11" cy="5" r="3" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="8" cy="11" r="3" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

const TypographyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 3h12M5 3v10M11 3v10M3.5 13h3M9.5 13h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1.5" y="1.5" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="9.5" y="1.5" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="1.5" y="9.5" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="9.5" y="9.5" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

const DriftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 8h3l2-4 2 8 2-4h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const AnalyticsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 14V9M6 14V6M10 14V4M14 14V2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const DocsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 2.5A1.5 1.5 0 013.5 1H10l4 4v8.5a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 012 13.5v-11z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 1v4h4M5.5 8h5M5.5 10.5h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export function Sidebar() {
  const params = useParams();
  const pathname = usePathname();
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
    { label: "Library", href: `${projectBase}/library`, segment: "library", icon: <LibraryIcon /> },
    { label: "Tokens", href: `${projectBase}/tokens`, segment: "tokens", icon: <TokensIcon /> },
    { label: "Typography", href: `${projectBase}/typography`, segment: "typography", icon: <TypographyIcon /> },
    { label: "Icons", href: `${projectBase}/icons`, segment: "icons", icon: <IconsIcon /> },
    { label: "Candidates", href: `${projectBase}/candidates`, segment: "candidates", icon: <CandidatesIcon /> },
    { label: "Drift", href: `${projectBase}/drift`, segment: "drift", icon: <DriftIcon /> },
    { label: "Analytics", href: `${projectBase}/analytics`, segment: "analytics", icon: <AnalyticsIcon /> },
  ];

  function isActive(segment: string): boolean {
    if (!pathname || !projectId) return false;
    const prefix = `/${orgSlug}/projects/${projectId}/`;
    if (pathname.startsWith(prefix)) {
      const current = pathname.slice(prefix.length).split("/")[0];
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
