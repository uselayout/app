/**
 * Process image placeholders in generated TSX/HTML code.
 *
 * Calls the /api/generate/image batch endpoint to replace
 * data-generate-image attributes with real AI-generated image URLs.
 *
 * This module runs CLIENT-SIDE — no server-only imports allowed.
 */

import { getStoredGoogleApiKey } from "@/lib/hooks/use-api-key";

const IMAGE_PLACEHOLDER_RE = /data-generate-image=["'][^"']+["']/i;

interface ProcessOptions {
  orgId?: string;
  brandColours?: string[];
  brandStyle?: string;
}

export interface ProcessCodeImagesResult {
  code: string;
  /** Whether images were skipped because no Google AI API key is configured */
  skippedNoKey: boolean;
  /** Number of images found as placeholders */
  placeholderCount: number;
  /** Number of images that failed to generate */
  failedCount: number;
  /** Specific error messages (e.g. safety policy blocks) */
  errors: string[];
}

/**
 * Check if code contains image placeholders and process them via the API.
 * Returns the updated code plus status information about what happened.
 */
export async function processCodeImages(
  code: string,
  options: ProcessOptions = {}
): Promise<ProcessCodeImagesResult> {
  const hasPlaceholders = IMAGE_PLACEHOLDER_RE.test(code);
  if (!hasPlaceholders) return { code, skippedNoKey: false, placeholderCount: 0, failedCount: 0, errors: [] };

  // Count placeholders for reporting
  const placeholderCount = (code.match(/data-generate-image=["'][^"']+["']/gi) ?? []).length;

  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const googleKey = getStoredGoogleApiKey();
    if (googleKey) headers["X-Google-Api-Key"] = googleKey;

    const res = await fetch("/api/generate/image", {
      method: "POST",
      credentials: "include",
      headers,
      body: JSON.stringify({
        mode: "batch",
        html: code,
        orgId: options.orgId,
        brandColours: options.brandColours,
        brandStyle: options.brandStyle,
      }),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({ error: "Unknown error" }));

      if (errBody.code === "NO_API_KEY") {
        return { code, skippedNoKey: true, placeholderCount, failedCount: 0, errors: [] };
      }

      const apiErr = errBody.error ?? `HTTP ${res.status}`;
      console.warn(`[process-code-images] API error: ${apiErr}`);
      return { code, skippedNoKey: false, placeholderCount, failedCount: placeholderCount, errors: [apiErr] };
    }

    const data = await res.json();

    if (data.failedCount > 0) {
      console.warn(
        `[process-code-images] ${data.failedCount}/${data.totalCount} images failed to generate`,
        data.errors?.[0] ?? ""
      );
    }

    return {
      code: data.html ?? code,
      skippedNoKey: false,
      placeholderCount: data.totalCount ?? placeholderCount,
      failedCount: data.failedCount ?? 0,
      errors: (data.errors as string[]) ?? [],
    };
  } catch (err) {
    console.warn("[process-code-images] Failed:", err);
    const errMsg = err instanceof Error ? err.message : "Image processing failed";
    return { code, skippedNoKey: false, placeholderCount, failedCount: placeholderCount, errors: [errMsg] };
  }
}
