/**
 * Builds Google Fonts <link> tags from font declarations that lack a src URL.
 * One <link> per family so a bad family name doesn't block the others.
 */

import type { FontDeclaration } from "@/lib/types";

/** Group fonts by family and collect unique weights per family. */
function groupByFamily(fonts: FontDeclaration[]): Map<string, Set<string>> {
  const families = new Map<string, Set<string>>();
  for (const f of fonts) {
    if (!f.family || f.family === "Unknown") continue;
    const existing = families.get(f.family) ?? new Set<string>();
    // Normalise weight: "normal" -> "400", "bold" -> "700"
    const w = f.weight === "normal" ? "400" : f.weight === "bold" ? "700" : f.weight;
    existing.add(w);
    families.set(f.family, existing);
  }
  return families;
}

/**
 * Build a single Google Fonts CSS2 URL for one family.
 * e.g. https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap
 */
function buildUrlForFamily(family: string, weights: Set<string>): string {
  const encoded = encodeURIComponent(family);
  const sortedWeights = [...weights].sort((a, b) => Number(a) - Number(b));

  // If only regular weight, no axis needed
  if (sortedWeights.length === 1 && sortedWeights[0] === "400") {
    return `https://fonts.googleapis.com/css2?family=${encoded}&display=swap`;
  }

  return `https://fonts.googleapis.com/css2?family=${encoded}:wght@${sortedWeights.join(";")}&display=swap`;
}

/**
 * Returns an array of <link> tag strings for Google Fonts.
 * Fonts that already have a `src` URL are excluded (they use @font-face instead).
 */
export function buildGoogleFontsLinks(fonts: FontDeclaration[], maxFamilies = 10): string[] {
  // Only include fonts without a src (Figma extractions, or website fonts without file refs)
  const googleCandidates = fonts.filter((f) => !f.src);
  const families = groupByFamily(googleCandidates);

  const links: string[] = [];
  let count = 0;
  for (const [family, weights] of families) {
    if (count >= maxFamilies) break;
    const url = buildUrlForFamily(family, weights);
    links.push(`<link rel="stylesheet" href="${url}">`);
    count++;
  }

  return links;
}
