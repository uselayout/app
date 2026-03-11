"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useProjectStore } from "@/lib/store/project";
import { signOut, useSession } from "@/lib/auth-client";
import { Layers, Globe, ArrowRight, Clock, X, Trash2 } from "lucide-react";
import { ContextGapSection } from "@/components/marketing/ContextGapSection";
import { HowItWorksSection } from "@/components/marketing/HowItWorksSection";
import { ProductsSection } from "@/components/marketing/ProductsSection";
import { FigmaLoopSection } from "@/components/marketing/FigmaLoopSection";
import { ComparisonSection } from "@/components/marketing/ComparisonSection";
import { OpenSourceSection } from "@/components/marketing/OpenSourceSection";
import { AIKitsSection } from "@/components/marketing/AIKitsSection";
import { EarlyAccessCTA } from "@/components/marketing/EarlyAccessCTA";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

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

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const router = useRouter();
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const deleteProject = useProjectStore((s) => s.deleteProject);
  const projects = useProjectStore((s) => s.projects);
  const sortedProjects = [...projects].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
  const recentProjects = sortedProjects.slice(0, 3);
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <>
      <div className="scroll-smooth min-h-screen bg-white text-[#0a0a0a]">

        {/* Announcement Banner */}
        {!bannerDismissed && (
          <div className="relative bg-[#0a0a0a] py-2.5 text-center text-sm text-gray-300">
            <span>
              We&apos;re looking for 50 teams shipping UI with AI agents.{" "}
              <a
                href="/login"
                className="text-white underline underline-offset-2 hover:no-underline"
              >
                Join early access →
              </a>
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
                Layout
              </span>
            </div>

            {/* Centre links */}
            <nav className="hidden md:flex items-center gap-6">
              {[
                { label: "Products", id: "products" },
                { label: "How it Works", id: "how-it-works" },
                { label: "Figma Loop", id: "figma-loop" },
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
                  <a
                    href="/studio"
                    className="rounded-full bg-[#0a0a0a] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#1a1a1a] transition-colors"
                  >
                    Open Studio →
                  </a>
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
              Make AI build
              <br />
              on-brand.
            </h1>

            {/* Subheadline */}
            <p className="animate-fade-up delay-200 mx-auto max-w-xl text-lg text-gray-500 leading-relaxed mb-12 sm:text-xl">
              Your AI agent writes working code but gets the design wrong.
              Layout extracts your design system from Figma or any website
              and serves it to Claude Code, Cursor, and Copilot automatically.
            </p>

            {/* CTAs */}
            <div className="animate-fade-up delay-300 flex flex-col sm:flex-row items-center justify-center gap-3 mb-5">
              <a
                href="/studio"
                className="rounded-full bg-[#0a0a0a] px-8 py-3.5 text-sm font-semibold text-white hover:bg-[#1a1a1a] transition-all shadow-lg shadow-black/10 hover:shadow-xl hover:shadow-black/15"
              >
                Open Studio
              </a>
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
                <a
                  href="/studio"
                  className="rounded-full border border-black/20 px-4 py-2 text-sm font-medium text-[#0a0a0a] hover:bg-gray-50 transition-colors"
                >
                  View all →
                </a>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {recentProjects.map((project) => {
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
                    <div
                      key={project.id}
                      className="group relative text-left rounded-2xl border border-black/[0.08] bg-white p-5 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all"
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete "${project.name}"?`)) {
                            deleteProject(project.id);
                          }
                        }}
                        className="absolute right-3 top-3 rounded-md p-1.5 text-gray-300 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 transition-all"
                        aria-label={`Delete ${project.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => router.push(`/studio/${project.id}`)}
                        className="w-full text-left"
                      >
                        <div className="mb-3 flex items-start justify-between gap-2 pr-6">
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
                    </div>
                  );
                })}
              </div>
              {sortedProjects.length > 3 && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => scrollTo("all-projects")}
                    className="text-sm text-gray-500 hover:text-indigo-600 transition-colors"
                  >
                    View all {sortedProjects.length} projects →
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        <ContextGapSection />
        <HowItWorksSection />
        <ProductsSection onOpenStudio={() => router.push("/studio")} />
        <FigmaLoopSection />
        <ComparisonSection />
        <OpenSourceSection />
        <AIKitsSection scrollTo={scrollTo} />
        <EarlyAccessCTA />
        <MarketingFooter
          isLoggedIn={isLoggedIn}
          onSignOut={handleSignOut}
          scrollTo={scrollTo}
        />
      </div>

    </>
  );
}
