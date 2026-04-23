import { chromium } from "playwright";
import { registerBrowser, deregisterBrowser } from "@/lib/server/active-streams";
import {
  extractCSSVariablesScript,
  extractFontsScript,
  extractComputedStylesScript,
  extractAnimationsScript,
  extractBreakpointsScript,
  extractRadiusCensusScript,
  extractButtonColourCensusScript,
  extractInteractiveStatesScript,
  extractComponentPatternsScript,
  extractTypographyCensusScript,
  extractSpacingCensusScript,
  extractShadowCensusScript,
  extractMotionCensusScript,
  detectLibrariesScript,
} from "./css-extract";
import {
  buildTypographyTokensFromCensus,
  buildSpacingTokensFromCensus,
  buildRadiusTokensFromCensus,
  buildShadowTokensFromCensus,
  buildMotionTokensFromCensus,
  buildColourTokensFromCensus,
} from "./scale-builder";
import { partitionNoise } from "@/lib/extraction/noise";
import { dedupeTokensByValue } from "@/lib/extraction/dedupe";
import type {
  ExtractionResult,
  FontDeclaration,
  AnimationDefinition,
  ComputedStyleMap,
  ExtractedToken,
  TokenType,
} from "@/lib/types";

interface WebsiteExtractionOptions {
  url: string;
  onProgress?: (step: string, percent: number, detail?: string) => void;
}

/** Check whether a CSS value looks like a colour. */
function isColourValue(value: string): boolean {
  const v = value.trim().toLowerCase();
  // hex (#fff, #ffffff, #ffffffaa)
  if (/^#[0-9a-f]{3,8}$/i.test(v)) return true;
  // rgb/rgba/hsl/hsla/oklch/oklab/lch/lab/color()
  if (/^(rgb|rgba|hsl|hsla|oklch|oklab|lch|lab|color)\s*\(/.test(v)) return true;
  // Named CSS colours (common ones that appear as token values)
  const named = new Set([
    "transparent", "currentcolor", "inherit", "white", "black",
    "red", "green", "blue", "yellow", "orange", "purple", "pink",
    "grey", "gray", "navy", "teal", "aqua", "maroon", "lime",
  ]);
  if (named.has(v)) return true;
  // Bare HSL triple (shadcn format: "222.2 84% 4.9%")
  if (/^[\d.]+\s+[\d.]+%\s+[\d.]+%$/.test(v)) return true;
  return false;
}

/** Check whether a CSS value looks like a length/dimension. */
function isLengthValue(value: string): boolean {
  return /^-?[\d.]+\s*(px|rem|em|%|vh|vw|vmin|vmax|ch|ex|svh|dvh|lvh|cqw|cqh)$/i.test(value.trim());
}

/** Check whether a CSS value looks like a plain number (z-index, opacity, etc.). */
function isNumericValue(value: string): boolean {
  return /^-?[\d.]+$/.test(value.trim());
}

/** Check whether a CSS value looks like a font stack. */
function isFontStackValue(value: string): boolean {
  // Font stacks typically contain commas and quoted/unquoted family names
  return /,/.test(value) && /[a-z-]+/i.test(value) && !isColourValue(value);
}

/**
 * Classify a CSS variable into a token. Uses name-based heuristics first,
 * then falls back to value-based classification. Never drops tokens.
 */
function cssVarToToken(name: string, value: string): ExtractedToken {
  const lower = name.toLowerCase();
  const resolvedValue = value.trim();
  const valueIsColour = isColourValue(resolvedValue);
  const valueIsLength = isLengthValue(resolvedValue);

  // ── Name + value disambiguation ──
  // "text" in name is ambiguous: could be colour (--text-primary: #333)
  // or typography (--text-large-size: 1.0625rem). Resolve by checking value.
  if (lower.includes("radius") || lower.includes("rounded")) {
    return { name, value, type: "radius", category: "semantic", cssVariable: name };
  }
  if (lower.includes("font") || lower.includes("line-height") || lower.includes("letter-spacing") || lower.includes("tracking") || lower.includes("leading")) {
    return { name, value, type: "typography", category: "semantic", cssVariable: name };
  }
  // Value references a font variable (e.g. var(--font-inter))
  if (/var\(--font-/i.test(resolvedValue)) {
    return { name, value, type: "typography", category: "semantic", cssVariable: name };
  }
  if (lower.includes("spacing") || lower.includes("space") || lower.includes("gap") || lower.includes("padding") || lower.includes("margin") || lower.includes("inset")) {
    return { name, value, type: "spacing", category: "semantic", cssVariable: name };
  }

  // For names containing "text", "size", "bg", "color", "border": disambiguate by value
  if (lower.includes("color") || lower.includes("colour")) {
    return { name, value, type: "color", category: "semantic", cssVariable: name };
  }
  if (lower.includes("bg") || lower.includes("background") || lower.includes("fill") || lower.includes("stroke")) {
    return { name, value, type: "color", category: "semantic", cssVariable: name };
  }
  if (lower.includes("border")) {
    // Border can be colour or spacing. Check value.
    return { name, value, type: valueIsColour ? "color" : "spacing", category: "semantic", cssVariable: name };
  }
  if (lower.includes("text") || lower.includes("size")) {
    // "text" is ambiguous. If value is a colour, it's a colour token. Otherwise typography.
    if (valueIsColour) {
      return { name, value, type: "color", category: "semantic", cssVariable: name };
    }
    return { name, value, type: "typography", category: "semantic", cssVariable: name };
  }

  // ── Value-based fallback (no keyword matched) ──
  if (valueIsColour) {
    return { name, value, type: "color", category: "semantic", cssVariable: name };
  }
  if (isFontStackValue(resolvedValue)) {
    return { name, value, type: "typography", category: "semantic", cssVariable: name };
  }
  if (valueIsLength) {
    return { name, value, type: "spacing", category: "semantic", cssVariable: name };
  }
  if (isNumericValue(resolvedValue)) {
    return { name, value, type: "effect", category: "semantic", cssVariable: name };
  }

  // Everything else (complex values, var() references, etc.)
  return { name, value, type: "effect", category: "semantic", cssVariable: name };
}

export async function extractFromWebsite({
  url,
  onProgress,
}: WebsiteExtractionOptions): Promise<ExtractionResult> {
  const browser = await chromium.launch({ headless: true });
  registerBrowser(browser);
  let page: Awaited<ReturnType<typeof browser.newPage>> | null = null;

  try {
    page = await browser.newPage({
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      viewport: { width: 1440, height: 900 },
    });

    onProgress?.("navigate", 10, `Navigating to ${url}...`);
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
    // Allow JS-rendered content to settle before extracting styles
    await page.waitForLoadState("load", { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);

    // Extract CSS variables (now returns both flat and mode-tagged versions)
    onProgress?.("css", 25, "Extracting CSS custom properties...");
    const cssResult: {
      flat: Record<string, string>;
      moded: Array<{ name: string; value: string; mode: string; selector: string }>;
    } = await page.evaluate(`(${extractCSSVariablesScript})()`);
    const cssVariables = cssResult.flat;
    const modedVariables = cssResult.moded;
    onProgress?.("css", 30, `Found ${Object.keys(cssVariables).length} CSS custom properties`);

    // Extract fonts
    onProgress?.("fonts", 35, "Extracting font declarations...");
    const fonts: FontDeclaration[] = await page.evaluate(`(${extractFontsScript})()`);
    onProgress?.("fonts", 40, `Found ${fonts.length} font declarations`);

    // Extract computed styles
    onProgress?.("computed", 45, "Extracting computed styles...");
    const computedStyles: Record<string, ComputedStyleMap> = await page.evaluate(
      `(${extractComputedStylesScript})()`
    );
    onProgress?.("computed", 50, `Sampled ${Object.keys(computedStyles).length} element styles`);

    // Extract animations
    onProgress?.("animations", 55, "Extracting animations...");
    const animations: AnimationDefinition[] = await page.evaluate(`(${extractAnimationsScript})()`);
    onProgress?.("animations", 58, `Found ${animations.length} animations`);

    // Extract media query breakpoints
    onProgress?.("breakpoints", 59, "Extracting breakpoints...");
    const breakpoints: string[] = await page.evaluate(`(${extractBreakpointsScript})()`);

    // Survey border-radius usage across all interactive elements
    onProgress?.("radius", 60, "Surveying border-radius usage...");
    const radiusCensus: Record<string, { count: number; elements: Array<{ tag: string; class: string; text: string }> }> =
      await page.evaluate(`(${extractRadiusCensusScript})()`);

    // Survey button/CTA background colours for primary colour detection
    onProgress?.("buttons", 61, "Surveying button colours...");
    const buttonColourCensus: Record<string, { count: number; elements: Array<{ tag: string; text: string; area: number; color: string }> }> =
      await page.evaluate(`(${extractButtonColourCensusScript})()`);

    // Survey typography: distinct font-size / font-weight / line-height /
    // letter-spacing values across visible text. Populates real type scale
    // when the site doesn't expose one via CSS custom properties.
    onProgress?.("typography-census", 62, "Surveying typography scale...");
    type Samples = Array<{ tag: string; cls?: string; text?: string }>;
    type CensusBucket = Record<string, { count: number; samples?: Samples }>;
    const typographyCensus: {
      sizes: CensusBucket;
      weights: CensusBucket;
      lineHeights: CensusBucket;
      letterSpacings: CensusBucket;
    } = await page.evaluate(`(${extractTypographyCensusScript})()`);

    onProgress?.("spacing-census", 62, "Surveying spacing scale...");
    const spacingCensus: CensusBucket = await page.evaluate(`(${extractSpacingCensusScript})()`);

    onProgress?.("shadow-census", 63, "Surveying elevation...");
    const shadowCensus: CensusBucket = await page.evaluate(`(${extractShadowCensusScript})()`);

    onProgress?.("motion-census", 63, "Surveying motion...");
    const motionCensus: { durations: CensusBucket; easings: CensusBucket } =
      await page.evaluate(`(${extractMotionCensusScript})()`);

    // Extract interactive state styles (hover/focus/active) from CSS rules
    onProgress?.("states", 62, "Extracting interactive states...");
    const interactiveStates: Record<string, Record<string, string>> =
      await page.evaluate(`(${extractInteractiveStatesScript})()`);

    // Detect libraries
    onProgress?.("libraries", 64, "Detecting libraries...");
    const librariesDetected: Record<string, boolean> = await page.evaluate(`(${detectLibrariesScript})()`);
    const libCount = Object.values(librariesDetected).filter(Boolean).length;
    if (libCount > 0) {
      onProgress?.("libraries", 65, `Detected ${libCount} ${libCount === 1 ? "library" : "libraries"}`);
    }

    // Discover component patterns from the DOM
    onProgress?.("components", 67, "Discovering component patterns...");
    const componentPatterns: Array<{
      name: string;
      type: string;
      variantCount: number;
      totalInstances: number;
      variants: Array<Record<string, unknown>>;
    }> = await page.evaluate(`(${extractComponentPatternsScript})()`);
    if (componentPatterns.length > 0) {
      onProgress?.("components", 69, `Found ${componentPatterns.length} component patterns`);
    }

    // Take screenshots (non-fatal — extraction continues without them)
    onProgress?.("screenshots", 70, "Capturing screenshots...");
    let screenshots: string[] = [];
    try {
      const fullPageBuffer = await page.screenshot({ fullPage: true, type: "png", timeout: 15_000 });
      const viewportBuffer = await page.screenshot({ fullPage: false, type: "png", timeout: 15_000 });
      screenshots = [
        `data:image/png;base64,${fullPageBuffer.toString("base64")}`,
        `data:image/png;base64,${viewportBuffer.toString("base64")}`,
      ];
    } catch {
      // Retry once — Protocol errors can be transient
      try {
        const viewportBuffer = await page.screenshot({ fullPage: false, type: "png", timeout: 15_000 });
        screenshots = [`data:image/png;base64,${viewportBuffer.toString("base64")}`];
      } catch {
        onProgress?.("screenshots", 72, "Screenshots couldn't be captured for this site, but tokens and styles were extracted successfully.");
      }
    }

    // Classify CSS variables into tokens using mode-tagged data
    const colors: ExtractedToken[] = [];
    const typography: ExtractedToken[] = [];
    const spacing: ExtractedToken[] = [];
    const radius: ExtractedToken[] = [];
    const effects: ExtractedToken[] = [];
    const motion: ExtractedToken[] = [];

    // Emit default-scoped tokens directly from the flat cssVariables map —
    // these are the browser-resolved values, which always represent the
    // default / light mode at extraction time. Never tag these with a mode.
    for (const [name, value] of Object.entries(cssVariables)) {
      const token = cssVarToToken(name, value);
      switch (token.type) {
        case "color": colors.push(token); break;
        case "typography": typography.push(token); break;
        case "spacing": spacing.push(token); break;
        case "radius": radius.push(token); break;
        case "effect": effects.push(token); break;
        case "motion": motion.push(token); break;
      }
    }

    // Emit non-default mode variants from moded variables. Dark-only vars
    // (present only in a [data-theme="dark"] block, no default counterpart)
    // are surfaced too — previously they were filtered out. Each
    // (name, mode) pair is deduped so the same var doesn't land twice.
    const seenModeVariant = new Set<string>();
    for (const mv of modedVariables) {
      if (mv.mode === "default") continue;
      const dedupKey = `${mv.mode}::${mv.name}`;
      if (seenModeVariant.has(dedupKey)) continue;
      seenModeVariant.add(dedupKey);

      const token = cssVarToToken(mv.name, mv.value);
      token.mode = mv.mode;
      switch (token.type) {
        case "color": colors.push(token); break;
        case "typography": typography.push(token); break;
        case "spacing": spacing.push(token); break;
        case "radius": radius.push(token); break;
        case "effect": effects.push(token); break;
        case "motion": motion.push(token); break;
      }
    }

    // Extract gradients and blur from computed styles (Issues 9-10)
    for (const [element, style] of Object.entries(computedStyles)) {
      const s = style as Record<string, string>;
      // Gradient extraction
      if (s.backgroundImage && s.backgroundImage !== "none" && s.backgroundImage.includes("gradient")) {
        colors.push({
          name: `--gradient-${element}-bg`,
          value: s.backgroundImage,
          type: "color",
          category: "primitive",
          description: `Gradient from ${element} background /* reconstructed */`,
        });
      }
      // Blur extraction
      if (s.filter && s.filter !== "none" && s.filter.includes("blur")) {
        effects.push({
          name: `--filter-${element}`,
          value: s.filter,
          type: "effect",
          category: "primitive",
          description: `Filter from ${element} /* reconstructed */`,
        });
      }
      if (s.backdropFilter && s.backdropFilter !== "" && s.backdropFilter !== "none" && s.backdropFilter.includes("blur")) {
        effects.push({
          name: `--backdrop-filter-${element}`,
          value: `backdrop-filter: ${s.backdropFilter}`,
          type: "effect",
          category: "primitive",
          description: `Backdrop filter from ${element} /* reconstructed */`,
        });
      }
    }

    // Convert extracted animations to motion tokens
    if (animations && animations.length > 0) {
      for (const anim of animations) {
        motion.push({
          name: `--motion-${anim.name}`,
          value: anim.cssText,
          type: "motion",
          category: "primitive",
          description: `@keyframes ${anim.name}`,
        });
      }
    }

    // Augment radius tokens from the census regardless of how many named
    // radius vars were found. Previously this only ran when radius.length
    // was below 2, which meant sites exposing 1-2 named radii never got the
    // mined additions.
    if (radiusCensus) {
      const adapted: Record<string, { count: number; samples: Array<{ tag: string; cls?: string; text?: string }> }> = {};
      for (const [value, info] of Object.entries(radiusCensus)) {
        adapted[value] = {
          count: info.count,
          samples: info.elements.map((e) => ({ tag: e.tag, cls: e.class, text: e.text })),
        };
      }
      const minedRadii = buildRadiusTokensFromCensus(adapted, radius);
      radius.push(...minedRadii);
    }

    // Mine typography / spacing / shadow / motion from their censuses. These
    // fill the many role slots that are otherwise empty on sites that don't
    // expose their scale via CSS custom properties (the common case).
    const minedTypography = buildTypographyTokensFromCensus(typographyCensus);
    // Only add typography tokens whose names/values don't already exist
    const seenTypoKeys = new Set(typography.map((t) => `${t.cssVariable ?? t.name}::${t.value}`));
    for (const t of minedTypography) {
      const key = `${t.cssVariable ?? t.name}::${t.value}`;
      if (seenTypoKeys.has(key)) continue;
      typography.push(t);
      seenTypoKeys.add(key);
    }

    const minedSpacing = buildSpacingTokensFromCensus(spacingCensus);
    const seenSpacingKeys = new Set(spacing.map((t) => `${t.cssVariable ?? t.name}::${t.value}`));
    for (const t of minedSpacing) {
      const key = `${t.cssVariable ?? t.name}::${t.value}`;
      if (seenSpacingKeys.has(key)) continue;
      spacing.push(t);
      seenSpacingKeys.add(key);
    }

    const minedShadows = buildShadowTokensFromCensus(shadowCensus);
    const seenShadowKeys = new Set(effects.map((t) => `${t.cssVariable ?? t.name}::${t.value}`));
    for (const t of minedShadows) {
      const key = `${t.cssVariable ?? t.name}::${t.value}`;
      if (seenShadowKeys.has(key)) continue;
      effects.push(t);
      seenShadowKeys.add(key);
    }

    const minedMotion = buildMotionTokensFromCensus(motionCensus);
    const seenMotionKeys = new Set(motion.map((t) => `${t.cssVariable ?? t.name}::${t.value}`));
    for (const t of minedMotion) {
      const key = `${t.cssVariable ?? t.name}::${t.value}`;
      if (seenMotionKeys.has(key)) continue;
      motion.push(t);
      seenMotionKeys.add(key);
    }

    // Promote the dominant CTA colour(s) from the button census to a
    // first-class Brand token. CSS vars like --color-content-primary often
    // *describe* text hierarchy, not brand identity — on sites like wise.com
    // the actual brand colour lives only in inline button styles. Dedupe by
    // RGB value so we don't double-up if a CSS var already carries the same
    // colour.
    const minedBrandCtas = buildColourTokensFromCensus(buttonColourCensus);
    const seenColourValues = new Set(colors.map((t) => t.value.trim().toLowerCase()));
    for (const t of minedBrandCtas) {
      if (seenColourValues.has(t.value.trim().toLowerCase())) continue;
      colors.push(t);
      seenColourValues.add(t.value.trim().toLowerCase());
    }

    // Extract font info from computed styles
    const detectedFonts = new Set<string>();
    for (const style of Object.values(computedStyles)) {
      if (style.fontFamily) {
        const primary = style.fontFamily.split(",")[0].trim().replace(/['"]/g, "");
        detectedFonts.add(primary);
      }
    }

    const allFonts: FontDeclaration[] = [
      ...fonts,
      ...Array.from(detectedFonts)
        .filter((f) => !fonts.some((fd) => fd.family === f))
        .map((family) => ({
          family,
          weight: "400",
          style: "normal" as const,
          display: "swap" as const,
        })),
    ];

    const hostname = new URL(url).hostname.replace("www.", "");

    // Drop vendor / alpha-tint noise before dedupe. Stash the dropped tokens
    // on the result so users can inspect what was filtered.
    const droppedNoise: Array<{ name: string; value: string; type: TokenType; reason: "vendor" | "alpha-tint" | "other" }> = [];
    function filterNoise<T extends ExtractedToken>(arr: T[]): T[] {
      const { kept, dropped } = partitionNoise(arr);
      for (const d of dropped) {
        droppedNoise.push({
          name: d.cssVariable ?? d.name,
          value: d.value,
          type: d.type,
          reason: /rgba\(\s*var\(\s*--/.test(d.value) ? "alpha-tint" : "vendor",
        });
      }
      return kept;
    }

    const finalColors = dedupeTokensByValue(filterNoise(colors));
    const finalTypography = dedupeTokensByValue(filterNoise(typography));
    const finalSpacing = dedupeTokensByValue(filterNoise(spacing));
    const finalRadius = dedupeTokensByValue(filterNoise(radius));
    const finalEffects = dedupeTokensByValue(filterNoise(effects));
    const finalMotion = dedupeTokensByValue(filterNoise(motion));

    const tokenCount = finalColors.length + finalTypography.length + finalSpacing.length + finalRadius.length + finalEffects.length;
    onProgress?.("complete", 80, `Extraction complete — ${tokenCount} tokens, ${allFonts.length} fonts${droppedNoise.length > 0 ? `, ${droppedNoise.length} noise filtered` : ""}`);

    // Map discovered component patterns to ExtractedComponent format
    const components = componentPatterns.map((cp) => ({
      name: cp.name,
      description: `${cp.type} pattern (${cp.totalInstances} instances found)`,
      variantCount: cp.variantCount,
      variants: cp.variants.map((v) => {
        const classes = (v.classes as string) || "";
        return classes.slice(0, 80) || (v.tag as string) || cp.name;
      }),
    }));

    return {
      sourceType: "website",
      sourceName: hostname,
      sourceUrl: url,
      extractionSource: "website" as const,
      tokens: {
        colors: finalColors,
        typography: finalTypography,
        spacing: finalSpacing,
        radius: finalRadius,
        effects: finalEffects,
        motion: finalMotion,
      },
      components,
      screenshots,
      fonts: allFonts,
      animations,
      librariesDetected,
      cssVariables,
      computedStyles,
      interactiveStates,
      buttonColourCensus: Object.keys(buttonColourCensus).length > 0 ? buttonColourCensus : undefined,
      breakpoints: breakpoints.length > 0 ? breakpoints : undefined,
      droppedNoise: droppedNoise.length > 0 ? droppedNoise : undefined,
    };
  } finally {
    deregisterBrowser(browser);
    if (page) { try { await page.close(); } catch { /* already closed or crashed */ } }
    await browser.close();
  }
}
