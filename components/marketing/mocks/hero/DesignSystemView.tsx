'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { STUDIO_TOKENS } from '../_studio-chrome';

const HUB_TABS = ['Tokens', 'Assets', 'Context'] as const;
type HubTab = typeof HUB_TABS[number];

interface Swatch { name: string; hex: string }

const COLOUR_GROUPS: { label: string; tokens: Swatch[] }[] = [
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
      { name: 'bg-hover', hex: '#2A2A32' },
    ],
  },
  {
    label: 'Text',
    tokens: [
      { name: 'text-primary', hex: '#EDEDF4' },
      { name: 'text-secondary', hex: '#A6A6B0' },
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
  { name: 'display', size: 32, weight: 600 },
  { name: 'heading', size: 22, weight: 600 },
  { name: 'body', size: 14, weight: 400 },
  { name: 'caption', size: 11, weight: 500 },
];

const RADIUS = [
  { name: 'sm', value: 4 },
  { name: 'md', value: 8 },
  { name: 'lg', value: 14 },
  { name: 'pill', value: 999 },
];

function SwatchTile({ token, delay }: { token: Swatch; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, delay, ease: [0, 0, 0.2, 1] }}
      viewport={{ once: true, margin: '-10%' }}
      className="flex flex-col items-center gap-1.5 w-[72px] cursor-pointer"
    >
      <div
        className="h-12 w-12 rounded-lg border transition-all hover:scale-105"
        style={{ backgroundColor: token.hex, borderColor: STUDIO_TOKENS.border }}
      />
      <span
        className="font-mono text-[10px] leading-none truncate w-full text-center"
        style={{ color: STUDIO_TOKENS.textSecondary }}
      >
        {token.name}
      </span>
      <span
        className="font-mono text-[9px] leading-none -mt-1"
        style={{ color: STUDIO_TOKENS.textMuted }}
      >
        {token.hex.toUpperCase()}
      </span>
    </motion.div>
  );
}

export function DesignSystemView() {
  const [activeTab, setActiveTab] = useState<HubTab>('Tokens');

  return (
    <>
      {/* Hub tabs */}
      <div
        className="flex items-center gap-1 border-b px-4 py-2 shrink-0"
        style={{ borderColor: STUDIO_TOKENS.border }}
      >
        {HUB_TABS.map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className="rounded-md px-3 py-1 text-[12px] font-medium transition-colors"
            style={{
              backgroundColor: activeTab === t ? STUDIO_TOKENS.bgHover : 'transparent',
              color: activeTab === t ? STUDIO_TOKENS.textPrimary : STUDIO_TOKENS.textMuted,
            }}
          >
            {t}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <div
            className="flex items-center gap-1 rounded-md border p-0.5 text-[10px] font-mono"
            style={{ borderColor: STUDIO_TOKENS.borderStrong }}
          >
            <button
              className="rounded-sm px-2 py-0.5 font-medium uppercase tracking-wider"
              style={{ backgroundColor: STUDIO_TOKENS.accent, color: STUDIO_TOKENS.textOnAccent }}
            >
              Dark
            </button>
            <button
              className="rounded-sm px-2 py-0.5 font-medium uppercase tracking-wider"
              style={{ color: STUDIO_TOKENS.textMuted }}
            >
              Light
            </button>
          </div>
          <button
            className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium hover:bg-white/5"
            style={{ borderColor: STUDIO_TOKENS.borderStrong, color: STUDIO_TOKENS.textPrimary }}
          >
            <Plus className="h-3 w-3" />
            Add token
          </button>
        </div>
      </div>

      {/* Body */}
      {activeTab === 'Tokens' && (
        <div className="flex-1 overflow-hidden px-7 py-6 flex flex-col gap-6 min-h-0">
          {/* Colour groups grid */}
          <div className="grid grid-cols-2 gap-x-10 gap-y-5">
            {COLOUR_GROUPS.map((group, gi) => (
              <div key={group.label} className="flex flex-col gap-2">
                <div className="flex items-baseline gap-2">
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
                <div className="flex flex-wrap gap-x-2 gap-y-2">
                  {group.tokens.map((t, ti) => (
                    <SwatchTile key={t.name} token={t} delay={0.1 + gi * 0.05 + ti * 0.04} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Type scale + Radius row */}
          <div className="grid grid-cols-2 gap-8">
            <div className="flex flex-col gap-2.5">
              <span
                className="text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: STUDIO_TOKENS.textMuted }}
              >
                Type scale · {TYPE_SCALE.length}
              </span>
              <div className="flex flex-col gap-1.5">
                {TYPE_SCALE.map((t, i) => (
                  <motion.div
                    key={t.name}
                    initial={{ opacity: 0, x: 4 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.4 + i * 0.05 }}
                    viewport={{ once: true, margin: '-10%' }}
                    className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 cursor-pointer transition-colors hover:bg-white/[0.03]"
                    style={{
                      borderColor: STUDIO_TOKENS.border,
                      backgroundColor: 'rgba(255,255,255,0.02)',
                    }}
                  >
                    <div className="flex items-baseline gap-3 min-w-0">
                      <span
                        className="leading-none shrink-0"
                        style={{
                          fontSize: t.size,
                          fontWeight: t.weight,
                          color: STUDIO_TOKENS.textPrimary,
                        }}
                      >
                        Aa
                      </span>
                      <span
                        className="font-mono text-[10px] truncate"
                        style={{ color: STUDIO_TOKENS.textSecondary }}
                      >
                        {t.name}
                      </span>
                    </div>
                    <span
                      className="font-mono text-[10px] shrink-0"
                      style={{ color: STUDIO_TOKENS.textMuted }}
                    >
                      {t.size}/{t.weight}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2.5">
                <span
                  className="text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: STUDIO_TOKENS.textMuted }}
                >
                  Radius · {RADIUS.length}
                </span>
                <div className="flex items-end gap-3">
                  {RADIUS.map((r, i) => (
                    <motion.div
                      key={r.name}
                      initial={{ opacity: 0, y: 4 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.6 + i * 0.05 }}
                      viewport={{ once: true, margin: '-10%' }}
                      className="flex flex-col items-center gap-1.5"
                    >
                      <div
                        className="h-10 w-10 border"
                        style={{
                          borderRadius: Math.min(r.value, 18),
                          borderColor: STUDIO_TOKENS.borderStrong,
                          backgroundColor: 'rgba(255,255,255,0.05)',
                        }}
                      />
                      <span className="font-mono text-[10px] leading-none" style={{ color: STUDIO_TOKENS.textSecondary }}>
                        {r.name}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                <span
                  className="text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: STUDIO_TOKENS.textMuted }}
                >
                  Components · 12
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    className="rounded-md px-3 py-1.5 text-[11px] font-medium"
                    style={{ backgroundColor: STUDIO_TOKENS.accent, color: STUDIO_TOKENS.textOnAccent }}
                  >
                    Primary
                  </button>
                  <button
                    className="rounded-md border px-3 py-1.5 text-[11px] font-medium"
                    style={{
                      borderColor: STUDIO_TOKENS.borderStrong,
                      backgroundColor: 'rgba(255,255,255,0.03)',
                      color: STUDIO_TOKENS.textPrimary,
                    }}
                  >
                    Secondary
                  </button>
                  <button
                    className="rounded-md px-3 py-1.5 text-[11px] font-medium"
                    style={{ color: STUDIO_TOKENS.textSecondary }}
                  >
                    Ghost
                  </button>
                  <span
                    className="rounded-full border px-2 py-0.5 text-[10px] font-mono"
                    style={{
                      borderColor: 'rgba(52,199,89,0.3)',
                      backgroundColor: 'rgba(52,199,89,0.08)',
                      color: 'rgb(110,231,183)',
                    }}
                  >
                    Live
                  </span>
                  <span
                    className="rounded-full border px-2 py-0.5 text-[10px] font-mono"
                    style={{
                      borderColor: 'rgba(228,242,34,0.3)',
                      backgroundColor: 'rgba(228,242,34,0.08)',
                      color: STUDIO_TOKENS.brand,
                    }}
                  >
                    Beta
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {(activeTab === 'Assets' || activeTab === 'Context') && (
        <div
          className="flex-1 flex items-center justify-center text-[11px]"
          style={{ color: STUDIO_TOKENS.textMuted }}
        >
          {activeTab === 'Assets' ? 'Icons, fonts, branding assets' : 'Product context documents'}
        </div>
      )}
    </>
  );
}
