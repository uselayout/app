'use client';

import { useEffect, useState } from 'react';

// Instrumented download entry points: these log a `live.download` event then
// 302 to the notarised DMG on the update host, so downloads show in the admin
// dashboard. (Auto-update handles upgrades after the first install; this is
// just the initial download.)
const DMG_ARM64 = '/api/download/live?arch=arm64';
const DMG_X64 = '/api/download/live?arch=x64';

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
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.043 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
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
