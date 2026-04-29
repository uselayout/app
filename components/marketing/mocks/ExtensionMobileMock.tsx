'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Home,
  Wrench,
  Settings as SettingsIcon,
  Lock,
  Check,
  ChevronRight,
  KeyRound,
  Plug,
  ExternalLink,
  Palette,
  Camera,
  Search,
  ShieldCheck,
  Figma as FigmaIcon,
} from 'lucide-react';
import { STUDIO_TOKENS } from './_studio-chrome';

const STRIPE_TOKENS = [
  { hex: '#635BFF', name: '--brand-primary', match: 'on-system' as const },
  { hex: '#0A2540', name: '--brand-deep', match: 'on-system' as const },
  { hex: '#0073E6', name: '--accent-blue', match: 'close' as const },
  { hex: '#00D924', name: '--success', match: 'on-system' as const },
  { hex: '#F6F9FC', name: '--bg-soft', match: 'on-system' as const },
  { hex: '#FF5996', name: '--accent-pink', match: 'off' as const },
];

const TOOLS = [
  { id: 'extract', label: 'Extract', desc: 'Tokens, fonts, CSS variables', icon: Palette },
  { id: 'capture', label: 'Capture', desc: 'Screenshot to Layout Explorer', icon: Camera },
  { id: 'inspect', label: 'Inspect', desc: 'Pick any element', icon: Search, active: true },
  { id: 'comply', label: 'Comply', desc: 'Check page against your kit', icon: ShieldCheck },
  { id: 'figma', label: 'Figma', desc: 'Push the page to Figma', icon: FigmaIcon },
] as const;

const BOTTOM_TABS = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'tools', label: 'Tools', icon: Wrench },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
] as const;

type TabId = typeof BOTTOM_TABS[number]['id'];

// ─── Home tab ───────────────────────────────────────────────────────────────

function HomeTab() {
  return (
    <motion.div
      key="home"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0, 0, 0.2, 1] }}
      className="flex flex-col gap-3 p-3.5"
    >
      {/* Active project card */}
      <div
        className="rounded-lg border p-3 flex flex-col gap-2"
        style={{ borderColor: STUDIO_TOKENS.border, backgroundColor: STUDIO_TOKENS.bgSurface }}
      >
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-[9.5px] uppercase tracking-wider" style={{ color: STUDIO_TOKENS.textMuted }}>
            Active project
          </span>
          <span className="text-[9.5px] font-mono" style={{ color: STUDIO_TOKENS.statusSuccess }}>
            ● connected
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="h-7 w-7 rounded-md flex items-center justify-center text-[12px] font-bold"
            style={{ backgroundColor: STUDIO_TOKENS.accent, color: STUDIO_TOKENS.textOnAccent }}
          >
            A
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-[12px] font-medium truncate" style={{ color: STUDIO_TOKENS.textPrimary }}>
              Acme · design-system
            </span>
            <span className="text-[10px] font-mono truncate" style={{ color: STUDIO_TOKENS.textMuted }}>
              17 tokens · 12 components
            </span>
          </div>
          <ChevronRight className="h-3 w-3 shrink-0" style={{ color: STUDIO_TOKENS.textMuted }} />
        </div>
      </div>

      {/* Current tab card */}
      <div
        className="rounded-lg border p-3"
        style={{ borderColor: STUDIO_TOKENS.border, backgroundColor: STUDIO_TOKENS.bgSurface }}
      >
        <div className="font-mono text-[9.5px] uppercase tracking-wider mb-1.5" style={{ color: STUDIO_TOKENS.textMuted }}>
          Current tab
        </div>
        <div className="flex items-center gap-1.5">
          <Lock className="h-2.5 w-2.5" style={{ color: STUDIO_TOKENS.textMuted }} />
          <span className="text-[11.5px] font-mono truncate" style={{ color: STUDIO_TOKENS.textPrimary }}>
            stripe.com
          </span>
        </div>
      </div>

      {/* Quick action */}
      <button
        className="rounded-lg px-3 py-2.5 text-[12px] font-medium flex items-center justify-center gap-1.5 hover:opacity-90"
        style={{ backgroundColor: STUDIO_TOKENS.accent, color: STUDIO_TOKENS.textOnAccent }}
      >
        <Search className="h-3.5 w-3.5" />
        Pick an element
      </button>

      {/* Recent activity */}
      <div className="flex flex-col gap-1.5 mt-2">
        <span className="font-mono text-[9.5px] font-semibold uppercase tracking-wider px-1" style={{ color: STUDIO_TOKENS.textMuted }}>
          Recent
        </span>
        {[
          { label: 'Tokens pushed', meta: 'stripe.com · 7 tokens · 2m ago', dot: STUDIO_TOKENS.statusSuccess },
          { label: 'Compliance checked', meta: 'stripe.com · 87/100 · 5m ago', dot: STUDIO_TOKENS.brand },
          { label: 'Element inspected', meta: 'button.cta · 8m ago', dot: STUDIO_TOKENS.textMuted },
        ].map((r) => (
          <div
            key={r.label}
            className="flex items-center gap-2 rounded-md border px-2.5 py-1.5"
            style={{ borderColor: STUDIO_TOKENS.border, backgroundColor: STUDIO_TOKENS.bgSurface }}
          >
            <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: r.dot }} />
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-[11px]" style={{ color: STUDIO_TOKENS.textPrimary }}>{r.label}</span>
              <span className="text-[9.5px] font-mono truncate" style={{ color: STUDIO_TOKENS.textMuted }}>
                {r.meta}
              </span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Tools tab ──────────────────────────────────────────────────────────────

function ToolsTab() {
  return (
    <motion.div
      key="tools"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0, 0, 0.2, 1] }}
      className="flex flex-col h-full"
    >
      {/* Inspecting indicator */}
      <div
        className="flex items-center gap-2 border-b px-3.5 py-2 shrink-0"
        style={{ borderColor: STUDIO_TOKENS.border, backgroundColor: STUDIO_TOKENS.bgPanel }}
      >
        <span className="font-mono text-[9.5px] uppercase tracking-wider" style={{ color: STUDIO_TOKENS.textMuted }}>
          Inspecting
        </span>
        <span className="font-mono text-[10.5px]" style={{ color: STUDIO_TOKENS.textPrimary }}>
          stripe.com
        </span>
      </div>

      {/* Tools list (compact) */}
      <div className="flex flex-col gap-1 px-3 py-2.5 border-b shrink-0" style={{ borderColor: STUDIO_TOKENS.border }}>
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          const active = 'active' in tool && tool.active;
          return (
            <button
              key={tool.id}
              className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-white/5"
              style={{
                backgroundColor: active ? STUDIO_TOKENS.bgHover : 'transparent',
              }}
            >
              <div
                className="w-6 h-6 rounded border flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: STUDIO_TOKENS.accentSubtle,
                  borderColor: STUDIO_TOKENS.border,
                }}
              >
                <Icon className="h-3 w-3" style={{ color: STUDIO_TOKENS.brand }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11.5px] font-medium" style={{ color: STUDIO_TOKENS.textPrimary }}>
                  {tool.label}
                </div>
                <div className="text-[9.5px] truncate" style={{ color: STUDIO_TOKENS.textMuted }}>
                  {tool.desc}
                </div>
              </div>
              {active && (
                <span className="text-[9.5px] font-mono" style={{ color: STUDIO_TOKENS.statusSuccess }}>
                  ● active
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Inspect content */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col gap-3 px-3.5 py-3">
        <span
          className="font-mono text-[9.5px] font-semibold uppercase tracking-wider"
          style={{ color: STUDIO_TOKENS.textMuted }}
        >
          Extracted · {STRIPE_TOKENS.length} tokens
        </span>
        <div className="flex flex-col gap-1 overflow-hidden">
          {STRIPE_TOKENS.map((t, i) => {
            const matchColour =
              t.match === 'on-system'
                ? STUDIO_TOKENS.statusSuccess
                : t.match === 'close'
                ? STUDIO_TOKENS.statusWarning
                : STUDIO_TOKENS.statusError;
            return (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: 0.1 + i * 0.04 }}
                className="flex items-center gap-2 rounded px-2 py-1.5"
              >
                <div
                  className="h-4 w-4 shrink-0 rounded-full border"
                  style={{ backgroundColor: t.hex, borderColor: STUDIO_TOKENS.border }}
                />
                <span className="font-mono text-[11px] truncate flex-1" style={{ color: STUDIO_TOKENS.textPrimary }}>
                  {t.name}
                </span>
                <span className="font-mono text-[9px]" style={{ color: STUDIO_TOKENS.textMuted }}>
                  {t.hex.toUpperCase()}
                </span>
                <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: matchColour }} />
              </motion.div>
            );
          })}
        </div>

        {/* Compliance card */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="flex flex-col gap-2 rounded-md border px-3 py-2.5 mt-auto"
          style={{ borderColor: STUDIO_TOKENS.border, backgroundColor: STUDIO_TOKENS.bgSurface }}
        >
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-[9.5px] font-semibold uppercase tracking-wider" style={{ color: STUDIO_TOKENS.textMuted }}>
              Compliance
            </span>
            <span className="font-mono text-[9px]" style={{ color: STUDIO_TOKENS.textMuted }}>
              vs your kit
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[26px] font-semibold leading-none tabular-nums" style={{ color: STUDIO_TOKENS.statusSuccess }}>
              87
            </span>
            <span className="font-mono text-[10px]" style={{ color: STUDIO_TOKENS.textMuted }}>
              / 100
            </span>
            <span className="ml-auto font-mono text-[9.5px]" style={{ color: STUDIO_TOKENS.statusSuccess }}>
              on-brand
            </span>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: STUDIO_TOKENS.bgElevated }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '87%' }}
              transition={{ duration: 0.7, delay: 0.5, ease: [0, 0, 0.2, 1] }}
              className="h-full rounded-full"
              style={{ backgroundColor: STUDIO_TOKENS.statusSuccess }}
            />
          </div>
        </motion.div>

        <button
          className="rounded-md px-2 py-2 text-[11px] font-medium hover:opacity-90 flex items-center justify-center gap-1"
          style={{ backgroundColor: STUDIO_TOKENS.accent, color: STUDIO_TOKENS.textOnAccent }}
        >
          <Check className="h-3 w-3" strokeWidth={3} />
          Push to Layout
        </button>
      </div>
    </motion.div>
  );
}

// ─── Settings tab ───────────────────────────────────────────────────────────

function SettingsTab() {
  return (
    <motion.div
      key="settings"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0, 0, 0.2, 1] }}
      className="flex flex-col gap-3 p-3.5"
    >
      {/* Connection */}
      <div
        className="rounded-lg border p-3 flex flex-col gap-3"
        style={{ borderColor: STUDIO_TOKENS.border, backgroundColor: STUDIO_TOKENS.bgSurface }}
      >
        <div className="flex items-center justify-between">
          <span className="font-mono text-[9.5px] uppercase tracking-wider" style={{ color: STUDIO_TOKENS.textMuted }}>
            Connection
          </span>
          <span className="text-[9.5px] font-mono" style={{ color: STUDIO_TOKENS.statusSuccess }}>
            ● connected
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Plug className="h-3.5 w-3.5" style={{ color: STUDIO_TOKENS.textMuted }} />
          <span className="text-[12px]" style={{ color: STUDIO_TOKENS.textPrimary }}>
            layout.design
          </span>
        </div>
      </div>

      {/* API key */}
      <div
        className="rounded-lg border p-3 flex flex-col gap-2"
        style={{ borderColor: STUDIO_TOKENS.border, backgroundColor: STUDIO_TOKENS.bgSurface }}
      >
        <div className="flex items-center justify-between">
          <span className="font-mono text-[9.5px] uppercase tracking-wider" style={{ color: STUDIO_TOKENS.textMuted }}>
            API key
          </span>
          <button className="text-[10px] font-medium" style={{ color: STUDIO_TOKENS.brand }}>
            Rotate
          </button>
        </div>
        <div className="flex items-center gap-2">
          <KeyRound className="h-3 w-3 shrink-0" style={{ color: STUDIO_TOKENS.textMuted }} />
          <span className="font-mono text-[11px] truncate" style={{ color: STUDIO_TOKENS.textPrimary }}>
            layout_••••••••••32f8
          </span>
        </div>
      </div>

      {/* Active project */}
      <div
        className="rounded-lg border p-3 flex flex-col gap-2"
        style={{ borderColor: STUDIO_TOKENS.border, backgroundColor: STUDIO_TOKENS.bgSurface }}
      >
        <span className="font-mono text-[9.5px] uppercase tracking-wider" style={{ color: STUDIO_TOKENS.textMuted }}>
          Active project
        </span>
        <div className="flex items-center gap-2">
          <div
            className="h-6 w-6 rounded-md flex items-center justify-center text-[10px] font-bold"
            style={{ backgroundColor: STUDIO_TOKENS.accent, color: STUDIO_TOKENS.textOnAccent }}
          >
            A
          </div>
          <span className="text-[12px] font-medium flex-1 truncate" style={{ color: STUDIO_TOKENS.textPrimary }}>
            Acme · design-system
          </span>
          <ChevronRight className="h-3 w-3 shrink-0" style={{ color: STUDIO_TOKENS.textMuted }} />
        </div>
      </div>

      {/* Open Studio */}
      <button
        className="rounded-lg border px-3 py-2.5 text-[11.5px] flex items-center justify-center gap-1.5 hover:bg-white/5"
        style={{ borderColor: STUDIO_TOKENS.borderStrong, color: STUDIO_TOKENS.textPrimary }}
      >
        <ExternalLink className="h-3 w-3" />
        Open Layout Studio
      </button>

      {/* Version */}
      <div className="flex items-center justify-between text-[10px] font-mono mt-1 px-1" style={{ color: STUDIO_TOKENS.textMuted }}>
        <span>v0.4.2</span>
        <span>extension · chrome</span>
      </div>
    </motion.div>
  );
}

// ─── Main ───────────────────────────────────────────────────────────────────

export function ExtensionMobileMock() {
  const [activeTab, setActiveTab] = useState<TabId>('tools');

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
      {/* Sidebar header */}
      <div
        className="flex items-center justify-between border-b px-3.5 py-2.5 shrink-0"
        style={{ borderColor: STUDIO_TOKENS.border }}
      >
        <div className="flex items-center gap-1.5">
          <div
            className="h-5 w-5 rounded-sm flex items-center justify-center text-[10px] font-bold"
            style={{ backgroundColor: STUDIO_TOKENS.accent, color: STUDIO_TOKENS.textOnAccent }}
          >
            L
          </div>
          <span className="font-mono text-[11.5px]" style={{ color: STUDIO_TOKENS.textPrimary }}>
            Layout · acme
          </span>
        </div>
        <span className="font-mono text-[10px]" style={{ color: STUDIO_TOKENS.statusSuccess }}>
          ● live
        </span>
      </div>

      {/* Page content (scrollable area) */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab === 'home' && <HomeTab />}
        {activeTab === 'tools' && <ToolsTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </div>

      {/* Bottom tab bar — Home / Tools / Settings */}
      <nav
        className="flex items-stretch border-t shrink-0"
        style={{ backgroundColor: STUDIO_TOKENS.bgPanel, borderColor: STUDIO_TOKENS.border }}
      >
        {BOTTOM_TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-colors"
              style={{ color: active ? STUDIO_TOKENS.brand : STUDIO_TOKENS.textMuted }}
            >
              <Icon className="h-4 w-4" strokeWidth={active ? 2 : 1.5} />
              <span className="text-[10px] leading-none font-medium">{tab.label}</span>
              {active && (
                <motion.div
                  layoutId="ext-mobile-tab-indicator"
                  className="absolute bottom-0 w-8 h-0.5 rounded-t-full"
                  style={{ backgroundColor: STUDIO_TOKENS.brand }}
                  transition={{ duration: 0.25, ease: [0, 0, 0.2, 1] }}
                />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
