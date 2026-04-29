'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileCode2, Terminal as TerminalIcon, X, Folder, ChevronRight } from 'lucide-react';
import { STUDIO_TOKENS } from './_studio-chrome';

interface CodeLineProps {
  children: React.ReactNode;
  delay: number;
  highlight?: boolean;
  number: number;
}

function CodeLine({ children, delay, highlight, number }: CodeLineProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.25, delay, ease: 'linear' }}
      viewport={{ once: true, margin: '-10%' }}
      className="flex items-baseline px-3"
      style={{ backgroundColor: highlight ? 'rgba(228,242,34,0.06)' : 'transparent' }}
    >
      <span
        className="select-none w-7 text-right pr-3 text-[11px] tabular-nums shrink-0 font-mono"
        style={{ color: 'rgba(255,255,255,0.25)' }}
      >
        {number}
      </span>
      <div className="font-mono text-[12px] leading-[1.7]" style={{ color: 'rgba(232,232,240,0.85)' }}>
        {children}
      </div>
    </motion.div>
  );
}

interface TerminalLineProps {
  children: React.ReactNode;
  delay: number;
  type?: 'cmd' | 'info' | 'ok' | 'mcp' | 'data';
}

function TerminalLine({ children, delay, type = 'info' }: TerminalLineProps) {
  const colour =
    type === 'cmd'
      ? STUDIO_TOKENS.textPrimary
      : type === 'ok'
      ? 'rgb(134,239,172)'
      : type === 'mcp'
      ? '#E4F222'
      : type === 'data'
      ? STUDIO_TOKENS.textSecondary
      : STUDIO_TOKENS.textSecondary;
  return (
    <motion.div
      initial={{ opacity: 0, x: -4 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay, ease: [0, 0, 0.2, 1] }}
      viewport={{ once: true, margin: '-10%' }}
      className="font-mono text-[11.5px] leading-[1.6] whitespace-pre"
      style={{ color: colour }}
    >
      {children}
    </motion.div>
  );
}

const FILES = ['SignInForm.tsx', 'tokens.css', 'tailwind.config.ts'];

export function ServeMock() {
  const [activeFile, setActiveFile] = useState('SignInForm.tsx');

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
      {/* IDE-style top bar — file path breadcrumb (not Studio TopBar; this is the user's editor) */}
      <div
        className="flex h-9 items-center justify-between border-b px-4 shrink-0"
        style={{ borderColor: STUDIO_TOKENS.border }}
      >
        <div className="flex items-center gap-1.5 text-[11px] font-mono" style={{ color: STUDIO_TOKENS.textMuted }}>
          <Folder className="h-3 w-3" />
          <span>acme-app</span>
          <ChevronRight className="h-2.5 w-2.5" />
          <span>src</span>
          <ChevronRight className="h-2.5 w-2.5" />
          <span>components</span>
          <ChevronRight className="h-2.5 w-2.5" />
          <span style={{ color: STUDIO_TOKENS.textPrimary }}>{activeFile}</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono" style={{ color: STUDIO_TOKENS.textMuted }}>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: STUDIO_TOKENS.statusSuccess }} />
            Layout MCP · 12 tools
          </span>
        </div>
      </div>

      {/* Body: editor (top) + terminal (bottom) */}
      <div className="flex-1 grid grid-rows-[1fr_280px] min-h-0">
        {/* Editor */}
        <div className="flex flex-col min-h-0 overflow-hidden">
          {/* File tabs */}
          <div
            className="flex items-end border-b shrink-0"
            style={{ borderColor: STUDIO_TOKENS.border, backgroundColor: STUDIO_TOKENS.bgPanel }}
          >
            {FILES.map((f) => {
              const active = f === activeFile;
              return (
                <button
                  key={f}
                  onClick={() => setActiveFile(f)}
                  className="flex items-center gap-2 px-3 py-2 text-[11.5px] font-mono border-r border-t-2 transition-colors"
                  style={{
                    backgroundColor: active ? STUDIO_TOKENS.bgSurface : 'transparent',
                    color: active ? STUDIO_TOKENS.textPrimary : STUDIO_TOKENS.textMuted,
                    borderRightColor: STUDIO_TOKENS.border,
                    borderTopColor: active ? '#E4F222' : 'transparent',
                  }}
                >
                  <FileCode2 className="h-3 w-3" />
                  {f}
                  {active && <X className="h-2.5 w-2.5 ml-1 opacity-50" />}
                </button>
              );
            })}
          </div>
          {/* Code area */}
          <div
            className="flex-1 overflow-hidden py-2 min-h-0"
            style={{ backgroundColor: STUDIO_TOKENS.bgSurface }}
          >
            <CodeLine delay={0.1} number={1}>
              <span style={{ color: '#A78BFA' }}>import</span>
              <span> {'{ Button }'} </span>
              <span style={{ color: '#A78BFA' }}>from</span>
              <span style={{ color: '#34D399' }}> {"'@/ui/button'"}</span>
            </CodeLine>
            <CodeLine delay={0.16} number={2}>
              <span> </span>
            </CodeLine>
            <CodeLine delay={0.22} number={3}>
              <span style={{ color: '#A78BFA' }}>export function</span>
              <span style={{ color: '#FBD38D' }}> SignInForm</span>
              <span>{'() {'}</span>
            </CodeLine>
            <CodeLine delay={0.28} number={4}>
              <span>  </span>
              <span style={{ color: '#A78BFA' }}>return</span>
              <span> (</span>
            </CodeLine>
            <CodeLine delay={0.34} number={5}>
              <span>    {'<'}</span>
              <span style={{ color: '#F687B3' }}>form</span>
              <span> </span>
              <span style={{ color: '#FBD38D' }}>className</span>
              <span>=</span>
              <span style={{ color: '#34D399' }}>{'"flex flex-col gap-3"'}</span>
              <span>{'>'}</span>
            </CodeLine>
            <CodeLine delay={0.4} number={6}>
              <span>      {'<'}</span>
              <span style={{ color: '#F687B3' }}>input</span>
              <span> </span>
              <span style={{ color: '#FBD38D' }}>className</span>
              <span>=</span>
              <span style={{ color: '#34D399' }}>{'"rounded-md bg-[--bg-surface] px-3 py-2"'}</span>
              <span> {'/>'}</span>
            </CodeLine>
            <CodeLine delay={0.48} number={7} highlight>
              <span>      {'<'}</span>
              <span style={{ color: '#FBD38D' }}>Button</span>
              <span> </span>
              <span style={{ color: '#FBD38D' }}>className</span>
              <span>=</span>
              <span style={{ color: '#34D399' }}>{'"bg-[--accent] text-[--text-on-accent] rounded-md"'}</span>
              <span>{'>'}</span>
            </CodeLine>
            <CodeLine delay={0.55} number={8}>
              <span>        Sign in</span>
            </CodeLine>
            <CodeLine delay={0.62} number={9}>
              <span>      {'</'}</span>
              <span style={{ color: '#FBD38D' }}>Button</span>
              <span>{'>'}</span>
            </CodeLine>
            <CodeLine delay={0.68} number={10}>
              <span>    {'</'}</span>
              <span style={{ color: '#F687B3' }}>form</span>
              <span>{'>'}</span>
            </CodeLine>
            <CodeLine delay={0.74} number={11}>
              <span>  )</span>
            </CodeLine>
            <CodeLine delay={0.8} number={12}>
              <span>{'}'}</span>
            </CodeLine>
            {/* Inline MCP callout */}
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 1.0, ease: [0, 0, 0.2, 1] }}
              viewport={{ once: true, margin: '-10%' }}
              className="mx-3 mt-3 rounded-md border px-3 py-2 text-[11px] font-mono inline-flex flex-col gap-0.5"
              style={{
                borderColor: 'rgba(228,242,34,0.3)',
                backgroundColor: 'rgba(228,242,34,0.05)',
                width: 'fit-content',
              }}
            >
              <div className="flex items-center gap-1.5" style={{ color: 'rgba(228,242,34,0.85)' }}>
                <span>◆</span>
                <span>Layout MCP · resolved</span>
              </div>
              <div style={{ color: STUDIO_TOKENS.textSecondary }}>
                <span style={{ color: STUDIO_TOKENS.textPrimary }}>--accent</span>
                {' → '}
                <span style={{ color: '#E4F222' }}>#E4F222</span>
                {' · on-system ✓'}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Terminal (bottom) */}
        <div
          className="flex flex-col min-h-0 overflow-hidden border-t"
          style={{
            borderColor: STUDIO_TOKENS.border,
            backgroundColor: STUDIO_TOKENS.bgPanel,
          }}
        >
          {/* Terminal header */}
          <div
            className="flex h-7 items-center justify-between border-b px-3 shrink-0"
            style={{ borderColor: STUDIO_TOKENS.border }}
          >
            <div className="flex items-center gap-1.5 text-[11px] font-mono" style={{ color: STUDIO_TOKENS.textPrimary }}>
              <TerminalIcon className="h-3 w-3" />
              <span>zsh — acme-app</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono" style={{ color: STUDIO_TOKENS.textMuted }}>
              <span style={{ color: 'rgb(110,231,183)' }}>● preview :4321</span>
            </div>
          </div>
          {/* Terminal lines */}
          <div className="flex-1 overflow-hidden px-4 py-2 space-y-[1px] min-h-0">
            <TerminalLine delay={0.15} type="cmd">
              <span style={{ color: STUDIO_TOKENS.textMuted }}>$ </span>npx @layoutdesign/context install
            </TerminalLine>
            <TerminalLine delay={0.22} type="info">→ Found .layout/ in /acme-app</TerminalLine>
            <TerminalLine delay={0.3} type="ok">✓ Configured Claude Code · Cursor · Windsurf · Copilot · Codex · Gemini CLI</TerminalLine>
            <TerminalLine delay={0.4} type="ok">✓ Started preview server :4321</TerminalLine>
            <TerminalLine delay={0.5} type="info"> </TerminalLine>
            <TerminalLine delay={0.58} type="cmd">
              <span style={{ color: STUDIO_TOKENS.textMuted }}>$ </span>cursor agent
            </TerminalLine>
            <TerminalLine delay={0.66} type="info">› Building SignInForm.tsx</TerminalLine>
            <TerminalLine delay={0.74} type="mcp">  ◆ MCP → get_design_system</TerminalLine>
            <TerminalLine delay={0.8} type="data">    17 tokens · 12 components · 2 modes</TerminalLine>
            <TerminalLine delay={0.88} type="mcp">  ◆ MCP → get_component(Button)</TerminalLine>
            <TerminalLine delay={0.94} type="data">    variant: primary | secondary | ghost</TerminalLine>
            <TerminalLine delay={1.02} type="mcp">  ◆ MCP → check_compliance</TerminalLine>
            <TerminalLine delay={1.1} type="ok">    ✓ 92/100 · on-system</TerminalLine>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 1.25 }}
              viewport={{ once: true, margin: '-10%' }}
              className="font-mono text-[11.5px] leading-[1.6]"
              style={{ color: STUDIO_TOKENS.textPrimary }}
            >
              <span style={{ color: STUDIO_TOKENS.textMuted }}>$ </span>
              <span
                className="inline-block w-[6px] h-3.5 align-middle ml-0.5 animate-pulse"
                style={{ backgroundColor: STUDIO_TOKENS.textPrimary }}
              />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
