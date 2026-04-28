import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { requireAdmin } from "@/lib/api/admin-context";
import { supabase } from "@/lib/supabase/client";
import { fetchKitById } from "@/lib/supabase/kits";
import { transpileTsx } from "@/lib/transpile";

const PatchBody = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(2000).optional(),
  featured: z.boolean().optional(),
  hidden: z.boolean().optional(),
  unlisted: z.boolean().optional(),
  isNew: z.boolean().optional(),
  bespokeShowcase: z.boolean().optional(),
  cardImagePref: z.enum(["auto", "custom", "hero", "preview"]).optional(),
  // Empty string or null clears the URL; otherwise must parse as a URL.
  homepageUrl: z
    .union([z.literal(""), z.url().max(500)])
    .nullable()
    .optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin(request as never);
  if (admin instanceof NextResponse) return admin;

  const { id } = await params;
  const parsed = PatchBody.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }
  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  // Map camelCase API field to snake_case DB column.
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if ("name" in parsed.data) update.name = parsed.data.name;
  if ("description" in parsed.data) update.description = parsed.data.description;
  if ("featured" in parsed.data) update.featured = parsed.data.featured;
  if ("hidden" in parsed.data) update.hidden = parsed.data.hidden;
  if ("unlisted" in parsed.data) update.unlisted = parsed.data.unlisted;
  if ("isNew" in parsed.data) update.is_new = parsed.data.isNew;
  if ("bespokeShowcase" in parsed.data) update.bespoke_showcase = parsed.data.bespokeShowcase;
  if ("cardImagePref" in parsed.data) update.card_image_pref = parsed.data.cardImagePref;
  if ("homepageUrl" in parsed.data) {
    // Treat empty string and null the same — both clear the column.
    update.homepage_url = parsed.data.homepageUrl ? parsed.data.homepageUrl : null;
  }

  // When renaming or editing the description on a bespoke kit, the cached
  // showcase TSX has the old strings baked in (Claude wrote them as
  // string literals). Rather than queue a 60-90s Claude regen for a copy
  // change, do an in-place string replacement and re-transpile via
  // esbuild (~30ms). The new bespoke prompt rule (commit 5bf9f8d) tells
  // future Claude calls to read kit.name from window.__KIT__ instead, so
  // for those this rewrite is a no-op — either way the rename is instant.
  const isRenaming = "name" in parsed.data && parsed.data.name !== undefined;
  const isEditingDesc = "description" in parsed.data && parsed.data.description !== undefined;
  if (isRenaming || isEditingDesc) {
    const oldKit = await fetchKitById(id);
    if (oldKit?.bespokeShowcase && oldKit.showcaseCustomTsx) {
      let newTsx = oldKit.showcaseCustomTsx;
      const newName = parsed.data.name;
      const newDescription = parsed.data.description ?? "";
      // Length guards keep accidental matches inside other strings rare.
      if (
        isRenaming &&
        newName &&
        oldKit.name.length >= 4 &&
        oldKit.name !== newName
      ) {
        newTsx = newTsx.split(oldKit.name).join(newName);
      }
      if (
        isEditingDesc &&
        oldKit.description &&
        oldKit.description.length >= 12 &&
        oldKit.description !== newDescription
      ) {
        newTsx = newTsx.split(oldKit.description).join(newDescription);
      }
      if (newTsx !== oldKit.showcaseCustomTsx) {
        try {
          const newJs = await transpileTsx(newTsx);
          update.showcase_custom_tsx = newTsx;
          update.showcase_custom_js = newJs;
          update.showcase_generated_at = new Date().toISOString();
        } catch (err) {
          // Don't fail the rename if the rewrite somehow breaks the TSX.
          // The DB still gets the new name/description; the iframe
          // shows the stale heading until a manual Regen bespoke. Log
          // for diagnosis.
          console.warn(
            `[admin-kit-patch] cached bespoke rewrite failed for ${id}; falling back to no-rewrite:`,
            err instanceof Error ? err.message : err,
          );
        }
      }
    }
  }

  const { error } = await supabase
    .from("layout_public_kit")
    .update(update)
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin(request as never);
  if (admin instanceof NextResponse) return admin;

  const { id } = await params;
  const { error } = await supabase.from("layout_public_kit").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
