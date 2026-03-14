"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { OrgSwitcher } from "./OrgSwitcher";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const FolderIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 4a1 1 0 011-1h3.586a1 1 0 01.707.293L8.414 4.414A1 1 0 009.12 4.707H13a1 1 0 011 1V12a1 1 0 01-1 1H3a1 1 0 01-1-1V4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
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

const AnalyticsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 14V9M6 14V6M10 14V4M14 14V2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SettingsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 10a2 2 0 100-4 2 2 0 000 4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M13.05 10.13a1.1 1.1 0 00.22 1.213l.04.04a1.333 1.333 0 11-1.887 1.887l-.04-.04a1.1 1.1 0 00-1.213-.22 1.1 1.1 0 00-.667 1.007v.113a1.333 1.333 0 11-2.667 0v-.06A1.1 1.1 0 005.87 13.05a1.1 1.1 0 00-1.213.22l-.04.04a1.333 1.333 0 11-1.887-1.887l.04-.04a1.1 1.1 0 00.22-1.213 1.1 1.1 0 00-1.007-.667H1.87a1.333 1.333 0 010-2.667h.06A1.1 1.1 0 002.95 5.87a1.1 1.1 0 00-.22-1.213l-.04-.04A1.333 1.333 0 114.577 2.73l.04.04a1.1 1.1 0 001.213.22h.053a1.1 1.1 0 00.667-1.007V1.87a1.333 1.333 0 012.667 0v.06a1.1 1.1 0 00.667 1.007 1.1 1.1 0 001.213-.22l.04-.04a1.333 1.333 0 111.887 1.887l-.04.04a1.1 1.1 0 00-.22 1.213v.053a1.1 1.1 0 001.007.667h.113a1.333 1.333 0 010 2.667h-.06a1.1 1.1 0 00-1.007.667z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export function Sidebar() {
  const params = useParams();
  const pathname = usePathname();
  const orgSlug = typeof params?.org === "string" ? params.org : "";

  const navItems: NavItem[] = [
    {
      label: "Projects",
      href: `/${orgSlug}`,
      icon: <FolderIcon />,
    },
    {
      label: "Library",
      href: `/${orgSlug}/library`,
      icon: <LibraryIcon />,
    },
    {
      label: "Tokens",
      href: `/${orgSlug}/tokens`,
      icon: <TokensIcon />,
    },
    {
      label: "Typography",
      href: `/${orgSlug}/typography`,
      icon: <TypographyIcon />,
    },
    {
      label: "Icons",
      href: `/${orgSlug}/icons`,
      icon: <IconsIcon />,
    },
    {
      label: "Candidates",
      href: `/${orgSlug}/candidates`,
      icon: <CandidatesIcon />,
    },
    {
      label: "Analytics",
      href: `/${orgSlug}/analytics`,
      icon: <AnalyticsIcon />,
    },
  ];

  function isActive(href: string): boolean {
    if (href === `/${orgSlug}`) {
      return pathname === href;
    }
    return pathname?.startsWith(href) ?? false;
  }

  return (
    <aside className="flex h-full w-60 flex-col border-r border-[var(--studio-border)] bg-[var(--bg-panel)]">
      {/* Top: Org Switcher */}
      <div className="border-b border-[var(--studio-border)] p-3">
        <OrgSwitcher />
      </div>

      {/* Nav items */}
      <nav className="flex-1 p-2">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center gap-2.5 rounded-[var(--studio-radius-md)] px-3 py-2 text-sm transition-all duration-[var(--duration-base)] ${
                  isActive(item.href)
                    ? "bg-[var(--studio-accent-subtle)] text-[var(--studio-accent)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom: Settings */}
      <div className="border-t border-[var(--studio-border)] p-2">
        <Link
          href={`/${orgSlug}/settings`}
          className={`flex items-center gap-2.5 rounded-[var(--studio-radius-md)] px-3 py-2 text-sm transition-all duration-[var(--duration-base)] ${
            pathname?.startsWith(`/${orgSlug}/settings`)
              ? "bg-[var(--studio-accent-subtle)] text-[var(--studio-accent)]"
              : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
          }`}
        >
          <SettingsIcon />
          Settings
        </Link>
      </div>
    </aside>
  );
}
