'use client';

import { motion } from 'framer-motion';

export function TeamsSection() {
  return (
    <section className="bg-[var(--mkt-bg)] pt-[100px] lg:pt-[180px] flex flex-col items-center ">
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
            <p className="text-[28px] leading-[34px] md:text-[40px] md:leading-[48px] lg:text-[54px] lg:leading-[64px] tracking-[-1.408px] font-normal text-[var(--mkt-accent)]">Enforced everywhere.</p>
          </div>

          <div className="w-full lg:w-[683px] pt-[19px] flex flex-col gap-[10px]">
            <p className="text-[20px] leading-[24px] text-white tracking-[-0.165px]">
              Layout is built for teams, not just the developer who set it up. One extracted design system, shared by every developer and every agent in the org.
            </p>
            <p className="text-[15px] leading-[24px] text-[var(--mkt-text-secondary)] tracking-[-0.165px]">
              Live requests sync across your organisation through a shared cloud queue. A designer pins a request in Layout Live, a teammate adopts it in theirs, and the Live Requests page in the Studio dashboard shows every request and what the agent did with it.
            </p>
            <p className="text-[15px] leading-[24px] text-[var(--mkt-text-secondary)] tracking-[-0.165px]">
              Nothing off-system reaches main. Run <span className="font-mono text-[13px]">check --ci</span> in your pipeline and pull requests get annotated with every violation, with the merge gated on the result. Roles, invitations and per-project scoping keep the system owned by the people who own the design.
            </p>
            <p className="text-[15px] leading-[24px] text-[var(--mkt-accent)] tracking-[-0.165px]">
              The design system stops being advice. It becomes policy.
            </p>
          </div>
        </motion.div>
      </div>

    </section>
  );
}
