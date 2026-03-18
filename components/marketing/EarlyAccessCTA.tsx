'use client';

import { motion } from 'framer-motion';
import { useSession } from '@/lib/auth-client';

const BETA_ACTIVE = process.env.NEXT_PUBLIC_BETA_INVITE_REQUIRED === 'true';

export function EarlyAccessCTA({ onInstallCLI }: { onInstallCLI?: () => void }) {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;

  return (
    <section id="contact" className="pb-[80px] pt-[100px] lg:pt-[180px] flex flex-col items-center gap-[70px] scroll-mt-[72px]">
      <div className="max-w-[1280px] w-full px-6">
        <motion.div
          className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between w-full"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2
            className="text-[28px] leading-[34px] md:text-[40px] md:leading-[48px] lg:text-[54px] lg:leading-[64px] tracking-[-1.408px] font-normal text-[var(--mkt-text-primary)] w-full lg:w-[485px]"
          >
            Give your AI{' '}
            <span className="text-[var(--mkt-accent)]">
              perfect taste.
            </span>
          </h2>

          <div className="w-full lg:w-[575px] flex flex-col gap-8 lg:gap-[64px]">
            <div className="pt-[19px] flex flex-col gap-[10px]">
              <p className="text-[20px] leading-[24px] text-white tracking-[-0.165px]">
                Layout is in early access. Join the teams shipping AI-built UI that actually looks right — and help shape what we build next.
              </p>
              <div className="flex flex-col gap-0">
                <p className="text-[15px] leading-[24px] text-[var(--mkt-text-secondary)] tracking-[-0.165px]">
                  → Direct founder access via Slack
                </p>
                <p className="text-[15px] leading-[24px] text-[var(--mkt-text-secondary)] tracking-[-0.165px]">
                  → First look at every feature before public release
                </p>
                <p className="text-[15px] leading-[24px] text-[var(--mkt-text-secondary)] tracking-[-0.165px]">
                  → Founding member pricing — locked in permanently
                </p>
                <p className="text-[15px] leading-[24px] text-[var(--mkt-text-secondary)] tracking-[-0.165px]">
                  → Direct input on the roadmap
                </p>
              </div>
            </div>

            <div className="flex gap-[12px]">
              {isLoggedIn ? (
                <a
                  href="/studio"
                  className="bg-[var(--mkt-btn-primary-bg)] border border-[#e6e6e6] text-[var(--mkt-btn-primary-text)] h-[40px] px-[17px] rounded-[4px] text-[15px] font-medium shadow-[0px_8px_2px_0px_rgba(0,0,0,0),0px_5px_2px_0px_rgba(0,0,0,0.01),0px_3px_2px_0px_rgba(0,0,0,0.04),0px_1px_1px_0px_rgba(0,0,0,0.07),0px_0px_1px_0px_rgba(0,0,0,0.08)] inline-flex items-center justify-center"
                >
                  Open Studio →
                </a>
              ) : BETA_ACTIVE ? (
                <>
                  <a
                    href="/request-access"
                    className="bg-[var(--mkt-btn-primary-bg)] border border-[#e6e6e6] text-[var(--mkt-btn-primary-text)] h-[40px] px-[17px] rounded-[4px] text-[15px] font-medium shadow-[0px_8px_2px_0px_rgba(0,0,0,0),0px_5px_2px_0px_rgba(0,0,0,0.01),0px_3px_2px_0px_rgba(0,0,0,0.04),0px_1px_1px_0px_rgba(0,0,0,0.07),0px_0px_1px_0px_rgba(0,0,0,0.08)] inline-flex items-center justify-center"
                  >
                    Request Early Access →
                  </a>
                  <a
                    href="/signup"
                    className="inline-flex bg-[var(--mkt-btn-secondary-bg)] border border-[var(--mkt-btn-secondary-border)] text-[var(--mkt-text-primary)] h-[40px] px-[17px] rounded-[4px] text-[15px] font-medium items-center justify-center"
                  >
                    Got an invite code? →
                  </a>
                </>
              ) : (
                <>
                  <a
                    href="/signup"
                    className="bg-[var(--mkt-btn-primary-bg)] border border-[#e6e6e6] text-[var(--mkt-btn-primary-text)] h-[40px] px-[17px] rounded-[4px] text-[15px] font-medium shadow-[0px_8px_2px_0px_rgba(0,0,0,0),0px_5px_2px_0px_rgba(0,0,0,0.01),0px_3px_2px_0px_rgba(0,0,0,0.04),0px_1px_1px_0px_rgba(0,0,0,0.07),0px_0px_1px_0px_rgba(0,0,0,0.08)] inline-flex items-center justify-center"
                  >
                    Join early access →
                  </a>
                  <button
                    onClick={onInstallCLI}
                    className="hidden lg:inline-flex bg-[var(--mkt-btn-secondary-bg)] border border-[var(--mkt-btn-secondary-border)] text-[var(--mkt-text-primary)] h-[40px] px-[17px] rounded-[4px] text-[15px] font-medium items-center justify-center"
                  >
                    Install the free CLI
                  </button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
