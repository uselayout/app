import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { requireAdmin } from "@/lib/api/admin-context";
import { supabase } from "@/lib/supabase/client";
import { invalidateModelCache, invalidateTaskDefaultsCache, getAllTaskDefaults } from "@/lib/ai/models";

const ModelSchema = z.object({
  id: z.string().min(1).max(100),
  label: z.string().min(1).max(100),
  provider: z.enum(["claude", "gemini"]),
  maxOutputTokens: z.number().int().min(1).default(32000),
  creditCost: z.number().int().min(0).default(1),
  inputCostPerM: z.number().min(0).default(0),
  outputCostPerM: z.number().min(0).default(0),
  byokOnly: z.boolean().default(false),
  userSelectable: z.boolean().default(true),
  enabled: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
});

const UpdateSchema = ModelSchema.partial().extend({
  id: z.string().min(1),
});

/**
 * GET: List all models (admin) or user-selectable models (public).
 * Query param ?selectable=true returns only user-selectable enabled models.
 */
export async function GET(request: NextRequest) {
  const selectable = request.nextUrl.searchParams.get("selectable") === "true";

  if (selectable) {
    // Public endpoint: no admin check needed, returns user-selectable models
    const { data, error } = await supabase
      .from("layout_ai_models")
      .select("id, label, provider, credit_cost, byok_only, max_output_tokens")
      .eq("enabled", true)
      .eq("user_selectable", true)
      .order("sort_order", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const models = (data ?? []).map((row) => ({
      id: row.id,
      label: row.label,
      provider: row.provider,
      creditCost: row.credit_cost,
      byokOnly: row.byok_only,
      maxOutputTokens: row.max_output_tokens,
    }));

    return NextResponse.json({ models });
  }

  // Admin endpoint: return all models with full details
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const { data, error } = await supabase
    .from("layout_ai_models")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const models = (data ?? []).map((row) => ({
    id: row.id,
    label: row.label,
    provider: row.provider,
    maxOutputTokens: row.max_output_tokens,
    creditCost: row.credit_cost,
    inputCostPerM: Number(row.input_cost_per_m),
    outputCostPerM: Number(row.output_cost_per_m),
    byokOnly: row.byok_only,
    userSelectable: row.user_selectable,
    enabled: row.enabled,
    isDefault: row.is_default,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  // Also fetch cost stats from usage log
  const { data: costData } = await supabase
    .from("layout_usage_log")
    .select("model, cost_estimate_gbp, input_tokens, output_tokens, mode")
    .eq("mode", "hosted")
    .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  const costByModel: Record<string, { totalCost: number; totalInputTokens: number; totalOutputTokens: number; count: number }> = {};
  for (const row of costData ?? []) {
    const m = row.model ?? "unknown";
    if (!costByModel[m]) costByModel[m] = { totalCost: 0, totalInputTokens: 0, totalOutputTokens: 0, count: 0 };
    costByModel[m].totalCost += Number(row.cost_estimate_gbp ?? 0);
    costByModel[m].totalInputTokens += Number(row.input_tokens ?? 0);
    costByModel[m].totalOutputTokens += Number(row.output_tokens ?? 0);
    costByModel[m].count += 1;
  }

  // Fetch task defaults
  const taskDefaults = await getAllTaskDefaults();

  return NextResponse.json({ models, costByModel, taskDefaults });
}

/** POST: Add a new model */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = ModelSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", details: parsed.error.issues }, { status: 400 });
  }

  const m = parsed.data;

  // If setting as default, clear existing default
  if (m.isDefault) {
    await supabase
      .from("layout_ai_models")
      .update({ is_default: false, updated_at: new Date().toISOString() })
      .eq("is_default", true);
  }

  const { error } = await supabase.from("layout_ai_models").insert({
    id: m.id,
    label: m.label,
    provider: m.provider,
    max_output_tokens: m.maxOutputTokens,
    credit_cost: m.creditCost,
    input_cost_per_m: m.inputCostPerM,
    output_cost_per_m: m.outputCostPerM,
    byok_only: m.byokOnly,
    user_selectable: m.userSelectable,
    enabled: m.enabled,
    is_default: m.isDefault,
    sort_order: m.sortOrder,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  invalidateModelCache();
  return NextResponse.json({ message: `Model ${m.id} added successfully` }, { status: 201 });
}

/** PUT: Update an existing model */
export async function PUT(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", details: parsed.error.issues }, { status: 400 });
  }

  const { id, ...fields } = parsed.data;

  // If setting as default, clear existing default first
  if (fields.isDefault) {
    await supabase
      .from("layout_ai_models")
      .update({ is_default: false, updated_at: new Date().toISOString() })
      .neq("id", id);
  }

  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (fields.label !== undefined) updateData.label = fields.label;
  if (fields.provider !== undefined) updateData.provider = fields.provider;
  if (fields.maxOutputTokens !== undefined) updateData.max_output_tokens = fields.maxOutputTokens;
  if (fields.creditCost !== undefined) updateData.credit_cost = fields.creditCost;
  if (fields.inputCostPerM !== undefined) updateData.input_cost_per_m = fields.inputCostPerM;
  if (fields.outputCostPerM !== undefined) updateData.output_cost_per_m = fields.outputCostPerM;
  if (fields.byokOnly !== undefined) updateData.byok_only = fields.byokOnly;
  if (fields.userSelectable !== undefined) updateData.user_selectable = fields.userSelectable;
  if (fields.enabled !== undefined) updateData.enabled = fields.enabled;
  if (fields.isDefault !== undefined) updateData.is_default = fields.isDefault;
  if (fields.sortOrder !== undefined) updateData.sort_order = fields.sortOrder;

  const { error } = await supabase
    .from("layout_ai_models")
    .update(updateData)
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  invalidateModelCache();
  return NextResponse.json({ message: `Model ${id} updated` });
}

/** DELETE: Remove a model */
export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id parameter is required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("layout_ai_models")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  invalidateModelCache();
  return NextResponse.json({ message: `Model ${id} deleted` });
}

/** PATCH: Update task defaults */
export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const schema = z.object({
    task: z.string().min(1),
    modelId: z.string().min(1),
  });

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const { task, modelId } = parsed.data;

  const { error } = await supabase
    .from("layout_ai_task_defaults")
    .upsert(
      { task, model_id: modelId, updated_at: new Date().toISOString() },
      { onConflict: "task" }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  invalidateTaskDefaultsCache();
  return NextResponse.json({ message: `Task "${task}" now uses ${modelId}` });
}
