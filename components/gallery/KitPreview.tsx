"use client";

import { useState } from "react";
import type { PublicKitSummary } from "@/lib/types/kit";

// Renders the best available kit preview. Fallback chain:
//   1. heroImageUrl — GPT Image 2-generated stylised cover (marketing-grade).
//   2. previewImageUrl — Playwright screenshot of the Live Preview showcase
//      (truth-preserving, matches the detail page).
//   3. deterministic gradient placeholder derived from the kit's name.
// Image errors skip forward to the next step in the chain.
export function KitPreview({
  kit,
  aspect = "4/3",
  className = "",
}: {
  kit: Pick<PublicKitSummary, "name" | "previewImageUrl" | "heroImageUrl" | "tags">;
  aspect?: "4/3" | "16/9";
  className?: string;
}) {
  const candidates = [kit.heroImageUrl, kit.previewImageUrl].filter((u): u is string => !!u);
  const [cursor, setCursor] = useState(0);
  const activeUrl = candidates[cursor];

  if (activeUrl) {
    return (
      <div className={`relative overflow-hidden ${aspect === "16/9" ? "aspect-[16/9]" : "aspect-[4/3]"} ${className}`}>
        <img
          src={activeUrl}
          alt={`${kit.name} preview`}
          onError={() => setCursor((c) => c + 1)}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <Placeholder kit={kit} aspect={aspect} className={className} />
  );
}

function Placeholder({
  kit,
  aspect,
  className,
}: {
  kit: Pick<PublicKitSummary, "name" | "tags">;
  aspect: "4/3" | "16/9";
  className: string;
}) {
  const seed = seedFromString(kit.name);
  const baseHue = seed % 360;
  const isLight = kit.tags.some((t) => t.toLowerCase() === "light");
  const lightness = isLight ? 92 : 22;
  const textColour = isLight ? "#1a1a1f" : "#f7f8f8";
  const accentLightness = isLight ? 52 : 70;
  const gradientA = `hsl(${baseHue} 60% ${lightness}%)`;
  const gradientB = `hsl(${(baseHue + 40) % 360} 55% ${lightness + (isLight ? -6 : 10)}%)`;
  const accent = `hsl(${(baseHue + 180) % 360} 80% ${accentLightness}%)`;

  return (
    <div
      className={`relative overflow-hidden ${aspect === "16/9" ? "aspect-[16/9]" : "aspect-[4/3]"} ${className}`}
      style={{ background: `linear-gradient(135deg, ${gradientA} 0%, ${gradientB} 100%)` }}
    >
      {/* A soft accent circle for visual interest */}
      <span
        className="absolute rounded-full"
        style={{
          width: "60%",
          height: "60%",
          top: "-20%",
          right: "-15%",
          background: accent,
          opacity: 0.18,
          filter: "blur(20px)",
        }}
      />
      <div className="absolute inset-0 flex flex-col items-start justify-end p-5">
        <span
          className="text-[11px] uppercase tracking-[0.16em] opacity-60"
          style={{ color: textColour }}
        >
          Preview
        </span>
        <span
          className="text-[24px] leading-[28px] font-medium"
          style={{ color: textColour }}
        >
          {kit.name}
        </span>
      </div>
    </div>
  );
}

function seedFromString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h = (h ^ s.charCodeAt(i)) * 16777619;
    h = h | 0;
  }
  return Math.abs(h);
}
