import type { SourceType } from "@/lib/types";

/** Normalise a bare domain (e.g. "clay.com") into a full URL. */
export function normaliseUrl(raw: string): string {
  const trimmed = raw.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function detectSourceType(url: string): SourceType | null {
  const normalised = normaliseUrl(url);
  if (/figma\.com\/(file|design)\//.test(normalised)) return "figma";
  try {
    const parsed = new URL(normalised);
    if (parsed.hostname.includes(".")) return "website";
    return null;
  } catch {
    return null;
  }
}
