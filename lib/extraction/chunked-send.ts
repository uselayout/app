import type { ExtractionResult } from "@/lib/types";

/**
 * Send an ExtractionResult over SSE in chunks to avoid V8's string length limit.
 * Each chunk is small enough to safely JSON.stringify.
 *
 * Protocol:
 *   { type: "result-start" }
 *   { type: "result-chunk", field: "meta", data: { sourceType, sourceName, ... } }
 *   { type: "result-chunk", field: "tokens", data: { colors: [...], ... } }
 *   { type: "result-chunk", field: "components", data: [...] }
 *   { type: "result-chunk", field: "cssVariables", data: { ... } }
 *   { type: "result-end" }
 *
 * The client reassembles these into a full ExtractionResult.
 */
export function sendResultChunked(
  send: (data: Record<string, unknown>) => void,
  result: ExtractionResult
): void {
  send({ type: "result-start" });

  // Meta fields (always small)
  send({
    type: "result-chunk",
    field: "meta",
    data: {
      sourceType: result.sourceType,
      sourceName: result.sourceName,
      sourceUrl: result.sourceUrl,
      screenshots: result.screenshots,
      fonts: result.fonts,
      animations: result.animations,
      librariesDetected: result.librariesDetected,
      computedStyles: result.computedStyles,
      interactiveStates: result.interactiveStates,
      breakpoints: result.breakpoints,
      warnings: result.warnings,
      layoutPatterns: result.layoutPatterns,
    },
  });

  // Tokens by category (each category is small)
  send({
    type: "result-chunk",
    field: "tokens",
    data: result.tokens,
  });

  // Components in batches of 25
  const COMP_BATCH = 25;
  for (let i = 0; i < result.components.length; i += COMP_BATCH) {
    send({
      type: "result-chunk",
      field: "components",
      data: result.components.slice(i, i + COMP_BATCH),
    });
  }
  // Send empty array if no components (client needs at least one chunk to initialise)
  if (result.components.length === 0) {
    send({ type: "result-chunk", field: "components", data: [] });
  }

  // CSS variables in batches of 200
  const varEntries = Object.entries(result.cssVariables);
  const VAR_BATCH = 200;
  for (let i = 0; i < varEntries.length; i += VAR_BATCH) {
    send({
      type: "result-chunk",
      field: "cssVariables",
      data: Object.fromEntries(varEntries.slice(i, i + VAR_BATCH)),
    });
  }
  // Send empty object if no variables
  if (varEntries.length === 0) {
    send({ type: "result-chunk", field: "cssVariables", data: {} });
  }

  send({ type: "result-end" });
}
