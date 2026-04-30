'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Figma as FigmaIcon,
  ThumbsUp,
  ThumbsDown,
  RotateCw,
  BookMarked,
  Check,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { STUDIO_TOKENS, PaperIcon } from './_studio-chrome';

interface VariantPreview { name: string; rationale: string; health: number; render: () => React.ReactNode }

const VARIANTS: VariantPreview[] = [
  {
    name: 'Centred minimal',
    rationale: 'Email + password, single CTA.',
    health: 92,
    render: () => (
      <div className="w-full h-full bg-white text-[#0C0C0E] flex flex-col items-center justify-center px-4 py-5 gap-2">
        <h5 className="text-[15px] font-semibold">Sign in</h5>
        <div className="w-full max-w-[180px] flex flex-col gap-2 mt-1">
          <div className="h-7 rounded bg-black/5 border border-black/10" />
          <div className="h-7 rounded bg-black/5 border border-black/10" />
          <div className="h-7 rounded bg-[#0C0C0E]" />
        </div>
      </div>
    ),
  },
  {
    name: 'With social auth',
    rationale: 'OAuth buttons + email fallback.',
    health: 88,
    render: () => (
      <div className="w-full h-full bg-white text-[#0C0C0E] flex flex-col items-center justify-center px-4 py-5 gap-2">
        <h5 className="text-[15px] font-semibold">Welcome back</h5>
        <div className="w-full max-w-[200px] flex flex-col gap-1.5 mt-1">
          <div className="h-7 rounded border border-black/12 bg-white flex items-center justify-center text-[10px] font-medium text-black/70">
            Continue with Google
          </div>
          <div className="h-7 rounded border border-black/12 bg-white flex items-center justify-center text-[10px] font-medium text-black/70">
            Continue with GitHub
          </div>
          <div className="text-center text-[9px] text-black/35 my-0.5">or email</div>
          <div className="h-6 rounded bg-black/5 border border-black/10" />
        </div>
      </div>
    ),
  },
  {
    name: 'Split with art',
    rationale: 'Brand panel left, form right.',
    health: 95,
    render: () => (
      <div className="w-full h-full bg-white grid grid-cols-2">
        <div
          className="h-full"
          style={{ background: 'linear-gradient(135deg, #E4F222 0%, #3A3F0A 100%)' }}
        />
        <div className="flex flex-col justify-center gap-1.5 px-3 text-[#0C0C0E]">
          <h5 className="text-[12px] font-semibold leading-tight">Layout</h5>
          <div className="h-5 rounded bg-black/5 border border-black/10" />
          <div className="h-5 rounded bg-black/5 border border-black/10" />
          <div className="h-5 rounded bg-[#0C0C0E] flex items-center justify-center text-[9px] font-medium text-white">→</div>
        </div>
      </div>
    ),
  },
  {
    name: 'Card-on-bg',
    rationale: 'Lifted card with shadow.',
    health: 84,
    render: () => (
      <div className="w-full h-full flex items-center justify-center px-4 py-5" style={{ backgroundColor: '#F5F5F7' }}>
        <div className="w-full max-w-[200px] rounded-md border border-black/8 bg-white px-4 py-4 flex flex-col gap-2 shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
          <span className="text-[9px] font-medium uppercase tracking-wider text-black/45">Secure</span>
          <h5 className="text-[12px] font-semibold text-[#0C0C0E]">Continue</h5>
          <div className="h-6 rounded bg-black/5 border border-black/10" />
          <div className="h-6 rounded bg-[#0C0C0E]" />
        </div>
      </div>
    ),
  },
  {
    name: 'One-click',
    rationale: 'Magic link, no password.',
    health: 90,
    render: () => (
      <div className="w-full h-full bg-white flex flex-col items-center justify-center gap-3 px-4 py-5">
        <div className="h-4 w-4 rounded-full bg-[#E4F222]" />
        <h5 className="text-[14px] font-semibold text-center leading-tight text-[#0C0C0E]">
          One-click<br />sign-in
        </h5>
        <div className="h-7 w-full max-w-[160px] rounded-full bg-[#0C0C0E] border border-black/12 flex items-center justify-center text-[10px] font-medium text-white">
          Send magic link
        </div>
      </div>
    ),
  },
  {
    name: 'Hero image',
    rationale: 'Full-bleed visual + overlaid CTA.',
    health: 87,
    render: () => (
      <div className="relative w-full h-full overflow-hidden">
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(circle at 30% 30%, #E4F222 0%, #3A3F0A 50%, #0C0C0E 100%)' }}
        />
        <div className="relative flex flex-col items-start justify-end gap-1.5 w-full h-full p-4">
          <span className="rounded border border-white/30 bg-black/30 px-1.5 py-0.5 text-[9px] font-medium text-white backdrop-blur">
            NEW
          </span>
          <h5 className="text-[14px] font-semibold text-white leading-tight">
            Get started in 30s.
          </h5>
          <div className="h-6 w-[100px] rounded bg-white text-[10px] font-medium text-[#0C0C0E] flex items-center justify-center">
            Sign in
          </div>
        </div>
      </div>
    ),
  },
];

const ACTIONS = [
  { Icon: ThumbsUp, label: 'Good' },
  { Icon: ThumbsDown, label: 'Bad' },
  { Icon: RotateCw, label: 'Regen' },
  { Icon: FigmaIcon, label: 'Figma' },
  { Icon: PaperIcon, label: 'Paper' },
  { Icon: BookMarked, label: 'Save' },
];

export function ExplorerMobileMock() {
  const [active, setActive] = useState(2);
  const next = () => setActive((active + 1) % VARIANTS.length);
  const prev = () => setActive((active + VARIANTS.length - 1) % VARIANTS.length);
  const v = VARIANTS[active];

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
      {/* Header — prompt */}
      <div
        className="flex flex-col gap-1.5 border-b px-4 py-2.5 shrink-0"
        style={{ borderColor: STUDIO_TOKENS.border }}
      >
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3 w-3" style={{ color: STUDIO_TOKENS.brand }} />
          <span className="font-mono text-[10.5px]" style={{ color: STUDIO_TOKENS.textMuted }}>
            Prompt · 6 variants generated
          </span>
        </div>
        <span className="text-[12px]" style={{ color: STUDIO_TOKENS.textPrimary }}>
          A modern login form with social auth, on-brand
        </span>
      </div>

      {/* Variant card */}
      <div className="flex-1 min-h-0 p-4 flex items-center justify-center">
        <motion.div
          key={active}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0, 0, 0.2, 1] }}
          className="w-full flex flex-col rounded-xl overflow-hidden border"
          style={{
            backgroundColor: STUDIO_TOKENS.bgElevated,
            borderColor: STUDIO_TOKENS.accent,
            boxShadow: `0 0 0 1px ${STUDIO_TOKENS.accent}33, 0 8px 24px rgba(0,0,0,0.4)`,
          }}
        >
          <div className="aspect-[4/3] bg-white">{v.render()}</div>
          <div className="flex flex-col gap-1 p-3.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[14px] font-semibold truncate" style={{ color: STUDIO_TOKENS.textPrimary }}>
                {v.name}
              </span>
              <span
                className="rounded-full px-1.5 py-[1px] text-[11px] font-semibold tabular-nums shrink-0"
                style={{
                  backgroundColor: v.health >= 90 ? 'rgba(52,199,89,0.15)' : 'rgba(228,242,34,0.12)',
                  color: v.health >= 90 ? 'rgb(110,231,183)' : '#E4F222',
                }}
              >
                ★ {v.health}
              </span>
            </div>
            <p className="text-[12px] leading-snug" style={{ color: STUDIO_TOKENS.textSecondary }}>
              {v.rationale}
            </p>
          </div>
          <div
            className="flex items-center justify-around border-t py-2"
            style={{ borderColor: STUDIO_TOKENS.border }}
          >
            {ACTIONS.map(({ Icon, label }, i) => (
              <button
                key={i}
                className="flex flex-col items-center gap-1 px-1"
                style={{ color: STUDIO_TOKENS.textMuted, opacity: 0.85 }}
              >
                <Icon className="h-4 w-4" />
                <span className="text-[9px] font-mono">{label}</span>
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Pagination */}
      <div
        className="flex items-center justify-between border-t px-4 py-2.5 shrink-0"
        style={{ borderColor: STUDIO_TOKENS.border, backgroundColor: STUDIO_TOKENS.bgPanel }}
      >
        <button
          onClick={prev}
          className="flex h-7 w-7 items-center justify-center rounded-md border hover:bg-white/5"
          style={{ borderColor: STUDIO_TOKENS.borderStrong, color: STUDIO_TOKENS.textSecondary }}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <div className="flex items-center gap-1.5">
          {VARIANTS.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: active === i ? 16 : 5,
                backgroundColor: active === i ? STUDIO_TOKENS.brand : STUDIO_TOKENS.border,
              }}
            />
          ))}
          <span className="ml-1.5 font-mono text-[10px]" style={{ color: STUDIO_TOKENS.textMuted }}>
            {active + 1}/{VARIANTS.length}
          </span>
        </div>
        <button
          onClick={next}
          className="flex h-7 w-7 items-center justify-center rounded-md border hover:bg-white/5"
          style={{ borderColor: STUDIO_TOKENS.borderStrong, color: STUDIO_TOKENS.textSecondary }}
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
