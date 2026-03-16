'use client';

import { motion } from 'framer-motion';

export function TeamsSection() {
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
          <div className="w-full lg:max-w-[509px]">
            <p className="text-[28px] leading-[34px] md:text-[40px] md:leading-[48px] lg:text-[54px] lg:leading-[64px] tracking-[-1.408px] font-normal text-[var(--mkt-text-primary)]">One design system.</p>
            <p className="text-[28px] leading-[34px] md:text-[40px] md:leading-[48px] lg:text-[54px] lg:leading-[64px] tracking-[-1.408px] font-normal text-[var(--mkt-text-primary)]">Every developer.</p>
            <p className="text-[28px] leading-[34px] md:text-[40px] md:leading-[48px] lg:text-[54px] lg:leading-[64px] tracking-[-1.408px] font-normal text-[var(--mkt-accent)]">One source of truth.</p>
          </div>

          <div className="w-full lg:w-[683px] pt-[19px] flex flex-col gap-[10px]">
            <p className="text-[20px] leading-[24px] text-white tracking-[-0.165px]">
              Layout is built for teams, not just the developer who set it up.
            </p>
            <p className="text-[15px] leading-[24px] text-[var(--mkt-text-secondary)] tracking-[-0.165px]">
              Organisations share a single extracted design system. Every AI agent on the team reads the same context. One member updates the source in Figma; everyone&apos;s next prompt reflects it.
            </p>
            <p className="text-[15px] leading-[24px] text-[var(--mkt-text-secondary)] tracking-[-0.165px]">
              Roles, invitations, per-project scoping. The person who owns the design system controls it. Everyone else benefits from it without touching it.
            </p>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="w-[1424px] max-w-full mx-auto aspect-[1424/768] relative overflow-hidden rounded-[6px]"
      >
        <img
          src="/marketing/aurora-teams.webp"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />
        <div className="absolute left-0 top-0 w-full overflow-hidden px-4 lg:px-[60px] h-[93.75%]">
          <div className="bg-white w-full h-full overflow-hidden relative">
            <video
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover"
              aria-label="Teams collaboration demo"
            />
          </div>
        </div>
      </motion.div>
    </section>
  );
}
