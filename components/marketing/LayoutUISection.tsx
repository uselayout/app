'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { CopyBlock } from '@/components/shared/CopyBlock';
import { LAYOUT_UI_URL } from '@/lib/marketing/layout-ui';

export function LayoutUISection() {
  return (
    <section className="flex flex-col items-center gap-[56px] bg-[var(--mkt-bg)] pt-[100px] lg:pt-[180px]">
      <div className="max-w-[1280px] w-full px-6">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="w-full lg:max-w-[509px]"
          >
            <p className="text-[13px] uppercase tracking-[1.2px] text-[var(--mkt-text-secondary)] mb-3">
              Layout UI
            </p>
            <p className="text-[28px] leading-[34px] tracking-[-1.408px] text-[var(--mkt-text-primary)] md:text-[40px] md:leading-[48px] lg:text-[54px] lg:leading-[64px]">
              One component system.
            </p>
            <p className="text-[28px] leading-[34px] tracking-[-1.408px] text-[var(--mkt-accent)] md:text-[40px] md:leading-[48px] lg:text-[54px] lg:leading-[64px]">
              Every brand.
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
              Layout UI is 54 components built on Base UI that consume nothing
              but semantic tokens. Pick any gallery kit and the whole system
              reskins, no component code changes, no rewrite.
            </p>
            <p className="mt-2 text-[15px] leading-[24px] tracking-[-0.165px] text-[var(--mkt-text-secondary)]">
              Every component ships with machine-readable rules an AI agent
              can actually follow: what tokens it uses, what it should never
              do, and how it composes. Install one component with our CLI, or
              install an entire brand as a theme with shadcn&apos;s.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a
                href={LAYOUT_UI_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-full bg-[var(--mkt-btn-primary-bg)] px-6 py-3 text-[15px] font-medium text-[var(--mkt-bg)] transition-opacity hover:opacity-90"
              >
                Explore Layout UI
              </a>
              <Link
                href="/docs/layout-ui"
                className="inline-flex items-center text-[15px] text-[var(--mkt-accent)] underline-offset-2 hover:underline"
              >
                Read the docs →
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="mx-auto w-full max-w-[1280px] px-6"
      >
        <div className="grid grid-cols-1 gap-4 rounded-[10px] border border-[var(--mkt-border)] bg-[var(--mkt-surface)] p-6 md:grid-cols-2 md:p-8">
          <div>
            <p className="mb-2 text-[13px] text-[var(--mkt-text-secondary)]">
              Add a component with our CLI
            </p>
            <CopyBlock code="npx @layoutdesign/context add button" />
          </div>
          <div>
            <p className="mb-2 text-[13px] text-[var(--mkt-text-secondary)]">
              Or install a whole brand as a theme
            </p>
            <CopyBlock code="npx shadcn add https://layout.design/r/stripe/theme.json" />
          </div>
        </div>
      </motion.div>
    </section>
  );
}
