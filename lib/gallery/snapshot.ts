import "server-only";
import { chromium } from "playwright";
import { uploadToBucket } from "@/lib/supabase/storage";

const VIEWPORT = { width: 1440, height: 900 };
const NAV_TIMEOUT_MS = 30_000;
const RENDER_WAIT_MS = 2_500;

/**
 * Playwright-based PNG generator for gallery cards. Navigates to the kit's
 * detail page in snapshot mode, waits for the showcase iframe to finish
 * rendering, and returns a PNG buffer.
 *
 * The detail page opts into snapshot mode when `?snapshot=1` is set on the
 * URL — in that state it hides the outer chrome (header, back link, tabs,
 * sidebar) and renders only the showcase iframe at full width. See
 * app/gallery/[slug]/page.tsx.
 */
export async function captureKitShowcasePng(
  kitSlug: string,
  baseUrl: string,
): Promise<Buffer | null> {
  const target = `${baseUrl.replace(/\/$/, "")}/gallery/${encodeURIComponent(kitSlug)}?snapshot=1`;
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: VIEWPORT });
    const page = await context.newPage();
    await page.goto(target, { waitUntil: "networkidle", timeout: NAV_TIMEOUT_MS });
    // Give the inner iframe enough time to load React from the CDN, run the
    // showcase JS, and paint. networkidle above does not wait for subframes.
    await page.waitForTimeout(RENDER_WAIT_MS);
    const buffer = await page.screenshot({ type: "png", fullPage: false, timeout: 15_000 });
    return buffer;
  } finally {
    await browser.close().catch(() => {});
  }
}

/**
 * Capture the showcase PNG and upload it to the screenshots bucket. Returns
 * the proxied /api/storage URL on success, null on failure.
 */
export async function captureAndUploadKitPreview(
  kitId: string,
  kitSlug: string,
  baseUrl: string,
): Promise<string | null> {
  const buffer = await captureKitShowcasePng(kitSlug, baseUrl).catch((err) => {
    console.error(`[kit-snapshot] capture failed for ${kitSlug}:`, err);
    return null;
  });
  if (!buffer) return null;

  const path = `kit-previews/${kitId}.png`;
  return uploadToBucket("screenshots", path, buffer, "image/png", { upsert: true });
}
