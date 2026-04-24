"use client";

import { useState } from "react";

// Small presentational avatar with a coloured-circle-with-initial fallback.
// Use when an image URL is either missing or may fail to load (seeded kits
// referencing assets that never uploaded, HTTPS sites with HTTP authors, etc).
export function Avatar({
  src,
  name,
  size = 20,
  className = "",
}: {
  src?: string;
  name?: string;
  size?: number;
  className?: string;
}) {
  const [broken, setBroken] = useState(false);
  const canShowImage = !!src && !broken;
  const initial = (name ?? "?").trim().charAt(0).toUpperCase() || "?";
  // Pick a stable hue from the name so every author has a consistent colour.
  const hue = name
    ? [...name].reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) % 360, 0)
    : 210;

  const dim = { width: size, height: size };

  if (canShowImage) {
    return (
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        onError={() => setBroken(true)}
        className={`rounded-full bg-[var(--mkt-surface-muted)] object-cover ${className}`}
        style={dim}
      />
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-medium text-[#08090a] ${className}`}
      style={{
        ...dim,
        background: `hsl(${hue} 85% 78%)`,
        fontSize: Math.round(size * 0.46),
      }}
      aria-hidden
    >
      {initial}
    </span>
  );
}
