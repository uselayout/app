'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export function LayoutLiveSection() {
  return (
    <section className="bg-[var(--mkt-bg)] pt-[100px] lg:pt-[180px]">
      <div className="mx-auto max-w-[1280px] px-6">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="w-full lg:max-w-[509px]"
          >
            <p className="text-[28px] leading-[34px] tracking-[-1.408px] text-[var(--mkt-text-primary)] md:text-[40px] md:leading-[48px] lg:text-[54px] lg:leading-[64px]">
              Edit the real thing.
            </p>
            <p className="text-[28px] leading-[34px] tracking-[-1.408px] text-[var(--mkt-text-primary)] md:text-[40px] md:leading-[48px] lg:text-[54px] lg:leading-[64px]">
              Not a prompt.
            </p>
            <p className="text-[28px] leading-[34px] tracking-[-1.408px] text-[var(--mkt-accent)] md:text-[40px] md:leading-[48px] lg:text-[54px] lg:leading-[64px]">
              On your desktop.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="w-full pt-[19px] lg:w-[683px]"
          >
            <p className="text-[20px] leading-[24px] tracking-[-0.165px] text-white">
              Layout Live is the macOS app that turns your running React app into
              a canvas. Click an element, scrub its padding, swap a colour for a
              design token — and the edit is written straight back to your
              Tailwind source.
            </p>
            <p className="mt-2 text-[15px] leading-[24px] tracking-[-0.165px] text-[var(--mkt-text-secondary)]">
              No cloud sandbox, no AI tokens spent on a 4px nudge. Your own dev
              server hot-reloads a real, committable diff — gated to your design
              tokens with a live compliance score. When a change needs logic,
              hand the selected element to Claude Code via MCP.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/live"
                className="inline-flex items-center rounded-full bg-[var(--mkt-btn-primary-bg)] px-6 py-3 text-[15px] font-medium text-[var(--mkt-bg)] transition-opacity hover:opacity-90"
              >
                Try Layout Live
              </Link>
              <Link
                href="/docs/live"
                className="inline-flex items-center text-[15px] text-[var(--mkt-accent)] underline-offset-2 hover:underline"
              >
                Read the docs →
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
