"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

const KeyIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.5 8.333a3.333 3.333 0 11-6.667 0 3.333 3.333 0 016.667 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M11.667 11.167l5 5M14.167 13.667l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const WebhookIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 7.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5z" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M10 12.5V17.5M6.25 7.5L3.333 2.5M13.75 7.5l2.917-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const BillingIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2.5" y="4.167" width="15" height="11.667" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M2.5 8.333h15" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M5.833 12.5h3.334" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const MembersIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="7.5" cy="6.667" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M2.5 16.667c0-2.762 2.239-5 5-5s5 2.238 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="14.167" cy="7.5" r="1.667" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M15 11.667a3.333 3.333 0 012.5 3.216v1.784" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
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
          href={`/${orgSlug}/settings/profile`}
          className="flex items-center gap-4 rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] p-4 transition-all duration-[var(--duration-base)] hover:border-[var(--studio-border-strong)] hover:bg-[var(--bg-hover)]"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--studio-accent-subtle)] text-[var(--studio-accent)]">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="10" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M3.5 17.5c0-3.59 2.91-6.5 6.5-6.5s6.5 2.91 6.5 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              Profile
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              Update your name and change your password
            </p>
          </div>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[var(--text-muted)]">
            <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>

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
          href={`/${orgSlug}/settings/billing`}
          className="flex items-center gap-4 rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] p-4 transition-all duration-[var(--duration-base)] hover:border-[var(--studio-border-strong)] hover:bg-[var(--bg-hover)]"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--studio-accent-subtle)] text-[var(--studio-accent)]">
            <BillingIcon />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              Billing
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              Manage your subscription, credits, and usage
            </p>
          </div>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[var(--text-muted)]">
            <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>

        <Link
          href={`/${orgSlug}/settings/members`}
          className="flex items-center gap-4 rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] p-4 transition-all duration-[var(--duration-base)] hover:border-[var(--studio-border-strong)] hover:bg-[var(--bg-hover)]"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--studio-accent-subtle)] text-[var(--studio-accent)]">
            <MembersIcon />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              Members
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              Invite team members and manage roles
            </p>
          </div>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[var(--text-muted)]">
            <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>

        <Link
          href={`/${orgSlug}/settings/webhooks`}
          className="flex items-center gap-4 rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] p-4 transition-all duration-[var(--duration-base)] hover:border-[var(--studio-border-strong)] hover:bg-[var(--bg-hover)]"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--studio-accent-subtle)] text-[var(--studio-accent)]">
            <WebhookIcon />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              Webhooks
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              Configure Figma webhooks for automatic design sync
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
