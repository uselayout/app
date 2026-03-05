import { FigmaClient, FigmaApiError } from "./client";
import { parseStyles } from "./parsers/styles";
import { parseComponents } from "./parsers/components";
import type { ExtractionResult } from "@/lib/types";

interface FigmaExtractionOptions {
  fileKey: string;
  accessToken: string;
  onProgress?: (step: string, percent: number, detail?: string) => void;
}

export async function extractFromFigma({
  fileKey,
  accessToken,
  onProgress,
}: FigmaExtractionOptions): Promise<ExtractionResult> {
  const client = new FigmaClient({
    accessToken,
    onProgress: (msg) => onProgress?.("progress", 0, msg),
  });

  // Step 1: File metadata
  onProgress?.("metadata", 5, "Fetching file metadata...");
  const file = await client.getFile(fileKey, 1);

  // Step 2: Styles extraction
  onProgress?.("styles", 15, "Extracting styles...");
  const { colors, typography, effects } = await parseStyles(
    fileKey,
    client,
    (msg) => onProgress?.("styles", 30, msg)
  );

  // Step 3: Components extraction
  onProgress?.("components", 45, "Extracting components...");
  const components = await parseComponents(
    fileKey,
    client,
    (msg) => onProgress?.("components", 55, msg)
  );

  // Step 4: Variables (Enterprise only - non-fatal)
  let cssVariables: Record<string, string> = {};
  try {
    onProgress?.("variables", 65, "Fetching variables (Enterprise plan)...");
    const varsResponse = await client.getVariables(fileKey);
    const vars = varsResponse.meta.variables;
    for (const v of Object.values(vars)) {
      const modes = Object.values(v.valuesByMode);
      if (modes.length > 0 && typeof modes[0] === "object" && modes[0] !== null) {
        const val = modes[0] as { r?: number; g?: number; b?: number; a?: number };
        if (val.r !== undefined && val.g !== undefined && val.b !== undefined) {
          const hex = `#${Math.round(val.r * 255).toString(16).padStart(2, "0")}${Math.round(val.g * 255).toString(16).padStart(2, "0")}${Math.round(val.b * 255).toString(16).padStart(2, "0")}`;
          cssVariables[`--${v.name.toLowerCase().replace(/[/\s]+/g, "-")}`] = hex;
        }
      }
    }
  } catch (err) {
    if (err instanceof FigmaApiError && err.statusCode === 403) {
      onProgress?.(
        "variables",
        70,
        "Variables API requires Enterprise plan - continuing with styles"
      );
    } else {
      throw err;
    }
  }

  // Add extracted colour tokens as CSS variables
  for (const token of colors) {
    if (token.cssVariable) {
      cssVariables[token.cssVariable] = token.value;
    }
  }

  onProgress?.("complete", 80, "Figma extraction complete");

  return {
    sourceType: "figma",
    sourceName: file.name,
    sourceUrl: `https://www.figma.com/file/${fileKey}`,
    tokens: {
      colors,
      typography,
      spacing: [],
      radius: [],
      effects,
    },
    components,
    screenshots: [],
    fonts: typography.length > 0
      ? [
          {
            family: typography[0].value.split("font-family: ")[1]?.split(";")[0] || "Unknown",
            weight: "400",
            style: "normal",
            display: "swap",
          },
        ]
      : [],
    animations: [],
    librariesDetected: {},
    cssVariables,
    computedStyles: {},
  };
}
