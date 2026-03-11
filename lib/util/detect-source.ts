import type { SourceType } from "@/lib/types";

export function detectSourceType(url: string): SourceType | null {
  if (/figma\.com\/(file|design)\//.test(url)) return "figma";
  try {
    new URL(url);
    return "website";
  } catch {
    return null;
  }
}
