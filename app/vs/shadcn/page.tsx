import type { Metadata } from "next";
import Link from "next/link";
import { LAYOUT_UI_URL } from "@/lib/marketing/layout-ui";

export const metadata: Metadata = {
  title: "Layout UI vs shadcn/ui",
  description:
    "Both are copy-in component systems on Base UI. Here's how Layout UI's token contract, per-component AI agent rules, and real-brand theme gallery compare to shadcn/ui.",
  openGraph: {
    title: "Layout UI vs shadcn/ui",
    description:
      "Same install model, same primitives. The difference is the token contract, the AI agent rules, and 58 real-brand themes instead of a couple of presets.",
    type: "website",
  },
};

const ROWS = [
  {
    aspect: "Primitives",
    layout: "Base UI under the hood.",
    shadcn: "Base UI under the hood (formerly Radix).",
  },
  {
    aspect: "Theming",
    layout:
      "A full semantic token contract. Every component maps to --layout-* tokens, so a theme swap is a token swap, nothing else.",
    shadcn:
      "About 30 CSS variables, mostly colour. Deeper theming means editing component classes directly.",
  },
  {
    aspect: "Themes available",
    layout:
      "58 themes generated from real, published company kits (Stripe, Linear, Notion, and more), each one an actual brand's tokens, not a mood.",
    shadcn:
      "A small set of built-in style presets (Default, New York) plus whatever the community has hand-built.",
  },
  {
    aspect: "Per-component AI agent rules",
    layout:
      "Every component ships meta.usage, meta.never, and meta.tokens, so an agent knows exactly what it's allowed to do with it.",
    shadcn:
      "None. An agent has to infer correct usage from the component source alone.",
  },
  {
    aspect: "Theme builder",
    layout:
      "/create builds a theme from any real company's design tokens, not a preset picker.",
    shadcn: "Presets only. No way to generate a theme from your own brand.",
  },
  {
    aspect: "Install",
    layout:
      "Same registry spec (npx shadcn add <url>), plus our own CLI: npx @layoutdesign/context add <component>.",
    shadcn: "npx shadcn add <url>.",
  },
] as const;

function Table() {
  return (
    <div className="flex flex-col gap-4">
      {ROWS.map((row) => (
        <div
          key={row.aspect}
          className="grid grid-cols-1 gap-4 rounded-2xl border border-[var(--mkt-border)] bg-[#101014] p-5 md:grid-cols-[160px_1fr_1fr]"
        >
          <p className="text-[13px] font-medium uppercase tracking-[0.6px] text-[var(--mkt-text-muted)] md:pt-1">
            {row.aspect}
          </p>
          <div className="flex flex-col gap-1.5">
            <p className="text-[12px] uppercase tracking-[0.6px] text-[var(--mkt-accent)]">
              Layout UI
            </p>
            <p className="text-[14px] leading-[22px] text-[var(--mkt-text-primary)]">
              {row.layout}
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <p className="text-[12px] uppercase tracking-[0.6px] text-[var(--mkt-text-muted)]">
              shadcn/ui
            </p>
            <p className="text-[14px] leading-[22px] text-[var(--mkt-text-secondary)]">
              {row.shadcn}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function VsShadcnPage() {
  return (
    <main className="min-h-screen bg-[var(--mkt-bg)] text-[var(--mkt-text-primary)]">
      <section className="pt-[100px] pb-12 lg:pt-[140px]">
        <div className="max-w-[900px] mx-auto px-6 flex flex-col gap-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[13px] text-[var(--mkt-text-secondary)] hover:text-white self-start"
          >
            ← Back
          </Link>
          <div className="inline-flex self-start items-center gap-2 px-3 py-1 rounded-full border border-[var(--mkt-border)] text-[12px] text-[var(--mkt-text-secondary)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--mkt-accent)]" />
            Competitive analysis
          </div>
          <h1 className="text-[40px] leading-[44px] md:text-[56px] md:leading-[60px] tracking-[-1.4px] font-normal">
            Layout UI vs shadcn/ui
          </h1>
          <p className="text-[18px] leading-[26px] text-[var(--mkt-text-secondary)]">
            shadcn/ui popularised the copy-in component model, and Layout UI
            uses the same one: components you own, built on Base UI, installed
            with a CLI. The difference shows up in theming, per-component
            rules for AI agents, and how many real brands you can actually
            reskin into.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <a
              href={LAYOUT_UI_URL}
              target="_blank"
              rel="noreferrer"
              className="px-5 py-2.5 rounded-full bg-white text-[#08090a] text-[14px] font-medium hover:bg-white/90 transition-colors"
            >
              Explore Layout UI
            </a>
            <Link
              href="/ui"
              className="px-5 py-2.5 rounded-full border border-[var(--mkt-border)] text-[14px] text-[var(--mkt-text-primary)] hover:bg-white/5 transition-colors"
            >
              Read more about Layout UI
            </Link>
          </div>
        </div>
      </section>

      <section className="pb-12">
        <div className="max-w-[900px] mx-auto px-6">
          <p className="text-[13px] uppercase tracking-wide text-[var(--mkt-text-muted)] mb-3">
            TL;DR
          </p>
          <p className="text-[20px] leading-[30px] text-[var(--mkt-text-primary)]">
            shadcn/ui is a great starting point with a handful of style
            presets. Layout UI is a full token contract with 58 real-brand
            themes and machine-readable rules attached to every component, so
            an AI agent can reskin your app and stay on-brand while it does
            it.
          </p>
        </div>
      </section>

      <section className="pb-32">
        <div className="max-w-[900px] mx-auto px-6">
          <h2 className="text-[28px] leading-[32px] font-normal tracking-[-0.7px] text-[var(--mkt-text-primary)] mb-6">
            Side by side
          </h2>
          <Table />
        </div>
      </section>

      <section className="pb-32">
        <div className="max-w-[900px] mx-auto px-6">
          <div className="rounded-3xl border border-[var(--mkt-border)] bg-[#101014] p-10">
            <h2 className="text-[28px] leading-[32px] font-normal tracking-[-0.7px] mb-3">
              Same install model. A real token contract underneath.
            </h2>
            <p className="text-[16px] leading-[24px] text-[var(--mkt-text-secondary)] mb-6">
              If you just need a handful of accessible primitives, shadcn/ui
              will serve you well. If you want components that reskin to any
              brand, and that ship rules your AI agent can actually follow,
              that&apos;s Layout UI.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/ui"
                className="px-5 py-2.5 rounded-full bg-white text-[#08090a] text-[14px] font-medium hover:bg-white/90 transition-colors"
              >
                Explore Layout UI
              </Link>
              <a
                href={LAYOUT_UI_URL}
                target="_blank"
                rel="noreferrer"
                className="px-5 py-2.5 rounded-full border border-[var(--mkt-border)] text-[14px] text-[var(--mkt-text-primary)] hover:bg-white/5 transition-colors"
              >
                Browse the components
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
