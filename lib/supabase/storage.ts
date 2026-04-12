import { supabase } from "./client";

const BUCKET = "screenshots";

const SCREENSHOT_NAMES = ["full-page.png", "viewport.png"] as const;

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

    // Strip data:image/png;base64, prefix
    const base64 = dataUri.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64, "base64");
    const fileName = SCREENSHOT_NAMES[i] ?? `screenshot-${i}.png`;
    const path = `${projectId}/${fileName}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, {
        contentType: "image/png",
        upsert: true,
      });

    if (error) {
      console.error(`Failed to upload screenshot ${path}:`, error.message);
      continue;
    }

    urls.push(`/api/storage/${BUCKET}/${path}`);
  }

  return urls;
}

/**
 * Delete all screenshots for a project.
 */
export async function deleteScreenshots(projectId: string): Promise<void> {
  const paths = SCREENSHOT_NAMES.map((name) => `${projectId}/${name}`);

  const { error } = await supabase.storage.from(BUCKET).remove(paths);

  if (error) {
    console.error(`Failed to delete screenshots for ${projectId}:`, error.message);
  }
}
