'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { MockFrame } from '@/components/marketing/MockFrame';
import { ExplorerMock } from '@/components/marketing/mocks/ExplorerMock';
import { ExplorerMobileMock } from '@/components/marketing/mocks/ExplorerMobileMock';

export function ExplorerSection() {
  return (
    <section className="bg-[var(--mkt-bg)] pt-[100px] lg:pt-[180px] flex flex-col items-center gap-[70px]">
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
            Explore variants{' '}
            <span className="text-[var(--mkt-accent)]">
              when you need them.
            </span>
          </h2>

          <div className="w-full lg:w-[575px] pt-[19px] flex flex-col gap-[10px]">
            <p className="text-[20px] leading-[24px] text-white tracking-[-0.165px]">
              Explorer generates multiple on-system variations of a component or page from one prompt, each scored for compliance.
            </p>
            <p className="text-[15px] leading-[24px] text-[var(--mkt-text-secondary)] tracking-[-0.165px]">
              Pick a direction, refine it, then push it to Figma or promote it to your component library.
            </p>
          </div>
        </motion.div>
      </div>

      <motion.div
        className="hidden md:block w-[1280px] max-w-full mx-auto aspect-[1280/810] relative overflow-hidden rounded-[6px]"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <Image
          src="/marketing/aurora-explorer.webp"
          alt=""
          fill
          className="object-cover"
          aria-hidden="true"
        />
        <div className="absolute inset-3 lg:inset-5">
          <MockFrame ariaLabel="Explorer six-variant grid">
            <ExplorerMock />
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
        <MockFrame ariaLabel="Explorer — mobile preview">
          <ExplorerMobileMock />
        </MockFrame>
      </motion.div>
    </section>
  );
}
