'use client';

import { motion } from 'framer-motion';

interface CodeLineProps {
  children: React.ReactNode;
  delay: number;
  highlight?: boolean;
}

function CodeLine({ children, delay, highlight }: CodeLineProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.25, delay, ease: 'linear' }}
      viewport={{ once: true, margin: '-10%' }}
      className={`px-4 py-[1px] ${highlight ? 'bg-[#E4F222]/[0.07]' : ''}`}
    >
      {children}
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
      ? 'text-white'
      : type === 'ok'
      ? 'text-emerald-300'
      : type === 'mcp'
      ? 'text-[#E4F222]'
      : type === 'data'
      ? 'text-white/55'
      : 'text-white/65';
  return (
    <motion.div
      initial={{ opacity: 0, x: -4 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay, ease: [0, 0, 0.2, 1] }}
      viewport={{ once: true, margin: '-10%' }}
      className={`font-mono text-[11px] leading-[1.55] whitespace-pre ${colour}`}
    >
      {children}
    </motion.div>
  );
}

export function ServeMock() {
  return (
    <div
      className="absolute inset-0 flex flex-col text-white"
      style={{
        backgroundColor: '#0C0C0E',
        fontFamily: '"Geist", "Inter", -apple-system, sans-serif',
        colorScheme: 'dark',
      }}
    >
      {/* Window chrome */}
      <div className="flex items-center justify-between border-b border-white/10 bg-black/40 px-4 py-2.5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <div className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <div className="h-2.5 w-2.5 rounded-full bg-white/15" />
          </div>
          <span className="font-mono text-[11px] text-white/50">acme-app · ~/projects</span>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-mono text-white/40">
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
            MCP connected · 12 tools
          </span>
        </div>
      </div>

      {/* Body: code (left) + terminal (right) */}
      <div className="flex-1 grid grid-cols-2 min-h-0">
        {/* Code editor */}
        <div className="flex flex-col border-r border-white/10 min-h-0">
          <div className="flex items-center gap-1 border-b border-white/8 bg-black/30 px-3 py-1.5 shrink-0">
            <div className="flex items-center gap-1.5 rounded-t-md bg-white/[0.04] border-t border-x border-white/10 px-2.5 py-1 text-[10px] font-mono text-white/80 -mb-px">
              <span className="text-[#E4F222]">●</span>
              SignInForm.tsx
            </div>
            <div className="rounded-t-md px-2.5 py-1 text-[10px] font-mono text-white/40">
              tokens.css
            </div>
            <div className="rounded-t-md px-2.5 py-1 text-[10px] font-mono text-white/40">
              tailwind.config.ts
            </div>
            <div className="ml-auto flex items-center gap-1.5 text-[10px] font-mono text-white/35">
              <span>cursor</span>
              <span className="text-white/20">·</span>
              <span>auto-saved</span>
            </div>
          </div>
          <div className="flex-1 overflow-hidden font-mono text-[11.5px] leading-[1.6] text-white/85 py-2 min-h-0">
            <CodeLine delay={0.1}>
              <span className="text-white/30 mr-3 select-none">1</span>
              <span className="text-purple-300">import</span>
              <span className="text-white/85"> {'{ Button }'} </span>
              <span className="text-purple-300">from</span>
              <span className="text-emerald-300"> {"'@/ui/button'"}</span>
            </CodeLine>
            <CodeLine delay={0.15}>
              <span className="text-white/30 mr-3 select-none">2</span>
              <span className="text-white/40"> </span>
            </CodeLine>
            <CodeLine delay={0.2}>
              <span className="text-white/30 mr-3 select-none">3</span>
              <span className="text-purple-300">export function</span>
              <span className="text-yellow-200"> SignInForm</span>
              <span className="text-white/85">() {`{`}</span>
            </CodeLine>
            <CodeLine delay={0.25}>
              <span className="text-white/30 mr-3 select-none">4</span>
              <span className="text-white/85">  </span>
              <span className="text-purple-300">return</span>
              <span className="text-white/85"> (</span>
            </CodeLine>
            <CodeLine delay={0.3}>
              <span className="text-white/30 mr-3 select-none">5</span>
              <span className="text-white/85">    {'<'}</span>
              <span className="text-rose-300">form</span>
              <span className="text-white/85"> </span>
              <span className="text-amber-200">className</span>
              <span className="text-white/85">=</span>
              <span className="text-emerald-300">{'"flex flex-col gap-3"'}</span>
              <span className="text-white/85">{'>'}</span>
            </CodeLine>
            <CodeLine delay={0.35}>
              <span className="text-white/30 mr-3 select-none">6</span>
              <span className="text-white/85">      {'<'}</span>
              <span className="text-rose-300">input</span>
              <span className="text-white/85"> </span>
              <span className="text-amber-200">className</span>
              <span className="text-white/85">=</span>
              <span className="text-emerald-300">{'"rounded-md bg-[--bg-surface] px-3 py-2"'}</span>
              <span className="text-white/85"> {'/>'}</span>
            </CodeLine>
            <CodeLine delay={0.4} highlight>
              <span className="text-white/30 mr-3 select-none">7</span>
              <span className="text-white/85">      {'<'}</span>
              <span className="text-yellow-200">Button</span>
              <span className="text-white/85"> </span>
              <span className="text-amber-200">variant</span>
              <span className="text-white/85">=</span>
              <span className="text-emerald-300">{'"primary"'}</span>
              <span className="text-white/85"> </span>
              <span className="text-amber-200">className</span>
              <span className="text-white/85">=</span>
              <span className="text-emerald-300">{'"bg-[--accent] text-[--text-on-accent]"'}</span>
              <span className="text-white/85">{'>'}</span>
            </CodeLine>
            <CodeLine delay={0.45}>
              <span className="text-white/30 mr-3 select-none">8</span>
              <span className="text-white/85">        Sign in</span>
            </CodeLine>
            <CodeLine delay={0.5}>
              <span className="text-white/30 mr-3 select-none">9</span>
              <span className="text-white/85">      {'</'}</span>
              <span className="text-yellow-200">Button</span>
              <span className="text-white/85">{'>'}</span>
            </CodeLine>
            <CodeLine delay={0.55}>
              <span className="text-white/30 mr-3 select-none">10</span>
              <span className="text-white/85">    {'</'}</span>
              <span className="text-rose-300">form</span>
              <span className="text-white/85">{'>'}</span>
            </CodeLine>
            <CodeLine delay={0.6}>
              <span className="text-white/30 mr-3 select-none">11</span>
              <span className="text-white/85">  )</span>
            </CodeLine>
            <CodeLine delay={0.65}>
              <span className="text-white/30 mr-3 select-none">12</span>
              <span className="text-white/85">{`}`}</span>
            </CodeLine>
            <div className="px-4 py-3 mt-2">
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.85, ease: [0, 0, 0.2, 1] }}
                viewport={{ once: true, margin: '-10%' }}
                className="rounded-md border border-[#E4F222]/30 bg-[#E4F222]/[0.04] px-3 py-2 text-[10.5px] font-mono"
              >
                <div className="flex items-center gap-1.5 text-[#E4F222]/85 mb-0.5">
                  <span>◆</span>
                  <span>Layout MCP</span>
                </div>
                <div className="text-white/65 leading-snug">
                  Resolved <span className="text-white">--accent</span> →{' '}
                  <span className="text-[#E4F222]">#E4F222</span> · on-system ✓
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Terminal */}
        <div className="flex flex-col bg-[#08080A] min-h-0">
          <div className="flex items-center gap-2 border-b border-white/8 px-3 py-1.5 shrink-0">
            <span className="font-mono text-[10px] text-white/55">▶ zsh</span>
            <span className="ml-auto font-mono text-[10px] text-white/35">acme-app</span>
          </div>
          <div className="flex-1 overflow-hidden px-4 py-2.5 min-h-0 space-y-[1px]">
            <TerminalLine delay={0.1} type="cmd"><span className="text-white/45">$ </span>npx @layoutdesign/context install</TerminalLine>
            <TerminalLine delay={0.18} type="info">→ Found .layout/ in /acme-app</TerminalLine>
            <TerminalLine delay={0.26} type="ok">✓ Configured Claude Code</TerminalLine>
            <TerminalLine delay={0.32} type="ok">✓ Configured Cursor</TerminalLine>
            <TerminalLine delay={0.38} type="ok">✓ Configured Windsurf</TerminalLine>
            <TerminalLine delay={0.44} type="ok">✓ Configured Copilot, Codex, Gemini CLI</TerminalLine>
            <TerminalLine delay={0.52} type="ok">✓ Started preview server :4321</TerminalLine>
            <TerminalLine delay={0.6} type="info"> </TerminalLine>
            <TerminalLine delay={0.66} type="cmd"><span className="text-white/45">$ </span>cursor agent</TerminalLine>
            <TerminalLine delay={0.74} type="info">› Building SignInForm.tsx</TerminalLine>
            <TerminalLine delay={0.82} type="mcp">  ◆ MCP → get_design_system</TerminalLine>
            <TerminalLine delay={0.88} type="data">    17 tokens · 12 components · 6 kits</TerminalLine>
            <TerminalLine delay={0.96} type="mcp">  ◆ MCP → get_component(Button)</TerminalLine>
            <TerminalLine delay={1.02} type="data">    variant: primary | secondary | ghost</TerminalLine>
            <TerminalLine delay={1.1} type="mcp">  ◆ MCP → check_compliance</TerminalLine>
            <TerminalLine delay={1.18} type="ok">    ✓ 92/100 · on-system</TerminalLine>
            <TerminalLine delay={1.26} type="info"> </TerminalLine>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 1.4 }}
              viewport={{ once: true, margin: '-10%' }}
              className="font-mono text-[11px] leading-[1.55] text-white"
            >
              <span className="text-white/45">$ </span>
              <span className="inline-block w-2 h-3.5 align-middle bg-white/80 ml-0.5 animate-pulse" />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Footer status */}
      <div className="flex items-center justify-between border-t border-white/10 bg-black/30 px-4 py-2 shrink-0 text-[10px] font-mono">
        <div className="flex items-center gap-3 text-white/45">
          <span>SignInForm.tsx · TS · UTF-8 · LF</span>
        </div>
        <div className="flex items-center gap-3 text-white/45">
          <span className="flex items-center gap-1 text-emerald-300/80">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
            preview :4321
          </span>
          <span className="text-white/20">·</span>
          <span>auto-context on</span>
        </div>
      </div>
    </div>
  );
}
