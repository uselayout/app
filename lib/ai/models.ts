/**
 * DB-driven AI model registry with in-memory caching.
 *
 * Models are stored in the `layout_ai_models` Supabase table and managed
 * from the admin panel. A 60-second cache avoids hitting the DB on every
 * API request. Falls back to hardcoded defaults if the DB is unreachable.
 */

import { supabase } from "@/lib/supabase/client";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AiModel {
  id: string;
  label: string;
  provider: "claude" | "gemini";
  maxOutputTokens: number;
  creditCost: number;
  inputCostPerM: number;
  outputCostPerM: number;
  byokOnly: boolean;
  userSelectable: boolean;
  enabled: boolean;
  isDefault: boolean;
  sortOrder: number;
}

interface AiModelRow {
  id: string;
  label: string;
  provider: string;
  max_output_tokens: number;
  credit_cost: number;
  input_cost_per_m: number;
  output_cost_per_m: number;
  byok_only: boolean;
  user_selectable: boolean;
  enabled: boolean;
  is_default: boolean;
  sort_order: number;
}

// ─── Hardcoded fallbacks ─────────────────────────────────────────────────────

const FALLBACK_MODELS: AiModel[] = [
  {
    id: "claude-sonnet-4-6",
    label: "Claude Sonnet 4.6",
    provider: "claude",
    maxOutputTokens: 64_000,
    creditCost: 1,
    inputCostPerM: 3.0,
    outputCostPerM: 15.0,
    byokOnly: false,
    userSelectable: true,
    enabled: true,
    isDefault: true,
    sortOrder: 0,
  },
  {
    id: "claude-opus-4-7",
    label: "Claude Opus 4.7",
    provider: "claude",
    maxOutputTokens: 32_000,
    creditCost: 5,
    inputCostPerM: 15.0,
    outputCostPerM: 75.0,
    byokOnly: false,
    userSelectable: true,
    enabled: true,
    isDefault: false,
    sortOrder: 1,
  },
  {
    id: "claude-haiku-4-5-20251001",
    label: "Claude Haiku 4.5",
    provider: "claude",
    maxOutputTokens: 8192,
    creditCost: 1,
    inputCostPerM: 0.8,
    outputCostPerM: 4.0,
    byokOnly: false,
    userSelectable: false,
    enabled: true,
    isDefault: false,
    sortOrder: 2,
  },
  {
    id: "gemini-3.1-pro-preview",
    label: "Gemini 3.1 Pro",
    provider: "gemini",
    maxOutputTokens: 65_536,
    creditCost: 0,
    inputCostPerM: 0,
    outputCostPerM: 0,
    byokOnly: true,
    userSelectable: true,
    enabled: true,
    isDefault: false,
    sortOrder: 3,
  },
];

// ─── Cache ───────────────────────────────────────────────────────────────────

const CACHE_TTL_MS = 60_000;
let cachedModels: AiModel[] | null = null;
let cacheTimestamp = 0;

function isCacheValid(): boolean {
  return cachedModels !== null && Date.now() - cacheTimestamp < CACHE_TTL_MS;
}

/** Clear the in-memory cache (useful after admin updates). */
export function invalidateModelCache(): void {
  cachedModels = null;
  cacheTimestamp = 0;
}

// ─── Row mapping ─────────────────────────────────────────────────────────────

function rowToModel(row: AiModelRow): AiModel {
  return {
    id: row.id,
    label: row.label,
    provider: row.provider as "claude" | "gemini",
    maxOutputTokens: row.max_output_tokens,
    creditCost: row.credit_cost,
    inputCostPerM: Number(row.input_cost_per_m),
    outputCostPerM: Number(row.output_cost_per_m),
    byokOnly: row.byok_only,
    userSelectable: row.user_selectable,
    enabled: row.enabled,
    isDefault: row.is_default,
    sortOrder: row.sort_order,
  };
}

// ─── Public API ──────────────────────────────────────────────────────────────

/** Fetch all enabled models (cached 60s, falls back to hardcoded defaults). */
export async function getModels(): Promise<AiModel[]> {
  if (isCacheValid()) return cachedModels!;

  try {
    const { data, error } = await supabase
      .from("layout_ai_models")
      .select("*")
      .eq("enabled", true)
      .order("sort_order", { ascending: true });

    if (error || !data || data.length === 0) {
      console.warn("[ai/models] DB fetch failed or empty, using fallbacks:", error?.message);
      cachedModels = FALLBACK_MODELS;
    } else {
      cachedModels = (data as AiModelRow[]).map(rowToModel);
    }
  } catch {
    console.warn("[ai/models] DB unreachable, using fallback models");
    cachedModels = FALLBACK_MODELS;
  }

  cacheTimestamp = Date.now();
  return cachedModels!;
}

/** Fetch all models including disabled (for admin panel). */
export async function getAllModels(): Promise<AiModel[]> {
  try {
    const { data, error } = await supabase
      .from("layout_ai_models")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error || !data) {
      return FALLBACK_MODELS;
    }
    return (data as AiModelRow[]).map(rowToModel);
  } catch {
    return FALLBACK_MODELS;
  }
}

/** Get models that users can select in the Explorer model picker. */
export async function getUserSelectableModels(): Promise<AiModel[]> {
  const models = await getModels();
  return models.filter((m) => m.userSelectable);
}

/** Get the default model (is_default=true). */
export async function getDefaultModel(): Promise<AiModel> {
  const models = await getModels();
  return models.find((m) => m.isDefault) ?? models[0] ?? FALLBACK_MODELS[0];
}

/** Look up a single model by ID. Returns null if not found or disabled. */
export async function getModelById(id: string): Promise<AiModel | null> {
  const models = await getModels();
  return models.find((m) => m.id === id) ?? null;
}

/** Get credit cost for a model (returns 1 as fallback). */
export async function getModelCreditCost(modelId: string): Promise<number> {
  const model = await getModelById(modelId);
  return model?.creditCost ?? 1;
}

/** Get token costs for a model (for usage logging). */
export async function getModelTokenCosts(modelId: string): Promise<{ input: number; output: number }> {
  const model = await getModelById(modelId);
  if (!model) {
    return { input: 3.0 / 1_000_000, output: 15.0 / 1_000_000 };
  }
  return {
    input: model.inputCostPerM / 1_000_000,
    output: model.outputCostPerM / 1_000_000,
  };
}

/**
 * Check if a model requires BYOK (user's own API key).
 * Models with byokOnly=true always require BYOK.
 * Models with creditCost=0 also effectively require BYOK.
 */
export async function isModelByokOnly(modelId: string): Promise<boolean> {
  const model = await getModelById(modelId);
  return model?.byokOnly ?? false;
}

// ─── Task defaults ───────────────────────────────────────────────────────────

export type AiTask = "extraction" | "editor" | "simple-edit";

const TASK_FALLBACKS: Record<AiTask, string> = {
  extraction: "claude-sonnet-4-6",
  editor: "claude-sonnet-4-6",
  "simple-edit": "claude-haiku-4-5-20251001",
};

let cachedTaskDefaults: Record<string, string> | null = null;
let taskCacheTimestamp = 0;

/** Clear task defaults cache (after admin update). */
export function invalidateTaskDefaultsCache(): void {
  cachedTaskDefaults = null;
  taskCacheTimestamp = 0;
}

/**
 * Get the model ID configured for a given task.
 * Reads from `layout_ai_task_defaults` table (cached 60s).
 * Falls back to hardcoded defaults if DB is unreachable.
 */
export async function getTaskModelId(task: AiTask): Promise<string> {
  if (cachedTaskDefaults && Date.now() - taskCacheTimestamp < CACHE_TTL_MS) {
    return cachedTaskDefaults[task] ?? TASK_FALLBACKS[task];
  }

  try {
    const { data, error } = await supabase
      .from("layout_ai_task_defaults")
      .select("task, model_id");

    if (error || !data) {
      return TASK_FALLBACKS[task];
    }

    cachedTaskDefaults = {};
    for (const row of data as Array<{ task: string; model_id: string }>) {
      cachedTaskDefaults[row.task] = row.model_id;
    }
    taskCacheTimestamp = Date.now();

    return cachedTaskDefaults[task] ?? TASK_FALLBACKS[task];
  } catch {
    return TASK_FALLBACKS[task];
  }
}

/** Get all task defaults (for admin panel). */
export async function getAllTaskDefaults(): Promise<Array<{ task: string; modelId: string }>> {
  try {
    const { data, error } = await supabase
      .from("layout_ai_task_defaults")
      .select("task, model_id, updated_at")
      .order("task");

    if (error || !data) {
      return Object.entries(TASK_FALLBACKS).map(([task, modelId]) => ({ task, modelId }));
    }

    return (data as Array<{ task: string; model_id: string }>).map((row) => ({
      task: row.task,
      modelId: row.model_id,
    }));
  } catch {
    return Object.entries(TASK_FALLBACKS).map(([task, modelId]) => ({ task, modelId }));
  }
}
