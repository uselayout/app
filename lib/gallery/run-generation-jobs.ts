import "server-only";
import {
  updateKitShowcase,
  updateKitPreviewImage,
  updateKitHeroImage,
} from "@/lib/supabase/kits";
import { generateKitShowcase } from "@/lib/claude/generate-kit-showcase";
import { captureAndUploadKitPreview } from "@/lib/gallery/snapshot";
import { captureAndUploadKitHero } from "@/lib/gallery/hero";
import type { PublicKit } from "@/lib/types/kit";

/**
 * Fire-and-forget: kick off the three asynchronous generation jobs that
 * populate a kit's bespoke showcase, Playwright preview, and GPT Image 2
 * hero cover. Errors from any one job are logged and swallowed so the
 * caller's response never blocks on AI/Playwright hiccups.
 *
 * Used by:
 *   - the publish route's Layout-team path (kit goes live immediately)
 *   - the admin Approve route (kit graduates from pending to approved)
 */
export function runKitGenerationJobs(
  kit: PublicKit,
  origin: string,
  openaiApiKey?: string,
): void {
  // Showcase generation only runs for kits the publisher (or admin) has
  // explicitly opted in for via the bespoke flag. Default kits render
  // through the uniform template — no Claude call, no cost, no variance.
  if (kit.bespokeShowcase) {
    void (async () => {
      try {
        const result = await generateKitShowcase({
          kitName: kit.name,
          kitDescription: kit.description,
          kitTags: kit.tags,
          layoutMd: kit.layoutMd,
          tokensCss: kit.tokensCss,
          brandingAssets: kit.richBundle?.brandingAssets,
        });
        await updateKitShowcase(kit.id, result.tsx, result.js);
      } catch (err) {
        console.error(`[gen-jobs] showcase failed for ${kit.slug}:`, err);
      }
    })();
  }

  void (async () => {
    try {
      const url = await captureAndUploadKitPreview(kit.id, kit.slug, origin);
      if (url) await updateKitPreviewImage(kit.id, url);
    } catch (err) {
      console.error(`[gen-jobs] preview snapshot failed for ${kit.slug}:`, err);
    }
  })();

  void (async () => {
    try {
      const url = await captureAndUploadKitHero(kit, { openaiApiKey });
      if (url) await updateKitHeroImage(kit.id, url);
    } catch (err) {
      console.error(`[gen-jobs] hero generation failed for ${kit.slug}:`, err);
    }
  })();
}
