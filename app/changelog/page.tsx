import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Changelog | Layout",
  description: "What's new in Layout",
};

const entries = [
  {
    date: "March 2026",
    title: "Layout Studio public launch",
    description:
      "Extract design systems from Figma and websites, generate LLM-optimised context bundles, and ship on-brand UI with any AI coding agent.",
  },
];

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-[#080705] text-white">
      {/* Header */}
      <header className="mx-auto flex max-w-[720px] items-center px-6 pt-12">
        <Link href="/" className="transition-opacity hover:opacity-80">
          <img
            src="/marketing/logo-white.svg"
            alt="Layout"
            className="h-5"
          />
        </Link>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-[720px] px-6 pb-32 pt-24">
        <h1 className="text-4xl font-black tracking-tight text-white">
          Changelog
        </h1>
        <p className="mt-3 text-base leading-relaxed text-white/60">
          New updates and improvements to Layout.
        </p>

        <div className="mt-16 flex flex-col gap-16">
          {entries.map((entry) => (
            <article
              key={entry.date}
              className="border-l border-white/10 pl-8"
            >
              <time className="text-xs font-semibold uppercase tracking-widest text-white/40">
                {entry.date}
              </time>
              <h2 className="mt-3 text-xl font-bold text-white">
                {entry.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-white/60">
                {entry.description}
              </p>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
