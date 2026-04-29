'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { History, ArrowUp } from 'lucide-react';
import { STUDIO_TOKENS, Tooltip } from '../_studio-chrome';

const MONACO = {
  bg: '#18181E',
  fg: '#C8C8D0',
  fgMuted: '#6B6B80',
  keyword: '#E4F222',
  string: '#34D399',
  variable: '#A78BFA',
  comment: '#6B6B80',
};

const SECTIONS = [
  'Quick Reference',
  'Colours',
  'Typography',
  'Spacing',
  'Components',
  'Anti-patterns',
];

function HexValue({ hex }: { hex: string }) {
  return (
    <span className="inline-flex items-center align-baseline">
      <span
        className="inline-block align-middle"
        style={{
          width: 10,
          height: 10,
          backgroundColor: hex,
          marginRight: 4,
          border: '1px solid rgba(255,255,255,0.18)',
        }}
      />
      <span style={{ color: MONACO.fg }}>{hex}</span>
    </span>
  );
}

function Line({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="font-mono leading-[20px] whitespace-pre"
      style={{ fontSize: 13, color: MONACO.fg, fontFamily: '"Geist Mono", "JetBrains Mono", monospace' }}
    >
      {children}
    </div>
  );
}

export function EditorView() {
  const [activeSection, setActiveSection] = useState('Colours');
  const [aiPrompt, setAiPrompt] = useState('');

  return (
    <>
      {/* Status bar */}
      <div
        className="flex items-center justify-between border-b h-9 px-4 shrink-0"
        style={{ borderColor: STUDIO_TOKENS.border }}
      >
        <span className="text-xs font-medium" style={{ color: STUDIO_TOKENS.textMuted }}>
          layout.md
        </span>
        <div className="flex items-center gap-3">
          <span className="text-xs" style={{ color: STUDIO_TOKENS.statusSuccess }}>
            Saved
          </span>
          <Tooltip label="Version history">
            <button
              className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs hover:bg-white/5 transition-colors"
              style={{ color: STUDIO_TOKENS.textMuted }}
            >
              <History className="h-3 w-3" />
              History
            </button>
          </Tooltip>
          <span
            className="rounded-full px-2 py-0.5 text-xs font-medium tabular-nums text-white"
            style={{ backgroundColor: STUDIO_TOKENS.statusSuccess }}
          >
            ~3.2k tokens
          </span>
        </div>
      </div>

      {/* Section navigator */}
      <div
        className="flex gap-1 overflow-x-auto border-b px-4 py-1.5 shrink-0"
        style={{ borderColor: STUDIO_TOKENS.border }}
      >
        {SECTIONS.map((s) => (
          <button
            key={s}
            onClick={() => setActiveSection(s)}
            className="shrink-0 rounded px-2 py-0.5 text-[10px] transition-colors hover:bg-white/5"
            style={{
              color: activeSection === s ? STUDIO_TOKENS.textPrimary : STUDIO_TOKENS.textMuted,
              backgroundColor: activeSection === s ? STUDIO_TOKENS.bgHover : 'transparent',
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Editor body */}
      <div
        className="flex-1 min-h-0 relative overflow-hidden"
        style={{ backgroundColor: MONACO.bg }}
      >
        <div className="px-5 pt-5 pb-4 overflow-hidden h-full">
          <Line>
            <span style={{ color: MONACO.keyword }}>#</span> Acme Design System
          </Line>
          <Line>{' '}</Line>
          <Line>
            <span style={{ color: MONACO.comment }}>Source: Figma · file 4kLp · 2 modes (light + dark)</span>
          </Line>
          <Line>
            <span style={{ color: MONACO.comment }}>Generated: 2026-04-29 · Layout v1.4</span>
          </Line>
          <Line>{' '}</Line>

          <Line>
            <span style={{ color: MONACO.keyword }}>##</span> Quick Reference
          </Line>
          <Line>{' '}</Line>
          <Line>
            - **Brand**: <HexValue hex="#E4F222" /> (lime accent)
          </Line>
          <Line>- **Surface**: 5-step elevation, dark-first</Line>
          <Line>- **Body font**: Inter, 16/24, weight 400</Line>
          <Line>- **Display font**: Inter, 56/64, weight 600</Line>
          <Line>- **Spacing**: 4px base, 12-step scale</Line>
          <Line>{' '}</Line>

          <Line>
            <span style={{ color: MONACO.keyword }}>##</span> Colours
          </Line>
          <Line>{' '}</Line>
          <Line>
            <span style={{ color: MONACO.fgMuted }}>```css</span>
          </Line>
          <Line>
            <span style={{ color: MONACO.variable }}>--accent</span>: <HexValue hex="#E4F222" />;
          </Line>
          <Line>
            <span style={{ color: MONACO.variable }}>--bg-app</span>: <HexValue hex="#0C0C0E" />;
          </Line>
          <Line>
            <span style={{ color: MONACO.variable }}>--bg-panel</span>: <HexValue hex="#141418" />;
          </Line>
          <Line>
            <span style={{ color: MONACO.variable }}>--bg-surface</span>: <HexValue hex="#1A1A20" />;
          </Line>
          <Line>
            <span style={{ color: MONACO.variable }}>--text-primary</span>: <HexValue hex="#EDEDF4" />;
          </Line>
          <Line>
            <span style={{ color: MONACO.variable }}>--success</span>: <HexValue hex="#34C759" />;
          </Line>
          <Line>
            <span style={{ color: MONACO.fgMuted }}>```</span>
          </Line>
        </div>

        {/* Bottom fade */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-12"
          style={{ background: `linear-gradient(to top, ${MONACO.bg}, transparent)` }}
        />
      </div>

      {/* AI edit chat bar — mirrors EditorPanel.tsx EditorChatBar */}
      <div
        className="border-t shrink-0"
        style={{ borderColor: STUDIO_TOKENS.border, backgroundColor: STUDIO_TOKENS.bgApp }}
      >
        <div
          className="mx-3 mb-3 mt-3 flex flex-col rounded-lg border"
          style={{ borderColor: STUDIO_TOKENS.border, backgroundColor: STUDIO_TOKENS.bgSurface }}
        >
          <div className="relative p-2.5">
            <div
              className="flex min-h-[52px] items-start rounded-md border px-3.5 py-3"
              style={{
                borderColor: STUDIO_TOKENS.border,
                backgroundColor: STUDIO_TOKENS.accentSubtle,
                boxShadow: '0 0 0 1px rgba(0,0,0,0.2)',
              }}
            >
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Ask Layout to edit your design system…"
                className="flex-1 bg-transparent text-[13px] outline-none"
                style={{ color: STUDIO_TOKENS.textPrimary }}
              />
            </div>
            {aiPrompt.trim() && (
              <div className="absolute bottom-5 right-5">
                <button
                  className="flex items-center justify-center size-6 rounded-full transition-colors hover:opacity-90"
                  style={{ backgroundColor: STUDIO_TOKENS.textPrimary, color: STUDIO_TOKENS.bgApp }}
                >
                  <ArrowUp className="h-3 w-3" strokeWidth={2.5} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
