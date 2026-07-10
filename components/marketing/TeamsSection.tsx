'use client';

import { motion } from 'framer-motion';
import { GitPullRequest, Users } from 'lucide-react';
import { STUDIO_TOKENS } from '@/components/marketing/mocks/_studio-chrome';

const T = STUDIO_TOKENS;

const REQUESTS: Array<{
  status: 'done' | 'working' | 'waiting';
  text: string;
  meta: string;
}> = [
  {
    status: 'done',
    text: 'Tighten card padding to --space-4',
    meta: 'Claude Code · note + screenshot attached',
  },
  {
    status: 'working',
    text: 'Hero CTA should use --color-primary',
    meta: 'Cursor · in progress',
  },
  {
    status: 'waiting',
    text: 'Swap footer link hover to token',
    meta: 'Pinned by Sarah · waiting for an agent',
  },
];

const REQUEST_STATUS: Record<string, { color: string; label: string }> = {
  done: { color: 'rgb(52,199,89)', label: 'Done' },
  working: { color: 'rgb(10,132,255)', label: 'Working' },
  waiting: { color: 'rgb(255,159,10)', label: 'Waiting' },
};

const VIOLATIONS = [
  { file: 'Pricing.tsx:41', found: '#6366f1', fix: '--color-primary' },
  { file: 'Button.tsx:12', found: '18px', fix: '--space-4' },
];

/** Static illustration of the shared Live request queue. */
function RequestQueueCard() {
  return (
    <div
      className="flex h-full flex-col overflow-hidden rounded-xl border"
      style={{
        backgroundColor: T.bgElevated,
        borderColor: T.borderStrong,
        color: T.textPrimary,
        fontFamily: '"Geist", "Inter", -apple-system, sans-serif',
        colorScheme: 'dark',
      }}
    >
      <div className="flex items-center gap-2 border-b px-5 py-3.5" style={{ borderColor: T.border }}>
        <Users className="h-3.5 w-3.5" style={{ color: T.brand }} />
        <span className="text-[13px] font-semibold">Live Requests</span>
        <span className="font-mono text-[10px]" style={{ color: T.textMuted }}>
          acme-org · synced across 8 seats
        </span>
      </div>
      <div className="flex flex-col gap-1.5 p-4">
        {REQUESTS.map((req) => {
          const status = REQUEST_STATUS[req.status];
          return (
            <div
              key={req.text}
              className="flex items-center gap-2.5 rounded-md border px-3 py-2.5"
              style={{ borderColor: T.border, backgroundColor: T.bgSurface }}
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: status.color }}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12px]" style={{ color: T.textPrimary }}>
                  {req.text}
                </span>
                <span className="block truncate text-[10.5px]" style={{ color: T.textMuted }}>
                  {req.meta}
                </span>
              </span>
              <span
                className="shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px]"
                style={{ color: status.color, border: `1px solid ${status.color}40` }}
              >
                {status.label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-auto border-t px-5 py-3 text-[10px]" style={{ borderColor: T.border, color: T.textMuted }}>
        Pinned in Layout Live · visible in the Studio dashboard · posts to Slack
      </div>
    </div>
  );
}

/** Static illustration of the CI merge gate on a pull request. */
function CIGateCard() {
  return (
    <div
      className="flex h-full flex-col overflow-hidden rounded-xl border"
      style={{
        backgroundColor: T.bgElevated,
        borderColor: T.borderStrong,
        color: T.textPrimary,
        fontFamily: '"Geist", "Inter", -apple-system, sans-serif',
        colorScheme: 'dark',
      }}
    >
      <div className="flex items-center gap-2 border-b px-5 py-3.5" style={{ borderColor: T.border }}>
        <GitPullRequest className="h-3.5 w-3.5" style={{ color: T.brand }} />
        <span className="text-[13px] font-semibold">feat: pricing page refresh</span>
        <span className="font-mono text-[10px]" style={{ color: T.textMuted }}>
          #482
        </span>
      </div>
      <div className="flex flex-col gap-1.5 p-4">
        <div
          className="flex items-center gap-2.5 rounded-md border px-3 py-2.5"
          style={{ borderColor: 'rgba(255,69,58,0.35)', backgroundColor: 'rgba(255,69,58,0.06)' }}
        >
          <span className="text-[13px]" style={{ color: T.statusError }}>
            ✕
          </span>
          <span className="flex-1 font-mono text-[11.5px]" style={{ color: T.textPrimary }}>
            layout check --ci
          </span>
          <span className="font-mono text-[10.5px]" style={{ color: T.statusError }}>
            2 violations
          </span>
        </div>
        {VIOLATIONS.map((v) => (
          <div
            key={v.file}
            className="flex items-center gap-2.5 rounded-md border px-3 py-2.5 font-mono text-[10.5px]"
            style={{ borderColor: T.border, backgroundColor: T.bgSurface }}
          >
            <span className="min-w-0 flex-1 truncate" style={{ color: T.textSecondary }}>
              {v.file}
            </span>
            <span style={{ color: T.statusError }}>{v.found}</span>
            <span style={{ color: T.textMuted }}>→</span>
            <span style={{ color: T.statusSuccess }}>{v.fix}</span>
          </div>
        ))}
      </div>
      <div
        className="mt-auto flex items-center justify-between border-t px-5 py-3"
        style={{ borderColor: T.border }}
      >
        <span className="text-[10px]" style={{ color: T.textMuted }}>
          Off-system values never reach main.
        </span>
        <span
          className="rounded px-2 py-1 text-[10.5px] font-medium"
          style={{ backgroundColor: 'rgba(255,69,58,0.12)', color: T.statusError }}
        >
          Merge blocked
        </span>
      </div>
    </div>
  );
}

export function TeamsSection() {
  return (
    <section id="teams" className="bg-[var(--mkt-bg)] pt-[100px] lg:pt-[180px] flex flex-col items-center gap-[56px] scroll-mt-[72px]">
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

      {/* Shared queue + CI gate, side by side */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="max-w-[1280px] w-full px-6"
      >
        <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2">
          <RequestQueueCard />
          <CIGateCard />
        </div>
      </motion.div>
    </section>
  );
}
