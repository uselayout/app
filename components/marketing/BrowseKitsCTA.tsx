"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { KitCard } from "@/components/gallery/KitCard";
import type { PublicKitSummary } from "@/lib/types/kit";

export function BrowseKitsCTA() {
  const [kits, setKits] = useState<PublicKitSummary[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/public/kits?sort=featured&limit=3")
      .then((r) => r.json())
      .then((body: { kits: PublicKitSummary[] }) => {
        if (!cancelled) setKits(body.kits);
      })
      .catch(() => {
        if (!cancelled) setKits([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="py-24 lg:py-32 bg-[var(--mkt-bg)]">
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10">
          <div className="flex flex-col gap-4 max-w-[640px]">
            <div className="inline-flex self-start items-center gap-2 px-3 py-1 rounded-full border border-[var(--mkt-border-strong)] bg-[var(--mkt-surface)] text-[12px] text-[var(--mkt-text-secondary)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--mkt-accent)]" />
              Kit Gallery
            </div>
            <h2 className="text-[32px] leading-[36px] md:text-[40px] md:leading-[44px] tracking-[-0.9px] font-normal text-[var(--mkt-text-primary)]">
              Start with a community kit
            </h2>
            <p className="text-[16px] leading-[24px] text-[var(--mkt-text-secondary)]">
              Every Studio project can be published to the Gallery with one click.
              Import any kit into your workspace, or install from the CLI in any
              project.
            </p>
          </div>
          <Link
            href="/gallery"
            className="inline-flex shrink-0 items-center gap-1.5 px-5 py-2.5 rounded-full border border-[var(--mkt-border-strong)] text-[14px] text-[var(--mkt-text-primary)] hover:bg-[var(--mkt-surface)] transition-colors"
          >
            Browse all kits →
          </Link>
        </div>

        {kits === null ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="aspect-[3/4] rounded-[16px] border border-[var(--mkt-border)] bg-[var(--mkt-surface)] animate-pulse"
              />
            ))}
          </div>
        ) : kits.length === 0 ? null : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {kits.map((kit) => (
              <KitCard key={kit.id} kit={kit} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
