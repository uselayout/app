import { supabase } from "./client";

const SCREENSHOTS_BUCKET = "screenshots";
const SCREENSHOT_NAMES = ["full-page.png", "viewport.png"] as const;

export type StorageBucket = "screenshots" | "branding" | "layout-images" | "layout-fonts";

/**
 * Upload a buffer to any Supabase storage bucket at the given path.
 * Returns the proxied /api/storage URL on success, null on failure.
 */
export async function uploadToBucket(
  bucket: StorageBucket,
  path: string,
  data: Buffer | Uint8Array,
  contentType: string,
  options?: { upsert?: boolean }
): Promise<string | null> {
  const { error } = await supabase.storage.from(bucket).upload(path, data, {
    contentType,
    upsert: options?.upsert ?? true,
  });

  if (error) {
    console.error(`Failed to upload to ${bucket}/${path}:`, error.message);
    return null;
  }

  return `/api/storage/${bucket}/${path}`;
}

/**
 * Delete one or more objects from a bucket by path.
 */
export async function deleteFromBucket(
  bucket: StorageBucket,
  paths: string[]
): Promise<void> {
  if (paths.length === 0) return;

  const { error } = await supabase.storage.from(bucket).remove(paths);

  if (error) {
    console.error(`Failed to delete from ${bucket}:`, error.message);
  }
}

/**
 * Upload base64 data-URI screenshots to Supabase Storage.
 * Returns an array of public URLs (same order as input).
 */
export async function uploadScreenshots(
  projectId: string,
  screenshots: string[]
): Promise<string[]> {
  const urls: string[] = [];

  for (let i = 0; i < screenshots.length; i++) {
    const dataUri = screenshots[i];
    if (!dataUri) continue;

    const base64 = dataUri.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64, "base64");
    const fileName = SCREENSHOT_NAMES[i] ?? `screenshot-${i}.png`;
    const path = `${projectId}/${fileName}`;

    const url = await uploadToBucket(SCREENSHOTS_BUCKET, path, buffer, "image/png");
    if (url) urls.push(url);
  }

  return urls;
}

/**
 * Delete all screenshots for a project.
 */
export async function deleteScreenshots(projectId: string): Promise<void> {
  const paths = SCREENSHOT_NAMES.map((name) => `${projectId}/${name}`);
  await deleteFromBucket(SCREENSHOTS_BUCKET, paths);
}
