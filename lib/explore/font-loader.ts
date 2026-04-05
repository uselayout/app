/**
 * Generates font loading tags (Google Fonts <link> + @font-face CSS) for
 * injection into preview iframe srcdocs.
 */

import type { FontDeclaration, UploadedFont } from "@/lib/types";
import { buildGoogleFontsLinks } from "@/lib/fonts/google-fonts";

export interface FontTags {
  /** Google Fonts <link> tags */
  linkTags: string;
  /** @font-face CSS rules for uploaded and extracted fonts with src */
  fontFaceCSS: string;
  /** First font family name for body default (or null) */
  primaryFamily: string | null;
}

const MAX_FAMILIES = 10;

/** Map file extension to CSS font format string. */
function cssFormat(format: string): string {
  switch (format) {
    case "woff2": return "woff2";
    case "woff": return "woff";
    case "ttf": return "truetype";
    case "otf": return "opentype";
    default: return "woff2";
  }
}

/**
 * Build @font-face rules for uploaded fonts, pointing to the storage proxy.
 */
function buildUploadedFontFaces(fonts: UploadedFont[]): string {
  return fonts
    .map(
      (f) =>
        `@font-face{font-family:"${f.family}";src:url("${f.url}") format("${cssFormat(f.format)}");font-weight:${f.weight};font-style:${f.style};font-display:swap;}`
    )
    .join("\n");
}

/**
 * Build @font-face rules for extracted fonts that have a src URL
 * (from website extraction @font-face scraping).
 */
function buildExtractedFontFaces(fonts: FontDeclaration[]): string {
  const withSrc = fonts.filter((f) => f.src);
  return withSrc
    .map(
      (f) =>
        `@font-face{font-family:"${f.family}";src:${f.src};font-weight:${f.weight};font-style:${f.style};font-display:${f.display || "swap"};}`
    )
    .join("\n");
}

/**
 * Build all font loading tags for an iframe srcdoc.
 *
 * Priority: uploaded fonts > extracted fonts with src > Google Fonts links.
 * Families present in uploaded fonts are excluded from Google Fonts links.
 */
export function buildFontTags(
  extractedFonts?: FontDeclaration[],
  uploadedFonts?: UploadedFont[]
): FontTags {
  const extracted = extractedFonts ?? [];
  const uploaded = uploadedFonts ?? [];

  if (extracted.length === 0 && uploaded.length === 0) {
    return { linkTags: "", fontFaceCSS: "", primaryFamily: null };
  }

  // Families covered by uploaded fonts (skip these in Google Fonts)
  const uploadedFamilies = new Set(uploaded.map((f) => f.family));

  // @font-face rules for uploaded fonts
  const uploadedCSS = buildUploadedFontFaces(uploaded.slice(0, MAX_FAMILIES));

  // @font-face rules for extracted fonts with src (excluding uploaded families)
  const extractedWithSrc = extracted.filter(
    (f) => f.src && !uploadedFamilies.has(f.family)
  );
  const extractedCSS = buildExtractedFontFaces(extractedWithSrc);

  // Families already covered by @font-face rules
  const fontFaceFamilies = new Set([
    ...uploadedFamilies,
    ...extractedWithSrc.map((f) => f.family),
  ]);

  // Google Fonts links for remaining extracted fonts without src
  const googleCandidates = extracted.filter(
    (f) => !f.src && !fontFaceFamilies.has(f.family)
  );
  const remaining = MAX_FAMILIES - fontFaceFamilies.size;
  const googleLinks = remaining > 0
    ? buildGoogleFontsLinks(googleCandidates, remaining)
    : [];

  // Primary family: prefer uploaded, then extracted
  const primaryFamily =
    uploaded[0]?.family ?? extracted[0]?.family ?? null;

  return {
    linkTags: googleLinks.join("\n"),
    fontFaceCSS: [uploadedCSS, extractedCSS].filter(Boolean).join("\n"),
    primaryFamily,
  };
}
