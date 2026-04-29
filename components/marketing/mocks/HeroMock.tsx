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
  Monitor,
  RotateCw,
  BookMarked,
  Check,
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

interface Token {
  name: string;
  hex: string;
  group: string;
}

const TOKENS: Token[] = [
  { name: '--accent', hex: '#E4F222', group: 'Brand' },
  { name: '--accent-soft', hex: '#3A3F0A', group: 'Brand' },
  { name: '--bg-app', hex: '#0C0C0E', group: 'Surface' },
  { name: '--bg-panel', hex: '#141418', group: 'Surface' },
  { name: '--bg-surface', hex: '#1A1A20', group: 'Surface' },
  { name: '--bg-elevated', hex: '#222228', group: 'Surface' },
  { name: '--text-primary', hex: '#EDEDF4', group: 'Text' },
  { name: '--text-muted', hex: '#A6A6B0', group: 'Text' },
];

interface Variant {
  id: number;
  name: string;
  rationale: string;
  health: number;
  /** Render function for the preview pane (white-bg, scaled 50%) */
  render: () => React.ReactNode;
}

const VARIANTS: Variant[] = [
  {
    id: 1,
    name: 'Pricing — minimal centred',
    rationale: 'Single column, lime CTA, three-feature checklist.',
    health: 92,
    render: () => (
      <div className="w-full h-full bg-white text-[#0C0C0E] flex flex-col items-center justify-center gap-2 px-6 py-7">
        <span className="rounded-full border border-black/12 bg-black/[0.04] px-2 py-0.5 text-[10px] font-medium text-black/60">
          Pro · billed monthly
        </span>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-[36px] font-semibold leading-none">$24</span>
          <span className="text-[12px] text-black/55">/ mo</span>
        </div>
        <h4 className="text-[15px] font-semibold mt-1">Ship faster.</h4>
        <p className="text-[11px] text-black/55 max-w-[88%] text-center leading-snug">
          From design system to production in minutes.
        </p>
        <ul className="flex flex-col gap-1 text-[10px] text-black/70 w-full max-w-[140px] mt-1">
          {['Unlimited extractions', 'All MCP tools', 'Figma sync'].map((f) => (
            <li key={f} className="flex items-center gap-1.5">
              <Check className="h-2.5 w-2.5 text-[#5A6608]" />
              {f}
            </li>
          ))}
        </ul>
        <button className="mt-2 w-full max-w-[140px] rounded-md bg-[#0C0C0E] px-2.5 py-1.5 text-[11px] font-medium text-white">
          Get started →
        </button>
      </div>
    ),
  },
  {
    id: 2,
    name: 'Pricing — split with art',
    rationale: 'Left-aligned copy, gradient art block on right.',
    health: 86,
    render: () => (
      <div className="w-full h-full bg-white text-[#0C0C0E] grid grid-cols-[1.2fr_1fr]">
        <div className="flex flex-col justify-center gap-2 px-5">
          <span className="text-[9px] font-medium uppercase tracking-wider text-black/55">Dashboard</span>
          <h4 className="text-[18px] font-semibold leading-tight">Compile design.</h4>
          <p className="text-[11px] text-black/55 leading-snug">
            Tokens, types, components — served to every AI agent.
          </p>
          <div className="flex items-center gap-1.5 mt-2">
            <button className="rounded-md bg-[#0C0C0E] px-2 py-1 text-[10px] font-medium text-white whitespace-nowrap">
              Try it
            </button>
            <button className="rounded-md border border-black/12 px-2 py-1 text-[10px] font-medium text-[#0C0C0E] whitespace-nowrap">
              Docs
            </button>
          </div>
        </div>
        <div
          className="h-full"
          style={{ background: 'linear-gradient(135deg, #E4F222 0%, #3A3F0A 100%)' }}
        />
      </div>
    ),
  },
  {
    id: 3,
    name: 'Pricing — stat hero',
    rationale: 'Three live metrics over a progress bar; NEW pill.',
    health: 90,
    render: () => (
      <div className="w-full h-full bg-white text-[#0C0C0E] flex flex-col gap-2.5 p-5">
        <div className="flex items-center justify-between">
          <span className="rounded border border-emerald-600/30 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-medium text-emerald-700">
            NEW
          </span>
          <span className="font-mono text-[9px] text-black/40">layout v1</span>
        </div>
        <h4 className="text-[16px] font-semibold leading-snug">
          The compiler<br />for design systems.
        </h4>
        <div className="grid grid-cols-3 gap-2">
          {[
            { v: '17', l: 'tokens' },
            { v: '12', l: 'components' },
            { v: '6', l: 'kits' },
          ].map((s) => (
            <div key={s.l} className="rounded-md border border-black/8 bg-black/[0.025] px-2 py-1.5">
              <div className="text-[14px] font-semibold leading-none">{s.v}</div>
              <div className="text-[8.5px] font-mono text-black/50 mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-1 mt-auto">
          <div className="h-1 w-full rounded-full bg-black/10">
            <div className="h-1 w-[68%] rounded-full bg-[#E4F222]" />
          </div>
          <div className="flex items-center justify-between text-[9px] font-mono text-black/45">
            <span>health · 87/100</span>
            <span>synced</span>
          </div>
        </div>
      </div>
    ),
  },
];

interface VariantCardProps {
  variant: Variant;
  selected: boolean;
  delay: number;
  onClick: () => void;
}

function VariantCard({ variant, selected, delay, onClick }: VariantCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0, 0, 0.2, 1] }}
      viewport={{ once: true, margin: '-10%' }}
      className="group relative flex flex-col rounded-xl overflow-hidden cursor-pointer transition-all"
      onClick={onClick}
      style={{
        backgroundColor: selected ? STUDIO_TOKENS.bgElevated : STUDIO_TOKENS.bgSurface,
        border: `1px solid ${selected ? STUDIO_TOKENS.accent : STUDIO_TOKENS.border}`,
        boxShadow: selected ? `0 0 0 1px ${STUDIO_TOKENS.accent}33` : 'none',
      }}
    >
      {selected && (
        <div
          className="absolute -right-1.5 -top-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full"
          style={{ backgroundColor: STUDIO_TOKENS.accent }}
        >
          <Check className="h-3 w-3" style={{ color: STUDIO_TOKENS.textOnAccent }} />
        </div>
      )}
      {/* Preview pane — aspect-[4/3], white bg, no scale (mocked content already small) */}
      <div className="aspect-[4/3] overflow-hidden" style={{ backgroundColor: '#FFFFFF' }}>
        {variant.render()}
      </div>
      {/* Info */}
      <div className="flex flex-col gap-1 p-3">
        <div className="flex items-center justify-between gap-2">
          <span
            className="text-[13px] font-semibold truncate"
            style={{ color: STUDIO_TOKENS.textPrimary }}
          >
            {variant.name}
          </span>
          <span
            className="rounded-full px-1.5 py-[1px] text-[10px] font-semibold tabular-nums shrink-0"
            style={{
              backgroundColor:
                variant.health >= 90 ? 'rgba(52,199,89,0.15)' : 'rgba(228,242,34,0.12)',
              color: variant.health >= 90 ? 'rgb(110,231,183)' : '#E4F222',
            }}
          >
            {variant.health}
          </span>
        </div>
        <p
          className="text-[11px] leading-snug line-clamp-2"
          style={{ color: STUDIO_TOKENS.textSecondary }}
        >
          {variant.rationale}
        </p>
      </div>
      {/* Action toolbar — opacity transitions with hover/selected */}
      <div
        className="flex items-center gap-1 border-t px-3 py-2 transition-opacity"
        style={{
          borderColor: STUDIO_TOKENS.border,
          opacity: selected ? 1 : undefined,
        }}
      >
        {[ThumbsUp, ThumbsDown, MousePointer2, Copy, RotateCw, Monitor, FigmaIcon, BookMarked].map((Icon, i) => (
          <button
            key={i}
            className="flex h-5 w-5 items-center justify-center rounded transition-colors hover:bg-white/8"
            style={{ color: STUDIO_TOKENS.textMuted }}
          >
            <Icon className="h-3 w-3" />
          </button>
        ))}
      </div>
    </motion.div>
  );
}

function TokensList() {
  const groups = ['Brand', 'Surface', 'Text'];
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex flex-col gap-3 px-3 py-3 overflow-y-auto">
        {groups.map((g) => (
          <div key={g} className="flex flex-col">
            <div
              className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: STUDIO_TOKENS.textMuted }}
            >
              {g}
            </div>
            <div className="flex flex-col">
              {TOKENS.filter((t) => t.group === g).map((t) => (
                <div
                  key={t.name}
                  className="flex items-center gap-2 rounded px-2 py-1.5 cursor-pointer transition-colors hover:bg-white/5"
                >
                  <div
                    className="h-4 w-4 shrink-0 rounded-full border"
                    style={{ backgroundColor: t.hex, borderColor: STUDIO_TOKENS.border }}
                  />
                  <span
                    className="text-xs font-mono truncate flex-1"
                    style={{ color: STUDIO_TOKENS.textPrimary }}
                  >
                    {t.name}
                  </span>
                  <span
                    className="text-[10px] font-mono"
                    style={{ color: STUDIO_TOKENS.textMuted }}
                  >
                    {t.hex.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ComponentsList() {
  const items = [
    { name: 'Button', vars: 3 },
    { name: 'Input', vars: 2 },
    { name: 'Card', vars: 4 },
    { name: 'Badge', vars: 5 },
    { name: 'Tabs', vars: 1 },
  ];
  return (
    <div className="flex flex-col gap-1 px-3 py-3 overflow-y-auto">
      <div
        className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider"
        style={{ color: STUDIO_TOKENS.textMuted }}
      >
        Components · 12
      </div>
      {items.map((c) => (
        <div
          key={c.name}
          className="flex items-center gap-2 rounded px-2 py-1.5 cursor-pointer transition-colors hover:bg-white/5"
        >
          <div
            className="h-4 w-4 shrink-0 rounded border"
            style={{ borderColor: STUDIO_TOKENS.border, backgroundColor: STUDIO_TOKENS.bgSurface }}
          />
          <span
            className="text-xs flex-1"
            style={{ color: STUDIO_TOKENS.textPrimary }}
          >
            {c.name}
          </span>
          <span
            className="text-[10px] font-mono"
            style={{ color: STUDIO_TOKENS.textMuted }}
          >
            {c.vars} variant{c.vars !== 1 ? 's' : ''}
          </span>
        </div>
      ))}
    </div>
  );
}

export function HeroMock() {
  const [activeTab, setActiveTab] = useState('tokens');
  const [selectedVariant, setSelectedVariant] = useState<number>(2);
  const [variantCount, setVariantCount] = useState(3);
  const [prompt, setPrompt] = useState('');

  return (
    <StudioWindow
      projectName="Acme"
      sourceType="figma"
      sourceName="acme-design-system"
    >
      <SourcePanel tabs={TABS} activeTab={activeTab} onTab={setActiveTab} width={260}>
        {activeTab === 'tokens' && <TokensList />}
        {activeTab === 'components' && <ComponentsList />}
        {activeTab !== 'tokens' && activeTab !== 'components' && (
          <div
            className="flex items-center justify-center h-full text-[11px] px-4 text-center"
            style={{ color: STUDIO_TOKENS.textMuted }}
          >
            {TABS.find((t) => t.id === activeTab)?.label} panel
          </div>
        )}
      </SourcePanel>

      <StudioSurface>
        {/* Variant grid (top) */}
        <div className="mx-3 mt-3 grid grid-cols-3 gap-3 items-start">
          {VARIANTS.map((v, i) => (
            <VariantCard
              key={v.id}
              variant={v}
              selected={selectedVariant === v.id}
              delay={0.15 + i * 0.08}
              onClick={() => setSelectedVariant(v.id)}
            />
          ))}
        </div>
        {/* Spacer pushes toolbar to bottom */}
        <div className="flex-1 min-h-0" />
        {/* Explorer toolbar (bottom — chat-input style, mirrors real ExplorerToolbar) */}
        <div
          className="mx-3 mb-3 flex flex-col rounded-lg border shrink-0"
          style={{
            borderColor: STUDIO_TOKENS.border,
            backgroundColor: STUDIO_TOKENS.bgSurface,
          }}
        >
          {/* Prompt textarea */}
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
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder='Describe what to explore... e.g. "a pricing card with feature tiers"'
                  rows={1}
                  className="flex-1 resize-none bg-transparent text-[13px] leading-snug outline-none"
                  style={{
                    color: STUDIO_TOKENS.textPrimary,
                  }}
                />
              </div>
              <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5">
                <button
                  className="flex items-center justify-center size-6 rounded-full bg-transparent border transition-colors hover:opacity-80"
                  style={{
                    borderColor: STUDIO_TOKENS.border,
                    color: STUDIO_TOKENS.textMuted,
                  }}
                  title="Attach context files"
                >
                  <Paperclip className="h-3 w-3" />
                </button>
                <button
                  className="flex items-center justify-center size-6 rounded-full bg-transparent border transition-colors hover:opacity-80"
                  style={{
                    borderColor: STUDIO_TOKENS.border,
                    color: STUDIO_TOKENS.textMuted,
                  }}
                  title="Attach reference image"
                >
                  <ImagePlus className="h-3 w-3" />
                </button>
                {prompt.trim() && (
                  <button
                    className="flex items-center justify-center size-6 rounded-full transition-colors hover:opacity-90"
                    style={{
                      backgroundColor: STUDIO_TOKENS.textPrimary,
                      color: STUDIO_TOKENS.bgApp,
                    }}
                  >
                    <ArrowUp className="h-3 w-3" strokeWidth={2.5} />
                  </button>
                )}
              </div>
            </div>
          </div>
          {/* Controls */}
          <div
            className="flex h-[38px] items-center justify-between border-t px-5 pr-4"
            style={{ borderColor: 'rgba(255,255,255,0.05)' }}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xs" style={{ color: STUDIO_TOKENS.textPrimary }}>
                  Variants:
                </span>
                <button
                  onClick={() => setVariantCount((c) => Math.max(1, c - 1))}
                  className="rounded p-0.5 transition-colors hover:bg-white/5"
                  style={{ color: STUDIO_TOKENS.textSecondary }}
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span
                  className="w-4 text-center text-xs font-medium"
                  style={{ color: STUDIO_TOKENS.textPrimary }}
                >
                  {variantCount}
                </span>
                <button
                  onClick={() => setVariantCount((c) => Math.min(6, c + 1))}
                  className="rounded p-0.5 transition-colors hover:bg-white/5"
                  style={{ color: STUDIO_TOKENS.textSecondary }}
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs" style={{ color: STUDIO_TOKENS.textPrimary }}>
                  Model:
                </span>
                <div
                  className="relative inline-flex items-center gap-1 rounded-md border pl-2 pr-2 py-0.5 text-xs cursor-pointer hover:bg-white/5 transition-colors"
                  style={{
                    borderColor: 'rgba(255,255,255,0.08)',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    color: STUDIO_TOKENS.textPrimary,
                  }}
                >
                  Claude Sonnet 4.6
                  <ChevronDown className="h-2.5 w-2.5" />
                </div>
                <span className="text-[10px]" style={{ color: STUDIO_TOKENS.textMuted }}>
                  = 3 credits
                </span>
              </div>
              <button
                className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs transition-colors hover:bg-white/5"
                style={{ color: STUDIO_TOKENS.textPrimary }}
              >
                <Split className="h-3 w-3" />
                Compare
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="inline-flex items-center gap-1.5 rounded-md border h-[30px] px-3 text-xs font-medium transition-colors hover:bg-white/5"
                style={{
                  borderColor: 'rgba(255,255,255,0.07)',
                  color: STUDIO_TOKENS.textPrimary,
                }}
              >
                <Download className="h-3 w-3" />
                Import from Figma
              </button>
              <button
                className="inline-flex items-center gap-1.5 rounded-md border h-[30px] px-3 text-xs font-medium transition-colors hover:bg-white/5"
                style={{
                  borderColor: 'rgba(255,255,255,0.07)',
                  color: STUDIO_TOKENS.textPrimary,
                }}
              >
                <FigmaIcon className="h-3 w-3" />
                Push to Figma
              </button>
            </div>
          </div>
        </div>

      </StudioSurface>
    </StudioWindow>
  );
}
