"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnnouncementBanner } from "@/components/marketing/AnnouncementBanner";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { Check } from "lucide-react";
import { useBilling } from "@/lib/hooks/use-billing";
import type { SubscriptionTier } from "@/lib/types/billing";

const PLANS = [
  {
    name: "Hobby",
    price: "$0",
    period: "forever",
    description:
      "For developers exploring Layout with their own API key.",
    features: [
      "Unlimited Figma & website extractions",
      "DESIGN.md generation (BYOK)",
      "All 6 export formats",
      "3 starter design kits",
      "Open-source CLI & MCP server",
    ],
    cta: "Get started",
    tier: "free" as const,
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$29",
    period: "per month",
    description:
      "For professionals who want hosted AI — no API key needed.",
    features: [
      "Everything in Hobby",
      "Hosted Claude AI — no API key needed",
      "Unlimited DESIGN.md generations",
      "Unlimited test panel queries",
      "Priority Slack support",
    ],
    cta: "Upgrade to Pro",
    tier: "pro" as const,
    highlighted: true,
    badge: "Most popular",
  },
  {
    name: "Team",
    price: "$29",
    period: "per $15 user / month",
    description:
      "For teams that need centralised billing, admin controls, and compliance.",
    features: [
      "Everything in Pro",
      "Centralised team billing",
      "Admin usage dashboard",
      "SAML SSO & SCIM",
      "Zero data retention policy",
    ],
    cta: "Start Team Plan",
    tier: "team" as const,
    highlighted: false,
  },
];

const FAQS = [
  {
    q: "What's included in the free tier?",
    a: "Everything except hosted AI. You get unlimited extractions from Figma and websites, all 6 export formats (DESIGN.md, CLAUDE.md, AGENTS.md, tokens.css, tokens.json, tailwind.config.js), unlimited projects, and 3 starter kits. You just need your own Anthropic API key for DESIGN.md generation and the test panel.",
  },
  {
    q: "What does 'hosted AI' mean?",
    a: "On Pro and Team plans, we provide the Claude API calls — you don't need your own Anthropic key. We handle the AI infrastructure so you can focus on building.",
  },
  {
    q: "Can I still use my own API key on a paid plan?",
    a: "Yes! BYOK always works, even on paid plans. When you provide your own key, no hosted credits are consumed.",
  },
  {
    q: "Is the CLI and MCP server free?",
    a: "Yes, forever. The @layoutdesign/context CLI and MCP server are MIT-licensed open source. You can self-host the entire Studio too.",
  },
];

function PricingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { tier, loading } = useBilling();
  const success = searchParams.get("success");

  const handleSelectTier = async (selected: SubscriptionTier | "topup") => {
    if (selected === "free") {
      router.push("/studio");
      return;
    }

    const body =
      selected === "topup" ? { type: "topup" } : { tier: selected };

    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const { url } = await res.json();
      window.location.href = url;
    }
  };

  return (
    <>
      <div className="relative z-10 bg-[var(--mkt-bg)]">
        <AnnouncementBanner />
        <MarketingHeader />

        {/* Success banner */}
        {success && (
          <div className="border-b border-green-500/20 bg-green-500/10 px-6 py-3 text-center">
            <p className="flex items-center justify-center gap-2 text-sm font-medium text-green-400">
              <Check className="h-4 w-4" />
              {success === "topup"
                ? "Credits added successfully!"
                : `You're now on the ${success.charAt(0).toUpperCase() + success.slice(1)} plan!`}
            </p>
          </div>
        )}

        <main>
          {/* Hero */}
          <section className="pt-[180px] pb-[70px]">
            <div className="max-w-[1280px] mx-auto px-6">
              <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
                <h1 className="text-[28px] leading-[34px] md:text-[40px] md:leading-[48px] lg:text-[54px] lg:leading-[64px] tracking-[-1.408px] font-normal text-[var(--mkt-text-primary)] w-full lg:w-[454px]">
                  Free forever with your own API key.
                </h1>
                <div className="w-full lg:w-[591px] pt-[19px] flex flex-col gap-[10px]">
                  <p className="text-[20px] leading-[24px] text-white tracking-[-0.165px]">
                    Or let us handle everything for £29/month.
                  </p>
                  <p className="text-[15px] leading-[24px] text-[var(--mkt-text-secondary)] tracking-[-0.165px]">
                    Extract design systems, generate DESIGN.md, test with AI —{" "}
                    <span className="text-[var(--mkt-accent)]">
                      all included
                    </span>
                    .
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Pricing cards */}
          <section className="pb-[100px] lg:pb-[180px]">
            <div className="max-w-[1280px] mx-auto px-6">
              {loading ? (
                <div className="text-center text-[var(--mkt-text-muted)]">
                  Loading...
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {PLANS.map((plan) => (
                    <div
                      key={plan.name}
                      className={`bg-[#282826] rounded-[4px] p-8 flex flex-col justify-between ${
                        plan.highlighted
                          ? "border-2 border-[var(--mkt-accent)]"
                          : "border border-[#e0ded5]"
                      }`}
                    >
                      <div className="flex flex-col gap-[27px]">
                        {/* Tier name + badge */}
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-[14px] tracking-[0.14px] ${
                              plan.highlighted
                                ? "text-[rgba(245,244,238,0.6)]"
                                : "text-[#7f7e7a]"
                            }`}
                          >
                            {plan.name}
                          </span>
                          {plan.badge && (
                            <span className="border border-[var(--mkt-accent)] rounded-[4px] px-2 py-[2px] text-[12px] tracking-[0.14px] text-[var(--mkt-accent)]">
                              {plan.badge}
                            </span>
                          )}
                        </div>

                        {/* Price */}
                        <div className="flex flex-col gap-1">
                          <span className="text-[48px] leading-[48px] tracking-[-0.5px] text-[#f5f4ee]">
                            {plan.price}
                          </span>
                          <span
                            className={`text-[14px] tracking-[0.14px] ${
                              plan.highlighted
                                ? "text-[rgba(245,244,238,0.5)]"
                                : "text-[#7f7e7a]"
                            }`}
                          >
                            {plan.period}
                          </span>
                        </div>

                        {/* Divider */}
                        <div className="h-px bg-[rgba(245,244,238,0.12)]" />

                        {/* Description */}
                        <p
                          className={`text-[17px] leading-[23px] ${
                            plan.highlighted
                              ? "text-[rgba(245,244,238,0.65)]"
                              : "text-[#c6c5bf]"
                          }`}
                        >
                          {plan.description}
                        </p>

                        {/* Features */}
                        <ul className="flex flex-col gap-3">
                          {plan.features.map((feature) => (
                            <li
                              key={feature}
                              className="flex items-start gap-[12px]"
                            >
                              <span
                                className={`text-[12px] leading-[21px] tracking-[0.14px] ${
                                  plan.highlighted
                                    ? "text-[rgba(245,244,238,0.4)]"
                                    : "text-[#676662]"
                                }`}
                              >
                                →
                              </span>
                              <span
                                className={`text-[14px] leading-[21px] tracking-[0.14px] ${
                                  plan.highlighted
                                    ? "text-[rgba(245,244,238,0.8)]"
                                    : "text-[#c6c5bf]"
                                }`}
                              >
                                {feature}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* CTA button */}
                      <button
                        onClick={() => handleSelectTier(plan.tier)}
                        disabled={tier === plan.tier}
                        className={`mt-8 h-[47px] w-full rounded-full text-[14px] tracking-[0.14px] transition-opacity hover:opacity-90 disabled:opacity-50 ${
                          plan.highlighted
                            ? "bg-[var(--mkt-accent)] text-[#080705]"
                            : plan.tier === "team"
                              ? "bg-[#080705] border border-[#26251e] text-[#f5f4ee]"
                              : "border border-[#f2f1ed] text-[#f5f4ee]"
                        }`}
                      >
                        {tier === plan.tier ? "Current plan" : plan.cta}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* FAQ */}
          <section className="pb-[100px] lg:pb-[180px]">
            <div className="max-w-[800px] mx-auto px-6">
              <h2 className="text-[28px] leading-[34px] md:text-[40px] md:leading-[48px] tracking-[-1.408px] font-normal text-[var(--mkt-text-primary)] mb-12 text-center">
                Frequently asked questions
              </h2>
              <div className="flex flex-col gap-4">
                {FAQS.map((faq) => (
                  <details
                    key={faq.q}
                    className="group border border-[rgba(255,255,255,0.07)] rounded-[4px] bg-[#282826]"
                  >
                    <summary className="cursor-pointer px-6 py-4 text-[14px] font-medium text-[#f5f4ee] list-none flex items-center justify-between">
                      {faq.q}
                      <span className="text-[#676662] transition-transform group-open:rotate-45 text-lg">
                        +
                      </span>
                    </summary>
                    <p className="px-6 pb-4 text-[14px] leading-[21px] text-[#99a1af]">
                      {faq.a}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          </section>
        </main>
      </div>

      <MarketingFooter />
    </>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--mkt-bg)]" />}>
      <PricingContent />
    </Suspense>
  );
}
