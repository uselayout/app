'use client';

import { motion } from 'framer-motion';
import { MockFrame } from '@/components/marketing/MockFrame';
import { ExtractMock } from '@/components/marketing/mocks/ExtractMock';
import { ExtractMobileMock } from '@/components/marketing/mocks/ExtractMobileMock';

/**
 * The extract → serve pipeline in one section. Merges the old ExtractSection,
 * ServeSection and CompletenessSection: extraction is table-stakes now, so it
 * gets one scroll, not three.
 */
export function PipelineSection() {
  return (
    <section id="products" className="bg-[var(--mkt-bg)] pt-[100px] lg:pt-[180px] flex flex-col items-center gap-[70px] scroll-mt-[72px]">
      <div id="how-it-works" className="max-w-[1280px] w-full px-6 scroll-mt-[72px]">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between w-full">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="w-full lg:max-w-[509px]"
          >
            <p className="text-[28px] leading-[34px] md:text-[40px] md:leading-[48px] lg:text-[54px] lg:leading-[64px] tracking-[-1.408px] font-normal text-[var(--mkt-text-primary)]">Your design system in.</p>
            <p className="text-[28px] leading-[34px] md:text-[40px] md:leading-[48px] lg:text-[54px] lg:leading-[64px] tracking-[-1.408px] font-normal text-[var(--mkt-text-primary)]">Unmetered context out.</p>
            <p className="text-[28px] leading-[34px] md:text-[40px] md:leading-[48px] lg:text-[54px] lg:leading-[64px] tracking-[-1.408px] font-normal text-[var(--mkt-accent)]">Two commands.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="w-full lg:w-[683px] pt-[19px] flex flex-col gap-[10px]"
          >
            <p className="text-[20px] leading-[24px] text-white tracking-[-0.165px]">
              Connect a Figma file or paste any live URL. Layout extracts colour, typography, spacing, effects and component inventory &mdash; actual values, not metadata &mdash; into a structured layout.md built for LLM consumption.
            </p>
            <p className="text-[15px] leading-[24px] text-[var(--mkt-text-secondary)] tracking-[-0.165px]">
              Every extraction is scored 0&ndash;100 for completeness across six weighted sections, with specific suggestions to close the gaps. You see what&apos;s missing before the AI fills it with guesses.
            </p>
            <p className="text-[15px] leading-[24px] text-[var(--mkt-text-secondary)] tracking-[-0.165px]">
              Then run install. Layout auto-configures MCP for Claude Code, Cursor, Windsurf, Copilot, Codex and Gemini CLI, and 23 tools put your design system on every prompt: query tokens, check compliance, preview components, push to Figma.
            </p>
            <p className="text-[15px] leading-[24px] text-[var(--mkt-accent)] tracking-[-0.165px]">
              Extract once. Unlimited local context. No per-call metering, no seat requirement.
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
          src="/marketing/aurora-extract.webp"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />
        <div className="absolute inset-3 lg:inset-5">
          <MockFrame ariaLabel="Extraction in progress with live layout.md">
            <ExtractMock />
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
        <MockFrame ariaLabel="Extraction in progress — mobile preview">
          <ExtractMobileMock />
        </MockFrame>
      </motion.div>
    </section>
  );
}
