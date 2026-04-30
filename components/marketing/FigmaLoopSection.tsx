'use client';

import { motion } from 'framer-motion';
import { MockFrame } from '@/components/marketing/MockFrame';
import { FigmaLoopMock } from '@/components/marketing/mocks/FigmaLoopMock';
import { FigmaLoopMobileMock } from '@/components/marketing/mocks/FigmaLoopMobileMock';

export function FigmaLoopSection() {
  return (
    <section id="figma-loop" className="bg-[var(--mkt-bg)] pt-[100px] lg:pt-[180px] flex flex-col items-center gap-[70px] scroll-mt-[72px]">
      <div className="max-w-[1280px] w-full px-6">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between w-full">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="w-full lg:w-[667px]"
          >
            <p className="text-[28px] leading-[34px] md:text-[40px] md:leading-[48px] lg:text-[54px] lg:leading-[64px] tracking-[-1.408px] font-normal text-[var(--mkt-text-primary)]">Code to Figma.</p>
            <p className="text-[28px] leading-[34px] md:text-[40px] md:leading-[48px] lg:text-[54px] lg:leading-[64px] tracking-[-1.408px] font-normal text-[var(--mkt-text-primary)]">Figma to code.</p>
            <p className="text-[28px] leading-[34px] md:text-[40px] md:leading-[48px] lg:text-[54px] lg:leading-[64px] tracking-[-1.408px] font-normal text-[var(--mkt-accent)]">One design system.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="w-full lg:w-[575px] pt-[19px] flex flex-col gap-[10px]"
          >
            <p className="text-[20px] leading-[24px] text-white tracking-[-0.165px]">
              Generate six directions in seconds. Push to Figma. Your designer does what AI can&apos;t: refine with taste. Import changes back. The system stays in sync.
            </p>
            <p className="text-[15px] leading-[24px] text-[var(--mkt-text-secondary)] tracking-[-0.165px]">
              Push AI-generated components to Figma via the MCP server — three responsive viewports rendered and placed as frames. The Chrome extension lets you browse any site, capture it, and push directly to the Explorer where AI rebuilds it using your design tokens.
            </p>
            <p className="text-[15px] leading-[24px] text-[var(--mkt-accent)] tracking-[-0.165px]">
              Design in Figma with your tokens
            </p>
            <p className="text-[15px] leading-[24px] text-[var(--mkt-text-secondary)] tracking-[-0.165px]">
              The design-in-figma MCP tool gives AI agents your actual token values — colours, typography, spacing — so new Figma screens start on-brand. Designers refine instead of recreating from scratch.
            </p>
            <p className="text-[15px] leading-[24px] text-[var(--mkt-accent)] tracking-[-0.165px]">
              Native Figma plugin
            </p>
            <p className="text-[15px] leading-[24px] text-[var(--mkt-text-secondary)] tracking-[-0.165px]">
              Extract tokens directly from Figma. Inspect elements to see which design tokens they map to. Push components to the Explorer for AI variant generation. Assemble variant frames into Figma component sets with hover interactions.
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
