'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Zap, Sparkles, ChevronRight } from 'lucide-react';
import { STUDIO_TOKENS } from './_studio-chrome';

const PROMPT = '"A pricing card for our Pro plan"';

export function ContextGapMobileMock() {
  const [active, setActive] = useState<'without' | 'with'>('with');

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
      {/* Header — prompt */}
      <div
        className="flex flex-col gap-1.5 border-b px-4 py-3 shrink-0"
        style={{ borderColor: STUDIO_TOKENS.border }}
      >
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3 w-3" style={{ color: STUDIO_TOKENS.brand }} />
          <span className="font-mono text-[10.5px]" style={{ color: STUDIO_TOKENS.textMuted }}>
            AI agent prompt
          </span>
        </div>
        <span className="font-mono text-[12px]" style={{ color: STUDIO_TOKENS.textPrimary }}>
          {PROMPT}
        </span>
      </div>

      {/* Toggle */}
      <div className="flex items-center justify-center gap-1 px-4 py-2.5 shrink-0 border-b" style={{ borderColor: STUDIO_TOKENS.border }}>
        <div
          className="flex items-center gap-1 rounded-md border p-0.5"
          style={{ borderColor: STUDIO_TOKENS.borderStrong }}
        >
          {(['without', 'with'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setActive(v)}
              className="rounded-sm px-2.5 py-1 text-[11px] font-medium transition-colors"
              style={{
                backgroundColor:
                  active === v
                    ? v === 'with'
                      ? STUDIO_TOKENS.brand
                      : 'rgba(255,69,58,0.18)'
                    : 'transparent',
                color: active === v
                  ? v === 'with'
                    ? STUDIO_TOKENS.textOnAccent
                    : STUDIO_TOKENS.statusError
                  : STUDIO_TOKENS.textMuted,
              }}
            >
              {v === 'without' ? '✗ Without' : '✓ With Layout'}
            </button>
          ))}
        </div>
      </div>

      {/* Card preview */}
      <div className="flex-1 min-h-0 flex items-center justify-center p-5">
        {active === 'without' ? (
          <motion.div
            key="without"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0, 0, 0.2, 1] }}
            className="bg-white rounded-md p-6 shadow-lg w-full max-w-[260px]"
            style={{ fontFamily: 'Arial, sans-serif' }}
          >
            <div className="text-[14px] font-bold text-[#333] mb-1">PRO PLAN</div>
            <div className="flex items-baseline gap-1 mb-3">
              <span className="text-[32px] font-bold text-[#333]">$24</span>
              <span className="text-[12px] text-[#666]">/month</span>
            </div>
            <ul className="flex flex-col gap-1.5 text-[12px] text-[#444] mb-4">
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
        ) : (
          <motion.div
            key="with"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0, 0, 0.2, 1] }}
            className="rounded-2xl p-6 w-full max-w-[260px] border relative"
            style={{
              background:
                'linear-gradient(180deg, rgba(34,34,40,0.95) 0%, rgba(20,20,24,0.95) 100%)',
              borderColor: 'rgba(255,255,255,0.10)',
              boxShadow:
                '0 0 0 1px rgba(228,242,34,0.18), 0 8px 32px rgba(0,0,0,0.6), 0 0 60px rgba(228,242,34,0.08)',
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-mono"
                style={{
                  borderColor: 'rgba(228,242,34,0.3)',
                  backgroundColor: 'rgba(228,242,34,0.08)',
                  color: STUDIO_TOKENS.brand,
                }}
              >
                <span className="h-1 w-1 rounded-full" style={{ backgroundColor: STUDIO_TOKENS.brand }} />
                Pro
              </div>
              <span className="inline-flex items-center gap-1 text-[9px] font-mono" style={{ color: STUDIO_TOKENS.textMuted }}>
                <Zap className="h-2.5 w-2.5" style={{ color: STUDIO_TOKENS.brand }} />
                most popular
              </span>
            </div>
            <h4 className="text-[18px] font-semibold leading-tight mb-1" style={{ color: STUDIO_TOKENS.textPrimary }}>
              Ship faster.
            </h4>
            <p className="text-[11px] leading-snug mb-3" style={{ color: STUDIO_TOKENS.textSecondary }}>
              From design system to production in minutes.
            </p>
            <div className="flex items-baseline gap-1 mb-3">
              <span
                className="text-[36px] font-semibold leading-none tracking-tight"
                style={{ color: STUDIO_TOKENS.textPrimary }}
              >
                $24
              </span>
              <span className="text-[11px]" style={{ color: STUDIO_TOKENS.textMuted }}>/ month</span>
            </div>
            <div
              className="h-px w-full mb-3"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(228,242,34,0.4), transparent)',
              }}
            />
            <ul className="flex flex-col gap-1.5 text-[11px] mb-4" style={{ color: STUDIO_TOKENS.textPrimary }}>
              {['Unlimited extractions', 'All MCP tools', 'Figma + extension sync'].map((f) => (
                <li key={f} className="flex items-center gap-1.5">
                  <span
                    className="flex h-3 w-3 items-center justify-center rounded-full shrink-0"
                    style={{ backgroundColor: 'rgba(228,242,34,0.15)' }}
                  >
                    <Check className="h-2 w-2" strokeWidth={3} style={{ color: STUDIO_TOKENS.brand }} />
                  </span>
                  {f}
                </li>
              ))}
            </ul>
            <button
              className="w-full py-2.5 rounded-lg text-[12px] font-semibold"
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
        )}
      </div>

      {/* Footer hint */}
      <div
        className="flex items-center justify-center gap-1.5 border-t py-2.5 px-3 shrink-0"
        style={{ borderColor: STUDIO_TOKENS.border, backgroundColor: STUDIO_TOKENS.bgPanel }}
      >
        <span className="text-[10.5px] text-center" style={{ color: STUDIO_TOKENS.textSecondary }}>
          Same prompt — Layout closes the gap between AI guess and your design system.
        </span>
      </div>
    </div>
  );
}
