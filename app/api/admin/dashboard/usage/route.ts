import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/admin-context";
import { supabase } from "@/lib/supabase/client";

function toDateString(iso: string): string {
  return iso.slice(0, 10);
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const days = Math.min(
    Math.max(parseInt(request.nextUrl.searchParams.get("days") ?? "30", 10) || 30, 1),
    365
  );
  const since = days === 1
    ? new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).toISOString()
    : new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const [usageRes, eventsRes] = await Promise.all([
    supabase
      .from("layout_usage_log")
      .select("endpoint, created_at, model")
      .gte("created_at", since)
      .order("created_at", { ascending: true })
      .limit(10000),
    supabase
      .from("layout_platform_event")
      .select("event, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: true })
      .limit(10000),
  ]);

  const usageLogs = usageRes.data ?? [];
  const platformEvents = eventsRes.data ?? [];

  // Build daily buckets
  const dailyMap = new Map<
    string,
    {
      layoutMds: number;
      variants: number;
      edits: number;
      tests: number;
      extractions: number;
      exports: number;
      mcpCalls: number;
    }
  >();

  const ensureDay = (date: string) => {
    if (!dailyMap.has(date)) {
      dailyMap.set(date, {
        layoutMds: 0,
        variants: 0,
        edits: 0,
        tests: 0,
        extractions: 0,
        exports: 0,
        mcpCalls: 0,
      });
    }
    return dailyMap.get(date)!;
  };

  for (const log of usageLogs) {
    const date = toDateString(log.created_at);
    const bucket = ensureDay(date);
    switch (log.endpoint) {
      case "layout-md":
        bucket.layoutMds++;
        break;
      case "explore":
        bucket.variants++;
        break;
      case "edit":
        bucket.edits++;
        break;
      case "test":
        bucket.tests++;
        break;
    }
  }

  for (const event of platformEvents) {
    const date = toDateString(event.created_at);
    const bucket = ensureDay(date);
    if (event.event.startsWith("extraction.complete")) {
      bucket.extractions++;
    } else if (
      event.event === "export.bundle" ||
      event.event === "export.pull"
    ) {
      bucket.exports++;
    } else if (event.event === "mcp.tool_call") {
      bucket.mcpCalls++;
    }
  }

  // Sort dates
  const daily = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({ date, ...data }));

  // Top models
  const modelCounts = new Map<string, number>();
  for (const log of usageLogs) {
    if (log.model) {
      modelCounts.set(log.model, (modelCounts.get(log.model) ?? 0) + 1);
    }
  }
  const topModels = Array.from(modelCounts.entries())
    .map(([model, count]) => ({ model, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Top endpoints
  const endpointCounts = new Map<string, number>();
  for (const log of usageLogs) {
    if (log.endpoint) {
      endpointCounts.set(
        log.endpoint,
        (endpointCounts.get(log.endpoint) ?? 0) + 1
      );
    }
  }
  const topEndpoints = Array.from(endpointCounts.entries())
    .map(([endpoint, count]) => ({ endpoint, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Compute totals to match UsageData interface in DashboardTab
  const totals = {
    layoutMds: 0, variants: 0, edits: 0, extractions: 0, exports: 0, mcpCalls: 0,
  };
  for (const d of daily) {
    totals.layoutMds += d.layoutMds;
    totals.variants += d.variants;
    totals.edits += d.edits;
    totals.extractions += d.extractions;
    totals.exports += d.exports;
    totals.mcpCalls += d.mcpCalls;
  }

  return NextResponse.json({ daily, totals, topModels, topEndpoints }, { headers: { "Cache-Control": "no-store, private" } });
}
