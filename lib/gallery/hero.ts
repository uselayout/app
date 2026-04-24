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
 * Two-pronged fidelity strategy:
 *   1. Tight prompt derived from the full palette, real font names, tag-driven
 *      composition cues, and an explicit no-text directive (text is where the
 *      model fails hardest).
 *   2. Reference-image mode via /v1/images/edits when the kit ships a logo on
 *      rich_bundle.brandingAssets — the model composes around the actual mark
 *      instead of inventing one.
 */

interface GenerateHeroOptions {
  openaiApiKey?: string;
}

interface ReferenceImage {
  buffer: Buffer;
  filename: string;
  mimeType: string;
}

// --- Token extraction --------------------------------------------------------

interface ExtractedToken {
  role: string;
  value: string;
}

function extractPalette(tokensCss: string, limit = 6): ExtractedToken[] {
  const re = /--([a-zA-Z0-9-]+)\s*:\s*(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|oklch\([^)]+\)|hsla?\([^)]+\))/g;
  const out: ExtractedToken[] = [];
  const seen = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = re.exec(tokensCss)) && out.length < limit) {
    const role = m[1];
    const value = m[2].trim();
    if (seen.has(role)) continue;
    seen.add(role);
    out.push({ role, value });
  }
  return out;
}

function firstFontFamily(tokensCss: string, selector: RegExp): string | null {
  const m = tokensCss.match(selector);
  if (!m || !m[1]) return null;
  const first = m[1].split(",")[0].trim().replace(/^['"]|['"]$/g, "");
  if (!first || /^(system-ui|sans-serif|serif|monospace|mono|ui-sans|ui-serif|ui-monospace|-apple-system)$/i.test(first)) {
    return null;
  }
  return first;
}

function fontFamilies(tokensCss: string): string[] {
  const names: string[] = [];
  for (const pattern of [
    /--[a-zA-Z0-9-]*font-(?:display|heading)[^:]*:\s*([^;]+);/i,
    /--[a-zA-Z0-9-]*font-sans[^:]*:\s*([^;]+);/i,
    /--[a-zA-Z0-9-]*font-serif[^:]*:\s*([^;]+);/i,
    /--[a-zA-Z0-9-]*font-mono[^:]*:\s*([^;]+);/i,
  ]) {
    const family = firstFontFamily(tokensCss, pattern);
    if (family && !names.includes(family)) names.push(family);
  }
  return names.slice(0, 2);
}

const TAG_CUES: Record<string, string> = {
  dark: "moody, low-key composition with deep shadows and subtle glows",
  light: "generous white space, airy layout, high-key lighting",
  minimal: "restrained composition, few elements, strong negative space",
  fintech: "trust signals, geometric precision, soft gradients, a sense of quiet confidence",
  "dev-tool": "editor or terminal motif, monospaced patterns, code-like composition",
  "developer-tool": "editor or terminal motif, monospaced patterns, code-like composition",
  saas: "clean product-marketing aesthetic, card-based composition",
  ecomm: "product-card motif, retail-grade gloss, gentle product shadows",
  ecommerce: "product-card motif, retail-grade gloss, gentle product shadows",
  mobile: "device-frame framing, portrait orientation references",
  ios: "Apple-flavoured minimalism, SF Pro sensibility, rounded corners",
  editorial: "magazine-style layout, typographic emphasis",
  "content-first": "typography-led composition, text as hero, imagery as accent",
};

function tagCues(tags: string[]): string[] {
  const cues: string[] = [];
  for (const tag of tags) {
    const cue = TAG_CUES[tag.toLowerCase()];
    if (cue && !cues.includes(cue)) cues.push(cue);
    if (cues.length >= 2) break;
  }
  return cues;
}

function buildHeroPrompt(kit: PublicKit, hasReferenceLogo: boolean): { prompt: string; brandColours: string[] } {
  const palette = extractPalette(kit.tokensCss, 6);
  const fonts = fontFamilies(kit.tokensCss);
  const cues = tagCues(kit.tags);

  const paletteLine = palette.length > 0
    ? `Palette (use these exact hex values, not approximations): ${palette.map((t) => `${t.role} ${t.value}`).join(", ")}.`
    : "";
  const fontsLine = fonts.length > 0 ? `Typography reference: ${fonts.join(", ")}.` : "";
  const cuesLine = cues.length > 0 ? `Composition cues: ${cues.join("; ")}.` : "";
  const descLine = kit.description ? `Style brief: ${kit.description}` : "";

  const logoDirective = hasReferenceLogo
    ? "Compose the cover around the provided brand mark. The mark is the focal point, placed at large scale and bleeding partly off one edge for drama. Do not alter, recolour, or re-render the mark; the rest of the composition flows from its shape and colour."
    : "Compose a minimal poster-style hero of three floating UI primitives arranged in a loose diagonal composition: a button, a small card with a headline stripe and paragraph bar, and a pill-shaped badge. The palette itself is the hero.";

  const prompt = [
    `Editorial cover image for a design system.`,
    descLine,
    cuesLine,
    paletteLine,
    fontsLine,
    logoDirective,
    "Generous negative space. Soft shadows. Crisp edges. Figma-community cover-image style.",
    "ABSOLUTE CONSTRAINT: do not render any text, letters, numbers, wordmarks, captions, or labels anywhere in the image. Text rendering is forbidden. The composition is purely visual.",
    "No stock photography. No human figures. No literal product mockups. Marketing-grade, poster-like, professional.",
  ].filter(Boolean).join(" ");

  const brandColours = palette.map((t) => t.value);
  return { prompt, brandColours };
}

// --- Reference logos ---------------------------------------------------------

const MAX_REFERENCE_BYTES = 4 * 1024 * 1024;
const MAX_REFERENCE_COUNT = 2;
// GPT Image 2 /v1/images/edits accepts only these formats.
const ALLOWED_REFERENCE_MIME = new Set(["image/png", "image/jpeg", "image/webp"]);

function sniffMimeType(buffer: Buffer, declared?: string): string | null {
  // PNG: 89 50 4E 47
  if (buffer.length >= 4 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return "image/png";
  // JPEG: FF D8 FF
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  // WEBP: RIFF....WEBP
  if (buffer.length >= 12 && buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  // SVG: <?xml or <svg
  const head = buffer.subarray(0, 256).toString("utf8").trimStart();
  if (head.startsWith("<?xml") || head.startsWith("<svg")) return "image/svg+xml";
  return declared ?? null;
}

function baseUrl(): string {
  return (
    process.env.INTERNAL_APP_URL ??
    (process.env.NODE_ENV === "production" ? "http://localhost:3000" : process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000")
  ).replace(/\/$/, "");
}

async function loadReferenceLogos(kit: PublicKit): Promise<ReferenceImage[]> {
  const assets = kit.richBundle?.brandingAssets ?? [];
  const logos = assets
    .filter((a) => /^(logo|mark|wordmark)$/i.test(a.slot ?? ""))
    .slice(0, MAX_REFERENCE_COUNT);

  if (logos.length === 0) return [];

  const origin = baseUrl();
  const out: ReferenceImage[] = [];

  for (const asset of logos) {
    try {
      const url = asset.url.startsWith("http") ? asset.url : `${origin}${asset.url.startsWith("/") ? "" : "/"}${asset.url}`;
      const res = await fetch(url);
      if (!res.ok) {
        console.warn(`[kit-hero] logo fetch ${res.status} for ${kit.slug} at ${asset.url}`);
        continue;
      }
      const arr = await res.arrayBuffer();
      if (arr.byteLength > MAX_REFERENCE_BYTES) {
        console.warn(`[kit-hero] logo too large for ${kit.slug}: ${arr.byteLength} bytes`);
        continue;
      }
      const buffer = Buffer.from(arr);
      // Prefer magic-byte sniffing over the declared mimetype (Supabase sometimes
      // returns application/octet-stream). SVG and other unsupported formats
      // are skipped here so /v1/images/edits doesn't 400.
      const sniffed = sniffMimeType(buffer, asset.mimeType);
      if (!sniffed || !ALLOWED_REFERENCE_MIME.has(sniffed)) {
        console.warn(
          `[kit-hero] skipping reference for ${kit.slug}: unsupported mimetype ${sniffed ?? "unknown"} (OpenAI accepts PNG/JPEG/WEBP only)`,
        );
        continue;
      }
      const extByType: Record<string, string> = {
        "image/png": "png",
        "image/jpeg": "jpg",
        "image/webp": "webp",
      };
      const ext = extByType[sniffed];
      const defaultName = `${kit.slug}-logo.${ext}`;
      out.push({
        buffer,
        filename: (asset.name && /\.(png|jpe?g|webp)$/i.test(asset.name)) ? asset.name : defaultName,
        mimeType: sniffed,
      });
    } catch (err) {
      console.warn(`[kit-hero] logo fetch threw for ${kit.slug}:`, err);
    }
  }

  return out;
}

/**
 * Generate a hero cover PNG for a kit and upload it to Supabase Storage.
 * Throws with the upstream error message on failure so the route can surface
 * it to the user (billing caps, bad key, rate limits, etc.). Returns the
 * proxied /api/storage URL on success.
 */
export async function captureAndUploadKitHero(
  kit: PublicKit,
  options: GenerateHeroOptions = {},
): Promise<string> {
  const references = await loadReferenceLogos(kit);
  const { prompt, brandColours } = buildHeroPrompt(kit, references.length > 0);

  console.log(
    `[kit-hero] ${kit.slug}: ${references.length > 0 ? `${references.length} reference image(s)` : "text-only"}, palette ${brandColours.length}`,
  );

  const result = await generateImageRaw({
    prompt,
    brandColours: brandColours.length > 0 ? brandColours : undefined,
    // "4:3" maps to 1536x1024 in the GPT Image 2 provider (mapSize in openai.ts)
    aspectRatio: "4:3",
    resolution: "2K",
    forcedProvider: "openai",
    openaiApiKey: options.openaiApiKey,
    referenceImages: references.length > 0 ? references : undefined,
  });

  const buffer = Buffer.from(result.data, "base64");
  const ext = result.mimeType.includes("png") ? "png" : result.mimeType.includes("jpeg") ? "jpg" : "png";
  const path = `kit-heroes/${kit.id}.${ext}`;
  const url = await uploadToBucket("layout-images", path, buffer, result.mimeType, { upsert: true });
  if (!url) throw new Error("Generated hero image but upload to storage failed");
  return url;
}
