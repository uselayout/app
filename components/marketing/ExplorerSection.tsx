'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

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
            Explore before you build.{' '}
            <span className="text-[var(--mkt-accent)]">
              Six variations in seconds.
            </span>
          </h2>

          <div className="w-full lg:w-[575px] pt-[19px] flex flex-col gap-[10px]">
            <p className="text-[20px] leading-[24px] text-white tracking-[-0.165px]">
              Every AI coding tool generates one answer. One layout. One guess. Layout Explorer generates up to six — each built on your design system.
            </p>
            <p className="text-[15px] leading-[24px] text-[var(--mkt-text-secondary)] tracking-[-0.165px]">
              Describe what you need. Explorer creates distinct variations: different layouts, different visual weight, different density. All on-brand. Pick the one that works.
            </p>
            <p className="text-[15px] leading-[24px] text-[var(--mkt-text-secondary)] tracking-[-0.165px]">
              Then push it to Figma. Your designer refines in the tool they already know. Import their changes back. The design system updates. The loop continues.
            </p>
            <p className="text-[15px] leading-[24px] text-[var(--mkt-accent)] tracking-[-0.165px]">
              Better than a new canvas
            </p>
            <p className="text-[15px] leading-[24px] text-[var(--mkt-text-secondary)] tracking-[-0.165px]">
              Upload a reference image. Refine with follow-up prompts. Compare results with and without your design system. When you find the right direction, push it straight to Figma or promote it to your component library.
            </p>
          </div>
        </motion.div>
      </div>

      <motion.div
        className="w-[1424px] max-w-full mx-auto aspect-[1424/768] relative overflow-hidden rounded-[6px]"
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
        <div className="absolute left-0 top-0 w-full overflow-hidden px-4 lg:px-[60px] h-[93.75%]">
          <div className="bg-white w-full h-full overflow-hidden relative">
            <video
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover"
              aria-label="Explorer section demo"
            />
          </div>
        </div>
      </motion.div>
    </section>
  );
}
