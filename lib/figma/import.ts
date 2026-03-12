import { FigmaClient, type FigmaNode } from "./client";

export interface ImportedNodeData {
  nodeId: string;
  name: string;
  screenshotUrl: string | null;
  colours: ExtractedColour[];
  typography: ExtractedTypography[];
  spacing: ExtractedSpacing[];
  layout: ExtractedLayout | null;
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

  // Recursively extract styles from the node tree
  extractFromNode(node, colours, typography, spacing);

  const layout = extractLayout(node);

  return {
    nodeId,
    name: node.name,
    screenshotUrl,
    colours,
    typography,
    spacing,
    layout,
  };
}

// ─── Extraction helpers ───────────────────────────────────────────────────────

function extractFromNode(
  node: FigmaNode,
  colours: ExtractedColour[],
  typography: ExtractedTypography[],
  spacing: ExtractedSpacing[]
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
      extractFromNode(child, colours, typography, spacing);
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
