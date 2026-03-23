'use client';

import { motion } from 'framer-motion';

export function OpenSourceSection() {
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
          <div className="w-full lg:w-[667px] py-[6px]">
            <p className="text-[28px] leading-[34px] md:text-[40px] md:leading-[48px] lg:text-[54px] lg:leading-[64px] tracking-[-1.408px] font-normal text-[var(--mkt-text-primary)]">Open source.</p>
            <p className="text-[28px] leading-[34px] md:text-[40px] md:leading-[48px] lg:text-[54px] lg:leading-[64px] tracking-[-1.408px] font-normal text-[var(--mkt-accent)]">Free forever.</p>
          </div>

          <div className="w-full lg:w-[575px] flex flex-col gap-8 lg:gap-[64px]">
            <div className="pt-[19px] flex flex-col gap-[10px]">
              <p className="text-[20px] leading-[24px] text-white tracking-[-0.165px]">
                The CLI and MCP server are MIT licensed. The Studio is AGPL-3.0. Run it locally, deploy it yourself, contribute back. No lock-in, no vendor risk.
              </p>
              <p className="text-[15px] leading-[24px] text-[var(--mkt-text-secondary)] tracking-[-0.165px]">
                Three starter kits bundled — Linear, Stripe, Notion. From npm install to your AI building on-brand in 60 seconds.
              </p>
            </div>

            <div className="flex gap-[12px] flex-wrap">
              <a
                href="https://github.com/uselayout/app"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[var(--mkt-btn-primary-bg)] border border-[#e6e6e6] text-[var(--mkt-btn-primary-text)] h-[40px] px-[17px] rounded-[4px] text-[15px] font-medium shadow-[0px_8px_2px_0px_rgba(0,0,0,0),0px_5px_2px_0px_rgba(0,0,0,0.01),0px_3px_2px_0px_rgba(0,0,0,0.04),0px_1px_1px_0px_rgba(0,0,0,0.07),0px_0px_1px_0px_rgba(0,0,0,0.08)] inline-flex items-center justify-center"
              >
                Studio on GitHub
              </a>
              <a
                href="https://github.com/uselayout/cli"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[var(--mkt-btn-primary-bg)] border border-[#e6e6e6] text-[var(--mkt-btn-primary-text)] h-[40px] px-[17px] rounded-[4px] text-[15px] font-medium shadow-[0px_8px_2px_0px_rgba(0,0,0,0),0px_5px_2px_0px_rgba(0,0,0,0.01),0px_3px_2px_0px_rgba(0,0,0,0.04),0px_1px_1px_0px_rgba(0,0,0,0.07),0px_0px_1px_0px_rgba(0,0,0,0.08)] inline-flex items-center justify-center"
              >
                CLI on GitHub
              </a>
              <a
                href="/docs/self-hosting"
                className="bg-[var(--mkt-btn-secondary-bg)] border border-[var(--mkt-btn-secondary-border)] text-[var(--mkt-text-primary)] h-[40px] px-[17px] rounded-[4px] text-[15px] font-medium inline-flex items-center justify-center"
              >
                Self-hosting docs →
              </a>
            </div>
          </div>
        </motion.div>
      </div>

    </section>
  );
}
