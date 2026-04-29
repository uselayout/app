'use client';

import { motion } from 'framer-motion';
import { MockFrame } from '@/components/marketing/MockFrame';
import { CompletenessMock } from '@/components/marketing/mocks/CompletenessMock';
import { CompletenessMobileMock } from '@/components/marketing/mocks/CompletenessMobileMock';

export function CompletenessSection() {
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
            <p className="text-[28px] leading-[34px] md:text-[40px] md:leading-[48px] lg:text-[54px] lg:leading-[64px] tracking-[-1.408px] font-normal text-[var(--mkt-text-primary)]">Not just extracted.</p>
            <p className="text-[28px] leading-[34px] md:text-[40px] md:leading-[48px] lg:text-[54px] lg:leading-[64px] tracking-[-1.408px] font-normal text-[var(--mkt-text-primary)]">Scored. Improved.</p>
            <p className="text-[28px] leading-[34px] md:text-[40px] md:leading-[48px] lg:text-[54px] lg:leading-[64px] tracking-[-1.408px] font-normal text-[var(--mkt-accent)]">On every run.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="w-full lg:w-[683px] pt-[19px] flex flex-col gap-[10px]"
          >
            <p className="text-[20px] leading-[24px] text-white tracking-[-0.165px]">
              A half-complete design system gives your AI half the context. It fills the gaps with guesses — and you&apos;re back to the wrong colours, the wrong spacing, the wrong type scale.
            </p>
            <p className="text-[15px] leading-[24px] text-[var(--mkt-text-secondary)] tracking-[-0.165px]">
              Every layout.md gets a completeness score across six weighted sections: Quick Reference, Colours, Typography, Spacing, Components, Anti-patterns. You see exactly where the gaps are before the AI does.
            </p>
            <p className="text-[15px] leading-[24px] text-[var(--mkt-text-secondary)] tracking-[-0.165px]">
              Layout surfaces specific suggestions — not vague warnings. &quot;Your component inventory is missing interactive states.&quot; &quot;No spacing scale defined.&quot; Fix them in the editor, or re-extract from a more complete source.
            </p>
            <p className="text-[15px] leading-[24px] text-[var(--mkt-accent)] tracking-[-0.165px]">
              0 to 100. You decide when it&apos;s ready.
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
          src="/marketing/aurora-completeness.webp"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />
        <div className="absolute inset-3 lg:inset-5">
          <MockFrame ariaLabel="Completeness score and breakdown">
            <CompletenessMock />
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
        <MockFrame ariaLabel="Completeness — mobile preview">
          <CompletenessMobileMock />
        </MockFrame>
      </motion.div>
    </section>
  );
}
