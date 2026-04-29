'use client';

import { motion } from 'framer-motion';

interface StepProps {
  label: string;
  meta?: string;
  status: 'done' | 'running' | 'pending';
  delay: number;
}

function Step({ label, meta, status, delay }: StepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay, ease: [0, 0, 0.2, 1] }}
      viewport={{ once: true, margin: '-10%' }}
      className="flex items-center gap-3"
    >
      <span className="shrink-0 flex items-center justify-center h-5 w-5">
        {status === 'done' && (
          <span className="flex items-center justify-center h-4 w-4 rounded-full bg-emerald-400/20 border border-emerald-400/40">
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="rgb(110 231 183)" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
        )}
        {status === 'running' && (
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
            className="block h-4 w-4 rounded-full border-2 border-[#E4F222]/35 border-t-[#E4F222]"
          />
        )}
        {status === 'pending' && (
          <span className="block h-3 w-3 rounded-full border border-white/20" />
        )}
      </span>
      <div className="flex flex-col min-w-0 flex-1">
        <span
          className={`text-[12px] font-medium ${
            status === 'pending' ? 'text-white/35' : 'text-white/85'
          }`}
        >
          {label}
        </span>
        {meta && (
          <span className="font-mono text-[10px] text-white/40 truncate">{meta}</span>
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
      ? 'text-[14px] font-semibold text-white'
      : type === 'h2'
      ? 'text-[12px] font-semibold text-white/85 mt-1.5'
      : type === 'meta'
      ? 'text-[10.5px] text-white/45'
      : type === 'code'
      ? 'text-[10.5px] text-[#E4F222]/85 font-mono'
      : type === 'space'
      ? ''
      : 'text-[11px] text-white/65';
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.25, delay, ease: 'linear' }}
      viewport={{ once: true, margin: '-10%' }}
      className={`font-mono leading-[1.6] ${cls} ${type === 'space' ? 'h-1.5' : ''}`}
    >
      {children}
    </motion.div>
  );
}

export function ExtractMock() {
  return (
    <div
      className="absolute inset-0 flex flex-col text-white"
      style={{
        backgroundColor: '#0C0C0E',
        fontFamily: '"Geist", "Inter", -apple-system, sans-serif',
        colorScheme: 'dark',
      }}
    >
      {/* Window chrome with URL bar */}
      <div className="flex items-center gap-3 border-b border-white/10 bg-black/40 px-4 py-2.5 shrink-0">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <div className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <div className="h-2.5 w-2.5 rounded-full bg-white/15" />
        </div>
        <div className="flex-1 flex items-center gap-2 rounded-md border border-white/12 bg-black/40 px-3 py-1">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2">
            <path d="M16 4h5v5M21 4l-7 7M9 11l4 4M11 9l4 4M3 21l4-4" />
          </svg>
          <span className="font-mono text-[11px] text-white/65">
            https://www.figma.com/design/4kLp.../acme-design-system
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-300/80">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
          extracting
        </div>
      </div>

      {/* Body: steps (left) + layout.md preview (right) */}
      <div className="flex-1 grid grid-cols-[1fr_1.4fr] min-h-0">
        {/* Steps */}
        <div className="flex flex-col gap-5 px-7 py-6 border-r border-white/10 overflow-hidden">
          <div className="flex items-baseline justify-between">
            <h3 className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/45">
              Extraction
            </h3>
            <span className="font-mono text-[10px] text-white/30">step 4 of 6</span>
          </div>
          <div className="flex flex-col gap-3">
            <Step
              label="Connect to Figma"
              meta="OAuth · file 4kLp..."
              status="done"
              delay={0.1}
            />
            <Step
              label="Fetch styles"
              meta="47 colour styles · 12 text styles · 8 effects"
              status="done"
              delay={0.18}
            />
            <Step
              label="Resolve variables"
              meta="2 modes · light + dark"
              status="done"
              delay={0.26}
            />
            <Step
              label="Parse components"
              meta="23 components found · resolving instances"
              status="running"
              delay={0.34}
            />
            <Step label="Generate layout.md" status="pending" delay={0.42} />
            <Step label="Compute health score" status="pending" delay={0.5} />
          </div>

          <div className="mt-auto flex flex-col gap-2">
            <div className="flex items-center justify-between text-[10px] font-mono text-white/45">
              <span>~ 80% · 23s elapsed</span>
              <span>est. 6s left</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: '80%' }}
                transition={{ duration: 1.0, delay: 0.4, ease: [0, 0, 0.2, 1] }}
                viewport={{ once: true, margin: '-10%' }}
                className="h-full rounded-full bg-[#E4F222]"
              />
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-white/35">
              <span>47 styles</span>
              <span className="text-white/15">·</span>
              <span>23 components</span>
              <span className="text-white/15">·</span>
              <span>2 modes</span>
            </div>
          </div>
        </div>

        {/* layout.md preview */}
        <div className="flex flex-col bg-[#0A0A0C] min-h-0">
          <div className="flex items-center justify-between border-b border-white/8 px-4 py-1.5 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[#E4F222]">●</span>
              <span className="font-mono text-[11px] text-white/75">layout.md</span>
            </div>
            <span className="font-mono text-[9.5px] text-white/35">writing live</span>
          </div>
          <div className="flex-1 overflow-hidden px-5 py-3 min-h-0">
            <MdLine type="h1" delay={0.6}># Acme Design System</MdLine>
            <MdLine type="space" delay={0.65}> </MdLine>
            <MdLine type="meta" delay={0.7}>Source: Figma · file 4kLp · 2 modes</MdLine>
            <MdLine type="meta" delay={0.74}>Generated: 2026-04-29</MdLine>
            <MdLine type="space" delay={0.78}> </MdLine>
            <MdLine type="h2" delay={0.82}>## Quick Reference</MdLine>
            <MdLine type="space" delay={0.86}> </MdLine>
            <MdLine delay={0.9}>- **Brand**: <span className="text-[#E4F222]">#E4F222</span> (lime · accent)</MdLine>
            <MdLine delay={0.96}>- **Surface**: 5-step elevation, dark-first</MdLine>
            <MdLine delay={1.02}>- **Body font**: Inter, 16/24, weight 400</MdLine>
            <MdLine delay={1.08}>- **Display font**: Inter, 56/64, weight 600</MdLine>
            <MdLine type="space" delay={1.14}> </MdLine>
            <MdLine type="h2" delay={1.2}>## Colours</MdLine>
            <MdLine type="space" delay={1.24}> </MdLine>
            <MdLine type="code" delay={1.28}>--accent: #E4F222;</MdLine>
            <MdLine type="code" delay={1.34}>--bg-app: #0C0C0E;</MdLine>
            <MdLine type="code" delay={1.4}>--bg-panel: #141418;</MdLine>
            <MdLine type="code" delay={1.46}>--bg-surface: #1A1A20;</MdLine>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 1.55 }}
              viewport={{ once: true, margin: '-10%' }}
              className="font-mono text-[11px] text-white/55 leading-[1.6]"
            >
              <span className="inline-block w-2 h-3 align-middle bg-[#E4F222]/80 ml-0.5 animate-pulse" />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Footer status */}
      <div className="flex items-center justify-between border-t border-white/10 bg-black/30 px-4 py-2 shrink-0 text-[10px] font-mono">
        <span className="text-white/45">acme · figma · light + dark · 2 modes</span>
        <div className="flex items-center gap-3 text-white/45">
          <span>Will save to .layout/</span>
          <span className="text-white/20">·</span>
          <span>auto-detect MCP clients</span>
        </div>
      </div>
    </div>
  );
}
