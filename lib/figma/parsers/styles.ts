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

function categoriseColorToken(name: string): "primitive" | "semantic" {
  const lower = name.toLowerCase();
  if (
    lower.includes("bg") ||
    lower.includes("text") ||
    lower.includes("border") ||
    lower.includes("accent") ||
    lower.includes("status") ||
    lower.includes("surface")
  ) {
    return "semantic";
  }
  return "primitive";
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
