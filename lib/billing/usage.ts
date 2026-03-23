import { supabase } from "@/lib/supabase/client";
import type {
  AiEndpoint,
  AiMode,
  UsageLogEntry,
  UsageStats,
  TokenUsageResult,
} from "@/lib/types/billing";
import { TOKEN_COSTS_USD as COSTS } from "@/lib/types/billing";

interface UsageRow {
  id: string;
  user_id: string;
  project_id: string | null;
  endpoint: string;
  mode: string;
  input_tokens: number;
  output_tokens: number;
  model: string;
  cost_estimate_gbp: number;
  created_at: string;
}

function rowToEntry(row: UsageRow): UsageLogEntry {
  return {
    id: row.id,
    userId: row.user_id,
    projectId: row.project_id,
    endpoint: row.endpoint as AiEndpoint,
    mode: row.mode as AiMode,
    inputTokens: row.input_tokens,
    outputTokens: row.output_tokens,
    model: row.model,
    costEstimateUsd: row.cost_estimate_gbp,
    createdAt: row.created_at,
  };
}

function estimateCost(usage: TokenUsageResult): number {
  return usage.inputTokens * COSTS.input + usage.outputTokens * COSTS.output;
}

/** Log a single AI API call — fire-and-forget, errors are logged not thrown */
export async function logUsage(params: {
  userId: string;
  projectId?: string;
  endpoint: AiEndpoint;
  mode: AiMode;
  usage: TokenUsageResult;
  model: string;
}): Promise<void> {
  const cost = estimateCost(params.usage);

  const { error } = await supabase.from("layout_usage_log").insert({
    user_id: params.userId,
    project_id: params.projectId ?? null,
    endpoint: params.endpoint,
    mode: params.mode,
    input_tokens: params.usage.inputTokens,
    output_tokens: params.usage.outputTokens,
    model: params.model,
    cost_estimate_gbp: cost,
  });

  if (error) {
    console.error("Failed to log usage:", error.message);
  }
}

/** Get recent usage entries for a user */
export async function getUsageHistory(
  userId: string,
  days: number = 30
): Promise<UsageLogEntry[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("layout_usage_log")
    .select("*")
    .eq("user_id", userId)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("Failed to fetch usage history:", error.message);
    return [];
  }

  return (data as UsageRow[]).map(rowToEntry);
}

/** Aggregate usage stats for the current billing period */
export async function getUsageStats(
  userId: string,
  periodStart: string,
  periodEnd: string
): Promise<UsageStats> {
  const { data, error } = await supabase
    .from("layout_usage_log")
    .select("*")
    .eq("user_id", userId)
    .gte("created_at", periodStart)
    .lte("created_at", periodEnd);

  if (error || !data) {
    console.error("Failed to fetch usage stats:", error?.message);
    return {
      totalLayoutMd: 0,
      totalAiQueries: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCostUsd: 0,
      periodStart,
      periodEnd,
    };
  }

  const rows = data as UsageRow[];
  return {
    totalLayoutMd: rows.filter((r) => r.endpoint === "layout-md").length,
    totalAiQueries: rows.filter((r) => r.endpoint !== "layout-md").length,
    totalInputTokens: rows.reduce((sum, r) => sum + r.input_tokens, 0),
    totalOutputTokens: rows.reduce((sum, r) => sum + r.output_tokens, 0),
    totalCostUsd: rows.reduce((sum, r) => sum + Number(r.cost_estimate_gbp), 0),
    periodStart,
    periodEnd,
  };
}
