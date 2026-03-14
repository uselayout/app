import { supabase } from "./client";
import type { DesignIcon, IconSource } from "@/lib/types/icon";

// ─── Row Types ────────────────────────────────────────────────────────────────

interface IconRow {
  id: string;
  org_id: string;
  name: string;
  slug: string;
  category: string;
  tags: string[];
  svg: string;
  viewbox: string;
  sizes: number[];
  stroke_width: number;
  source: string | null;
  library_name: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Row Mapper ───────────────────────────────────────────────────────────────

function rowToIcon(row: IconRow): DesignIcon {
  return {
    id: row.id,
    orgId: row.org_id,
    name: row.name,
    slug: row.slug,
    category: row.category,
    tags: row.tags ?? [],
    svg: row.svg,
    viewbox: row.viewbox,
    sizes: Array.isArray(row.sizes) ? row.sizes : [24],
    strokeWidth: Number(row.stroke_width) || 2,
    source: row.source as IconSource | null,
    libraryName: row.library_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function nameToIconSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

async function getIconBySlug(
  orgId: string,
  slug: string
): Promise<DesignIcon | null> {
  const { data, error } = await supabase
    .from("layout_icon")
    .select("*")
    .eq("org_id", orgId)
    .eq("slug", slug)
    .single();

  if (error || !data) return null;
  return rowToIcon(data as IconRow);
}

export async function resolveUniqueSlug(
  orgId: string,
  baseSlug: string
): Promise<string> {
  const existing = await getIconBySlug(orgId, baseSlug);
  if (!existing) return baseSlug;

  let suffix = 2;
  while (await getIconBySlug(orgId, `${baseSlug}-${suffix}`)) {
    suffix++;
  }
  return `${baseSlug}-${suffix}`;
}

// ─── Icon CRUD ────────────────────────────────────────────────────────────────

export async function getIconsByOrg(
  orgId: string,
  filters?: { category?: string; search?: string }
): Promise<DesignIcon[]> {
  let query = supabase
    .from("layout_icon")
    .select("*")
    .eq("org_id", orgId)
    .order("category", { ascending: true })
    .order("name", { ascending: true });

  if (filters?.category) {
    query = query.eq("category", filters.category);
  }
  if (filters?.search) {
    query = query.ilike("name", `%${filters.search}%`);
  }

  const { data, error } = await query;

  if (error || !data) return [];
  return (data as IconRow[]).map(rowToIcon);
}

export async function getIconById(id: string): Promise<DesignIcon | null> {
  const { data, error } = await supabase
    .from("layout_icon")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return rowToIcon(data as IconRow);
}

export async function createIcon(data: {
  orgId: string;
  name: string;
  svg: string;
  viewbox?: string;
  category?: string;
  tags?: string[];
  sizes?: number[];
  strokeWidth?: number;
  source?: IconSource;
  libraryName?: string;
}): Promise<DesignIcon | null> {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const slug = await resolveUniqueSlug(data.orgId, nameToIconSlug(data.name));

  const { error: insertError } = await supabase.from("layout_icon").insert({
    id,
    org_id: data.orgId,
    name: data.name,
    slug,
    category: data.category ?? "general",
    tags: data.tags ?? [],
    svg: data.svg,
    viewbox: data.viewbox ?? "0 0 24 24",
    sizes: data.sizes ?? [24],
    stroke_width: data.strokeWidth ?? 2,
    source: data.source ?? null,
    library_name: data.libraryName ?? null,
    created_at: now,
    updated_at: now,
  });

  if (insertError) {
    console.error("Failed to create icon:", insertError.message);
    return null;
  }

  return getIconById(id);
}

export async function updateIcon(
  id: string,
  updates: {
    name?: string;
    category?: string;
    tags?: string[];
    svg?: string;
    viewbox?: string;
    sizes?: number[];
    strokeWidth?: number;
  }
): Promise<void> {
  const row: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.name !== undefined) row.name = updates.name;
  if (updates.category !== undefined) row.category = updates.category;
  if (updates.tags !== undefined) row.tags = updates.tags;
  if (updates.svg !== undefined) row.svg = updates.svg;
  if (updates.viewbox !== undefined) row.viewbox = updates.viewbox;
  if (updates.sizes !== undefined) row.sizes = updates.sizes;
  if (updates.strokeWidth !== undefined) row.stroke_width = updates.strokeWidth;

  const { error } = await supabase
    .from("layout_icon")
    .update(row)
    .eq("id", id);

  if (error) {
    console.error("Failed to update icon:", error.message);
  }
}

export async function deleteIcon(id: string): Promise<void> {
  const { error } = await supabase
    .from("layout_icon")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Failed to delete icon:", error.message);
  }
}

export async function bulkCreateIcons(
  orgId: string,
  icons: Array<{
    name: string;
    svg: string;
    viewbox?: string;
    category?: string;
    tags?: string[];
    sizes?: number[];
    strokeWidth?: number;
    source?: IconSource;
    libraryName?: string;
  }>
): Promise<DesignIcon[]> {
  const now = new Date().toISOString();
  const rows = [];

  for (const icon of icons) {
    const slug = await resolveUniqueSlug(orgId, nameToIconSlug(icon.name));
    rows.push({
      id: crypto.randomUUID(),
      org_id: orgId,
      name: icon.name,
      slug,
      category: icon.category ?? "general",
      tags: icon.tags ?? [],
      svg: icon.svg,
      viewbox: icon.viewbox ?? "0 0 24 24",
      sizes: icon.sizes ?? [24],
      stroke_width: icon.strokeWidth ?? 2,
      source: icon.source ?? null,
      library_name: icon.libraryName ?? null,
      created_at: now,
      updated_at: now,
    });
  }

  const { error } = await supabase.from("layout_icon").insert(rows);

  if (error) {
    console.error("Failed to bulk create icons:", error.message);
    return [];
  }

  return getIconsByOrg(orgId);
}

export async function getIconCategories(orgId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("layout_icon")
    .select("category")
    .eq("org_id", orgId);

  if (error || !data) return [];

  const categories = [
    ...new Set(
      (data as Array<{ category: string }>).map((r) => r.category)
    ),
  ];

  return categories.sort();
}
