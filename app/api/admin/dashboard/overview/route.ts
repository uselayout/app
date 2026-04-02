import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/admin-context";
import { supabase } from "@/lib/supabase/client";

function startOfMonth(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

function startOfWeekMonday(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString();
}

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const monthStart = startOfMonth();
  const weekStart = startOfWeekMonday();
  const sevenDaysAgo = daysAgo(7);
  const thirtyDaysAgo = daysAgo(30);
  const twentyFourHoursAgo = hoursAgo(24);

  const [
    usersRes,
    newUsersRes,
    projectsRes,
    projectSourcesRes,
    usageLogRes,
    componentsRes,
    platformEventsRes,
    figmaConnectionRes,
    creditsRes,
    errorsRes,
  ] = await Promise.all([
    // Total users
    supabase
      .from("layout_user")
      .select("*", { count: "exact", head: true }),

    // New users this month
    supabase
      .from("layout_user")
      .select("*", { count: "exact", head: true })
      .gte("created_at", monthStart),

    // Total projects
    supabase
      .from("layout_projects")
      .select("*", { count: "exact", head: true }),

    // Projects by source
    supabase
      .from("layout_projects")
      .select("source_type"),

    // Usage log (for active users, layout-md counts, variant counts, cost, byok/hosted)
    supabase
      .from("layout_usage_log")
      .select("user_id, endpoint, created_at, cost_estimate_gbp, mode")
      .gte("created_at", thirtyDaysAgo)
      .limit(10000),

    // Components
    supabase
      .from("layout_component")
      .select("design_type, source"),

    // Platform events
    supabase
      .from("layout_platform_event")
      .select("event"),

    // Figma connections
    supabase
      .from("layout_figma_connection")
      .select("user_id"),

    // Credits at zero
    supabase
      .from("layout_credit_balance")
      .select("*", { count: "exact", head: true })
      .eq("design_md_remaining", 0)
      .eq("topup_design_md", 0),

    // Errors last 24h
    supabase
      .from("layout_api_log")
      .select("*", { count: "exact", head: true })
      .gte("status_code", 400)
      .gte("created_at", twentyFourHoursAgo),
  ]);

  // Active users
  const usageLogs = usageLogRes.data ?? [];
  const activeUsers7d = new Set(
    usageLogs
      .filter((r) => r.created_at >= sevenDaysAgo)
      .map((r) => r.user_id)
  ).size;
  const activeUsers30d = new Set(
    usageLogs.map((r) => r.user_id)
  ).size;

  // Layout.md counts
  const layoutMdLogs = usageLogs.filter((r) => r.endpoint === "layout-md");
  const layoutMdsThisMonth = layoutMdLogs.filter(
    (r) => r.created_at >= monthStart
  ).length;
  const layoutMdsThisWeek = layoutMdLogs.filter(
    (r) => r.created_at >= weekStart
  ).length;

  // Variant counts
  const variantLogs = usageLogs.filter((r) => r.endpoint === "explore");
  const variantsThisMonth = variantLogs.filter(
    (r) => r.created_at >= monthStart
  ).length;
  const variantsThisWeek = variantLogs.filter(
    (r) => r.created_at >= weekStart
  ).length;

  // Total layout-mds and variants (all time) - need separate queries
  const [totalLayoutMdsRes, totalVariantsRes] = await Promise.all([
    supabase
      .from("layout_usage_log")
      .select("*", { count: "exact", head: true })
      .eq("endpoint", "layout-md"),
    supabase
      .from("layout_usage_log")
      .select("*", { count: "exact", head: true })
      .eq("endpoint", "explore"),
  ]);

  // Cost this month
  const platformCostThisMonth = usageLogs
    .filter((r) => r.created_at >= monthStart)
    .reduce(
      (sum, r) => sum + (typeof r.cost_estimate_gbp === "number" ? r.cost_estimate_gbp : 0),
      0
    );

  // BYOK vs hosted
  const byokCount = usageLogs.filter((r) => r.mode === "byok").length;
  const hostedCount = usageLogs.filter((r) => r.mode === "hosted").length;

  // Projects by source
  const projectSources = projectSourcesRes.data ?? [];
  const projectsBySource = {
    figma: projectSources.filter((p) => p.source_type === "figma").length,
    website: projectSources.filter((p) => p.source_type === "website").length,
    manual: projectSources.filter(
      (p) => p.source_type === "manual" || !p.source_type
    ).length,
  };

  // Components by type and source
  const components = componentsRes.data ?? [];
  const componentsByType = {
    component: components.filter((c) => c.design_type === "component").length,
    page: components.filter((c) => c.design_type === "page").length,
  };
  const componentsBySource = {
    explorer: components.filter((c) => c.source === "explorer").length,
    extraction: components.filter((c) => c.source === "extraction").length,
    figma: components.filter((c) => c.source === "figma").length,
    manual: components.filter((c) => c.source === "manual").length,
  };

  // Platform events
  const events = platformEventsRes.data ?? [];
  const totalBundleExports = events.filter(
    (e) => e.event === "export.bundle"
  ).length;
  const totalCliPulls = events.filter(
    (e) => e.event === "export.pull"
  ).length;
  const totalMcpCalls = events.filter(
    (e) => e.event === "mcp.tool_call"
  ).length;
  const figmaCaptures = events.filter(
    (e) => e.event === "plugin.figma.capture"
  ).length;
  const figmaPushes = events.filter(
    (e) =>
      e.event === "plugin.figma.push" ||
      e.event === "plugin.figma.push_tokens"
  ).length;

  // Figma plugin users
  const figmaConnections = figmaConnectionRes.data ?? [];
  const figmaPluginUsers = new Set(
    figmaConnections.map((c) => c.user_id)
  ).size;

  return NextResponse.json({
    // Matches OverviewData interface in DashboardTab
    totalUsers: usersRes.count ?? 0,
    activeUsers7d,
    newUsersMonth: newUsersRes.count ?? 0,
    totalProjects: projectsRes.count ?? 0,
    layoutMdsCreated: totalLayoutMdsRes.count ?? 0,
    variantsGenerated: totalVariantsRes.count ?? 0,
    componentsSaved: components.length,
    bundleExports: totalBundleExports,
    layoutMdsThisMonth,
    variantsThisMonth,
    errorsLast24h: errorsRes.count ?? 0,
    // Extra data used by ProductData and feature adoption sections
    activeUsers30d,
    projectsBySource,
    layoutMdsThisWeek,
    variantsThisWeek,
    componentsByType,
    componentsBySource,
    totalCliPulls,
    totalMcpCalls,
    figmaPluginUsers,
    figmaCaptures,
    figmaPushes,
    platformCostThisMonth: Math.round(platformCostThisMonth * 100) / 100,
    usersAtZeroCredits: creditsRes.count ?? 0,
    byokVsHosted: { byok: byokCount, hosted: hostedCount },
  }, { headers: { "Cache-Control": "no-store, private" } });
}
