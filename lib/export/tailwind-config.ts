import type { ExtractedTokens } from "@/lib/types";

function parseTypographyValue(value: string): {
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  lineHeight?: string;
  letterSpacing?: string;
} {
  const parts: Record<string, string> = {};
  for (const segment of value.split(";")) {
    const colonIdx = segment.indexOf(":");
    if (colonIdx === -1) continue;
    const key = segment.slice(0, colonIdx).trim();
    const val = segment.slice(colonIdx + 1).trim();
    if (key && val) parts[key] = val;
  }
  return {
    fontFamily: parts["font-family"],
    fontSize: parts["font-size"],
    fontWeight: parts["font-weight"],
    lineHeight: parts["line-height"],
    letterSpacing: parts["letter-spacing"],
  };
}

function sanitiseKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/[/\s]+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function weightName(weight: string): string {
  const map: Record<string, string> = {
    "100": "thin",
    "200": "extralight",
    "300": "light",
    "400": "normal",
    "500": "medium",
    "600": "semibold",
    "700": "bold",
    "800": "extrabold",
    "900": "black",
  };
  return map[weight] || `w${weight}`;
}

export function generateTailwindConfig(tokens: ExtractedTokens): string {
  const colors: Record<string, string> = {};
  const spacing: Record<string, string> = {};
  const borderRadius: Record<string, string> = {};
  const fontFamily: Record<string, string[]> = {};
  const fontSize: Record<string, string> = {};
  const fontWeight: Record<string, string> = {};
  const lineHeight: Record<string, string> = {};
  const letterSpacing: Record<string, string> = {};
  const boxShadow: Record<string, string> = {};
  const transitionDuration: Record<string, string> = {};
  const transitionTimingFunction: Record<string, string> = {};

  for (const token of tokens.colors) {
    const key = sanitiseKey(token.name);
    const varName = token.cssVariable || `--color-${key}`;
    colors[key] = `var(${varName})`;
  }

  for (const token of tokens.spacing) {
    const key = sanitiseKey(token.name);
    const varName = token.cssVariable || `--space-${key}`;
    spacing[key] = `var(${varName})`;
  }

  for (const token of tokens.radius) {
    const key = sanitiseKey(token.name);
    const varName = token.cssVariable || `--radius-${key}`;
    borderRadius[key] = `var(${varName})`;
  }

  // Parse typography tokens for fontFamily, fontSize, fontWeight, lineHeight, letterSpacing
  const seenFamilies = new Set<string>();
  const seenSizes = new Set<string>();
  const seenWeights = new Set<string>();
  const seenLineHeights = new Set<string>();
  const seenLetterSpacings = new Set<string>();

  for (const token of tokens.typography) {
    const parsed = parseTypographyValue(token.value);

    if (parsed.fontFamily && !seenFamilies.has(parsed.fontFamily)) {
      seenFamilies.add(parsed.fontFamily);
      const key = sanitiseKey(parsed.fontFamily);
      const isSerif = /serif/i.test(parsed.fontFamily) && !/sans-serif/i.test(parsed.fontFamily);
      fontFamily[key] = [`"${parsed.fontFamily}"`, isSerif ? "serif" : "sans-serif"];
    }

    if (parsed.fontSize && !seenSizes.has(parsed.fontSize)) {
      seenSizes.add(parsed.fontSize);
      const key = sanitiseKey(token.name);
      fontSize[key] = parsed.fontSize;
    }

    if (parsed.fontWeight && !seenWeights.has(parsed.fontWeight)) {
      seenWeights.add(parsed.fontWeight);
      const key = weightName(parsed.fontWeight);
      fontWeight[key] = parsed.fontWeight;
    }

    if (parsed.lineHeight && !seenLineHeights.has(parsed.lineHeight)) {
      seenLineHeights.add(parsed.lineHeight);
      const key = sanitiseKey(token.name);
      lineHeight[key] = parsed.lineHeight;
    }

    if (parsed.letterSpacing && !seenLetterSpacings.has(parsed.letterSpacing)) {
      seenLetterSpacings.add(parsed.letterSpacing);
      const key = sanitiseKey(token.name);
      letterSpacing[key] = parsed.letterSpacing;
    }
  }

  // Effects → boxShadow
  for (const token of tokens.effects) {
    const key = sanitiseKey(token.name);
    const varName = token.cssVariable || `--effect-${key}`;
    boxShadow[key] = `var(${varName})`;
  }

  // Motion → transitionDuration and transitionTimingFunction
  for (const token of tokens.motion) {
    const key = sanitiseKey(token.name);
    const varName = token.cssVariable || `--motion-${key}`;
    const val = token.value.toLowerCase();

    if (/cubic-bezier|ease|linear/.test(val)) {
      transitionTimingFunction[key] = `var(${varName})`;
    } else if (/\d+m?s/.test(val)) {
      transitionDuration[key] = `var(${varName})`;
    }
  }

  const extend: Record<string, unknown> = {};
  if (Object.keys(colors).length > 0) extend.colors = colors;
  if (Object.keys(spacing).length > 0) extend.spacing = spacing;
  if (Object.keys(borderRadius).length > 0) extend.borderRadius = borderRadius;
  if (Object.keys(fontFamily).length > 0) extend.fontFamily = fontFamily;
  if (Object.keys(fontSize).length > 0) extend.fontSize = fontSize;
  if (Object.keys(fontWeight).length > 0) extend.fontWeight = fontWeight;
  if (Object.keys(lineHeight).length > 0) extend.lineHeight = lineHeight;
  if (Object.keys(letterSpacing).length > 0) extend.letterSpacing = letterSpacing;
  if (Object.keys(boxShadow).length > 0) extend.boxShadow = boxShadow;
  if (Object.keys(transitionDuration).length > 0) extend.transitionDuration = transitionDuration;
  if (Object.keys(transitionTimingFunction).length > 0) extend.transitionTimingFunction = transitionTimingFunction;

  const config = {
    theme: {
      extend,
    },
  };

  return `/** @type {import('tailwindcss').Config} */
module.exports = ${JSON.stringify(config, null, 2)};
`;
}
