'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Lock,
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Home,
  Wrench,
  Settings,
  Palette,
  Camera,
  Search,
  ShieldCheck,
  Figma as FigmaIcon,
  ChevronRight,
  ChevronLeft,
  Check,
} from 'lucide-react';
import { STUDIO_TOKENS } from './_studio-chrome';

const TOOLS = [
  { id: 'extract', label: 'Extract', desc: 'Tokens, fonts, CSS variables', icon: Palette },
  { id: 'capture', label: 'Capture', desc: 'Screenshot to Layout Explorer', icon: Camera },
  { id: 'inspect', label: 'Inspect', desc: 'Pick any element to inspect styles', icon: Search },
  { id: 'comply', label: 'Comply', desc: 'Check page against your design system', icon: ShieldCheck },
  { id: 'figma', label: 'Figma', desc: 'Push the current page to Figma', icon: FigmaIcon },
] as const;

const BOTTOM_TABS = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'tools', label: 'Tools', icon: Wrench },
  { id: 'settings', label: 'Settings', icon: Settings },
] as const;

type BottomTabId = typeof BOTTOM_TABS[number]['id'];
type ToolId = typeof TOOLS[number]['id'] | null;

interface TokenRowProps {
  hex: string;
  name: string;
  match: 'on-system' | 'close' | 'off';
  delay: number;
  selected?: boolean;
  onClick: () => void;
}

function TokenRow({ hex, name, match, delay, selected, onClick }: TokenRowProps) {
  const matchColour =
    match === 'on-system' ? STUDIO_TOKENS.statusSuccess : match === 'close' ? STUDIO_TOKENS.statusWarning : STUDIO_TOKENS.statusError;
  return (
    <motion.div
      initial={{ opacity: 0, x: 8 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay, ease: [0, 0, 0.2, 1] }}
      viewport={{ once: true, margin: '-10%' }}
      onClick={onClick}
      className="flex items-center gap-2 rounded px-2 py-1.5 cursor-pointer transition-colors hover:bg-white/5"
      style={{
        backgroundColor: selected ? STUDIO_TOKENS.bgHover : 'transparent',
      }}
    >
      <div
        className="h-4 w-4 shrink-0 rounded-full border"
        style={{ backgroundColor: hex, borderColor: STUDIO_TOKENS.border }}
      />
      <span className="font-mono text-[11px] truncate flex-1" style={{ color: STUDIO_TOKENS.textPrimary }}>
        {name}
      </span>
      <span className="font-mono text-[9.5px]" style={{ color: STUDIO_TOKENS.textMuted }}>
        {hex.toUpperCase()}
      </span>
      <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: matchColour }} />
    </motion.div>
  );
}

const STRIPE_TOKENS = [
  { hex: '#635BFF', name: '--brand-primary', match: 'on-system' as const },
  { hex: '#0A2540', name: '--brand-deep', match: 'on-system' as const },
  { hex: '#0073E6', name: '--accent-blue', match: 'close' as const },
  { hex: '#00D924', name: '--success', match: 'on-system' as const },
  { hex: '#F6F9FC', name: '--bg-soft', match: 'on-system' as const },
  { hex: '#425466', name: '--text-secondary', match: 'close' as const },
  { hex: '#FF5996', name: '--accent-pink', match: 'off' as const },
];

function HomePage() {
  return (
    <div className="flex flex-col gap-3 p-4">
      <div
        className="rounded-lg border p-3 flex flex-col gap-2"
        style={{ borderColor: STUDIO_TOKENS.border, backgroundColor: STUDIO_TOKENS.bgSurface }}
      >
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-[10px] uppercase tracking-wider" style={{ color: STUDIO_TOKENS.textMuted }}>
            Active project
          </span>
          <span className="text-[9.5px] font-mono" style={{ color: STUDIO_TOKENS.statusSuccess }}>
            ● connected
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: STUDIO_TOKENS.accent, color: STUDIO_TOKENS.textOnAccent }}>
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
      <div
        className="rounded-lg border p-3"
        style={{ borderColor: STUDIO_TOKENS.border, backgroundColor: STUDIO_TOKENS.bgSurface }}
      >
        <div className="font-mono text-[10px] uppercase tracking-wider mb-1.5" style={{ color: STUDIO_TOKENS.textMuted }}>
          Current tab
        </div>
        <div className="flex items-center gap-1.5">
          <Lock className="h-2.5 w-2.5" style={{ color: STUDIO_TOKENS.textMuted }} />
          <span className="text-[11px] font-mono truncate" style={{ color: STUDIO_TOKENS.textPrimary }}>
            stripe.com
          </span>
        </div>
      </div>
    </div>
  );
}

function ToolsGrid({ onSelect }: { onSelect: (id: ToolId) => void }) {
  return (
    <div className="flex flex-col gap-3 p-4">
      <h2 className="text-[12px] font-semibold" style={{ color: STUDIO_TOKENS.textPrimary }}>
        Tools
      </h2>
      <div className="flex flex-col gap-1.5">
        {TOOLS.map((tool, i) => {
          const Icon = tool.icon;
          return (
            <motion.button
              key={tool.id}
              initial={{ opacity: 0, y: 4 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 + i * 0.05, ease: [0, 0, 0.2, 1] }}
              viewport={{ once: true, margin: '-10%' }}
              onClick={() => onSelect(tool.id)}
              className="flex items-center gap-2.5 rounded-lg border p-2.5 text-left transition-all hover:scale-[1.01]"
              style={{
                backgroundColor: STUDIO_TOKENS.bgSurface,
                borderColor: STUDIO_TOKENS.border,
              }}
            >
              <div
                className="w-7 h-7 rounded-md border flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: STUDIO_TOKENS.accentSubtle,
                  borderColor: STUDIO_TOKENS.border,
                }}
              >
                <Icon className="h-3.5 w-3.5" style={{ color: STUDIO_TOKENS.brand }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-medium" style={{ color: STUDIO_TOKENS.textPrimary }}>
                  {tool.label}
                </div>
                <div className="text-[10px] mt-0.5" style={{ color: STUDIO_TOKENS.textMuted }}>
                  {tool.desc}
                </div>
              </div>
              <ChevronRight className="h-3 w-3 shrink-0" style={{ color: STUDIO_TOKENS.textMuted }} />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function InspectPage({
  selected,
  setSelected,
  onBack,
}: {
  selected: string | null;
  setSelected: (n: string | null) => void;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Breadcrumb header */}
      <div
        className="flex items-center gap-1.5 px-4 pt-3 pb-2 border-b shrink-0"
        style={{ borderColor: STUDIO_TOKENS.border }}
      >
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-[11px] hover:opacity-80 transition-opacity"
          style={{ color: STUDIO_TOKENS.textMuted }}
        >
          <ChevronLeft className="h-3 w-3" />
          Tools
        </button>
        <span className="text-[11px]" style={{ color: STUDIO_TOKENS.textMuted }}>
          /
        </span>
        <span className="text-[11px] font-medium" style={{ color: STUDIO_TOKENS.textPrimary }}>
          Inspect
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col gap-3 p-4 min-h-0">
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-[9.5px] font-semibold uppercase tracking-wider" style={{ color: STUDIO_TOKENS.textMuted }}>
            Extracted · {STRIPE_TOKENS.length} tokens
          </span>
          <span className="font-mono text-[9px]" style={{ color: STUDIO_TOKENS.textMuted }}>
            stripe.com
          </span>
        </div>
        <div className="flex flex-col gap-1 overflow-hidden">
          {STRIPE_TOKENS.map((t, i) => (
            <TokenRow
              key={t.name}
              hex={t.hex}
              name={t.name}
              match={t.match}
              delay={0.15 + i * 0.04}
              selected={selected === t.name}
              onClick={() => setSelected(t.name)}
            />
          ))}
        </div>

        {/* Compliance card */}
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.55, ease: [0, 0, 0.2, 1] }}
          viewport={{ once: true, margin: '-10%' }}
          className="flex flex-col gap-2 rounded-md border px-3 py-2.5 mt-auto"
          style={{
            borderColor: STUDIO_TOKENS.border,
            backgroundColor: STUDIO_TOKENS.bgSurface,
          }}
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
            <span className="text-[28px] font-semibold leading-none tabular-nums" style={{ color: STUDIO_TOKENS.statusSuccess }}>
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
            className="flex-1 rounded-md px-2 py-1.5 text-[10.5px] font-medium hover:opacity-90 flex items-center justify-center gap-1"
            style={{ backgroundColor: STUDIO_TOKENS.accent, color: STUDIO_TOKENS.textOnAccent }}
          >
            <Check className="h-2.5 w-2.5" strokeWidth={3} />
            Push to Layout
          </button>
          <button
            className="rounded-md border px-2 py-1.5 text-[10.5px] font-mono hover:bg-white/5"
            style={{ borderColor: STUDIO_TOKENS.borderStrong, color: STUDIO_TOKENS.textSecondary }}
          >
            Copy MCP
          </button>
        </div>
      </div>
    </div>
  );
}

export function ExtensionMock() {
  const [bottomTab, setBottomTab] = useState<BottomTabId>('tools');
  const [activeTool, setActiveTool] = useState<ToolId>('inspect');
  const [selected, setSelected] = useState<string | null>('--brand-primary');

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
      {/* Browser chrome */}
      <div
        className="flex items-center gap-2 border-b px-4 py-2 shrink-0"
        style={{ backgroundColor: '#1F1F23', borderColor: STUDIO_TOKENS.border }}
      >
        <div className="flex items-center gap-1">
          {[ArrowLeft, ArrowRight, RotateCw].map((Icon, i) => (
            <button
              key={i}
              className="h-6 w-6 rounded transition-colors hover:bg-white/8 flex items-center justify-center"
              style={{ color: STUDIO_TOKENS.textMuted }}
            >
              <Icon className="h-3 w-3" />
            </button>
          ))}
        </div>
        <div className="flex-1 flex items-center gap-2 rounded-full px-3 py-1 mx-2" style={{ backgroundColor: '#37373D' }}>
          <Lock className="h-3 w-3" style={{ color: STUDIO_TOKENS.textMuted }} />
          <span className="font-mono text-[11px]" style={{ color: STUDIO_TOKENS.textPrimary }}>
            stripe.com
          </span>
          <span className="ml-auto flex items-center gap-1.5 text-[10px] font-mono" style={{ color: STUDIO_TOKENS.statusSuccess }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: STUDIO_TOKENS.statusSuccess }} />
            Layout active
          </span>
        </div>
        <button
          className="h-7 w-7 rounded flex items-center justify-center text-[11px] font-bold"
          style={{ backgroundColor: STUDIO_TOKENS.accent, color: STUDIO_TOKENS.textOnAccent }}
        >
          L
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 grid grid-cols-[1fr_320px] min-h-0">
        {/* Faux Stripe webpage */}
        <div className="flex flex-col bg-white text-[#0A2540] overflow-hidden min-h-0 relative">
          <div className="flex items-center justify-between border-b border-black/8 px-6 py-3 shrink-0 bg-white">
            <div className="flex items-center gap-6">
              <span className="text-[14px] font-bold text-[#0A2540]">Stripe</span>
              {['Products', 'Solutions', 'Developers', 'Pricing'].map((n) => (
                <span key={n} className="text-[11px] text-[#425466]">{n}</span>
              ))}
            </div>
            <button className="rounded-full bg-[#635BFF] px-3 py-1 text-[10.5px] font-medium text-white">
              Sign in
            </button>
          </div>
          <div className="flex-1 grid grid-cols-[1.3fr_1fr] gap-6 px-6 py-6 overflow-hidden bg-gradient-to-br from-white via-[#F6F9FC] to-[#E0E7FF]">
            <div className="flex flex-col justify-center gap-3">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#635BFF]">Built for Scale</span>
              <h1 className="text-[28px] leading-tight font-semibold">
                Financial<br />infrastructure<br />for the internet
              </h1>
              <p className="text-[12px] text-[#425466] leading-snug max-w-[80%]">
                Millions of businesses use Stripe to accept payments, send payouts, and manage their businesses online.
              </p>
              <div className="flex items-center gap-2 mt-1">
                <button className="rounded-full bg-[#635BFF] px-3 py-1.5 text-[11px] font-medium text-white">
                  Start now →
                </button>
                <button className="rounded-full border border-[#0A2540]/15 bg-white px-3 py-1.5 text-[11px] font-medium text-[#0A2540]">
                  Contact sales
                </button>
              </div>
            </div>
            <div
              className="rounded-xl shadow-lg relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #635BFF 0%, #0073E6 50%, #FF5996 100%)' }}
            >
              <div className="absolute inset-0 flex items-end p-3">
                <div className="rounded-md bg-white/15 backdrop-blur px-2.5 py-1 text-[9px] font-mono text-white">
                  payment.success
                </div>
              </div>
            </div>
          </div>
          {/* Element-picker selection ring + tooltip */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.5 }}
            viewport={{ once: true, margin: '-10%' }}
            className="absolute pointer-events-none"
            style={{ top: '57%', left: '15%' }}
          >
            <div
              className="rounded-md px-2.5 py-1.5 text-[10px] font-mono shadow-lg whitespace-nowrap"
              style={{ backgroundColor: '#0A2540', color: 'white' }}
            >
              <span style={{ color: STUDIO_TOKENS.brand }}>●</span> button.cta · bg #635BFF · radius 9999
            </div>
          </motion.div>
        </div>

        {/* Sidebar — REAL Layout extension structure (3 bottom tabs + tools page) */}
        <div
          className="flex flex-col border-l min-h-0"
          style={{ backgroundColor: STUDIO_TOKENS.bgApp, borderColor: STUDIO_TOKENS.border }}
        >
          {/* Page content (scrollable) */}
          <div className="flex-1 overflow-hidden min-h-0">
            {bottomTab === 'home' && <HomePage />}
            {bottomTab === 'tools' && (
              activeTool ? (
                <InspectPage
                  selected={selected}
                  setSelected={setSelected}
                  onBack={() => setActiveTool(null)}
                />
              ) : (
                <ToolsGrid onSelect={setActiveTool} />
              )
            )}
            {bottomTab === 'settings' && (
              <div className="flex flex-col gap-3 p-4">
                <h2 className="text-[12px] font-semibold" style={{ color: STUDIO_TOKENS.textPrimary }}>
                  Settings
                </h2>
                <div
                  className="rounded-lg border p-3 flex flex-col gap-2"
                  style={{ borderColor: STUDIO_TOKENS.border, backgroundColor: STUDIO_TOKENS.bgSurface }}
                >
                  <span className="font-mono text-[10px] uppercase tracking-wider" style={{ color: STUDIO_TOKENS.textMuted }}>
                    API key
                  </span>
                  <span className="font-mono text-[11px]" style={{ color: STUDIO_TOKENS.textPrimary }}>
                    layout_••••••••••32f8
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Bottom tab bar (real structure: Home / Tools / Settings) */}
          <nav
            className="flex items-stretch border-t shrink-0"
            style={{ backgroundColor: STUDIO_TOKENS.bgPanel, borderColor: STUDIO_TOKENS.border }}
          >
            {BOTTOM_TABS.map((tab) => {
              const Icon = tab.icon;
              const active = bottomTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setBottomTab(tab.id);
                    if (tab.id !== 'tools') setActiveTool(null);
                  }}
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
      </div>
    </div>
  );
}
