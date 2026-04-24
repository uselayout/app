import "server-only";
import { generateImageRaw } from "@/lib/image/generate";
import { uploadToBucket } from "@/lib/supabase/storage";
import type { PublicKit } from "@/lib/types/kit";

/**
 * GPT Image 2-backed "hero cover" generator for Kit Gallery cards.
 * Sits alongside the Playwright snapshot path (lib/gallery/snapshot.ts); they
 * populate independent columns and the card fallback chain prefers the hero
 * when both exist.
 *
 * v1 does not pass the kit's logo as a reference image. GPT Image 2 goes via
 * /v1/images/generations which is text-only in our current integration. We
 * describe the logo in the prompt and let the model render a stylised mark.
 */

interface GenerateHeroOptions {
  openaiApiKey?: string;
}

function extractColour(tokensCss: string, names: RegExp[]): string | null {
  for (const pattern of names) {
    const match = tokensCss.match(pattern);
    if (match && match[1]) return match[1].trim();
  }
  return null;
}

function extractFontFamily(tokensCss: string): string {
  const match = tokensCss.match(/--[a-zA-Z0-9-]*font-(?:sans|serif|display|primary)[^:]*:\s*([^;]+);/i);
  if (!match || !match[1]) return "sans-serif";
  const value = match[1].toLowerCase();
  if (/serif/.test(value)) return "serif";
  if (/mono|code/.test(value)) return "mono";
  return "sans-serif";
}

function buildHeroPrompt(kit: PublicKit): { prompt: string; brandColours: string[] } {
  const primary = extractColour(kit.tokensCss, [
    /--[a-zA-Z0-9-]*(?:accent|primary|brand)\s*:\s*(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|oklch\([^)]+\))/,
  ]);
  const bg = extractColour(kit.tokensCss, [
    /--[a-zA-Z0-9-]*bg(?:-app)?\s*:\s*(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|oklch\([^)]+\))/,
    /--[a-zA-Z0-9-]*background\s*:\s*(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|oklch\([^)]+\))/,
  ]);
  const text = extractColour(kit.tokensCss, [
    /--[a-zA-Z0-9-]*text(?:-primary)?\s*:\s*(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|oklch\([^)]+\))/,
    /--[a-zA-Z0-9-]*foreground\s*:\s*(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|oklch\([^)]+\))/,
  ]);

  const brandColours = [primary, bg, text].filter((c): c is string => !!c);
  const typeVibe = extractFontFamily(kit.tokensCss);
  const tagDesc = kit.tags.length > 0 ? kit.tags.join(", ") : "modern design system";
  const shortName = kit.name.length > 20 ? kit.name.slice(0, 18) + "..." : kit.name;

  const prompt = [
    `Editorial cover image for a design system called "${kit.name}".`,
    kit.description ? `Description: ${kit.description}.` : "",
    `Aesthetic hints: ${tagDesc}.`,
    primary ? `Use ${primary} as the accent colour.` : "",
    bg ? `Background colour: ${bg}.` : "",
    text ? `Text colour: ${text}.` : "",
    "Compose a minimal, modern poster-style hero featuring:",
    `a small logo-style mark in the top-left spelling "${shortName}" in a ${typeVibe} wordmark style,`,
    "three floating UI components arranged in a loose diagonal composition: a primary-coloured button with subtle text, a small card showing a single headline and paragraph, and a pill-shaped badge,",
    "generous negative space, soft shadows, crisp edges.",
    "Figma-community cover-image style. Not a literal mockup. Do not render any text other than the kit name. Professional, poster-like, marketing-grade.",
  ]
    .filter(Boolean)
    .join(" ");

  return { prompt, brandColours };
}

/**
 * Generate a hero cover PNG for a kit and upload it to Supabase Storage.
 * Returns the proxied /api/storage URL on success, null on failure.
 */
export async function captureAndUploadKitHero(
  kit: PublicKit,
  options: GenerateHeroOptions = {},
): Promise<string | null> {
  const { prompt, brandColours } = buildHeroPrompt(kit);

  let data: string;
  let mimeType: string;
  try {
    const result = await generateImageRaw({
      prompt,
      brandColours: brandColours.length > 0 ? brandColours : undefined,
      // "4:3" maps to 1536x1024 in the GPT Image 2 provider (mapSize in openai.ts)
      aspectRatio: "4:3",
      resolution: "2K",
      forcedProvider: "openai",
      openaiApiKey: options.openaiApiKey,
    });
    data = result.data;
    mimeType = result.mimeType;
  } catch (err) {
    console.error(`[kit-hero] GPT Image 2 call failed for ${kit.slug}:`, err);
    return null;
  }

  const buffer = Buffer.from(data, "base64");
  const ext = mimeType.includes("png") ? "png" : mimeType.includes("jpeg") ? "jpg" : "png";
  const path = `kit-heroes/${kit.id}.${ext}`;
  return uploadToBucket("layout-images", path, buffer, mimeType, { upsert: true });
}
