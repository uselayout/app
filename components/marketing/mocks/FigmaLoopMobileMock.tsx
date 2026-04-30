'use client';

import { motion } from 'framer-motion';
import { Figma as FigmaIcon, Layers3, ArrowDown, ArrowRightLeft } from 'lucide-react';
import { STUDIO_TOKENS } from './_studio-chrome';

const TOKENS = [
  { hex: '#E4F222', name: 'accent' },
  { hex: '#0C0C0E', name: 'bg-app' },
  { hex: '#141418', name: 'bg-panel' },
  { hex: '#1A1A20', name: 'bg-surface' },
];

export function FigmaLoopMobileMock() {
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
      <div className="flex items-center gap-2 border-b px-4 py-3 shrink-0" style={{ borderColor: STUDIO_TOKENS.border }}>
        <ArrowRightLeft className="h-3.5 w-3.5" style={{ color: STUDIO_TOKENS.brand }} />
        <span className="text-[12px] font-medium" style={{ color: STUDIO_TOKENS.textPrimary }}>
          Figma ↔ Studio · live sync
        </span>
      </div>

      {/* Body — vertical stack: Figma, sync flow, Studio */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        {/* Figma card */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          viewport={{ once: true, margin: '-10%' }}
          className="flex flex-col gap-2 mx-4 mt-4 rounded-lg p-3 border"
          style={{ backgroundColor: '#2C2C2C', borderColor: 'rgba(255,255,255,0.08)' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-white">
              <FigmaIcon className="h-3 w-3" />
              <span className="text-[11.5px] font-medium">Acme · Design System</span>
            </div>
            <span className="text-[9.5px] font-mono text-white/60">file 4kLp</span>
          </div>
          <div className="grid grid-cols-4 gap-2 mt-1">
            {TOKENS.map((t) => (
              <div key={t.name} className="flex flex-col items-center gap-1.5">
                <div
                  className="h-9 w-9 rounded border"
                  style={{ backgroundColor: t.hex, borderColor: 'rgba(0,0,0,0.08)' }}
                />
                <span className="font-mono text-[9px] text-white/55 truncate">{t.name}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Sync arrow + dots */}
        <div className="flex flex-col items-center gap-1 py-3 shrink-0">
          <div className="relative h-12 w-1">
            <div className="absolute inset-0 w-px mx-auto" style={{ backgroundColor: STUDIO_TOKENS.border }} />
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: [0, 1, 1, 0], y: [0, 48] }}
                transition={{
                  duration: 1.5,
                  delay: i * 0.4,
                  repeat: Infinity,
                  repeatDelay: 0.4,
                  ease: 'linear',
                }}
                className="absolute h-1.5 w-1.5 rounded-full left-1/2 -translate-x-1/2"
                style={{ backgroundColor: STUDIO_TOKENS.brand }}
              />
            ))}
          </div>
          <span
            className="text-[9.5px] font-mono uppercase tracking-wider"
            style={{ color: STUDIO_TOKENS.textMuted }}
          >
            MCP webhook · ~120ms
          </span>
        </div>

        {/* Studio card */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          viewport={{ once: true, margin: '-10%' }}
          className="flex flex-col gap-2 mx-4 rounded-lg p-3 border"
          style={{ backgroundColor: STUDIO_TOKENS.bgPanel, borderColor: STUDIO_TOKENS.border }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Layers3 className="h-3 w-3" style={{ color: STUDIO_TOKENS.brand }} />
              <span className="text-[11.5px] font-medium" style={{ color: STUDIO_TOKENS.textPrimary }}>
                Layout Studio · Acme
              </span>
            </div>
            <span className="text-[9.5px] font-mono" style={{ color: STUDIO_TOKENS.statusSuccess }}>
              ● synced 2s
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2 mt-1">
            {TOKENS.map((t) => (
              <div key={t.name} className="flex flex-col items-center gap-1.5">
                <div
                  className="h-9 w-9 rounded border"
                  style={{ backgroundColor: t.hex, borderColor: STUDIO_TOKENS.border }}
                />
                <span
                  className="font-mono text-[9px] truncate"
                  style={{ color: STUDIO_TOKENS.textSecondary }}
                >
                  {t.name}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Tool call hint */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.85 }}
          viewport={{ once: true, margin: '-10%' }}
          className="mx-4 mt-2 mb-3 rounded-md px-3 py-2 flex items-center gap-2 text-[10px] font-mono"
          style={{ backgroundColor: 'rgba(228,242,34,0.06)' }}
        >
          <span style={{ color: STUDIO_TOKENS.brand }}>◆</span>
          <span style={{ color: STUDIO_TOKENS.textSecondary }}>
            AI agent → <span style={{ color: STUDIO_TOKENS.textPrimary }}>get_design_system()</span> · just now
          </span>
        </motion.div>
      </div>
    </div>
  );
}
