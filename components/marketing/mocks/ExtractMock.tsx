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

interface MdLineProps {
  children: React.ReactNode;
  delay: number;
  type?: 'h1' | 'h2' | 'meta' | 'list' | 'code' | 'space';
}

function MdLine({ children, delay, type = 'list' }: MdLineProps) {
  const cls =
    type === 'h1'
      ? 'text-[14px] font-semibold'
      : type === 'h2'
      ? 'text-[12.5px] font-semibold mt-1.5'
      : type === 'meta'
      ? 'text-[10.5px]'
      : type === 'code'
      ? 'text-[11px]'
      : 'text-[11px]';
  const colour =
    type === 'h1' || type === 'h2'
      ? STUDIO_TOKENS.textPrimary
      : type === 'meta'
      ? STUDIO_TOKENS.textMuted
      : type === 'code'
      ? STUDIO_TOKENS.accent
      : STUDIO_TOKENS.textSecondary;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.25, delay, ease: 'linear' }}
      viewport={{ once: true, margin: '-10%' }}
      className={`font-mono leading-[1.6] ${cls} ${type === 'space' ? 'h-1.5' : ''}`}
      style={{ color: colour }}
    >
      {children}
    </motion.div>
  );
}

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
        {/* Editor-like header */}
        <div
          className="flex items-center justify-between border-b h-9 px-4 shrink-0"
          style={{ borderColor: STUDIO_TOKENS.border, backgroundColor: STUDIO_TOKENS.bgPanel }}
        >
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: STUDIO_TOKENS.accent }} />
            <span className="font-mono text-[11.5px]" style={{ color: STUDIO_TOKENS.textPrimary }}>
              layout.md
            </span>
            <span className="font-mono text-[10px]" style={{ color: STUDIO_TOKENS.textMuted }}>
              · writing live
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono" style={{ color: STUDIO_TOKENS.textMuted }}>
            <span>tokens.css · tokens.json · tailwind.config</span>
          </div>
        </div>
        <div className="flex-1 overflow-hidden px-6 py-4 min-h-0">
          <MdLine type="h1" delay={0.5}># Acme Design System</MdLine>
          <MdLine type="space" delay={0.55}> </MdLine>
          <MdLine type="meta" delay={0.6}>Source: Figma · file 4kLp · 2 modes (light + dark)</MdLine>
          <MdLine type="meta" delay={0.66}>Generated: 2026-04-29 · Layout v1.4</MdLine>
          <MdLine type="space" delay={0.72}> </MdLine>
          <MdLine type="h2" delay={0.78}>## Quick Reference</MdLine>
          <MdLine type="space" delay={0.82}> </MdLine>
          <MdLine delay={0.88}>
            - **Brand**: <span style={{ color: STUDIO_TOKENS.accent }}>#E4F222</span> (lime accent)
          </MdLine>
          <MdLine delay={0.95}>- **Surface**: 5-step elevation, dark-first</MdLine>
          <MdLine delay={1.02}>- **Body font**: Inter, 16/24, weight 400</MdLine>
          <MdLine delay={1.09}>- **Display font**: Inter, 56/64, weight 600</MdLine>
          <MdLine type="space" delay={1.14}> </MdLine>
          <MdLine type="h2" delay={1.2}>## Colours</MdLine>
          <MdLine type="space" delay={1.24}> </MdLine>
          <MdLine type="code" delay={1.3}>--accent: #E4F222;</MdLine>
          <MdLine type="code" delay={1.36}>--bg-app: #0C0C0E;</MdLine>
          <MdLine type="code" delay={1.42}>--bg-panel: #141418;</MdLine>
          <MdLine type="code" delay={1.48}>--bg-surface: #1A1A20;</MdLine>
          <MdLine type="code" delay={1.54}>--bg-elevated: #222228;</MdLine>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 1.65 }}
            viewport={{ once: true, margin: '-10%' }}
            className="font-mono text-[11px] leading-[1.6]"
          >
            <span
              className="inline-block w-[6px] h-3 align-middle animate-pulse"
              style={{ backgroundColor: STUDIO_TOKENS.accent }}
            />
          </motion.div>
        </div>
      </StudioSurface>
    </StudioWindow>
  );
}
