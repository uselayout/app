'use client';

import { motion } from 'framer-motion';

export function FigmaLoopSection() {
  return (
    <section className="bg-[var(--mkt-bg)] pt-[100px] lg:pt-[180px] flex flex-col items-center gap-[70px]">
      <div className="max-w-[1280px] w-full px-6">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between w-full">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="w-full lg:w-[667px]"
          >
            <p className="text-[28px] leading-[34px] md:text-[40px] md:leading-[48px] lg:text-[54px] lg:leading-[64px] tracking-[-1.408px] font-normal text-[var(--mkt-text-primary)]">Code to Figma and back.</p>
            <p className="text-[28px] leading-[34px] md:text-[40px] md:leading-[48px] lg:text-[54px] lg:leading-[64px] tracking-[-1.408px] font-normal text-[var(--mkt-accent)]">The loop that actually closes.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="w-full lg:w-[575px] pt-[19px] flex flex-col gap-[10px]"
          >
            <p className="text-[20px] leading-[24px] text-white tracking-[-0.165px]">
              Every design-to-code tool is a one-way street. Layout closes the loop.
            </p>
            <p className="text-[15px] leading-[24px] text-[var(--mkt-text-secondary)] tracking-[-0.165px]">
              Push AI-generated components to Figma as editable frames — three responsive breakpoints, real auto-layout, real styles. Not a screenshot.
            </p>
            <p className="text-[15px] leading-[24px] text-[var(--mkt-text-secondary)] tracking-[-0.165px]">
              Designers refine in Figma. Your AI reads the changes via MCP. Code updates in seconds. Nobody leaves their tool.
            </p>
            <p className="text-[15px] leading-[24px] text-[var(--mkt-accent)] tracking-[-0.165px]">
              Design in Figma with your tokens
            </p>
            <p className="text-[15px] leading-[24px] text-[var(--mkt-text-secondary)] tracking-[-0.165px]">
              AI creates Figma mockups using your actual design tokens. New screens start correct — designers refine instead of recreating from scratch.
            </p>
          </motion.div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="w-[1424px] max-w-full mx-auto aspect-[1424/768] relative overflow-hidden rounded-[6px]"
      >
        <img
          src="/marketing/aurora-figma-loop.png"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />
        <div className="absolute left-0 top-0 w-full overflow-hidden px-4 lg:px-[60px] h-[93.75%]">
          <div className="bg-white w-full h-full overflow-hidden relative">
            <video
              src="/marketing/videos/figma-loop.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </motion.div>
    </section>
  );
}
