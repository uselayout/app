import type { ExtractionResult } from "@/lib/types";

/**
 * Build a structured layout digest from the signals that extraction already
 * captures (auto-layout patterns, computed styles for structural elements,
 * button census, component inventory, breakpoints). The synthesis prompt
 * uses this to write Section 5 (Page Structure & Layout Patterns) even when
 * no page screenshots are available — which is the common case for Figma
 * files and for any website extraction that didn't produce usable shots.
 *
 * Returns null when there's nothing useful to report.
 */
export function buildLayoutDigest(data: ExtractionResult): string | null {
  const lines: string[] = [];

  // Probable page sections inferred from component names.
  if (data.components && data.components.length > 0) {
    const compNames = data.components.map((c) => c.name.toLowerCase());
    const hasAny = (kw: string[]) =>
      kw.some((k) => compNames.some((n) => n.includes(k)));
    const sections: string[] = [];
    if (hasAny(["nav", "header", "topbar"])) sections.push("Nav/Header");
    if (hasAny(["hero", "jumbotron", "banner"])) sections.push("Hero");
    if (hasAny(["feature", "card", "grid", "tile"])) sections.push("Feature/Card grid");
    if (hasAny(["testimonial", "quote", "review"])) sections.push("Testimonials");
    if (hasAny(["pricing", "plan", "tier"])) sections.push("Pricing");
    if (hasAny(["faq", "accordion"])) sections.push("FAQ");
    if (hasAny(["cta", "callout", "signup"])) sections.push("CTA block");
    if (hasAny(["footer"])) sections.push("Footer");
    if (sections.length > 0) {
      lines.push(`Probable page sections (inferred from component inventory): ${sections.join(" → ")}.`);
    }
  }

  // Figma auto-layout patterns.
  if (data.layoutPatterns && data.layoutPatterns.length > 0) {
    const top = data.layoutPatterns
      .slice(0, 8)
      .map((p) => `${p.direction} main:${p.mainAxis} cross:${p.crossAxis} (×${p.count})`);
    lines.push(`Most common auto-layout patterns: ${top.join("; ")}.`);
  }

  // Structural layout from computed styles (website).
  if (data.computedStyles) {
    const structural: string[] = [];
    for (const key of ["role_navigation", "card", "modal", "button_primary"]) {
      const s = data.computedStyles[key];
      if (!s) continue;
      const bits: string[] = [];
      if (s.display) bits.push(`display:${s.display}`);
      if (s.flexDirection) bits.push(`flex:${s.flexDirection}`);
      if (s.gap && s.gap !== "normal" && s.gap !== "0px") bits.push(`gap:${s.gap}`);
      if (s.justifyContent && s.justifyContent !== "normal") bits.push(`justify:${s.justifyContent}`);
      if (s.alignItems && s.alignItems !== "normal") bits.push(`align:${s.alignItems}`);
      if (s.padding) bits.push(`padding:${s.padding}`);
      if (bits.length > 0) structural.push(`${key} → ${bits.join(", ")}`);
    }
    if (structural.length > 0) {
      lines.push(`Structural layout signals:\n  ${structural.join("\n  ")}`);
    }
  }

  // Primary CTA dominance from button colour census.
  if (data.buttonColourCensus) {
    const entries = Object.entries(data.buttonColourCensus)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 3);
    if (entries.length > 0) {
      const top = entries.map(([colour, info]) => {
        const sample = info.elements[0];
        const label = sample?.text ? `"${sample.text.slice(0, 30)}"` : sample?.tag ?? "";
        return `${colour} ×${info.count}${label ? ` (e.g. ${label})` : ""}`;
      });
      lines.push(`Primary CTA dominance (most common button backgrounds): ${top.join("; ")}.`);
    }
  }

  // Responsive breakpoints.
  if (data.breakpoints && data.breakpoints.length > 0) {
    lines.push(`Detected responsive breakpoints: ${data.breakpoints.join(", ")}.`);
  }

  // Typographic hierarchy — size + weight for h1/h2/h3/body.
  if (data.computedStyles) {
    const hierarchy: string[] = [];
    for (const key of ["h1", "h2", "h3", "body"]) {
      const s = data.computedStyles[key];
      if (!s?.fontSize) continue;
      const weight = s.fontWeight ? ` ${s.fontWeight}` : "";
      hierarchy.push(`${key}:${s.fontSize}${weight}`);
    }
    if (hierarchy.length >= 2) {
      lines.push(`Typographic hierarchy: ${hierarchy.join(", ")}.`);
    }
  }

  return lines.length > 0 ? lines.join("\n") : null;
}
