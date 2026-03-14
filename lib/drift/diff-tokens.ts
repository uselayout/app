import type { DesignToken } from "@/lib/types/token";
import type { ExtractedToken } from "@/lib/types";
import type { DriftChange } from "@/lib/types/drift";

/**
 * Compare current org tokens against freshly extracted tokens to detect drift.
 * Returns changes sorted: removed first, then changed, then added.
 */
export function diffTokens(
  currentTokens: DesignToken[],
  extractedTokens: ExtractedToken[]
): DriftChange[] {
  const changes: DriftChange[] = [];

  // Build maps keyed by lowercase name
  const currentMap = new Map<string, DesignToken>();
  for (const token of currentTokens) {
    currentMap.set(token.name.toLowerCase(), token);
  }

  const extractedMap = new Map<string, ExtractedToken>();
  for (const token of extractedTokens) {
    extractedMap.set(token.name.toLowerCase(), token);
  }

  // Detect additions and changes
  for (const [key, extracted] of extractedMap) {
    const current = currentMap.get(key);

    if (!current) {
      // Token exists in extraction but not in current org tokens
      changes.push({
        type: "added",
        tokenType: extracted.type,
        tokenName: extracted.name,
        newValue: extracted.value,
        cssVariable: extracted.cssVariable,
      });
    } else if (normaliseValue(current.value) !== normaliseValue(extracted.value)) {
      // Token exists in both but value differs
      changes.push({
        type: "changed",
        tokenType: extracted.type,
        tokenName: extracted.name,
        oldValue: current.value,
        newValue: extracted.value,
        cssVariable: extracted.cssVariable ?? current.cssVariable ?? undefined,
      });
    }
  }

  // Detect removals: tokens in current that are not in extracted
  for (const [key, current] of currentMap) {
    if (!extractedMap.has(key)) {
      changes.push({
        type: "removed",
        tokenType: current.type,
        tokenName: current.name,
        oldValue: current.value,
        cssVariable: current.cssVariable ?? undefined,
      });
    }
  }

  // Sort: removed first, changed, then added
  const order: Record<string, number> = { removed: 0, changed: 1, added: 2 };
  changes.sort((a, b) => order[a.type] - order[b.type]);

  return changes;
}

/** Normalise token values for comparison (trim whitespace, lowercase hex). */
function normaliseValue(value: string): string {
  let v = value.trim();
  // Lowercase hex colours for case-insensitive comparison
  if (/^#[0-9a-f]{3,8}$/i.test(v)) {
    v = v.toLowerCase();
  }
  return v;
}
