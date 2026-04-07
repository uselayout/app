import { FigmaClient, FigmaApiError } from "./client";
import type { FigmaNode } from "./client";
import { parseStyles } from "./parsers/styles";
import { parseComponents } from "./parsers/components";
import type { ExtractionResult, ExtractedToken, TokenCategory, TokenType } from "@/lib/types";

interface FigmaExtractionOptions {
  fileKey: string;
  accessToken: string;
  onProgress?: (step: string, percent: number, detail?: string) => void;
}

const EXTRACTION_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

// ─── Node property mining ────────────────────────────────────────────────────

interface PropertyCensus {
  count: number;
  elements: string[];
}

/**
 * Recursively walk a Figma node tree and collect distinct cornerRadius
 * and spacing values (itemSpacing, padding) from auto-layout frames.
 */
function collectNodeProperties(
  node: FigmaNode,
  radiusCensus: Map<number, PropertyCensus>,
  spacingCensus: Map<number, PropertyCensus>,
  layoutPatternCensus: Map<string, PropertyCensus>
): void {
  // Collect corner radius
  if (node.cornerRadius !== undefined && node.cornerRadius > 0) {
    const existing = radiusCensus.get(node.cornerRadius);
    if (existing) {
      existing.count++;
      if (existing.elements.length < 5) existing.elements.push(node.name);
    } else {
      radiusCensus.set(node.cornerRadius, { count: 1, elements: [node.name] });
    }
  }

  // Collect spacing and layout patterns from auto-layout nodes
  if (node.layoutMode) {
    const spacingValues = [
      node.itemSpacing,
      node.paddingTop,
      node.paddingRight,
      node.paddingBottom,
      node.paddingLeft,
    ].filter((v): v is number => v !== undefined && v > 0);

    for (const val of spacingValues) {
      const existing = spacingCensus.get(val);
      if (existing) {
        existing.count++;
        if (existing.elements.length < 5) existing.elements.push(node.name);
      } else {
        spacingCensus.set(val, { count: 1, elements: [node.name] });
      }
    }

    // Record layout pattern
    const patternKey = `${node.layoutMode}|${node.primaryAxisAlignItems ?? "MIN"}|${node.counterAxisAlignItems ?? "MIN"}`;
    const existingPattern = layoutPatternCensus.get(patternKey);
    if (existingPattern) {
      existingPattern.count++;
      if (existingPattern.elements.length < 5) existingPattern.elements.push(node.name);
    } else {
      layoutPatternCensus.set(patternKey, { count: 1, elements: [node.name] });
    }
  }

  // Recurse into children
  if (node.children) {
    for (const child of node.children) {
      collectNodeProperties(child, radiusCensus, spacingCensus, layoutPatternCensus);
    }
  }
}

interface LayoutPattern {
  direction: string;
  mainAxis: string;
  crossAxis: string;
  count: number;
}

/**
 * Mine radius, spacing, and layout pattern tokens from component node data.
 * Clusters distinct values into a token scale.
 */
function mineNodeProperties(
  nodeData: Record<string, { document: FigmaNode }>
): { radius: ExtractedToken[]; spacing: ExtractedToken[]; layoutPatterns: LayoutPattern[] } {
  const radiusCensus = new Map<number, PropertyCensus>();
  const spacingCensus = new Map<number, PropertyCensus>();
  const layoutPatternCensus = new Map<string, PropertyCensus>();

  for (const entry of Object.values(nodeData)) {
    if (entry?.document) {
      collectNodeProperties(entry.document, radiusCensus, spacingCensus, layoutPatternCensus);
    }
  }

  // Build radius tokens from census
  const radius: ExtractedToken[] = [];
  const sortedRadii = Array.from(radiusCensus.entries()).sort(([a], [b]) => a - b);

  for (const [value, info] of sortedRadii) {
    // Assign scale name based on value
    let scaleName: string;
    if (value >= 9999) scaleName = "--radius-full";
    else if (value >= 100) scaleName = "--radius-pill";
    else if (value >= 20) scaleName = "--radius-xl";
    else if (value >= 16) scaleName = "--radius-lg";
    else if (value >= 12) scaleName = "--radius-md";
    else if (value >= 8) scaleName = "--radius-sm";
    else if (value >= 4) scaleName = "--radius-xs";
    else scaleName = `--radius-${value}`;

    // Avoid duplicate scale names by appending the value
    if (radius.some((t) => t.name === scaleName)) {
      scaleName = `--radius-${value}`;
    }

    const examples = info.elements.slice(0, 3).join(", ");
    radius.push({
      name: scaleName,
      value: `${value}px`,
      type: "radius",
      category: "primitive",
      cssVariable: scaleName,
      originalName: `${value}px (from ${info.count} components: ${examples})`,
      description: `${info.count} components (e.g. ${examples}) /* extracted from node tree */`,
    });
  }

  // Build spacing tokens from census
  const spacing: ExtractedToken[] = [];
  const sortedSpacing = Array.from(spacingCensus.entries()).sort(([a], [b]) => a - b);

  for (const [value, info] of sortedSpacing) {
    const examples = info.elements.slice(0, 3).join(", ");
    spacing.push({
      name: `--space-${value}`,
      value: `${value}px`,
      type: "spacing",
      category: "primitive",
      cssVariable: `--space-${value}`,
      originalName: `${value}px (from ${info.count} components: ${examples})`,
      description: `${info.count} components (e.g. ${examples}) /* extracted from node tree */`,
    });
  }

  // Build layout patterns from census
  const layoutPatterns: LayoutPattern[] = Array.from(layoutPatternCensus.entries())
    .map(([key, info]) => {
      const [direction, mainAxis, crossAxis] = key.split("|");
      return { direction, mainAxis, crossAxis, count: info.count };
    })
    .sort((a, b) => b.count - a.count);

  return { radius, spacing, layoutPatterns };
}

// ─── Main extraction ─────────────────────────────────────────────────────────

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

  const warnings: string[] = [];

  const client = new FigmaClient({
    accessToken,
    onProgress: (msg) => onProgress?.("progress", 0, msg),
  });

  // Step 1: File metadata
  onProgress?.("metadata", 5, "Fetching file metadata...");
  let file;
  try {
    file = await client.getFile(fileKey, 1);
  } catch (err) {
    if (err instanceof FigmaApiError && err.statusCode === 403) {
      const isOAuthScopeError = err.message.includes("Invalid scope");
      const detail = isOAuthScopeError
        ? "This looks like an OAuth token with incorrect scopes. Please use a Personal Access Token instead. Generate one at figma.com > Settings > Security > Personal access tokens."
        : "Your Figma token doesn't have access to this file. Check the token is valid and has file_content:read scope enabled in Figma Settings > Security > Personal access tokens.";
      onProgress?.(
        "metadata",
        0,
        detail
      );
      return {
        sourceType: "figma",
        sourceName: fileKey,
        sourceUrl: `https://www.figma.com/file/${fileKey}`,
        tokens: { colors: [], typography: [], spacing: [], radius: [], effects: [], motion: [] },
        components: [],
        screenshots: [],
        fonts: [],
        animations: [],
        librariesDetected: {},
        cssVariables: {},
        computedStyles: {},
      };
    }
    throw err;
  }

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
    if (parsed.styleCount > 500) {
      warnings.push(`${parsed.styleCount} styles found but only first 500 extracted. Some style tokens may be missing.`);
    }
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
  let componentNodeData: Record<string, { document: FigmaNode }> = {};
  try {
    onProgress?.("components", 45, "Extracting components...");
    const parsed = await parseComponents(
      fileKey,
      client,
      (msg) => onProgress?.("components", 55, msg),
      (msg) => warnings.push(msg)
    );
    components = parsed.components;
    componentNodeData = parsed.nodeData;
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

  // Step 3b: Mine radius and spacing from component node trees
  checkTimeout("node-properties");
  onProgress?.("node-properties", 62, "Mining radius and spacing from components...");
  const { radius, spacing, layoutPatterns } = mineNodeProperties(componentNodeData);
  if (radius.length > 0 || spacing.length > 0) {
    onProgress?.("node-properties", 64, `Found ${radius.length} radius values, ${spacing.length} spacing values`);
  }

  // Step 4: Variables (Enterprise only - non-fatal)
  checkTimeout("variables");
  let cssVariables: Record<string, string> = {};
  try {
    onProgress?.("variables", 65, "Fetching variables (Enterprise plan)...");
    const varsResponse = await client.getVariables(fileKey);
    const vars = varsResponse.meta.variables;
    const collections = varsResponse.meta.variableCollections;

    // Build mode ID → mode name lookup from collections
    const modeNames = new Map<string, string>();
    for (const collection of Object.values(collections)) {
      for (const mode of collection.modes) {
        modeNames.set(mode.modeId, mode.name);
      }
    }

    // Resolve variable aliases: build a lookup by variable ID
    const varsById = new Map<string, typeof vars[string]>();
    for (const [varId, v] of Object.entries(vars)) {
      varsById.set(varId, v);
    }

    function resolveAliasValue(
      modeValue: unknown,
      modeId: string,
      depth: number = 0
    ): { resolved: unknown; aliasChain: string[] } {
      if (depth > 10) return { resolved: modeValue, aliasChain: [] };
      if (
        typeof modeValue === "object" &&
        modeValue !== null &&
        "type" in modeValue &&
        (modeValue as Record<string, unknown>).type === "VARIABLE_ALIAS" &&
        "id" in modeValue
      ) {
        const aliasId = (modeValue as Record<string, string>).id;
        const referencedVar = varsById.get(aliasId);
        if (referencedVar) {
          const refValue = referencedVar.valuesByMode[modeId];
          if (refValue !== undefined) {
            const deeper = resolveAliasValue(refValue, modeId, depth + 1);
            return {
              resolved: deeper.resolved,
              aliasChain: [referencedVar.name, ...deeper.aliasChain],
            };
          }
        }
        return { resolved: modeValue, aliasChain: [] };
      }
      return { resolved: modeValue, aliasChain: [] };
    }

    // Multi-mode tokens stored as ExtractedToken entries with mode field
    const modeTokens: ExtractedToken[] = [];

    for (const v of Object.values(vars)) {
      const modeEntries = Object.entries(v.valuesByMode);
      const hasMultipleModes = modeEntries.length > 1;

      for (const [modeId, rawModeValue] of modeEntries) {
        const baseName = `--${v.name.toLowerCase().replace(/[/\s]+/g, "-")}`;
        const modeName = modeNames.get(modeId)?.toLowerCase().replace(/[/\s]+/g, "-");
        const varName = hasMultipleModes && modeName ? `${baseName}-${modeName}` : baseName;

        // Resolve aliases
        const { resolved: modeValue, aliasChain } = resolveAliasValue(rawModeValue, modeId);
        const aliasDesc = aliasChain.length > 0
          ? `Alias: ${v.name} → ${aliasChain.join(" → ")}`
          : undefined;

        let resolvedValue: string | undefined;

        if (v.resolvedType === "COLOR" && typeof modeValue === "object" && modeValue !== null) {
          const val = modeValue as { r?: number; g?: number; b?: number; a?: number };
          if (val.r !== undefined && val.g !== undefined && val.b !== undefined) {
            const hex = `#${Math.round(val.r * 255).toString(16).padStart(2, "0")}${Math.round(val.g * 255).toString(16).padStart(2, "0")}${Math.round(val.b * 255).toString(16).padStart(2, "0")}`;
            cssVariables[varName] = hex;
            resolvedValue = hex;
          }
        } else if (v.resolvedType === "FLOAT" && typeof modeValue === "number") {
          cssVariables[varName] = `${modeValue}`;
          resolvedValue = `${modeValue}`;
        } else if (v.resolvedType === "STRING" && typeof modeValue === "string") {
          cssVariables[varName] = modeValue;
          resolvedValue = modeValue;
        }

        // For multi-mode variables, create ExtractedToken entries with mode field
        if (hasMultipleModes && resolvedValue !== undefined && modeName) {
          const tokenType: TokenType =
            v.resolvedType === "COLOR" ? "color" : "spacing";

          modeTokens.push({
            name: v.name,
            value: resolvedValue,
            type: tokenType,
            category: "semantic" as TokenCategory,
            cssVariable: baseName,
            mode: modeName,
            ...(aliasDesc ? { description: aliasDesc } : {}),
          });
        }
      }
    }

    // Add mode tokens to the appropriate token arrays
    for (const token of modeTokens) {
      if (token.type === "color") {
        colors.push(token);
      } else {
        spacing.push(token);
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

  // Add extracted tokens as CSS variables for synthesis
  for (const token of [...colors, ...radius, ...spacing]) {
    if (token.cssVariable) {
      cssVariables[token.cssVariable] = token.value;
    }
  }

  // Cap variant names per component to prevent oversized payloads
  for (const comp of components) {
    if (comp.variants && comp.variants.length > 20) {
      comp.variants = comp.variants.slice(0, 20);
    }
  }

  // Cap cssVariables to 1000 entries for very large Enterprise files
  const varCount = Object.keys(cssVariables).length;
  if (varCount > 1000) {
    warnings.push(`${varCount} variables found but capped at 1000 to avoid payload limits.`);
    cssVariables = Object.fromEntries(Object.entries(cssVariables).slice(0, 1000));
  }

  const tokenCount = colors.length + typography.length + effects.length + radius.length + spacing.length;
  const cappedVarCount = Object.keys(cssVariables).length;
  onProgress?.("complete", 80, `Extraction complete — ${tokenCount} tokens${cappedVarCount > 0 ? `, ${cappedVarCount} variables` : ""}`);

  return {
    sourceType: "figma",
    sourceName: file.name,
    sourceUrl: `https://www.figma.com/file/${fileKey}`,
    tokens: {
      colors,
      typography,
      spacing,
      radius,
      effects,
      motion: [],
    },
    components,
    screenshots: [],
    fonts: (() => {
      const seen = new Set<string>();
      const fonts: Array<{ family: string; weight: string; style: string; display: string }> = [];
      for (const t of typography) {
        const family = t.value.split("font-family: ")[1]?.split(";")[0]?.trim() || "Unknown";
        const weight = t.value.split("font-weight: ")[1]?.split(";")[0]?.trim() || "400";
        const style = t.value.includes("font-style: italic") ? "italic" : "normal";
        const key = `${family}:${weight}:${style}`;
        if (!seen.has(key)) {
          seen.add(key);
          fonts.push({ family, weight, style, display: "swap" });
        }
      }
      return fonts;
    })(),
    animations: [],
    librariesDetected: {},
    cssVariables,
    computedStyles: {},
    layoutPatterns,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}
