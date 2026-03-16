/**
 * Process image placeholders in generated TSX/HTML code.
 *
 * Calls the /api/generate/image batch endpoint to replace
 * data-generate-image attributes with real AI-generated image URLs.
 */

import { hasImagePlaceholders } from "./pipeline";

interface ProcessOptions {
  orgId?: string;
  brandColours?: string[];
  brandStyle?: string;
}

/**
 * Check if code contains image placeholders and process them via the API.
 * Returns the updated code, or the original if no placeholders or on failure.
 */
export async function processCodeImages(
  code: string,
  options: ProcessOptions = {}
): Promise<string> {
  if (!hasImagePlaceholders(code)) return code;

  try {
    const res = await fetch("/api/generate/image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "batch",
        html: code,
        orgId: options.orgId,
        brandColours: options.brandColours,
        brandStyle: options.brandStyle,
      }),
    });

    if (!res.ok) {
      console.warn("[process-code-images] API returned", res.status);
      return code;
    }

    const { html } = await res.json();
    return html ?? code;
  } catch (err) {
    console.warn("[process-code-images] Failed:", err);
    return code;
  }
}
