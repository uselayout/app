'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import { detectSourceType, normaliseUrl } from '@/lib/util/detect-source';
import { capture } from '@/lib/analytics';
import { MockFrame } from '@/components/marketing/MockFrame';
import { HeroMock } from '@/components/marketing/mocks/HeroMock';
import { HeroMobileMock } from '@/components/marketing/mocks/HeroMobileMock';

const TOOL_ICONS: { name: string; src: string }[] = [
  { name: 'Claude', src: '/marketing/icons/claude.svg' },
  { name: 'Cursor', src: '/marketing/icons/cursor.svg' },
  { name: 'OpenAI', src: '/marketing/icons/openai.svg' },
  { name: 'Windsurf', src: '/marketing/icons/windsurf.svg' },
  { name: 'GitHub Copilot', src: '/marketing/icons/copilot.svg' },
  { name: 'Google Antigravity', src: '/marketing/icons/antigravity.svg' },
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
  const router = useRouter();
  const [extractUrl, setExtractUrl] = useState('');

  const extractValid = extractUrl.trim().length > 0 && detectSourceType(extractUrl) !== null;

  const handleExtract = (e: React.FormEvent) => {
    e.preventDefault();
    if (!extractValid) return;
    const url = normaliseUrl(extractUrl);
    capture('hero_extract_submitted', {
      source: detectSourceType(extractUrl) ?? 'unknown',
      logged_in: isLoggedIn,
    });
    if (isLoggedIn) {
      // /studio resolves the user's org, then forwards ?extract= to the
      // dashboard, which opens NewExtractionModal pre-filled with the URL.
      router.push(`/studio?extract=${encodeURIComponent(url)}`);
    } else {
      // Stash the URL so the dashboard picks it up after signup/login,
      // whichever route the user takes through the beta gate.
      try {
        localStorage.setItem('layout:pending-extract', url);
      } catch {
        // localStorage unavailable: the query param below still covers signup.
      }
      router.push(`/signup?extract=${encodeURIComponent(url)}`);
    }
  };

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
          AI agents finally know your design system. Layout makes them follow it.
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          {...fadeUp}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.0, 0.0, 0.2, 1] }}
          viewport={viewportConfig}
          className="text-[15px] leading-[24px] tracking-[-0.165px] text-[var(--mkt-text-secondary)] max-w-full lg:max-w-[862px]"
        >
          Extract your design system from Figma or any live website. Serve it to Claude Code,
          Cursor, Copilot and Codex, unmetered, in your repo. Then gate every AI edit to your
          tokens with Layout Live.
        </motion.p>

        <motion.p
          {...fadeUp}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.0, 0.0, 0.2, 1] }}
          viewport={viewportConfig}
          className="text-[14px] leading-[24px] tracking-[-0.165px] text-[var(--mkt-accent)]"
        >
          Context is solved. Enforcement is the product.
        </motion.p>

        {/* URL extract input: the golden path is the hero */}
        <motion.form
          {...fadeUp}
          transition={{ duration: 0.6, delay: 0.18, ease: [0.0, 0.0, 0.2, 1] }}
          viewport={viewportConfig}
          onSubmit={handleExtract}
          className="flex w-full max-w-[640px] flex-col gap-3 sm:flex-row sm:items-center"
        >
          <input
            type="text"
            value={extractUrl}
            onChange={(e) => setExtractUrl(e.target.value)}
            placeholder="https://your-site.com or Figma file URL"
            aria-label="Website or Figma file URL"
            className="h-[44px] flex-1 rounded-[4px] border border-[var(--mkt-btn-secondary-border)] bg-[var(--mkt-btn-secondary-bg)] px-4 text-[15px] text-[var(--mkt-text-primary)] placeholder:text-[var(--mkt-text-muted)] outline-none transition-colors duration-150 focus:border-[var(--mkt-accent)]"
          />
          <button
            type="submit"
            disabled={!extractValid}
            className="inline-flex h-[44px] items-center justify-center whitespace-nowrap rounded-[4px] border border-[#e6e6e6] bg-[var(--mkt-btn-primary-bg)] px-[20px] text-[15px] font-medium text-[var(--mkt-btn-primary-text)] shadow-[0px_8px_2px_0px_rgba(0,0,0,0),0px_5px_2px_0px_rgba(0,0,0,0.01),0px_3px_2px_0px_rgba(0,0,0,0.04),0px_1px_1px_0px_rgba(0,0,0,0.07),0px_0px_1px_0px_rgba(0,0,0,0.08)] transition-opacity duration-150 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Extract my design system
          </button>
        </motion.form>

        {/* CTA row */}
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.0, 0.0, 0.2, 1] }}
          viewport={viewportConfig}
          className="flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:gap-[40px]"
        >
          {/* Button group */}
          <div className="flex flex-wrap items-center gap-3">
            {isLoggedIn ? (
              <>
                <Link
                  href="/studio"
                  className="inline-flex items-center justify-center bg-[var(--mkt-btn-primary-bg)] text-[var(--mkt-btn-primary-text)] h-[40px] px-[17px] rounded-[4px] text-[15px] font-medium border border-[#e6e6e6] shadow-[0px_8px_2px_0px_rgba(0,0,0,0),0px_5px_2px_0px_rgba(0,0,0,0.01),0px_3px_2px_0px_rgba(0,0,0,0.04),0px_1px_1px_0px_rgba(0,0,0,0.07),0px_0px_1px_0px_rgba(0,0,0,0.08)] hover:opacity-90 transition-opacity duration-150"
                >
                  Open Studio →
                </Link>
                <button
                  onClick={onInstallCLI}
                  className="inline-flex items-center justify-center bg-[var(--mkt-btn-secondary-bg)] border border-[var(--mkt-btn-secondary-border)] text-[var(--mkt-text-primary)] h-[40px] px-[17px] rounded-[4px] text-[15px] font-medium hover:opacity-80 transition-opacity duration-150"
                >
                  Install CLI
                </button>
              </>
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
                  className="inline-flex items-center justify-center bg-[var(--mkt-btn-secondary-bg)] border border-[var(--mkt-btn-secondary-border)] text-[var(--mkt-text-primary)] h-[40px] px-[17px] rounded-[4px] text-[15px] font-medium hover:opacity-80 transition-opacity duration-150"
                >
                  Install CLI
                </button>
              </>
            )}
            <Link
              href="/live"
              className="inline-flex items-center justify-center bg-[var(--mkt-btn-secondary-bg)] border border-[var(--mkt-btn-secondary-border)] text-[var(--mkt-text-primary)] h-[40px] px-[17px] rounded-[4px] text-[15px] font-medium hover:opacity-80 transition-opacity duration-150"
            >
              Download Layout Live
            </Link>
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

        {/* Desktop: full Studio frame. Hidden below md (768px). */}
        <div className="hidden md:block relative z-10 aspect-[1280/810] w-full">
          <MockFrame ariaLabel="Layout Studio explorer demo">
            <HeroMock />
          </MockFrame>
        </div>
        {/* Mobile: curated single-variant card with mini chrome. Studio is desktop-only;
            this shows the strongest moment of Explorer rather than shrinking the full frame. */}
        <div className="md:hidden relative z-10 aspect-[3/4] w-full max-w-[420px] mx-auto">
          <MockFrame ariaLabel="Layout Studio explorer — mobile preview">
            <HeroMobileMock />
          </MockFrame>
        </div>
      </div>
    </section>
  );
}
