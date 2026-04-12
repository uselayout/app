import type { Metadata } from "next";
import Link from "next/link";
import { RoadmapClient } from "@/components/roadmap/RoadmapClient";

export const metadata: Metadata = {
  title: "Roadmap | Layout",
  description:
    "See what we're building next. Vote on features you want to see in Layout Studio, CLI, Figma Plugin, and Chrome Extension.",
};

export default function RoadmapPage() {
  return (
    <div className="dark min-h-screen bg-[var(--mkt-bg)] text-white">
      <header className="mx-auto flex max-w-[900px] items-center px-6 pt-12">
        <Link href="/" className="transition-opacity hover:opacity-80">
          <img
            src="/marketing/logo-white.svg"
            alt="Layout"
            className="h-5"
          />
        </Link>
      </header>

      <main className="mx-auto max-w-[900px] px-6 pb-32 pt-24">
        <h1 className="text-4xl font-black tracking-tight text-white">
          Roadmap
        </h1>
        <p className="mt-3 text-base leading-relaxed text-white/60">
          What we&apos;re building next. Vote on the features you want to see.
        </p>

        <RoadmapClient />
      </main>
    </div>
  );
}
