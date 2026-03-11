"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { PricingTable } from "@/components/billing/PricingTable";
import { useBilling } from "@/lib/hooks/use-billing";
import { Zap, ArrowLeft, Check } from "lucide-react";
import type { SubscriptionTier } from "@/lib/types/billing";

function PricingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { tier, loading } = useBilling();

  const success = searchParams.get("success");

  const handleSelectTier = async (selected: SubscriptionTier | "topup") => {
    if (selected === "free") {
      router.push("/");
      return;
    }

    const body = selected === "topup"
      ? { type: "topup" }
      : { tier: selected };

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

  const handleManage = async () => {
    const res = await fetch("/api/billing/portal", { method: "POST" });
    if (res.ok) {
      const { url } = await res.json();
      window.location.href = url;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Studio
          </button>
          <span className="text-sm font-semibold text-gray-900">Layout</span>
          {tier !== "free" && (
            <button
              onClick={handleManage}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
            >
              Manage subscription
            </button>
          )}
        </div>
      </nav>

      {/* Success banner */}
      {success && (
        <div className="border-b border-green-100 bg-green-50 px-6 py-3 text-center">
          <p className="flex items-center justify-center gap-2 text-sm font-medium text-green-800">
            <Check className="h-4 w-4" />
            {success === "topup"
              ? "Credits added successfully!"
              : `You're now on the ${success.charAt(0).toUpperCase() + success.slice(1)} plan!`}
          </p>
        </div>
      )}

      {/* Hero */}
      <section className="px-6 pt-20 pb-16 text-center">
        <h1 className="mx-auto max-w-3xl text-5xl font-black tracking-tight text-gray-900 sm:text-6xl leading-[1.1]">
          Free forever with your own API key.
        </h1>
        <p className="mx-auto mt-6 max-w-lg text-lg text-gray-500 leading-relaxed">
          Or let us handle everything for £29/month. Extract design systems, generate DESIGN.md, test with AI — all included.
        </p>
      </section>

      {/* Pricing tiers */}
      <section className="px-6 pb-16">
        {loading ? (
          <div className="text-center text-gray-400">Loading...</div>
        ) : (
          <PricingTable currentTier={tier} onSelectTier={handleSelectTier} />
        )}
      </section>

      {/* Credit top-up */}
      <section className="mx-auto max-w-2xl px-6 pb-20">
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-8 text-center">
          <Zap className="mx-auto mb-4 h-8 w-8 text-indigo-600" />
          <h3 className="mb-2 text-xl font-bold text-gray-900">Need more credits?</h3>
          <p className="mb-6 text-sm text-gray-500">
            Top up anytime. £15 for 30 DESIGN.md generations + 150 test queries. Credits never expire.
          </p>
          <button
            onClick={() => handleSelectTier("topup")}
            className="rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white hover:bg-gray-800 transition-all"
          >
            Buy credit pack — £15
          </button>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-6 pb-20">
        <h2 className="mb-10 text-center text-3xl font-black text-gray-900">
          Frequently asked questions
        </h2>
        <div className="space-y-6">
          {faqs.map((faq) => (
            <details key={faq.q} className="group rounded-xl border border-gray-200 bg-white">
              <summary className="cursor-pointer px-6 py-4 text-sm font-semibold text-gray-900 list-none flex items-center justify-between">
                {faq.q}
                <span className="text-gray-400 transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="px-6 pb-4 text-sm text-gray-500 leading-relaxed">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 px-6 py-8 text-center text-xs text-gray-400">
        Layout · layout.design
      </footer>
    </div>
  );
}

const faqs = [
  {
    q: "What's included in the free tier?",
    a: "Everything except hosted AI. You get unlimited extractions from Figma and websites, all 6 export formats (DESIGN.md, CLAUDE.md, AGENTS.md, tokens.css, tokens.json, tailwind.config.js), unlimited projects, and 3 starter kits. You just need your own Anthropic API key for DESIGN.md generation and the test panel.",
  },
  {
    q: "What does 'hosted AI' mean?",
    a: "On Pro and Team plans, we provide the Claude API calls — you don't need your own Anthropic key. We handle the AI infrastructure so you can focus on building. Your monthly credits cover DESIGN.md generation and test panel queries.",
  },
  {
    q: "Can I still use my own API key on a paid plan?",
    a: "Yes! BYOK always works, even on paid plans. When you provide your own key, no hosted credits are consumed. It's the best of both worlds.",
  },
  {
    q: "Do top-up credits expire?",
    a: "No. Purchased credit packs never expire. Monthly credits reset each billing cycle, but top-up credits carry over indefinitely.",
  },
  {
    q: "What happens when I run out of credits?",
    a: "You'll see a prompt to top up or switch to your own API key. We never block your workflow — BYOK is always available as a fallback.",
  },
  {
    q: "Is the CLI and MCP server free?",
    a: "Yes, forever. The @layoutdesign/context CLI and MCP server are MIT-licensed open source. You can self-host the entire Studio too.",
  },
];

export default function PricingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <PricingContent />
    </Suspense>
  );
}
