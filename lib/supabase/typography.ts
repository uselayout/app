import { supabase } from "./client";
import type {
  Typeface,
  TypefaceRole,
  TypefaceSource,
  TypeScale,
} from "@/lib/types/typography";

// ─── Row Types ────────────────────────────────────────────────────────────────

interface TypefaceRow {
  id: string;
  org_id: string;
  family: string;
  source: string | null;
  google_fonts_url: string | null;
  weights: string[];
  role: string | null;
  created_at: string;
  updated_at: string;
}

interface TypeScaleRow {
  id: string;
  org_id: string;
  typeface_id: string;
  name: string;
  slug: string;
  font_size: string;
  font_weight: string;
  line_height: string;
  letter_spacing: string;
  text_transform: string | null;
  sort_order: number;
}

// ─── Row Mappers ──────────────────────────────────────────────────────────────

function rowToTypeface(row: TypefaceRow): Typeface {
  return {
    id: row.id,
    orgId: row.org_id,
    family: row.family,
    source: row.source as TypefaceSource | null,
    googleFontsUrl: row.google_fonts_url,
    weights: row.weights ?? [],
    role: row.role as TypefaceRole | null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToTypeScale(row: TypeScaleRow): TypeScale {
  return {
    id: row.id,
    orgId: row.org_id,
    typefaceId: row.typeface_id,
    name: row.name,
    slug: row.slug,
    fontSize: row.font_size,
    fontWeight: row.font_weight,
    lineHeight: row.line_height,
    letterSpacing: row.letter_spacing ?? "0",
    textTransform: row.text_transform,
    sortOrder: row.sort_order,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function nameToTypographySlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[/\s]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 48);
}

// ─── Typeface CRUD ────────────────────────────────────────────────────────────

export async function getTypefacesByOrg(orgId: string): Promise<Typeface[]> {
  const { data, error } = await supabase
    .from("layout_typeface")
    .select("*")
    .eq("org_id", orgId)
    .order("role", { ascending: true })
    .order("family", { ascending: true });

  if (error || !data) return [];
  return (data as TypefaceRow[]).map(rowToTypeface);
}

export async function getTypefaceById(id: string): Promise<Typeface | null> {
  const { data, error } = await supabase
    .from("layout_typeface")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return rowToTypeface(data as TypefaceRow);
}

export async function createTypeface(data: {
  orgId: string;
  family: string;
  source?: TypefaceSource;
  googleFontsUrl?: string;
  weights?: string[];
  role?: TypefaceRole;
}): Promise<Typeface | null> {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  const { error } = await supabase.from("layout_typeface").insert({
    id,
    org_id: data.orgId,
    family: data.family,
    source: data.source ?? null,
    google_fonts_url: data.googleFontsUrl ?? null,
    weights: data.weights ?? [],
    role: data.role ?? null,
    created_at: now,
    updated_at: now,
  });

  if (error) {
    console.error("Failed to create typeface:", error.message);
    return null;
  }

  return getTypefaceById(id);
}

export async function updateTypeface(
  id: string,
  updates: {
    family?: string;
    source?: TypefaceSource;
    googleFontsUrl?: string | null;
    weights?: string[];
    role?: TypefaceRole | null;
  }
): Promise<void> {
  const row: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.family !== undefined) row.family = updates.family;
  if (updates.source !== undefined) row.source = updates.source;
  if (updates.googleFontsUrl !== undefined)
    row.google_fonts_url = updates.googleFontsUrl;
  if (updates.weights !== undefined) row.weights = updates.weights;
  if (updates.role !== undefined) row.role = updates.role;

  const { error } = await supabase
    .from("layout_typeface")
    .update(row)
    .eq("id", id);

  if (error) {
    console.error("Failed to update typeface:", error.message);
  }
}

export async function deleteTypeface(id: string): Promise<void> {
  const { error } = await supabase
    .from("layout_typeface")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Failed to delete typeface:", error.message);
  }
}

// ─── Type Scale CRUD ──────────────────────────────────────────────────────────

export async function getTypeScaleByOrg(orgId: string): Promise<TypeScale[]> {
  const { data, error } = await supabase
    .from("layout_type_scale")
    .select("*")
    .eq("org_id", orgId)
    .order("sort_order", { ascending: true });

  if (error || !data) return [];
  return (data as TypeScaleRow[]).map(rowToTypeScale);
}

export async function getTypeScaleByTypeface(
  typefaceId: string
): Promise<TypeScale[]> {
  const { data, error } = await supabase
    .from("layout_type_scale")
    .select("*")
    .eq("typeface_id", typefaceId)
    .order("sort_order", { ascending: true });

  if (error || !data) return [];
  return (data as TypeScaleRow[]).map(rowToTypeScale);
}

export async function getTypeScaleEntryById(
  id: string
): Promise<TypeScale | null> {
  const { data, error } = await supabase
    .from("layout_type_scale")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return rowToTypeScale(data as TypeScaleRow);
}

export async function createTypeScaleEntry(data: {
  orgId: string;
  typefaceId: string;
  name: string;
  fontSize: string;
  fontWeight: string;
  lineHeight: string;
  letterSpacing?: string;
  textTransform?: string;
  sortOrder?: number;
}): Promise<TypeScale | null> {
  const id = crypto.randomUUID();
  const slug = nameToTypographySlug(data.name);

  const { error } = await supabase.from("layout_type_scale").insert({
    id,
    org_id: data.orgId,
    typeface_id: data.typefaceId,
    name: data.name,
    slug,
    font_size: data.fontSize,
    font_weight: data.fontWeight,
    line_height: data.lineHeight,
    letter_spacing: data.letterSpacing ?? "0",
    text_transform: data.textTransform ?? null,
    sort_order: data.sortOrder ?? 0,
  });

  if (error) {
    console.error("Failed to create type scale entry:", error.message);
    return null;
  }

  return getTypeScaleEntryById(id);
}

export async function updateTypeScaleEntry(
  id: string,
  updates: {
    name?: string;
    fontSize?: string;
    fontWeight?: string;
    lineHeight?: string;
    letterSpacing?: string;
    textTransform?: string | null;
    sortOrder?: number;
  }
): Promise<void> {
  const row: Record<string, unknown> = {};

  if (updates.name !== undefined) {
    row.name = updates.name;
    row.slug = nameToTypographySlug(updates.name);
  }
  if (updates.fontSize !== undefined) row.font_size = updates.fontSize;
  if (updates.fontWeight !== undefined) row.font_weight = updates.fontWeight;
  if (updates.lineHeight !== undefined) row.line_height = updates.lineHeight;
  if (updates.letterSpacing !== undefined)
    row.letter_spacing = updates.letterSpacing;
  if (updates.textTransform !== undefined)
    row.text_transform = updates.textTransform;
  if (updates.sortOrder !== undefined) row.sort_order = updates.sortOrder;

  const { error } = await supabase
    .from("layout_type_scale")
    .update(row)
    .eq("id", id);

  if (error) {
    console.error("Failed to update type scale entry:", error.message);
  }
}

export async function deleteTypeScaleEntry(id: string): Promise<void> {
  const { error } = await supabase
    .from("layout_type_scale")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Failed to delete type scale entry:", error.message);
  }
}
