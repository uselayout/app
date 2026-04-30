'use client';

import { motion } from 'framer-motion';
import { MockFrame } from '@/components/marketing/MockFrame';
import { ContextGapMock } from '@/components/marketing/mocks/ContextGapMock';
import { ContextGapMobileMock } from '@/components/marketing/mocks/ContextGapMobileMock';

export function ContextGapSection() {
  return (
    <section className="bg-[var(--mkt-bg)] pt-[100px] lg:pt-[180px] flex flex-col items-center gap-[70px]">
      <div className="max-w-[1280px] w-full px-6">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between w-full">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="w-full lg:max-w-[454px]"
          >
            <p className="text-[28px] leading-[34px] md:text-[40px] md:leading-[48px] lg:text-[54px] lg:leading-[64px] tracking-[-1.408px] font-normal text-[var(--mkt-text-primary)]">Brilliant code.</p>
            <p className="text-[28px] leading-[34px] md:text-[40px] md:leading-[48px] lg:text-[54px] lg:leading-[64px] tracking-[-1.408px] font-normal text-[var(--mkt-text-primary)]">Wrong design.</p>
            <p className="text-[28px] leading-[34px] md:text-[40px] md:leading-[48px] lg:text-[54px] lg:leading-[64px] tracking-[-1.408px] font-normal text-[var(--mkt-accent)]">Every time.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="w-full lg:w-[683px] pt-[19px] flex flex-col gap-[10px]"
          >
            <p className="text-[20px] leading-[24px] text-white tracking-[-0.165px]">
              AI coding agents can build entire features from a one-line prompt. But every UI they generate looks generic, wrong colours, wrong spacing, wrong type scale.
            </p>
            <p className="text-[15px] leading-[24px] text-[var(--mkt-text-secondary)] tracking-[-0.165px]">
              Your design system lives in Figma. Your AI agent can&apos;t see it. Every component it builds is a guess. Every colour is a hallucination. Every spacing value is made up.
            </p>
            <p className="text-[15px] leading-[24px] text-[var(--mkt-text-secondary)] tracking-[-0.165px]">
              This is the context gap, the invisible wall between your design system and your AI tools.
            </p>
            <p className="text-[15px] leading-[24px] text-[var(--mkt-text-secondary)] tracking-[-0.165px]">
              Designers spend hours correcting AI output that ignores their system. Developers ship components that look &apos;close enough.&apos; The brand erodes one commit at a time.
            </p>
            <p className="text-[15px] leading-[24px] text-[var(--mkt-text-secondary)] tracking-[-0.165px]">
              <span className="text-[var(--mkt-accent)]">Layout</span> is the compiler that closes it.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Desktop */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="hidden md:block w-[1280px] max-w-full mx-auto aspect-[1280/810] relative overflow-hidden rounded-[6px]"
      >
        <img
          src="/marketing/aurora-context-gap.webp"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />
        <div className="absolute inset-3 lg:inset-5">
          <MockFrame ariaLabel="Without Layout vs with Layout — same prompt, different output">
            <ContextGapMock />
          </MockFrame>
        </div>
      </motion.div>
      {/* Mobile */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
        className="md:hidden w-full max-w-[420px] mx-auto aspect-[3/4] relative px-4"
      >
        <div className="relative w-full h-full">
          <MockFrame ariaLabel="Without Layout vs with Layout — mobile preview">
            <ContextGapMobileMock />
          </MockFrame>
        </div>
      </motion.div>
    </section>
  );
}
