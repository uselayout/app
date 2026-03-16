/**
 * Process image placeholders in generated TSX/HTML code.
 *
 * Calls the /api/generate/image batch endpoint to replace
 * data-generate-image attributes with real AI-generated image URLs.
 *
 * This module runs CLIENT-SIDE — no server-only imports allowed.
 */

const IMAGE_PLACEHOLDER_RE = /data-generate-image=["'][^"']+["']/i;

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
  if (!IMAGE_PLACEHOLDER_RE.test(code)) return code;

  console.log("[process-code-images] Found image placeholders, calling API...");

  try {
    const res = await fetch("/api/generate/image", {
      method: "POST",
      credentials: "include",
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
      const errBody = await res.json().catch(() => ({ error: "Unknown error" }));
      const errMsg = errBody.error ?? `HTTP ${res.status}`;
      console.warn(`[process-code-images] API error: ${errMsg}`);

      if (errBody.code === "NO_API_KEY") {
        console.warn("[process-code-images] GOOGLE_AI_API_KEY is not configured on the server. Images will not be generated.");
      }

      return code;
    }

    const data = await res.json();

    if (data.failedCount > 0) {
      console.warn(
        `[process-code-images] ${data.failedCount}/${data.totalCount} images failed to generate`,
        data.errors?.[0] ?? ""
      );
    }

    if (data.failedCount === 0 && data.totalCount > 0) {
      console.log(`[process-code-images] All ${data.totalCount} images generated successfully`);
    }

    return data.html ?? code;
  } catch (err) {
    console.warn("[process-code-images] Failed:", err);
    return code;
  }
}
