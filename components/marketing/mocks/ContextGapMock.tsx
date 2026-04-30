'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Sparkles, Check, Eye, Zap } from 'lucide-react';
import { STUDIO_TOKENS } from './_studio-chrome';

const PROMPT = '"A pricing card for our Pro plan with 3 features and a CTA button"';

interface AnnotationProps {
  text: string;
  variant: 'bad' | 'good';
}

function Annotation({ text, variant }: AnnotationProps) {
  const colour = variant === 'bad' ? STUDIO_TOKENS.statusError : STUDIO_TOKENS.statusSuccess;
  return (
    <div className="flex items-start gap-1.5 text-[10.5px] font-mono leading-snug">
      <span
        className="h-1.5 w-1.5 rounded-full mt-1 shrink-0"
        style={{ backgroundColor: colour }}
      />
      <span style={{ color: variant === 'bad' ? STUDIO_TOKENS.textSecondary : STUDIO_TOKENS.textPrimary }}>
        {text}
      </span>
    </div>
  );
}

export function ContextGapMock() {
  const [active, setActive] = useState<'without' | 'with'>('without');

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
      {/* Header — prompt bar */}
      <div
        className="flex items-center gap-3 border-b px-4 py-3 shrink-0"
        style={{ borderColor: STUDIO_TOKENS.border, backgroundColor: STUDIO_TOKENS.bgPanel }}
      >
        <Sparkles className="h-3.5 w-3.5" style={{ color: STUDIO_TOKENS.accent }} />
        <span className="font-mono text-[11.5px]" style={{ color: STUDIO_TOKENS.textMuted }}>
          AI agent prompt
        </span>
        <ChevronRight className="h-3 w-3" style={{ color: STUDIO_TOKENS.textMuted }} />
        <span className="font-mono text-[12px] flex-1" style={{ color: STUDIO_TOKENS.textPrimary }}>
          {PROMPT}
        </span>
        <div
          className="flex items-center gap-1 rounded-md border p-0.5 text-[10px] font-mono"
          style={{ borderColor: STUDIO_TOKENS.borderStrong }}
        >
          {(['without', 'with'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setActive(v)}
              className="rounded-sm px-2 py-0.5 transition-colors"
              style={{
                backgroundColor:
                  active === v
                    ? v === 'with'
                      ? STUDIO_TOKENS.accent
                      : 'rgba(255,69,58,0.18)'
                    : 'transparent',
                color: active === v ? (v === 'with' ? STUDIO_TOKENS.textOnAccent : STUDIO_TOKENS.statusError) : STUDIO_TOKENS.textMuted,
              }}
            >
              {v === 'without' ? 'Without Layout' : 'With Layout'}
            </button>
          ))}
        </div>
      </div>

      {/* Body: split */}
      <div className="flex-1 grid grid-cols-2 min-h-0">
        {/* WITHOUT Layout */}
        <div
          className="flex flex-col border-r min-h-0 transition-opacity"
          style={{
            borderColor: STUDIO_TOKENS.border,
            opacity: active === 'without' ? 1 : 0.92,
          }}
        >
          <div
            className="flex items-center justify-between border-b px-4 py-2 shrink-0"
            style={{ borderColor: STUDIO_TOKENS.border }}
          >
            <span
              className="text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: STUDIO_TOKENS.statusError }}
            >
              ✗ Without Layout
            </span>
            <span
              className="font-mono text-[10px]"
              style={{ color: STUDIO_TOKENS.textMuted }}
            >
              generic AI output
            </span>
          </div>
          {/* Bad pricing card */}
          <div
            className="flex-1 flex items-center justify-center p-8 min-h-0 overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #f5f5f7 0%, #e8e8ed 100%)' }}
          >
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true, margin: '-10%' }}
              className="bg-white rounded-md p-7 shadow-lg w-full max-w-[280px]"
              style={{ fontFamily: 'Arial, sans-serif' }}
            >
              <div className="text-[15px] font-bold text-[#333] mb-1">PRO PLAN</div>
              <div className="flex items-baseline gap-1 mb-3">
                <span className="text-[36px] font-bold text-[#333]">$24</span>
                <span className="text-[12px] text-[#666]">/month</span>
              </div>
              <ul className="flex flex-col gap-1.5 text-[12px] text-[#444] mb-5">
                <li>• Unlimited extractions</li>
                <li>• All MCP tools</li>
                <li>• Figma sync</li>
              </ul>
              <button
                className="w-full py-2.5 rounded text-white text-[12px] font-medium"
                style={{ backgroundColor: '#3b82f6' }}
              >
                Get Started
              </button>
            </motion.div>
          </div>
          {/* Annotations */}
          <div
            className="flex flex-col gap-2 border-t px-5 py-3 shrink-0"
            style={{ borderColor: STUDIO_TOKENS.border, backgroundColor: STUDIO_TOKENS.bgPanel }}
          >
            <Annotation variant="bad" text="Hardcoded #3b82f6 — not your brand colour" />
            <Annotation variant="bad" text="Arial fallback font — Inter not loaded" />
            <Annotation variant="bad" text="Off-grid spacing (28px, 18px) — wrong scale" />
            <Annotation variant="bad" text='Made-up "PRO PLAN" pattern — no token reference' />
          </div>
        </div>

        {/* WITH Layout */}
        <div
          className="flex flex-col min-h-0 transition-opacity"
          style={{ opacity: active === 'with' ? 1 : 0.92 }}
        >
          <div
            className="flex items-center justify-between border-b px-4 py-2 shrink-0"
            style={{ borderColor: STUDIO_TOKENS.border }}
          >
            <span
              className="text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: STUDIO_TOKENS.brand }}
            >
              ✓ With Layout
            </span>
            <span
              className="font-mono text-[10px]"
              style={{ color: STUDIO_TOKENS.textMuted }}
            >
              same prompt · uses your design system
            </span>
          </div>
          {/* On-brand pricing card — designed to look premium next to the generic version */}
          <div
            className="flex-1 flex items-center justify-center p-8 min-h-0 overflow-hidden relative"
            style={{
              background:
                'radial-gradient(circle at 50% 0%, rgba(228,242,34,0.08) 0%, transparent 50%), linear-gradient(180deg, #0E0E12 0%, #0A0A0C 100%)',
            }}
          >
            {/* Decorative dot grid */}
            <div
              className="absolute inset-0 opacity-30 pointer-events-none"
              style={{
                backgroundImage: `radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)`,
                backgroundSize: '16px 16px',
              }}
            />
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              viewport={{ once: true, margin: '-10%' }}
              className="relative rounded-2xl p-7 w-full max-w-[300px] border"
              style={{
                background:
                  'linear-gradient(180deg, rgba(34,34,40,0.95) 0%, rgba(20,20,24,0.95) 100%)',
                borderColor: 'rgba(255,255,255,0.10)',
                boxShadow:
                  '0 0 0 1px rgba(228,242,34,0.18), 0 8px 32px rgba(0,0,0,0.6), 0 0 60px rgba(228,242,34,0.08)',
              }}
            >
              {/* Top row: badge + small recommended pill */}
              <div className="flex items-center justify-between gap-2 mb-4">
                <div
                  className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-mono"
                  style={{
                    borderColor: 'rgba(228,242,34,0.3)',
                    backgroundColor: 'rgba(228,242,34,0.08)',
                    color: STUDIO_TOKENS.brand,
                  }}
                >
                  <span
                    className="h-1 w-1 rounded-full"
                    style={{ backgroundColor: STUDIO_TOKENS.brand }}
                  />
                  Pro
                </div>
                <span
                  className="inline-flex items-center gap-1 text-[9.5px] font-mono uppercase tracking-wider"
                  style={{ color: STUDIO_TOKENS.textMuted }}
                >
                  <Zap className="h-2.5 w-2.5" style={{ color: STUDIO_TOKENS.brand }} />
                  most popular
                </span>
              </div>

              {/* Headline */}
              <h4
                className="text-[20px] font-semibold leading-tight mb-1"
                style={{ color: STUDIO_TOKENS.textPrimary }}
              >
                Ship faster.
              </h4>
              <p
                className="text-[12px] leading-snug mb-5"
                style={{ color: STUDIO_TOKENS.textSecondary }}
              >
                From design system to production in minutes.
              </p>

              {/* Price block */}
              <div className="flex items-baseline gap-1 mb-1">
                <span
                  className="text-[44px] font-semibold leading-none tracking-tight"
                  style={{ color: STUDIO_TOKENS.textPrimary }}
                >
                  $24
                </span>
                <span
                  className="text-[12px]"
                  style={{ color: STUDIO_TOKENS.textMuted }}
                >
                  / month
                </span>
              </div>
              <p
                className="text-[10.5px] mb-5 font-mono"
                style={{ color: STUDIO_TOKENS.textMuted }}
              >
                billed annually · cancel anytime
              </p>

              {/* Features */}
              <div
                className="h-px w-full mb-4"
                style={{
                  background:
                    'linear-gradient(90deg, transparent, rgba(228,242,34,0.4), transparent)',
                }}
              />
              <ul
                className="flex flex-col gap-2 text-[12px] mb-6"
                style={{ color: STUDIO_TOKENS.textPrimary }}
              >
                {[
                  'Unlimited extractions',
                  'All MCP tools',
                  'Figma + extension sync',
                  'Priority support',
                ].map((f, i) => (
                  <motion.li
                    key={f}
                    initial={{ opacity: 0, x: -4 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.5 + i * 0.06 }}
                    viewport={{ once: true, margin: '-10%' }}
                    className="flex items-center gap-2"
                  >
                    <span
                      className="flex h-3.5 w-3.5 items-center justify-center rounded-full shrink-0"
                      style={{ backgroundColor: 'rgba(228,242,34,0.15)' }}
                    >
                      <Check
                        className="h-2.5 w-2.5"
                        strokeWidth={3}
                        style={{ color: STUDIO_TOKENS.brand }}
                      />
                    </span>
                    {f}
                  </motion.li>
                ))}
              </ul>

              {/* CTA — lime brand button, dark text, subtle outer glow */}
              <button
                className="w-full py-3 rounded-lg text-[13px] font-semibold transition-all hover:translate-y-[-1px]"
                style={{
                  backgroundColor: STUDIO_TOKENS.brand,
                  color: '#0C0C0E',
                  boxShadow:
                    '0 0 0 1px rgba(228,242,34,0.25), 0 4px 16px rgba(228,242,34,0.25)',
                }}
              >
                Get started →
              </button>
            </motion.div>
          </div>
          {/* Annotations */}
          <div
            className="flex flex-col gap-2 border-t px-5 py-3 shrink-0"
            style={{ borderColor: STUDIO_TOKENS.border, backgroundColor: STUDIO_TOKENS.bgPanel }}
          >
            <Annotation variant="good" text="Uses --accent (#E4F222) from your tokens" />
            <Annotation variant="good" text="Inter font + correct type scale (display 36, body 12)" />
            <Annotation variant="good" text="On-grid spacing — 4px base, all multiples" />
            <Annotation variant="good" text='Reuses your "Pricing card" component pattern' />
          </div>
        </div>
      </div>

      {/* Footer hint */}
      <div
        className="flex items-center justify-center gap-2 border-t py-2 shrink-0"
        style={{ borderColor: STUDIO_TOKENS.border, backgroundColor: STUDIO_TOKENS.bgPanel }}
      >
        <Eye className="h-3 w-3" style={{ color: STUDIO_TOKENS.textMuted }} />
        <span className="text-[11px]" style={{ color: STUDIO_TOKENS.textSecondary }}>
          Toggle the buttons above. Same prompt — Layout closes the gap between AI guess and your design system.
        </span>
      </div>
    </div>
  );
}
