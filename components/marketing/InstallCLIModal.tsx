'use client';

import { useState, useCallback, useEffect } from 'react';

const INSTALL_COMMAND = 'npx @layoutdesign/context install';

const STEPS = [
  {
    title: 'Run the install command',
    desc: 'This installs the MCP server and configures your AI coding agent',
  },
  {
    title: 'Init in your project',
    desc: 'Run npx @layoutdesign/context init to create a .layout/ directory',
  },
  {
    title: 'Your AI gets design context',
    desc: 'Claude Code, Cursor, Antigravity, and Copilot automatically use your design system',
  },
];

export function InstallCLIModal({ onClose }: { onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(INSTALL_COMMAND);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[520px] mx-4 bg-[var(--bg-elevated)] border border-[rgba(255,255,255,0.07)] rounded-[10px] shadow-[0px_25px_50px_0px_rgba(0,0,0,0.25)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 h-[69px] border-b border-[rgba(255,255,255,0.07)]">
          <div className="flex items-center gap-[10px]">
            <div className="flex items-center justify-center size-8 rounded-[6px]">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 1L1 5l7 4 7-4-7-4z" stroke="#ededf4" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M1 11l7 4 7-4" stroke="#ededf4" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M1 8l7 4 7-4" stroke="#ededf4" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="flex flex-col">
              <p className="text-[14px] font-semibold leading-5 text-[#ededf4]">Install Layout CLI</p>
              <p className="text-[12px] leading-4 text-[#ededf4]">Get started in 60 seconds</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center size-7 rounded text-[#ededf4] hover:bg-white/10 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-4 px-5 pt-4 pb-5">
          {/* Info callout */}
          <div className="flex items-start gap-3 rounded-[6px] border border-[#E0E0E6] bg-[rgba(255,255,255,0.09)] px-[14px] py-3">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0 mt-0.5">
              <circle cx="7" cy="7" r="6" stroke="#E0E0E6" strokeWidth="1.2" />
              <path d="M7 6.5v4M7 4.5v.01" stroke="#E0E0E6" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            <p className="text-[12px] leading-[19.5px] text-[#ededf4]">
              <span className="font-medium">Open source and free forever.</span>{' '}
              The CLI and MCP server are MIT licensed. Three starter kits bundled.
            </p>
          </div>

          {/* Description */}
          <p className="text-[12px] leading-4 text-[#ededf4]">
            Run this command in your terminal to install Layout and configure your AI coding agent automatically.
          </p>

          {/* Steps */}
          <div className="flex flex-col gap-[10px]">
            {STEPS.map((step, i) => (
              <div key={step.title} className="flex gap-3 items-start">
                <div className="flex items-center justify-center size-5 rounded-full flex-shrink-0">
                  <span className="text-[10px] font-bold leading-[15px] text-[#ededf4]">{i + 1}</span>
                </div>
                <div className="flex flex-col">
                  <p className="text-[12px] font-medium leading-4 text-[#ededf4]">{step.title}</p>
                  <p className="text-[11px] leading-[16.5px] text-[#b8b8c5]">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Command block */}
          <div className="border border-[rgba(255,255,255,0.07)] rounded-[6px] overflow-hidden">
            <div className="flex items-center justify-between px-3 h-9 border-b border-[rgba(255,255,255,0.07)]">
              <p className="text-[10px] font-medium uppercase tracking-[0.5px] text-[#ededf4]">
                Install Command
              </p>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-medium text-[#ededf4] hover:bg-white/10 transition-colors"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <rect x="3" y="3" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1" />
                  <path d="M7 3V2a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h1" stroke="currentColor" strokeWidth="1" />
                </svg>
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="bg-[#010101] px-3 py-3">
              <code className="text-[13px] font-mono leading-[19.5px] text-[#ededf4]">
                {INSTALL_COMMAND}
              </code>
            </div>
          </div>

          {/* What it does */}
          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-medium uppercase tracking-[0.5px] text-[#ededf4]">
              What gets installed
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'MCP Server', desc: '12 design tools for your AI' },
                { label: 'CLI', desc: 'init, serve, import, install' },
                { label: '3 Starter Kits', desc: 'Linear, Stripe, Notion' },
                { label: 'Preview Server', desc: 'Live component preview' },
              ].map((item) => (
                <div key={item.label} className="flex flex-col gap-0.5">
                  <p className="text-[12px] font-medium leading-4 text-[#ededf4]">{item.label}</p>
                  <p className="text-[11px] leading-[16.5px] text-[#b8b8c5]">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 h-[53px] border-t border-[rgba(255,255,255,0.07)]">
          <button
            onClick={onClose}
            className="h-7 px-3 rounded-[6px] text-[12px] font-medium text-[#ededf4] hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCopy}
            className="h-7 px-4 rounded-[6px] bg-[var(--mkt-accent)] text-[#08090a] text-[12px] font-medium flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <rect x="3.5" y="3.5" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.2" />
              <path d="M8.5 3.5V2a1 1 0 0 0-1-1h-5a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1H4" stroke="currentColor" strokeWidth="1.2" />
            </svg>
            Copy &amp; Install
          </button>
        </div>
      </div>
    </div>
  );
}
