'use client';

import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { MockFrame } from '@/components/marketing/MockFrame';
import { STUDIO_TOKENS } from '@/components/marketing/mocks/_studio-chrome';

const T = STUDIO_TOKENS;

type DiffKind = 'added' | 'modified' | 'removed';

const DIFF_KIND_STYLE: Record<DiffKind, { label: string; symbol: string; color: string }> = {
  added: { label: 'Added', symbol: '+', color: T.statusSuccess },
  modified: { label: 'Modified', symbol: '~', color: T.statusWarning },
  removed: { label: 'Removed', symbol: '−', color: T.statusError },
};

const DIFF_ROWS: Array<{
  kind: DiffKind;
  token: string;
  from?: string;
  to?: string;
  swatchFrom?: string;
  swatchTo?: string;
}> = [
  { kind: 'modified', token: '--color-primary', from: '#6E56CF', to: '#5B45C4', swatchFrom: '#6E56CF', swatchTo: '#5B45C4' },
  { kind: 'modified', token: '--radius-md', from: '10px', to: '8px' },
  { kind: 'added', token: '--color-accent-subtle', to: 'rgba(91,69,196,0.12)', swatchTo: 'rgba(91,69,196,0.35)' },
  { kind: 'added', token: '--space-18', to: '72px' },
  { kind: 'modified', token: 'Heading / H1', from: '32px · 600', to: '36px · 600' },
  { kind: 'removed', token: '--shadow-card-legacy', from: '0 2px 8px rgba(0,0,0,0.4)' },
];

/** Static illustration of the re-extraction token diff, mirrors ExtractionDiffModal. */
function DriftDiffCard() {
  return (
    <div
      className="w-full max-w-[620px] overflow-hidden rounded-xl border"
      style={{
        backgroundColor: T.bgElevated,
        borderColor: T.borderStrong,
        color: T.textPrimary,
        fontFamily: '"Geist", "Inter", -apple-system, sans-serif',
        colorScheme: 'dark',
        boxShadow: '0 0 80px rgba(0,0,0,0.6)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between border-b px-5 py-3.5"
        style={{ borderColor: T.border }}
      >
        <div className="flex items-center gap-2">
          <RefreshCw className="h-3.5 w-3.5" style={{ color: T.brand }} />
          <span className="text-[13px] font-semibold">Extraction diff</span>
          <span className="font-mono text-[10px]" style={{ color: T.textMuted }}>
            figma · acme-design-system
          </span>
        </div>
        <span
          className="rounded px-1.5 py-0.5 font-mono text-[10px]"
          style={{
            backgroundColor: 'rgba(228,242,34,0.08)',
            color: T.brand,
            border: '1px solid rgba(228,242,34,0.25)',
          }}
        >
          webhook · FILE_UPDATE
        </span>
      </div>

      {/* Summary strip */}
      <div
        className="flex items-center gap-3 border-b px-5 py-2 text-[10.5px] font-mono"
        style={{ borderColor: T.border, color: T.textMuted }}
      >
        <span style={{ color: T.statusSuccess }}>+2 added</span>
        <span style={{ color: T.statusWarning }}>~3 modified</span>
        <span style={{ color: T.statusError }}>−1 removed</span>
      </div>

      {/* Rows */}
      <div className="flex flex-col gap-1.5 p-4">
        {DIFF_ROWS.map((row) => {
          const kind = DIFF_KIND_STYLE[row.kind];
          return (
            <div
              key={row.token}
              className="flex items-center gap-2.5 rounded-md border px-3 py-2"
              style={{ borderColor: T.border, backgroundColor: T.bgSurface }}
            >
              <span
                className="w-3 shrink-0 text-center font-mono text-[11px]"
                style={{ color: kind.color }}
              >
                {kind.symbol}
              </span>
              <span
                className="min-w-0 flex-1 truncate font-mono text-[11px]"
                style={{ color: T.textPrimary }}
              >
                {row.token}
              </span>
              <span className="flex shrink-0 items-center gap-1.5 font-mono text-[10.5px]">
                {row.from && (
                  <span className="flex items-center gap-1">
                    {row.swatchFrom && (
                      <span
                        className="h-2.5 w-2.5 rounded-sm border"
                        style={{ backgroundColor: row.swatchFrom, borderColor: T.border }}
                      />
                    )}
                    <span style={{ color: row.to ? T.statusError : T.textMuted }}>{row.from}</span>
                  </span>
                )}
                {row.from && row.to && <span style={{ color: T.textMuted }}>→</span>}
                {row.to && (
                  <span className="flex items-center gap-1">
                    {row.swatchTo && (
                      <span
                        className="h-2.5 w-2.5 rounded-sm border"
                        style={{ backgroundColor: row.swatchTo, borderColor: T.border }}
                      />
                    )}
                    <span style={{ color: T.statusSuccess }}>{row.to}</span>
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between border-t px-5 py-3"
        style={{ borderColor: T.border }}
      >
        <span className="text-[10px]" style={{ color: T.textMuted }}>
          layout.md updates the moment you accept.
        </span>
        <div className="flex items-center gap-2">
          <span
            className="flex h-7 items-center rounded-[4px] border px-3 text-[11.5px]"
            style={{ borderColor: T.borderStrong, color: T.textSecondary }}
          >
            Discard
          </span>
          <span
            className="flex h-7 items-center rounded-[4px] px-3 text-[11.5px] font-medium"
            style={{ backgroundColor: T.accent, color: T.textOnAccent }}
          >
            Accept changes
          </span>
        </div>
      </div>
    </div>
  );
}

export function DriftSection() {
  return (
    <section className="bg-[var(--mkt-bg)] pt-[100px] lg:pt-[180px] flex flex-col items-center gap-[70px]">
      <div className="max-w-[1280px] w-full px-6">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between w-full">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="w-full lg:max-w-[509px]"
          >
            <p className="text-[28px] leading-[34px] md:text-[40px] md:leading-[48px] lg:text-[54px] lg:leading-[64px] tracking-[-1.408px] font-normal text-[var(--mkt-text-primary)]">Figma changes.</p>
            <p className="text-[28px] leading-[34px] md:text-[40px] md:leading-[48px] lg:text-[54px] lg:leading-[64px] tracking-[-1.408px] font-normal text-[var(--mkt-text-primary)]">Your AI knows.</p>
            <p className="text-[28px] leading-[34px] md:text-[40px] md:leading-[48px] lg:text-[54px] lg:leading-[64px] tracking-[-1.408px] font-normal text-[var(--mkt-accent)]">Instantly.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="w-full lg:w-[683px] pt-[19px] flex flex-col gap-[10px]"
          >
            <p className="text-[20px] leading-[24px] text-white tracking-[-0.165px]">
              Design tokens don&apos;t stay static. Someone updates the primary colour, renames a component, tightens the spacing scale. Your codebase doesn&apos;t know any of it happened.
            </p>
            <p className="text-[15px] leading-[24px] text-[var(--mkt-text-secondary)] tracking-[-0.165px]">
              Layout watches your Figma file via webhook. When a change lands, re-extract to diff the tokens against your current design system: see exactly what was added, removed, or modified. Token by token.
            </p>
            <p className="text-[15px] leading-[24px] text-[var(--mkt-text-secondary)] tracking-[-0.165px]">
              Accept the changes and your layout.md updates immediately. Your AI agent reads the latest design system on the next prompt. The gap never has time to open.
            </p>
            <p className="text-[15px] leading-[24px] text-[var(--mkt-accent)] tracking-[-0.165px]">
              Always current. One click.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Desktop: diff card floating over the aurora, framed like sibling mocks */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="hidden md:block w-[1280px] max-w-full mx-auto aspect-[1280/720] relative overflow-hidden rounded-[6px]"
      >
        <img
          src="/marketing/aurora-drift.webp"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />
        <div className="absolute inset-3 lg:inset-5">
          <MockFrame ariaLabel="Token diff after a Figma change lands via webhook">
            <div
              className="absolute inset-0 flex items-center justify-center p-6"
              style={{ backgroundColor: T.bgApp }}
            >
              <DriftDiffCard />
            </div>
          </MockFrame>
        </div>
      </motion.div>
      {/* Mobile: diff card at natural height */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
        className="md:hidden w-full max-w-[420px] mx-auto px-4"
      >
        <DriftDiffCard />
      </motion.div>
    </section>
  );
}
