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
  ChevronRight,
  Check,
  X,
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

interface SectionData {
  id: string;
  label: string;
  score: number;
  found: string[];
  missing: string[];
}

const SECTIONS: SectionData[] = [
  {
    id: 'quick',
    label: 'Quick Reference',
    score: 95,
    found: ['Brand colour with hex', 'Body font + scale', 'Accent + status colours'],
    missing: ['Component naming convention'],
  },
  {
    id: 'colours',
    label: 'Colours',
    score: 92,
    found: ['17 named tokens', 'Hex + RGB values', 'Semantic groups (brand, surface, text)', 'Two modes (light + dark)'],
    missing: ['Status colour with usage notes'],
  },
  {
    id: 'typography',
    label: 'Typography',
    score: 80,
    found: ['Display, heading, body, caption scale', 'Inter + Geist Mono'],
    missing: ['Line-height ratios', 'Letter-spacing tokens'],
  },
  {
    id: 'spacing',
    label: 'Spacing',
    score: 70,
    found: ['4px base scale', 'Common increments (4, 8, 12, 16)'],
    missing: ['Negative-space patterns', 'Container max-widths'],
  },
  {
    id: 'components',
    label: 'Components',
    score: 65,
    found: ['Button (primary, secondary, ghost)', 'Card, Badge, Tabs'],
    missing: ['Hover/focus/disabled states for inputs', 'Component composition examples'],
  },
  {
    id: 'antipatterns',
    label: 'Anti-patterns',
    score: 100,
    found: ['No hardcoded hex values', 'No off-grid spacing', 'No legacy class names'],
    missing: [],
  },
];

const TOTAL = 87;

function colourFor(score: number): string {
  if (score >= 70) return STUDIO_TOKENS.statusSuccess;
  if (score >= 40) return STUDIO_TOKENS.statusWarning;
  return STUDIO_TOKENS.statusError;
}

interface SectionRowProps {
  section: SectionData;
  expanded: boolean;
  onToggle: () => void;
  delay: number;
}

function SectionRow({ section, expanded, onToggle, delay }: SectionRowProps) {
  const colour = colourFor(section.score);
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0, 0, 0.2, 1] }}
      viewport={{ once: true, margin: '-10%' }}
      className="rounded-md border overflow-hidden"
      style={{ borderColor: STUDIO_TOKENS.border }}
    >
      <button
        onClick={onToggle}
        className="flex items-center justify-between gap-3 px-3 py-2.5 w-full transition-colors hover:bg-white/[0.02]"
      >
        <div className="flex items-center gap-2 min-w-0">
          <ChevronRight
            className="h-3.5 w-3.5 transition-transform shrink-0"
            style={{
              color: STUDIO_TOKENS.textMuted,
              transform: expanded ? 'rotate(90deg)' : 'none',
            }}
          />
          <span className="text-[13px] font-medium" style={{ color: STUDIO_TOKENS.textPrimary }}>
            {section.label}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div
            className="h-1.5 w-20 rounded-full overflow-hidden"
            style={{ backgroundColor: STUDIO_TOKENS.bgElevated }}
          >
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${section.score}%` }}
              transition={{ duration: 0.7, delay: delay + 0.1, ease: [0, 0, 0.2, 1] }}
              viewport={{ once: true, margin: '-10%' }}
              className="h-full rounded-full"
              style={{ backgroundColor: colour }}
            />
          </div>
          <span className="text-[12px] tabular-nums font-semibold w-10 text-right" style={{ color: colour }}>
            {section.score}
          </span>
        </div>
      </button>
      {expanded && (
        <div
          className="px-4 pb-3 pt-2 flex flex-col gap-1.5 border-t"
          style={{ borderColor: STUDIO_TOKENS.border, backgroundColor: STUDIO_TOKENS.bgPanel }}
        >
          {section.found.map((item) => (
            <div key={item} className="flex items-start gap-2">
              <Check className="h-3 w-3 mt-0.5 shrink-0" style={{ color: STUDIO_TOKENS.statusSuccess }} />
              <span className="text-[11.5px]" style={{ color: STUDIO_TOKENS.textSecondary }}>
                {item}
              </span>
            </div>
          ))}
          {section.missing.map((item) => (
            <div key={item} className="flex items-start gap-2">
              <X className="h-3 w-3 mt-0.5 shrink-0" style={{ color: STUDIO_TOKENS.statusError }} />
              <span className="text-[11.5px]" style={{ color: STUDIO_TOKENS.textMuted }}>
                {item}
              </span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export function CompletenessMock() {
  const [activeTab, setActiveTab] = useState('quality');
  const [expandedSection, setExpandedSection] = useState<string | null>('components');
  const totalColour = colourFor(TOTAL);
  const radius = 36;
  const circumference = 2 * Math.PI * radius;

  return (
    <StudioWindow projectName="Acme" sourceType="figma" sourceName="acme-design-system">
      <SourcePanel tabs={TABS} activeTab={activeTab} onTab={setActiveTab} width={240}>
        <div className="flex flex-col h-full overflow-hidden">
          {/* Score header */}
          <div className="flex flex-col items-center gap-3 px-4 py-5 border-b" style={{ borderColor: STUDIO_TOKENS.border }}>
            <div className="relative">
              <svg width="96" height="96" viewBox="0 0 96 96">
                <circle
                  cx="48"
                  cy="48"
                  r={radius}
                  fill="none"
                  stroke={STUDIO_TOKENS.border}
                  strokeWidth="6"
                />
                <motion.circle
                  cx="48"
                  cy="48"
                  r={radius}
                  fill="none"
                  stroke={totalColour}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  whileInView={{ strokeDashoffset: circumference * (1 - TOTAL / 100) }}
                  transition={{ duration: 1, delay: 0.3, ease: [0, 0, 0.2, 1] }}
                  viewport={{ once: true, margin: '-10%' }}
                  transform="rotate(-90 48 48)"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[24px] font-semibold leading-none tabular-nums" style={{ color: totalColour }}>
                  {TOTAL}
                </span>
                <span className="text-[9px] mt-1" style={{ color: STUDIO_TOKENS.textMuted }}>
                  / 100
                </span>
              </div>
            </div>
            <span
              className="text-[10px] font-medium uppercase tracking-wider"
              style={{ color: STUDIO_TOKENS.textMuted }}
            >
              Production-ready
            </span>
          </div>
          {/* Quick stats */}
          <div className="px-3 py-3 flex flex-col gap-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider px-2" style={{ color: STUDIO_TOKENS.textMuted }}>
              Suggestions · 4
            </div>
            {[
              { sev: STUDIO_TOKENS.statusError, label: 'No spacing scale' },
              { sev: STUDIO_TOKENS.statusWarning, label: 'Missing focus states' },
              { sev: STUDIO_TOKENS.textMuted, label: '3 token aliases conflict' },
              { sev: STUDIO_TOKENS.textMuted, label: 'No line-height ratios' },
            ].map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-2 rounded px-2 py-1.5 cursor-pointer transition-colors hover:bg-white/5"
              >
                <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: s.sev }} />
                <span className="text-[11px] truncate" style={{ color: STUDIO_TOKENS.textPrimary }}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </SourcePanel>

      <StudioSurface>
        <div className="flex flex-col gap-5 px-7 py-7 overflow-hidden">
          {/* Header */}
          <div className="flex items-baseline justify-between">
            <div className="flex flex-col gap-1">
              <h2 className="text-[20px] font-semibold" style={{ color: STUDIO_TOKENS.textPrimary }}>
                Section breakdown
              </h2>
              <p className="text-[12.5px]" style={{ color: STUDIO_TOKENS.textSecondary }}>
                Six weighted sections of your layout.md. Click any row to see what's found and what's missing.
              </p>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono" style={{ color: STUDIO_TOKENS.textMuted }}>
              <span style={{ color: STUDIO_TOKENS.statusSuccess }}>+6 since last extract</span>
              <span style={{ color: STUDIO_TOKENS.border }}>·</span>
              <span>updated 2m ago</span>
            </div>
          </div>

          {/* Section list — interactive expand */}
          <div className="flex flex-col gap-2">
            {SECTIONS.map((s, i) => (
              <SectionRow
                key={s.id}
                section={s}
                expanded={expandedSection === s.id}
                onToggle={() => setExpandedSection(expandedSection === s.id ? null : s.id)}
                delay={0.15 + i * 0.06}
              />
            ))}
          </div>

          {/* Footer hint */}
          <div
            className="mt-auto rounded-md border px-3 py-2.5 flex items-center justify-between"
            style={{
              borderColor: STUDIO_TOKENS.border,
              backgroundColor: STUDIO_TOKENS.bgPanel,
            }}
          >
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: STUDIO_TOKENS.statusSuccess }} />
              <span className="text-[12px]" style={{ color: STUDIO_TOKENS.textPrimary }}>
                Your AI agent has enough context for on-brand UI most of the time.
              </span>
            </div>
            <button
              className="text-[11px] font-medium rounded-md px-3 py-1 transition-colors"
              style={{
                backgroundColor: STUDIO_TOKENS.accent,
                color: STUDIO_TOKENS.textOnAccent,
              }}
            >
              Re-score
            </button>
          </div>
        </div>
      </StudioSurface>
    </StudioWindow>
  );
}
