import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/admin-context";
import { supabase } from "@/lib/supabase/client";

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain || !local) return "***";
  return `${local[0]}***@${domain}`;
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const sevenDaysAgo = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000
  ).toISOString();

  const [usageRes, eventsRes, figmaRes, projectsRes, componentsRes, creditsRes, allUsersRes] =
    await Promise.all([
      supabase
        .from("layout_usage_log")
        .select("user_id, endpoint, created_at, mode, model, cost_estimate_gbp")
        .limit(10000),

      supabase
        .from("layout_platform_event")
        .select("event, user_id, org_id, metadata, created_at")
        .limit(10000),

      supabase
        .from("layout_figma_connection")
        .select("org_id"),

      supabase
        .from("layout_projects")
        .select("source_type"),

      supabase
        .from("layout_component")
        .select("design_type, source"),

      supabase
        .from("layout_credit_balance")
        .select("user_id, design_md_remaining, topup_design_md")
        .eq("design_md_remaining", 0)
        .eq("topup_design_md", 0),

      // Fetch users for email lookups
      supabase
        .from("layout_user")
        .select("id, email")
        .limit(500),
    ]);

  const usageLogs = usageRes.data ?? [];
  const platformEvents = eventsRes.data ?? [];
  const figmaConnections = figmaRes.data ?? [];
  const projects = projectsRes.data ?? [];
  const components = componentsRes.data ?? [];
  const zeroCredits = creditsRes.data ?? [];
  const allUsers = allUsersRes.data ?? [];

  // Build user email lookup
  const userEmailMap = new Map<string, string>();
  for (const u of allUsers) {
    if (u.id && u.email) userEmailMap.set(u.id, u.email);
  }

  // --- Studio ---
  const studioActiveUsers7d = new Set(
    usageLogs
      .filter((r) => r.created_at >= sevenDaysAgo)
      .map((r) => r.user_id)
  ).size;

  const layoutMdLogs = usageLogs.filter((r) => r.endpoint === "layout-md");
  const variantLogs = usageLogs.filter((r) => r.endpoint === "explore");

  // Source types
  const sourceTypes: Record<string, number> = {};
  for (const p of projects) {
    const t = p.source_type || "manual";
    sourceTypes[t] = (sourceTypes[t] ?? 0) + 1;
  }

  // BYOK vs hosted (unique users, not API call counts)
  const byokUsers = new Set(usageLogs.filter((r) => r.mode === "byok").map((r) => r.user_id));
  const hostedUsers = new Set(usageLogs.filter((r) => r.mode === "hosted").map((r) => r.user_id));

  // Model usage (unique users per model)
  const modelUserSets: Record<string, Set<string>> = {};
  for (const log of usageLogs) {
    if (log.model && log.user_id) {
      if (!modelUserSets[log.model]) modelUserSets[log.model] = new Set();
      modelUserSets[log.model].add(log.user_id);
    }
  }
  const modelUsage: Record<string, number> = {};
  for (const [model, users] of Object.entries(modelUserSets)) {
    modelUsage[model] = users.size;
  }

  // Component breakdown
  const componentTypes = {
    component: components.filter((c) => c.design_type === "component").length,
    page: components.filter((c) => c.design_type === "page").length,
  };
  const componentSources: Record<string, number> = {};
  for (const c of components) {
    const s = c.source || "manual";
    componentSources[s] = (componentSources[s] ?? 0) + 1;
  }

  // --- CLI ---
  const pullEvents = platformEvents.filter((e) => e.event === "export.pull");
  const mcpEvents = platformEvents.filter((e) => e.event === "mcp.tool_call");
  const activeInstalls = new Set(
    [...pullEvents, ...mcpEvents].map((e) => e.org_id)
  ).size;
  const exportEvents = platformEvents.filter((e) => e.event === "export.bundle");

  // Top MCP tools
  const toolCounts = new Map<string, number>();
  for (const e of mcpEvents) {
    const tool =
      (e.metadata as Record<string, unknown> | null)?.tool as string | undefined;
    if (tool) {
      toolCounts.set(tool, (toolCounts.get(tool) ?? 0) + 1);
    }
  }
  const topTools = Array.from(toolCounts.entries())
    .map(([tool, count]) => ({ tool, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // --- Figma Plugin ---
  const connectedOrgs = new Set(
    figmaConnections.map((c) => c.org_id)
  ).size;
  const captureEvents = platformEvents.filter(
    (e) => e.event === "plugin.figma.capture"
  );
  const pushFigmaEvents = platformEvents.filter(
    (e) => e.event === "plugin.figma.push" || e.event === "plugin.figma.push_tokens"
  );

  // --- Chrome Extension ---
  const extensionUsers = new Set(
    platformEvents
      .filter((e) => e.event.startsWith("extension."))
      .map((e) => e.org_id)
  ).size;
  const extensionExtractions = platformEvents.filter(
    (e) => e.event === "extension.extraction"
  ).length;

  // --- Billing ---
  // Top consumers by cost with masked emails
  const userCosts = new Map<string, number>();
  for (const log of usageLogs) {
    if (log.user_id && typeof log.cost_estimate_gbp === "number") {
      userCosts.set(log.user_id, (userCosts.get(log.user_id) ?? 0) + log.cost_estimate_gbp);
    }
  }
  const topConsumers = Array.from(userCosts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([userId, cost]) => ({
      email: maskEmail(userEmailMap.get(userId) ?? "unknown"),
      cost: Math.round(cost * 100) / 100,
    }));

  // Zero-credit user emails
  const zeroCreditsEmails = zeroCredits
    .map((c) => maskEmail(userEmailMap.get(c.user_id) ?? "unknown"))
    .filter((e) => e !== "***");

  return NextResponse.json({
    studio: {
      activeUsers7d: studioActiveUsers7d,
      projectsCreated: projects.length,
      layoutMdsGenerated: layoutMdLogs.length,
      variantsGenerated: variantLogs.length,
      sourceTypes,
      byokVsHosted: { byok: byokUsers.size, hosted: hostedUsers.size },
      modelUsage,
      componentTypes,
      componentSources,
    },
    cli: {
      activeInstalls: activeInstalls,
      mcpCallsToday: mcpEvents.filter((e) => e.created_at >= sevenDaysAgo).length,
      topTools,
      exports: exportEvents.length + pullEvents.length,
    },
    figmaPlugin: {
      activeUsers: connectedOrgs,
      syncs: captureEvents.length,
      pushes: pushFigmaEvents.length,
    },
    chromeExtension: {
      activeUsers: extensionUsers,
      extractions: extensionExtractions,
    },
    billing: {
      usersAtZeroCredits: zeroCredits.length,
      zeroCreditsEmails,
      topConsumers,
    },
  }, { headers: { "Cache-Control": "no-store, private" } });
}
