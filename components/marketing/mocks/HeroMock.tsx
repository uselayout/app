'use client';

import { motion } from 'framer-motion';

interface VariantPreviewProps {
  index: number;
  delay: number;
  active: boolean;
}

function VariantPreview({ index, delay, active }: VariantPreviewProps) {
  const layouts = [
    // Variant 1: Pricing card
    (
      <div className="flex flex-col items-center justify-center w-full px-6 py-7 text-center gap-2.5">
        <span className="rounded-full border border-white/15 bg-white/[0.03] px-2 py-0.5 text-[10px] font-mono text-white/55">
          Pro · billed monthly
        </span>
        <div className="flex items-baseline gap-1">
          <span className="text-[36px] font-semibold leading-none text-white">$24</span>
          <span className="text-[12px] text-white/45">/ mo</span>
        </div>
        <h4 className="text-[15px] font-semibold leading-tight text-white">
          Ship faster.
        </h4>
        <p className="text-[11px] leading-snug text-white/55 max-w-[88%]">
          From design system to production in minutes.
        </p>
        <ul className="flex flex-col gap-1 text-[10px] text-white/65 w-full max-w-[140px] text-left">
          {['Unlimited extractions', 'All MCP tools', 'Figma sync'].map((f) => (
            <li key={f} className="flex items-center gap-1.5">
              <span className="text-[#E4F222]">✓</span>{f}
            </li>
          ))}
        </ul>
        <button className="mt-1 w-full max-w-[140px] rounded-md bg-[#E4F222] px-2.5 py-1.5 text-[11px] font-medium text-black">
          Get started →
        </button>
      </div>
    ),
    // Variant 2: Split-layout dashboard card
    (
      <div className="flex w-full items-stretch px-4 py-4 gap-3">
        <div className="flex-1 flex flex-col gap-2 justify-center">
          <span className="rounded border border-white/12 bg-white/5 px-1.5 py-0.5 text-[9px] font-mono text-white/60 self-start">
            DASHBOARD
          </span>
          <h4 className="text-[15px] font-semibold leading-tight text-white">
            Compile design.
          </h4>
          <p className="text-[10.5px] leading-snug text-white/55">
            Tokens, types, components — served to every AI coding agent.
          </p>
          <div className="flex items-center gap-1 mt-1">
            <button className="rounded bg-white px-2 py-1 text-[10px] font-medium text-black">
              Try it
            </button>
            <button className="rounded border border-white/15 px-2 py-1 text-[10px] font-medium text-white/70">
              Docs
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-1.5 w-[42%] shrink-0 justify-center">
          <div
            className="aspect-[4/3] rounded-md"
            style={{
              background: 'linear-gradient(135deg, #E4F222 0%, #3a3f0a 100%)',
            }}
          />
          <div className="flex gap-1">
            <div className="h-1 flex-1 rounded-full bg-white/10">
              <div className="h-1 w-[60%] rounded-full bg-white/40" />
            </div>
            <div className="h-1 flex-1 rounded-full bg-white/10">
              <div className="h-1 w-[80%] rounded-full bg-white/40" />
            </div>
          </div>
        </div>
      </div>
    ),
    // Variant 3: Stat-card hero
    (
      <div className="flex flex-col w-full px-4 py-4 gap-2.5">
        <div className="flex items-center justify-between">
          <span className="rounded border border-emerald-400/30 bg-emerald-400/10 px-1.5 py-0.5 text-[9px] font-mono text-emerald-300">
            NEW
          </span>
          <span className="font-mono text-[9px] text-white/40">layout v1</span>
        </div>
        <h4 className="text-[14px] font-semibold leading-snug text-white">
          The compiler<br />for design systems.
        </h4>
        <div className="grid grid-cols-3 gap-2">
          {[
            { v: '17', l: 'tokens' },
            { v: '12', l: 'components' },
            { v: '6', l: 'kits' },
          ].map((s) => (
            <div key={s.l} className="rounded-md border border-white/8 bg-white/[0.025] px-2 py-1.5">
              <div className="text-[14px] font-semibold text-white leading-none">{s.v}</div>
              <div className="text-[8px] font-mono text-white/45 mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-1 mt-auto">
          <div className="h-1 w-full rounded-full bg-white/10">
            <div className="h-1 w-[68%] rounded-full bg-[#E4F222]" />
          </div>
          <div className="flex items-center justify-between text-[9px] font-mono text-white/45">
            <span>health · 87/100</span>
            <span>synced</span>
          </div>
        </div>
      </div>
    ),
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay, ease: [0, 0, 0.2, 1] }}
      viewport={{ once: true, margin: '-10%' }}
      className="relative flex flex-col rounded-lg border bg-[#141418]"
      style={{
        borderColor: active ? 'rgba(228,242,34,0.35)' : 'rgba(255,255,255,0.10)',
        boxShadow: active
          ? '0 0 0 1px rgba(228,242,34,0.15), 0 4px 16px rgba(0,0,0,0.5)'
          : '0 2px 8px rgba(0,0,0,0.3)',
      }}
    >
      {/* Top label */}
      <div className="flex items-center justify-between border-b border-white/8 px-3 py-1.5">
        <span className="font-mono text-[9px] text-white/55">
          variant {index + 1}
        </span>
        <div className="flex items-center gap-1 font-mono text-[9px] text-white/40">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
          <span>{82 + index * 4}</span>
        </div>
      </div>

      {/* Preview body */}
      <div className="flex-1 bg-[#0E0E12] min-h-0 flex">
        {layouts[index]}
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-1.5 border-t border-white/8 px-3 py-1.5">
        <button className="text-white/55 hover:text-white">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
        <button className="text-white/55 hover:text-white">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
          </svg>
        </button>
        <button className="text-white/55 hover:text-white">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </button>
        <span className="ml-auto font-mono text-[9px] text-white/40">
          on-system
        </span>
      </div>
    </motion.div>
  );
}

export function HeroMock() {
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
            layout.design / acme · explorer
          </span>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-mono text-white/40">
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
            on-brand · 17 tokens
          </span>
          <span className="text-white/25">·</span>
          <span>3 of 6 ready</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 border-b border-white/10 bg-black/20 px-4 py-2 shrink-0">
        <div className="flex items-center gap-1.5 rounded-md border border-white/15 bg-black/40 px-2.5 py-1 text-[11px] flex-1 max-w-[520px]">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/40">
            <path d="M9.663 17h4.673M12 3v1M5.05 5.05l.7.7M3 12h1M5.05 18.95l.7-.7M12 21v-1M18.95 18.95l-.7-.7M21 12h-1M18.95 5.05l-.7.7" />
            <circle cx="12" cy="12" r="4" />
          </svg>
          <span className="font-mono text-white/70">
            Generate a pricing hero
          </span>
          <span className="font-mono text-white/30 ml-auto">⌘ ↵</span>
        </div>
        <button className="rounded-md bg-[#E4F222] px-3 py-1 text-[11px] font-medium text-black">
          Generate 6
        </button>
        <button className="rounded-md border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-white/80">
          A/B compare
        </button>
        <button className="rounded-md border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-white/80">
          📷
        </button>
      </div>

      {/* Variant grid */}
      <div className="flex-1 grid grid-cols-3 gap-5 px-7 py-7 overflow-hidden min-h-0">
        {[0, 1, 2].map((i) => (
          <VariantPreview key={i} index={i} delay={0.2 + i * 0.1} active={i === 1} />
        ))}
      </div>

      {/* Refine bar */}
      <div className="flex items-center gap-2 border-t border-white/10 bg-black/30 px-4 py-2.5 shrink-0">
        <span className="font-mono text-[10px] text-white/40 shrink-0">refine variant 2 ·</span>
        <div className="flex items-center gap-1.5 rounded-md border border-amber-400/25 bg-amber-400/[0.04] px-2.5 py-1 text-[11px] flex-1">
          <span className="font-mono text-amber-200/80">
            Make the body copy tighter and the CTA bolder
          </span>
        </div>
        <button className="rounded-md border border-white/15 px-2.5 py-1 text-[10px] font-mono text-white/70">
          Push to Figma
        </button>
        <button className="rounded-md border border-white/15 px-2.5 py-1 text-[10px] font-mono text-white/70">
          Save to library
        </button>
      </div>
    </div>
  );
}
