import "server-only";
import {
  updateKitPreviewImage,
  updateKitHeroImage,
  updateKitStyleProfile,
  updateKitShowcase,
  setBespokeShowcase,
} from "@/lib/supabase/kits";
import { generateKitStyleProfile } from "@/lib/claude/generate-kit-style-profile";
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
  // Style profile: cheap (~$0.005/kit) Claude call that produces a
  // small JSON describing how each block should render — radii,
  // weights, paddings, fill style, density. The uniform Live Preview
  // reads this via window.__KIT__ and tailors itself per kit.
  // Falls back to DEFAULT_STYLE_PROFILE on failure.
  void (async () => {
    try {
      const profile = await generateKitStyleProfile({
        kitName: kit.name,
        kitDescription: kit.description,
        kitTags: kit.tags,
        layoutMd: kit.layoutMd,
        tokensCss: kit.tokensCss,
      });
      await updateKitStyleProfile(kit.id, profile);
    } catch (err) {
      console.error(`[gen-jobs] style profile failed for ${kit.slug}:`, err);
    }
  })();

  // Bespoke showcase generation, on every publish.
  //
  // We previously disabled this server-side because seven parallel
  // bulk-regen calls pegged the Node thread on transpile, starving the
  // healthcheck. The new operational profile is one-at-a-time manual
  // publishing through Studio, so concurrency stays at 1-2 in practice.
  // bespokeShowcaseLimit(2) inside generateKitShowcase queues anything
  // unexpected. scripts/regen-bespoke.ts remains as a manual fallback
  // if a publish-time generation fails.
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
      const ok = await updateKitShowcase(kit.id, result.tsx, result.js);
      if (ok) await setBespokeShowcase(kit.id, true);
    } catch (err) {
      console.error(`[gen-jobs] bespoke showcase failed for ${kit.slug}:`, err);
    }
  })();

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
