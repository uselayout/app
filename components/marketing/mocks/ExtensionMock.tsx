'use client';

import { motion } from 'framer-motion';

interface TokenRowProps {
  hex: string;
  name: string;
  match: 'on-system' | 'close' | 'off';
  delay: number;
}

function TokenRow({ hex, name, match, delay }: TokenRowProps) {
  const matchColour =
    match === 'on-system' ? 'text-emerald-300' : match === 'close' ? 'text-amber-300' : 'text-rose-300';
  const matchDot =
    match === 'on-system' ? 'bg-emerald-400' : match === 'close' ? 'bg-amber-300' : 'bg-rose-400';
  return (
    <motion.div
      initial={{ opacity: 0, x: 8 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay, ease: [0, 0, 0.2, 1] }}
      viewport={{ once: true, margin: '-10%' }}
      className="flex items-center gap-2.5 rounded-md bg-white/[0.02] border border-white/8 px-2.5 py-1.5"
    >
      <div
        className="h-5 w-5 rounded border border-white/15 shrink-0"
        style={{ backgroundColor: hex }}
      />
      <div className="flex flex-col min-w-0 flex-1">
        <span className="font-mono text-[10.5px] text-white/85 truncate leading-none">{name}</span>
        <span className="font-mono text-[9px] text-white/40 mt-0.5 leading-none">{hex.toUpperCase()}</span>
      </div>
      <div className={`flex items-center gap-1 ${matchColour}`}>
        <span className={`h-1 w-1 rounded-full ${matchDot}`} />
        <span className="font-mono text-[9px]">
          {match === 'on-system' ? '✓' : match === 'close' ? '~' : '✗'}
        </span>
      </div>
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

export function ExtensionMock() {
  return (
    <div
      className="absolute inset-0 flex flex-col text-white"
      style={{
        backgroundColor: '#0C0C0E',
        fontFamily: '"Geist", "Inter", -apple-system, sans-serif',
        colorScheme: 'dark',
      }}
    >
      {/* Browser chrome */}
      <div className="flex items-center gap-2 border-b border-white/10 bg-[#1F1F23] px-4 py-2.5 shrink-0">
        <div className="flex gap-1.5">
          <div className="h-3 w-3 rounded-full bg-[#FF5F57]" />
          <div className="h-3 w-3 rounded-full bg-[#FEBC2E]" />
          <div className="h-3 w-3 rounded-full bg-[#28C840]" />
        </div>
        <div className="flex items-center gap-1 ml-2">
          <button className="h-6 w-6 rounded text-white/45 hover:bg-white/10 flex items-center justify-center text-[14px]">←</button>
          <button className="h-6 w-6 rounded text-white/45 hover:bg-white/10 flex items-center justify-center text-[14px]">→</button>
          <button className="h-6 w-6 rounded text-white/45 hover:bg-white/10 flex items-center justify-center text-[12px]">↻</button>
        </div>
        <div className="flex-1 flex items-center gap-2 rounded-full bg-[#37373D] px-3 py-1 mx-2">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2.5">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span className="font-mono text-[11px] text-white/65">stripe.com</span>
          <span className="ml-auto flex items-center gap-1.5 text-[10px] font-mono text-emerald-300/85">
            <svg width="9" height="9" viewBox="0 0 24 24" fill="#E4F222">
              <path d="M2 17l10 5 10-5M2 12l10 5 10-5M12 2L2 7l10 5 10-5-10-5z" />
            </svg>
            Layout · active
          </span>
        </div>
        <button className="h-7 w-7 rounded bg-[#E4F222] flex items-center justify-center text-[11px] font-bold text-black">
          L
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 grid grid-cols-[1fr_320px] min-h-0">
        {/* Webpage preview (faux Stripe) */}
        <div className="flex flex-col bg-white text-black overflow-hidden min-h-0">
          {/* Faux nav */}
          <div className="flex items-center justify-between border-b border-black/8 px-6 py-3 shrink-0 bg-white">
            <div className="flex items-center gap-6">
              <span className="text-[14px] font-bold text-[#0A2540]">Stripe</span>
              <span className="text-[11px] text-[#425466]">Products</span>
              <span className="text-[11px] text-[#425466]">Solutions</span>
              <span className="text-[11px] text-[#425466]">Developers</span>
              <span className="text-[11px] text-[#425466]">Pricing</span>
            </div>
            <button className="rounded-full bg-[#635BFF] px-3 py-1 text-[10.5px] font-medium text-white">
              Sign in
            </button>
          </div>
          {/* Hero */}
          <div className="flex-1 grid grid-cols-[1.3fr_1fr] gap-6 px-6 py-6 overflow-hidden bg-gradient-to-br from-white via-[#F6F9FC] to-[#E0E7FF]">
            <div className="flex flex-col justify-center gap-3">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#635BFF]">Built for Scale</span>
              <h1 className="text-[28px] leading-tight font-semibold text-[#0A2540]">
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
          {/* Inspector callout pinned to hero CTA */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.6, ease: [0, 0, 0.2, 1] }}
            viewport={{ once: true, margin: '-10%' }}
            className="absolute pointer-events-none"
            style={{
              top: '54%',
              left: '15%',
            }}
          >
            <div className="rounded-md bg-[#0A2540] text-white px-2.5 py-1 text-[9.5px] font-mono shadow-lg whitespace-nowrap">
              <span className="text-[#E4F222]">●</span> button.cta · bg #635BFF · radius 9999
            </div>
          </motion.div>
        </div>

        {/* Sidebar (extension popup) */}
        <div className="flex flex-col border-l border-white/10 min-h-0 bg-[#0C0C0E]">
          <div className="flex items-center justify-between border-b border-white/10 px-3.5 py-2 shrink-0">
            <div className="flex items-center gap-1.5">
              <div className="h-4 w-4 rounded-sm bg-[#E4F222] flex items-center justify-center text-[9px] font-bold text-black">
                L
              </div>
              <span className="font-mono text-[10.5px] text-white/85">layout</span>
            </div>
            <div className="flex items-center gap-1 rounded-md bg-white/5 p-0.5 text-[9px] font-mono">
              <button className="rounded-sm px-1.5 py-0.5 bg-white/10 text-white">Tokens</button>
              <button className="rounded-sm px-1.5 py-0.5 text-white/45">Inspect</button>
              <button className="rounded-sm px-1.5 py-0.5 text-white/45">Score</button>
              <button className="rounded-sm px-1.5 py-0.5 text-white/45">Push</button>
            </div>
          </div>

          {/* Tokens */}
          <div className="flex-1 overflow-hidden px-3.5 py-3 flex flex-col gap-3 min-h-0">
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-[9.5px] uppercase tracking-wider text-white/45">
                Extracted · 7 tokens
              </span>
              <span className="font-mono text-[9px] text-white/30">stripe.com</span>
            </div>
            <div className="flex flex-col gap-1.5 overflow-hidden">
              {STRIPE_TOKENS.map((t, i) => (
                <TokenRow
                  key={t.name}
                  hex={t.hex}
                  name={t.name}
                  match={t.match}
                  delay={0.15 + i * 0.06}
                />
              ))}
            </div>

            {/* Compliance score block */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.65, ease: [0, 0, 0.2, 1] }}
              viewport={{ once: true, margin: '-10%' }}
              className="flex flex-col gap-2 rounded-md border border-white/10 bg-white/[0.025] px-3 py-2.5 mt-auto"
            >
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-[9.5px] uppercase tracking-wider text-white/45">
                  Compliance
                </span>
                <span className="font-mono text-[9px] text-white/30">vs your kit</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-[28px] font-semibold leading-none text-white tabular-nums">87</span>
                <span className="font-mono text-[10px] text-white/40">/100</span>
                <span className="ml-auto font-mono text-[9.5px] text-emerald-300/80">on-brand</span>
              </div>
              <div className="h-1 rounded-full bg-white/8 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: '87%' }}
                  transition={{ duration: 0.8, delay: 0.85, ease: [0, 0, 0.2, 1] }}
                  viewport={{ once: true, margin: '-10%' }}
                  className="h-full rounded-full bg-[#E4F222]"
                />
              </div>
            </motion.div>

            <div className="flex items-center gap-2">
              <button className="flex-1 rounded-md bg-[#E4F222] px-2 py-1.5 text-[10px] font-medium text-black">
                Push to Layout →
              </button>
              <button className="rounded-md border border-white/15 px-2 py-1.5 text-[10px] font-mono text-white/70">
                Copy MCP
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
