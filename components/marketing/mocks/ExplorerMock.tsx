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
  Minus,
  Plus,
  ArrowUp,
  Split,
  Download,
  ImagePlus,
  Paperclip,
  ChevronDown,
  ThumbsUp,
  ThumbsDown,
  MousePointer2,
  Copy,
  RotateCw,
  Check,
} from 'lucide-react';
import { StudioWindow, SourcePanel, StudioSurface, Tooltip, PaperIcon, STUDIO_TOKENS } from './_studio-chrome';

const ACTIONS = [
  { Icon: ThumbsUp, label: 'Good' },
  { Icon: ThumbsDown, label: 'Bad' },
  { Icon: MousePointer2, label: 'Inspect & edit' },
  { Icon: Copy, label: 'Copy code' },
  { Icon: RotateCw, label: 'Regenerate' },
  { Icon: FigmaIcon, label: 'Push to Figma' },
  { Icon: PaperIcon, label: 'Push to Paper' },
];

const TABS = [
  { id: 'tokens', label: 'Tokens', icon: Palette },
  { id: 'components', label: 'Components', icon: LayoutGrid },
  { id: 'screenshots', label: 'Screenshots', icon: ImageIcon },
  { id: 'fonts', label: 'Fonts', icon: Type },
  { id: 'quality', label: 'Quality', icon: Gauge },
  { id: 'figma', label: 'Figma', icon: FigmaIcon },
  { id: 'connect', label: 'Connect', icon: Terminal },
];

interface LoginVariant {
  name: string;
  rationale: string;
  health: number;
  render: () => React.ReactNode;
}

const VARIANTS: LoginVariant[] = [
  {
    name: 'Centred minimal',
    rationale: 'Email + password, single CTA.',
    health: 92,
    render: () => (
      <div className="w-full h-full bg-white text-[#0C0C0E] flex flex-col items-center justify-center px-3 py-3 gap-1">
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
    name: 'With social auth',
    rationale: 'OAuth buttons + email fallback.',
    health: 88,
    render: () => (
      <div className="w-full h-full bg-white text-[#0C0C0E] flex flex-col items-center justify-center px-3 py-3 gap-1.5">
        <h5 className="text-[11px] font-semibold">Welcome back</h5>
        <div className="w-full max-w-[140px] flex flex-col gap-1 mt-0.5">
          <div className="h-3.5 rounded border border-black/12 bg-white flex items-center justify-center text-[7px] font-medium text-black/70">
            G  Continue with Google
          </div>
          <div className="h-3.5 rounded border border-black/12 bg-white flex items-center justify-center text-[7px] font-medium text-black/70">
            G  Continue with GitHub
          </div>
          <div className="text-center text-[7px] text-black/35 my-0.5">or email</div>
          <div className="h-3 rounded bg-black/5 border border-black/10" />
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
        <div className="flex flex-col justify-center gap-1 px-2.5 text-[#0C0C0E]">
          <h5 className="text-[10px] font-semibold leading-tight">Layout</h5>
          <div className="h-3 rounded bg-black/5 border border-black/10" />
          <div className="h-3 rounded bg-black/5 border border-black/10" />
          <div className="h-3 rounded bg-[#0C0C0E] flex items-center justify-center text-[7px] font-medium text-white">→</div>
        </div>
      </div>
    ),
  },
  {
    name: 'Card-on-bg',
    rationale: 'Lifted card with shadow over a tinted bg.',
    health: 84,
    render: () => (
      <div className="w-full h-full flex items-center justify-center px-3 py-3" style={{ backgroundColor: '#F5F5F7' }}>
        <div className="w-full max-w-[150px] rounded-md border border-black/8 bg-white px-3 py-3 flex flex-col gap-1.5 shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
          <span className="text-[7px] font-medium uppercase tracking-wider text-black/45">Secure</span>
          <h5 className="text-[10px] font-semibold text-[#0C0C0E]">Continue</h5>
          <div className="h-3 rounded bg-black/5 border border-black/10" />
          <div className="h-3 rounded bg-[#0C0C0E]" />
        </div>
      </div>
    ),
  },
  {
    name: 'One-click',
    rationale: 'Magic link, no password.',
    health: 90,
    render: () => (
      <div className="w-full h-full bg-white flex flex-col items-center justify-center gap-2 px-3 py-3">
        <div className="h-3 w-3 rounded-full bg-[#E4F222]" />
        <h5 className="text-[10px] font-semibold text-center leading-tight text-[#0C0C0E]">
          One-click<br />sign-in
        </h5>
        <div className="h-3.5 w-full max-w-[120px] rounded-full bg-[#0C0C0E] border border-black/12 flex items-center justify-center text-[7px] font-medium text-white">
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
        <div className="relative flex flex-col items-start justify-end gap-1 w-full h-full p-2.5">
          <span className="rounded border border-white/30 bg-black/30 px-1.5 py-0.5 text-[7px] font-medium text-white backdrop-blur">
            NEW
          </span>
          <h5 className="text-[10px] font-semibold text-white leading-tight">
            Get started in 30s.
          </h5>
          <div className="h-3 w-[80px] rounded bg-white text-[7px] font-medium text-[#0C0C0E] flex items-center justify-center">
            Sign in
          </div>
        </div>
      </div>
    ),
  },
];

interface VariantTileProps {
  variant: LoginVariant;
  selected: boolean;
  delay: number;
  onClick: () => void;
}

function VariantTile({ variant, selected, delay, onClick }: VariantTileProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0, 0, 0.2, 1] }}
      viewport={{ once: true, margin: '-10%' }}
      onClick={onClick}
      className="relative cursor-pointer"
    >
      <div
        className="group flex flex-col rounded-xl overflow-hidden transition-all"
        style={{
          backgroundColor: selected ? STUDIO_TOKENS.bgElevated : STUDIO_TOKENS.bgSurface,
          border: `1px solid ${selected ? STUDIO_TOKENS.accent : STUDIO_TOKENS.border}`,
          boxShadow: selected ? `0 0 0 1px ${STUDIO_TOKENS.accent}33` : 'none',
        }}
      >
      <div className="aspect-[4/3] bg-white">{variant.render()}</div>
      <div className="flex flex-col gap-0.5 p-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[12px] font-semibold truncate" style={{ color: STUDIO_TOKENS.textPrimary }}>
            {variant.name}
          </span>
          <span
            className="rounded-full px-1.5 py-[1px] text-[10px] font-semibold tabular-nums shrink-0"
            style={{
              backgroundColor: variant.health >= 90 ? 'rgba(52,199,89,0.15)' : 'rgba(228,242,34,0.12)',
              color: variant.health >= 90 ? 'rgb(110,231,183)' : '#E4F222',
            }}
          >
            {variant.health}
          </span>
        </div>
        <p className="text-[10px] leading-snug truncate" style={{ color: STUDIO_TOKENS.textSecondary }}>
          {variant.rationale}
        </p>
      </div>
      <div
        className="flex items-center gap-1 border-t px-2.5 py-1.5"
        style={{ borderColor: STUDIO_TOKENS.border }}
      >
        {ACTIONS.map(({ Icon, label }, i) => (
          <Tooltip key={i} label={label}>
            <button
              className="flex h-4 w-4 items-center justify-center rounded transition-colors hover:bg-white/10"
              style={{ color: STUDIO_TOKENS.textMuted }}
            >
              <Icon className="h-2.5 w-2.5" />
            </button>
          </Tooltip>
        ))}
      </div>
      </div>
      {selected && (
        <div
          className="absolute -right-1.5 -top-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full"
          style={{ backgroundColor: STUDIO_TOKENS.accent }}
        >
          <Check className="h-3 w-3" style={{ color: STUDIO_TOKENS.textOnAccent }} />
        </div>
      )}
    </motion.div>
  );
}

export function ExplorerMock() {
  const [activeTab, setActiveTab] = useState('tokens');
  const [selected, setSelected] = useState(2);

  return (
    <StudioWindow projectName="Acme" sourceType="figma" sourceName="acme-design-system">
      <SourcePanel tabs={TABS} activeTab={activeTab} onTab={setActiveTab} width={240}>
        <div className="flex flex-col gap-2 px-3 py-3 overflow-y-auto">
          <div
            className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: STUDIO_TOKENS.textMuted }}
          >
            History · 3
          </div>
          {[
            { prompt: 'A modern login form with social auth', count: 6, active: true },
            { prompt: 'Pricing card with feature tiers', count: 3, active: false },
            { prompt: 'Empty state for projects list', count: 4, active: false },
          ].map((h, i) => (
            <div
              key={i}
              className="rounded-md cursor-pointer transition-colors p-2"
              style={{
                backgroundColor: h.active ? STUDIO_TOKENS.bgHover : 'transparent',
                border: `1px solid ${h.active ? STUDIO_TOKENS.border : 'transparent'}`,
              }}
            >
              <p className="text-[11px] line-clamp-2 leading-snug" style={{ color: STUDIO_TOKENS.textPrimary }}>
                {h.prompt}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-mono" style={{ color: STUDIO_TOKENS.textMuted }}>
                  {h.count} variants
                </span>
                {h.active && (
                  <span
                    className="text-[9px] font-medium uppercase tracking-wider"
                    style={{ color: STUDIO_TOKENS.statusSuccess }}
                  >
                    Active
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </SourcePanel>

      <StudioSurface>
        {/* 2x3 variant grid (top) — 2 columns, matches real Explorer */}
        <div className="mx-3 mt-3 grid grid-cols-2 gap-2.5 items-start">
          {VARIANTS.map((v, i) => (
            <VariantTile
              key={i}
              variant={v}
              selected={selected === i}
              delay={0.12 + i * 0.06}
              onClick={() => setSelected(i)}
            />
          ))}
        </div>
        <div className="flex-1 min-h-0" />
        {/* Toolbar (bottom) */}
        <div
          className="mx-3 mb-3 flex flex-col rounded-lg border shrink-0"
          style={{
            borderColor: STUDIO_TOKENS.border,
            backgroundColor: STUDIO_TOKENS.bgSurface,
          }}
        >
          <div className="p-2.5">
            <div className="relative">
              <div
                className="flex min-h-[68px] items-start rounded-md border px-3.5 py-3"
                style={{
                  borderColor: STUDIO_TOKENS.border,
                  backgroundColor: STUDIO_TOKENS.accentSubtle,
                  boxShadow: '0 0 0 1px rgba(0,0,0,0.2)',
                }}
              >
                {/* Reference image chip */}
                <div
                  className="mr-2 flex shrink-0 items-center gap-1.5 rounded-md px-1.5 py-0.5"
                  style={{ backgroundColor: STUDIO_TOKENS.bgHover }}
                  title="reference.png"
                >
                  <div
                    className="h-6 w-6 rounded"
                    style={{ background: 'linear-gradient(135deg, #E4F222 0%, #3A3F0A 100%)' }}
                  />
                  <span className="text-[10px]" style={{ color: STUDIO_TOKENS.textSecondary }}>
                    reference.png
                  </span>
                </div>
                <span className="text-[13px] leading-snug" style={{ color: STUDIO_TOKENS.textPrimary }}>
                  A modern login form with social auth, on-brand
                </span>
              </div>
              <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5">
                <button
                  className="flex items-center justify-center size-6 rounded-full bg-transparent border transition-colors hover:opacity-80"
                  style={{ borderColor: STUDIO_TOKENS.border, color: STUDIO_TOKENS.textMuted }}
                >
                  <Paperclip className="h-3 w-3" />
                </button>
                <button
                  className="flex items-center justify-center size-6 rounded-full bg-transparent border transition-colors hover:opacity-80"
                  style={{ borderColor: STUDIO_TOKENS.border, color: STUDIO_TOKENS.textMuted }}
                >
                  <ImagePlus className="h-3 w-3" />
                </button>
                <button
                  className="flex items-center justify-center size-6 rounded-full transition-colors hover:opacity-90"
                  style={{ backgroundColor: STUDIO_TOKENS.textPrimary, color: STUDIO_TOKENS.bgApp }}
                >
                  <ArrowUp className="h-3 w-3" strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </div>
          <div
            className="flex h-[38px] items-center justify-between border-t px-5 pr-4"
            style={{ borderColor: 'rgba(255,255,255,0.05)' }}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xs" style={{ color: STUDIO_TOKENS.textPrimary }}>Variants:</span>
                <button className="rounded p-0.5" style={{ color: STUDIO_TOKENS.textSecondary }}>
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-4 text-center text-xs font-medium" style={{ color: STUDIO_TOKENS.textPrimary }}>
                  6
                </span>
                <button className="rounded p-0.5" style={{ color: STUDIO_TOKENS.textSecondary }}>
                  <Plus className="h-3 w-3" />
                </button>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs" style={{ color: STUDIO_TOKENS.textPrimary }}>Model:</span>
                <div
                  className="relative inline-flex items-center gap-1 rounded-md border pl-2 pr-2 py-0.5 text-xs cursor-pointer"
                  style={{
                    borderColor: 'rgba(255,255,255,0.08)',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    color: STUDIO_TOKENS.textPrimary,
                  }}
                >
                  Claude Sonnet 4.6
                  <ChevronDown className="h-2.5 w-2.5" />
                </div>
              </div>
              <button
                className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs hover:bg-white/5"
                style={{ color: STUDIO_TOKENS.textPrimary }}
              >
                <Split className="h-3 w-3" />
                Compare
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="inline-flex items-center gap-1.5 rounded-md border h-[30px] px-3 text-xs font-medium hover:bg-white/5"
                style={{ borderColor: 'rgba(255,255,255,0.07)', color: STUDIO_TOKENS.textPrimary }}
              >
                <Download className="h-3 w-3" />
                Import
              </button>
              <button
                className="inline-flex items-center gap-1.5 rounded-md border h-[30px] px-3 text-xs font-medium hover:bg-white/5"
                style={{ borderColor: 'rgba(255,255,255,0.07)', color: STUDIO_TOKENS.textPrimary }}
              >
                <FigmaIcon className="h-3 w-3" />
                Push to Figma
              </button>
              <button
                className="inline-flex items-center gap-1.5 rounded-md border h-[30px] px-3 text-xs font-medium hover:bg-white/5"
                style={{ borderColor: 'rgba(255,255,255,0.07)', color: STUDIO_TOKENS.textPrimary }}
              >
                <PaperIcon className="h-3 w-3" />
                Push to Paper
              </button>
            </div>
          </div>
        </div>

      </StudioSurface>
    </StudioWindow>
  );
}
