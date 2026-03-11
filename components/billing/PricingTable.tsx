"use client";

import { Check, X } from "lucide-react";
import type { SubscriptionTier } from "@/lib/types/billing";

interface PricingTableProps {
  currentTier?: SubscriptionTier;
  onSelectTier: (tier: SubscriptionTier | "topup") => void;
}

const tiers = [
  {
    id: "free" as const,
    name: "Free",
    price: "£0",
    period: "forever",
    description: "Bring your own Anthropic API key",
    cta: "Get Started",
    features: [
      { text: "Unlimited extractions", included: true },
      { text: "All 6 export formats", included: true },
      { text: "Unlimited projects", included: true },
      { text: "3 starter kits", included: true },
      { text: "BYOK — use your own API key", included: true },
      { text: "Hosted AI credits", included: false },
      { text: "Drift monitoring", included: false },
      { text: "Premium kits", included: false },
      { text: "Priority extraction queue", included: false },
    ],
  },
  {
    id: "pro" as const,
    name: "Pro",
    price: "£29",
    period: "/month",
    description: "Hosted AI — no API key needed",
    cta: "Upgrade to Pro",
    popular: true,
    features: [
      { text: "Unlimited extractions", included: true },
      { text: "All 6 export formats", included: true },
      { text: "Unlimited projects", included: true },
      { text: "3 starter kits", included: true },
      { text: "BYOK — use your own API key", included: true },
      { text: "50 DESIGN.md + 300 test queries/mo", included: true },
      { text: "Drift monitoring", included: true },
      { text: "All premium kits", included: true },
      { text: "Priority extraction queue", included: true },
    ],
  },
  {
    id: "team" as const,
    name: "Team",
    price: "£29 + £15",
    period: "/seat/month",
    description: "Shared design system library",
    cta: "Start Team Plan",
    features: [
      { text: "Everything in Pro", included: true },
      { text: "50 DESIGN.md + 300 queries per seat", included: true },
      { text: "Shared design system library", included: true },
      { text: "Team management", included: true },
      { text: "Centralised API key management", included: true },
      { text: "Centralised billing", included: true },
      { text: "SSO (coming soon)", included: true },
      { text: "Priority support", included: true },
      { text: "Custom kits on request", included: true },
    ],
  },
];

export function PricingTable({ currentTier, onSelectTier }: PricingTableProps) {
  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-3">
      {tiers.map((tier) => {
        const isCurrent = currentTier === tier.id;
        const isPopular = tier.popular;

        return (
          <div
            key={tier.id}
            className={`relative flex flex-col rounded-2xl border p-8 ${
              isPopular
                ? "border-indigo-600 bg-indigo-600/5 shadow-lg shadow-indigo-600/10"
                : "border-gray-200 bg-white"
            }`}
          >
            {isPopular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-4 py-1 text-xs font-semibold text-white">
                Most popular
              </span>
            )}

            <h3 className="text-xl font-bold text-gray-900">{tier.name}</h3>
            <p className="mt-1 text-sm text-gray-500">{tier.description}</p>

            <div className="mt-6 flex items-baseline gap-1">
              <span className="text-4xl font-black text-gray-900">{tier.price}</span>
              <span className="text-sm text-gray-500">{tier.period}</span>
            </div>

            <button
              onClick={() => onSelectTier(tier.id)}
              disabled={isCurrent}
              className={`mt-8 w-full rounded-xl py-3 text-sm font-semibold transition-all ${
                isCurrent
                  ? "cursor-default bg-gray-100 text-gray-400"
                  : isPopular
                    ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/20"
                    : "bg-gray-900 text-white hover:bg-gray-800"
              }`}
            >
              {isCurrent ? "Current plan" : tier.cta}
            </button>

            <ul className="mt-8 flex-1 space-y-3">
              {tier.features.map((feature) => (
                <li key={feature.text} className="flex items-start gap-3 text-sm">
                  {feature.included ? (
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                  ) : (
                    <X className="mt-0.5 h-4 w-4 shrink-0 text-gray-300" />
                  )}
                  <span className={feature.included ? "text-gray-700" : "text-gray-400"}>
                    {feature.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
