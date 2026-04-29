'use client';

import { motion } from 'framer-motion';
import { Loader2, Check, Circle, RefreshCw, Figma as FigmaIcon } from 'lucide-react';
import { STUDIO_TOKENS } from './_studio-chrome';

const MONACO = {
  bg: '#18181E',
  fg: '#C8C8D0',
  fgMuted: '#6B6B80',
  keyword: '#E4F222',
  variable: '#A78BFA',
  comment: '#6B6B80',
};

function HexValue({ hex }: { hex: string }) {
  return (
    <span className="inline-flex items-center align-baseline">
      <span
        className="inline-block align-middle"
        style={{
          width: 9,
          height: 9,
          backgroundColor: hex,
          marginRight: 4,
          border: '1px solid rgba(255,255,255,0.18)',
        }}
      />
      <span style={{ color: MONACO.fg }}>{hex}</span>
    </span>
  );
}

function MdLine({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="font-mono leading-[18px] whitespace-pre"
      style={{ fontSize: 11.5, color: MONACO.fg, fontFamily: '"Geist Mono", monospace' }}
    >
      {children}
    </div>
  );
}

function Step({
  label,
  meta,
  status,
  delay,
}: {
  label: string;
  meta?: string;
  status: 'done' | 'running' | 'pending';
  delay: number;
}) {
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
        {status === 'running' && <Loader2 className="h-4 w-4 animate-spin" style={{ color: STUDIO_TOKENS.brand }} />}
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

export function ExtractMobileMock() {
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
      {/* URL bar */}
      <div className="flex items-center gap-2 border-b px-3.5 py-2.5 shrink-0" style={{ borderColor: STUDIO_TOKENS.border }}>
        <FigmaIcon className="h-3 w-3 shrink-0" style={{ color: STUDIO_TOKENS.textMuted }} />
        <span className="font-mono text-[11px] truncate" style={{ color: STUDIO_TOKENS.textPrimary }}>
          figma.com/file/4kLp…
        </span>
        <div
          className="ml-auto flex items-center gap-1.5 text-[10px] font-mono px-2 h-6 rounded shrink-0"
          style={{
            backgroundColor: 'rgba(228,242,34,0.08)',
            color: STUDIO_TOKENS.brand,
            border: `1px solid rgba(228,242,34,0.25)`,
          }}
        >
          <RefreshCw className="h-2.5 w-2.5 animate-spin" />
          80%
        </div>
      </div>

      {/* Steps */}
      <div className="flex flex-col gap-3 px-4 py-3.5 border-b shrink-0" style={{ borderColor: STUDIO_TOKENS.border }}>
        <Step label="Connect to Figma" meta="OAuth · file 4kLp" status="done" delay={0.05} />
        <Step label="Fetch styles" meta="47 colours · 12 text · 8 effects" status="done" delay={0.12} />
        <Step label="Resolve variables" meta="2 modes · light + dark" status="done" delay={0.18} />
        <Step label="Parse components" meta="23 found · resolving" status="running" delay={0.24} />
      </div>

      {/* Progress */}
      <div className="flex flex-col gap-1.5 px-4 py-2.5 border-b shrink-0" style={{ borderColor: STUDIO_TOKENS.border, backgroundColor: STUDIO_TOKENS.bgPanel }}>
        <div className="flex items-center justify-between text-[10px] font-mono" style={{ color: STUDIO_TOKENS.textMuted }}>
          <span>23s elapsed</span>
          <span>~ 6s left</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: STUDIO_TOKENS.bgElevated }}>
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: '80%' }}
            transition={{ duration: 1, delay: 0.3, ease: [0, 0, 0.2, 1] }}
            viewport={{ once: true, margin: '-10%' }}
            className="h-full rounded-full"
            style={{ backgroundColor: STUDIO_TOKENS.brand }}
          />
        </div>
      </div>

      {/* layout.md preview */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col" style={{ backgroundColor: MONACO.bg }}>
        <div className="flex items-center gap-2 border-b px-3.5 py-1.5 shrink-0" style={{ borderColor: STUDIO_TOKENS.border }}>
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: STUDIO_TOKENS.brand }} />
          <span className="font-mono text-[11px]" style={{ color: STUDIO_TOKENS.textPrimary }}>
            layout.md
          </span>
          <span className="ml-auto font-mono text-[9.5px]" style={{ color: STUDIO_TOKENS.textMuted }}>
            writing live
          </span>
        </div>
        <div className="flex-1 px-4 pt-3 pb-4 overflow-hidden">
          <MdLine>
            <span style={{ color: MONACO.keyword }}>#</span> Acme Design System
          </MdLine>
          <MdLine>{' '}</MdLine>
          <MdLine>
            <span style={{ color: MONACO.keyword }}>##</span> Colours
          </MdLine>
          <MdLine>
            <span style={{ color: MONACO.variable }}>--accent</span>: <HexValue hex="#E4F222" />;
          </MdLine>
          <MdLine>
            <span style={{ color: MONACO.variable }}>--bg-app</span>: <HexValue hex="#0C0C0E" />;
          </MdLine>
          <MdLine>
            <span style={{ color: MONACO.variable }}>--bg-panel</span>: <HexValue hex="#141418" />;
          </MdLine>
          <MdLine>
            <span style={{ color: MONACO.variable }}>--text-primary</span>: <HexValue hex="#EDEDF4" />;
          </MdLine>
          <MdLine>
            <span style={{ color: MONACO.variable }}>--success</span>: <HexValue hex="#34C759" />;
          </MdLine>
          <MdLine>
            <span
              className="inline-block w-[6px] h-3 align-middle animate-pulse"
              style={{ backgroundColor: STUDIO_TOKENS.brand }}
            />
          </MdLine>
        </div>
      </div>
    </div>
  );
}
