'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Figma as FigmaIcon,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  RotateCw,
  BookMarked,
  Check,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { STUDIO_TOKENS, PaperIcon } from './_studio-chrome';

/**
 * Mobile-only Hero mock. Layout Studio doesn't have a mobile UI — the real
 * product is desktop-first. Rather than shrinking the full Studio frame
 * (illegible) or pretending mobile Studio exists (a lie), this mock shows
 * the strongest single moment: one Explorer variant card, full-width,
 * with mini chrome around it — the same visual language as desktop, the
 * same content, just curated for portrait.
 */

interface VariantPreviewProps { variant: 0 | 1 | 2 }

function VariantPreview({ variant }: VariantPreviewProps) {
  if (variant === 0) {
    return (
      <div className="w-full h-full bg-white text-[#0C0C0E] flex flex-col items-center justify-center gap-2 px-6 py-7">
        <span className="rounded-full border border-black/12 bg-black/[0.04] px-2 py-0.5 text-[11px] font-medium text-black/60">
          Pro · billed monthly
        </span>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-[40px] font-semibold leading-none">$24</span>
          <span className="text-[13px] text-black/55">/ mo</span>
        </div>
        <h4 className="text-[16px] font-semibold mt-1">Ship faster.</h4>
        <p className="text-[12px] text-black/55 max-w-[88%] text-center leading-snug">
          From design system to production in minutes.
        </p>
        <ul className="flex flex-col gap-1 text-[11px] text-black/70 w-full max-w-[160px] mt-1">
          {['Unlimited extractions', 'All MCP tools', 'Figma sync'].map((f) => (
            <li key={f} className="flex items-center gap-1.5">
              <Check className="h-3 w-3 text-[#5A6608]" />
              {f}
            </li>
          ))}
        </ul>
        <button className="mt-3 w-full max-w-[160px] rounded-md bg-[#0C0C0E] px-3 py-2 text-[12px] font-medium text-white">
          Get started →
        </button>
      </div>
    );
  }
  if (variant === 1) {
    return (
      <div className="w-full h-full bg-white text-[#0C0C0E] grid grid-cols-[1.2fr_1fr]">
        <div className="flex flex-col justify-center gap-2 px-5 py-6">
          <span className="text-[10px] font-medium uppercase tracking-wider text-black/55">
            Dashboard
          </span>
          <h4 className="text-[20px] font-semibold leading-tight">Compile design.</h4>
          <p className="text-[12px] text-black/55 leading-snug">
            Tokens, types, components — served to every AI agent.
          </p>
          <div className="flex items-center gap-1.5 mt-2">
            <button className="rounded-md bg-[#0C0C0E] px-2.5 py-1.5 text-[11px] font-medium text-white">
              Try it
            </button>
            <button className="rounded-md border border-black/12 px-2.5 py-1.5 text-[11px] font-medium text-[#0C0C0E]">
              Docs
            </button>
          </div>
        </div>
        <div
          className="h-full"
          style={{ background: 'linear-gradient(135deg, #E4F222 0%, #3A3F0A 100%)' }}
        />
      </div>
    );
  }
  return (
    <div className="w-full h-full bg-white text-[#0C0C0E] flex flex-col gap-3 p-5">
      <div className="flex items-center justify-between">
        <span className="rounded border border-emerald-600/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
          NEW
        </span>
        <span className="font-mono text-[10px] text-black/40">layout v1</span>
      </div>
      <h4 className="text-[18px] font-semibold leading-snug">
        The compiler<br />for design systems.
      </h4>
      <div className="grid grid-cols-3 gap-2">
        {[
          { v: '17', l: 'tokens' },
          { v: '12', l: 'components' },
          { v: '6', l: 'kits' },
        ].map((s) => (
          <div key={s.l} className="rounded-md border border-black/8 bg-black/[0.025] px-2 py-2">
            <div className="text-[16px] font-semibold leading-none">{s.v}</div>
            <div className="text-[9px] font-mono text-black/50 mt-1">{s.l}</div>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-1 mt-auto">
        <div className="h-1 w-full rounded-full bg-black/10">
          <div className="h-1 w-[68%] rounded-full bg-[#E4F222]" />
        </div>
        <div className="flex items-center justify-between text-[10px] font-mono text-black/45">
          <span>health · 87/100</span>
          <span>synced</span>
        </div>
      </div>
    </div>
  );
}

const VARIANT_META = [
  { name: 'Pricing — minimal centred', rationale: 'Single column, lime CTA, three-feature checklist.', health: 92 },
  { name: 'Pricing — split with art', rationale: 'Left-aligned copy, gradient art block on right.', health: 86 },
  { name: 'Pricing — stat hero', rationale: 'Three live metrics over a progress bar; NEW pill.', health: 90 },
];

const ACTIONS = [
  { Icon: ThumbsUp, label: 'Good' },
  { Icon: ThumbsDown, label: 'Bad' },
  { Icon: RotateCw, label: 'Regen' },
  { Icon: FigmaIcon, label: 'Figma' },
  { Icon: PaperIcon, label: 'Paper' },
  { Icon: BookMarked, label: 'Save' },
];

export function HeroMobileMock() {
  const [active, setActive] = useState<0 | 1 | 2>(1);
  const next = () => setActive(((active + 1) % 3) as 0 | 1 | 2);
  const prev = () => setActive(((active + 2) % 3) as 0 | 1 | 2);
  const meta = VARIANT_META[active];

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
      {/* Mini header */}
      <div
        className="flex items-center justify-between border-b px-4 py-2.5 shrink-0"
        style={{ borderColor: STUDIO_TOKENS.border }}
      >
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-medium" style={{ color: STUDIO_TOKENS.textPrimary }}>
            Acme
          </span>
          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-mono" style={{ color: STUDIO_TOKENS.textSecondary }}>
            <FigmaIcon className="h-2.5 w-2.5" />
            acme-design-system
          </span>
        </div>
        <span
          className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-mono"
          style={{
            borderColor: 'rgba(228,242,34,0.3)',
            backgroundColor: 'rgba(228,242,34,0.08)',
            color: STUDIO_TOKENS.brand,
          }}
        >
          <Sparkles className="h-2.5 w-2.5" />
          Explorer
        </span>
      </div>

      {/* Variant card — full width, takes most of the height */}
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
          {/* Preview pane */}
          <div className="aspect-[4/3] bg-white">
            <VariantPreview variant={active} />
          </div>
          {/* Info */}
          <div className="flex flex-col gap-1 p-3.5">
            <div className="flex items-center justify-between gap-2">
              <span
                className="text-[14px] font-semibold truncate"
                style={{ color: STUDIO_TOKENS.textPrimary }}
              >
                {meta.name}
              </span>
              <span
                className="rounded-full px-1.5 py-[1px] text-[11px] font-semibold tabular-nums shrink-0"
                style={{
                  backgroundColor:
                    meta.health >= 90 ? 'rgba(52,199,89,0.15)' : 'rgba(228,242,34,0.12)',
                  color: meta.health >= 90 ? 'rgb(110,231,183)' : '#E4F222',
                }}
              >
                ★ {meta.health}
              </span>
            </div>
            <p className="text-[12px] leading-snug" style={{ color: STUDIO_TOKENS.textSecondary }}>
              {meta.rationale}
            </p>
          </div>
          {/* Action toolbar */}
          <div
            className="flex items-center justify-around border-t py-2"
            style={{ borderColor: STUDIO_TOKENS.border }}
          >
            {ACTIONS.map(({ Icon, label }, i) => (
              <button
                key={i}
                className="flex flex-col items-center gap-1 px-2 transition-opacity hover:opacity-100"
                style={{ color: STUDIO_TOKENS.textMuted, opacity: 0.85 }}
              >
                <Icon className="h-4 w-4" />
                <span className="text-[9px] font-mono" style={{ color: STUDIO_TOKENS.textMuted }}>
                  {label}
                </span>
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Pagination + nav */}
      <div
        className="flex items-center justify-between border-t px-4 py-2.5 shrink-0"
        style={{ borderColor: STUDIO_TOKENS.border, backgroundColor: STUDIO_TOKENS.bgPanel }}
      >
        <button
          onClick={prev}
          className="flex h-7 w-7 items-center justify-center rounded-md border transition-colors hover:bg-white/5"
          style={{ borderColor: STUDIO_TOKENS.borderStrong, color: STUDIO_TOKENS.textSecondary }}
          aria-label="Previous variant"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <div className="flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <button
              key={i}
              onClick={() => setActive(i as 0 | 1 | 2)}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: active === i ? 18 : 6,
                backgroundColor: active === i ? STUDIO_TOKENS.brand : STUDIO_TOKENS.border,
              }}
            />
          ))}
          <span className="ml-2 font-mono text-[10.5px]" style={{ color: STUDIO_TOKENS.textMuted }}>
            {active + 1} of 3 variants
          </span>
        </div>
        <button
          onClick={next}
          className="flex h-7 w-7 items-center justify-center rounded-md border transition-colors hover:bg-white/5"
          style={{ borderColor: STUDIO_TOKENS.borderStrong, color: STUDIO_TOKENS.textSecondary }}
          aria-label="Next variant"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
