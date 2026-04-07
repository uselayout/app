import type {
  ExtractionResult,
  ExtractedToken,
  ExtractedTokens,
  TokenType,
  FontDeclaration,
  ExtractedComponent,
} from "@/lib/types";

// ─── Diff Types ─────────────────────────────────────────────────────────────

export interface TokenChange {
  name: string;
  type: TokenType;
  change: "added" | "removed" | "modified";
  previousValue?: string;
  currentValue?: string;
  cssVariable?: string;
  mode?: string;
}

export interface ComponentChange {
  name: string;
  change: "added" | "removed" | "modified";
  details?: string;
}

export interface ExtractionDiff {
  tokens: {
    added: number;
    removed: number;
    modified: number;
    changes: TokenChange[];
  };
  components: {
    added: number;
    removed: number;
    modified: number;
    changes: ComponentChange[];
  };
  fonts: {
    added: string[];
    removed: string[];
  };
  summary: string;
}

// ─── Token Diffing ──────────────────────────────────────────────────────────

function tokenKey(token: ExtractedToken): string {
  const base = token.cssVariable ?? token.name;
  return token.mode ? `${base}::${token.mode}` : base;
}

function diffTokenList(
  previous: ExtractedToken[],
  current: ExtractedToken[]
): TokenChange[] {
  const changes: TokenChange[] = [];

  const prevMap = new Map<string, ExtractedToken>();
  for (const token of previous) {
    prevMap.set(tokenKey(token), token);
  }

  const currentMap = new Map<string, ExtractedToken>();
  for (const token of current) {
    currentMap.set(tokenKey(token), token);
  }

  // Added and modified
  for (const [key, token] of currentMap) {
    const prev = prevMap.get(key);
    if (!prev) {
      changes.push({
        name: token.name,
        type: token.type,
        change: "added",
        currentValue: token.value,
        cssVariable: token.cssVariable,
        mode: token.mode,
      });
    } else if (prev.value !== token.value) {
      changes.push({
        name: token.name,
        type: token.type,
        change: "modified",
        previousValue: prev.value,
        currentValue: token.value,
        cssVariable: token.cssVariable,
        mode: token.mode,
      });
    }
  }

  // Removed
  for (const [key, token] of prevMap) {
    if (!currentMap.has(key)) {
      changes.push({
        name: token.name,
        type: token.type,
        change: "removed",
        previousValue: token.value,
        cssVariable: token.cssVariable,
        mode: token.mode,
      });
    }
  }

  return changes;
}

function diffTokens(
  previous: ExtractedTokens,
  current: ExtractedTokens
): TokenChange[] {
  const categories: (keyof ExtractedTokens)[] = [
    "colors",
    "typography",
    "spacing",
    "radius",
    "effects",
  ];

  const allChanges: TokenChange[] = [];
  for (const category of categories) {
    allChanges.push(...diffTokenList(previous[category], current[category]));
  }

  return allChanges;
}

// ─── Component Diffing ──────────────────────────────────────────────────────

function diffComponents(
  previous: ExtractedComponent[],
  current: ExtractedComponent[]
): ComponentChange[] {
  const changes: ComponentChange[] = [];

  const prevMap = new Map<string, ExtractedComponent>();
  for (const comp of previous) {
    prevMap.set(comp.name.toLowerCase(), comp);
  }

  const currentMap = new Map<string, ExtractedComponent>();
  for (const comp of current) {
    currentMap.set(comp.name.toLowerCase(), comp);
  }

  // Added and modified
  for (const [key, comp] of currentMap) {
    const prev = prevMap.get(key);
    if (!prev) {
      changes.push({ name: comp.name, change: "added" });
    } else {
      const modifications: string[] = [];

      if (prev.variantCount !== comp.variantCount) {
        modifications.push(
          `variants: ${prev.variantCount} -> ${comp.variantCount}`
        );
      }

      if ((prev.description ?? "") !== (comp.description ?? "")) {
        modifications.push("description changed");
      }

      if (modifications.length > 0) {
        changes.push({
          name: comp.name,
          change: "modified",
          details: modifications.join(", "),
        });
      }
    }
  }

  // Removed
  for (const [key, comp] of prevMap) {
    if (!currentMap.has(key)) {
      changes.push({ name: comp.name, change: "removed" });
    }
  }

  return changes;
}

// ─── Font Diffing ───────────────────────────────────────────────────────────

function diffFonts(
  previous: FontDeclaration[],
  current: FontDeclaration[]
): { added: string[]; removed: string[] } {
  const prevFamilies = new Set(previous.map((f) => f.family));
  const currentFamilies = new Set(current.map((f) => f.family));

  const added = [...currentFamilies].filter((f) => !prevFamilies.has(f));
  const removed = [...prevFamilies].filter((f) => !currentFamilies.has(f));

  return { added, removed };
}

// ─── Summary ────────────────────────────────────────────────────────────────

function countByChange<T extends { change: string }>(
  items: T[],
  change: string
): number {
  return items.filter((item) => item.change === change).length;
}

function buildSummary(
  tokenChanges: TokenChange[],
  componentChanges: ComponentChange[],
  fontDiff: { added: string[]; removed: string[] }
): string {
  const parts: string[] = [];

  const totalTokenChanges = tokenChanges.length;
  if (totalTokenChanges > 0) {
    parts.push(`${totalTokenChanges} token${totalTokenChanges === 1 ? "" : "s"} changed`);
  }

  const addedComponents = countByChange(componentChanges, "added");
  if (addedComponents > 0) {
    parts.push(`${addedComponents} component${addedComponents === 1 ? "" : "s"} added`);
  }

  const removedComponents = countByChange(componentChanges, "removed");
  if (removedComponents > 0) {
    parts.push(`${removedComponents} component${removedComponents === 1 ? "" : "s"} removed`);
  }

  const modifiedComponents = countByChange(componentChanges, "modified");
  if (modifiedComponents > 0) {
    parts.push(`${modifiedComponents} component${modifiedComponents === 1 ? "" : "s"} modified`);
  }

  if (fontDiff.added.length > 0) {
    parts.push(`${fontDiff.added.length} font${fontDiff.added.length === 1 ? "" : "s"} added`);
  }

  if (fontDiff.removed.length > 0) {
    parts.push(`${fontDiff.removed.length} font${fontDiff.removed.length === 1 ? "" : "s"} removed`);
  }

  return parts.length > 0 ? parts.join(", ") : "No changes detected";
}

// ─── Main ───────────────────────────────────────────────────────────────────

export function diffExtractions(
  previous: ExtractionResult,
  current: ExtractionResult
): ExtractionDiff {
  const tokenChanges = diffTokens(previous.tokens, current.tokens);
  const componentChanges = diffComponents(previous.components, current.components);
  const fontDiff = diffFonts(previous.fonts, current.fonts);

  return {
    tokens: {
      added: countByChange(tokenChanges, "added"),
      removed: countByChange(tokenChanges, "removed"),
      modified: countByChange(tokenChanges, "modified"),
      changes: tokenChanges,
    },
    components: {
      added: countByChange(componentChanges, "added"),
      removed: countByChange(componentChanges, "removed"),
      modified: countByChange(componentChanges, "modified"),
      changes: componentChanges,
    },
    fonts: fontDiff,
    summary: buildSummary(tokenChanges, componentChanges, fontDiff),
  };
}
