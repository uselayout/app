'use client';

import { motion } from 'framer-motion';

interface BreakdownProps {
  label: string;
  score: number;
  delay: number;
}

function Breakdown({ label, score, delay }: BreakdownProps) {
  const colour = score >= 90 ? '#34C759' : score >= 75 ? '#E4F222' : score >= 60 ? '#FF9F0A' : '#FF453A';
  return (
    <div className="grid grid-cols-[140px_1fr_44px] items-center gap-3">
      <span className="font-mono text-[12px] text-white/65 truncate">{label}</span>
      <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${score}%` }}
          transition={{ duration: 0.7, delay, ease: [0, 0, 0.2, 1] }}
          viewport={{ once: true, margin: '-10%' }}
          className="h-full rounded-full"
          style={{ backgroundColor: colour }}
        />
      </div>
      <motion.span
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: delay + 0.4 }}
        viewport={{ once: true, margin: '-10%' }}
        className="font-mono text-[11px] text-white/55 text-right tabular-nums"
      >
        {score}/100
      </motion.span>
    </div>
  );
}

const SECTIONS = [
  { label: 'Quick Reference', score: 95 },
  { label: 'Colours', score: 92 },
  { label: 'Typography', score: 80 },
  { label: 'Spacing', score: 70 },
  { label: 'Components', score: 65 },
  { label: 'Anti-patterns', score: 100 },
];

const SUGGESTIONS = [
  {
    severity: 'high' as const,
    title: 'No spacing scale defined',
    body: 'Extract from common values in your CSS or define a 4px base scale.',
  },
  {
    severity: 'medium' as const,
    title: 'Component inventory missing interactive states',
    body: 'Add hover, focus, and disabled variants to your Button component.',
  },
  {
    severity: 'low' as const,
    title: '3 token aliases conflict with surface-* group',
    body: 'Rename or merge to keep your token graph clean.',
  },
];

const SCORE = 87;

export function CompletenessMock() {
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
            layout.design / acme · quality
          </span>
        </div>
        <div className="flex items-center gap-1 rounded-md border border-white/10 p-0.5 text-[10px] font-mono">
          <button className="rounded-sm px-2 py-0.5 bg-white/10 text-white">Quality</button>
          <button className="rounded-sm px-2 py-0.5 text-white/45">Diff</button>
          <button className="rounded-sm px-2 py-0.5 text-white/45">History</button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 grid grid-cols-[1fr_1.4fr] gap-0 min-h-0">
        {/* Left: score ring */}
        <div className="flex flex-col items-center justify-center gap-5 px-7 py-7 border-r border-white/10">
          <div className="relative">
            <svg width="200" height="200" viewBox="0 0 200 200">
              <circle
                cx="100"
                cy="100"
                r="86"
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="14"
              />
              <motion.circle
                cx="100"
                cy="100"
                r="86"
                fill="none"
                stroke="#E4F222"
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 86}
                initial={{ strokeDashoffset: 2 * Math.PI * 86 }}
                whileInView={{ strokeDashoffset: 2 * Math.PI * 86 * (1 - SCORE / 100) }}
                transition={{ duration: 1.1, delay: 0.2, ease: [0, 0, 0.2, 1] }}
                viewport={{ once: true, margin: '-10%' }}
                transform="rotate(-90 100 100)"
              />
            </svg>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.85 }}
              viewport={{ once: true, margin: '-10%' }}
              className="absolute inset-0 flex flex-col items-center justify-center"
            >
              <span className="text-[56px] font-semibold leading-none text-white tabular-nums">
                {SCORE}
              </span>
              <span className="font-mono text-[11px] text-white/45 mt-1.5">/ 100</span>
            </motion.div>
          </div>
          <div className="text-center">
            <h3 className="text-[16px] font-medium text-white">Production-ready</h3>
            <p className="text-[12px] text-white/55 mt-1 max-w-[260px] leading-snug">
              Your AI agent has enough context for on-brand UI most of the time.
            </p>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-white/40 mt-1">
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#E4F222]" />
              +6 since last extract
            </span>
            <span className="text-white/20">·</span>
            <span>updated 2m ago</span>
          </div>
        </div>

        {/* Right: breakdown + suggestions */}
        <div className="flex flex-col px-7 py-7 gap-6 overflow-hidden">
          <div className="flex flex-col gap-3.5">
            <div className="flex items-baseline justify-between">
              <h3 className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/45">
                Section breakdown
              </h3>
              <span className="font-mono text-[10px] text-white/25">6 weighted sections</span>
            </div>
            <div className="flex flex-col gap-2.5">
              {SECTIONS.map((s, i) => (
                <Breakdown key={s.label} label={s.label} score={s.score} delay={0.2 + i * 0.07} />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2.5 mt-auto">
            <div className="flex items-baseline justify-between">
              <h3 className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/45">
                Suggestions
              </h3>
              <span className="font-mono text-[10px] text-white/25">3 specific fixes</span>
            </div>
            <div className="flex flex-col gap-2">
              {SUGGESTIONS.map((s, i) => {
                const dot =
                  s.severity === 'high'
                    ? 'bg-rose-400'
                    : s.severity === 'medium'
                    ? 'bg-amber-300'
                    : 'bg-white/40';
                return (
                  <motion.div
                    key={s.title}
                    initial={{ opacity: 0, x: 8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.95 + i * 0.08, ease: [0, 0, 0.2, 1] }}
                    viewport={{ once: true, margin: '-10%' }}
                    className="flex items-start gap-2.5 rounded-md border border-white/8 bg-white/[0.02] px-3 py-2"
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${dot} mt-1.5 shrink-0`} />
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-[12px] font-medium text-white/85 truncate">{s.title}</span>
                      <span className="text-[10.5px] text-white/50 leading-snug">{s.body}</span>
                    </div>
                    <button className="ml-auto rounded border border-white/12 px-2 py-0.5 text-[9.5px] font-mono text-white/55 hover:bg-white/5 shrink-0">
                      Fix
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
