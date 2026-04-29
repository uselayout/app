'use client';

import { motion } from 'framer-motion';
import { STUDIO_TOKENS } from './_studio-chrome';

const COLOUR_GROUPS = [
  {
    label: 'Brand',
    tokens: [
      { name: 'accent', hex: '#E4F222' },
      { name: 'accent-soft', hex: '#3A3F0A' },
    ],
  },
  {
    label: 'Surface',
    tokens: [
      { name: 'bg-app', hex: '#0C0C0E' },
      { name: 'bg-panel', hex: '#141418' },
      { name: 'bg-surface', hex: '#1A1A20' },
      { name: 'bg-elevated', hex: '#222228' },
    ],
  },
  {
    label: 'Text',
    tokens: [
      { name: 'text-primary', hex: '#EDEDF4' },
      { name: 'text-muted', hex: '#7A7A85' },
    ],
  },
  {
    label: 'Status',
    tokens: [
      { name: 'success', hex: '#34C759' },
      { name: 'warning', hex: '#FF9F0A' },
      { name: 'error', hex: '#FF453A' },
    ],
  },
];

const TYPE_SCALE = [
  { name: 'display', size: 24, weight: 600 },
  { name: 'heading', size: 18, weight: 600 },
  { name: 'body', size: 13, weight: 400 },
  { name: 'caption', size: 11, weight: 500 },
];

function SwatchTile({ token, delay }: { token: { name: string; hex: string }; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, delay, ease: [0, 0, 0.2, 1] }}
      viewport={{ once: true, margin: '-10%' }}
      className="flex flex-col items-center gap-1.5 w-[64px]"
    >
      <div
        className="h-11 w-11 rounded-lg border"
        style={{ backgroundColor: token.hex, borderColor: STUDIO_TOKENS.border }}
      />
      <span
        className="font-mono text-[9.5px] leading-none truncate w-full text-center"
        style={{ color: STUDIO_TOKENS.textSecondary }}
      >
        {token.name}
      </span>
    </motion.div>
  );
}

export function DesignSystemMobileMock() {
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
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-2.5 shrink-0" style={{ borderColor: STUDIO_TOKENS.border }}>
        <div className="flex items-baseline gap-1.5">
          <span className="text-[13px] font-medium" style={{ color: STUDIO_TOKENS.textPrimary }}>
            Tokens
          </span>
          <span className="font-mono text-[10px]" style={{ color: STUDIO_TOKENS.textMuted }}>
            13
          </span>
        </div>
        <div className="flex items-center gap-1 rounded-md border p-0.5" style={{ borderColor: STUDIO_TOKENS.borderStrong }}>
          <button
            className="rounded-sm px-2 py-0.5 text-[9.5px] font-medium uppercase tracking-wider"
            style={{ backgroundColor: STUDIO_TOKENS.brand, color: STUDIO_TOKENS.textOnAccent }}
          >
            Dark
          </button>
          <button
            className="rounded-sm px-2 py-0.5 text-[9.5px] font-medium uppercase tracking-wider"
            style={{ color: STUDIO_TOKENS.textMuted }}
          >
            Light
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col gap-4 px-4 py-4">
        {/* Colour groups */}
        <div className="flex flex-col gap-3">
          {COLOUR_GROUPS.map((group, gi) => (
            <div key={group.label} className="flex flex-col gap-1.5">
              <div className="flex items-baseline gap-1.5">
                <span
                  className="text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: STUDIO_TOKENS.textMuted }}
                >
                  {group.label}
                </span>
                <span className="font-mono text-[10px]" style={{ color: STUDIO_TOKENS.textMuted }}>
                  {group.tokens.length}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {group.tokens.map((t, ti) => (
                  <SwatchTile key={t.name} token={t} delay={0.1 + gi * 0.05 + ti * 0.04} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Type scale */}
        <div className="flex flex-col gap-1.5 mt-auto">
          <span
            className="text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: STUDIO_TOKENS.textMuted }}
          >
            Type scale · {TYPE_SCALE.length}
          </span>
          <div className="flex flex-col gap-1">
            {TYPE_SCALE.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, x: 4 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.5 + i * 0.05 }}
                viewport={{ once: true, margin: '-10%' }}
                className="flex items-center justify-between gap-3 rounded-md border px-2.5 py-1.5"
                style={{
                  borderColor: STUDIO_TOKENS.border,
                  backgroundColor: 'rgba(255,255,255,0.02)',
                }}
              >
                <div className="flex items-baseline gap-2.5 min-w-0">
                  <span
                    className="leading-none shrink-0"
                    style={{ fontSize: t.size, fontWeight: t.weight, color: STUDIO_TOKENS.textPrimary }}
                  >
                    Aa
                  </span>
                  <span className="font-mono text-[10px] truncate" style={{ color: STUDIO_TOKENS.textSecondary }}>
                    {t.name}
                  </span>
                </div>
                <span className="font-mono text-[10px]" style={{ color: STUDIO_TOKENS.textMuted }}>
                  {t.size}/{t.weight}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
