'use client';

import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { STUDIO_TOKENS } from './_studio-chrome';

const SCORE = 87;
const SECTIONS = [
  { label: 'Quick Reference', score: 95 },
  { label: 'Colours', score: 92 },
  { label: 'Typography', score: 80 },
  { label: 'Spacing', score: 70 },
  { label: 'Components', score: 65 },
  { label: 'Anti-patterns', score: 100 },
];

function colourFor(score: number): string {
  if (score >= 90) return STUDIO_TOKENS.statusSuccess;
  if (score >= 75) return '#E4F222';
  if (score >= 60) return STUDIO_TOKENS.statusWarning;
  return STUDIO_TOKENS.statusError;
}

export function CompletenessMobileMock() {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;

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
      {/* Score ring */}
      <div className="flex flex-col items-center gap-2.5 py-6 px-4 shrink-0 border-b" style={{ borderColor: STUDIO_TOKENS.border }}>
        <div className="relative">
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r={radius} fill="none" stroke={STUDIO_TOKENS.border} strokeWidth="8" />
            <motion.circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke={STUDIO_TOKENS.brand}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              whileInView={{ strokeDashoffset: circumference * (1 - SCORE / 100) }}
              transition={{ duration: 1.1, delay: 0.2, ease: [0, 0, 0.2, 1] }}
              viewport={{ once: true, margin: '-10%' }}
              transform="rotate(-90 60 60)"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[34px] font-semibold leading-none tabular-nums" style={{ color: STUDIO_TOKENS.textPrimary }}>
              {SCORE}
            </span>
            <span className="font-mono text-[10px] mt-1" style={{ color: STUDIO_TOKENS.textMuted }}>
              / 100
            </span>
          </div>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[14px] font-medium" style={{ color: STUDIO_TOKENS.textPrimary }}>
            Production-ready
          </span>
          <span className="text-[11px] text-center max-w-[260px] leading-snug" style={{ color: STUDIO_TOKENS.textSecondary }}>
            Your AI agent has enough context for on-brand UI.
          </span>
        </div>
      </div>

      {/* Section breakdown */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col gap-3 px-4 py-4">
        <div className="flex items-baseline justify-between">
          <span
            className="text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: STUDIO_TOKENS.textMuted }}
          >
            Section breakdown
          </span>
          <span className="font-mono text-[10px]" style={{ color: STUDIO_TOKENS.textMuted }}>
            6 weighted
          </span>
        </div>
        <div className="flex flex-col gap-2.5">
          {SECTIONS.map((s, i) => {
            const colour = colourFor(s.score);
            return (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 4 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.3 + i * 0.06, ease: [0, 0, 0.2, 1] }}
                viewport={{ once: true, margin: '-10%' }}
                className="flex items-center gap-3"
              >
                <span className="text-[12px] flex-1 truncate" style={{ color: STUDIO_TOKENS.textPrimary }}>
                  {s.label}
                </span>
                <div className="h-1.5 w-20 rounded-full overflow-hidden" style={{ backgroundColor: STUDIO_TOKENS.bgElevated }}>
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${s.score}%` }}
                    transition={{ duration: 0.7, delay: 0.4 + i * 0.06, ease: [0, 0, 0.2, 1] }}
                    viewport={{ once: true, margin: '-10%' }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: colour }}
                  />
                </div>
                <span className="text-[12px] font-mono tabular-nums w-9 text-right" style={{ color: colour }}>
                  {s.score}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
