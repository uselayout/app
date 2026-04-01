import { FigmaClient, FigmaApiError } from "./client";
import { parseStyles } from "./parsers/styles";
import { parseComponents } from "./parsers/components";
import type { ExtractionResult } from "@/lib/types";

interface FigmaExtractionOptions {
  fileKey: string;
  accessToken: string;
  onProgress?: (step: string, percent: number, detail?: string) => void;
}

const EXTRACTION_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

export async function extractFromFigma({
  fileKey,
  accessToken,
  onProgress,
}: FigmaExtractionOptions): Promise<ExtractionResult> {
  const startTime = Date.now();
  const checkTimeout = (step: string) => {
    const elapsed = Date.now() - startTime;
    if (elapsed > EXTRACTION_TIMEOUT_MS) {
      throw new Error(
        `Extraction timed out after ${Math.round(elapsed / 1000)}s during ${step}. This Figma file may be too large.`
      );
    }
  };

  const client = new FigmaClient({
    accessToken,
    onProgress: (msg) => onProgress?.("progress", 0, msg),
  });

  // Step 1: File metadata
  onProgress?.("metadata", 5, "Fetching file metadata...");
  const file = await client.getFile(fileKey, 1);

  // Step 2: Styles extraction (requires library_content:read scope — non-fatal if missing)
  checkTimeout("styles");
  let colors: ExtractionResult["tokens"]["colors"] = [];
  let typography: ExtractionResult["tokens"]["typography"] = [];
  let effects: ExtractionResult["tokens"]["effects"] = [];
  try {
    onProgress?.("styles", 15, "Extracting styles...");
    const parsed = await parseStyles(
      fileKey,
      client,
      (msg) => onProgress?.("styles", 30, msg)
    );
    colors = parsed.colors;
    typography = parsed.typography;
    effects = parsed.effects;
    onProgress?.("styles", 40, `Found ${colors.length} colours, ${typography.length} typography styles, ${effects.length} effects`);
  } catch (err) {
    if (err instanceof FigmaApiError && err.statusCode === 403) {
      onProgress?.(
        "styles",
        40,
        "Styles endpoint requires library_content:read scope — add it to your Figma token in Settings"
      );
    } else {
      throw err;
    }
  }

  // Step 3: Components extraction (requires file_content:read — non-fatal if missing scope)
  checkTimeout("components");
  let components: ExtractionResult["components"] = [];
  try {
    onProgress?.("components", 45, "Extracting components...");
    components = await parseComponents(
      fileKey,
      client,
      (msg) => onProgress?.("components", 55, msg)
    );
    onProgress?.("components", 60, `Found ${components.length} components`);
  } catch (err) {
    if (err instanceof FigmaApiError && err.statusCode === 403) {
      onProgress?.(
        "components",
        60,
        "Components endpoint requires additional scopes — add library_assets:read to your Figma token"
      );
    } else {
      throw err;
    }
  }

  // Step 4: Variables (Enterprise only - non-fatal)
  checkTimeout("variables");
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
        "Variables API requires a Figma Enterprise plan. Try the Figma plugin (layout.design/docs/figma-plugin) to extract variables on any plan."
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

  const varCount = Object.keys(cssVariables).length;
  onProgress?.("complete", 80, `Extraction complete — ${colors.length + typography.length + effects.length} tokens${varCount > 0 ? `, ${varCount} variables` : ""}`);

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
