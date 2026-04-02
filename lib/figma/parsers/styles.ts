import type { FigmaClient, FigmaStyleMeta, FigmaFill, FigmaTypeStyle, FigmaEffect } from "../client";
import type { ExtractedToken } from "@/lib/types";

function rgbaToHex(r: number, g: number, b: number, a?: number): string {
  const toHex = (v: number) =>
    Math.round(v * 255)
      .toString(16)
      .padStart(2, "0");
  const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  if (a !== undefined && a < 1) {
    return `${hex}${toHex(a)}`;
  }
  return hex;
}

function parseFillColor(fills?: FigmaFill[]): string | null {
  if (!fills || fills.length === 0) return null;
  const fill = fills[0];
  if (fill.type !== "SOLID" || !fill.color) return null;
  return rgbaToHex(fill.color.r, fill.color.g, fill.color.b, fill.color.a);
}

function nameToVariable(name: string): string {
  return `--${name.toLowerCase().replace(/[/\s]+/g, "-").replace(/[^a-z0-9-]/g, "")}`;
}

/** Common colour names used as Figma group prefixes for primitives. */
const COLOUR_NAME_PREFIXES = new Set([
  "red", "orange", "yellow", "green", "blue", "purple", "pink", "violet",
  "indigo", "teal", "cyan", "lime", "amber", "emerald", "sky", "rose",
  "slate", "gray", "grey", "zinc", "stone", "neutral", "white", "black",
]);

/** Semantic role keywords that indicate a token is semantic, not primitive. */
const SEMANTIC_KEYWORDS = [
  "bg", "text", "border", "accent", "status", "surface", "action",
  "primary", "secondary", "tertiary", "error", "warning", "success",
  "info", "danger", "link", "focus", "hover", "disabled", "muted",
  "foreground", "background", "brand", "cta", "overlay", "divider",
];

function categoriseColorToken(name: string): "primitive" | "semantic" {
  const lower = name.toLowerCase();

  // Figma group naming: "Blue/500", "Gray/100" -> primitive
  if (lower.includes("/")) {
    const firstSegment = lower.split("/")[0].trim();
    if (COLOUR_NAME_PREFIXES.has(firstSegment)) return "primitive";
  }

  // Check for semantic keywords
  if (SEMANTIC_KEYWORDS.some((kw) => lower.includes(kw))) {
    return "semantic";
  }

  // Names with numeric suffixes (e.g. "blue-500", "gray-100") -> primitive
  if (/[-/]\d{2,3}$/.test(lower)) return "primitive";

  return "primitive";
}

/**
 * After extracting all colour tokens, find tokens that share the same hex value
 * and annotate semantic tokens with which primitive they alias.
 */
function linkPrimitivesToSemantics(colors: ExtractedToken[]): void {
  // Group tokens by normalised hex value
  const byValue = new Map<string, ExtractedToken[]>();
  for (const token of colors) {
    const hex = token.value.toUpperCase().slice(0, 7); // normalise to 6-char hex
    const group = byValue.get(hex) ?? [];
    group.push(token);
    byValue.set(hex, group);
  }

  for (const [, group] of byValue) {
    if (group.length < 2) continue;

    const primitives = group.filter((t) => t.category === "primitive");
    const semantics = group.filter((t) => t.category === "semantic");

    if (primitives.length === 0 || semantics.length === 0) continue;

    // Annotate each semantic token with its primitive alias
    const primitiveName = primitives[0].cssVariable ?? primitives[0].name;
    for (const semantic of semantics) {
      const existing = semantic.description ?? "";
      semantic.description = existing
        ? `${existing}. Aliases ${primitiveName}`
        : `Aliases ${primitiveName}`;
    }
  }
}

export async function parseStyles(
  fileKey: string,
  client: FigmaClient,
  onProgress?: (msg: string) => void
): Promise<{
  colors: ExtractedToken[];
  typography: ExtractedToken[];
  effects: ExtractedToken[];
}> {
  onProgress?.("Fetching style metadata...");
  const stylesResponse = await client.getStyles(fileKey);
  const styles = stylesResponse.meta.styles;

  const MAX_STYLES = 300;
  const allNodeIds = styles.map((s) => s.node_id);
  const nodeIds = allNodeIds.slice(0, MAX_STYLES);
  if (allNodeIds.length > MAX_STYLES) {
    onProgress?.(`File has ${allNodeIds.length} styles. Extracting first ${MAX_STYLES} for performance.`);
  }
  onProgress?.(`Resolving ${nodeIds.length} style values...`);
  const nodesResponse = await client.getNodesBatched(fileKey, nodeIds);

  const colors: ExtractedToken[] = [];
  const typography: ExtractedToken[] = [];
  const effects: ExtractedToken[] = [];

  for (const style of styles) {
    const nodeData = nodesResponse.nodes[style.node_id];
    if (!nodeData) continue;

    const doc = nodeData.document;

    switch (style.style_type) {
      case "FILL": {
        const hex = parseFillColor(doc.fills);
        if (hex) {
          colors.push({
            name: style.name,
            value: hex,
            type: "color",
            category: categoriseColorToken(style.name),
            cssVariable: nameToVariable(style.name),
            description: style.description || undefined,
          });
        }
        break;
      }
      case "TEXT": {
        const ts = doc.style as FigmaTypeStyle | undefined;
        if (ts) {
          typography.push({
            name: style.name,
            value: formatTypographyValue(ts),
            type: "typography",
            category: "semantic",
            cssVariable: nameToVariable(style.name),
            description: style.description || undefined,
          });
        }
        break;
      }
      case "EFFECT": {
        const effs = doc.effects;
        if (effs && effs.length > 0) {
          effects.push({
            name: style.name,
            value: formatEffectValue(effs),
            type: "effect",
            category: "semantic",
            cssVariable: nameToVariable(style.name),
            description: style.description || undefined,
          });
        }
        break;
      }
    }
  }

  // Link primitives to semantics by matching hex values
  linkPrimitivesToSemantics(colors);

  onProgress?.(
    `Extracted: ${colors.length} colours, ${typography.length} typography, ${effects.length} effects`
  );

  return { colors, typography, effects };
}

function formatTypographyValue(ts: FigmaTypeStyle): string {
  const parts: string[] = [
    `font-family: ${ts.fontFamily}`,
    `font-size: ${ts.fontSize}px`,
    `font-weight: ${ts.fontWeight}`,
  ];
  if (ts.lineHeightPx) parts.push(`line-height: ${Math.round(ts.lineHeightPx)}px`);
  if (ts.letterSpacing) parts.push(`letter-spacing: ${ts.letterSpacing}px`);
  return parts.join("; ");
}

function formatEffectValue(effects: FigmaEffect[]): string {
  return effects
    .filter((e) => e.visible !== false)
    .map((e) => {
      if (e.type === "DROP_SHADOW" || e.type === "INNER_SHADOW") {
        const x = e.offset?.x ?? 0;
        const y = e.offset?.y ?? 0;
        const r = e.radius ?? 0;
        const s = e.spread ?? 0;
        const c = e.color
          ? rgbaToHex(e.color.r, e.color.g, e.color.b, e.color.a)
          : "rgba(0,0,0,0.25)";
        const inset = e.type === "INNER_SHADOW" ? "inset " : "";
        return `${inset}${x}px ${y}px ${r}px ${s}px ${c}`;
      }
      return e.type;
    })
    .join(", ");
}

export type { FigmaStyleMeta };
