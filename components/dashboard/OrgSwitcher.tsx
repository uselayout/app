"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useOrgStore } from "@/lib/store/organization";

export function OrgSwitcher() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const organizations = useOrgStore((s) => s.organizations);
  const currentOrg = useOrgStore((s) => s.currentOrg);
  const activeOrg = currentOrg();

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (ref.current && !ref.current.contains(e.target as Node)) {
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  function displayName(slug: string, name: string): string {
    return slug.startsWith("personal-") ? "Personal" : name;
  }

  function handleSelect(slug: string) {
    setOpen(false);
    router.push(`/${slug}`);
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
          {activeOrg
            ? displayName(activeOrg.slug, activeOrg.name)
            : "Select organisation"}
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
          {organizations.map((org) => (
            <button
              key={org.id}
              type="button"
              onClick={() => handleSelect(org.slug)}
              className={`flex w-full items-center px-3 py-2 text-left text-sm transition-all duration-[var(--duration-base)] hover:bg-[var(--bg-hover)] ${
                activeOrg?.id === org.id
                  ? "text-[var(--studio-accent)]"
                  : "text-[var(--text-secondary)]"
              }`}
            >
              <span className="truncate">
                {displayName(org.slug, org.name)}
              </span>
            </button>
          ))}

          <div className="my-1 border-t border-[var(--studio-border)]" />

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              router.push("/create-org");
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[var(--text-muted)] transition-all duration-[var(--duration-base)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 3v8M3 7h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Create organisation
          </button>
        </div>
      )}
    </div>
  );
}
