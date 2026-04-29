'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Palette,
  LayoutGrid,
  Image as ImageIcon,
  Type,
  Gauge,
  Figma as FigmaIcon,
  Terminal,
  Plus,
} from 'lucide-react';
import { StudioWindow, SourcePanel, StudioSurface, STUDIO_TOKENS } from './_studio-chrome';

const TABS = [
  { id: 'tokens', label: 'Tokens', icon: Palette },
  { id: 'components', label: 'Components', icon: LayoutGrid },
  { id: 'screenshots', label: 'Screenshots', icon: ImageIcon },
  { id: 'fonts', label: 'Fonts', icon: Type },
  { id: 'quality', label: 'Quality', icon: Gauge },
  { id: 'figma', label: 'Figma', icon: FigmaIcon },
  { id: 'connect', label: 'Connect', icon: Terminal },
];

interface Swatch {
  name: string;
  hex: string;
}
interface Group {
  label: string;
  tokens: Swatch[];
}

const COLOUR_GROUPS: Group[] = [
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
  { name: 'display', size: 32, weight: 600, sample: 'Aa' },
  { name: 'heading', size: 22, weight: 600, sample: 'Aa' },
  { name: 'body', size: 14, weight: 400, sample: 'Aa' },
  { name: 'caption', size: 11, weight: 500, sample: 'Aa' },
];

const RADIUS_TOKENS = [
  { name: 'sm', value: 4 },
  { name: 'md', value: 8 },
  { name: 'lg', value: 14 },
  { name: 'pill', value: 999 },
];

interface SwatchTileProps {
  token: Swatch;
  delay: number;
  selected?: boolean;
  onClick?: () => void;
}

function SwatchTile({ token, delay, selected, onClick }: SwatchTileProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 4 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0, 0, 0.2, 1] }}
      viewport={{ once: true, margin: '-10%' }}
      className="flex flex-col items-center gap-1.5 w-[72px] cursor-pointer"
      onClick={onClick}
    >
      <div
        className="h-12 w-12 rounded-lg border transition-all hover:scale-105"
        style={{
          backgroundColor: token.hex,
          borderColor: selected ? STUDIO_TOKENS.accent : STUDIO_TOKENS.border,
          boxShadow: selected ? `0 0 0 2px ${STUDIO_TOKENS.bgApp}, 0 0 0 4px ${STUDIO_TOKENS.accent}33` : 'none',
        }}
      />
      <span className="font-mono text-[10px] leading-none truncate w-full text-center" style={{ color: STUDIO_TOKENS.textSecondary }}>
        {token.name}
      </span>
      <span className="font-mono text-[9px] leading-none -mt-1" style={{ color: STUDIO_TOKENS.textMuted }}>
        {token.hex.toUpperCase()}
      </span>
    </motion.div>
  );
}

export function DesignSystemMock() {
  const [activeTab, setActiveTab] = useState('tokens');
  const [mode, setMode] = useState<'dark' | 'light'>('dark');
  const [selectedToken, setSelectedToken] = useState<string | null>('accent');

  return (
    <StudioWindow
      projectName="Acme"
      sourceType="figma"
      sourceName="acme-design-system"
      rightExtra={
        <div className="flex items-center gap-1 rounded-md border p-0.5" style={{ borderColor: STUDIO_TOKENS.borderStrong }}>
          {(['dark', 'light'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="rounded-sm px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider transition-colors"
              style={{
                backgroundColor: mode === m ? STUDIO_TOKENS.accent : 'transparent',
                color: mode === m ? STUDIO_TOKENS.textOnAccent : STUDIO_TOKENS.textMuted,
              }}
            >
              {m}
            </button>
          ))}
        </div>
      }
    >
      <SourcePanel tabs={TABS} activeTab={activeTab} onTab={setActiveTab} width={240}>
        <div className="flex flex-col gap-3 px-3 py-3 overflow-y-auto">
          {COLOUR_GROUPS.map((group) => (
            <div key={group.label} className="flex flex-col">
              <div
                className="flex items-center justify-between px-2 py-1.5"
              >
                <span
                  className="text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: STUDIO_TOKENS.textMuted }}
                >
                  {group.label}
                </span>
                <span
                  className="font-mono text-[10px]"
                  style={{ color: STUDIO_TOKENS.textMuted }}
                >
                  {group.tokens.length}
                </span>
              </div>
              <div className="flex flex-col">
                {group.tokens.map((t) => (
                  <div
                    key={t.name}
                    onClick={() => setSelectedToken(t.name)}
                    className="flex items-center gap-2 rounded px-2 py-1.5 cursor-pointer transition-colors hover:bg-white/5"
                    style={{
                      backgroundColor: selectedToken === t.name ? STUDIO_TOKENS.bgHover : 'transparent',
                    }}
                  >
                    <div
                      className="h-4 w-4 shrink-0 rounded-full border"
                      style={{ backgroundColor: t.hex, borderColor: STUDIO_TOKENS.border }}
                    />
                    <span
                      className="text-xs font-mono truncate flex-1"
                      style={{ color: STUDIO_TOKENS.textPrimary }}
                    >
                      --{t.name}
                    </span>
                    <span
                      className="text-[10px] font-mono"
                      style={{ color: STUDIO_TOKENS.textMuted }}
                    >
                      {t.hex.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SourcePanel>

      <StudioSurface>
        <div className="flex flex-col gap-5 px-7 py-7 overflow-hidden">
          {/* Colour groups grid */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-baseline justify-between">
              <h3
                className="text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: STUDIO_TOKENS.textMuted }}
              >
                Colours · 13 tokens
              </h3>
              <button
                className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded transition-colors hover:bg-white/5"
                style={{ color: STUDIO_TOKENS.textSecondary }}
              >
                <Plus className="h-2.5 w-2.5" />
                Add token
              </button>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-5">
              {COLOUR_GROUPS.map((group, gi) => (
                <div key={group.label} className="flex flex-col gap-2">
                  <div className="flex items-baseline gap-2">
                    <span
                      className="text-[10px] font-semibold uppercase tracking-wider"
                      style={{ color: STUDIO_TOKENS.textMuted }}
                    >
                      {group.label}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-2 gap-y-2">
                    {group.tokens.map((token, ti) => (
                      <SwatchTile
                        key={token.name}
                        token={token}
                        delay={0.1 + gi * 0.05 + ti * 0.04}
                        selected={selectedToken === token.name}
                        onClick={() => setSelectedToken(token.name)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Type scale + Radius row */}
          <div className="grid grid-cols-2 gap-8">
            <div className="flex flex-col gap-2.5">
              <h3
                className="text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: STUDIO_TOKENS.textMuted }}
              >
                Type scale · {TYPE_SCALE.length}
              </h3>
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
                        {t.sample}
                      </span>
                      <span className="font-mono text-[10px] truncate" style={{ color: STUDIO_TOKENS.textSecondary }}>
                        {t.name}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] shrink-0" style={{ color: STUDIO_TOKENS.textMuted }}>
                      {t.size}/{t.weight}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <h3
                className="text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: STUDIO_TOKENS.textMuted }}
              >
                Radius · {RADIUS_TOKENS.length}
              </h3>
              <div className="flex items-end gap-3">
                {RADIUS_TOKENS.map((r, i) => (
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

              {/* Components preview */}
              <div className="flex flex-col gap-2 mt-4">
                <h3
                  className="text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: STUDIO_TOKENS.textMuted }}
                >
                  Components · 12
                </h3>
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
                </div>
              </div>
            </div>
          </div>
        </div>
      </StudioSurface>
    </StudioWindow>
  );
}
