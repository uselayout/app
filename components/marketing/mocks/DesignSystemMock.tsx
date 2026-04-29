'use client';

import { motion } from 'framer-motion';

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
      { name: 'primary', hex: '#E6E6E6' },
      { name: 'primary-hover', hex: '#F0F0F4' },
      { name: 'accent', hex: '#E4F222' },
      { name: 'accent-soft', hex: '#3a3f0a' },
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

const RADIUS_TOKENS = [
  { name: 'sm', value: 4 },
  { name: 'md', value: 8 },
  { name: 'lg', value: 14 },
  { name: 'pill', value: 999 },
];

interface SwatchTileProps {
  token: Swatch;
  delay: number;
}

function SwatchTile({ token, delay }: SwatchTileProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 4 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0, 0, 0.2, 1] }}
      viewport={{ once: true, margin: '-10%' }}
      className="flex flex-col items-center gap-1.5 w-[82px]"
    >
      <div
        className="h-[40px] w-[40px] rounded-md border border-white/10 shadow-[0_1px_2px_rgba(0,0,0,0.4)]"
        style={{ backgroundColor: token.hex }}
      />
      <span className="font-mono text-[10px] leading-none text-white/70 truncate w-full text-center">
        {token.name}
      </span>
      <span className="font-mono text-[9px] leading-none text-white/40 -mt-1">
        {token.hex.toUpperCase()}
      </span>
    </motion.div>
  );
}

interface SectionLabelProps {
  label: string;
  count?: number;
}

function SectionLabel({ label, count }: SectionLabelProps) {
  return (
    <div className="flex items-baseline gap-2">
      <h3 className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/45">
        {label}
      </h3>
      {count !== undefined && (
        <span className="font-mono text-[10px] text-white/25">{count}</span>
      )}
    </div>
  );
}

export function DesignSystemMock() {
  return (
    <div
      className="absolute inset-0 flex flex-col text-white"
      style={{
        backgroundColor: '#0C0C0E',
        fontFamily: '"Geist", "Inter", -apple-system, sans-serif',
        colorScheme: 'dark',
      }}
    >
      {/* Window chrome */}
      <div className="flex items-center justify-between border-b border-white/10 bg-black/40 px-4 py-2.5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <div className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <div className="h-2.5 w-2.5 rounded-full bg-white/15" />
          </div>
          <span className="font-mono text-[11px] text-white/50">
            layout.design / acme · design-system
          </span>
        </div>
        <div className="flex items-center gap-1 rounded-md border border-white/10 p-0.5">
          <button className="rounded-sm px-2 py-0.5 text-[10px] font-mono bg-white/10 text-white">
            Dark
          </button>
          <button className="rounded-sm px-2 py-0.5 text-[10px] font-mono text-white/45">
            Light
          </button>
        </div>
      </div>

      {/* Tab strip */}
      <div className="flex items-center gap-0.5 border-b border-white/10 bg-black/20 px-3 py-1.5 shrink-0">
        <button className="rounded-sm px-2.5 py-1 text-[11px] bg-white/10 text-white">Tokens</button>
        <button className="rounded-sm px-2.5 py-1 text-[11px] text-white/45">Typography</button>
        <button className="rounded-sm px-2.5 py-1 text-[11px] text-white/45">Components</button>
        <button className="rounded-sm px-2.5 py-1 text-[11px] text-white/45">Spacing</button>
        <div className="ml-auto flex items-center gap-1.5 text-[10px] font-mono text-white/40">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
          <span>17 tokens · synced 2m ago</span>
        </div>
      </div>

      {/* Body: top row (colours | typography/radius), bottom row (components) */}
      <div className="flex-1 grid grid-cols-1 grid-rows-[1fr_auto] overflow-hidden">
        {/* Top: token grid + type scale */}
        <div className="grid grid-cols-[1.55fr_1fr] gap-0 border-b border-white/8 min-h-0">
          {/* Colour groups — 1 column, stacked rows for even fill */}
          <div className="flex flex-col justify-between gap-5 px-7 py-7 border-r border-white/8 overflow-hidden">
            {COLOUR_GROUPS.map((group, gi) => (
              <div key={group.label} className="flex flex-col gap-2.5">
                <SectionLabel label={group.label} count={group.tokens.length} />
                <div className="flex flex-wrap gap-x-2 gap-y-2.5">
                  {group.tokens.map((token, ti) => (
                    <SwatchTile
                      key={token.name}
                      token={token}
                      delay={0.12 + gi * 0.05 + ti * 0.035}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Type scale + radius */}
          <div className="flex flex-col justify-between gap-5 px-7 py-7 overflow-hidden">
            <div className="flex flex-col gap-2.5">
              <SectionLabel label="Type scale" count={TYPE_SCALE.length} />
              <div className="flex flex-col gap-1.5">
                {TYPE_SCALE.map((t, i) => (
                  <motion.div
                    key={t.name}
                    initial={{ opacity: 0, x: 4 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.35, delay: 0.32 + i * 0.05, ease: [0, 0, 0.2, 1] }}
                    viewport={{ once: true, margin: '-10%' }}
                    className="flex items-center justify-between gap-3 rounded-md bg-white/[0.025] px-3 py-2 border border-white/[0.06]"
                  >
                    <div className="flex items-baseline gap-3 min-w-0">
                      <span
                        className="text-white shrink-0 leading-none"
                        style={{ fontSize: t.size, fontWeight: t.weight }}
                      >
                        Aa
                      </span>
                      <span className="font-mono text-[10px] text-white/55 truncate">{t.name}</span>
                    </div>
                    <span className="font-mono text-[10px] text-white/35 shrink-0">
                      {t.size}/{t.weight}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <SectionLabel label="Radius" count={RADIUS_TOKENS.length} />
              <div className="flex items-end gap-3">
                {RADIUS_TOKENS.map((r, i) => (
                  <motion.div
                    key={r.name}
                    initial={{ opacity: 0, y: 4 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.55 + i * 0.05, ease: [0, 0, 0.2, 1] }}
                    viewport={{ once: true, margin: '-10%' }}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <div
                      className="h-9 w-9 border border-white/15 bg-white/5"
                      style={{ borderRadius: Math.min(r.value, 18) }}
                    />
                    <span className="font-mono text-[10px] leading-none text-white/55">{r.name}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom: components preview */}
        <div className="flex items-center gap-7 px-7 py-5 bg-black/20">
          <SectionLabel label="Components" count={12} />
          <motion.button
            initial={{ opacity: 0, y: 4 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.7, ease: [0, 0, 0.2, 1] }}
            viewport={{ once: true, margin: '-10%' }}
            className="rounded-md bg-[#E4F222] px-3 py-1.5 text-[11px] font-medium text-black"
          >
            Primary
          </motion.button>
          <motion.button
            initial={{ opacity: 0, y: 4 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.75, ease: [0, 0, 0.2, 1] }}
            viewport={{ once: true, margin: '-10%' }}
            className="rounded-md border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-white"
          >
            Secondary
          </motion.button>
          <motion.button
            initial={{ opacity: 0, y: 4 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.8, ease: [0, 0, 0.2, 1] }}
            viewport={{ once: true, margin: '-10%' }}
            className="rounded-md border border-white/10 px-3 py-1.5 text-[11px] font-medium text-white/70"
          >
            Ghost
          </motion.button>
          <motion.span
            initial={{ opacity: 0, y: 4 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.85, ease: [0, 0, 0.2, 1] }}
            viewport={{ once: true, margin: '-10%' }}
            className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-0.5 text-[10px] font-mono text-emerald-300"
          >
            Live
          </motion.span>
          <motion.span
            initial={{ opacity: 0, y: 4 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.9, ease: [0, 0, 0.2, 1] }}
            viewport={{ once: true, margin: '-10%' }}
            className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-0.5 text-[10px] font-mono text-amber-200"
          >
            Beta
          </motion.span>
          <div className="ml-auto flex items-center gap-2 text-[10px] font-mono text-white/35">
            <span>tokens.css</span>
            <span className="text-white/15">·</span>
            <span>tokens.json</span>
            <span className="text-white/15">·</span>
            <span>tailwind.config</span>
          </div>
        </div>
      </div>
    </div>
  );
}
