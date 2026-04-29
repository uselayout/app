'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Figma as FigmaIcon, ArrowRightLeft, ArrowLeft, ArrowRight, Layers, Layers3 } from 'lucide-react';
import { STUDIO_TOKENS } from './_studio-chrome';

type Direction = 'fwd' | 'rev';

interface SwatchProps {
  hex: string;
  name: string;
  delay: number;
  highlight?: boolean;
}

function Swatch({ hex, name, delay, highlight }: SwatchProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, delay, ease: [0, 0, 0.2, 1] }}
      viewport={{ once: true, margin: '-10%' }}
      className="flex flex-col items-center gap-1.5"
    >
      <div
        className="h-9 w-9 rounded border"
        style={{
          backgroundColor: hex,
          borderColor: highlight ? STUDIO_TOKENS.accent : 'rgba(0,0,0,0.08)',
          boxShadow: highlight ? `0 0 0 2px white, 0 0 0 4px ${STUDIO_TOKENS.accent}80` : 'none',
        }}
      />
      <span className="font-mono text-[9px] leading-none" style={{ color: 'rgba(0,0,0,0.55)' }}>
        {name}
      </span>
    </motion.div>
  );
}

function StudioSwatch({ hex, name, delay, highlight }: SwatchProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, delay, ease: [0, 0, 0.2, 1] }}
      viewport={{ once: true, margin: '-10%' }}
      className="flex flex-col items-center gap-1.5"
    >
      <div
        className="h-9 w-9 rounded border"
        style={{
          backgroundColor: hex,
          borderColor: highlight ? STUDIO_TOKENS.accent : STUDIO_TOKENS.border,
          boxShadow: highlight ? `0 0 0 2px ${STUDIO_TOKENS.bgApp}, 0 0 0 4px ${STUDIO_TOKENS.accent}80` : 'none',
        }}
      />
      <span className="font-mono text-[9px] leading-none" style={{ color: STUDIO_TOKENS.textSecondary }}>
        {name}
      </span>
    </motion.div>
  );
}

const TOKENS = [
  { hex: '#E4F222', name: 'accent' },
  { hex: '#0C0C0E', name: 'bg-app' },
  { hex: '#141418', name: 'bg-panel' },
  { hex: '#1A1A20', name: 'bg-surface' },
  { hex: '#222228', name: 'bg-elevated' },
  { hex: '#EDEDF4', name: 'text-primary' },
];

export function FigmaLoopMock() {
  const [direction, setDirection] = useState<Direction>('fwd');

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
      <div
        className="flex items-center justify-between border-b px-4 py-3 shrink-0"
        style={{ borderColor: STUDIO_TOKENS.border, backgroundColor: STUDIO_TOKENS.bgPanel }}
      >
        <div className="flex items-center gap-2">
          <ArrowRightLeft className="h-3.5 w-3.5" style={{ color: STUDIO_TOKENS.accent }} />
          <span className="font-mono text-[12px]" style={{ color: STUDIO_TOKENS.textPrimary }}>
            Figma ↔ Layout Studio · live sync
          </span>
        </div>
        <div
          className="flex items-center gap-1 rounded-md border p-0.5"
          style={{ borderColor: STUDIO_TOKENS.borderStrong }}
        >
          <button
            onClick={() => setDirection('fwd')}
            className="flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-[10px] font-medium transition-colors"
            style={{
              backgroundColor: direction === 'fwd' ? STUDIO_TOKENS.accent : 'transparent',
              color: direction === 'fwd' ? STUDIO_TOKENS.textOnAccent : STUDIO_TOKENS.textMuted,
            }}
          >
            <ArrowRight className="h-2.5 w-2.5" />
            Figma → Studio
          </button>
          <button
            onClick={() => setDirection('rev')}
            className="flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-[10px] font-medium transition-colors"
            style={{
              backgroundColor: direction === 'rev' ? STUDIO_TOKENS.accent : 'transparent',
              color: direction === 'rev' ? STUDIO_TOKENS.textOnAccent : STUDIO_TOKENS.textMuted,
            }}
          >
            <ArrowLeft className="h-2.5 w-2.5" />
            Studio → Figma
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 grid grid-cols-[1fr_64px_1fr] min-h-0">
        {/* LEFT: Figma file */}
        <div className="flex flex-col bg-[#2C2C2C] min-h-0 overflow-hidden">
          <div
            className="flex items-center justify-between border-b border-black/40 px-4 py-2 shrink-0"
            style={{ backgroundColor: '#1E1E1E' }}
          >
            <div className="flex items-center gap-2 text-white">
              <FigmaIcon className="h-3.5 w-3.5" />
              <span className="text-[11px] font-medium">Acme · Design System</span>
              <span className="text-[10px] text-white/45">main</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-white/55">
              <Layers className="h-3 w-3" />
              <span>3 collaborators</span>
            </div>
          </div>
          {/* Faux Figma canvas */}
          <div
            className="flex-1 relative overflow-hidden"
            style={{
              backgroundImage: `radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)`,
              backgroundSize: '20px 20px',
            }}
          >
            {/* Token frame */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true, margin: '-10%' }}
              className="absolute top-6 left-6 right-6 bg-white rounded-md p-4 shadow-[0_2px_8px_rgba(0,0,0,0.4)] flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-[12px] text-black/85">Variables · Brand + Surface</span>
                <span className="font-mono text-[9px] text-black/45">2 modes</span>
              </div>
              <div className="grid grid-cols-6 gap-3">
                {TOKENS.map((t, i) => (
                  <Swatch
                    key={t.name}
                    hex={t.hex}
                    name={t.name}
                    delay={0.3 + i * 0.05}
                    highlight={direction === 'fwd' && i === 0}
                  />
                ))}
              </div>
            </motion.div>
            {/* Token-edit indicator (when fwd direction) */}
            {direction === 'fwd' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.7 }}
                viewport={{ once: true, margin: '-10%' }}
                className="absolute bottom-8 left-12 rounded-md px-2.5 py-1.5 text-[10px] font-mono shadow-lg whitespace-nowrap"
                style={{ backgroundColor: STUDIO_TOKENS.accent, color: STUDIO_TOKENS.textOnAccent }}
              >
                <span className="font-semibold">designer · just now</span>
                <br />
                <span className="opacity-75">changed accent #E4F222 → #E8F84F</span>
              </motion.div>
            )}
            {/* Component frame placeholder */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              viewport={{ once: true, margin: '-10%' }}
              className="absolute bottom-4 right-6 left-[55%] h-[80px] bg-white rounded-md p-2.5 shadow-[0_2px_8px_rgba(0,0,0,0.4)] flex items-center gap-2"
            >
              <div className="text-[9px] font-mono text-black/45 shrink-0">Components</div>
              <div className="flex items-center gap-1.5 flex-1">
                <button
                  className="rounded-md px-2 py-1 text-[9px] font-medium text-white"
                  style={{ backgroundColor: '#0C0C0E' }}
                >
                  Primary
                </button>
                <button className="rounded-md border border-black/12 px-2 py-1 text-[9px] font-medium text-black">
                  Secondary
                </button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* CENTRE: sync flow */}
        <div className="flex flex-col items-center justify-center gap-3 px-2 py-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true, margin: '-10%' }}
            className="flex flex-col items-center gap-2"
          >
            <div
              className="h-8 w-8 rounded-full border-2 flex items-center justify-center"
              style={{
                borderColor: STUDIO_TOKENS.accent,
                backgroundColor: STUDIO_TOKENS.bgApp,
              }}
            >
              {direction === 'fwd' ? (
                <ArrowRight className="h-4 w-4" style={{ color: STUDIO_TOKENS.accent }} />
              ) : (
                <ArrowLeft className="h-4 w-4" style={{ color: STUDIO_TOKENS.accent }} />
              )}
            </div>
            {/* Animated sync dots */}
            <div className="relative h-32 w-1 flex flex-col items-center">
              <div className="absolute inset-0 w-px" style={{ backgroundColor: STUDIO_TOKENS.border }} />
              {[0, 1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: direction === 'fwd' ? -10 : 130 }}
                  animate={{
                    opacity: [0, 1, 1, 0],
                    y: direction === 'fwd' ? [0, 130] : [130, 0],
                  }}
                  transition={{
                    duration: 1.6,
                    delay: i * 0.4,
                    repeat: Infinity,
                    repeatDelay: 0.4,
                    ease: 'linear',
                  }}
                  className="absolute h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: STUDIO_TOKENS.accent }}
                />
              ))}
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <span
                className="text-[10px] font-mono uppercase tracking-wider"
                style={{ color: STUDIO_TOKENS.textMuted }}
              >
                MCP webhook
              </span>
              <span
                className="text-[9px] font-mono"
                style={{ color: STUDIO_TOKENS.textMuted }}
              >
                ~120ms
              </span>
            </div>
          </motion.div>
        </div>

        {/* RIGHT: Layout Studio */}
        <div className="flex flex-col min-h-0 overflow-hidden" style={{ backgroundColor: STUDIO_TOKENS.bgApp }}>
          <div
            className="flex items-center justify-between border-b px-4 py-2 shrink-0"
            style={{ borderColor: STUDIO_TOKENS.border, backgroundColor: STUDIO_TOKENS.bgPanel }}
          >
            <div className="flex items-center gap-2">
              <Layers3 className="h-3.5 w-3.5" style={{ color: STUDIO_TOKENS.accent }} />
              <span className="text-[11px] font-medium">Layout Studio</span>
              <span className="text-[10px]" style={{ color: STUDIO_TOKENS.textMuted }}>Acme</span>
            </div>
            <span className="text-[10px] font-mono" style={{ color: STUDIO_TOKENS.statusSuccess }}>
              ● synced 2s ago
            </span>
          </div>
          <div className="flex-1 px-5 py-4 flex flex-col gap-4 overflow-hidden">
            {/* Tokens preview */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-baseline justify-between">
                <span
                  className="text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: STUDIO_TOKENS.textMuted }}
                >
                  Tokens · 6
                </span>
                <span className="text-[9.5px] font-mono" style={{ color: STUDIO_TOKENS.textMuted }}>
                  acme-design-system.fig
                </span>
              </div>
              <div className="grid grid-cols-6 gap-3">
                {TOKENS.map((t, i) => (
                  <StudioSwatch
                    key={t.name}
                    hex={t.hex}
                    name={t.name}
                    delay={0.4 + i * 0.05}
                    highlight={direction === 'fwd' && i === 0}
                  />
                ))}
              </div>
            </div>

            {/* layout.md preview */}
            <div className="flex flex-col gap-2 mt-2">
              <div className="flex items-baseline justify-between">
                <span
                  className="text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: STUDIO_TOKENS.textMuted }}
                >
                  layout.md · auto-updated
                </span>
              </div>
              <div
                className="rounded-md border px-3 py-2 font-mono text-[10.5px] leading-[1.6] flex flex-col gap-0.5"
                style={{
                  borderColor: STUDIO_TOKENS.border,
                  backgroundColor: STUDIO_TOKENS.bgPanel,
                }}
              >
                <div style={{ color: STUDIO_TOKENS.textPrimary }}>## Colours</div>
                <div style={{ color: STUDIO_TOKENS.textSecondary }}>
                  <span style={{ color: STUDIO_TOKENS.accent }}>--accent</span>:{' '}
                  <span style={{ color: STUDIO_TOKENS.accent }}>{direction === 'fwd' ? '#E8F84F' : '#E4F222'}</span>;
                </div>
                <div style={{ color: STUDIO_TOKENS.textSecondary }}>--bg-app: #0C0C0E;</div>
                <div style={{ color: STUDIO_TOKENS.textSecondary }}>--bg-panel: #141418;</div>
              </div>
            </div>

            {/* Tool calls */}
            <div className="flex flex-col gap-1.5 mt-auto">
              <div
                className="rounded px-2.5 py-1.5 text-[10px] font-mono flex items-center gap-2"
                style={{ backgroundColor: 'rgba(228,242,34,0.06)' }}
              >
                <span style={{ color: STUDIO_TOKENS.accent }}>◆</span>
                <span style={{ color: STUDIO_TOKENS.textSecondary }}>
                  AI agent → <span style={{ color: STUDIO_TOKENS.textPrimary }}>get_design_system()</span> · 3 callers · just now
                </span>
              </div>
              <div
                className="rounded px-2.5 py-1.5 text-[10px] font-mono flex items-center gap-2"
                style={{ backgroundColor: 'rgba(52,199,89,0.06)' }}
              >
                <span style={{ color: STUDIO_TOKENS.statusSuccess }}>●</span>
                <span style={{ color: STUDIO_TOKENS.textSecondary }}>
                  3 in-flight components · re-rendered with new --accent
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
