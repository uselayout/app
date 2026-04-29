'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, ArrowLeft, ArrowRight, RotateCw } from 'lucide-react';
import { STUDIO_TOKENS } from './_studio-chrome';

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
      transition={{ duration: 0.35, delay, ease: [0, 0, 0.2, 1] }}
      viewport={{ once: true, margin: '-10%' }}
      onClick={onClick}
      className="flex items-center gap-2 rounded px-2 py-1.5 cursor-pointer transition-colors"
      style={{
        backgroundColor: selected ? STUDIO_TOKENS.bgHover : 'transparent',
      }}
    >
      <div
        className="h-4 w-4 shrink-0 rounded-full border"
        style={{ backgroundColor: hex, borderColor: STUDIO_TOKENS.border }}
      />
      <div className="flex flex-col min-w-0 flex-1">
        <span className="font-mono text-[11px] truncate" style={{ color: STUDIO_TOKENS.textPrimary }}>
          {name}
        </span>
      </div>
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

const SIDEBAR_TABS = ['Tokens', 'Inspect', 'Score', 'Push'] as const;

export function ExtensionMock() {
  const [activeTab, setActiveTab] = useState<typeof SIDEBAR_TABS[number]>('Tokens');
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
          <button className="h-6 w-6 rounded transition-colors hover:bg-white/8 flex items-center justify-center" style={{ color: STUDIO_TOKENS.textMuted }}>
            <ArrowLeft className="h-3.5 w-3.5" />
          </button>
          <button className="h-6 w-6 rounded transition-colors hover:bg-white/8 flex items-center justify-center" style={{ color: STUDIO_TOKENS.textMuted }}>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
          <button className="h-6 w-6 rounded transition-colors hover:bg-white/8 flex items-center justify-center" style={{ color: STUDIO_TOKENS.textMuted }}>
            <RotateCw className="h-3 w-3" />
          </button>
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
          title="Layout extension"
        >
          L
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 grid grid-cols-[1fr_320px] min-h-0">
        {/* Faux Stripe webpage */}
        <div className="flex flex-col bg-white text-[#0A2540] overflow-hidden min-h-0 relative">
          {/* Nav */}
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
          {/* Hero */}
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
          {/* Inspector tooltip */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.6, ease: [0, 0, 0.2, 1] }}
            viewport={{ once: true, margin: '-10%' }}
            className="absolute pointer-events-none"
            style={{ top: '52%', left: '14%' }}
          >
            <div className="rounded-md px-2.5 py-1.5 text-[10px] font-mono shadow-lg whitespace-nowrap" style={{ backgroundColor: '#0A2540', color: 'white' }}>
              <span style={{ color: '#E4F222' }}>●</span> button.cta · bg #635BFF · radius 9999
            </div>
          </motion.div>
        </div>

        {/* Sidebar (extension popup) */}
        <div
          className="flex flex-col border-l min-h-0"
          style={{ backgroundColor: STUDIO_TOKENS.bgPanel, borderColor: STUDIO_TOKENS.border }}
        >
          {/* Sidebar header */}
          <div
            className="flex items-center justify-between border-b px-3.5 py-2 shrink-0"
            style={{ borderColor: STUDIO_TOKENS.border }}
          >
            <div className="flex items-center gap-1.5">
              <div
                className="h-4 w-4 rounded-sm flex items-center justify-center text-[9px] font-bold"
                style={{ backgroundColor: STUDIO_TOKENS.accent, color: STUDIO_TOKENS.textOnAccent }}
              >
                L
              </div>
              <span className="font-mono text-[11px]" style={{ color: STUDIO_TOKENS.textPrimary }}>
                Layout · acme
              </span>
            </div>
          </div>

          {/* Sidebar tabs */}
          <div
            className="flex items-center border-b px-2 py-1.5 shrink-0 gap-1"
            style={{ borderColor: STUDIO_TOKENS.border }}
          >
            {SIDEBAR_TABS.map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className="rounded-md px-2 py-1 text-[11px] font-medium transition-colors"
                style={{
                  backgroundColor: activeTab === t ? STUDIO_TOKENS.border : 'transparent',
                  color: activeTab === t ? STUDIO_TOKENS.textPrimary : STUDIO_TOKENS.textMuted,
                }}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Tokens list */}
          <div className="flex-1 overflow-hidden px-3.5 py-3 flex flex-col gap-3 min-h-0">
            <div className="flex items-baseline justify-between">
              <span
                className="font-mono text-[9.5px] font-semibold uppercase tracking-wider"
                style={{ color: STUDIO_TOKENS.textMuted }}
              >
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
                  delay={0.15 + i * 0.06}
                  selected={selected === t.name}
                  onClick={() => setSelected(t.name)}
                />
              ))}
            </div>

            {/* Compliance card */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.65, ease: [0, 0, 0.2, 1] }}
              viewport={{ once: true, margin: '-10%' }}
              className="flex flex-col gap-2 rounded-md border px-3 py-2.5 mt-auto"
              style={{
                borderColor: STUDIO_TOKENS.border,
                backgroundColor: STUDIO_TOKENS.bgSurface,
              }}
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
              <div
                className="h-1 rounded-full overflow-hidden"
                style={{ backgroundColor: STUDIO_TOKENS.bgElevated }}
              >
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: '87%' }}
                  transition={{ duration: 0.8, delay: 0.85, ease: [0, 0, 0.2, 1] }}
                  viewport={{ once: true, margin: '-10%' }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: STUDIO_TOKENS.statusSuccess }}
                />
              </div>
            </motion.div>

            <div className="flex items-center gap-2">
              <button
                className="flex-1 rounded-md px-2 py-1.5 text-[10.5px] font-medium transition-colors hover:opacity-90"
                style={{ backgroundColor: STUDIO_TOKENS.accent, color: STUDIO_TOKENS.textOnAccent }}
              >
                Push to Layout →
              </button>
              <button
                className="rounded-md border px-2 py-1.5 text-[10.5px] font-mono transition-colors hover:bg-white/5"
                style={{ borderColor: STUDIO_TOKENS.borderStrong, color: STUDIO_TOKENS.textSecondary }}
              >
                Copy MCP
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
