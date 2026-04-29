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
  Shapes,
  ImagePlus,
  FileText,
  Minus,
  Plus,
  ArrowUp,
  Split,
  Download,
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
  ChevronRight,
  Search,
  Bell,
  Heart,
  Settings as SettingsIcon,
  User as UserIcon,
  Mail,
  Star,
  Send,
  ExternalLink,
} from 'lucide-react';
import { StudioWindow, SourcePanel, StudioSurface, Tooltip, PaperIcon, STUDIO_TOKENS } from './_studio-chrome';

const ACTIONS = [
  { Icon: ThumbsUp, label: 'Good' },
  { Icon: ThumbsDown, label: 'Bad' },
  { Icon: MousePointer2, label: 'Inspect & edit' },
  { Icon: Copy, label: 'Copy code' },
  { Icon: RotateCw, label: 'Regenerate' },
  { Icon: Monitor, label: 'Responsive preview' },
  { Icon: FigmaIcon, label: 'Push to Figma' },
  { Icon: PaperIcon, label: 'Push to Paper' },
  { Icon: BookMarked, label: 'Add to library' },
];

const TABS = [
  { id: 'tokens', label: 'Tokens', icon: Palette },
  { id: 'components', label: 'Components', icon: LayoutGrid },
  { id: 'screenshots', label: 'Screenshots', icon: ImageIcon },
  { id: 'icons', label: 'Icons', icon: Shapes },
  { id: 'fonts', label: 'Fonts', icon: Type },
  { id: 'branding', label: 'Branding', icon: ImagePlus },
  { id: 'context', label: 'Context', icon: FileText },
  { id: 'quality', label: 'Quality', icon: Gauge },
  { id: 'figma', label: 'Figma', icon: FigmaIcon },
  { id: 'connect', label: 'Connect', icon: Terminal },
];

// ─── Shared panel header ────────────────────────────────────────────────────

function PanelHeader({ label, count, action }: { label: string; count?: string | number; action?: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between px-3 pt-3 pb-2">
      <div className="flex items-baseline gap-1.5">
        <span
          className="text-[10px] font-semibold uppercase tracking-wider"
          style={{ color: STUDIO_TOKENS.textMuted }}
        >
          {label}
        </span>
        {count !== undefined && (
          <span className="font-mono text-[10px]" style={{ color: STUDIO_TOKENS.textMuted }}>
            {count}
          </span>
        )}
      </div>
      {action}
    </div>
  );
}

// ─── Tokens panel ───────────────────────────────────────────────────────────

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
  { name: '--bg-hover', hex: '#2A2A32', group: 'Surface' },
  { name: '--text-primary', hex: '#EDEDF4', group: 'Text' },
  { name: '--text-secondary', hex: '#A6A6B0', group: 'Text' },
  { name: '--text-muted', hex: '#7A7A85', group: 'Text' },
  { name: '--success', hex: '#34C759', group: 'Status' },
  { name: '--warning', hex: '#FF9F0A', group: 'Status' },
  { name: '--error', hex: '#FF453A', group: 'Status' },
];

function TokensPanel({
  selected,
  setSelected,
}: {
  selected: string | null;
  setSelected: (n: string | null) => void;
}) {
  const groups = ['Brand', 'Surface', 'Text', 'Status'] as const;
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {groups.map((g) => {
        const items = TOKENS.filter((t) => t.group === g);
        return (
          <div key={g} className="flex flex-col">
            <div className="flex items-baseline justify-between px-3 pt-2.5 pb-1">
              <span
                className="text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: STUDIO_TOKENS.textMuted }}
              >
                {g}
              </span>
              <span className="font-mono text-[10px]" style={{ color: STUDIO_TOKENS.textMuted }}>
                {items.length}
              </span>
            </div>
            <div className="flex flex-col px-1.5">
              {items.map((t) => (
                <div
                  key={t.name}
                  onClick={() => setSelected(t.name)}
                  className="flex items-center gap-2 rounded px-2 py-1.5 cursor-pointer transition-colors hover:bg-white/5"
                  style={{
                    backgroundColor: selected === t.name ? STUDIO_TOKENS.bgHover : 'transparent',
                  }}
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
        );
      })}
    </div>
  );
}

// ─── Components panel ───────────────────────────────────────────────────────

const COMPONENTS = [
  { name: 'Button', cat: 'Inputs', vars: 3 },
  { name: 'Input', cat: 'Inputs', vars: 2 },
  { name: 'Select', cat: 'Inputs', vars: 1 },
  { name: 'Card', cat: 'Display', vars: 4 },
  { name: 'Badge', cat: 'Display', vars: 5 },
  { name: 'Avatar', cat: 'Display', vars: 3 },
  { name: 'Toast', cat: 'Feedback', vars: 4 },
  { name: 'Modal', cat: 'Feedback', vars: 3 },
  { name: 'Tabs', cat: 'Navigation', vars: 1 },
  { name: 'Breadcrumb', cat: 'Navigation', vars: 1 },
];

function ComponentsPanel() {
  const cats = ['Inputs', 'Display', 'Feedback', 'Navigation'];
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {cats.map((cat) => {
        const items = COMPONENTS.filter((c) => c.cat === cat);
        return (
          <div key={cat} className="flex flex-col">
            <div className="flex items-baseline justify-between px-3 pt-2.5 pb-1">
              <span
                className="text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: STUDIO_TOKENS.textMuted }}
              >
                {cat}
              </span>
              <span className="font-mono text-[10px]" style={{ color: STUDIO_TOKENS.textMuted }}>
                {items.length}
              </span>
            </div>
            <div className="flex flex-col px-1.5">
              {items.map((c) => (
                <div
                  key={c.name}
                  className="flex items-center gap-2 rounded px-2 py-1.5 cursor-pointer transition-colors hover:bg-white/5"
                >
                  <div
                    className="h-4 w-4 shrink-0 rounded border flex items-center justify-center"
                    style={{ borderColor: STUDIO_TOKENS.border, backgroundColor: STUDIO_TOKENS.bgSurface }}
                  >
                    <div
                      className="h-1.5 w-2 rounded-sm"
                      style={{ backgroundColor: STUDIO_TOKENS.border }}
                    />
                  </div>
                  <span className="text-xs flex-1" style={{ color: STUDIO_TOKENS.textPrimary }}>
                    {c.name}
                  </span>
                  <span
                    className="text-[10px] font-mono"
                    style={{ color: STUDIO_TOKENS.textMuted }}
                  >
                    {c.vars}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Screenshots panel ──────────────────────────────────────────────────────

function ScreenshotsPanel() {
  const shots = [
    { name: 'Pricing page', tint: 'linear-gradient(135deg, #1A1A20 0%, #2A2A32 100%)' },
    { name: 'Dashboard', tint: 'linear-gradient(135deg, #14140a 0%, #3A3F0A 100%)' },
    { name: 'Sign-in', tint: 'linear-gradient(135deg, #1A1A20 0%, #14140a 100%)' },
    { name: 'Empty state', tint: 'linear-gradient(135deg, #222228 0%, #1A1A20 100%)' },
  ];
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <PanelHeader
        label="Screenshots"
        count={shots.length}
        action={
          <button
            className="flex items-center gap-1 text-[10px] font-medium hover:opacity-80"
            style={{ color: STUDIO_TOKENS.brand }}
          >
            <Plus className="h-2.5 w-2.5" />
            Add
          </button>
        }
      />
      <div className="grid grid-cols-2 gap-2 px-3 pb-3">
        {shots.map((s) => (
          <div
            key={s.name}
            className="rounded-md border overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform"
            style={{ borderColor: STUDIO_TOKENS.border }}
          >
            <div className="aspect-[4/3]" style={{ background: s.tint }}>
              <div className="h-full w-full flex items-end p-1.5">
                <div
                  className="rounded h-1 w-1/3"
                  style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
                />
              </div>
            </div>
            <div className="px-2 py-1.5">
              <span className="text-[10.5px]" style={{ color: STUDIO_TOKENS.textPrimary }}>
                {s.name}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Icons panel ────────────────────────────────────────────────────────────

const ICONS = [ChevronRight, Search, Bell, Heart, SettingsIcon, UserIcon, Mail, Star, Send, ExternalLink, Check, Plus];

function IconsPanel() {
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <PanelHeader label="Icons" count={`${ICONS.length} of 24`} />
      <div className="grid grid-cols-4 gap-1.5 px-3 pb-3">
        {ICONS.map((Icon, i) => (
          <button
            key={i}
            className="aspect-square rounded-md border flex items-center justify-center transition-colors hover:bg-white/5"
            style={{ borderColor: STUDIO_TOKENS.border, backgroundColor: STUDIO_TOKENS.bgSurface }}
          >
            <Icon className="h-4 w-4" style={{ color: STUDIO_TOKENS.textPrimary }} />
          </button>
        ))}
      </div>
      <div className="px-3 pb-3 mt-auto">
        <button
          className="w-full flex items-center justify-center gap-1.5 rounded-md border py-1.5 text-[10.5px] font-medium hover:bg-white/5 transition-colors"
          style={{ borderColor: STUDIO_TOKENS.borderStrong, color: STUDIO_TOKENS.textSecondary }}
        >
          <Shapes className="h-3 w-3" />
          Browse 24 icons
        </button>
      </div>
    </div>
  );
}

// ─── Fonts panel ────────────────────────────────────────────────────────────

const FONTS = [
  { name: 'Display', font: 'Inter', size: 32, weight: 600 },
  { name: 'Heading', font: 'Inter', size: 22, weight: 600 },
  { name: 'Body', font: 'Inter', size: 15, weight: 400 },
  { name: 'Caption', font: 'Inter', size: 12, weight: 500 },
  { name: 'Mono', font: 'Geist Mono', size: 12, weight: 500 },
];

function FontsPanel() {
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <PanelHeader label="Type scale" count={FONTS.length} />
      <div className="flex flex-col gap-1.5 px-3 pb-3">
        {FONTS.map((f) => (
          <div
            key={f.name}
            className="flex items-center gap-3 rounded-md border px-3 py-2 cursor-pointer hover:bg-white/[0.02] transition-colors"
            style={{ borderColor: STUDIO_TOKENS.border }}
          >
            <span
              className="leading-none shrink-0"
              style={{
                fontSize: f.size,
                fontWeight: f.weight,
                color: STUDIO_TOKENS.textPrimary,
                fontFamily: f.font === 'Geist Mono' ? '"Geist Mono", monospace' : 'inherit',
              }}
            >
              Aa
            </span>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-[12px]" style={{ color: STUDIO_TOKENS.textPrimary }}>
                {f.name}
              </span>
              <span
                className="font-mono text-[10px] truncate"
                style={{ color: STUDIO_TOKENS.textMuted }}
              >
                {f.font} · {f.size}/{f.weight}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Branding panel ─────────────────────────────────────────────────────────

function BrandingPanel() {
  return (
    <div className="flex flex-col h-full overflow-y-auto px-3 py-3 gap-4">
      <div>
        <div
          className="text-[10px] font-semibold uppercase tracking-wider mb-2"
          style={{ color: STUDIO_TOKENS.textMuted }}
        >
          Logo
        </div>
        <div
          className="rounded-md border aspect-[2/1] flex items-center justify-center gap-2"
          style={{ borderColor: STUDIO_TOKENS.border, backgroundColor: STUDIO_TOKENS.bgSurface }}
        >
          <div
            className="h-7 w-7 rounded flex items-center justify-center text-[14px] font-black"
            style={{ backgroundColor: STUDIO_TOKENS.brand, color: STUDIO_TOKENS.textOnAccent }}
          >
            A
          </div>
          <span className="text-[16px] font-semibold tracking-tight" style={{ color: STUDIO_TOKENS.textPrimary }}>
            Acme
          </span>
        </div>
      </div>
      <div>
        <div
          className="text-[10px] font-semibold uppercase tracking-wider mb-2"
          style={{ color: STUDIO_TOKENS.textMuted }}
        >
          Voice
        </div>
        <div className="flex flex-wrap gap-1">
          {['Direct', 'Confident', 'Playful', 'Technical'].map((t) => (
            <span
              key={t}
              className="rounded-full border px-2 py-0.5 text-[10.5px]"
              style={{
                borderColor: STUDIO_TOKENS.border,
                backgroundColor: STUDIO_TOKENS.bgSurface,
                color: STUDIO_TOKENS.textPrimary,
              }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>
      <div>
        <div
          className="text-[10px] font-semibold uppercase tracking-wider mb-2"
          style={{ color: STUDIO_TOKENS.textMuted }}
        >
          Tone rules
        </div>
        <ul className="flex flex-col gap-1 text-[11px]" style={{ color: STUDIO_TOKENS.textSecondary }}>
          <li className="flex gap-1.5">
            <Check className="h-2.5 w-2.5 mt-0.5 shrink-0" style={{ color: STUDIO_TOKENS.statusSuccess }} />
            Use sentence case
          </li>
          <li className="flex gap-1.5">
            <Check className="h-2.5 w-2.5 mt-0.5 shrink-0" style={{ color: STUDIO_TOKENS.statusSuccess }} />
            Avoid jargon
          </li>
          <li className="flex gap-1.5">
            <Check className="h-2.5 w-2.5 mt-0.5 shrink-0" style={{ color: STUDIO_TOKENS.statusSuccess }} />
            Lead with the verb
          </li>
        </ul>
      </div>
    </div>
  );
}

// ─── Context panel ──────────────────────────────────────────────────────────

const CONTEXT_FILES = [
  { name: 'guidelines.md', size: '4.2 kB', updated: '2d ago' },
  { name: 'voice.md', size: '1.1 kB', updated: '1w ago' },
  { name: 'patterns.md', size: '8.7 kB', updated: '3d ago' },
  { name: 'a11y.md', size: '2.4 kB', updated: '5d ago' },
];

function ContextPanel() {
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <PanelHeader
        label="Context files"
        count={CONTEXT_FILES.length}
        action={
          <button
            className="flex items-center gap-1 text-[10px] font-medium hover:opacity-80"
            style={{ color: STUDIO_TOKENS.brand }}
          >
            <Plus className="h-2.5 w-2.5" />
            Add
          </button>
        }
      />
      <div className="flex flex-col px-1.5">
        {CONTEXT_FILES.map((f) => (
          <div
            key={f.name}
            className="flex items-center gap-2 rounded px-2 py-1.5 cursor-pointer transition-colors hover:bg-white/5"
          >
            <FileText className="h-3.5 w-3.5 shrink-0" style={{ color: STUDIO_TOKENS.textMuted }} />
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-xs truncate" style={{ color: STUDIO_TOKENS.textPrimary }}>
                {f.name}
              </span>
              <span className="text-[10px] font-mono" style={{ color: STUDIO_TOKENS.textMuted }}>
                {f.size} · {f.updated}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Quality panel ──────────────────────────────────────────────────────────

const SECTIONS = [
  { label: 'Quick Reference', score: 95 },
  { label: 'Colours', score: 92 },
  { label: 'Typography', score: 80 },
  { label: 'Spacing', score: 70 },
  { label: 'Components', score: 65 },
  { label: 'Anti-patterns', score: 100 },
];

function QualityPanel() {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const SCORE = 87;
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Score ring */}
      <div className="flex items-center justify-center py-4 px-3">
        <div className="relative">
          <svg width="80" height="80" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r={radius} fill="none" stroke={STUDIO_TOKENS.border} strokeWidth="5" />
            <circle
              cx="40"
              cy="40"
              r={radius}
              fill="none"
              stroke={STUDIO_TOKENS.statusSuccess}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - SCORE / 100)}
              transform="rotate(-90 40 40)"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="text-[20px] font-semibold leading-none tabular-nums"
              style={{ color: STUDIO_TOKENS.statusSuccess }}
            >
              {SCORE}
            </span>
            <span className="text-[8px] mt-0.5" style={{ color: STUDIO_TOKENS.textMuted }}>
              / 100
            </span>
          </div>
        </div>
      </div>
      {/* Section breakdowns */}
      <div className="flex flex-col gap-1.5 px-3 pb-3">
        {SECTIONS.map((s) => {
          const colour =
            s.score >= 90
              ? STUDIO_TOKENS.statusSuccess
              : s.score >= 75
              ? '#E4F222'
              : s.score >= 60
              ? STUDIO_TOKENS.statusWarning
              : STUDIO_TOKENS.statusError;
          return (
            <div key={s.label} className="flex items-center gap-2">
              <span className="text-[10.5px] flex-1 truncate" style={{ color: STUDIO_TOKENS.textPrimary }}>
                {s.label}
              </span>
              <div
                className="h-1 w-10 rounded-full overflow-hidden"
                style={{ backgroundColor: STUDIO_TOKENS.bgElevated }}
              >
                <div
                  className="h-full rounded-full"
                  style={{ width: `${s.score}%`, backgroundColor: colour }}
                />
              </div>
              <span
                className="text-[10px] font-mono w-7 text-right tabular-nums"
                style={{ color: colour }}
              >
                {s.score}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Figma panel ────────────────────────────────────────────────────────────

function FigmaPanel() {
  return (
    <div className="flex flex-col h-full overflow-y-auto px-3 py-3 gap-3">
      <div
        className="rounded-md border p-3 flex flex-col gap-2"
        style={{ borderColor: STUDIO_TOKENS.border, backgroundColor: STUDIO_TOKENS.bgSurface }}
      >
        <div className="flex items-center gap-2">
          <FigmaIcon className="h-3.5 w-3.5" style={{ color: STUDIO_TOKENS.textMuted }} />
          <span className="text-[11.5px] font-medium" style={{ color: STUDIO_TOKENS.textPrimary }}>
            acme · design-system
          </span>
        </div>
        <div className="font-mono text-[10px]" style={{ color: STUDIO_TOKENS.textMuted }}>
          file 4kLp4Ws…
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-mono" style={{ color: STUDIO_TOKENS.statusSuccess }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: STUDIO_TOKENS.statusSuccess }} />
          synced 2 min ago
        </div>
      </div>
      <div>
        <div
          className="text-[10px] font-semibold uppercase tracking-wider mb-1.5"
          style={{ color: STUDIO_TOKENS.textMuted }}
        >
          Webhook
        </div>
        <div
          className="rounded-md border px-3 py-2 flex items-center justify-between"
          style={{ borderColor: STUDIO_TOKENS.border, backgroundColor: STUDIO_TOKENS.bgSurface }}
        >
          <span className="text-[11px]" style={{ color: STUDIO_TOKENS.textPrimary }}>
            FILE_UPDATE
          </span>
          <span className="text-[10px] font-mono" style={{ color: STUDIO_TOKENS.statusSuccess }}>
            ● live
          </span>
        </div>
      </div>
      <button
        className="flex items-center justify-center gap-1.5 rounded-md py-2 text-[11.5px] font-medium transition-colors hover:opacity-90"
        style={{ backgroundColor: STUDIO_TOKENS.accent, color: STUDIO_TOKENS.textOnAccent }}
      >
        <RotateCw className="h-3 w-3" />
        Sync now
      </button>
      <button
        className="flex items-center justify-center gap-1.5 rounded-md border py-2 text-[11.5px] hover:bg-white/5"
        style={{ borderColor: STUDIO_TOKENS.borderStrong, color: STUDIO_TOKENS.textSecondary }}
      >
        <ExternalLink className="h-3 w-3" />
        Open in Figma
      </button>
    </div>
  );
}

// ─── Connect panel ──────────────────────────────────────────────────────────

const CONNECTIONS = [
  { name: 'Claude Code', status: 'connected' },
  { name: 'Cursor', status: 'connected' },
  { name: 'Windsurf', status: 'connected' },
  { name: 'Copilot', status: 'connected' },
  { name: 'Codex', status: 'connected' },
  { name: 'Gemini CLI', status: 'connected' },
];

function ConnectPanel() {
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <PanelHeader
        label="MCP clients"
        count={`${CONNECTIONS.length} of 6`}
        action={
          <span className="text-[10px] font-mono" style={{ color: STUDIO_TOKENS.statusSuccess }}>
            ● all live
          </span>
        }
      />
      <div className="flex flex-col px-1.5">
        {CONNECTIONS.map((c) => (
          <div
            key={c.name}
            className="flex items-center gap-2 rounded px-2 py-1.5 cursor-pointer transition-colors hover:bg-white/5"
          >
            <div
              className="h-4 w-4 shrink-0 rounded border flex items-center justify-center"
              style={{ borderColor: STUDIO_TOKENS.border, backgroundColor: STUDIO_TOKENS.bgSurface }}
            >
              <Terminal className="h-2.5 w-2.5" style={{ color: STUDIO_TOKENS.textMuted }} />
            </div>
            <span className="text-xs flex-1" style={{ color: STUDIO_TOKENS.textPrimary }}>
              {c.name}
            </span>
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: STUDIO_TOKENS.statusSuccess }} />
          </div>
        ))}
      </div>
      <div className="px-3 pt-3 pb-3 mt-auto">
        <div
          className="rounded-md border px-3 py-2 flex items-center justify-between"
          style={{ borderColor: STUDIO_TOKENS.border, backgroundColor: STUDIO_TOKENS.bgSurface }}
        >
          <span className="text-[10.5px]" style={{ color: STUDIO_TOKENS.textPrimary }}>
            12 MCP tools
          </span>
          <span className="text-[10px] font-mono" style={{ color: STUDIO_TOKENS.textMuted }}>
            ready
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Variant data ───────────────────────────────────────────────────────────

interface Variant {
  id: number;
  name: string;
  rationale: string;
  health: number;
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
          <span className="text-[9px] font-medium uppercase tracking-wider text-black/55">
            Dashboard
          </span>
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
      <div className="aspect-[4/3] overflow-hidden" style={{ backgroundColor: '#FFFFFF' }}>
        {variant.render()}
      </div>
      <div className="flex flex-col gap-1 p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[13px] font-semibold truncate" style={{ color: STUDIO_TOKENS.textPrimary }}>
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
      <div
        className="flex items-center gap-1 border-t px-3 py-2 transition-opacity"
        style={{ borderColor: STUDIO_TOKENS.border, opacity: selected ? 1 : undefined }}
      >
        {ACTIONS.map(({ Icon, label }, i) => (
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

// ─── Main ───────────────────────────────────────────────────────────────────

export function HeroMock() {
  const [activeTab, setActiveTab] = useState('tokens');
  const [selectedToken, setSelectedToken] = useState<string | null>('--accent');
  const [selectedVariant, setSelectedVariant] = useState<number>(2);
  const [variantCount, setVariantCount] = useState(3);
  const [prompt, setPrompt] = useState('');

  return (
    <StudioWindow projectName="Acme" sourceType="figma" sourceName="acme-design-system">
      <SourcePanel tabs={TABS} activeTab={activeTab} onTab={setActiveTab} width={320}>
        {activeTab === 'tokens' && <TokensPanel selected={selectedToken} setSelected={setSelectedToken} />}
        {activeTab === 'components' && <ComponentsPanel />}
        {activeTab === 'screenshots' && <ScreenshotsPanel />}
        {activeTab === 'icons' && <IconsPanel />}
        {activeTab === 'fonts' && <FontsPanel />}
        {activeTab === 'branding' && <BrandingPanel />}
        {activeTab === 'context' && <ContextPanel />}
        {activeTab === 'quality' && <QualityPanel />}
        {activeTab === 'figma' && <FigmaPanel />}
        {activeTab === 'connect' && <ConnectPanel />}
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
                  style={{ color: STUDIO_TOKENS.textPrimary }}
                />
              </div>
              <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5">
                <Tooltip label="Attach context files">
                  <button
                    className="flex items-center justify-center size-6 rounded-full bg-transparent border transition-colors hover:opacity-80"
                    style={{ borderColor: STUDIO_TOKENS.border, color: STUDIO_TOKENS.textMuted }}
                  >
                    <Paperclip className="h-3 w-3" />
                  </button>
                </Tooltip>
                <Tooltip label="Attach reference image">
                  <button
                    className="flex items-center justify-center size-6 rounded-full bg-transparent border transition-colors hover:opacity-80"
                    style={{ borderColor: STUDIO_TOKENS.border, color: STUDIO_TOKENS.textMuted }}
                  >
                    <ImagePlus className="h-3 w-3" />
                  </button>
                </Tooltip>
                {prompt.trim() && (
                  <button
                    className="flex items-center justify-center size-6 rounded-full transition-colors hover:opacity-90"
                    style={{ backgroundColor: STUDIO_TOKENS.textPrimary, color: STUDIO_TOKENS.bgApp }}
                  >
                    <ArrowUp className="h-3 w-3" strokeWidth={2.5} />
                  </button>
                )}
              </div>
            </div>
          </div>
          <div
            className="flex h-[38px] items-center justify-between border-t px-5 pr-4 whitespace-nowrap"
            style={{ borderColor: 'rgba(255,255,255,0.05)' }}
          >
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs" style={{ color: STUDIO_TOKENS.textPrimary }}>Variants:</span>
                <button
                  onClick={() => setVariantCount((c) => Math.max(1, c - 1))}
                  className="rounded p-0.5 transition-colors hover:bg-white/5"
                  style={{ color: STUDIO_TOKENS.textSecondary }}
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-4 text-center text-xs font-medium" style={{ color: STUDIO_TOKENS.textPrimary }}>
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
                <span className="text-xs" style={{ color: STUDIO_TOKENS.textPrimary }}>Model:</span>
                <div
                  className="relative inline-flex items-center gap-1 rounded-md border pl-2 pr-2 py-0.5 text-xs cursor-pointer hover:bg-white/5 transition-colors"
                  style={{
                    borderColor: 'rgba(255,255,255,0.08)',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    color: STUDIO_TOKENS.textPrimary,
                  }}
                >
                  Sonnet 4.6
                  <ChevronDown className="h-2.5 w-2.5" />
                </div>
              </div>
              <button
                className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs transition-colors hover:bg-white/5"
                style={{ color: STUDIO_TOKENS.textPrimary }}
              >
                <Split className="h-3 w-3" />
                Compare
              </button>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Tooltip label="Import from Figma">
                <button
                  className="inline-flex items-center gap-1.5 rounded-md border h-[30px] px-3 text-xs font-medium transition-colors hover:bg-white/5"
                  style={{ borderColor: 'rgba(255,255,255,0.07)', color: STUDIO_TOKENS.textPrimary }}
                >
                  <Download className="h-3 w-3" />
                  Import
                </button>
              </Tooltip>
              <button
                className="inline-flex items-center gap-1.5 rounded-md border h-[30px] px-3 text-xs font-medium transition-colors hover:bg-white/5"
                style={{ borderColor: 'rgba(255,255,255,0.07)', color: STUDIO_TOKENS.textPrimary }}
              >
                <FigmaIcon className="h-3 w-3" />
                Push to Figma
              </button>
              <button
                className="inline-flex items-center gap-1.5 rounded-md border h-[30px] px-3 text-xs font-medium transition-colors hover:bg-white/5"
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
