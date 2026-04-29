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

import type { ReactNode } from 'react';
import { PanelLeft, RefreshCw, Share2, Figma as FigmaIcon, Globe } from 'lucide-react';

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
              className="flex items-center justify-center h-7 px-[13px] rounded-[4px] text-[12px] font-medium transition-colors"
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
    </div>
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
          <Tooltip key={v.id} label={v.label}>
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
 * Tooltip appears ABOVE the trigger by default. `side="below"` puts it
 * beneath instead (use when the trigger is near the top of an
 * overflow-hidden container).
 */
export function Tooltip({
  label,
  children,
  side = 'above',
  className = '',
}: {
  label: string;
  children: ReactNode;
  side?: 'above' | 'below';
  className?: string;
}) {
  const positionClass =
    side === 'above'
      ? 'bottom-full mb-1.5'
      : 'top-full mt-1.5';
  return (
    <div className={`relative group/tt inline-flex ${className}`}>
      {children}
      <div
        className={`absolute left-1/2 -translate-x-1/2 ${positionClass} px-2 py-1 rounded text-[10px] font-medium whitespace-nowrap opacity-0 group-hover/tt:opacity-100 transition-opacity pointer-events-none z-20`}
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
