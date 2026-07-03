import type { Metadata } from "next";
import Link from "next/link";
import { Blocks, Palette, Bot } from "lucide-react";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { CopyBlock } from "@/components/shared/CopyBlock";
import { LAYOUT_UI_URL } from "@/lib/marketing/layout-ui";

export const metadata: Metadata = {
  title: "Layout UI: the reskinnable component system | Layout",
  description:
    "54 Base UI components built on a shared token contract. Pick any gallery kit and the whole system reskins. Every component ships rules an AI agent can follow. Open source, MIT licensed.",
  openGraph: {
    title: "Layout UI: the reskinnable component system",
    description:
      "One component system, every brand. 54 components, a full token contract, and per-component rules for AI agents. Every gallery kit is an installable theme.",
    type: "website",
  },
};

const FEATURES = [
  {
    icon: Blocks,
    title: "Token contract",
    body: "Every component consumes semantic --layout-* tokens only, never a hardcoded colour or spacing value. Swap the tokens and the components follow, no code changes required.",
  },
  {
    icon: Palette,
    title: "Every kit is a theme",
    body: "All 58 kits published to the Gallery double as installable Layout UI themes. Point the shadcn CLI at a theme.json and your whole app reskins to that brand.",
  },
  {
    icon: Bot,
    title: "Rules for AI agents",
    body: "Each component ships a machine-readable spec: which tokens it uses, what it should never do, and how it composes with the rest of the system. Agents follow the rules instead of guessing.",
  },
] as const;

export default function LayoutUIPage() {
  return (
    <div className="dark">
      <div className="relative z-10 bg-[var(--mkt-bg)] text-[var(--mkt-text-primary)]">
        <MarketingHeader />
        <main>
          {/* Hero */}
          <section className="mx-auto flex max-w-[1280px] flex-col items-center px-6 pt-[120px] pb-[80px] text-center lg:pt-[180px]">
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--mkt-border)] px-3 py-1 text-[13px] text-[var(--mkt-text-secondary)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--mkt-accent)]" />
              Layout UI · open source, MIT licensed
            </span>
            <h1 className="max-w-[820px] text-[40px] leading-[46px] tracking-[-1.4px] md:text-[64px] md:leading-[68px]">
              One component system. Every brand.
            </h1>
            <p className="mt-5 max-w-[640px] text-[18px] leading-[28px] text-[var(--mkt-text-secondary)]">
              54 components built on Base UI, all consuming a shared token
              contract. Pick any gallery kit and the whole system reskins, no
              component code changes. Every component ships rules an AI agent
              can actually follow.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <a
                href={LAYOUT_UI_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-full bg-[var(--mkt-btn-primary-bg)] px-6 py-3 text-[15px] font-medium text-[var(--mkt-bg)] transition-opacity hover:opacity-90"
              >
                Explore components
              </a>
              <a
                href={`${LAYOUT_UI_URL}/create`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-full border border-[var(--mkt-border-strong)] px-6 py-3 text-[15px] font-medium text-[var(--mkt-text-primary)] transition-colors hover:bg-white/5"
              >
                Create your theme
              </a>
            </div>
          </section>

          {/* Feature row */}
          <section className="mx-auto max-w-[1280px] px-6 pb-[80px]">
            <div className="grid grid-cols-1 gap-px overflow-hidden rounded-[10px] border border-[var(--mkt-border)] bg-[var(--mkt-border)] sm:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, body }) => (
                <div key={title} className="bg-[var(--mkt-bg)] p-7">
                  <Icon className="mb-4 h-5 w-5 text-[var(--mkt-accent)]" />
                  <h3 className="mb-2 text-[18px] tracking-[-0.2px]">{title}</h3>
                  <p className="text-[15px] leading-[24px] text-[var(--mkt-text-secondary)]">
                    {body}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Install */}
          <section className="mx-auto max-w-[1280px] px-6 pb-[80px]">
            <h2 className="mb-2 text-[28px] leading-[34px] tracking-[-0.8px] md:text-[40px] md:leading-[48px]">
              Two ways to install.
            </h2>
            <p className="mb-10 max-w-[560px] text-[15px] leading-[24px] text-[var(--mkt-text-secondary)]">
              Add a single component with our CLI, or install an entire brand
              as a theme with the shadcn CLI. Both read the same registry
              spec.
            </p>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="flex flex-col rounded-[10px] border border-[var(--mkt-border)] p-6">
                <h3 className="mb-2 text-[17px] tracking-[-0.2px]">
                  Add a component
                </h3>
                <p className="mb-4 flex-1 text-[14px] leading-[22px] text-[var(--mkt-text-secondary)]">
                  Our CLI drops the component source straight into your
                  project, wired up to your existing tokens.
                </p>
                <CopyBlock code="npx @layoutdesign/context add button" />
              </div>
              <div className="flex flex-col rounded-[10px] border border-[var(--mkt-border)] p-6">
                <h3 className="mb-2 text-[17px] tracking-[-0.2px]">
                  Install a theme
                </h3>
                <p className="mb-4 flex-1 text-[14px] leading-[22px] text-[var(--mkt-text-secondary)]">
                  Point the shadcn CLI at any published kit&apos;s
                  theme.json and reskin your whole app to that brand.
                </p>
                <CopyBlock code="npx shadcn add https://layout.design/r/stripe/theme.json" />
              </div>
            </div>
          </section>

          {/* How it fits */}
          <section className="mx-auto max-w-[1280px] px-6 pb-[120px]">
            <div className="rounded-[10px] border border-[var(--mkt-border)] p-8">
              <h2 className="mb-6 text-[22px] tracking-[-0.3px]">
                How it fits together
              </h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div>
                  <p className="mb-1 text-[13px] uppercase tracking-[1.2px] text-[var(--mkt-text-muted)]">
                    01
                  </p>
                  <h3 className="mb-2 text-[16px] tracking-[-0.2px]">
                    Extract in Studio
                  </h3>
                  <p className="text-[14px] leading-[22px] text-[var(--mkt-text-secondary)]">
                    Pull tokens from Figma or a live site into a Layout Studio
                    project.
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-[13px] uppercase tracking-[1.2px] text-[var(--mkt-text-muted)]">
                    02
                  </p>
                  <h3 className="mb-2 text-[16px] tracking-[-0.2px]">
                    Publish a kit
                  </h3>
                  <p className="text-[14px] leading-[22px] text-[var(--mkt-text-secondary)]">
                    Share it to the Gallery. Layout UI auto-generates a theme
                    from the kit&apos;s tokens.
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-[13px] uppercase tracking-[1.2px] text-[var(--mkt-text-muted)]">
                    03
                  </p>
                  <h3 className="mb-2 text-[16px] tracking-[-0.2px]">
                    Theme and build anywhere
                  </h3>
                  <p className="text-[14px] leading-[22px] text-[var(--mkt-text-secondary)]">
                    Install the theme and components in any project, then let
                    your AI agent build with the rules attached.
                  </p>
                </div>
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/gallery"
                  className="inline-flex items-center rounded-full bg-[var(--mkt-btn-primary-bg)] px-5 py-2.5 text-[14px] font-medium text-[var(--mkt-bg)] transition-opacity hover:opacity-90"
                >
                  Browse the Kit Gallery
                </Link>
                <Link
                  href="/docs/layout-ui"
                  className="inline-flex items-center rounded-full border border-[var(--mkt-border-strong)] px-5 py-2.5 text-[14px] text-[var(--mkt-text-primary)] hover:bg-white/5"
                >
                  Read the docs
                </Link>
              </div>
            </div>
          </section>
        </main>
      </div>
      <MarketingFooter />
    </div>
  );
}
