'use client';

import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Copy,
  Trash2,
  Figma as FigmaIcon,
  Check,
} from 'lucide-react';
import { STUDIO_TOKENS, Tooltip, PaperIcon } from '../_studio-chrome';

interface SavedItem {
  name: string;
  category: string;
  health: number;
  render: () => React.ReactNode;
}

const SAVED: SavedItem[] = [
  {
    name: 'Sign-in centred',
    category: 'Auth',
    health: 92,
    render: () => (
      <div className="w-full h-full bg-white text-[#0C0C0E] flex flex-col items-center justify-center px-3 py-3 gap-1.5">
        <h5 className="text-[11px] font-semibold">Sign in</h5>
        <div className="w-full max-w-[120px] flex flex-col gap-1 mt-0.5">
          <div className="h-3.5 rounded bg-black/5 border border-black/10" />
          <div className="h-3.5 rounded bg-black/5 border border-black/10" />
          <div className="h-3.5 rounded bg-[#0C0C0E]" />
        </div>
      </div>
    ),
  },
  {
    name: 'Pricing tier card',
    category: 'Pricing',
    health: 95,
    render: () => (
      <div className="w-full h-full bg-white text-[#0C0C0E] flex flex-col items-center justify-center gap-1 px-3 py-3">
        <span className="rounded-full border border-black/10 bg-black/[0.04] px-1.5 py-0.5 text-[8px] font-medium text-black/60">
          Pro
        </span>
        <span className="text-[22px] font-semibold leading-none">$24</span>
        <ul className="flex flex-col gap-0.5 text-[7.5px] text-black/65 mt-0.5 w-full max-w-[110px]">
          <li className="flex items-center gap-1">
            <Check className="h-2 w-2" />
            Unlimited
          </li>
          <li className="flex items-center gap-1">
            <Check className="h-2 w-2" />
            All MCP tools
          </li>
        </ul>
        <button className="mt-1 w-full max-w-[110px] rounded bg-[#0C0C0E] py-1 text-[8.5px] font-medium text-white">
          Get started
        </button>
      </div>
    ),
  },
  {
    name: 'Empty state — projects',
    category: 'States',
    health: 88,
    render: () => (
      <div className="w-full h-full bg-white text-[#0C0C0E] flex flex-col items-center justify-center gap-1.5 px-3 py-3">
        <div
          className="h-8 w-8 rounded-md border-2 border-dashed flex items-center justify-center"
          style={{ borderColor: 'rgba(0,0,0,0.18)' }}
        >
          <Plus className="h-3.5 w-3.5" style={{ color: 'rgba(0,0,0,0.3)' }} />
        </div>
        <p className="text-[9px] font-medium">No projects yet</p>
        <p className="text-[7.5px] text-black/45">Create your first design system</p>
        <button className="rounded bg-[#E4F222] px-2 py-1 text-[8.5px] font-medium text-black">
          New project
        </button>
      </div>
    ),
  },
  {
    name: 'Hero — split with art',
    category: 'Hero',
    health: 90,
    render: () => (
      <div className="w-full h-full bg-white text-[#0C0C0E] grid grid-cols-2">
        <div className="flex flex-col justify-center gap-1 px-3">
          <h5 className="text-[10px] font-semibold leading-tight">Compile design.</h5>
          <p className="text-[7.5px] text-black/55">Tokens to AI agents.</p>
          <button className="mt-0.5 w-fit rounded bg-[#0C0C0E] px-1.5 py-0.5 text-[7.5px] font-medium text-white">
            Try
          </button>
        </div>
        <div
          className="h-full"
          style={{ background: 'linear-gradient(135deg, #E4F222 0%, #3A3F0A 100%)' }}
        />
      </div>
    ),
  },
  {
    name: 'Stats card · 3-up',
    category: 'Card',
    health: 86,
    render: () => (
      <div className="w-full h-full bg-white text-[#0C0C0E] grid grid-cols-3 gap-1.5 p-3">
        {[
          { v: '17', l: 'tokens' },
          { v: '12', l: 'comp.' },
          { v: '6', l: 'kits' },
        ].map((s) => (
          <div
            key={s.l}
            className="rounded border border-black/8 bg-black/[0.025] flex flex-col items-center justify-center px-1 py-1"
          >
            <div className="text-[14px] font-semibold leading-none">{s.v}</div>
            <div className="text-[7px] font-mono text-black/50 mt-0.5">{s.l}</div>
          </div>
        ))}
      </div>
    ),
  },
  {
    name: 'Welcome form',
    category: 'Form',
    health: 84,
    render: () => (
      <div className="w-full h-full bg-white text-[#0C0C0E] flex flex-col items-center justify-center px-3 py-3 gap-1">
        <h5 className="text-[10px] font-semibold">Welcome back</h5>
        <div className="w-full max-w-[130px] flex flex-col gap-1 mt-1">
          <div className="h-3 rounded border border-black/10 bg-white flex items-center justify-center text-[6px] font-medium text-black/65">
            Continue with Google
          </div>
          <div className="h-3 rounded border border-black/10 bg-white flex items-center justify-center text-[6px] font-medium text-black/65">
            Continue with GitHub
          </div>
        </div>
      </div>
    ),
  },
];

const CATEGORIES = ['All', 'Auth', 'Pricing', 'Hero', 'Card', 'Form', 'States'];

interface SavedCardProps {
  item: SavedItem;
  delay: number;
}

function SavedCard({ item, delay }: SavedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0, 0, 0.2, 1] }}
      viewport={{ once: true, margin: '-10%' }}
      className="group relative flex flex-col rounded-xl overflow-hidden cursor-pointer transition-all border"
      style={{
        backgroundColor: STUDIO_TOKENS.bgSurface,
        borderColor: STUDIO_TOKENS.border,
      }}
    >
      <div className="aspect-[4/3] bg-white">{item.render()}</div>
      <div className="flex flex-col gap-0.5 p-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[12px] font-semibold truncate" style={{ color: STUDIO_TOKENS.textPrimary }}>
            {item.name}
          </span>
          <span
            className="rounded-full px-1.5 py-[1px] text-[10px] font-semibold tabular-nums shrink-0"
            style={{
              backgroundColor: item.health >= 90 ? 'rgba(52,199,89,0.15)' : 'rgba(228,242,34,0.12)',
              color: item.health >= 90 ? 'rgb(110,231,183)' : '#E4F222',
            }}
          >
            {item.health}
          </span>
        </div>
        <span
          className="text-[10px] font-mono truncate"
          style={{ color: STUDIO_TOKENS.textMuted }}
        >
          {item.category}
        </span>
      </div>
      {/* Hover-reveal action toolbar */}
      <div
        className="absolute inset-x-0 bottom-0 flex items-center gap-1 px-2.5 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity border-t"
        style={{
          borderColor: STUDIO_TOKENS.border,
          backgroundColor: STUDIO_TOKENS.bgElevated,
        }}
      >
        {[
          { Icon: Copy, label: 'Copy code' },
          { Icon: FigmaIcon, label: 'Push to Figma' },
          { Icon: PaperIcon, label: 'Push to Paper' },
          { Icon: Trash2, label: 'Delete' },
        ].map(({ Icon, label }, i) => (
          <Tooltip key={i} label={label}>
            <button
              className="flex h-5 w-5 items-center justify-center rounded transition-colors hover:bg-white/10"
              style={{ color: STUDIO_TOKENS.textMuted }}
            >
              <Icon className="h-3 w-3" />
            </button>
          </Tooltip>
        ))}
      </div>
    </motion.div>
  );
}

export function LibraryView() {
  return (
    <>
      {/* Header */}
      <div
        className="flex items-center justify-between border-b px-5 py-3 shrink-0"
        style={{ borderColor: STUDIO_TOKENS.border }}
      >
        <div className="flex items-center gap-2">
          <h2 className="text-[14px] font-semibold" style={{ color: STUDIO_TOKENS.textPrimary }}>
            Library
          </h2>
          <span className="font-mono text-[10.5px]" style={{ color: STUDIO_TOKENS.textMuted }}>
            · {SAVED.length} saved
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-1.5 rounded-md border px-2.5 py-1"
            style={{
              borderColor: STUDIO_TOKENS.border,
              backgroundColor: STUDIO_TOKENS.bgSurface,
              width: 200,
            }}
          >
            <Search className="h-3 w-3" style={{ color: STUDIO_TOKENS.textMuted }} />
            <input
              type="text"
              placeholder="Search saved…"
              className="flex-1 bg-transparent text-[11.5px] outline-none"
              style={{ color: STUDIO_TOKENS.textPrimary }}
            />
          </div>
          <button
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11.5px] font-medium hover:opacity-90 transition-opacity"
            style={{ backgroundColor: STUDIO_TOKENS.accent, color: STUDIO_TOKENS.textOnAccent }}
          >
            <Plus className="h-3 w-3" />
            Add
          </button>
        </div>
      </div>

      {/* Category filter pills */}
      <div
        className="flex items-center gap-1 border-b px-5 py-2 shrink-0 overflow-x-auto"
        style={{ borderColor: STUDIO_TOKENS.border }}
      >
        {CATEGORIES.map((c, i) => (
          <button
            key={c}
            className="shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] transition-colors hover:bg-white/5"
            style={{
              borderColor: i === 0 ? STUDIO_TOKENS.borderStrong : STUDIO_TOKENS.border,
              backgroundColor: i === 0 ? STUDIO_TOKENS.bgHover : 'transparent',
              color: i === 0 ? STUDIO_TOKENS.textPrimary : STUDIO_TOKENS.textMuted,
            }}
          >
            {c}
            {i === 0 && (
              <span className="ml-1 font-mono text-[9.5px]" style={{ color: STUDIO_TOKENS.textMuted }}>
                {SAVED.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Card grid */}
      <div className="flex-1 overflow-hidden px-5 py-4 grid grid-cols-3 gap-3 items-start min-h-0">
        {SAVED.map((s, i) => (
          <SavedCard key={s.name} item={s} delay={0.1 + i * 0.05} />
        ))}
      </div>
    </>
  );
}
