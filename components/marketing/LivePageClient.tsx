'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  MousePointerClick,
  SlidersHorizontal,
  Palette,
  Bot,
  Download,
  FolderOpen,
  Play,
} from 'lucide-react';
import { MarketingHeader } from '@/components/marketing/MarketingHeader';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';
import { LiveDownloadButton } from '@/components/marketing/LiveDownloadButton';
import { MockFrame } from '@/components/marketing/MockFrame';
import { LayoutLiveMock } from '@/components/marketing/mocks/LayoutLiveMock';

const PILLARS = [
  {
    icon: MousePointerClick,
    title: 'Click to select',
    body: "Point Live at your local dev server and click any element in the running app. An overlay highlights it and the properties panel fills with that element's real classes — selection survives hot-reload.",
  },
  {
    icon: SlidersHorizontal,
    title: "Scrub, don't prompt",
    body: 'Drag padding, margin, gap, font size, weight and radius. Every drag is an exact value that snaps to your design tokens, with a live compliance score — no 10-second AI round-trip for a 4px nudge.',
  },
  {
    icon: Palette,
    title: 'Edits write to source',
    body: 'Every change is an AST edit to your actual Tailwind classes — not an overlay or a runtime patch. Your own dev server hot-reloads it, and the diff is real, committable code.',
  },
  {
    icon: Bot,
    title: 'Hand off to AI',
    body: 'When a tweak needs real logic, hand the selected element and your recent edits to Claude Code (or any agent) via the Layout MCP server. The agent picks up exactly what you changed.',
  },
] as const;

const STEPS: ReadonlyArray<{
  icon: typeof Download;
  title: string;
  body: string;
  code?: string;
}> = [
  {
    icon: Download,
    title: 'Download & install',
    body: 'Grab the Mac app above, open the .dmg, and drag Layout Live to your Applications folder. It’s signed and notarised by Apple, so it just opens — no security warnings.',
  },
  {
    icon: FolderOpen,
    title: 'Wire up your project',
    body: 'In any React + Vite or Next project with Tailwind, run the one-line setup. It adds the Live plugin (so clicks map to source) and, optionally, a design-system kit.',
    code: 'npx @layoutdesign/context install --live',
  },
  {
    icon: Play,
    title: 'Open it on your app',
    body: 'Start your dev server, then launch Live bound to it with one command — no URL to type. Click an element and start scrubbing.',
    code: 'npm run dev\nnpx @layoutdesign/context live',
  },
];

const fade = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
  viewport: { once: true },
};

export function LivePageClient() {
  return (
    <div className="dark">
      <div className="relative z-10 bg-[var(--mkt-bg)] text-[var(--mkt-text-primary)]">
        <MarketingHeader />
        <main>
          {/* Hero */}
          <section className="mx-auto flex max-w-[1280px] flex-col items-center px-6 pt-[120px] pb-[80px] text-center lg:pt-[180px]">
            <motion.span
              {...fade}
              className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--mkt-border)] px-3 py-1 text-[13px] text-[var(--mkt-text-secondary)]"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--mkt-accent)]" />
              Layout Live — open alpha for macOS
            </motion.span>
            <motion.h1
              {...fade}
              className="max-w-[820px] text-[40px] leading-[46px] tracking-[-1.4px] md:text-[64px] md:leading-[68px]"
            >
              Stop prompting for padding.
            </motion.h1>
            <motion.p
              {...fade}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="mt-5 max-w-[640px] text-[18px] leading-[28px] text-[var(--mkt-text-secondary)]"
            >
              Layout Live turns your real running app into a canvas. Click an
              element, scrub its spacing, swap a colour for a design token — and
              the change is written straight back to your source as a Tailwind
              class. No cloud sandbox, no AI tokens spent, just your dev server
              hot-reloading real edits.
            </motion.p>
            <motion.div {...fade} transition={{ duration: 0.6, delay: 0.1 }} className="mt-9">
              <LiveDownloadButton />
            </motion.div>

            {/* Product mock */}
            <motion.div
              {...fade}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="relative mx-auto mt-16 w-[1280px] max-w-full overflow-hidden rounded-[6px]"
              style={{ aspectRatio: '1280 / 760' }}
            >
              <img
                src="/marketing/aurora-drift.webp"
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-3 lg:inset-5">
                <MockFrame ariaLabel="Layout Live editing a running app — scrubbing a button's padding">
                  <LayoutLiveMock />
                </MockFrame>
              </div>
            </motion.div>
          </section>

          {/* Pillars */}
          <section className="mx-auto max-w-[1280px] px-6 pb-[80px]">
            <div className="grid grid-cols-1 gap-px overflow-hidden rounded-[10px] border border-[var(--mkt-border)] bg-[var(--mkt-border)] sm:grid-cols-2">
              {PILLARS.map(({ icon: Icon, title, body }) => (
                <motion.div
                  key={title}
                  {...fade}
                  className="bg-[var(--mkt-bg)] p-7"
                >
                  <Icon className="mb-4 h-5 w-5 text-[var(--mkt-accent)]" />
                  <h3 className="mb-2 text-[18px] tracking-[-0.2px]">{title}</h3>
                  <p className="text-[15px] leading-[24px] text-[var(--mkt-text-secondary)]">
                    {body}
                  </p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Get started */}
          <section className="mx-auto max-w-[1280px] px-6 pb-[80px]">
            <motion.h2
              {...fade}
              className="mb-2 text-[28px] leading-[34px] tracking-[-0.8px] md:text-[40px] md:leading-[48px]"
            >
              Three steps to your first edit.
            </motion.h2>
            <motion.p
              {...fade}
              className="mb-10 max-w-[560px] text-[15px] leading-[24px] text-[var(--mkt-text-secondary)]"
            >
              You&apos;ll need Node installed for the CLI step. Works with any
              React + Vite or Next project using Tailwind.
            </motion.p>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {STEPS.map(({ icon: Icon, title, body, code }, i) => (
                <motion.div
                  key={title}
                  {...fade}
                  transition={{ duration: 0.6, delay: i * 0.05 }}
                  className="flex flex-col rounded-[10px] border border-[var(--mkt-border)] p-6"
                >
                  <div className="mb-4 flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--mkt-border)] text-[13px] text-[var(--mkt-text-secondary)]">
                      {i + 1}
                    </span>
                    <Icon className="h-5 w-5 text-[var(--mkt-accent)]" />
                  </div>
                  <h3 className="mb-2 text-[17px] tracking-[-0.2px]">{title}</h3>
                  <p className="mb-4 flex-1 text-[14px] leading-[22px] text-[var(--mkt-text-secondary)]">
                    {body}
                  </p>
                  {code && (
                    <pre className="overflow-x-auto rounded-md border border-[var(--mkt-border)] bg-black/30 px-3 py-2 text-[12px] leading-[20px] text-[var(--mkt-text-primary)]">
                      <code>{code}</code>
                    </pre>
                  )}
                </motion.div>
              ))}
            </div>
            <motion.p {...fade} className="mt-6 text-[14px] text-[var(--mkt-text-secondary)]">
              New here? Follow the{' '}
              <Link href="/docs/live/round-trip" className="text-[var(--mkt-accent)] underline-offset-2 hover:underline">
                Gallery → Live walkthrough
              </Link>{' '}
              or read the{' '}
              <Link href="/docs/live" className="text-[var(--mkt-accent)] underline-offset-2 hover:underline">
                full docs
              </Link>
              .
            </motion.p>
          </section>

          {/* Feedback / testers */}
          <section className="mx-auto max-w-[1280px] px-6 pb-[120px]">
            <motion.div
              {...fade}
              className="flex flex-col items-start gap-4 rounded-[10px] border border-[var(--mkt-border)] p-8 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <h2 className="text-[22px] tracking-[-0.3px]">You&apos;re testing the alpha — tell us everything.</h2>
                <p className="mt-2 max-w-[620px] text-[15px] leading-[24px] text-[var(--mkt-text-secondary)]">
                  Layout Live updates itself automatically as we ship fixes. If
                  something won&apos;t edit, looks off, or you have an idea, the
                  fastest way to reach us is Discord. Layout only touches your
                  local project files and a periodic update check — nothing else
                  leaves your machine.
                </p>
              </div>
              <a
                href="/discord"
                target="_blank"
                rel="noreferrer"
                className="inline-flex shrink-0 items-center rounded-full bg-[var(--mkt-btn-primary-bg)] px-6 py-3 text-[15px] font-medium text-[var(--mkt-bg)] transition-opacity hover:opacity-90"
              >
                Join the Discord
              </a>
            </motion.div>
          </section>
        </main>
        <MarketingFooter />
      </div>
    </div>
  );
}
