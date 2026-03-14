import { supabase } from "./client";
import type {
  Component,
  ComponentProp,
  ComponentSource,
  ComponentState,
  ComponentStatus,
  ComponentVariant,
  ComponentVersion,
} from "@/lib/types/component";

// ─── Row Types ────────────────────────────────────────────────────────────────

interface ComponentRow {
  id: string;
  org_id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  tags: string[];
  code: string;
  compiled_js: string | null;
  props: unknown;
  variants: unknown;
  states: unknown;
  tokens_used: string[];
  status: string;
  version: number;
  created_by: string | null;
  source: string | null;
  created_at: string;
  updated_at: string;
}

interface ComponentVersionRow {
  id: string;
  component_id: string;
  version: number;
  code: string;
  props: unknown;
  variants: unknown;
  states: unknown;
  changed_by: string | null;
  change_summary: string | null;
  created_at: string;
}

// ─── Row Mappers ──────────────────────────────────────────────────────────────

function rowToComponent(row: ComponentRow): Component {
  return {
    id: row.id,
    orgId: row.org_id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    category: row.category,
    tags: row.tags,
    code: row.code,
    compiledJs: row.compiled_js,
    props: (row.props ?? []) as ComponentProp[],
    variants: (row.variants ?? []) as ComponentVariant[],
    states: (row.states ?? []) as ComponentState[],
    tokensUsed: row.tokens_used,
    status: row.status as ComponentStatus,
    version: row.version,
    createdBy: row.created_by,
    source: row.source as ComponentSource | null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToVersion(row: ComponentVersionRow): ComponentVersion {
  return {
    id: row.id,
    componentId: row.component_id,
    version: row.version,
    code: row.code,
    props: (row.props ?? []) as ComponentProp[],
    variants: (row.variants ?? []) as ComponentVariant[],
    states: (row.states ?? []) as ComponentState[],
    changedBy: row.changed_by,
    changeSummary: row.change_summary,
    createdAt: row.created_at,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function nameToComponentSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

export function extractTokensUsed(code: string): string[] {
  const matches = code.match(/var\(--([^)]+)\)/g) ?? [];
  return [
    ...new Set(
      matches.map((m) => m.replace(/var\(/, "").replace(/\)/, ""))
    ),
  ];
}

// ─── Component CRUD ───────────────────────────────────────────────────────────

export async function getComponent(id: string): Promise<Component | null> {
  const { data, error } = await supabase
    .from("layout_component")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return rowToComponent(data as ComponentRow);
}

export async function getComponentBySlug(
  orgId: string,
  slug: string
): Promise<Component | null> {
  const { data, error } = await supabase
    .from("layout_component")
    .select("*")
    .eq("org_id", orgId)
    .eq("slug", slug)
    .single();

  if (error || !data) return null;
  return rowToComponent(data as ComponentRow);
}

export async function getComponentsByOrg(
  orgId: string,
  opts?: { status?: ComponentStatus; category?: string; search?: string }
): Promise<Component[]> {
  let query = supabase
    .from("layout_component")
    .select("*")
    .eq("org_id", orgId)
    .order("name", { ascending: true });

  if (opts?.status) {
    query = query.eq("status", opts.status);
  }
  if (opts?.category) {
    query = query.eq("category", opts.category);
  }
  if (opts?.search) {
    query = query.ilike("name", `%${opts.search}%`);
  }

  const { data, error } = await query;

  if (error || !data) return [];
  return (data as ComponentRow[]).map(rowToComponent);
}

export async function createComponent(data: {
  orgId: string;
  name: string;
  slug: string;
  code: string;
  compiledJs?: string;
  description?: string;
  category?: string;
  tags?: string[];
  props?: ComponentProp[];
  variants?: ComponentVariant[];
  states?: ComponentState[];
  source?: ComponentSource;
  createdBy?: string;
}): Promise<Component | null> {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const tokensUsed = extractTokensUsed(data.code);

  const { error: insertError } = await supabase
    .from("layout_component")
    .insert({
      id,
      org_id: data.orgId,
      name: data.name,
      slug: data.slug,
      description: data.description ?? null,
      category: data.category ?? "uncategorised",
      tags: data.tags ?? [],
      code: data.code,
      compiled_js: data.compiledJs ?? null,
      props: data.props ?? [],
      variants: data.variants ?? [],
      states: data.states ?? [],
      tokens_used: tokensUsed,
      status: "draft",
      version: 1,
      created_by: data.createdBy ?? null,
      source: data.source ?? null,
      created_at: now,
      updated_at: now,
    });

  if (insertError) {
    console.error("Failed to create component:", insertError.message);
    return null;
  }

  // Insert version 1
  const { error: versionError } = await supabase
    .from("layout_component_version")
    .insert({
      id: crypto.randomUUID(),
      component_id: id,
      version: 1,
      code: data.code,
      props: data.props ?? [],
      variants: data.variants ?? [],
      states: data.states ?? [],
      changed_by: data.createdBy ?? null,
      change_summary: "Initial version",
      created_at: now,
    });

  if (versionError) {
    console.error("Failed to create component version:", versionError.message);
  }

  return getComponent(id);
}

export async function updateComponent(
  id: string,
  updates: {
    name?: string;
    slug?: string;
    description?: string;
    category?: string;
    tags?: string[];
    status?: ComponentStatus;
    props?: ComponentProp[];
    variants?: ComponentVariant[];
    states?: ComponentState[];
  }
): Promise<void> {
  const row: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.name !== undefined) row.name = updates.name;
  if (updates.slug !== undefined) row.slug = updates.slug;
  if (updates.description !== undefined) row.description = updates.description;
  if (updates.category !== undefined) row.category = updates.category;
  if (updates.tags !== undefined) row.tags = updates.tags;
  if (updates.status !== undefined) row.status = updates.status;
  if (updates.props !== undefined) row.props = updates.props;
  if (updates.variants !== undefined) row.variants = updates.variants;
  if (updates.states !== undefined) row.states = updates.states;

  const { error } = await supabase
    .from("layout_component")
    .update(row)
    .eq("id", id);

  if (error) {
    console.error("Failed to update component:", error.message);
  }
}

export async function updateComponentCode(
  id: string,
  code: string,
  compiledJs: string | null,
  changedBy: string | null,
  changeSummary: string | null
): Promise<void> {
  const existing = await getComponent(id);
  if (!existing) return;

  const newVersion = existing.version + 1;
  const tokensUsed = extractTokensUsed(code);
  const now = new Date().toISOString();

  const { error: updateError } = await supabase
    .from("layout_component")
    .update({
      code,
      compiled_js: compiledJs,
      tokens_used: tokensUsed,
      version: newVersion,
      updated_at: now,
    })
    .eq("id", id);

  if (updateError) {
    console.error("Failed to update component code:", updateError.message);
    return;
  }

  const { error: versionError } = await supabase
    .from("layout_component_version")
    .insert({
      id: crypto.randomUUID(),
      component_id: id,
      version: newVersion,
      code,
      props: existing.props,
      variants: existing.variants,
      states: existing.states,
      changed_by: changedBy,
      change_summary: changeSummary,
      created_at: now,
    });

  if (versionError) {
    console.error("Failed to create component version:", versionError.message);
  }
}

export async function deleteComponent(id: string): Promise<void> {
  // Delete versions first (if no cascade)
  await supabase
    .from("layout_component_version")
    .delete()
    .eq("component_id", id);

  const { error } = await supabase
    .from("layout_component")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Failed to delete component:", error.message);
  }
}

// ─── Version Queries ──────────────────────────────────────────────────────────

export async function getComponentVersions(
  componentId: string
): Promise<ComponentVersion[]> {
  const { data, error } = await supabase
    .from("layout_component_version")
    .select("*")
    .eq("component_id", componentId)
    .order("version", { ascending: false });

  if (error || !data) return [];
  return (data as ComponentVersionRow[]).map(rowToVersion);
}

export async function getComponentVersion(
  componentId: string,
  version: number
): Promise<ComponentVersion | null> {
  const { data, error } = await supabase
    .from("layout_component_version")
    .select("*")
    .eq("component_id", componentId)
    .eq("version", version)
    .single();

  if (error || !data) return null;
  return rowToVersion(data as ComponentVersionRow);
}

// ─── Categories ───────────────────────────────────────────────────────────────

export async function getComponentCategories(
  orgId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from("layout_component")
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
