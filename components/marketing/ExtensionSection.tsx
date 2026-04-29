'use client';

import { motion } from 'framer-motion';
import { MockFrame } from '@/components/marketing/MockFrame';
import { ExtensionMock } from '@/components/marketing/mocks/ExtensionMock';
import { ExtensionMobileMock } from '@/components/marketing/mocks/ExtensionMobileMock';

export function ExtensionSection() {
  return (
    <section className="bg-[var(--mkt-bg)] pt-[100px] lg:pt-[180px] flex flex-col items-center gap-[70px]">
      <div className="max-w-[1280px] w-full px-6">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between w-full">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="w-full lg:max-w-[509px]"
          >
            <p className="text-[28px] leading-[34px] md:text-[40px] md:leading-[48px] lg:text-[54px] lg:leading-[64px] tracking-[-1.408px] font-normal text-[var(--mkt-text-primary)]">Browse any site.</p>
            <p className="text-[28px] leading-[34px] md:text-[40px] md:leading-[48px] lg:text-[54px] lg:leading-[64px] tracking-[-1.408px] font-normal text-[var(--mkt-text-primary)]">Extract its design system.</p>
            <p className="text-[28px] leading-[34px] md:text-[40px] md:leading-[48px] lg:text-[54px] lg:leading-[64px] tracking-[-1.408px] font-normal text-[var(--mkt-accent)]">In the sidebar.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="w-full lg:w-[683px] pt-[19px] flex flex-col gap-[10px]"
          >
            <p className="text-[20px] leading-[24px] text-white tracking-[-0.165px]">
              You see a component you love on a competitor&apos;s site. You need to audit a client&apos;s live product. You want to match an existing app&apos;s design language. You shouldn&apos;t have to copy-paste a URL every time.
            </p>
            <p className="text-[15px] leading-[24px] text-[var(--mkt-text-secondary)] tracking-[-0.165px]">
              The Layout Chrome extension lives in your browser sidebar. Click any page to extract its design tokens — colours, typography, spacing, radius — and push them straight to your Layout project. No tab-switching. No copy-paste.
            </p>
            <p className="text-[15px] leading-[24px] text-[var(--mkt-text-secondary)] tracking-[-0.165px]">
              Pick any element to inspect its computed styles and see which values match your design system tokens. Green means on-system. Red means off-brand. One click copies the element&apos;s HTML and styles, formatted for your AI agent.
            </p>
            <p className="text-[15px] leading-[24px] text-[var(--mkt-accent)] tracking-[-0.165px]">
              Five tools. One sidebar.
            </p>
            <p className="text-[15px] leading-[24px] text-[var(--mkt-text-secondary)] tracking-[-0.165px]">
              Extract tokens. Capture screenshots. Inspect elements. Check compliance with a score out of 100. Copy a ready-to-paste prompt that sends any page to Figma as pixel-perfect editable frames with auto-layout — powered by Figma&apos;s own capture engine via Claude Code. All without leaving the tab you&apos;re on.
            </p>
          </motion.div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="hidden md:block w-[1280px] max-w-full mx-auto aspect-[1280/810] relative overflow-hidden rounded-[6px]"
      >
        <img
          src="/marketing/aurora-drift.webp"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />
        <div className="absolute inset-3 lg:inset-5">
          <MockFrame ariaLabel="Chrome extension extracting tokens from a webpage">
            <ExtensionMock />
          </MockFrame>
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
        className="md:hidden w-full max-w-[420px] mx-auto aspect-[3/4] relative px-4"
      >
        <MockFrame ariaLabel="Chrome extension — mobile preview">
          <ExtensionMobileMock />
        </MockFrame>
      </motion.div>
    </section>
  );
}
