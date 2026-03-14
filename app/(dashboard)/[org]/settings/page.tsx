"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

const KeyIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.5 8.333a3.333 3.333 0 11-6.667 0 3.333 3.333 0 016.667 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M11.667 11.167l5 5M14.167 13.667l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const AuditIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6.667 5h10M6.667 10h10M6.667 15h10M3.333 5h.008M3.333 10h.008M3.333 15h.008" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const TemplateIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2.5" y="2.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <rect x="11.5" y="2.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <rect x="2.5" y="11.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14.5 12.5v5M12 14.5h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function SettingsPage() {
  const params = useParams();
  const orgSlug = typeof params?.org === "string" ? params.org : "";

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
        Settings
      </h1>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">
        Manage your organisation settings
      </p>

      <div className="mt-8 space-y-3">
        <Link
          href={`/${orgSlug}/settings/api-keys`}
          className="flex items-center gap-4 rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] p-4 transition-all duration-[var(--duration-base)] hover:border-[var(--studio-border-strong)] hover:bg-[var(--bg-hover)]"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--studio-accent-subtle)] text-[var(--studio-accent)]">
            <KeyIcon />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              API Keys
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              Manage keys for programmatic access to your design system
            </p>
          </div>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[var(--text-muted)]">
            <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>

        <Link
          href={`/${orgSlug}/settings/audit`}
          className="flex items-center gap-4 rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] p-4 transition-all duration-[var(--duration-base)] hover:border-[var(--studio-border-strong)] hover:bg-[var(--bg-hover)]"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--studio-accent-subtle)] text-[var(--studio-accent)]">
            <AuditIcon />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              Audit Log
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              View activity history for your organisation
            </p>
          </div>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[var(--text-muted)]">
            <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>

        <Link
          href={`/${orgSlug}/settings/templates`}
          className="flex items-center gap-4 rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] p-4 transition-all duration-[var(--duration-base)] hover:border-[var(--studio-border-strong)] hover:bg-[var(--bg-hover)]"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--studio-accent-subtle)] text-[var(--studio-accent)]">
            <TemplateIcon />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              Templates
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              Publish your design system as a reusable template
            </p>
          </div>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[var(--text-muted)]">
            <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
      </div>
    </div>
  );
}
