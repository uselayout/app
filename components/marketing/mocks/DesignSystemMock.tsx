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
import { StudioWindow, SourcePanel, StudioSurface, STUDIO_TOKENS, MODE_TOKENS } from './_studio-chrome';

const TABS = [
  { id: 'tokens', label: 'Tokens', icon: Palette },
  { id: 'components', label: 'Components', icon: LayoutGrid },
  { id: 'screenshots', label: 'Screenshots', icon: ImageIcon },
  { id: 'fonts', label: 'Fonts', icon: Type },
  { id: 'quality', label: 'Quality', icon: Gauge },
  { id: 'figma', label: 'Figma', icon: FigmaIcon },
  { id: 'connect', label: 'Connect', icon: Terminal },
];

type Mode = 'dark' | 'light';

interface Swatch {
  name: string;
  hex: Record<Mode, string>;
}
interface Group {
  label: string;
  tokens: Swatch[];
}

// Token names stable across modes; only hex values swap. Mirrors how the
// real Layout multi-mode system works (per app/globals.css :root vs :root.light).
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
  mode: Mode;
  delay: number;
  selected?: boolean;
  onClick?: () => void;
}

function SwatchTile({ token, mode, delay, selected, onClick }: SwatchTileProps) {
  const m = MODE_TOKENS[mode];
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 4 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0, 0, 0.2, 1] }}
      viewport={{ once: true, margin: '-10%' }}
      className="flex flex-col items-center gap-1.5 w-[72px] cursor-pointer"
      onClick={onClick}
    >
      <motion.div
        animate={{ backgroundColor: token.hex[mode], borderColor: m.border }}
        transition={{ duration: 0.35, ease: [0, 0, 0.2, 1] }}
        className="h-12 w-12 rounded-lg border transition-all hover:scale-105"
        style={{
          boxShadow: selected ? `0 0 0 2px ${m.surface}, 0 0 0 4px ${STUDIO_TOKENS.brand}66` : 'none',
        }}
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
                    <motion.div
                      animate={{ backgroundColor: t.hex[mode] }}
                      transition={{ duration: 0.35, ease: [0, 0, 0.2, 1] }}
                      className="h-4 w-4 shrink-0 rounded-full border"
                      style={{ borderColor: STUDIO_TOKENS.border }}
                    />
                    <span
                      className="text-xs font-mono truncate flex-1"
                      style={{ color: STUDIO_TOKENS.textPrimary }}
                    >
                      --{t.name}
                    </span>
                    <motion.span
                      key={t.hex[mode]}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.25, delay: 0.05 }}
                      className="text-[10px] font-mono"
                      style={{ color: STUDIO_TOKENS.textMuted }}
                    >
                      {t.hex[mode].toUpperCase()}
                    </motion.span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SourcePanel>

      <StudioSurface>
        <motion.div
          animate={{ backgroundColor: MODE_TOKENS[mode].surface }}
          transition={{ duration: 0.4, ease: [0, 0, 0.2, 1] }}
          className="flex flex-col gap-5 px-7 py-7 overflow-hidden h-full"
        >
          {(() => {
            const m = MODE_TOKENS[mode];
            return (
              <>
                {/* Colour groups grid */}
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-baseline justify-between">
                    <motion.h3
                      animate={{ color: m.textMuted }}
                      className="text-[10px] font-semibold uppercase tracking-wider"
                    >
                      Colours · 13 tokens
                    </motion.h3>
                    <motion.button
                      animate={{ color: m.textSecondary }}
                      className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded"
                    >
                      <Plus className="h-2.5 w-2.5" />
                      Add token
                    </motion.button>
                  </div>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                    {COLOUR_GROUPS.map((group, gi) => (
                      <div key={group.label} className="flex flex-col gap-2">
                        <motion.span
                          animate={{ color: m.textMuted }}
                          className="text-[10px] font-semibold uppercase tracking-wider"
                        >
                          {group.label}
                        </motion.span>
                        <div className="flex flex-wrap gap-x-2 gap-y-2">
                          {group.tokens.map((token, ti) => (
                            <SwatchTile
                              key={token.name}
                              token={token}
                              mode={mode}
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
                    <motion.h3
                      animate={{ color: m.textMuted }}
                      className="text-[10px] font-semibold uppercase tracking-wider"
                    >
                      Type scale · {TYPE_SCALE.length}
                    </motion.h3>
                    <div className="flex flex-col gap-1.5">
                      {TYPE_SCALE.map((t, i) => (
                        <motion.div
                          key={t.name}
                          initial={{ opacity: 0, x: 4 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: 0.4 + i * 0.05 }}
                          viewport={{ once: true, margin: '-10%' }}
                          animate={{
                            backgroundColor: m.cardBg,
                            borderColor: m.border,
                          }}
                          className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
                        >
                          <div className="flex items-baseline gap-3 min-w-0">
                            <motion.span
                              animate={{ color: m.textPrimary }}
                              className="leading-none shrink-0"
                              style={{ fontSize: t.size, fontWeight: t.weight }}
                            >
                              {t.sample}
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

                  <div className="flex flex-col gap-2.5">
                    <motion.h3
                      animate={{ color: m.textMuted }}
                      className="text-[10px] font-semibold uppercase tracking-wider"
                    >
                      Radius · {RADIUS_TOKENS.length}
                    </motion.h3>
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

                    {/* Components preview */}
                    <div className="flex flex-col gap-2 mt-4">
                      <motion.h3
                        animate={{ color: m.textMuted }}
                        className="text-[10px] font-semibold uppercase tracking-wider"
                      >
                        Components · 12
                      </motion.h3>
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
                      </div>
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </motion.div>
      </StudioSurface>
    </StudioWindow>
  );
}
