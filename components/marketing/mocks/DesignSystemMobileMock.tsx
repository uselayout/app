'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { STUDIO_TOKENS, MODE_TOKENS } from './_studio-chrome';

type Mode = 'dark' | 'light';

interface ModeToken { name: string; hex: Record<Mode, string> }
interface Group { label: string; tokens: ModeToken[] }

// Token names are stable across modes — only hex values change. Mirrors how
// the real Layout multi-mode token system works (e.g. --bg-app: #0C0C0E in
// dark, #FAFAFA in light), per app/globals.css :root vs :root.light.
const COLOUR_GROUPS: Group[] = [
  {
    label: 'Brand',
    tokens: [
      { name: 'accent', hex: { dark: '#E4F222', light: '#E4F222' } },
      { name: 'accent-soft', hex: { dark: '#3A3F0A', light: '#F5FAB5' } },
    ],
  },
  {
    label: 'Surface',
    tokens: [
      { name: 'bg-app', hex: { dark: '#0C0C0E', light: '#FAFAFA' } },
      { name: 'bg-panel', hex: { dark: '#141418', light: '#F0F0F2' } },
      { name: 'bg-surface', hex: { dark: '#1A1A20', light: '#FFFFFF' } },
      { name: 'bg-elevated', hex: { dark: '#222228', light: '#FFFFFF' } },
    ],
  },
  {
    label: 'Text',
    tokens: [
      { name: 'text-primary', hex: { dark: '#EDEDF4', light: '#1A1A1A' } },
      { name: 'text-muted', hex: { dark: '#7A7A85', light: '#737373' } },
    ],
  },
  {
    label: 'Status',
    tokens: [
      { name: 'success', hex: { dark: '#34C759', light: '#22863A' } },
      { name: 'warning', hex: { dark: '#FF9F0A', light: '#D97706' } },
      { name: 'error', hex: { dark: '#FF453A', light: '#DC2626' } },
    ],
  },
];

const TYPE_SCALE = [
  { name: 'display', size: 24, weight: 600 },
  { name: 'heading', size: 18, weight: 600 },
  { name: 'body', size: 13, weight: 400 },
  { name: 'caption', size: 11, weight: 500 },
];

function SwatchTile({
  token,
  mode,
  delay,
}: {
  token: ModeToken;
  mode: Mode;
  delay: number;
}) {
  const m = MODE_TOKENS[mode];
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay, ease: [0, 0, 0.2, 1] }}
      className="flex flex-col items-center gap-1.5 w-[64px]"
    >
      <motion.div
        layoutId={`swatch-${token.name}`}
        animate={{ backgroundColor: token.hex[mode], borderColor: m.border }}
        transition={{ duration: 0.4, ease: [0, 0, 0.2, 1] }}
        className="h-11 w-11 rounded-lg border"
      />
      <motion.span
        animate={{ color: m.textSecondary }}
        className="font-mono text-[9.5px] leading-none truncate w-full text-center"
      >
        {token.name}
      </motion.span>
      <motion.span
        key={token.hex[mode]}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, color: m.textMuted }}
        transition={{ duration: 0.25, delay: 0.05 }}
        className="font-mono text-[8.5px] leading-none -mt-1"
      >
        {token.hex[mode].toUpperCase()}
      </motion.span>
    </motion.div>
  );
}

export function DesignSystemMobileMock() {
  const [mode, setMode] = useState<Mode>('dark');

  return (
    <div
      className="absolute inset-0 flex flex-col"
      style={{
        backgroundColor: STUDIO_TOKENS.bgApp,
        color: STUDIO_TOKENS.textPrimary,
        fontFamily: '"Geist", "Inter", -apple-system, sans-serif',
        colorScheme: 'dark',
      }}
    >
      {/* Header — interactive Dark/Light toggle */}
      <div className="flex items-center justify-between border-b px-4 py-2.5 shrink-0" style={{ borderColor: STUDIO_TOKENS.border }}>
        <div className="flex items-baseline gap-1.5">
          <span className="text-[13px] font-medium" style={{ color: STUDIO_TOKENS.textPrimary }}>
            Tokens
          </span>
          <span className="font-mono text-[10px]" style={{ color: STUDIO_TOKENS.textMuted }}>
            13 · {mode}
          </span>
        </div>
        <div
          className="relative flex items-center rounded-md border p-0.5"
          style={{ borderColor: STUDIO_TOKENS.borderStrong }}
        >
          {(['dark', 'light'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="relative rounded-sm px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider transition-colors z-10"
              style={{
                color: mode === m ? STUDIO_TOKENS.textOnAccent : STUDIO_TOKENS.textMuted,
              }}
            >
              {mode === m && (
                <motion.span
                  layoutId="ds-mobile-mode-pill"
                  className="absolute inset-0 rounded-sm"
                  style={{ backgroundColor: STUDIO_TOKENS.brand }}
                  transition={{ duration: 0.25, ease: [0, 0, 0.2, 1] }}
                />
              )}
              <span className="relative">{m}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Body — canvas adopts the previewed mode */}
      {(() => {
        const m = MODE_TOKENS[mode];
        return (
          <motion.div
            animate={{ backgroundColor: m.surface }}
            transition={{ duration: 0.4, ease: [0, 0, 0.2, 1] }}
            className="flex-1 min-h-0 overflow-hidden flex flex-col gap-4 px-4 py-4"
          >
            {/* Colour groups */}
            <div className="flex flex-col gap-3">
              {COLOUR_GROUPS.map((group, gi) => (
                <div key={group.label} className="flex flex-col gap-1.5">
                  <div className="flex items-baseline gap-1.5">
                    <motion.span
                      animate={{ color: m.textMuted }}
                      className="text-[10px] font-semibold uppercase tracking-wider"
                    >
                      {group.label}
                    </motion.span>
                    <motion.span
                      animate={{ color: m.textMuted }}
                      className="font-mono text-[10px]"
                    >
                      {group.tokens.length}
                    </motion.span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {group.tokens.map((t, ti) => (
                      <SwatchTile
                        key={t.name}
                        token={t}
                        mode={mode}
                        delay={0.05 + gi * 0.04 + ti * 0.03}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Type scale */}
            <div className="flex flex-col gap-1.5 mt-auto">
              <motion.span
                animate={{ color: m.textMuted }}
                className="text-[10px] font-semibold uppercase tracking-wider"
              >
                Type scale · {TYPE_SCALE.length}
              </motion.span>
              <div className="flex flex-col gap-1">
                {TYPE_SCALE.map((t, i) => (
                  <motion.div
                    key={t.name}
                    initial={{ opacity: 0, x: 4 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.45 + i * 0.05 }}
                    viewport={{ once: true, margin: '-10%' }}
                    animate={{ borderColor: m.border, backgroundColor: m.cardBg }}
                    className="flex items-center justify-between gap-3 rounded-md border px-2.5 py-1.5"
                  >
                    <div className="flex items-baseline gap-2.5 min-w-0">
                      <motion.span
                        animate={{ color: m.textPrimary }}
                        className="leading-none shrink-0"
                        style={{ fontSize: t.size, fontWeight: t.weight }}
                      >
                        Aa
                      </motion.span>
                      <motion.span
                        animate={{ color: m.textSecondary }}
                        className="font-mono text-[10px] truncate"
                      >
                        {t.name}
                      </motion.span>
                    </div>
                    <motion.span
                      animate={{ color: m.textMuted }}
                      className="font-mono text-[10px]"
                    >
                      {t.size}/{t.weight}
                    </motion.span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        );
      })()}
    </div>
  );
}
