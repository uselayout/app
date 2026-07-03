'use client';

import { useEffect, useState } from 'react';
import {
  motion,
  animate,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
} from 'framer-motion';
import { Monitor, Magnet, Settings } from 'lucide-react';
import { STUDIO_TOKENS, MODE_TOKENS } from '@/components/marketing/mocks/_studio-chrome';

const T = STUDIO_TOKENS;
const LIGHT = MODE_TOKENS.light;
const LIME = '#E4F222';

function LogoMark({ size = 15, color = T.accent }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18.5586 18.5586" fill={color} aria-hidden>
      <path d="M13.7168 0C16.3906 0 18.5586 2.16798 18.5586 4.8418V18.5586H0V0H13.7168ZM1.61426 16.9443H5.64844V12.9102H1.61426V16.9443ZM7.26172 12.9102V16.9443H16.9453V12.9102H7.26172ZM1.61426 11.2969H5.64844V1.61426H1.61426V11.2969Z" />
    </svg>
  );
}

/** Compact, vertically-stacked Live UI for narrow screens. */
export function LayoutLiveMobileMock() {
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
      {/* Compact top bar */}
      <div
        className="flex items-center gap-2 px-3"
        style={{ height: 40, background: T.bgPanel, borderBottom: `1px solid ${T.border}` }}
      >
        <LogoMark />
        <span className="h-3.5 w-px" style={{ background: T.border }} />
        <span
          className="truncate rounded px-2 py-0.5 font-mono text-[10px]"
          style={{ background: T.bgSurface, color: T.textSecondary }}
        >
          localhost:5173
        </span>
        <span className="ml-auto flex items-center gap-1.5" style={{ color: T.textSecondary }}>
          <Monitor size={13} style={{ color: T.textPrimary }} />
          <Magnet size={13} />
          <Settings size={13} />
        </span>
      </div>

      {/* Element breadcrumb path */}
      <div
        className="flex items-center gap-1 px-3"
        style={{ height: 22, background: T.bgApp, borderBottom: `1px solid ${T.border}` }}
      >
        {(['page', '›', 'header', '›', 'button'] as const).map((segment, i) => (
          <span
            key={i}
            className="text-[9px]"
            style={{
              color: segment === 'button' ? T.textSecondary : T.textMuted,
              fontWeight: segment === 'button' ? 500 : 400,
            }}
          >
            {segment}
          </span>
        ))}
      </div>

      {/* App canvas (light) */}
      <div className="flex flex-1 items-center justify-center p-4" style={{ background: LIGHT.surface }}>
        <div
          className="w-full rounded-xl p-4"
          style={{ border: `1px solid ${LIGHT.border}`, background: '#FCFCFB' }}
        >
          <div className="text-[11px]" style={{ color: LIGHT.textMuted }}>Outstanding</div>
          <div className="mb-3 text-[22px] font-bold tracking-tight" style={{ color: LIGHT.textPrimary }}>
            £12,480
          </div>
          <div className="relative inline-block">
            <span
              className="pointer-events-none absolute -left-1 -top-4 rounded px-1 text-[8px] font-medium"
              style={{ background: LIME, color: '#15200a' }}
            >
              button
            </span>
            <motion.button
              className="rounded-lg text-[12px] font-medium"
              style={{
                paddingLeft: padPx,
                paddingRight: padPx,
                paddingTop: 7,
                paddingBottom: 7,
                background: '#0a4b19',
                color: '#fff',
                boxShadow: `0 0 0 2px ${LIME}, 0 0 0 4px rgba(228,242,34,0.25)`,
              }}
            >
              New invoice
            </motion.button>
          </div>
        </div>
      </div>

      {/* Properties (bottom sheet) */}
      <div className="flex flex-col gap-2 p-3" style={{ background: T.bgPanel, borderTop: `1px solid ${T.border}` }}>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium" style={{ color: T.textPrimary }}>button</span>
          <span className="font-mono text-[10px]" style={{ color: T.textMuted }}>App.tsx:48</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11px]" style={{ color: T.textSecondary }}>Padding · X</span>
          <div
            className="flex items-center gap-1.5 rounded-md px-2 py-1"
            style={{ background: T.bgElevated, border: `1px solid ${T.borderFocus}` }}
          >
            <span className="font-mono text-[12px] tabular-nums" style={{ color: T.textPrimary }}>{padNum}</span>
            <span className="font-mono text-[10px]" style={{ color: T.textMuted }}>px</span>
          </div>
        </div>
        <div className="flex gap-1">
          {[4, 8, 12, 16, 20, 24].map((v) => (
            <span
              key={v}
              className="flex-1 rounded py-0.5 text-center font-mono text-[9px]"
              style={{
                background: padNum === v ? T.accent : 'transparent',
                color: padNum === v ? T.textOnAccent : T.textMuted,
                border: `1px solid ${padNum === v ? T.accent : T.border}`,
              }}
            >
              {v}
            </span>
          ))}
        </div>
        {/* Typography row */}
        <div className="flex items-center justify-between">
          <span className="text-[11px]" style={{ color: T.textSecondary }}>Font size</span>
          <div
            className="flex items-center gap-1.5 rounded-md px-2 py-1"
            style={{ background: T.bgElevated, border: `1px solid ${T.border}` }}
          >
            <span className="font-mono text-[12px] tabular-nums" style={{ color: T.textPrimary }}>16</span>
            <span className="font-mono text-[10px]" style={{ color: T.textMuted }}>px</span>
          </div>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-[10px]" style={{ color: T.textSecondary }}>Compliance</span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: T.bgElevated }}>
            <div className="h-full rounded-full" style={{ width: '98%', background: 'rgb(52,199,89)' }} />
          </div>
          <span className="font-mono text-[10px]" style={{ color: 'rgb(52,199,89)' }}>98</span>
        </div>
      </div>
    </div>
  );
}
