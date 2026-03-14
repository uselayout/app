import { supabase } from "./client";
import type { Template } from "@/lib/types/template";

// ─── Row Types ────────────────────────────────────────────────────────────────

interface TemplateRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  long_description: string | null;
  source_org_id: string;
  preview_image: string | null;
  category: string;
  tags: string[];
  token_count: number;
  component_count: number;
  typeface_count: number;
  icon_count: number;
  fork_count: number;
  is_free: boolean;
  price_cents: number;
  is_published: boolean;
  published_at: string | null;
  featured: boolean;
  author_name: string | null;
  author_url: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Row Mapper ───────────────────────────────────────────────────────────────

function rowToTemplate(row: TemplateRow): Template {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    longDescription: row.long_description,
    sourceOrgId: row.source_org_id,
    previewImage: row.preview_image,
    category: row.category,
    tags: row.tags ?? [],
    tokenCount: row.token_count,
    componentCount: row.component_count,
    typefaceCount: row.typeface_count,
    iconCount: row.icon_count,
    forkCount: row.fork_count,
    isFree: row.is_free,
    priceCents: row.price_cents,
    isPublished: row.is_published,
    publishedAt: row.published_at,
    featured: row.featured,
    authorName: row.author_name,
    authorUrl: row.author_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ─── Template CRUD ────────────────────────────────────────────────────────────

export async function getPublishedTemplates(filters?: {
  category?: string;
  search?: string;
  featured?: boolean;
}): Promise<Template[]> {
  let query = supabase
    .from("layout_template")
    .select("*")
    .eq("is_published", true)
    .order("featured", { ascending: false })
    .order("fork_count", { ascending: false });

  if (filters?.category) {
    query = query.eq("category", filters.category);
  }
  if (filters?.search) {
    query = query.ilike("name", `%${filters.search}%`);
  }
  if (filters?.featured !== undefined) {
    query = query.eq("featured", filters.featured);
  }

  const { data, error } = await query;

  if (error || !data) return [];
  return (data as TemplateRow[]).map(rowToTemplate);
}

export async function getTemplateBySlug(
  slug: string
): Promise<Template | null> {
  const { data, error } = await supabase
    .from("layout_template")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (error || !data) return null;
  return rowToTemplate(data as TemplateRow);
}

export async function getTemplateById(id: string): Promise<Template | null> {
  const { data, error } = await supabase
    .from("layout_template")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return rowToTemplate(data as TemplateRow);
}

export async function getTemplatesByOrg(orgId: string): Promise<Template[]> {
  const { data, error } = await supabase
    .from("layout_template")
    .select("*")
    .eq("source_org_id", orgId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as TemplateRow[]).map(rowToTemplate);
}

export async function createTemplate(data: {
  name: string;
  slug: string;
  description?: string;
  longDescription?: string;
  sourceOrgId: string;
  previewImage?: string;
  category?: string;
  tags?: string[];
  isFree?: boolean;
  priceCents?: number;
  authorName?: string;
  authorUrl?: string;
}): Promise<Template | null> {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  const { error } = await supabase.from("layout_template").insert({
    id,
    name: data.name,
    slug: data.slug,
    description: data.description ?? null,
    long_description: data.longDescription ?? null,
    source_org_id: data.sourceOrgId,
    preview_image: data.previewImage ?? null,
    category: data.category ?? "general",
    tags: data.tags ?? [],
    is_free: data.isFree ?? true,
    price_cents: data.priceCents ?? 0,
    author_name: data.authorName ?? null,
    author_url: data.authorUrl ?? null,
    created_at: now,
    updated_at: now,
  });

  if (error) {
    console.error("Failed to create template:", error.message);
    return null;
  }

  return getTemplateById(id);
}

export async function updateTemplate(
  id: string,
  updates: {
    name?: string;
    slug?: string;
    description?: string;
    longDescription?: string;
    previewImage?: string;
    category?: string;
    tags?: string[];
    isFree?: boolean;
    priceCents?: number;
    featured?: boolean;
    authorName?: string;
    authorUrl?: string;
  }
): Promise<void> {
  const row: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.name !== undefined) row.name = updates.name;
  if (updates.slug !== undefined) row.slug = updates.slug;
  if (updates.description !== undefined) row.description = updates.description;
  if (updates.longDescription !== undefined)
    row.long_description = updates.longDescription;
  if (updates.previewImage !== undefined)
    row.preview_image = updates.previewImage;
  if (updates.category !== undefined) row.category = updates.category;
  if (updates.tags !== undefined) row.tags = updates.tags;
  if (updates.isFree !== undefined) row.is_free = updates.isFree;
  if (updates.priceCents !== undefined) row.price_cents = updates.priceCents;
  if (updates.featured !== undefined) row.featured = updates.featured;
  if (updates.authorName !== undefined) row.author_name = updates.authorName;
  if (updates.authorUrl !== undefined) row.author_url = updates.authorUrl;

  const { error } = await supabase
    .from("layout_template")
    .update(row)
    .eq("id", id);

  if (error) {
    console.error("Failed to update template:", error.message);
  }
}

export async function deleteTemplate(id: string): Promise<void> {
  const { error } = await supabase
    .from("layout_template")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Failed to delete template:", error.message);
  }
}

export async function publishTemplate(id: string): Promise<void> {
  const { error } = await supabase
    .from("layout_template")
    .update({
      is_published: true,
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("Failed to publish template:", error.message);
  }
}

export async function unpublishTemplate(id: string): Promise<void> {
  const { error } = await supabase
    .from("layout_template")
    .update({
      is_published: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("Failed to unpublish template:", error.message);
  }
}

export async function incrementForkCount(id: string): Promise<void> {
  // Use SQL expression to atomically increment, avoiding TOCTOU race
  const { error } = await supabase.rpc("increment_template_fork_count" as never, {
    template_id: id,
  });

  // Fallback if RPC not available (migration not run yet)
  if (error) {
    const { error: fallbackError } = await supabase
      .from("layout_template")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", id);

    if (fallbackError) {
      console.error("Failed to increment fork count:", fallbackError.message);
    }
  }
}

export async function updateTemplateCounts(
  id: string,
  sourceOrgId: string
): Promise<void> {
  // Count tokens
  const { count: tokenCount } = await supabase
    .from("layout_token")
    .select("*", { count: "exact", head: true })
    .eq("org_id", sourceOrgId);

  // Count components (approved only)
  const { count: componentCount } = await supabase
    .from("layout_component")
    .select("*", { count: "exact", head: true })
    .eq("org_id", sourceOrgId)
    .eq("status", "approved");

  // Count typefaces
  const { count: typefaceCount } = await supabase
    .from("layout_typeface")
    .select("*", { count: "exact", head: true })
    .eq("org_id", sourceOrgId);

  // Count icons
  const { count: iconCount } = await supabase
    .from("layout_icon")
    .select("*", { count: "exact", head: true })
    .eq("org_id", sourceOrgId);

  const { error } = await supabase
    .from("layout_template")
    .update({
      token_count: tokenCount ?? 0,
      component_count: componentCount ?? 0,
      typeface_count: typefaceCount ?? 0,
      icon_count: iconCount ?? 0,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("Failed to update template counts:", error.message);
  }
}
