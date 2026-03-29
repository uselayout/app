'use client';

import { motion } from 'framer-motion';
import { MarketingVideo } from '@/components/marketing/MarketingVideo';

export function DesignSystemSection() {
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
            <p className="text-[28px] leading-[34px] md:text-[40px] md:leading-[48px] lg:text-[54px] lg:leading-[64px] tracking-[-1.408px] font-normal text-[var(--mkt-text-primary)]">Extract once.</p>
            <p className="text-[28px] leading-[34px] md:text-[40px] md:leading-[48px] lg:text-[54px] lg:leading-[64px] tracking-[-1.408px] font-normal text-[var(--mkt-text-primary)]">Manage forever.</p>
            <p className="text-[28px] leading-[34px] md:text-[40px] md:leading-[48px] lg:text-[54px] lg:leading-[64px] tracking-[-1.408px] font-normal text-[var(--mkt-accent)]">Your design system, alive.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="w-full lg:w-[683px] pt-[19px] flex flex-col gap-[10px]"
          >
            <p className="text-[20px] leading-[24px] text-white tracking-[-0.165px]">
              Extraction is the starting point, not the end. Layout gives you a structured design system — tokens, typography, and components, all browsable in the Studio.
            </p>
            <p className="text-[15px] leading-[24px] text-[var(--mkt-text-secondary)] tracking-[-0.165px]">
              Generate components in the Explorer with AI assistance. Describe what you need — Layout generates variants using your design tokens. Save the best ones to your library with categories and tags.
            </p>
            <p className="text-[15px] leading-[24px] text-[var(--mkt-text-secondary)] tracking-[-0.165px]">
              Browse saved components and pages in the Studio. Filter by type, search by category. Everything stays connected to your layout.md.
            </p>
            <p className="text-[15px] leading-[24px] text-[var(--mkt-accent)] tracking-[-0.165px]">
              Not a static export. A living system.
            </p>
          </motion.div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="w-[1280px] max-w-full mx-auto aspect-[1280/810] relative overflow-hidden rounded-[6px]"
      >
        <img
          src="/marketing/aurora-design-system.webp"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />
        <div className="absolute inset-3 lg:inset-5 overflow-hidden rounded-[6px]">
          <MarketingVideo src="/marketing/videos/design-system.mp4" ariaLabel="Design system dashboard demo" />
        </div>
      </motion.div>
    </section>
  );
}
