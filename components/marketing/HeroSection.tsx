'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useSession } from '@/lib/auth-client';
import { MarketingVideo } from '@/components/marketing/MarketingVideo';

const TOOL_ICONS: { name: string; src: string }[] = [
  { name: 'Claude', src: '/marketing/icons/claude.svg' },
  { name: 'Cursor', src: '/marketing/icons/cursor.svg' },
  { name: 'OpenAI', src: '/marketing/icons/openai.svg' },
  { name: 'Windsurf', src: '/marketing/icons/windsurf.svg' },
  { name: 'GitHub Copilot', src: '/marketing/icons/copilot.svg' },
];

const BETA_ACTIVE = process.env.NEXT_PUBLIC_BETA_INVITE_REQUIRED === 'true';

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
};

const viewportConfig = { once: true };

export function HeroSection({ onInstallCLI }: { onInstallCLI?: () => void }) {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;

  return (
    <section className="w-full bg-[var(--mkt-bg)] pt-[100px] lg:pt-[180px] flex flex-col items-center gap-[70px]">
      {/* Content */}
      <div className="max-w-[1280px] w-full px-6 flex flex-col gap-[26px]">
        {/* Heading */}
        <motion.h1
          {...fadeUp}
          transition={{ duration: 0.6, ease: [0.0, 0.0, 0.2, 1] }}
          viewport={viewportConfig}
          className="text-[32px] leading-[36px] md:text-[48px] md:leading-[52px] lg:text-[64px] lg:leading-[64px] tracking-[-1.408px] text-[var(--mkt-text-primary)] font-normal max-w-[950px]"
        >
          The compiler between design systems and AI coding agents
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          {...fadeUp}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.0, 0.0, 0.2, 1] }}
          viewport={viewportConfig}
          className="text-[15px] leading-[24px] tracking-[-0.165px] text-[var(--mkt-text-secondary)] max-w-full lg:max-w-[862px]"
        >
          Your AI agent writes working code but gets the design wrong. Layout extracts your design
          system from Figma or any website and serves it to Claude Code, Cursor, and Codex
          automatically.
        </motion.p>

        {/* CTA row */}
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.0, 0.0, 0.2, 1] }}
          viewport={viewportConfig}
          className="flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:gap-[40px]"
        >
          {/* Button group */}
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Link
                href="/studio"
                className="inline-flex items-center justify-center bg-[var(--mkt-btn-primary-bg)] text-[var(--mkt-btn-primary-text)] h-[40px] px-[17px] rounded-[4px] text-[15px] font-medium border border-[#e6e6e6] shadow-[0px_8px_2px_0px_rgba(0,0,0,0),0px_5px_2px_0px_rgba(0,0,0,0.01),0px_3px_2px_0px_rgba(0,0,0,0.04),0px_1px_1px_0px_rgba(0,0,0,0.07),0px_0px_1px_0px_rgba(0,0,0,0.08)] hover:opacity-90 transition-opacity duration-150"
              >
                Open Studio →
              </Link>
            ) : BETA_ACTIVE ? (
              <>
                <Link
                  href="/request-access"
                  className="inline-flex items-center justify-center bg-[var(--mkt-btn-primary-bg)] text-[var(--mkt-btn-primary-text)] h-[40px] px-[17px] rounded-[4px] text-[15px] font-medium border border-[#e6e6e6] shadow-[0px_8px_2px_0px_rgba(0,0,0,0),0px_5px_2px_0px_rgba(0,0,0,0.01),0px_3px_2px_0px_rgba(0,0,0,0.04),0px_1px_1px_0px_rgba(0,0,0,0.07),0px_0px_1px_0px_rgba(0,0,0,0.08)] hover:opacity-90 transition-opacity duration-150"
                >
                  Request Early Access
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center bg-[var(--mkt-btn-secondary-bg)] border border-[var(--mkt-btn-secondary-border)] text-[var(--mkt-text-primary)] h-[40px] px-[17px] rounded-[4px] text-[15px] font-medium hover:opacity-80 transition-opacity duration-150"
                >
                  Got an invite code? →
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center bg-[var(--mkt-btn-primary-bg)] text-[var(--mkt-btn-primary-text)] h-[40px] px-[17px] rounded-[4px] text-[15px] font-medium border border-[#e6e6e6] shadow-[0px_8px_2px_0px_rgba(0,0,0,0),0px_5px_2px_0px_rgba(0,0,0,0.01),0px_3px_2px_0px_rgba(0,0,0,0.04),0px_1px_1px_0px_rgba(0,0,0,0.07),0px_0px_1px_0px_rgba(0,0,0,0.08)] hover:opacity-90 transition-opacity duration-150"
                >
                  Get started
                </Link>
                <button
                  onClick={onInstallCLI}
                  className="hidden lg:inline-flex items-center justify-center bg-[var(--mkt-btn-secondary-bg)] border border-[var(--mkt-btn-secondary-border)] text-[var(--mkt-text-primary)] h-[40px] px-[17px] rounded-[4px] text-[15px] font-medium hover:opacity-80 transition-opacity duration-150"
                >
                  Install CLI
                </button>
              </>
            )}
          </div>

          {/* Works with */}
          <div className="hidden lg:flex items-center gap-[17px]">
            <span className="text-[14px] text-[var(--mkt-text-muted)] tracking-[0.35px]">
              Works with
            </span>
            <div className="flex items-center gap-4">
              {TOOL_ICONS.map((tool) => (
                <img
                  key={tool.name}
                  src={tool.src}
                  alt={tool.name}
                  width={28}
                  height={28}
                  className="flex-shrink-0"
                />
              ))}
            </div>
            <span className="text-[14px] text-[var(--mkt-text-muted)] tracking-[0.35px]">
              and more
            </span>
          </div>
        </motion.div>
      </div>

      {/* Video placeholder */}
      <div className="relative w-full max-w-[1280px] px-6">
        {/* Aurora background */}
        <img
          src="/marketing/aurora-hero.webp"
          alt=""
          aria-hidden="true"
          className="absolute bottom-0 left-0 w-full pointer-events-none object-cover select-none"
          style={{ zIndex: 0 }}
        />

        {/* Video container */}
        <div className="relative z-10 aspect-[1280/810] rounded-[6px] bg-white overflow-hidden w-full">
          <MarketingVideo src="/marketing/videos/hero-demo.mp4" />
        </div>
      </div>
    </section>
  );
}
