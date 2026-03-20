import type { Metadata } from "next";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { AnnouncementBanner } from "@/components/marketing/AnnouncementBanner";

export const metadata: Metadata = {
  title: "Showcase — Layout",
  description: "See what teams are building with Layout.",
};

interface PlaceholderCardData {
  id: number;
  name: string;
  description: string;
  tag: string;
  author: string;
}

const PLACEHOLDER_CARDS: PlaceholderCardData[] = [
  {
    id: 1,
    name: "Your project here",
    description: "Early access teams will be featured as they ship AI-built UI.",
    tag: "Coming soon",
    author: "Early access team",
  },
  {
    id: 2,
    name: "Your project here",
    description: "Using Layout to keep your design system consistent across AI-generated code.",
    tag: "Coming soon",
    author: "Early access team",
  },
  {
    id: 3,
    name: "Your project here",
    description: "Ship faster with layout.md context that keeps AI agents on-brand.",
    tag: "Coming soon",
    author: "Be the first →",
  },
];

function PlaceholderCard({ name, description, tag, author }: { name: string; description: string; tag: string; author: string }) {
  return (
    <div className="flex flex-col gap-4 rounded-[4px] border border-dashed border-[rgba(255,255,255,0.12)] bg-[#282826] overflow-hidden">
      {/* Screenshot placeholder */}
      <div className="w-full aspect-video bg-[#1e1e1c] flex items-center justify-center">
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          aria-hidden="true"
          className="opacity-20"
        >
          <rect x="2" y="6" width="28" height="20" rx="2" stroke="#f5f4ee" strokeWidth="1.5" />
          <circle cx="11" cy="13" r="3" stroke="#f5f4ee" strokeWidth="1.5" />
          <path d="M2 22l7-5 5 4 5-6 11 8" stroke="#f5f4ee" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Card content */}
      <div className="flex flex-col gap-2 px-5 pb-5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[14px] font-medium text-[rgba(245,244,238,0.35)]">{name}</span>
          <span className="border border-[rgba(255,255,255,0.1)] rounded-[3px] px-2 py-[2px] text-[11px] tracking-[0.2px] text-[rgba(245,244,238,0.25)]">
            {tag}
          </span>
        </div>
        <p className="text-[13px] leading-[19px] text-[rgba(245,244,238,0.2)]">{description}</p>
        <p className="text-[13px] text-[var(--mkt-text-muted)]">Built by {author}</p>
      </div>
    </div>
  );
}

export default function ShowcasePage() {
  return (
    <>
      <div className="relative z-10 bg-[var(--mkt-bg)]">
        <AnnouncementBanner />
        <MarketingHeader />

        <main>
          {/* Hero */}
          <section className="pt-[180px] pb-[70px]">
            <div className="max-w-[1280px] mx-auto px-6">
              <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
                <h1 className="text-[28px] leading-[34px] md:text-[40px] md:leading-[48px] lg:text-[54px] lg:leading-[64px] tracking-[-1.408px] font-normal text-[var(--mkt-text-primary)] w-full lg:w-[509px]">
                  Built with{" "}
                  <span className="text-[var(--mkt-accent)]">Layout</span>
                </h1>
                <div className="w-full lg:w-[591px] pt-[19px] flex flex-col gap-[10px]">
                  <p className="text-[20px] leading-[24px] text-white tracking-[-0.165px]">
                    Teams shipping AI-built UI that looks right.
                  </p>
                  <p className="text-[15px] leading-[24px] text-[var(--mkt-text-secondary)] tracking-[-0.165px]">
                    Real projects built by teams using Layout to keep their design system consistent
                    across AI-generated code.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Grid */}
          <section className="pb-[100px] lg:pb-[140px]">
            <div className="max-w-[1280px] mx-auto px-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {PLACEHOLDER_CARDS.map((item) => (
                  <PlaceholderCard
                    key={item.id}
                    name={item.name}
                    description={item.description}
                    tag={item.tag}
                    author={item.author}
                  />
                ))}
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="pb-[100px] lg:pb-[180px]">
            <div className="max-w-[1280px] mx-auto px-6">
              <div className="rounded-[4px] border border-[rgba(255,255,255,0.08)] bg-[#282826] px-8 py-12 flex flex-col items-center text-center gap-4">
                <p className="text-[28px] leading-[34px] md:text-[36px] md:leading-[42px] tracking-[-0.8px] font-normal text-[var(--mkt-text-primary)]">
                  Using Layout in your project?
                </p>
                <p className="text-[15px] leading-[24px] text-[var(--mkt-text-secondary)] max-w-[480px]">
                  We&apos;d love to feature you. Show us what you&apos;ve built with Layout and we&apos;ll add it to this page.
                </p>
                <a
                  href="mailto:hello@layout.design"
                  className="mt-2 inline-flex items-center justify-center bg-[var(--mkt-btn-primary-bg)] text-[var(--mkt-btn-primary-text)] text-[14px] font-medium h-[40px] px-[20px] rounded-[4px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.12)] hover:opacity-90 transition-opacity duration-150"
                >
                  Reach out →
                </a>
              </div>
            </div>
          </section>
        </main>
      </div>

      <MarketingFooter />
    </>
  );
}
