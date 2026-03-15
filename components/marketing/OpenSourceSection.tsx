'use client';

import { motion } from 'framer-motion';

export function OpenSourceSection() {
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
          <div className="w-full lg:w-[667px] py-[6px]">
            <p className="text-[28px] leading-[34px] md:text-[40px] md:leading-[48px] lg:text-[54px] lg:leading-[64px] tracking-[-1.408px] font-normal text-[var(--mkt-text-primary)]">Open source.</p>
            <p className="text-[28px] leading-[34px] md:text-[40px] md:leading-[48px] lg:text-[54px] lg:leading-[64px] tracking-[-1.408px] font-normal text-[var(--mkt-accent)]">Free forever.</p>
          </div>

          <div className="w-full lg:w-[575px] flex flex-col gap-8 lg:gap-[64px]">
            <div className="pt-[19px] flex flex-col gap-[10px]">
              <p className="text-[20px] leading-[24px] text-white tracking-[-0.165px]">
                The CLI and MCP server are MIT licensed. Run it locally, deploy it yourself, contribute back. No subscriptions, no lock-in, no vendor risk.
              </p>
              <p className="text-[15px] leading-[24px] text-[var(--mkt-text-secondary)] tracking-[-0.165px]">
                Three starter kits bundled — Linear, Stripe, Notion. From npm install to your AI building on-brand in 60 seconds.
              </p>
            </div>

            <div className="flex gap-[12px]">
              <a
                href="https://github.com/uselayout/studio"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[var(--mkt-btn-primary-bg)] border border-[#e6e6e6] text-[var(--mkt-btn-primary-text)] h-[40px] px-[17px] rounded-[4px] text-[15px] font-medium shadow-[0px_8px_2px_0px_rgba(0,0,0,0),0px_5px_2px_0px_rgba(0,0,0,0.01),0px_3px_2px_0px_rgba(0,0,0,0.04),0px_1px_1px_0px_rgba(0,0,0,0.07),0px_0px_1px_0px_rgba(0,0,0,0.08)] inline-flex items-center justify-center"
              >
                View on GitHub
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

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="w-[1424px] max-w-full mx-auto aspect-[1424/768] relative overflow-hidden rounded-[6px]"
      >
        <img
          src="/marketing/aurora-open-source.png"
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
              aria-label="Open source CLI demo"
            />
          </div>
        </div>
      </motion.div>
    </section>
  );
}
