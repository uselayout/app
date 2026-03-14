import { supabase } from "./client";
import type {
  DesignToken,
  DesignTokenCategory,
  DesignTokenSource,
  DesignTokenType,
} from "@/lib/types/token";

// ─── Row Types ────────────────────────────────────────────────────────────────

interface TokenRow {
  id: string;
  org_id: string;
  project_id: string | null;
  name: string;
  slug: string;
  css_variable: string | null;
  type: string;
  category: string;
  value: string;
  resolved_value: string | null;
  group_name: string | null;
  sort_order: number;
  description: string | null;
  source: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Row Mapper ───────────────────────────────────────────────────────────────

function rowToToken(row: TokenRow): DesignToken {
  return {
    id: row.id,
    orgId: row.org_id,
    projectId: row.project_id,
    name: row.name,
    slug: row.slug,
    cssVariable: row.css_variable,
    type: row.type as DesignTokenType,
    category: row.category as DesignTokenCategory,
    value: row.value,
    resolvedValue: row.resolved_value,
    groupName: row.group_name,
    sortOrder: row.sort_order,
    description: row.description,
    source: row.source as DesignTokenSource | null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function nameToTokenSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[/\s]+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

async function uniqueSlug(orgId: string, baseSlug: string): Promise<string> {
  const { data } = await supabase
    .from("layout_token")
    .select("slug")
    .eq("org_id", orgId)
    .eq("slug", baseSlug)
    .single();

  if (!data) return baseSlug;

  let suffix = 2;
  for (;;) {
    const candidate = `${baseSlug}-${suffix}`;
    const { data: existing } = await supabase
      .from("layout_token")
      .select("slug")
      .eq("org_id", orgId)
      .eq("slug", candidate)
      .single();

    if (!existing) return candidate;
    suffix++;
  }
}

// ─── Token CRUD ───────────────────────────────────────────────────────────────

export async function getTokensByOrg(
  orgId: string,
  filters?: {
    type?: DesignTokenType;
    category?: DesignTokenCategory;
    groupName?: string;
    search?: string;
  }
): Promise<DesignToken[]> {
  let query = supabase
    .from("layout_token")
    .select("*")
    .eq("org_id", orgId)
    .order("type", { ascending: true })
    .order("group_name", { ascending: true })
    .order("sort_order", { ascending: true });

  if (filters?.type) {
    query = query.eq("type", filters.type);
  }
  if (filters?.category) {
    query = query.eq("category", filters.category);
  }
  if (filters?.groupName) {
    query = query.eq("group_name", filters.groupName);
  }
  if (filters?.search) {
    query = query.ilike("name", `%${filters.search}%`);
  }

  const { data, error } = await query;

  if (error || !data) return [];
  return (data as TokenRow[]).map(rowToToken);
}

export async function getTokenById(id: string): Promise<DesignToken | null> {
  const { data, error } = await supabase
    .from("layout_token")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return rowToToken(data as TokenRow);
}

export async function createToken(data: {
  orgId: string;
  name: string;
  type: DesignTokenType;
  value: string;
  category?: DesignTokenCategory;
  cssVariable?: string;
  groupName?: string;
  sortOrder?: number;
  description?: string;
  source?: DesignTokenSource;
  projectId?: string;
}): Promise<DesignToken | null> {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const baseSlug = nameToTokenSlug(data.name);
  const slug = await uniqueSlug(data.orgId, baseSlug);

  const { error } = await supabase.from("layout_token").insert({
    id,
    org_id: data.orgId,
    project_id: data.projectId ?? null,
    name: data.name,
    slug,
    css_variable: data.cssVariable ?? null,
    type: data.type,
    category: data.category ?? "primitive",
    value: data.value,
    resolved_value: null,
    group_name: data.groupName ?? null,
    sort_order: data.sortOrder ?? 0,
    description: data.description ?? null,
    source: data.source ?? null,
    created_at: now,
    updated_at: now,
  });

  if (error) {
    console.error("Failed to create token:", error.message);
    return null;
  }

  return getTokenById(id);
}

export async function updateToken(
  id: string,
  updates: {
    name?: string;
    slug?: string;
    cssVariable?: string;
    type?: DesignTokenType;
    category?: DesignTokenCategory;
    value?: string;
    resolvedValue?: string;
    groupName?: string;
    sortOrder?: number;
    description?: string;
    source?: DesignTokenSource;
    projectId?: string;
  }
): Promise<void> {
  const row: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.name !== undefined) row.name = updates.name;
  if (updates.slug !== undefined) row.slug = updates.slug;
  if (updates.cssVariable !== undefined) row.css_variable = updates.cssVariable;
  if (updates.type !== undefined) row.type = updates.type;
  if (updates.category !== undefined) row.category = updates.category;
  if (updates.value !== undefined) row.value = updates.value;
  if (updates.resolvedValue !== undefined) row.resolved_value = updates.resolvedValue;
  if (updates.groupName !== undefined) row.group_name = updates.groupName;
  if (updates.sortOrder !== undefined) row.sort_order = updates.sortOrder;
  if (updates.description !== undefined) row.description = updates.description;
  if (updates.source !== undefined) row.source = updates.source;
  if (updates.projectId !== undefined) row.project_id = updates.projectId;

  const { error } = await supabase
    .from("layout_token")
    .update(row)
    .eq("id", id);

  if (error) {
    console.error("Failed to update token:", error.message);
  }
}

export async function deleteToken(id: string): Promise<void> {
  const { error } = await supabase
    .from("layout_token")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Failed to delete token:", error.message);
  }
}

export async function bulkCreateTokens(
  orgId: string,
  tokens: Array<{
    name: string;
    type: DesignTokenType;
    value: string;
    category?: DesignTokenCategory;
    cssVariable?: string;
    groupName?: string;
    sortOrder?: number;
    description?: string;
    source?: DesignTokenSource;
    projectId?: string;
  }>
): Promise<number> {
  if (tokens.length === 0) return 0;

  const now = new Date().toISOString();

  // Generate unique slugs for all tokens
  const slugMap = new Map<string, number>();
  const rows = [];

  for (const token of tokens) {
    let baseSlug = nameToTokenSlug(token.name);

    // Track local duplicates within this batch
    const count = slugMap.get(baseSlug) ?? 0;
    if (count > 0) {
      baseSlug = `${baseSlug}-${count + 1}`;
    }
    slugMap.set(nameToTokenSlug(token.name), count + 1);

    const slug = await uniqueSlug(orgId, baseSlug);

    rows.push({
      id: crypto.randomUUID(),
      org_id: orgId,
      project_id: token.projectId ?? null,
      name: token.name,
      slug,
      css_variable: token.cssVariable ?? null,
      type: token.type,
      category: token.category ?? "primitive",
      value: token.value,
      resolved_value: null,
      group_name: token.groupName ?? null,
      sort_order: token.sortOrder ?? 0,
      description: token.description ?? null,
      source: token.source ?? null,
      created_at: now,
      updated_at: now,
    });
  }

  const { error } = await supabase.from("layout_token").insert(rows);

  if (error) {
    console.error("Failed to bulk create tokens:", error.message);
    return 0;
  }

  return rows.length;
}

export async function getTokenGroups(
  orgId: string,
  type: DesignTokenType
): Promise<string[]> {
  const { data, error } = await supabase
    .from("layout_token")
    .select("group_name")
    .eq("org_id", orgId)
    .eq("type", type);

  if (error || !data) return [];

  const groups = [
    ...new Set(
      (data as Array<{ group_name: string | null }>)
        .map((r) => r.group_name)
        .filter((g): g is string => g !== null)
    ),
  ];

  return groups.sort();
}
