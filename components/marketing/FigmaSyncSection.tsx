'use client';

import { motion } from 'framer-motion';
import { MockFrame } from '@/components/marketing/MockFrame';
import { FigmaLoopMock } from '@/components/marketing/mocks/FigmaLoopMock';
import { FigmaLoopMobileMock } from '@/components/marketing/mocks/FigmaLoopMobileMock';

/**
 * The full Figma story in one section. Merges the old DriftSection (webhook
 * re-extract diff) and FigmaLoopSection (push to Figma, design-in-figma,
 * native plugin): both were telling halves of "Figma and code never drift".
 */
export function FigmaSyncSection() {
  return (
    <section id="figma-loop" className="bg-[var(--mkt-bg)] pt-[100px] lg:pt-[180px] flex flex-col items-center gap-[70px] scroll-mt-[72px]">
      <div className="max-w-[1280px] w-full px-6">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between w-full">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="w-full lg:max-w-[509px]"
          >
            <p className="text-[28px] leading-[34px] md:text-[40px] md:leading-[48px] lg:text-[54px] lg:leading-[64px] tracking-[-1.408px] font-normal text-[var(--mkt-text-primary)]">Figma changes.</p>
            <p className="text-[28px] leading-[34px] md:text-[40px] md:leading-[48px] lg:text-[54px] lg:leading-[64px] tracking-[-1.408px] font-normal text-[var(--mkt-text-primary)]">Code follows.</p>
            <p className="text-[28px] leading-[34px] md:text-[40px] md:leading-[48px] lg:text-[54px] lg:leading-[64px] tracking-[-1.408px] font-normal text-[var(--mkt-accent)]">Both ways.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="w-full lg:w-[683px] pt-[19px] flex flex-col gap-[10px]"
          >
            <p className="text-[20px] leading-[24px] text-white tracking-[-0.165px]">
              Layout watches your Figma file via webhook. When a change lands, you get a token-by-token diff &mdash; added, modified, removed &mdash; and one click updates layout.md. Your AI reads the latest design system on the next prompt.
            </p>
            <p className="text-[15px] leading-[24px] text-[var(--mkt-text-secondary)] tracking-[-0.165px]">
              It works in the other direction too. Push AI-generated components to Figma as editable frames across three viewports, and the design-in-figma MCP tool gives agents your actual token values so new Figma screens start on-brand.
            </p>
            <p className="text-[15px] leading-[24px] text-[var(--mkt-text-secondary)] tracking-[-0.165px]">
              The native Figma plugin syncs tokens and variables bidirectionally, inspects elements against your system, and assembles AI variants into component sets.
            </p>
            <p className="text-[15px] leading-[24px] text-[var(--mkt-accent)] tracking-[-0.165px]">
              One design system. Never two versions of it.
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
          src="/marketing/aurora-figma-loop.webp"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />
        <div className="absolute inset-3 lg:inset-5">
          <MockFrame ariaLabel="Figma to Layout Studio bidirectional sync">
            <FigmaLoopMock />
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
        <MockFrame ariaLabel="Figma to Studio sync — mobile preview">
          <FigmaLoopMobileMock />
        </MockFrame>
      </motion.div>
    </section>
  );
}
