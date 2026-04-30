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
  Loader2,
  Check,
  Circle,
  RefreshCw,
  History,
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

interface StepProps {
  label: string;
  meta?: string;
  status: 'done' | 'running' | 'pending';
  delay: number;
}

function Step({ label, meta, status, delay }: StepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -4 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay, ease: [0, 0, 0.2, 1] }}
      viewport={{ once: true, margin: '-10%' }}
      className="flex items-center gap-2.5"
    >
      <span className="shrink-0 flex items-center justify-center h-4 w-4">
        {status === 'done' && <Check className="h-4 w-4" style={{ color: STUDIO_TOKENS.statusSuccess }} />}
        {status === 'running' && (
          <Loader2 className="h-4 w-4 animate-spin" style={{ color: STUDIO_TOKENS.accent }} />
        )}
        {status === 'pending' && (
          <Circle className="h-3 w-3" style={{ color: STUDIO_TOKENS.borderStrong }} strokeWidth={1.5} />
        )}
      </span>
      <div className="flex flex-col min-w-0 flex-1">
        <span
          className="text-[12px] font-medium"
          style={{ color: status === 'pending' ? STUDIO_TOKENS.textMuted : STUDIO_TOKENS.textPrimary }}
        >
          {label}
        </span>
        {meta && (
          <span className="font-mono text-[10px] truncate" style={{ color: STUDIO_TOKENS.textMuted }}>
            {meta}
          </span>
        )}
      </div>
    </motion.div>
  );
}

// ─── Monaco-style editor (mirrors components/studio/EditorPanel.tsx + STUDIO_THEME_DARK) ─

/**
 * Monaco theme colours (from lib/monaco/themes.ts via STUDIO_THEME_DARK)
 */
const MONACO = {
  bg: '#18181E',
  fg: '#C8C8D0',
  fgMuted: '#6B6B80',
  keyword: '#E4F222', // lime — markdown ## headings + emphasis
  string: '#34D399', // teal — quoted strings
  variable: '#A78BFA', // purple — token names like --accent
  comment: '#6B6B80',
  selection: 'rgba(228,242,34,0.06)',
};

interface MdLineProps {
  delay: number;
  children: React.ReactNode;
}

function MdLine({ delay, children }: MdLineProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.18, delay, ease: 'linear' }}
      viewport={{ once: true, margin: '-10%' }}
      className="font-mono leading-[20px] whitespace-pre"
      style={{ fontSize: 13, color: MONACO.fg, fontFamily: '"Geist Mono", "JetBrains Mono", monospace' }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Inline colour decorator — Monaco's colorProvider renders a tiny swatch
 * BEFORE the hex value. We do the same with an inline-block span.
 */
function HexValue({ hex }: { hex: string }) {
  return (
    <span className="inline-flex items-center align-baseline">
      <span
        className="inline-block align-middle"
        style={{
          width: 10,
          height: 10,
          backgroundColor: hex,
          marginRight: 4,
          border: '1px solid rgba(255,255,255,0.18)',
        }}
      />
      <span style={{ color: MONACO.fg }}>{hex}</span>
    </span>
  );
}

const SECTION_NAV = [
  { label: 'Quick Reference', active: false },
  { label: 'Colours', active: false },
  { label: 'Typography', active: true },
  { label: 'Spacing', active: false },
  { label: 'Components', active: false },
  { label: 'Anti-patterns', active: false },
];

export function ExtractMock() {
  const [activeTab, setActiveTab] = useState('tokens');

  return (
    <StudioWindow
      projectName="Acme"
      sourceType="figma"
      sourceName="figma.com/file/4kLp..."
      rightExtra={
        <div
          className="flex items-center gap-1.5 text-[11px] font-mono px-2 h-7 rounded-[4px]"
          style={{
            backgroundColor: 'rgba(228,242,34,0.08)',
            color: '#E4F222',
            border: `1px solid rgba(228,242,34,0.25)`,
          }}
        >
          <RefreshCw className="h-3 w-3 animate-spin" />
          extracting · 80%
        </div>
      }
      showExport={false}
    >
      <SourcePanel tabs={TABS} activeTab={activeTab} onTab={setActiveTab} width={260}>
        <div className="flex flex-col gap-4 px-4 py-4 overflow-hidden">
          <div className="flex items-baseline justify-between">
            <span
              className="text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: STUDIO_TOKENS.textMuted }}
            >
              Extraction · 4 of 6
            </span>
          </div>
          <div className="flex flex-col gap-3">
            <Step label="Connect to Figma" meta="OAuth · file 4kLp" status="done" delay={0.1} />
            <Step label="Fetch styles" meta="47 colours · 12 text · 8 effects" status="done" delay={0.18} />
            <Step label="Resolve variables" meta="2 modes · light + dark" status="done" delay={0.26} />
            <Step label="Parse components" meta="23 found · resolving instances" status="running" delay={0.34} />
            <Step label="Generate layout.md" status="pending" delay={0.42} />
            <Step label="Compute health score" status="pending" delay={0.5} />
          </div>
          <div className="flex flex-col gap-2 mt-auto">
            <div className="flex items-center justify-between text-[10px] font-mono" style={{ color: STUDIO_TOKENS.textMuted }}>
              <span>23s elapsed</span>
              <span>~ 6s left</span>
            </div>
            <div
              className="h-1.5 rounded-full overflow-hidden"
              style={{ backgroundColor: STUDIO_TOKENS.bgElevated }}
            >
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: '80%' }}
                transition={{ duration: 1, delay: 0.4, ease: [0, 0, 0.2, 1] }}
                viewport={{ once: true, margin: '-10%' }}
                className="h-full rounded-full"
                style={{ backgroundColor: STUDIO_TOKENS.accent }}
              />
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono" style={{ color: STUDIO_TOKENS.textMuted }}>
              <span>47 styles</span>
              <span style={{ color: STUDIO_TOKENS.border }}>·</span>
              <span>23 components</span>
              <span style={{ color: STUDIO_TOKENS.border }}>·</span>
              <span>2 modes</span>
            </div>
          </div>
        </div>
      </SourcePanel>

      <StudioSurface>
        {/* Status bar — mirrors EditorPanel.tsx:341-368 */}
        <div
          className="flex items-center justify-between border-b h-9 px-4 shrink-0"
          style={{ borderColor: STUDIO_TOKENS.border }}
        >
          <span className="text-xs font-medium" style={{ color: STUDIO_TOKENS.textMuted }}>
            layout.md
          </span>
          <div className="flex items-center gap-3">
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              className="text-xs"
              style={{ color: STUDIO_TOKENS.textMuted }}
            >
              Saving…
            </motion.span>
            <button
              className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs hover:bg-white/5 transition-colors"
              style={{ color: STUDIO_TOKENS.textMuted }}
            >
              <History className="h-3 w-3" />
              History
            </button>
            <span
              className="rounded-full px-2 py-0.5 text-xs font-medium tabular-nums text-white"
              style={{ backgroundColor: STUDIO_TOKENS.statusSuccess }}
            >
              ~3.2k tokens
            </span>
          </div>
        </div>

        {/* Section navigator — mirrors EditorPanel.tsx:378-390 */}
        <div
          className="flex gap-1 overflow-x-auto border-b px-4 py-1.5 shrink-0"
          style={{ borderColor: STUDIO_TOKENS.border }}
        >
          {SECTION_NAV.map((s) => (
            <button
              key={s.label}
              className="shrink-0 rounded px-2 py-0.5 text-[10px] transition-colors hover:bg-white/5"
              style={{
                color: s.active ? STUDIO_TOKENS.textPrimary : STUDIO_TOKENS.textMuted,
                backgroundColor: s.active ? STUDIO_TOKENS.bgHover : 'transparent',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Monaco editor surface */}
        <div
          className="flex-1 min-h-0 relative overflow-hidden"
          style={{ backgroundColor: MONACO.bg }}
        >
          {/* Top fade gradient (real StreamingPreview has this) */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 z-10 h-6"
            style={{
              background: `linear-gradient(to bottom, ${MONACO.bg}, transparent)`,
            }}
          />

          <div className="px-5 pt-5 pb-12 overflow-hidden">
            <MdLine delay={0.4}>
              <span style={{ color: MONACO.keyword }}>#</span> Acme Design System
            </MdLine>
            <MdLine delay={0.46}>{' '}</MdLine>
            <MdLine delay={0.5}>
              <span style={{ color: MONACO.comment }}>Source: Figma · file 4kLp · 2 modes (light + dark)</span>
            </MdLine>
            <MdLine delay={0.54}>
              <span style={{ color: MONACO.comment }}>Generated: 2026-04-29 · Layout v1.4</span>
            </MdLine>
            <MdLine delay={0.58}>{' '}</MdLine>

            <MdLine delay={0.62}>
              <span style={{ color: MONACO.keyword }}>##</span> Quick Reference
            </MdLine>
            <MdLine delay={0.66}>{' '}</MdLine>
            <MdLine delay={0.7}>
              - **Brand**: <HexValue hex="#E4F222" /> (lime accent)
            </MdLine>
            <MdLine delay={0.74}>- **Surface**: 5-step elevation, dark-first</MdLine>
            <MdLine delay={0.78}>- **Body font**: Inter, 16/24, weight 400</MdLine>
            <MdLine delay={0.82}>- **Display font**: Inter, 56/64, weight 600</MdLine>
            <MdLine delay={0.86}>- **Spacing**: 4px base, 12-step scale</MdLine>
            <MdLine delay={0.9}>{' '}</MdLine>

            <MdLine delay={0.94}>
              <span style={{ color: MONACO.keyword }}>##</span> Colours
            </MdLine>
            <MdLine delay={0.98}>{' '}</MdLine>
            <MdLine delay={1.02}>
              <span style={{ color: MONACO.fgMuted }}>```css</span>
            </MdLine>
            <MdLine delay={1.06}>
              <span style={{ color: MONACO.variable }}>--accent</span>: <HexValue hex="#E4F222" />;
            </MdLine>
            <MdLine delay={1.1}>
              <span style={{ color: MONACO.variable }}>--accent-soft</span>: <HexValue hex="#3A3F0A" />;
            </MdLine>
            <MdLine delay={1.14}>
              <span style={{ color: MONACO.variable }}>--bg-app</span>: <HexValue hex="#0C0C0E" />;
            </MdLine>
            <MdLine delay={1.18}>
              <span style={{ color: MONACO.variable }}>--bg-panel</span>: <HexValue hex="#141418" />;
            </MdLine>
            <MdLine delay={1.22}>
              <span style={{ color: MONACO.variable }}>--bg-surface</span>: <HexValue hex="#1A1A20" />;
            </MdLine>
            <MdLine delay={1.26}>
              <span style={{ color: MONACO.variable }}>--bg-elevated</span>: <HexValue hex="#222228" />;
            </MdLine>
            <MdLine delay={1.3}>
              <span style={{ color: MONACO.variable }}>--text-primary</span>: <HexValue hex="#EDEDF4" />;
            </MdLine>
            <MdLine delay={1.34}>
              <span style={{ color: MONACO.variable }}>--success</span>: <HexValue hex="#34C759" />;
            </MdLine>
            <MdLine delay={1.38}>
              <span style={{ color: MONACO.variable }}>--warning</span>: <HexValue hex="#FF9F0A" />;
            </MdLine>
            <MdLine delay={1.42}>
              <span style={{ color: MONACO.variable }}>--error</span>: <HexValue hex="#FF453A" />;
            </MdLine>
            <MdLine delay={1.46}>
              <span style={{ color: MONACO.fgMuted }}>```</span>
            </MdLine>
            <MdLine delay={1.5}>{' '}</MdLine>

            <MdLine delay={1.54}>
              <span style={{ color: MONACO.keyword }}>##</span> Typography
              <motion.span
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 1.6 }}
                viewport={{ once: true, margin: '-10%' }}
                className="inline-block w-[7px] h-[15px] align-text-bottom ml-0.5 animate-pulse"
                style={{ backgroundColor: MONACO.fg }}
              />
            </MdLine>
          </div>

          {/* Bottom fade gradient — gives streaming preview look */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-12"
            style={{
              background: `linear-gradient(to top, ${MONACO.bg}, transparent)`,
            }}
          />
        </div>
      </StudioSurface>
    </StudioWindow>
  );
}
