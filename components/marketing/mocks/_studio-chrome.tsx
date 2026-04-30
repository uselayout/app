'use client';

/**
 * Shared Studio chrome for marketing mocks.
 *
 * Mirrors the real components/shared/TopBar.tsx and the SourcePanel tab strip
 * exactly — same heights, tokens, icon sizes, hover states. Mocks compose
 * StudioWindow + (optional) SourceTabStrip + body content so the homepage
 * UI matches the actual product.
 *
 * NOTE: hardcoded hex values (not var(--bg-app)) because the marketing site
 * runs with `<html class="light">` which would flip Studio :root tokens.
 */

import { useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PanelLeft,
  RefreshCw,
  Share2,
  Figma as FigmaIcon,
  Globe,
  Download,
  X,
  FileText,
  Check,
} from 'lucide-react';

/**
 * Mode-aware "canvas tokens" for the design-system mocks. When a user toggles
 * Dark/Light in a DS mock, the *canvas* (preview surface) flips to that mode
 * — bg, text, borders, CTAs all swap. Studio chrome (TopBar, SourcePanel)
 * stays in STUDIO_TOKENS dark since the editor itself doesn't change theme.
 *
 * Mirrors the real Layout multi-mode pattern at app/globals.css :root vs :root.light.
 */
export const MODE_TOKENS = {
  dark: {
    surface: '#1A1A20',
    textPrimary: '#EDEDF4',
    textSecondary: '#A6A6B0',
    textMuted: '#7A7A85',
    border: 'rgba(255,255,255,0.10)',
    borderStrong: 'rgba(255,255,255,0.22)',
    cardBg: 'rgba(255,255,255,0.025)',
    accent: '#E6E6E6',
    accentText: '#08090a',
  },
  light: {
    surface: '#FFFFFF',
    textPrimary: '#1A1A1A',
    textSecondary: '#525252',
    textMuted: '#737373',
    border: 'rgba(0,0,0,0.10)',
    borderStrong: 'rgba(0,0,0,0.18)',
    cardBg: 'rgba(0,0,0,0.025)',
    accent: '#1A1A1A',
    accentText: '#FFFFFF',
  },
} as const;

export type CanvasMode = keyof typeof MODE_TOKENS;

export const STUDIO_TOKENS = {
  bgApp: '#0C0C0E',
  bgPanel: '#141418',
  bgSurface: '#1A1A20',
  bgElevated: '#222228',
  bgHover: '#2A2A32',
  border: 'rgba(255,255,255,0.12)',
  borderStrong: 'rgba(255,255,255,0.22)',
  borderFocus: 'rgba(230,230,230,0.6)',
  accent: '#E6E6E6',
  accentHover: '#F0F0F4',
  accentSubtle: 'rgba(230,230,230,0.10)',
  textPrimary: '#EDEDF4',
  textSecondary: 'rgba(237,237,244,0.7)',
  textMuted: 'rgba(237,237,244,0.65)',
  textOnAccent: '#08090a',
  statusSuccess: 'rgb(52,199,89)',
  statusWarning: 'rgb(255,159,10)',
  statusError: 'rgb(255,69,58)',
  brand: '#E4F222', // lime — only used in marketing/brand contexts (logo dot)
} as const;

interface StudioWindowProps {
  projectName: string;
  sourceType?: 'figma' | 'website' | 'manual';
  sourceName?: string;
  showExport?: boolean;
  showShare?: boolean;
  showReExtract?: boolean;
  rightExtra?: ReactNode;
  children: ReactNode;
}

/**
 * Outer Studio shell — black bg, top bar with PanelLeft + project name + source pill,
 * + Export CTA. Children fill the area below the top bar.
 */
export function StudioWindow({
  projectName,
  sourceType = 'figma',
  sourceName,
  showExport = true,
  showShare = false,
  showReExtract = true,
  rightExtra,
  children,
}: StudioWindowProps) {
  const SourceIcon = sourceType === 'figma' ? FigmaIcon : Globe;
  const [exportOpen, setExportOpen] = useState(false);
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
      {/* TopBar — h-12, mirrors components/shared/TopBar.tsx */}
      <div
        className="flex h-12 items-center justify-between border-b px-4 shrink-0"
        style={{ borderColor: STUDIO_TOKENS.border, backgroundColor: STUDIO_TOKENS.bgApp }}
      >
        {/* Left: panel toggle + project name + source */}
        <div className="flex flex-1 items-center gap-[17px]">
          <button
            className="flex items-center justify-center size-7 rounded-[4px] border transition-colors"
            style={{
              borderColor: STUDIO_TOKENS.borderStrong,
              backgroundColor: STUDIO_TOKENS.accentSubtle,
              color: STUDIO_TOKENS.textPrimary,
            }}
            title="Toggle source panel"
          >
            <PanelLeft className="h-3.5 w-3.5" />
          </button>
          <span
            className="text-[14px] font-medium"
            style={{ color: STUDIO_TOKENS.textPrimary }}
          >
            {projectName}
          </span>
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-[9px] py-[3px] text-[12px] font-medium"
            style={{ color: STUDIO_TOKENS.textPrimary }}
          >
            <SourceIcon className="h-3 w-3" />
            {sourceName || sourceType}
          </span>
        </div>

        {/* Centre spacer */}
        <div className="flex-1" />

        {/* Right: actions */}
        <div className="flex flex-1 items-center justify-end gap-1.5">
          {rightExtra}
          {showReExtract && (
            <button
              className="flex items-center justify-center size-7 rounded-[4px] border transition-colors hover:opacity-90"
              style={{
                borderColor: STUDIO_TOKENS.borderStrong,
                color: STUDIO_TOKENS.textSecondary,
              }}
              title="Re-extract"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          )}
          {showShare && (
            <button
              className="flex items-center gap-1.5 h-7 px-[10px] rounded-[4px] border text-[12px] transition-colors hover:opacity-90"
              style={{
                borderColor: STUDIO_TOKENS.borderStrong,
                color: STUDIO_TOKENS.textSecondary,
              }}
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>Share</span>
            </button>
          )}
          {showExport && (
            <button
              onClick={() => setExportOpen(true)}
              className="flex items-center justify-center h-7 px-[13px] rounded-[4px] text-[12px] font-medium transition-colors hover:opacity-90"
              style={{
                backgroundColor: STUDIO_TOKENS.accent,
                color: STUDIO_TOKENS.textOnAccent,
              }}
            >
              Export
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 min-h-0">{children}</div>

      {/* Export modal — overlays the entire mock when Export is clicked */}
      <AnimatePresence>
        {exportOpen && <ExportModal onClose={() => setExportOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}

// ─── Export modal ──────────────────────────────────────────────────────────

const FORMAT_OPTIONS = [
  { id: 'claude-md', label: 'CLAUDE.md', description: 'Design system rules for Claude Code' },
  { id: 'cursor-rules', label: '.cursor/rules', description: 'Design system rules for Cursor' },
  { id: 'agents-md', label: 'AGENTS.md', description: 'Context for Codex, Jules, Factory, Amp' },
  { id: 'tokens-css', label: 'tokens.css', description: 'CSS custom properties for all tokens' },
  { id: 'tokens-json', label: 'tokens.json', description: 'W3C DTCG format design tokens' },
  { id: 'tailwind-config', label: 'tailwind.config.js', description: 'Tailwind CSS theme extension' },
];

function ExportModal({ onClose }: { onClose: () => void }) {
  const [selected, setSelected] = useState(new Set(FORMAT_OPTIONS.map((f) => f.id)));
  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      className="absolute inset-0 z-30 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 4 }}
        transition={{ duration: 0.2, ease: [0, 0, 0.2, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-xl border shadow-[0_0_80px_rgba(0,0,0,0.6)] overflow-hidden"
        style={{ backgroundColor: STUDIO_TOKENS.bgElevated, borderColor: STUDIO_TOKENS.borderStrong }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between border-b px-5 py-3.5"
          style={{ borderColor: STUDIO_TOKENS.border }}
        >
          <div className="flex items-center gap-2">
            <Download className="h-3.5 w-3.5" style={{ color: STUDIO_TOKENS.brand }} />
            <h2 className="text-[13px] font-semibold" style={{ color: STUDIO_TOKENS.textPrimary }}>
              Export AI Kit
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 transition-colors hover:bg-white/5"
            style={{ color: STUDIO_TOKENS.textMuted }}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Format list */}
        <div className="p-4 space-y-2 max-h-[440px] overflow-y-auto">
          <p className="mb-2 text-[11px]" style={{ color: STUDIO_TOKENS.textSecondary }}>
            Select formats to include in your bundle:
          </p>
          {FORMAT_OPTIONS.map((format) => {
            const isSelected = selected.has(format.id);
            return (
              <button
                key={format.id}
                onClick={() => toggle(format.id)}
                className="flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors"
                style={{
                  borderColor: isSelected ? STUDIO_TOKENS.accent : STUDIO_TOKENS.border,
                  backgroundColor: isSelected
                    ? 'rgba(230,230,230,0.06)'
                    : STUDIO_TOKENS.bgSurface,
                }}
              >
                <div
                  className="flex h-4 w-4 shrink-0 items-center justify-center rounded border"
                  style={{
                    borderColor: isSelected ? STUDIO_TOKENS.accent : STUDIO_TOKENS.border,
                    backgroundColor: isSelected ? STUDIO_TOKENS.accent : 'transparent',
                  }}
                >
                  {isSelected && (
                    <Check className="h-2.5 w-2.5" style={{ color: STUDIO_TOKENS.textOnAccent }} strokeWidth={3} />
                  )}
                </div>
                <FileText className="h-3.5 w-3.5 shrink-0" style={{ color: STUDIO_TOKENS.textMuted }} />
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] font-medium" style={{ color: STUDIO_TOKENS.textPrimary }}>
                    {format.label}
                  </div>
                  <div className="text-[10px]" style={{ color: STUDIO_TOKENS.textMuted }}>
                    {format.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Always-included note */}
        <div
          className="border-t px-5 py-2.5"
          style={{ borderColor: STUDIO_TOKENS.border }}
        >
          <p className="text-[10px]" style={{ color: STUDIO_TOKENS.textMuted }}>
            layout.md is always included in the bundle.
          </p>
        </div>

        {/* Action */}
        <div className="border-t px-5 py-3.5" style={{ borderColor: STUDIO_TOKENS.border }}>
          <button
            className="h-9 w-full rounded-md text-[12.5px] font-medium transition-colors hover:opacity-90 flex items-center justify-center gap-2"
            style={{
              backgroundColor: STUDIO_TOKENS.accent,
              color: STUDIO_TOKENS.textOnAccent,
            }}
          >
            <Download className="h-3.5 w-3.5" />
            Download bundle ({selected.size} formats)
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

interface TabDef {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface SourceTabStripProps {
  tabs: TabDef[];
  activeTab: string;
  onTab: (id: string) => void;
  trailing?: ReactNode;
}

/**
 * Source panel tab strip — icon-only buttons, mirrors components/studio/SourcePanel.tsx:204-233
 */
export function SourceTabStrip({ tabs, activeTab, onTab, trailing }: SourceTabStripProps) {
  return (
    <div
      className="flex items-center gap-1 border-b px-2 py-1.5 shrink-0 overflow-x-auto"
      style={{
        borderColor: STUDIO_TOKENS.border,
        scrollbarWidth: 'none',
      }}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = tab.id === activeTab;
        return (
          <Tooltip key={tab.id} label={tab.label} side="below">
            <button
              onClick={() => onTab(tab.id)}
              className="flex size-7 items-center justify-center rounded-md transition-all"
              style={{
                backgroundColor: active ? STUDIO_TOKENS.border : 'transparent',
                color: active ? STUDIO_TOKENS.textPrimary : STUDIO_TOKENS.textMuted,
              }}
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          </Tooltip>
        );
      })}
      <div className="flex-1" />
      {trailing}
    </div>
  );
}

interface SourcePanelProps {
  tabs: TabDef[];
  activeTab: string;
  onTab: (id: string) => void;
  trailing?: ReactNode;
  width?: number;
  children: ReactNode;
}

/**
 * Full SourcePanel surface — bg-panel + tabs + content area.
 * Default width 280 (real Studio default is 400 but mocks need denser proportions).
 */
export function SourcePanel({
  tabs,
  activeTab,
  onTab,
  trailing,
  width = 280,
  children,
}: SourcePanelProps) {
  return (
    <div
      className="flex h-full flex-col border-r shrink-0"
      style={{ width, backgroundColor: STUDIO_TOKENS.bgPanel, borderColor: STUDIO_TOKENS.border }}
    >
      <SourceTabStrip tabs={tabs} activeTab={activeTab} onTab={onTab} trailing={trailing} />
      <div className="flex-1 overflow-hidden min-h-0">{children}</div>
    </div>
  );
}

interface ViewDef {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface ViewSidebarProps {
  views: ViewDef[];
  activeView: string;
  onView: (id: string) => void;
}

/**
 * Leftmost vertical activity bar — VS Code / Linear / Cursor pattern. Sits
 * before the SourcePanel so the eye reads `views → tabs → content` left to
 * right. 44px wide; size-7 rounded-md icon buttons; active button gets a
 * 2px lime left-edge bar + a subtle bg-hover background.
 */
export function ViewSidebar({ views, activeView, onView }: ViewSidebarProps) {
  return (
    <div
      className="flex flex-col items-center gap-1 py-2 border-r shrink-0"
      style={{
        width: 44,
        borderColor: STUDIO_TOKENS.border,
        backgroundColor: STUDIO_TOKENS.bgPanel,
      }}
    >
      {views.map((v) => {
        const Icon = v.icon;
        const active = v.id === activeView;
        return (
          <Tooltip key={v.id} label={v.label} side="right">
            <button
              onClick={() => onView(v.id)}
              className="relative flex size-7 items-center justify-center rounded-md transition-all"
              style={{
                backgroundColor: active ? STUDIO_TOKENS.bgHover : 'transparent',
                color: active ? STUDIO_TOKENS.textPrimary : STUDIO_TOKENS.textMuted,
              }}
            >
              {active && (
                <span
                  className="absolute -left-2 top-1/2 -translate-y-1/2 h-4 w-[2px] rounded-r-full"
                  style={{ backgroundColor: STUDIO_TOKENS.brand }}
                />
              )}
              <Icon className="h-3.5 w-3.5" />
            </button>
          </Tooltip>
        );
      })}
    </div>
  );
}

/**
 * "Studio surface" — the right-hand main area. Just a flex-1 column with bg-surface.
 */
export function StudioSurface({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-1 flex-col min-w-0 ${className}`}
      style={{ backgroundColor: STUDIO_TOKENS.bgSurface }}
    >
      {children}
    </div>
  );
}

/**
 * Paper.design logo — used in "Push to Paper" actions on variant cards.
 * Inline SVG so the marketing bundle doesn't need to pull in the full
 * PaperPushModal from the Studio internals.
 */
export function PaperIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 300 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M82.48 52.5H247.5V130.7c0 13.5-.32 28.4.04 41.8-24.93-.18-50.13.28-75-.06V247.5c-12.97-.23-26.5-.04-39.52-.04H52.54V82.52c9.98-.1 20.1-.02 30.1-.01-.3-9.9.06-20.1-.08-30Z"
        fill="currentColor"
        opacity={0.9}
      />
    </svg>
  );
}

/**
 * Hover-reveal tooltip. Use to wrap any icon-only button so users
 * discover what each action does, like Cursor's chrome.
 *
 * Sides:
 *  - `above` (default): vertically stacked, centred horizontally
 *  - `below`: same but underneath the trigger
 *  - `right`: side-by-side, useful for left-edge vertical sidebars
 *    where `above` would clip past the parent's left edge
 */
export function Tooltip({
  label,
  children,
  side = 'above',
  className = '',
}: {
  label: string;
  children: ReactNode;
  side?: 'above' | 'below' | 'right';
  className?: string;
}) {
  const positionClass =
    side === 'above'
      ? 'bottom-full left-1/2 -translate-x-1/2 mb-1.5'
      : side === 'below'
        ? 'top-full left-1/2 -translate-x-1/2 mt-1.5'
        : 'left-full top-1/2 -translate-y-1/2 ml-2';
  return (
    <div className={`relative group/tt inline-flex ${className}`}>
      {children}
      <div
        className={`absolute ${positionClass} px-2 py-1 rounded text-[10px] font-medium whitespace-nowrap opacity-0 group-hover/tt:opacity-100 transition-opacity pointer-events-none z-20`}
        style={{
          backgroundColor: STUDIO_TOKENS.bgElevated,
          color: STUDIO_TOKENS.textPrimary,
          border: `1px solid ${STUDIO_TOKENS.borderStrong}`,
          boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
        }}
        role="tooltip"
      >
        {label}
      </div>
    </div>
  );
}
