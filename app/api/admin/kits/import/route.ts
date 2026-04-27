import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/api/admin-context";
import { supabase } from "@/lib/supabase/client";
import type { PublicKit } from "@/lib/types/kit";

/**
 * Inbound side of the staging→prod promote. Receives the full kit row in
 * the body (already-rendered showcase TSX, layout.md, tokens, rich_bundle,
 * everything) and inserts/upserts into `layout_public_kit`.
 *
 * Storage objects referenced by the row are copied separately by the caller
 * (see lib/promote/promote-kit.ts) — this endpoint is row-only, deliberately.
 *
 * Auth: admin-bearer (the caller posts with the destination's ADMIN_API_KEY).
 *
 * Conflict handling:
 *   - 409 with `{existingProdUrl}` if a row with the same `slug` already
 *     exists. Caller can re-call with `?overwrite=true` to upsert.
 *
 * Idempotent under overwrite=true.
 */

const KitSchema = z
  .object({
    id: z.string().uuid(),
    slug: z.string().min(1).max(64),
    name: z.string().min(1),
    description: z.string().optional(),
    tags: z.array(z.string()),
    author: z.object({
      orgId: z.string(),
      userId: z.string().optional(),
      displayName: z.string().optional(),
      avatarUrl: z.string().optional(),
    }),
    licence: z.enum(["MIT", "CC-BY-4.0", "custom"]),
    licenceCustom: z.string().optional(),
    previewImageUrl: z.string().optional(),
    layoutMd: z.string(),
    tokensCss: z.string(),
    tokensJson: z.record(z.string(), z.unknown()),
    kitJson: z.record(z.string(), z.unknown()),
    tier: z.enum(["minimal", "rich"]),
    richBundle: z.record(z.string(), z.unknown()).optional(),
    sourceProjectId: z.string().optional(),
    parentKitId: z.string().optional(),
    status: z.enum(["pending", "approved"]),
    cardImagePref: z.enum(["auto", "custom", "hero", "preview"]),
    featured: z.boolean(),
    hidden: z.boolean(),
    unlisted: z.boolean(),
    isNew: z.boolean(),
    bespokeShowcase: z.boolean(),
    upvoteCount: z.number().int(),
    importCount: z.number().int(),
    viewCount: z.number().int(),
    githubFolder: z.string().optional(),
    githubSyncedAt: z.string().optional(),
    showcaseCustomTsx: z.string().optional(),
    showcaseCustomJs: z.string().optional(),
    showcaseGeneratedAt: z.string().optional(),
    previewGeneratedAt: z.string().optional(),
    heroImageUrl: z.string().optional(),
    heroGeneratedAt: z.string().optional(),
    customCardImageUrl: z.string().optional(),
    styleProfile: z.unknown().optional(),
    styleProfileGeneratedAt: z.string().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .strict();

const BodySchema = z.object({ kit: KitSchema });

export async function POST(request: Request) {
  const admin = await requireAdmin(request as never);
  if (admin instanceof NextResponse) return admin;

  const overwrite = new URL(request.url).searchParams.get("overwrite") === "true";

  let body: { kit: PublicKit };
  try {
    body = BodySchema.parse(await request.json()) as unknown as { kit: PublicKit };
  } catch (err) {
    return NextResponse.json(
      { error: "invalid_body", detail: err instanceof Error ? err.message : String(err) },
      { status: 400 },
    );
  }

  const kit = body.kit;

  // Conflict check on slug — slug is the natural key for cross-env identity.
  const { data: existing } = await supabase
    .from("layout_public_kit")
    .select("id, slug")
    .eq("slug", kit.slug)
    .maybeSingle();

  // Public origin for response URLs. Prefer NEXT_PUBLIC_APP_URL because behind
  // Coolify/Traefik the inbound request URL resolves to the container's internal
  // listen address (e.g. http://0.0.0.0:3000), not the public origin.
  const publicOrigin = (
    process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin
  ).replace(/\/$/, "");

  if (existing && !overwrite) {
    return NextResponse.json(
      {
        error: "slug_exists",
        existingProdUrl: `${publicOrigin}/gallery/${kit.slug}`,
      },
      { status: 409 },
    );
  }

  const row = {
    id: existing?.id ?? kit.id,
    slug: kit.slug,
    name: kit.name,
    description: kit.description ?? null,
    tags: kit.tags,
    author_org_id: kit.author.orgId,
    author_user_id: kit.author.userId ?? null,
    author_display_name: kit.author.displayName ?? null,
    author_avatar_url: kit.author.avatarUrl ?? null,
    licence: kit.licence,
    licence_custom: kit.licenceCustom ?? null,
    preview_image_url: kit.previewImageUrl ?? null,
    layout_md: kit.layoutMd,
    tokens_css: kit.tokensCss,
    tokens_json: kit.tokensJson,
    kit_json: kit.kitJson,
    tier: kit.tier,
    rich_bundle: kit.richBundle ?? null,
    source_project_id: kit.sourceProjectId ?? null,
    parent_kit_id: kit.parentKitId ?? null,
    status: kit.status,
    card_image_pref: kit.cardImagePref,
    featured: kit.featured,
    hidden: kit.hidden,
    unlisted: kit.unlisted,
    is_new: kit.isNew,
    bespoke_showcase: kit.bespokeShowcase,
    upvote_count: 0, // never carry upvotes across envs
    import_count: 0,
    view_count: 0,
    github_folder: kit.githubFolder ?? null,
    github_synced_at: kit.githubSyncedAt ?? null,
    showcase_custom_tsx: kit.showcaseCustomTsx ?? null,
    showcase_custom_js: kit.showcaseCustomJs ?? null,
    showcase_generated_at: kit.showcaseGeneratedAt ?? null,
    preview_generated_at: kit.previewGeneratedAt ?? null,
    hero_image_url: kit.heroImageUrl ?? null,
    hero_generated_at: kit.heroGeneratedAt ?? null,
    custom_card_image_url: kit.customCardImageUrl ?? null,
    style_profile: kit.styleProfile ?? null,
    style_profile_generated_at: kit.styleProfileGeneratedAt ?? null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("layout_public_kit")
    .upsert(row, { onConflict: "id" });

  if (error) {
    return NextResponse.json(
      { error: "upsert_failed", detail: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    kitId: row.id,
    slug: row.slug,
    url: `${publicOrigin}/gallery/${row.slug}`,
    overwritten: !!existing,
  });
}
