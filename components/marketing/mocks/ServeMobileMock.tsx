'use client';

import { motion } from 'framer-motion';
import { Sparkles, User, Cpu, Check, ShieldCheck, FileCode2 } from 'lucide-react';
import { STUDIO_TOKENS } from './_studio-chrome';

function MCPCall({
  delay,
  tool,
  args,
  result,
  ok,
}: {
  delay: number;
  tool: string;
  args?: string;
  result: React.ReactNode;
  ok?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: [0, 0, 0.2, 1] }}
      viewport={{ once: true, margin: '-10%' }}
      className="flex flex-col gap-1 pl-1"
    >
      <div className="flex items-center gap-1.5 font-mono text-[11px]">
        <span style={{ color: STUDIO_TOKENS.brand }}>◆</span>
        <span style={{ color: STUDIO_TOKENS.textPrimary }}>
          {tool}
          {args && (
            <>
              <span style={{ color: STUDIO_TOKENS.textMuted }}>(</span>
              <span style={{ color: STUDIO_TOKENS.textSecondary }}>{args}</span>
              <span style={{ color: STUDIO_TOKENS.textMuted }}>)</span>
            </>
          )}
        </span>
      </div>
      <div
        className="font-mono text-[10.5px] pl-3.5 flex items-center gap-1"
        style={{ color: ok ? 'rgb(110,231,183)' : STUDIO_TOKENS.textMuted }}
      >
        {ok && <Check className="h-2.5 w-2.5 shrink-0" strokeWidth={3} />}
        {!ok && <span style={{ color: 'rgba(255,255,255,0.25)' }}>→</span>}
        <span>{result}</span>
      </div>
    </motion.div>
  );
}

export function ServeMobileMock() {
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
      {/* Top strip — install confirmed, one line */}
      <div
        className="flex items-center gap-1.5 border-b px-3.5 py-2 shrink-0"
        style={{ borderColor: STUDIO_TOKENS.border }}
      >
        <Check className="h-3 w-3 shrink-0" style={{ color: STUDIO_TOKENS.statusSuccess }} strokeWidth={3} />
        <span className="font-mono text-[10.5px] truncate" style={{ color: STUDIO_TOKENS.textPrimary }}>
          npx @layoutdesign/context install
        </span>
        <span className="font-mono text-[10px] shrink-0" style={{ color: STUDIO_TOKENS.textMuted }}>
          · 6 tools
        </span>
      </div>

      {/* Chat header */}
      <div
        className="flex items-center justify-between border-b px-4 py-2 shrink-0"
        style={{ borderColor: STUDIO_TOKENS.border, backgroundColor: STUDIO_TOKENS.bgPanel }}
      >
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3 w-3" style={{ color: STUDIO_TOKENS.brand }} />
          <span className="text-[11.5px] font-medium" style={{ color: STUDIO_TOKENS.textPrimary }}>
            Cursor agent
          </span>
        </div>
        <span
          className="font-mono text-[10px] px-1.5 py-0.5 rounded"
          style={{
            backgroundColor: 'rgba(228,242,34,0.08)',
            color: STUDIO_TOKENS.brand,
            border: `1px solid rgba(228,242,34,0.25)`,
          }}
        >
          ◆ Layout MCP
        </span>
      </div>

      {/* Chat body */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col gap-3 px-4 py-4">
        {/* User */}
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          viewport={{ once: true, margin: '-10%' }}
          className="flex items-start gap-2"
        >
          <div
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: STUDIO_TOKENS.bgElevated }}
          >
            <User className="h-3 w-3" style={{ color: STUDIO_TOKENS.textSecondary }} />
          </div>
          <p className="text-[12.5px] leading-snug" style={{ color: STUDIO_TOKENS.textPrimary }}>
            Build me a sign-in form using our design system.
          </p>
        </motion.div>

        {/* Agent */}
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.18 }}
          viewport={{ once: true, margin: '-10%' }}
          className="flex items-start gap-2"
        >
          <div
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: 'rgba(228,242,34,0.12)' }}
          >
            <Cpu className="h-3 w-3" style={{ color: STUDIO_TOKENS.brand }} />
          </div>
          <p className="text-[12px] leading-snug" style={{ color: STUDIO_TOKENS.textPrimary }}>
            Reading your design system before I write any code…
          </p>
        </motion.div>

        {/* MCP tool calls */}
        <div className="pl-8 flex flex-col gap-2.5">
          <MCPCall
            delay={0.32}
            tool="get_design_system"
            result="17 tokens · 12 components"
          />
          <MCPCall
            delay={0.5}
            tool="get_component"
            args="Button"
            result="primary · secondary · ghost"
          />
          <MCPCall delay={0.68} tool="check_compliance" ok result="92/100 · on-system" />
        </div>

        {/* Writing */}
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.86 }}
          viewport={{ once: true, margin: '-10%' }}
          className="pl-8 flex items-center gap-2 text-[12px]"
          style={{ color: STUDIO_TOKENS.textPrimary }}
        >
          <FileCode2 className="h-3 w-3" style={{ color: STUDIO_TOKENS.textMuted }} />
          <span>Writing</span>
          <code
            className="font-mono text-[10.5px] px-1 py-0.5 rounded"
            style={{ backgroundColor: STUDIO_TOKENS.bgElevated, color: STUDIO_TOKENS.textPrimary }}
          >
            SignInForm.tsx
          </code>
          <motion.span
            initial={{ opacity: 0.4 }}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
            className="inline-block w-[5px] h-[12px] align-text-bottom"
            style={{ backgroundColor: STUDIO_TOKENS.textPrimary }}
          />
        </motion.div>
      </div>

      {/* Compliance footer */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 1 }}
        viewport={{ once: true, margin: '-10%' }}
        className="flex items-center gap-2.5 border-t px-4 py-3 shrink-0"
        style={{ borderColor: STUDIO_TOKENS.border, backgroundColor: STUDIO_TOKENS.bgPanel }}
      >
        <div
          className="flex h-6 w-6 items-center justify-center rounded-md shrink-0"
          style={{ backgroundColor: 'rgba(52,199,89,0.12)' }}
        >
          <ShieldCheck className="h-3.5 w-3.5" style={{ color: STUDIO_TOKENS.statusSuccess }} />
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-[13px] font-semibold tabular-nums" style={{ color: STUDIO_TOKENS.textPrimary }}>
            92/100 · on-system
          </span>
          <span className="text-[10px]" style={{ color: STUDIO_TOKENS.textMuted }}>
            0 hardcoded values · ready to ship
          </span>
        </div>
      </motion.div>
    </div>
  );
}
