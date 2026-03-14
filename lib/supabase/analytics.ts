import { supabase } from "./client";
import type {
  AnalyticsEvent,
  AnalyticsEventType,
  AnalyticsSummary,
} from "@/lib/types/analytics";

// ─── Row Types ────────────────────────────────────────────────────────────────

interface AnalyticsEventRow {
  id: string;
  org_id: string;
  event_type: string;
  event_data: Record<string, unknown>;
  api_key_id: string | null;
  user_id: string | null;
  created_at: string;
}

// ─── Row Mappers ──────────────────────────────────────────────────────────────

function rowToEvent(row: AnalyticsEventRow): AnalyticsEvent {
  return {
    id: row.id,
    orgId: row.org_id,
    eventType: row.event_type as AnalyticsEventType,
    eventData: row.event_data ?? {},
    apiKeyId: row.api_key_id,
    userId: row.user_id,
    createdAt: row.created_at,
  };
}

// ─── Track Event (fire-and-forget) ───────────────────────────────────────────

export async function trackEvent(data: {
  orgId: string;
  eventType: AnalyticsEventType;
  eventData?: Record<string, unknown>;
  apiKeyId?: string;
  userId?: string;
}): Promise<void> {
  const { error } = await supabase.from("layout_analytics_event").insert({
    org_id: data.orgId,
    event_type: data.eventType,
    event_data: data.eventData ?? {},
    api_key_id: data.apiKeyId ?? null,
    user_id: data.userId ?? null,
  });

  if (error) {
    console.error("Failed to track analytics event:", error.message);
  }
}

// ─── Analytics Summary ───────────────────────────────────────────────────────

export async function getAnalyticsSummary(
  orgId: string,
  days: number = 30
): Promise<AnalyticsSummary> {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceIso = since.toISOString();

  // Fetch all events in the window — aggregate in JS since Supabase JS client
  // doesn't support GROUP BY / COUNT natively
  const { data, error } = await supabase
    .from("layout_analytics_event")
    .select("event_type, event_data, created_at")
    .eq("org_id", orgId)
    .gte("created_at", sinceIso)
    .order("created_at", { ascending: true });

  if (error || !data) {
    console.error("Failed to fetch analytics:", error?.message);
    return emptySummary();
  }

  const rows = data as Array<{
    event_type: string;
    event_data: Record<string, unknown>;
    created_at: string;
  }>;

  // Total counts
  let totalMcpCalls = 0;
  let totalComponentViews = 0;
  let totalTokenExports = 0;

  // Aggregation maps
  const componentCounts = new Map<string, number>();
  const mcpToolCounts = new Map<string, number>();
  const dailyCounts = new Map<string, number>();

  for (const row of rows) {
    // Totals
    switch (row.event_type) {
      case "mcp.tool_call":
        totalMcpCalls++;
        break;
      case "component.viewed":
        totalComponentViews++;
        break;
      case "token.exported":
        totalTokenExports++;
        break;
    }

    // Top components
    if (row.event_type === "component.viewed") {
      const name =
        typeof row.event_data?.componentName === "string"
          ? row.event_data.componentName
          : "unknown";
      componentCounts.set(name, (componentCounts.get(name) ?? 0) + 1);
    }

    // Top MCP tools
    if (row.event_type === "mcp.tool_call") {
      const tool =
        typeof row.event_data?.tool === "string"
          ? row.event_data.tool
          : "unknown";
      mcpToolCounts.set(tool, (mcpToolCounts.get(tool) ?? 0) + 1);
    }

    // Daily counts
    const date = row.created_at.slice(0, 10); // YYYY-MM-DD
    dailyCounts.set(date, (dailyCounts.get(date) ?? 0) + 1);
  }

  // Sort and limit top lists
  const topComponents = [...componentCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  const topMcpTools = [...mcpToolCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tool, count]) => ({ tool, count }));

  const sortedDailyCounts = [...dailyCounts.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, count]) => ({ date, count }));

  return {
    totalMcpCalls,
    totalComponentViews,
    totalTokenExports,
    topComponents,
    topMcpTools,
    dailyCounts: sortedDailyCounts,
  };
}

// ─── Recent Events ───────────────────────────────────────────────────────────

export async function getRecentEvents(
  orgId: string,
  limit: number = 50
): Promise<AnalyticsEvent[]> {
  const { data, error } = await supabase
    .from("layout_analytics_event")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return (data as AnalyticsEventRow[]).map(rowToEvent);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function emptySummary(): AnalyticsSummary {
  return {
    totalMcpCalls: 0,
    totalComponentViews: 0,
    totalTokenExports: 0,
    topComponents: [],
    topMcpTools: [],
    dailyCounts: [],
  };
}
