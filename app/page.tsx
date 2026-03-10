"use client";

import { useState } from "react";
import { getStoredApiKey } from "@/lib/hooks/use-api-key";
import { ApiKeyModal } from "@/components/shared/ApiKeyModal";
import { useRouter } from "next/navigation";
import { useProjectStore } from "@/lib/store/project";
import { signOut, useSession } from "@/lib/auth-client";
import type { SourceType } from "@/lib/types";
import { Layers, Globe, ArrowRight, Clock, X } from "lucide-react";
import { HowItWorksSection } from "@/components/marketing/HowItWorksSection";
import { AIKitsSection } from "@/components/marketing/AIKitsSection";
import { StatsStrip } from "@/components/marketing/StatsStrip";
import { FeaturesGrid } from "@/components/marketing/FeaturesGrid";
import { PricingCTA } from "@/components/marketing/PricingCTA";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { ProductsSection } from "@/components/marketing/ProductsSection";

// ─── Utilities ───────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getHostname(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [pat, setPat] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showExtractModal, setShowExtractModal] = useState(false);
  const createProject = useProjectStore((s) => s.createProject);
  const projects = useProjectStore((s) => s.projects);
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
    if (!getStoredApiKey()) {
      setShowApiKeyModal(true);
      return;
    }
    if (!isValid || !sourceType) return;

    setIsExtracting(true);

    const projectId =
      crypto.randomUUID?.() ??
      Math.random().toString(36).slice(2) + Date.now().toString(36);
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
    <>
      <div className="scroll-smooth min-h-screen bg-white text-[#0a0a0a]">

        {/* Announcement Banner */}
        {!bannerDismissed && (
          <div className="relative bg-[#0a0a0a] py-2.5 text-center text-sm text-gray-300">
            <span>
              Pre-built AI Kits now available — design systems from Linear, Stripe, Notion, and more.{" "}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  scrollTo("ai-kits");
                }}
                className="text-white underline underline-offset-2 hover:no-underline"
              >
                Learn More →
              </button>
            </span>
            <button
              onClick={() => setBannerDismissed(true)}
              aria-label="Dismiss"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
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
                SuperDuper
              </span>
            </div>

            {/* Centre links */}
            <nav className="hidden md:flex items-center gap-6">
              {[
                { label: "Products", id: "products" },
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
              <a
                href="/docs"
                className="text-sm text-gray-600 hover:text-black transition-colors"
              >
                Docs
              </a>
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
                    onClick={() => setShowExtractModal(true)}
                    className="rounded-full bg-[#0a0a0a] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#1a1a1a] transition-colors"
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
                    className="rounded-full bg-[#0a0a0a] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#1a1a1a] transition-colors"
                  >
                    Get started →
                  </a>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="hero-gradient relative px-6 pt-28 pb-20 text-center overflow-hidden">
          <div className="mx-auto max-w-4xl relative z-10">
            {/* Badge */}
            <div className="animate-fade-up mb-8 inline-flex items-center rounded-full border border-indigo-200/60 bg-white/80 backdrop-blur-sm px-4 py-1.5 text-xs font-medium text-indigo-600 shadow-sm">
              The compiler between design systems and AI coding agents
            </div>

            {/* Headline */}
            <h1 className="animate-fade-up delay-100 text-6xl font-black tracking-tight text-[#0a0a0a] sm:text-7xl md:text-8xl leading-[0.92] mb-7">
              Your AI builds
              <br />
              on-brand.
            </h1>

            {/* Subheadline */}
            <p className="animate-fade-up delay-200 mx-auto max-w-xl text-lg text-gray-500 leading-relaxed mb-12 sm:text-xl">
              Paste a Figma URL or website. Get a structured context bundle your
              AI coding agent can read. On-brand UI, every time.
            </p>

            {/* CTAs */}
            <div className="animate-fade-up delay-300 flex flex-col sm:flex-row items-center justify-center gap-3 mb-5">
              <button
                onClick={() => setShowExtractModal(true)}
                className="rounded-full bg-[#0a0a0a] px-8 py-3.5 text-sm font-semibold text-white hover:bg-[#1a1a1a] transition-all shadow-lg shadow-black/10 hover:shadow-xl hover:shadow-black/15"
              >
                Open Studio
              </button>
              <a
                href="/docs/cli"
                className="rounded-full border border-black/10 bg-white px-8 py-3.5 text-sm font-semibold text-[#0a0a0a] hover:border-black/20 hover:bg-gray-50 transition-all"
              >
                Install CLI
              </a>
            </div>

            {/* Social proof */}
            <p className="animate-fade-in delay-500 text-sm text-gray-400 tracking-wide">
              Works with Claude Code · Cursor · GitHub Copilot · Windsurf · Codex
            </p>
          </div>

          {/* URL Extraction Form */}
          <div id="extract" className="animate-fade-up delay-400 mt-16 mx-auto max-w-2xl text-left relative z-10">
            <div className="space-y-3">
              <input
                type="url"
                placeholder="Paste a Figma file URL or website URL..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="h-14 w-full rounded-2xl border border-black/[0.08] bg-white px-5 text-base text-[#0a0a0a] placeholder:text-gray-400 shadow-sm outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-all"
              />

              {isFigma && (
                <input
                  type="password"
                  placeholder="Figma Personal Access Token (figd_...)"
                  value={pat}
                  onChange={(e) => setPat(e.target.value)}
                  className="h-14 w-full rounded-2xl border border-black/[0.08] bg-white px-5 text-base text-[#0a0a0a] placeholder:text-gray-400 shadow-sm outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-all"
                />
              )}

              {sourceType && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-600">
                    {isFigma ? "Figma" : "Website"}
                  </span>
                  <span>detected</span>
                </div>
              )}

              <button
                onClick={handleExtract}
                disabled={!isValid || isExtracting}
                className="h-12 w-full rounded-xl bg-[#0a0a0a] text-sm font-semibold text-white hover:bg-[#1a1a1a] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-black/10"
              >
                {isExtracting ? "Starting extraction..." : "Extract Design System →"}
              </button>
            </div>
          </div>
        </section>

        {/* My Projects */}
        {isLoggedIn && projects.length > 0 && (
          <section className="px-6 py-16 border-t border-black/[0.06]">
            <div className="mx-auto max-w-6xl">
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-indigo-600">
                    My Projects
                  </p>
                  <h2 className="text-2xl font-bold text-[#0a0a0a]">
                    Recent extractions
                  </h2>
                </div>
                <button
                  onClick={() => setShowExtractModal(true)}
                  className="rounded-full border border-black/20 px-4 py-2 text-sm font-medium text-[#0a0a0a] hover:bg-gray-50 transition-colors"
                >
                  + New extraction
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => {
                  const hostname = project.sourceUrl
                    ? getHostname(project.sourceUrl)
                    : null;
                  const score = project.healthScore;
                  const scoreColour =
                    score == null
                      ? ""
                      : score >= 80
                        ? "bg-emerald-500"
                        : score >= 50
                          ? "bg-amber-400"
                          : "bg-red-400";
                  return (
                    <button
                      key={project.id}
                      onClick={() => router.push(`/studio/${project.id}`)}
                      className="group text-left rounded-2xl border border-black/[0.08] bg-white p-5 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all"
                    >
                      <div className="mb-3 flex items-start justify-between gap-2">
                        <p className="font-semibold text-[#0a0a0a] leading-snug line-clamp-1">
                          {project.name}
                        </p>
                        <ArrowRight className="h-4 w-4 shrink-0 text-gray-300 group-hover:text-indigo-500 transition-colors mt-0.5" />
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                          {project.sourceType === "figma" ? (
                            <Layers className="h-3 w-3" />
                          ) : (
                            <Globe className="h-3 w-3" />
                          )}
                          {project.sourceType === "figma" ? "Figma" : "Website"}
                        </span>
                        {hostname && (
                          <span className="text-xs text-gray-400 truncate max-w-[140px]">
                            {hostname}
                          </span>
                        )}
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {timeAgo(project.updatedAt)}
                        </span>
                        {score != null && (
                          <span className="inline-flex items-center gap-1.5">
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${scoreColour}`}
                            />
                            {score}/100
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        <ProductsSection onOpenStudio={() => setShowExtractModal(true)} />
        <HowItWorksSection />
        <AIKitsSection scrollTo={scrollTo} />
        <StatsStrip />
        <FeaturesGrid />
        <PricingCTA onOpenStudio={() => setShowExtractModal(true)} />
        <MarketingFooter
          isLoggedIn={isLoggedIn}
          onSignOut={handleSignOut}
          scrollTo={scrollTo}
        />
      </div>

      {/* Extract Modal */}
      {showExtractModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowExtractModal(false)}
          />
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl animate-scale-in">
            <button
              onClick={() => setShowExtractModal(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-black transition-colors"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <h2 className="mb-1 text-xl font-bold text-[#0a0a0a]">
              New extraction
            </h2>
            <p className="mb-6 text-sm text-gray-500">
              Paste a Figma file or website URL to extract its design system.
            </p>

            <div className="space-y-3">
              <input
                type="url"
                placeholder="Paste a Figma file URL or website URL..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                autoFocus
                className="h-13 w-full rounded-xl border border-black/[0.08] bg-white px-4 text-base text-[#0a0a0a] placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-all"
              />

              {isFigma && (
                <input
                  type="password"
                  placeholder="Figma Personal Access Token (figd_...)"
                  value={pat}
                  onChange={(e) => setPat(e.target.value)}
                  className="h-13 w-full rounded-xl border border-black/[0.08] bg-white px-4 text-base text-[#0a0a0a] placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-all"
                />
              )}

              {sourceType && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-600">
                    {isFigma ? "Figma" : "Website"}
                  </span>
                  <span>detected</span>
                </div>
              )}

              <button
                onClick={handleExtract}
                disabled={!isValid || isExtracting}
                className="h-11 w-full rounded-xl bg-[#0a0a0a] text-sm font-semibold text-white hover:bg-[#1a1a1a] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {isExtracting ? "Starting extraction..." : "Extract Design System →"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showApiKeyModal && (
        <ApiKeyModal
          onClose={() => {
            setShowApiKeyModal(false);
            if (getStoredApiKey()) handleExtract();
          }}
        />
      )}
    </>
  );
}
