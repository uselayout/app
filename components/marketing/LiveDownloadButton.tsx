'use client';

import { useEffect, useState } from 'react';

// Stable "latest" URLs — the host copies each new release to these names, so
// this page never needs a version bump. (Auto-update handles upgrades after
// the first install; this is just the initial download.)
const DMG_ARM64 = 'https://updates.layout.design/live/layout-live-arm64.dmg';
const DMG_X64 = 'https://updates.layout.design/live/layout-live-x64.dmg';

type Plausible = (event: string, opts?: { props?: Record<string, string> }) => void;

function track(arch: string) {
  (window as unknown as { plausible?: Plausible }).plausible?.(
    'Download Layout Live',
    { props: { arch } }
  );
}

/**
 * macOS arch can't be read reliably from `navigator.userAgent` (Apple Silicon
 * reports "Intel Mac OS X"). We try the Chromium high-entropy hint; otherwise
 * we default to Apple Silicon (the overwhelming majority of current Macs) and
 * always expose an explicit Intel link.
 */
export function LiveDownloadButton() {
  const [isArm, setIsArm] = useState(true);

  useEffect(() => {
    const uaData = (
      navigator as unknown as {
        userAgentData?: {
          getHighEntropyValues?: (h: string[]) => Promise<{ architecture?: string }>;
        };
      }
    ).userAgentData;
    uaData?.getHighEntropyValues?.(['architecture'])
      .then((v) => {
        if (v.architecture && v.architecture !== 'arm') setIsArm(false);
      })
      .catch(() => {});
  }, []);

  const primaryHref = isArm ? DMG_ARM64 : DMG_X64;
  const primaryArch = isArm ? 'arm64' : 'x64';
  const otherHref = isArm ? DMG_X64 : DMG_ARM64;
  const otherLabel = isArm ? 'Intel Mac' : 'Apple Silicon';
  const otherArch = isArm ? 'x64' : 'arm64';

  return (
    <div className="flex flex-col items-center gap-3 sm:items-start">
      <div className="flex flex-wrap items-center gap-3">
        <a
          href={primaryHref}
          onClick={() => track(primaryArch)}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--mkt-btn-primary-bg)] px-6 py-3 text-[15px] font-medium text-[var(--mkt-bg)] transition-opacity hover:opacity-90"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M16.365 1.43c0 1.14-.49 2.27-1.3 3.07-.86.84-2.13 1.47-3.34 1.38-.14-1.13.42-2.32 1.18-3.08.84-.86 2.3-1.49 3.46-1.5.04.04 0 .08 0 .13ZM20.7 17.13c-.6 1.4-.9 2.02-1.67 3.26-1.08 1.74-2.6 3.9-4.48 3.92-1.67.02-2.1-1.09-4.36-1.08-2.27.01-2.74 1.1-4.4 1.09-1.89-.02-3.33-1.97-4.4-3.7-3.01-4.86-3.33-10.56-1.47-13.6 1.32-2.16 3.4-3.42 5.36-3.42 2 0 3.25 1.1 4.9 1.1 1.6 0 2.58-1.1 4.9-1.1 1.75 0 3.6.95 4.92 2.6-4.32 2.37-3.62 8.55.1 10.83Z" />
          </svg>
          Download for Mac
        </a>
        <a
          href="/docs/live"
          className="inline-flex items-center rounded-full border border-[var(--mkt-border)] px-6 py-3 text-[15px] font-medium text-[var(--mkt-text-primary)] transition-colors hover:border-[var(--mkt-text-secondary)]"
        >
          Read the docs
        </a>
      </div>
      <p className="text-[13px] text-[var(--mkt-text-secondary)]">
        Free alpha · macOS (Apple Silicon &amp; Intel) ·{' '}
        <a
          href={otherHref}
          onClick={() => track(otherArch)}
          className="text-[var(--mkt-accent)] underline-offset-2 hover:underline"
        >
          {otherLabel} build
        </a>
      </p>
    </div>
  );
}
