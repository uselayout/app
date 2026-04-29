'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { STUDIO_TOKENS, MODE_TOKENS } from '../_studio-chrome';

const HUB_TABS = ['Tokens', 'Assets', 'Context'] as const;
type HubTab = typeof HUB_TABS[number];

type Mode = 'dark' | 'light';

interface Swatch { name: string; hex: Record<Mode, string> }

const COLOUR_GROUPS: { label: string; tokens: Swatch[] }[] = [
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
      { name: 'bg-hover', hex: { dark: '#2A2A32', light: '#EBEBED' } },
    ],
  },
  {
    label: 'Text',
    tokens: [
      { name: 'text-primary', hex: { dark: '#EDEDF4', light: '#1A1A1A' } },
      { name: 'text-secondary', hex: { dark: '#A6A6B0', light: '#525252' } },
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

function SwatchTile({ token, mode, delay }: { token: Swatch; mode: Mode; delay: number }) {
  const m = MODE_TOKENS[mode];
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, delay, ease: [0, 0, 0.2, 1] }}
      viewport={{ once: true, margin: '-10%' }}
      className="flex flex-col items-center gap-1.5 w-[72px] cursor-pointer"
    >
      <motion.div
        animate={{ backgroundColor: token.hex[mode], borderColor: m.border }}
        transition={{ duration: 0.35, ease: [0, 0, 0.2, 1] }}
        className="h-12 w-12 rounded-lg border transition-all hover:scale-105"
      />
      <motion.span
        animate={{ color: m.textSecondary }}
        className="font-mono text-[10px] leading-none truncate w-full text-center"
      >
        {token.name}
      </motion.span>
      <motion.span
        key={token.hex[mode]}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, color: m.textMuted }}
        transition={{ duration: 0.25, delay: 0.05 }}
        className="font-mono text-[9px] leading-none -mt-1"
      >
        {token.hex[mode].toUpperCase()}
      </motion.span>
    </motion.div>
  );
}

export function DesignSystemView() {
  const [activeTab, setActiveTab] = useState<HubTab>('Tokens');
  const [mode, setMode] = useState<Mode>('dark');

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
            className="relative flex items-center rounded-md border p-0.5 text-[10px] font-mono"
            style={{ borderColor: STUDIO_TOKENS.borderStrong }}
          >
            {(['dark', 'light'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className="relative rounded-sm px-2 py-0.5 font-medium uppercase tracking-wider transition-colors z-10"
                style={{
                  color: mode === m ? STUDIO_TOKENS.textOnAccent : STUDIO_TOKENS.textMuted,
                }}
              >
                {mode === m && (
                  <motion.span
                    layoutId="hero-ds-mode-pill"
                    className="absolute inset-0 rounded-sm"
                    style={{ backgroundColor: STUDIO_TOKENS.brand }}
                    transition={{ duration: 0.25, ease: [0, 0, 0.2, 1] }}
                  />
                )}
                <span className="relative">{m}</span>
              </button>
            ))}
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
      {activeTab === 'Tokens' && (() => {
        const m = MODE_TOKENS[mode];
        return (
          <motion.div
            animate={{ backgroundColor: m.surface }}
            transition={{ duration: 0.4, ease: [0, 0, 0.2, 1] }}
            className="flex-1 overflow-hidden px-7 py-6 flex flex-col gap-6 min-h-0"
          >
            {/* Colour groups grid */}
            <div className="grid grid-cols-2 gap-x-10 gap-y-5">
              {COLOUR_GROUPS.map((group, gi) => (
                <div key={group.label} className="flex flex-col gap-2">
                  <div className="flex items-baseline gap-2">
                    <motion.span
                      animate={{ color: m.textMuted }}
                      className="text-[10px] font-semibold uppercase tracking-wider"
                    >
                      {group.label}
                    </motion.span>
                    <motion.span animate={{ color: m.textMuted }} className="font-mono text-[10px]">
                      {group.tokens.length}
                    </motion.span>
                  </div>
                  <div className="flex flex-wrap gap-x-2 gap-y-2">
                    {group.tokens.map((t, ti) => (
                      <SwatchTile key={t.name} token={t} mode={mode} delay={0.1 + gi * 0.05 + ti * 0.04} />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Type scale + Radius row */}
            <div className="grid grid-cols-2 gap-8">
              <div className="flex flex-col gap-2.5">
                <motion.span
                  animate={{ color: m.textMuted }}
                  className="text-[10px] font-semibold uppercase tracking-wider"
                >
                  Type scale · {TYPE_SCALE.length}
                </motion.span>
                <div className="flex flex-col gap-1.5">
                  {TYPE_SCALE.map((t, i) => (
                    <motion.div
                      key={t.name}
                      initial={{ opacity: 0, x: 4 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.4 + i * 0.05 }}
                      viewport={{ once: true, margin: '-10%' }}
                      animate={{ borderColor: m.border, backgroundColor: m.cardBg }}
                      className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
                    >
                      <div className="flex items-baseline gap-3 min-w-0">
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
                        className="font-mono text-[10px] shrink-0"
                      >
                        {t.size}/{t.weight}
                      </motion.span>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2.5">
                  <motion.span
                    animate={{ color: m.textMuted }}
                    className="text-[10px] font-semibold uppercase tracking-wider"
                  >
                    Radius · {RADIUS.length}
                  </motion.span>
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
                        <motion.div
                          animate={{ borderColor: m.borderStrong, backgroundColor: m.cardBg }}
                          className="h-10 w-10 border"
                          style={{ borderRadius: Math.min(r.value, 18) }}
                        />
                        <motion.span
                          animate={{ color: m.textSecondary }}
                          className="font-mono text-[10px] leading-none"
                        >
                          {r.name}
                        </motion.span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2.5">
                  <motion.span
                    animate={{ color: m.textMuted }}
                    className="text-[10px] font-semibold uppercase tracking-wider"
                  >
                    Components · 12
                  </motion.span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <motion.button
                      animate={{ backgroundColor: m.accent, color: m.accentText }}
                      className="rounded-md px-3 py-1.5 text-[11px] font-medium"
                    >
                      Primary
                    </motion.button>
                    <motion.button
                      animate={{
                        borderColor: m.borderStrong,
                        backgroundColor: m.cardBg,
                        color: m.textPrimary,
                      }}
                      className="rounded-md border px-3 py-1.5 text-[11px] font-medium"
                    >
                      Secondary
                    </motion.button>
                    <motion.button
                      animate={{ color: m.textSecondary }}
                      className="rounded-md px-3 py-1.5 text-[11px] font-medium"
                    >
                      Ghost
                    </motion.button>
                    <span
                      className="rounded-full border px-2 py-0.5 text-[10px] font-mono"
                      style={{
                        borderColor: 'rgba(52,199,89,0.3)',
                        backgroundColor: 'rgba(52,199,89,0.08)',
                        color: mode === 'dark' ? 'rgb(110,231,183)' : '#22863A',
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
          </motion.div>
        );
      })()}

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
