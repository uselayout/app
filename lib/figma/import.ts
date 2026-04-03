import { FigmaClient, type FigmaNode } from "./client";

export interface ImportedNodeData {
  nodeId: string;
  name: string;
  screenshotUrl: string | null;
  colours: ExtractedColour[];
  typography: ExtractedTypography[];
  spacing: ExtractedSpacing[];
  texts: ExtractedText[];
  layout: ExtractedLayout | null;
  dimensions: { width: number; height: number } | null;
}

export interface ExtractedText {
  layer: string;
  content: string;
  fontSize?: number;
  fontWeight?: number;
}

export interface ExtractedColour {
  property: string;
  hex: string;
  opacity: number;
}

export interface ExtractedTypography {
  property: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  lineHeight?: number;
  letterSpacing?: number;
}

export interface ExtractedSpacing {
  property: string;
  value: number;
}

export interface ExtractedLayout {
  direction: string;
  gap: number;
  padding: { top: number; right: number; bottom: number; left: number };
}

/**
 * Import a Figma node: fetches its structure, extracts styles, and gets a screenshot.
 */
export async function importFigmaNode(
  fileKey: string,
  nodeId: string,
  pat: string
): Promise<ImportedNodeData> {
  const client = new FigmaClient({ accessToken: pat });

  // Fetch node data and screenshot in parallel
  const [nodesRes, imagesRes] = await Promise.all([
    client.getNodes(fileKey, [nodeId]),
    client.getImages(fileKey, [nodeId]),
  ]);

  const nodeResponse = nodesRes.nodes[nodeId];
  if (!nodeResponse) {
    throw new Error(`Node ${nodeId} not found in file`);
  }

  const node = nodeResponse.document;
  const screenshotUrl = imagesRes.images[nodeId] ?? null;

  const colours: ExtractedColour[] = [];
  const typography: ExtractedTypography[] = [];
  const spacing: ExtractedSpacing[] = [];
  const texts: ExtractedText[] = [];

  // Recursively extract styles from the node tree
  extractFromNode(node, colours, typography, spacing, texts);

  const layout = extractLayout(node);
  const bbox = node.absoluteBoundingBox;
  const dimensions = bbox ? { width: Math.round(bbox.width), height: Math.round(bbox.height) } : null;

  return {
    nodeId,
    name: node.name,
    screenshotUrl,
    colours,
    typography,
    spacing,
    texts,
    layout,
    dimensions,
  };
}

// ─── Extraction helpers ───────────────────────────────────────────────────────

function extractFromNode(
  node: FigmaNode,
  colours: ExtractedColour[],
  typography: ExtractedTypography[],
  spacing: ExtractedSpacing[],
  texts: ExtractedText[]
): void {
  // Extract fills
  if (node.fills) {
    for (const fill of node.fills) {
      if (fill.type === "SOLID" && fill.color) {
        colours.push({
          property: `${node.name} / fill`,
          hex: rgbaToHex(fill.color),
          opacity: fill.opacity ?? fill.color.a,
        });
      }
    }
  }

  // Extract text content
  if (node.characters && node.type === "TEXT") {
    texts.push({
      layer: node.name,
      content: node.characters,
      fontSize: node.style?.fontSize,
      fontWeight: node.style?.fontWeight,
    });
  }

  // Extract typography
  if (node.style) {
    typography.push({
      property: `${node.name} / text`,
      fontFamily: node.style.fontFamily,
      fontSize: node.style.fontSize,
      fontWeight: node.style.fontWeight,
      lineHeight: node.style.lineHeightPx,
      letterSpacing: node.style.letterSpacing,
    });
  }

  // Extract spacing from auto-layout nodes
  if (node.layoutMode) {
    if (node.itemSpacing !== undefined) {
      spacing.push({ property: `${node.name} / gap`, value: node.itemSpacing });
    }
    if (node.paddingTop !== undefined) {
      spacing.push({ property: `${node.name} / padding-top`, value: node.paddingTop });
    }
    if (node.paddingRight !== undefined) {
      spacing.push({ property: `${node.name} / padding-right`, value: node.paddingRight });
    }
    if (node.paddingBottom !== undefined) {
      spacing.push({ property: `${node.name} / padding-bottom`, value: node.paddingBottom });
    }
    if (node.paddingLeft !== undefined) {
      spacing.push({ property: `${node.name} / padding-left`, value: node.paddingLeft });
    }
  }

  // Recurse into children
  if (node.children) {
    for (const child of node.children) {
      extractFromNode(child, colours, typography, spacing, texts);
    }
  }
}

function extractLayout(node: FigmaNode): ExtractedLayout | null {
  if (!node.layoutMode) return null;
  return {
    direction: node.layoutMode === "HORIZONTAL" ? "row" : "column",
    gap: node.itemSpacing ?? 0,
    padding: {
      top: node.paddingTop ?? 0,
      right: node.paddingRight ?? 0,
      bottom: node.paddingBottom ?? 0,
      left: node.paddingLeft ?? 0,
    },
  };
}

function rgbaToHex(c: { r: number; g: number; b: number; a: number }): string {
  const toHex = (v: number) =>
    Math.round(v * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(c.r)}${toHex(c.g)}${toHex(c.b)}`.toUpperCase();
}

/**
 * Format imported Figma node data as a structured context string for AI generation.
 */
export function formatAsContext(data: ImportedNodeData): string {
  const lines: string[] = [];

  const dims = data.dimensions ? ` (${data.dimensions.width}x${data.dimensions.height})` : "";
  lines.push(`Frame: "${data.name}"${dims}`);

  if (data.texts.length > 0) {
    lines.push("", "Text content:");
    for (const t of data.texts) {
      const size = t.fontSize ? `${t.fontSize}px` : "";
      const weight = t.fontWeight && t.fontWeight >= 700 ? "bold" : t.fontWeight ? `${t.fontWeight}` : "";
      const meta = [size, weight].filter(Boolean).join(", ");
      lines.push(`- "${t.content}"${meta ? ` (${meta})` : ""}`);
    }
  }

  if (data.layout) {
    const p = data.layout.padding;
    lines.push("", `Layout: ${data.layout.direction}, gap ${data.layout.gap}px, padding ${p.top}px ${p.right}px ${p.bottom}px ${p.left}px`);
  }

  if (data.colours.length > 0) {
    const unique = [...new Set(data.colours.map((c) => c.hex))];
    lines.push("", `Colours: ${unique.join(", ")}`);
  }

  if (data.typography.length > 0) {
    const unique = [...new Set(data.typography.map((t) => `${t.fontFamily} ${t.fontSize}px/${t.fontWeight}`))];
    lines.push("", `Typography: ${unique.join(", ")}`);
  }

  if (data.spacing.length > 0) {
    const entries = data.spacing.map((s) => `${s.property}: ${s.value}px`);
    lines.push("", `Spacing: ${entries.join(", ")}`);
  }

  return lines.join("\n");
}
