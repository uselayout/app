import type { Metadata } from "next";
import Link from "next/link";
import { listPublicKits } from "@/lib/supabase/kits";
import { GalleryPageClient } from "@/components/gallery/GalleryPageClient";
import type { KitSort } from "@/lib/types/kit";

export const metadata: Metadata = {
  title: "Kit Gallery - Layout",
  description:
    "Browse community-shared design-system kits for AI coding agents. Import any kit into Layout Studio with one click.",
  openGraph: {
    title: "Layout Kit Gallery",
    description:
      "Design-system kits for AI coding agents. Interoperable with Google's design.md.",
    type: "website",
  },
};

export const dynamic = "force-dynamic";

function parseSort(raw: string | undefined): KitSort {
  if (raw === "new" || raw === "top" || raw === "featured") return raw;
  return "featured";
}

interface PageProps {
  searchParams: Promise<{ tag?: string; q?: string; sort?: string }>;
}

export default async function GalleryPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const sort = parseSort(sp.sort);
  const kits = await listPublicKits({
    tag: sp.tag,
    q: sp.q,
    sort,
    limit: 120,
  });

  const tagCounts = new Map<string, number>();
  for (const kit of kits) {
    for (const t of kit.tags) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
  }
  const availableTags = Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([t]) => t);

  return (
    <main className="min-h-screen bg-[var(--mkt-bg)] text-[var(--mkt-text-primary)]">
      {/* Hero */}
      <section className="pt-[60px] pb-12 lg:pt-[100px] lg:pb-16">
        <div className="max-w-[1280px] mx-auto px-6">
          <Link href="/" className="inline-flex mb-10" aria-label="Layout home">
            <img src="/marketing/logo.svg" alt="Layout" width={99} height={24} className="mkt-logo" />
          </Link>
          <div className="flex flex-col gap-6 max-w-[820px]">
            <div className="inline-flex self-start items-center gap-2 px-3 py-1 rounded-full border border-[var(--mkt-border-strong)] bg-[var(--mkt-surface)] text-[12px] text-[var(--mkt-text-secondary)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--mkt-accent)]" />
              New: community Kit Gallery
            </div>

            <h1 className="text-[40px] leading-[44px] md:text-[56px] md:leading-[60px] tracking-[-1.4px] font-normal">
              Design-system kits for AI coding agents
            </h1>

            <p className="text-[18px] leading-[26px] text-[var(--mkt-text-secondary)] max-w-[640px]">
              Browse kits published from Layout Studio projects. One click and they land in your workspace ready to build with. Fully interoperable with Google&apos;s design.md.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/login?redirect=/gallery"
                className="px-5 py-2.5 rounded-full bg-[var(--mkt-btn-primary-bg)] text-[var(--mkt-btn-primary-text)] text-[14px] font-medium hover:opacity-90 transition-opacity"
              >
                Open Studio
              </Link>
              <a
                href="https://www.npmjs.com/package/@layoutdesign/context"
                target="_blank"
                rel="noreferrer"
                className="px-5 py-2.5 rounded-full border border-[var(--mkt-border-strong)] text-[14px] text-[var(--mkt-text-primary)] hover:bg-[var(--mkt-surface)] transition-colors"
              >
                Install the CLI
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="pb-32">
        <div className="max-w-[1280px] mx-auto px-6">
          <GalleryPageClient
            initialKits={kits}
            availableTags={availableTags}
            initialTag={sp.tag}
            initialSort={sort}
            initialQ={sp.q}
          />
        </div>
      </section>
    </main>
  );
}
