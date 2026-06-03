'use client';

import { useEffect, useState } from 'react';
import {
  motion,
  animate,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
} from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Smartphone,
  Tablet,
  Monitor,
  Magnet,
  Settings,
} from 'lucide-react';
import { STUDIO_TOKENS, MODE_TOKENS } from '@/components/marketing/mocks/_studio-chrome';

const T = STUDIO_TOKENS;
const LIGHT = MODE_TOKENS.light;
const LIME = '#E4F222';

/** The Layout brand mark (filled), tinted by `color`. */
function LogoMark({ size = 16, color = T.accent }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18.5586 18.5586" fill={color} aria-hidden>
      <path d="M13.7168 0C16.3906 0 18.5586 2.16798 18.5586 4.8418V18.5586H0V0H13.7168ZM1.61426 16.9443H5.64844V12.9102H1.61426V16.9443ZM7.26172 12.9102V16.9443H16.9453V12.9102H7.26172ZM1.61426 11.2969H5.64844V1.61426H1.61426V11.2969Z" />
    </svg>
  );
}

function TopButton({
  children,
  active,
  muted,
}: {
  children: React.ReactNode;
  active?: boolean;
  muted?: boolean;
}) {
  return (
    <span
      className="flex h-6 w-6 items-center justify-center rounded-md"
      style={{
        color: muted ? T.textMuted : active ? T.textPrimary : T.textSecondary,
        background: active ? T.accentSubtle : 'transparent',
        border: active ? `1px solid ${T.borderStrong}` : '1px solid transparent',
      }}
    >
      {children}
    </span>
  );
}

function Chip({ children, mono }: { children: React.ReactNode; mono?: boolean }) {
  return (
    <span
      className={`truncate rounded px-2 py-1 text-[11px] ${mono ? 'font-mono' : ''}`}
      style={{ background: T.bgSurface, color: T.textSecondary }}
    >
      {children}
    </span>
  );
}

export function LayoutLiveMock() {
  // Looping "scrub" on padding — the value the Properties panel shows AND the
  // visual padding of the selected button animate together (16 → 24 → 16).
  const pad = useMotionValue(16);
  const padPx = useTransform(pad, (v) => `${Math.round(v)}px`);
  const [padNum, setPadNum] = useState(16);
  useMotionValueEvent(pad, 'change', (v) => setPadNum(Math.round(v)));
  useEffect(() => {
    const controls = animate(pad, [16, 24, 24, 16, 16], {
      duration: 4.4,
      repeat: Infinity,
      ease: 'easeInOut',
      times: [0, 0.35, 0.5, 0.85, 1],
    });
    return () => controls.stop();
  }, [pad]);

  return (
    <div
      className="flex h-full w-full flex-col overflow-hidden"
      style={{
        background: T.bgApp,
        colorScheme: 'dark',
        fontFamily: '"Geist", "Inter", -apple-system, sans-serif',
      }}
    >
      {/* Top bar */}
      <div
        className="flex items-center gap-2 px-3"
        style={{ height: 44, background: T.bgPanel, borderBottom: `1px solid ${T.border}` }}
      >
        <LogoMark />
        <span className="h-4 w-px" style={{ background: T.border }} />
        <div className="flex items-center gap-0.5" style={{ color: T.textMuted }}>
          <TopButton muted><ChevronLeft size={14} /></TopButton>
          <TopButton muted><ChevronRight size={14} /></TopButton>
          <TopButton><RotateCw size={13} /></TopButton>
        </div>
        <Chip mono>~/invoices-app</Chip>
        <Chip mono>localhost:5173</Chip>
        <div className="ml-auto flex items-center gap-0.5">
          <TopButton><Smartphone size={14} /></TopButton>
          <TopButton><Tablet size={14} /></TopButton>
          <TopButton active><Monitor size={14} /></TopButton>
          <span className="mx-1 h-4 w-px" style={{ background: T.border }} />
          <TopButton active><Magnet size={14} /></TopButton>
          <TopButton><Settings size={14} /></TopButton>
        </div>
      </div>

      {/* Body */}
      <div className="flex min-h-0 flex-1">
        {/* Sample app canvas (light) */}
        <div
          className="relative flex flex-1 items-center justify-center p-8"
          style={{ background: LIGHT.surface }}
        >
          <div
            className="w-full max-w-[360px] rounded-xl p-6"
            style={{ border: `1px solid ${LIGHT.border}`, background: '#FCFCFB' }}
          >
            <div className="mb-1 text-[13px]" style={{ color: LIGHT.textMuted }}>
              Outstanding
            </div>
            <div className="mb-4 text-[28px] font-bold tracking-tight" style={{ color: LIGHT.textPrimary }}>
              £12,480
            </div>
            <div className="flex items-center gap-3">
              {/* The selected element — lime ring + animated padding */}
              <div className="relative">
                <span
                  className="pointer-events-none absolute -left-1.5 -top-5 rounded px-1 py-0.5 text-[9px] font-medium"
                  style={{ background: LIME, color: '#15200a' }}
                >
                  button
                </span>
                <motion.button
                  className="rounded-lg text-[13px] font-medium"
                  style={{
                    paddingLeft: padPx,
                    paddingRight: padPx,
                    paddingTop: 8,
                    paddingBottom: 8,
                    background: '#0a4b19',
                    color: '#fff',
                    boxShadow: `0 0 0 2px ${LIME}, 0 0 0 4px rgba(228,242,34,0.25)`,
                  }}
                >
                  New invoice
                </motion.button>
              </div>
              <span className="text-[13px]" style={{ color: LIGHT.textSecondary }}>
                Add contact
              </span>
            </div>
          </div>
        </div>

        {/* Properties panel */}
        <div
          className="flex w-[272px] shrink-0 flex-col gap-3 p-3"
          style={{ background: T.bgPanel, borderLeft: `1px solid ${T.border}` }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium" style={{ color: T.textPrimary }}>
              button
            </span>
            <span className="font-mono text-[10px]" style={{ color: T.textMuted }}>
              App.tsx:48
            </span>
          </div>

          {/* Spacing section */}
          <div className="rounded-lg p-3" style={{ background: T.bgSurface, border: `1px solid ${T.border}` }}>
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide" style={{ color: T.textMuted }}>
              Spacing
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[12px]" style={{ color: T.textSecondary }}>
                Padding · X
              </span>
              <div
                className="flex items-center gap-2 rounded-md px-2 py-1"
                style={{ background: T.bgElevated, border: `1px solid ${T.borderFocus}` }}
              >
                <motion.span className="font-mono text-[12px] tabular-nums" style={{ color: T.textPrimary }}>
                  {padNum}
                </motion.span>
                <span className="font-mono text-[11px]" style={{ color: T.textMuted }}>
                  px
                </span>
              </div>
            </div>
            {/* scale ticks */}
            <div className="mt-2 flex gap-1">
              {[4, 8, 12, 16, 20, 24].map((v) => (
                <span
                  key={v}
                  className="flex-1 rounded text-center text-[9px] font-mono"
                  style={{
                    padding: '2px 0',
                    background: padNum === v ? T.accent : 'transparent',
                    color: padNum === v ? T.textOnAccent : T.textMuted,
                    border: `1px solid ${padNum === v ? T.accent : T.border}`,
                  }}
                >
                  {v}
                </span>
              ))}
            </div>
          </div>

          {/* Fill section */}
          <div className="rounded-lg p-3" style={{ background: T.bgSurface, border: `1px solid ${T.border}` }}>
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide" style={{ color: T.textMuted }}>
              Fill
            </div>
            <div className="flex items-center gap-2">
              <span className="h-4 w-4 rounded" style={{ background: '#0a4b19', border: `1px solid ${T.border}` }} />
              <span className="font-mono text-[11px]" style={{ color: T.textSecondary }}>
                brand-primary
              </span>
              <span
                className="ml-auto h-1.5 w-1.5 rounded-full"
                style={{ background: 'rgb(52,199,89)' }}
                title="on-system"
              />
            </div>
          </div>

          {/* Compliance */}
          <div className="mt-auto rounded-lg p-3" style={{ background: T.bgSurface, border: `1px solid ${T.border}` }}>
            <div className="mb-1.5 flex items-center justify-between text-[11px]">
              <span style={{ color: T.textSecondary }}>Compliance</span>
              <span className="font-mono" style={{ color: 'rgb(52,199,89)' }}>98</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: T.bgElevated }}>
              <div className="h-full rounded-full" style={{ width: '98%', background: 'rgb(52,199,89)' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
