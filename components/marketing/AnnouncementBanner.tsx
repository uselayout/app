'use client';

import { useState } from 'react';

export function AnnouncementBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="w-full bg-[var(--mkt-accent)] py-[10px] px-4 flex items-center justify-center relative">
      <p className="text-[14px] text-[#08090a] font-sans text-center pr-10">
        <span className="hidden sm:inline">We&apos;re looking for 50 teams shipping UI with AI agents.{' '}</span>
        <span className="sm:hidden">Ship UI with AI agents.{' '}</span>
        <a
          href="/request-access"
          className="underline underline-offset-2 hover:opacity-80 transition-opacity"
        >
          Join early access →
        </a>
      </p>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss announcement"
        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#08090a] hover:opacity-60 transition-opacity p-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path
            d="M1 1L13 13M13 1L1 13"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}
