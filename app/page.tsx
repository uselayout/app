"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useProjectStore } from "@/lib/store/project";
import { signOut, useSession } from "@/lib/auth-client";
import type { SourceType } from "@/lib/types";
import {
  Layers,
  Globe,
  RefreshCw,
  Link,
  Sparkles,
  Code2,
  FileText,
  X,
  ArrowRight,
} from "lucide-react";

const AI_KITS = [
  { name: "Linear", price: 99, aesthetic: "Developer tool, dark-first" },
  { name: "Revolut", price: 99, aesthetic: "Dark fintech, data-rich" },
  { name: "Stripe", price: 79, aesthetic: "Clean, trust-focused" },
  { name: "Notion", price: 79, aesthetic: "Document-first, flexible" },
  { name: "Vercel", price: 79, aesthetic: "Minimal, monochrome" },
  { name: "Apple iOS", price: 129, aesthetic: "HIG-compliant, light-first" },
];

function detectSourceType(url: string): SourceType | null {
  if (/figma\.com\/(file|design)\//.test(url)) return "figma";
  try {
    new URL(url);
    return "website";
  } catch {
    return null;
  }
}

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

export default function LandingPage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [pat, setPat] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const createProject = useProjectStore((s) => s.createProject);
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  const sourceType = url ? detectSourceType(url) : null;
  const isFigma = sourceType === "figma";
  const isValid = sourceType !== null && (!isFigma || pat.length > 0);

  const handleExtract = async () => {
    if (!isValid || !sourceType) return;

    setIsExtracting(true);

    const projectId = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36);
    const projectName = isFigma
      ? "Figma Extraction"
      : new URL(url).hostname.replace("www.", "");

    createProject({
      id: projectId,
      name: projectName,
      sourceType,
      sourceUrl: url,
      designMd: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    if (isFigma && pat) {
      sessionStorage.setItem(`pat-${projectId}`, pat);
    }
    sessionStorage.setItem(`extract-${projectId}`, "true");

    router.push(`/studio/${projectId}`);
  };

  return (
    <div className="scroll-smooth min-h-screen bg-white text-[#0a0a0a]">

      {/* Announcement Banner */}
      {!bannerDismissed && (
        <div className="relative bg-indigo-600 py-2 text-center text-sm text-white">
          <span>
            Pre-built AI Kits now available — extract any design system instantly.{" "}
            <button
              onClick={(e) => {
                e.preventDefault();
                scrollTo("ai-kits");
              }}
              className="underline underline-offset-2 hover:no-underline"
            >
              Learn More →
            </button>
          </span>
          <button
            onClick={() => setBannerDismissed(true)}
            aria-label="Dismiss"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Sticky Nav */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-black/[0.06]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              className="text-indigo-600"
            >
              <path
                d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-sm font-semibold text-[#0a0a0a]">
              SuperDuper AI Studio
            </span>
          </div>

          {/* Centre links */}
          <nav className="hidden md:flex items-center gap-6">
            {[
              { label: "How it Works", id: "how-it-works" },
              { label: "AI Kits", id: "ai-kits" },
              { label: "Pricing", id: "pricing" },
            ].map(({ label, id }) => (
              <button
                key={id}
                onClick={(e) => {
                  e.preventDefault();
                  scrollTo(id);
                }}
                className="text-sm text-gray-600 hover:text-black transition-colors"
              >
                {label}
              </button>
            ))}
          </nav>

          {/* Right CTAs */}
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <>
                <button
                  onClick={handleSignOut}
                  className="text-sm text-gray-500 hover:text-black transition-colors"
                >
                  Sign out
                </button>
                <button
                  onClick={(e) => { e.preventDefault(); scrollTo("extract"); }}
                  className="rounded-full bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                >
                  Extract now →
                </button>
              </>
            ) : (
              <>
                <a
                  href="/login"
                  className="text-sm text-gray-500 hover:text-black transition-colors"
                >
                  Sign in
                </a>
                <a
                  href="/login"
                  className="rounded-full bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                >
                  Get started →
                </a>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 pt-24 pb-16 text-center">
        <div className="mx-auto max-w-4xl">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600">
            AI-ready design context
          </div>

          {/* Headline */}
          <h1 className="text-7xl font-black tracking-tight text-[#0a0a0a] md:text-8xl leading-none mb-6">
            Your AI builds
            <br />
            on-brand.
          </h1>

          {/* Subheadline */}
          <p className="mx-auto max-w-xl text-xl text-gray-500 leading-relaxed mb-10">
            Extract any design system. Generate the context your AI needs to
            build UI that actually looks right.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
            <button
              onClick={(e) => {
                e.preventDefault();
                scrollTo("extract");
              }}
              className="rounded-full bg-indigo-600 px-8 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
            >
              Extract from Figma
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                scrollTo("ai-kits");
              }}
              className="rounded-full border border-black/20 bg-white px-8 py-3 text-sm font-semibold text-[#0a0a0a] hover:bg-gray-50 transition-colors"
            >
              Browse AI Kits
            </button>
          </div>

          {/* Social proof */}
          <p className="text-sm text-gray-400">
            Used by developers at Vercel, Linear, and Stripe
          </p>
        </div>

        {/* URL Extraction Form */}
        <div id="extract" className="mt-14 mx-auto max-w-2xl text-left">
          <div className="space-y-3">
            <input
              type="url"
              placeholder="Paste a Figma file URL or website URL..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="h-14 w-full rounded-2xl border border-black/[0.12] bg-white px-5 text-base text-[#0a0a0a] placeholder:text-gray-400 shadow-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
            />

            {isFigma && (
              <input
                type="password"
                placeholder="Figma Personal Access Token (figd_...)"
                value={pat}
                onChange={(e) => setPat(e.target.value)}
                className="h-14 w-full rounded-2xl border border-black/[0.12] bg-white px-5 text-base text-[#0a0a0a] placeholder:text-gray-400 shadow-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
              />
            )}

            {sourceType && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                  {isFigma ? "Figma" : "Website"}
                </span>
                <span>detected</span>
              </div>
            )}

            <button
              onClick={handleExtract}
              disabled={!isValid || isExtracting}
              className="h-12 w-full rounded-xl bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {isExtracting ? "Starting extraction..." : "Extract Design System →"}
            </button>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="bg-[#f9f9f9] py-24 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-indigo-600">
              How it Works
            </p>
            <h2 className="text-4xl font-bold text-[#0a0a0a]">
              From any design to AI context in seconds.
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                num: "01",
                icon: Link,
                title: "Paste a URL",
                desc: "Drop in a Figma file link or any website URL. We handle the rest.",
              },
              {
                num: "02",
                icon: Sparkles,
                title: "Extract automatically",
                desc: "AI pulls colours, typography, spacing, components, and design tokens.",
              },
              {
                num: "03",
                icon: Code2,
                title: "Build on-brand",
                desc: "Your AI coding tool uses the context file to generate UI that matches the design system.",
              },
            ].map(({ num, icon: Icon, title, desc }) => (
              <div
                key={num}
                className="relative rounded-2xl border border-black/[0.08] bg-white p-8 shadow-sm"
              >
                <span className="mb-6 block text-xs font-semibold text-indigo-600">
                  {num}
                </span>
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
                  <Icon size={20} className="text-indigo-600" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-[#0a0a0a]">
                  {title}
                </h3>
                <p className="text-sm leading-relaxed text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Kits */}
      <section id="ai-kits" className="py-24 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-4 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-indigo-600">
              Pre-Built AI Kits
            </p>
            <h2 className="mb-3 text-4xl font-bold text-[#0a0a0a]">
              Skip extraction. Start building now.
            </h2>
            <p className="mx-auto max-w-lg text-base text-gray-500">
              Professionally extracted design systems for the world&apos;s best
              products. Plug in and build.
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {AI_KITS.map((kit) => (
              <div
                key={kit.name}
                className="group relative rounded-2xl border border-black/[0.08] bg-white p-6 transition-shadow hover:shadow-md cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="mb-1 font-semibold text-[#0a0a0a]">
                      {kit.name}
                    </h3>
                    <p className="text-sm text-gray-500">{kit.aesthetic}</p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700 shrink-0 ml-3">
                    £{kit.price}
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-1 text-xs font-medium text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  Get Kit <ArrowRight size={12} />
                </div>
              </div>
            ))}
          </div>

          <p className="mt-10 text-center text-sm text-gray-500">
            Don&apos;t see what you need?{" "}
            <button
              onClick={(e) => {
                e.preventDefault();
                scrollTo("extract");
              }}
              className="text-indigo-600 hover:underline"
            >
              Extract any design system yourself ↑
            </button>
          </p>
        </div>
      </section>

      {/* Stats Strip */}
      <section className="bg-black py-16 px-6">
        <div className="mx-auto max-w-4xl">
          <div className="grid grid-cols-3 gap-8 text-center text-white">
            {[
              { stat: "500+", label: "Design tokens extracted per project" },
              { stat: "10×", label: "Faster on-brand UI with AI" },
              {
                stat: "100%",
                label: "Compatible with Claude Code, Cursor & Copilot",
              },
            ].map(({ stat, label }) => (
              <div key={stat}>
                <p className="mb-2 text-4xl font-black tracking-tight">{stat}</p>
                <p className="text-sm text-gray-400 leading-relaxed">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="text-4xl font-bold text-[#0a0a0a]">
              Everything your AI needs to build right.
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {[
              {
                icon: Layers,
                title: "Figma Integration",
                desc: "Connect directly to Figma. Extract live design tokens, components, and styles.",
              },
              {
                icon: Globe,
                title: "Website Extraction",
                desc: "Point at any URL. We scrape colours, fonts, spacing, and component patterns.",
              },
              {
                icon: FileText,
                title: "AI-Ready Markdown",
                desc: "Output a single .md context file. Drop it into Claude Code, Cursor, or Copilot.",
              },
              {
                icon: RefreshCw,
                title: "Always Up to Date",
                desc: "Re-extract any time the design changes. Your AI context stays fresh.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-2xl border border-black/[0.08] bg-white p-8 shadow-sm"
              >
                <div className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
                  <Icon size={20} className="text-indigo-600" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-[#0a0a0a]">
                  {title}
                </h3>
                <p className="text-sm leading-relaxed text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing CTA */}
      <section id="pricing" className="bg-indigo-600 py-24 px-6 text-center">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-4 text-5xl font-black text-white">
            Start extracting for free.
          </h2>
          <p className="mb-10 text-xl text-indigo-200">
            One URL. Instant AI context. No credit card required.
          </p>
          <button
            onClick={(e) => {
              e.preventDefault();
              scrollTo("extract");
            }}
            className="rounded-full bg-white px-10 py-4 text-lg font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors"
          >
            Extract your first design system →
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0a0a0a] px-6 py-16 text-white">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
            {/* Logo + tagline */}
            <div>
              <div className="mb-2 flex items-center gap-2">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-indigo-400"
                >
                  <path
                    d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="text-sm font-semibold">
                  SuperDuper AI Studio
                </span>
              </div>
              <p className="text-sm text-gray-500">
                Give your AI perfect taste.
              </p>
            </div>

            {/* Links */}
            <nav className="flex flex-wrap gap-6">
              {[
                { label: "How it Works", id: "how-it-works" },
                { label: "AI Kits", id: "ai-kits" },
                { label: "Pricing", id: "pricing" },
              ].map(({ label, id }) => (
                <button
                  key={id}
                  onClick={(e) => {
                    e.preventDefault();
                    scrollTo(id);
                  }}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  {label}
                </button>
              ))}
              {isLoggedIn ? (
                <button
                  onClick={handleSignOut}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Sign out
                </button>
              ) : (
                <a href="/login" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Sign in
                </a>
              )}
            </nav>
          </div>

          <div className="mt-12 border-t border-white/10 pt-8">
            <p className="text-sm text-gray-500">
              © 2025 SuperDuper AI Studio · A SuperDuper product
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
