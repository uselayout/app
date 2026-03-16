import { chromium } from "playwright";
import {
  extractCSSVariablesScript,
  extractFontsScript,
  extractComputedStylesScript,
  extractAnimationsScript,
  detectLibrariesScript,
} from "./css-extract";
import type {
  ExtractionResult,
  FontDeclaration,
  AnimationDefinition,
  ComputedStyleMap,
  ExtractedToken,
} from "@/lib/types";

interface WebsiteExtractionOptions {
  url: string;
  onProgress?: (step: string, percent: number, detail?: string) => void;
}

function cssVarToToken(name: string, value: string): ExtractedToken | null {
  const lower = name.toLowerCase();
  if (lower.includes("color") || lower.includes("bg") || lower.includes("text") || lower.includes("border")) {
    return { name, value, type: "color", category: "semantic", cssVariable: name };
  }
  if (lower.includes("spacing") || lower.includes("space") || lower.includes("gap")) {
    return { name, value, type: "spacing", category: "semantic", cssVariable: name };
  }
  if (lower.includes("radius") || lower.includes("rounded")) {
    return { name, value, type: "radius", category: "semantic", cssVariable: name };
  }
  if (lower.includes("font") || lower.includes("text") || lower.includes("size")) {
    return { name, value, type: "typography", category: "semantic", cssVariable: name };
  }
  return null;
}

export async function extractFromWebsite({
  url,
  onProgress,
}: WebsiteExtractionOptions): Promise<ExtractionResult> {
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage();

    onProgress?.("navigate", 10, `Navigating to ${url}...`);
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
    // Allow JS-rendered content to settle before extracting styles
    await page.waitForLoadState("load", { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);

    // Extract CSS variables
    onProgress?.("css", 25, "Extracting CSS custom properties...");
    const cssVariables: Record<string, string> = await page.evaluate(`(${extractCSSVariablesScript})()`);
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

    // Detect libraries
    onProgress?.("libraries", 60, "Detecting libraries...");
    const librariesDetected: Record<string, boolean> = await page.evaluate(`(${detectLibrariesScript})()`);
    const libCount = Object.values(librariesDetected).filter(Boolean).length;
    if (libCount > 0) {
      onProgress?.("libraries", 65, `Detected ${libCount} ${libCount === 1 ? "library" : "libraries"}`);
    }

    // Take screenshots
    onProgress?.("screenshots", 70, "Capturing screenshots...");
    const fullPageBuffer = await page.screenshot({ fullPage: true, type: "png" });
    const viewportBuffer = await page.screenshot({ fullPage: false, type: "png" });

    const screenshots = [
      `data:image/png;base64,${fullPageBuffer.toString("base64")}`,
      `data:image/png;base64,${viewportBuffer.toString("base64")}`,
    ];

    // Classify CSS variables into tokens
    const colors: ExtractedToken[] = [];
    const typography: ExtractedToken[] = [];
    const spacing: ExtractedToken[] = [];
    const radius: ExtractedToken[] = [];

    for (const [name, value] of Object.entries(cssVariables)) {
      const token = cssVarToToken(name, value);
      if (token) {
        switch (token.type) {
          case "color": colors.push(token); break;
          case "typography": typography.push(token); break;
          case "spacing": spacing.push(token); break;
          case "radius": radius.push(token); break;
        }
      }
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

    const tokenCount = colors.length + typography.length + spacing.length + radius.length;
    onProgress?.("complete", 80, `Extraction complete — ${tokenCount} tokens, ${allFonts.length} fonts`);

    return {
      sourceType: "website",
      sourceName: hostname,
      sourceUrl: url,
      tokens: { colors, typography, spacing, radius, effects: [] },
      components: [],
      screenshots,
      fonts: allFonts,
      animations,
      librariesDetected,
      cssVariables,
      computedStyles,
    };
  } finally {
    await browser.close();
  }
}
