"use client";

import { useState } from "react";
import type { PublicKitSummary } from "@/lib/types/kit";

// Renders the kit preview image when one exists, otherwise a generated
// gradient-and-wordmark card derived from the kit's name. Deterministic: same
// kit always gets the same placeholder, so the gallery doesn't look random.
export function KitPreview({
  kit,
  aspect = "4/3",
  className = "",
}: {
  kit: Pick<PublicKitSummary, "name" | "previewImageUrl" | "tags">;
  aspect?: "4/3" | "16/9";
  className?: string;
}) {
  const [broken, setBroken] = useState(false);
  const canShowImage = !!kit.previewImageUrl && !broken;

  if (canShowImage) {
    return (
      <div className={`relative overflow-hidden ${aspect === "16/9" ? "aspect-[16/9]" : "aspect-[4/3]"} ${className}`}>
        <img
          src={kit.previewImageUrl}
          alt={`${kit.name} preview`}
          onError={() => setBroken(true)}
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
