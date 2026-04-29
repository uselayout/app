'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Home, Wrench, Settings, Search, Check, ChevronRight } from 'lucide-react';
import { STUDIO_TOKENS } from './_studio-chrome';

const STRIPE_TOKENS = [
  { hex: '#635BFF', name: '--brand-primary', match: 'on-system' as const },
  { hex: '#0A2540', name: '--brand-deep', match: 'on-system' as const },
  { hex: '#0073E6', name: '--accent-blue', match: 'close' as const },
  { hex: '#00D924', name: '--success', match: 'on-system' as const },
  { hex: '#F6F9FC', name: '--bg-soft', match: 'on-system' as const },
  { hex: '#FF5996', name: '--accent-pink', match: 'off' as const },
];

const BOTTOM_TABS = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'tools', label: 'Tools', icon: Wrench },
  { id: 'settings', label: 'Settings', icon: Settings },
] as const;

type TabId = typeof BOTTOM_TABS[number]['id'];

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

      {/* Current tab indicator */}
      <div className="flex items-center gap-2 border-b px-3.5 py-2 shrink-0" style={{ borderColor: STUDIO_TOKENS.border, backgroundColor: STUDIO_TOKENS.bgPanel }}>
        <span className="font-mono text-[9.5px] uppercase tracking-wider" style={{ color: STUDIO_TOKENS.textMuted }}>
          Inspecting
        </span>
        <span className="font-mono text-[10.5px]" style={{ color: STUDIO_TOKENS.textPrimary }}>
          stripe.com
        </span>
      </div>

      {/* Body — tokens list */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col gap-3 px-3.5 py-3">
        <div className="flex items-baseline justify-between">
          <span
            className="font-mono text-[9.5px] font-semibold uppercase tracking-wider"
            style={{ color: STUDIO_TOKENS.textMuted }}
          >
            Extracted · {STRIPE_TOKENS.length} tokens
          </span>
        </div>
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
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 + i * 0.05, ease: [0, 0, 0.2, 1] }}
                viewport={{ once: true, margin: '-10%' }}
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
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.55, ease: [0, 0, 0.2, 1] }}
          viewport={{ once: true, margin: '-10%' }}
          className="flex flex-col gap-2 rounded-md border px-3 py-2.5 mt-auto"
          style={{ borderColor: STUDIO_TOKENS.border, backgroundColor: STUDIO_TOKENS.bgSurface }}
        >
          <div className="flex items-baseline justify-between">
            <span
              className="font-mono text-[9.5px] font-semibold uppercase tracking-wider"
              style={{ color: STUDIO_TOKENS.textMuted }}
            >
              Compliance
            </span>
            <span className="font-mono text-[9px]" style={{ color: STUDIO_TOKENS.textMuted }}>
              vs your kit
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className="text-[28px] font-semibold leading-none tabular-nums"
              style={{ color: STUDIO_TOKENS.statusSuccess }}
            >
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
              whileInView={{ width: '87%' }}
              transition={{ duration: 0.8, delay: 0.7, ease: [0, 0, 0.2, 1] }}
              viewport={{ once: true, margin: '-10%' }}
              className="h-full rounded-full"
              style={{ backgroundColor: STUDIO_TOKENS.statusSuccess }}
            />
          </div>
        </motion.div>

        <div className="flex items-center gap-1.5">
          <button
            className="flex-1 rounded-md px-2 py-2 text-[11px] font-medium hover:opacity-90 flex items-center justify-center gap-1"
            style={{ backgroundColor: STUDIO_TOKENS.accent, color: STUDIO_TOKENS.textOnAccent }}
          >
            <Check className="h-3 w-3" strokeWidth={3} />
            Push to Layout
          </button>
        </div>
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
                <div
                  className="absolute bottom-0 w-8 h-0.5 rounded-t-full"
                  style={{ backgroundColor: STUDIO_TOKENS.brand }}
                />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
