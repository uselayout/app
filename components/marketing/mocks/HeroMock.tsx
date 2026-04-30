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
  FileCode2,
  Sparkles,
  BookMarked,
  Plus,
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
  Check,
  RotateCw,
} from 'lucide-react';
import {
  StudioWindow,
  SourcePanel,
  StudioSurface,
  ViewSidebar,
  STUDIO_TOKENS,
} from './_studio-chrome';
import { ExplorerView } from './hero/ExplorerView';
import { EditorView } from './hero/EditorView';
import { DesignSystemView } from './hero/DesignSystemView';
import { LibraryView } from './hero/LibraryView';

// ─── View switcher (leftmost activity bar) ──────────────────────────────────

const VIEWS = [
  { id: 'editor', label: 'Editor', icon: FileCode2 },
  { id: 'explorer', label: 'Explorer', icon: Sparkles },
  { id: 'design-system', label: 'Design System', icon: Palette },
  { id: 'library', label: 'Library', icon: BookMarked },
];

// ─── Source-panel tabs (persist across all 4 views) ─────────────────────────

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

// ─── Shared header for source-panel tabs ────────────────────────────────────

function PanelHeader({
  label,
  count,
  action,
}: {
  label: string;
  count?: string | number;
  action?: React.ReactNode;
}) {
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

interface SourceToken { name: string; hex: string; group: string }

const SOURCE_TOKENS: SourceToken[] = [
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
        const items = SOURCE_TOKENS.filter((t) => t.group === g);
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

const QUALITY_SECTIONS = [
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
      <div className="flex flex-col gap-1.5 px-3 pb-3">
        {QUALITY_SECTIONS.map((s) => {
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
                <div className="h-full rounded-full" style={{ width: `${s.score}%`, backgroundColor: colour }} />
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

// ─── Main ───────────────────────────────────────────────────────────────────

export function HeroMock() {
  const [activeView, setActiveView] = useState('explorer');
  const [activeTab, setActiveTab] = useState('tokens');
  const [selectedToken, setSelectedToken] = useState<string | null>('--accent');

  return (
    <StudioWindow projectName="Acme" sourceType="figma" sourceName="acme-design-system">
      {/* Leftmost: view switcher */}
      <ViewSidebar views={VIEWS} activeView={activeView} onView={setActiveView} />

      {/* SourcePanel persists across all views */}
      <SourcePanel tabs={TABS} activeTab={activeTab} onTab={setActiveTab} width={340}>
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

      {/* Centre: active view */}
      <StudioSurface>
        {activeView === 'editor' && <EditorView />}
        {activeView === 'explorer' && <ExplorerView />}
        {activeView === 'design-system' && <DesignSystemView />}
        {activeView === 'library' && <LibraryView />}
      </StudioSurface>
    </StudioWindow>
  );
}
