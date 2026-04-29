'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileCode2,
  X,
  Sparkles,
  ShieldCheck,
  Check,
  Send,
  User,
  Cpu,
} from 'lucide-react';
import { STUDIO_TOKENS } from './_studio-chrome';

/**
 * ServeMock — the "Two commands. Every AI tool. Zero config." section.
 *
 * Story (per agent reviews): the magic isn't the install — it's that the
 * AI agent reaches for the design system BEFORE writing code. So:
 *
 *  ┌──────────────────────────────────────────────────────────┐
 *  │ slim install-confirmed strip (one line, muted)          │
 *  ├────────────────────────────┬─────────────────────────────┤
 *  │ Cursor agent chat (left)   │ SignInForm.tsx (right)     │
 *  │  user prompt               │  syntax-highlighted code   │
 *  │  MCP tool calls (the hero) │  with --token classes      │
 *  │  writing... cursor blinks  │  highlighted in lime       │
 *  ├────────────────────────────┴─────────────────────────────┤
 *  │ compliance badge: 92/100 · on-system · 0 hardcoded      │
 *  └──────────────────────────────────────────────────────────┘
 */

// ─── Code editor ────────────────────────────────────────────────────────────

interface CodeLineProps {
  number: number;
  delay: number;
  highlight?: boolean;
  children: React.ReactNode;
}

function CodeLine({ number, delay, highlight, children }: CodeLineProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.25, delay, ease: 'linear' }}
      viewport={{ once: true, margin: '-10%' }}
      className="flex items-baseline px-3 py-[1px]"
      style={{ backgroundColor: highlight ? 'rgba(228,242,34,0.07)' : 'transparent' }}
    >
      <span
        className="select-none w-7 text-right pr-3 text-[12px] tabular-nums shrink-0 font-mono"
        style={{ color: 'rgba(255,255,255,0.22)' }}
      >
        {number}
      </span>
      <div className="font-mono text-[12.5px] leading-[1.7]" style={{ color: 'rgba(232,232,240,0.85)' }}>
        {children}
      </div>
    </motion.div>
  );
}

// ─── Chat ───────────────────────────────────────────────────────────────────

interface ChatLineProps {
  delay: number;
  children: React.ReactNode;
  className?: string;
}

function ChatLine({ delay, children, className = '' }: ChatLineProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: [0, 0, 0.2, 1] }}
      viewport={{ once: true, margin: '-10%' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface MCPCallProps {
  delay: number;
  tool: string;
  args?: string;
  result: React.ReactNode;
  ok?: boolean;
}

function MCPCall({ delay, tool, args, result, ok }: MCPCallProps) {
  return (
    <ChatLine delay={delay} className="flex flex-col gap-1 pl-1.5">
      <div className="flex items-center gap-1.5 font-mono text-[11.5px]">
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
        className="font-mono text-[11px] pl-4 flex items-center gap-1"
        style={{ color: ok ? 'rgb(110,231,183)' : STUDIO_TOKENS.textMuted }}
      >
        {ok && <Check className="h-2.5 w-2.5 shrink-0" strokeWidth={3} />}
        {!ok && <span style={{ color: 'rgba(255,255,255,0.25)' }}>→</span>}
        <span>{result}</span>
      </div>
    </ChatLine>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

const AI_TOOLS = ['Claude Code', 'Cursor', 'Windsurf', 'Copilot', 'Codex', 'Gemini CLI'];

export function ServeMock() {
  const [chatPrompt, setChatPrompt] = useState('');

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
      {/* Top strip — install confirmed, muted, single line */}
      <div
        className="flex items-center justify-between border-b h-9 px-4 shrink-0"
        style={{ borderColor: STUDIO_TOKENS.border }}
      >
        <div className="flex items-center gap-2 font-mono text-[11.5px]">
          <Check className="h-3 w-3 shrink-0" style={{ color: STUDIO_TOKENS.statusSuccess }} strokeWidth={3} />
          <span style={{ color: STUDIO_TOKENS.textMuted }}>$</span>
          <span style={{ color: STUDIO_TOKENS.textPrimary }}>npx @layoutdesign/context install</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10.5px] font-mono" style={{ color: STUDIO_TOKENS.textMuted }}>
          <span>configured</span>
          {AI_TOOLS.map((t, i) => (
            <span key={t} className="flex items-center gap-1.5">
              <span style={{ color: STUDIO_TOKENS.textPrimary }}>{t}</span>
              {i < AI_TOOLS.length - 1 && <span style={{ color: STUDIO_TOKENS.border }}>·</span>}
            </span>
          ))}
          <span style={{ color: STUDIO_TOKENS.border }}>·</span>
          <span>12 MCP tools ready</span>
        </div>
      </div>

      {/* Body — agent chat (left) + code editor (right) */}
      <div className="flex-1 grid grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] min-h-0">
        {/* AGENT CHAT (LEFT) ────────────────────────────────────────────── */}
        <div
          className="flex flex-col min-h-0 overflow-hidden border-r"
          style={{ borderColor: STUDIO_TOKENS.border, backgroundColor: STUDIO_TOKENS.bgPanel }}
        >
          {/* Chat header */}
          <div
            className="flex items-center justify-between border-b px-4 py-2.5 shrink-0"
            style={{ borderColor: STUDIO_TOKENS.border }}
          >
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" style={{ color: STUDIO_TOKENS.brand }} />
              <span className="text-[12px] font-medium" style={{ color: STUDIO_TOKENS.textPrimary }}>
                Cursor agent
              </span>
              <span className="text-[10.5px] font-mono" style={{ color: STUDIO_TOKENS.textMuted }}>
                · acme-app
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

          {/* Chat thread */}
          <div className="flex-1 overflow-hidden px-4 py-4 flex flex-col gap-4 min-h-0">
            {/* User prompt */}
            <ChatLine delay={0.1}>
              <div className="flex items-start gap-2">
                <div
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: STUDIO_TOKENS.bgElevated }}
                >
                  <User className="h-3 w-3" style={{ color: STUDIO_TOKENS.textSecondary }} />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10.5px] font-medium" style={{ color: STUDIO_TOKENS.textMuted }}>
                    You
                  </span>
                  <p className="text-[13px] leading-snug" style={{ color: STUDIO_TOKENS.textPrimary }}>
                    Build me a sign-in form using our design system.
                  </p>
                </div>
              </div>
            </ChatLine>

            {/* Agent response */}
            <ChatLine delay={0.25}>
              <div className="flex items-start gap-2">
                <div
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: 'rgba(228,242,34,0.12)' }}
                >
                  <Cpu className="h-3 w-3" style={{ color: STUDIO_TOKENS.brand }} />
                </div>
                <div className="flex flex-col gap-2 flex-1 min-w-0">
                  <span className="text-[10.5px] font-medium" style={{ color: STUDIO_TOKENS.textMuted }}>
                    Cursor · with Layout MCP
                  </span>
                  <p className="text-[12.5px] leading-snug" style={{ color: STUDIO_TOKENS.textPrimary }}>
                    Reading your design system before I write any code…
                  </p>
                </div>
              </div>
            </ChatLine>

            {/* MCP tool calls — the hero of this section */}
            <div className="pl-8 flex flex-col gap-2.5">
              <MCPCall
                delay={0.45}
                tool="get_design_system"
                result="17 tokens · 12 components · 2 modes (light + dark)"
              />
              <MCPCall
                delay={0.7}
                tool="get_component"
                args="Button"
                result="variants: primary · secondary · ghost"
              />
              <MCPCall
                delay={0.95}
                tool="check_compliance"
                ok
                result="92/100 · on-system"
              />
            </div>

            {/* Writing... */}
            <ChatLine delay={1.2} className="pl-8">
              <div className="flex items-center gap-2 text-[12.5px]" style={{ color: STUDIO_TOKENS.textPrimary }}>
                <FileCode2 className="h-3 w-3" style={{ color: STUDIO_TOKENS.textMuted }} />
                <span>Writing</span>
                <code
                  className="font-mono text-[11.5px] px-1 py-0.5 rounded"
                  style={{
                    backgroundColor: STUDIO_TOKENS.bgElevated,
                    color: STUDIO_TOKENS.textPrimary,
                  }}
                >
                  SignInForm.tsx
                </code>
                <motion.span
                  initial={{ opacity: 0.4 }}
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                  className="inline-block w-[6px] h-[14px] align-text-bottom"
                  style={{ backgroundColor: STUDIO_TOKENS.textPrimary }}
                />
              </div>
            </ChatLine>
          </div>

          {/* Chat input (mock) */}
          <div className="border-t px-3 py-2.5 shrink-0" style={{ borderColor: STUDIO_TOKENS.border }}>
            <div
              className="flex items-center gap-2 rounded-md border px-3 py-2"
              style={{
                borderColor: STUDIO_TOKENS.border,
                backgroundColor: STUDIO_TOKENS.bgSurface,
              }}
            >
              <input
                value={chatPrompt}
                onChange={(e) => setChatPrompt(e.target.value)}
                placeholder="Ask Cursor anything…"
                className="flex-1 bg-transparent text-[12px] outline-none"
                style={{ color: STUDIO_TOKENS.textPrimary }}
              />
              <button
                className="flex h-5 w-5 items-center justify-center rounded-full transition-colors hover:opacity-90"
                style={{
                  backgroundColor: STUDIO_TOKENS.textPrimary,
                  color: STUDIO_TOKENS.bgApp,
                }}
              >
                <Send className="h-2.5 w-2.5" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>

        {/* CODE EDITOR (RIGHT) ──────────────────────────────────────────── */}
        <div className="flex flex-col min-h-0 overflow-hidden">
          {/* Single file tab */}
          <div
            className="flex items-end border-b shrink-0"
            style={{ borderColor: STUDIO_TOKENS.border, backgroundColor: STUDIO_TOKENS.bgPanel }}
          >
            <div
              className="flex items-center gap-2 px-3.5 py-2 text-[11.5px] font-mono border-r border-t-2 -mb-px"
              style={{
                backgroundColor: STUDIO_TOKENS.bgSurface,
                color: STUDIO_TOKENS.textPrimary,
                borderRightColor: STUDIO_TOKENS.border,
                borderTopColor: STUDIO_TOKENS.brand,
              }}
            >
              <FileCode2 className="h-3 w-3" style={{ color: STUDIO_TOKENS.textMuted }} />
              SignInForm.tsx
              <X className="h-2.5 w-2.5 ml-1 opacity-40" />
            </div>
            <div
              className="ml-auto flex items-center gap-1.5 pr-4 text-[10.5px] font-mono"
              style={{ color: STUDIO_TOKENS.textMuted }}
            >
              <span>TypeScript React</span>
              <span style={{ color: STUDIO_TOKENS.border }}>·</span>
              <span>UTF-8</span>
            </div>
          </div>

          {/* Code area */}
          <div
            className="flex-1 overflow-hidden py-3 min-h-0"
            style={{ backgroundColor: STUDIO_TOKENS.bgSurface }}
          >
            <CodeLine number={1} delay={1.4}>
              <span style={{ color: '#A78BFA' }}>import</span>
              <span> {'{ Button }'} </span>
              <span style={{ color: '#A78BFA' }}>from</span>
              <span style={{ color: '#34D399' }}> {"'@/ui/button'"}</span>
            </CodeLine>
            <CodeLine number={2} delay={1.46}>
              <span> </span>
            </CodeLine>
            <CodeLine number={3} delay={1.52}>
              <span style={{ color: '#A78BFA' }}>export function</span>
              <span style={{ color: '#FBD38D' }}> SignInForm</span>
              <span>{'() {'}</span>
            </CodeLine>
            <CodeLine number={4} delay={1.58}>
              <span>  </span>
              <span style={{ color: '#A78BFA' }}>return</span>
              <span> (</span>
            </CodeLine>
            <CodeLine number={5} delay={1.64}>
              <span>    {'<'}</span>
              <span style={{ color: '#F687B3' }}>form</span>
              <span> </span>
              <span style={{ color: '#FBD38D' }}>className</span>
              <span>=</span>
              <span style={{ color: '#34D399' }}>{'"flex flex-col gap-3"'}</span>
              <span>{'>'}</span>
            </CodeLine>
            <CodeLine number={6} delay={1.7}>
              <span>      {'<'}</span>
              <span style={{ color: '#F687B3' }}>input</span>
            </CodeLine>
            <CodeLine number={7} delay={1.76} highlight>
              <span>        </span>
              <span style={{ color: '#FBD38D' }}>className</span>
              <span>=</span>
              <span style={{ color: '#34D399' }}>{'"rounded-md bg-[--bg-surface] px-3 py-2"'}</span>
            </CodeLine>
            <CodeLine number={8} delay={1.82}>
              <span>        </span>
              <span style={{ color: '#FBD38D' }}>placeholder</span>
              <span>=</span>
              <span style={{ color: '#34D399' }}>{'"Email"'}</span>
              <span> {'/>'}</span>
            </CodeLine>
            <CodeLine number={9} delay={1.88}>
              <span>      {'<'}</span>
              <span style={{ color: '#FBD38D' }}>Button</span>
            </CodeLine>
            <CodeLine number={10} delay={1.94} highlight>
              <span>        </span>
              <span style={{ color: '#FBD38D' }}>className</span>
              <span>=</span>
              <span style={{ color: '#34D399' }}>{'"bg-[--accent] text-[--text-on-accent] rounded-md"'}</span>
            </CodeLine>
            <CodeLine number={11} delay={2}>
              <span>      {'>'}</span>
            </CodeLine>
            <CodeLine number={12} delay={2.06}>
              <span>        Sign in</span>
            </CodeLine>
            <CodeLine number={13} delay={2.12}>
              <span>      {'</'}</span>
              <span style={{ color: '#FBD38D' }}>Button</span>
              <span>{'>'}</span>
            </CodeLine>
            <CodeLine number={14} delay={2.18}>
              <span>    {'</'}</span>
              <span style={{ color: '#F687B3' }}>form</span>
              <span>{'>'}</span>
            </CodeLine>
            <CodeLine number={15} delay={2.24}>
              <span>  )</span>
            </CodeLine>
            <CodeLine number={16} delay={2.3}>
              <span>{'}'}</span>
            </CodeLine>
          </div>
        </div>
      </div>

      {/* Bottom strip — compliance verdict, full width */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 2.4 }}
        viewport={{ once: true, margin: '-10%' }}
        className="flex items-center justify-between border-t h-11 px-4 shrink-0"
        style={{
          borderColor: STUDIO_TOKENS.border,
          backgroundColor: STUDIO_TOKENS.bgPanel,
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-6 w-6 items-center justify-center rounded-md"
            style={{ backgroundColor: 'rgba(52,199,89,0.12)' }}
          >
            <ShieldCheck className="h-3.5 w-3.5" style={{ color: STUDIO_TOKENS.statusSuccess }} />
          </div>
          <div className="flex items-baseline gap-2.5">
            <span
              className="text-[14px] font-semibold tabular-nums"
              style={{ color: STUDIO_TOKENS.textPrimary }}
            >
              92/100
            </span>
            <span className="text-[11px]" style={{ color: STUDIO_TOKENS.textSecondary }}>
              on-system
            </span>
            <span style={{ color: STUDIO_TOKENS.border }}>·</span>
            <span className="text-[11px]" style={{ color: STUDIO_TOKENS.textSecondary }}>
              0 hardcoded values
            </span>
            <span style={{ color: STUDIO_TOKENS.border }}>·</span>
            <span className="text-[11px]" style={{ color: STUDIO_TOKENS.textSecondary }}>
              2 token references
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10.5px] font-mono" style={{ color: STUDIO_TOKENS.textMuted }}>
          <span className="flex items-center gap-1.5">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: STUDIO_TOKENS.statusSuccess }}
            />
            ready to ship
          </span>
        </div>
      </motion.div>
    </div>
  );
}
