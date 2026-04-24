import { supabase } from "./client";
import {
  kitSummary,
  slugify,
  type KitAuthor,
  type KitJson,
  type KitLicence,
  type KitRichBundle,
  type KitSort,
  type KitTier,
  type PublicKit,
  type PublicKitSummary,
} from "@/lib/types/kit";

interface KitRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  tags: string[];
  author_org_id: string;
  author_user_id: string | null;
  author_display_name: string | null;
  author_avatar_url: string | null;
  licence: string;
  licence_custom: string | null;
  preview_image_url: string | null;
  layout_md: string;
  tokens_css: string;
  tokens_json: unknown;
  kit_json: unknown;
  tier: string;
  rich_bundle: unknown;
  source_project_id: string | null;
  parent_kit_id: string | null;
  featured: boolean;
  hidden: boolean;
  unlisted: boolean;
  upvote_count: number;
  import_count: number;
  view_count: number;
  github_folder: string | null;
  github_synced_at: string | null;
  showcase_custom_tsx: string | null;
  showcase_custom_js: string | null;
  showcase_generated_at: string | null;
  preview_generated_at: string | null;
  created_at: string;
  updated_at: string;
}

const SUMMARY_COLUMNS =
  "id, slug, name, description, tags, author_org_id, author_user_id, author_display_name, author_avatar_url, licence, preview_image_url, tier, featured, upvote_count, import_count, created_at, updated_at";

function rowToKit(row: KitRow): PublicKit {
  const author: KitAuthor = {
    orgId: row.author_org_id,
    userId: row.author_user_id ?? undefined,
    displayName: row.author_display_name ?? undefined,
    avatarUrl: row.author_avatar_url ?? undefined,
  };

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description ?? undefined,
    tags: row.tags ?? [],
    author,
    licence: row.licence as KitLicence,
    licenceCustom: row.licence_custom ?? undefined,
    previewImageUrl: row.preview_image_url ?? undefined,
    layoutMd: row.layout_md,
    tokensCss: row.tokens_css,
    tokensJson: (row.tokens_json as Record<string, unknown>) ?? {},
    kitJson: (row.kit_json as KitJson) ?? ({} as KitJson),
    tier: row.tier as KitTier,
    richBundle: (row.rich_bundle as KitRichBundle) ?? undefined,
    sourceProjectId: row.source_project_id ?? undefined,
    parentKitId: row.parent_kit_id ?? undefined,
    featured: row.featured,
    hidden: row.hidden,
    unlisted: row.unlisted,
    upvoteCount: row.upvote_count,
    importCount: row.import_count,
    viewCount: row.view_count,
    githubFolder: row.github_folder ?? undefined,
    githubSyncedAt: row.github_synced_at ?? undefined,
    showcaseCustomTsx: row.showcase_custom_tsx ?? undefined,
    showcaseCustomJs: row.showcase_custom_js ?? undefined,
    showcaseGeneratedAt: row.showcase_generated_at ?? undefined,
    previewGeneratedAt: row.preview_generated_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToSummary(row: Partial<KitRow>): PublicKitSummary {
  return {
    id: row.id!,
    slug: row.slug!,
    name: row.name!,
    description: row.description ?? undefined,
    tags: row.tags ?? [],
    author: {
      orgId: row.author_org_id!,
      userId: row.author_user_id ?? undefined,
      displayName: row.author_display_name ?? undefined,
      avatarUrl: row.author_avatar_url ?? undefined,
    },
    licence: (row.licence as KitLicence) ?? "MIT",
    previewImageUrl: row.preview_image_url ?? undefined,
    tier: (row.tier as KitTier) ?? "minimal",
    featured: row.featured ?? false,
    upvoteCount: row.upvote_count ?? 0,
    importCount: row.import_count ?? 0,
    createdAt: row.created_at!,
    updatedAt: row.updated_at!,
  };
}

export type PublishKitInput = Omit<
  PublicKit,
  | "id"
  | "createdAt"
  | "updatedAt"
  | "upvoteCount"
  | "importCount"
  | "viewCount"
  | "featured"
  | "hidden"
  | "githubFolder"
  | "githubSyncedAt"
> & { id?: string };

type KitInsertRow = Omit<
  KitRow,
  | "created_at"
  | "updated_at"
  | "upvote_count"
  | "import_count"
  | "view_count"
  | "featured"
  | "hidden"
  | "github_folder"
  | "github_synced_at"
  | "showcase_custom_tsx"
  | "showcase_custom_js"
  | "showcase_generated_at"
  | "preview_generated_at"
>;

export function kitToRow(kit: PublishKitInput): KitInsertRow {
  return {
    id: kit.id ?? crypto.randomUUID(),
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
    unlisted: kit.unlisted ?? false,
  };
}

export interface ListKitsOptions {
  tag?: string;
  q?: string;
  sort?: KitSort;
  limit?: number;
  offset?: number;
  includeUnlisted?: boolean;
  authorOrgId?: string;
}

export async function listPublicKits(
  options: ListKitsOptions = {}
): Promise<PublicKitSummary[]> {
  const {
    tag,
    q,
    sort = "featured",
    limit = 60,
    offset = 0,
    includeUnlisted = false,
    authorOrgId,
  } = options;

  let query = supabase
    .from("layout_public_kit")
    .select(SUMMARY_COLUMNS)
    .eq("hidden", false)
    .range(offset, offset + limit - 1);

  if (!includeUnlisted) query = query.eq("unlisted", false);
  if (authorOrgId) query = query.eq("author_org_id", authorOrgId);
  if (tag) query = query.contains("tags", [tag]);
  if (q) query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`);

  if (sort === "featured") {
    query = query
      .order("featured", { ascending: false })
      .order("upvote_count", { ascending: false })
      .order("created_at", { ascending: false });
  } else if (sort === "top") {
    query = query.order("upvote_count", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data, error } = await query;
  if (error) {
    console.error("listPublicKits failed:", error.message);
    return [];
  }
  return (data as Partial<KitRow>[]).map(rowToSummary);
}

export async function fetchKitBySlug(slug: string): Promise<PublicKit | null> {
  const { data, error } = await supabase
    .from("layout_public_kit")
    .select("*")
    .eq("slug", slug)
    .eq("hidden", false)
    .maybeSingle();
  if (error || !data) return null;
  return rowToKit(data as KitRow);
}

export async function fetchKitById(id: string): Promise<PublicKit | null> {
  const { data, error } = await supabase
    .from("layout_public_kit")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return rowToKit(data as KitRow);
}

/** Write back the AI-generated bespoke showcase TSX + transpiled JS. */
export async function updateKitShowcase(
  id: string,
  tsx: string,
  js: string,
): Promise<boolean> {
  const { error } = await supabase
    .from("layout_public_kit")
    .update({
      showcase_custom_tsx: tsx,
      showcase_custom_js: js,
      showcase_generated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) console.error("updateKitShowcase failed:", error.message);
  return !error;
}

/** Write back the Playwright-generated PNG preview URL. */
export async function updateKitPreviewImage(
  id: string,
  previewImageUrl: string,
): Promise<boolean> {
  const { error } = await supabase
    .from("layout_public_kit")
    .update({
      preview_image_url: previewImageUrl,
      preview_generated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) console.error("updateKitPreviewImage failed:", error.message);
  return !error;
}

/**
 * Publish a kit. The caller is responsible for building the kit payload
 * (layout.md, tokens.css, tokens.json, rich bundle) from a Studio project.
 * Slug is auto-generated from the name and disambiguated on collision.
 */
export async function publishKit(input: PublishKitInput): Promise<PublicKit> {
  const baseSlug = slugify(input.slug || input.name);
  const slug = await uniqueSlug(baseSlug);
  const row = kitToRow({ ...input, slug });

  const { data, error } = await supabase
    .from("layout_public_kit")
    .insert(row)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Failed to publish kit: ${error?.message ?? "unknown"}`);
  }
  return rowToKit(data as KitRow);
}

async function uniqueSlug(base: string): Promise<string> {
  const { data } = await supabase
    .from("layout_public_kit")
    .select("slug")
    .like("slug", `${base}%`);
  const used = new Set((data ?? []).map((r) => (r as { slug: string }).slug));
  if (!used.has(base)) return base;
  for (let i = 2; i < 100; i++) {
    const candidate = `${base}-${i}`;
    if (!used.has(candidate)) return candidate;
  }
  return `${base}-${crypto.randomUUID().slice(0, 4)}`;
}

export async function incrementImportCount(kitId: string): Promise<void> {
  // Non-atomic read-then-write. A lost-update on concurrent imports is
  // acceptable here: the counter is a vanity metric, not a billing signal.
  const { data } = await supabase
    .from("layout_public_kit")
    .select("import_count")
    .eq("id", kitId)
    .maybeSingle();
  const next = ((data as { import_count: number } | null)?.import_count ?? 0) + 1;
  await supabase
    .from("layout_public_kit")
    .update({ import_count: next })
    .eq("id", kitId);
}

export async function deleteKit(id: string, requesterOrgId: string): Promise<boolean> {
  const { error, count } = await supabase
    .from("layout_public_kit")
    .delete({ count: "exact" })
    .eq("id", id)
    .eq("author_org_id", requesterOrgId);
  return !error && (count ?? 0) > 0;
}

export async function hasUpvoted(kitId: string, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("layout_public_kit_upvote")
    .select("kit_id")
    .eq("kit_id", kitId)
    .eq("user_id", userId)
    .maybeSingle();
  return !!data;
}

/** Toggle upvote. Returns the new upvoted state. */
export async function toggleUpvote(
  kitId: string,
  userId: string
): Promise<boolean> {
  const already = await hasUpvoted(kitId, userId);
  if (already) {
    await supabase
      .from("layout_public_kit_upvote")
      .delete()
      .eq("kit_id", kitId)
      .eq("user_id", userId);
    return false;
  }
  await supabase
    .from("layout_public_kit_upvote")
    .insert({ kit_id: kitId, user_id: userId });
  return true;
}

// Round-trip check exposed for the test file. Keeping kitToRow and rowToKit
// in lock-step is load-bearing (see feedback_verify_db_roundtrip_before_shipping).
export { rowToKit, kitSummary };
