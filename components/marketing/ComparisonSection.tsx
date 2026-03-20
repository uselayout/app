'use client';

import { motion } from 'framer-motion';

export function ComparisonSection() {
  return (
    <section className="bg-[var(--mkt-bg)] pt-[100px] lg:pt-[180px] flex flex-col items-center">
      <div className="max-w-[1280px] w-full px-6">
        <motion.div
          className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between w-full"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2
            className="text-[28px] leading-[34px] md:text-[40px] md:leading-[48px] lg:text-[54px] lg:leading-[64px] tracking-[-1.408px] font-normal text-[var(--mkt-text-primary)] w-full lg:w-[667px]"
          >
            We don&apos;t replace Figma.{' '}
            <span className="text-[var(--mkt-accent)]">
              We compile it into AI context.
            </span>
          </h2>

          <div className="w-full lg:w-[575px] pt-[19px] flex flex-col gap-[18px]">
            <p className="text-[20px] leading-[24px] text-white tracking-[-0.165px]">
              Some tools ask designers to learn a new canvas. Others lock previews inside the IDE. Both create friction. Both ignore the tool your team already knows.
            </p>
            <p className="text-[15px] leading-[24px] text-[var(--mkt-text-secondary)] tracking-[-0.165px]">
              <span className="text-[var(--mkt-accent)]">Layout</span> is a compiler, not a canvas. It reads your existing Figma files, extracts the design system, and serves structured context to your AI tools. It generates real components, pushes real Figma frames, and nobody has to change a thing.
            </p>
            <blockquote className="border-l-4 border-[var(--mkt-accent)] pl-[33px]">
              <p className="text-[18px] leading-[1.4] text-[#e5e7eb] italic">
                TypeScript didn&apos;t replace JavaScript. It added a type system on top. Layout does the same for Figma — an AI context layer on top of files your team already uses.
              </p>
            </blockquote>
            <p className="text-[15px] leading-[24px] text-[var(--mkt-text-secondary)] tracking-[-0.165px]">
              Your designers stay in Figma. Your developers stay in their terminal. Layout sits invisibly between them.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
