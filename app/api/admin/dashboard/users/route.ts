import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/admin-context";
import { supabase } from "@/lib/supabase/client";

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain || !local) return "***";
  return `${local[0]}***@${domain}`;
}

type SortField =
  | "cost"
  | "layoutMds"
  | "variants"
  | "projects"
  | "createdAt"
  | "lastActive";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const sort = (request.nextUrl.searchParams.get("sort") ?? "cost") as SortField;
  const limit = Math.min(
    Math.max(parseInt(request.nextUrl.searchParams.get("limit") ?? "20", 10) || 20, 1),
    200
  );

  const [usersRes, usageRes, projectsRes, subscriptionsRes, figmaRes] =
    await Promise.all([
      supabase
        .from("layout_user")
        .select("id, email, created_at")
        .order("created_at", { ascending: false })
        .limit(200),

      supabase
        .from("layout_usage_log")
        .select("user_id, endpoint, cost_estimate_gbp, created_at, mode")
        .limit(10000),

      supabase.from("layout_projects").select("user_id"),

      supabase.from("layout_subscription").select("user_id, tier"),

      supabase.from("layout_figma_connection").select("user_id"),
    ]);

  // Log query errors for debugging
  if (usersRes.error) console.error("[dashboard/users] layout_user query failed:", usersRes.error.message);
  if (usageRes.error) console.error("[dashboard/users] layout_usage_log query failed:", usageRes.error.message);
  if (projectsRes.error) console.error("[dashboard/users] layout_projects query failed:", projectsRes.error.message);
  if (subscriptionsRes.error) console.error("[dashboard/users] layout_subscription query failed:", subscriptionsRes.error.message);
  if (figmaRes.error) console.error("[dashboard/users] layout_figma_connection query failed:", figmaRes.error.message);

  const allUsers = usersRes.data ?? [];
  const usageLogs = usageRes.data ?? [];
  const projects = projectsRes.data ?? [];
  const subscriptions = subscriptionsRes.data ?? [];
  const figmaConnections = figmaRes.data ?? [];

  // Index usage by user
  const userUsage = new Map<
    string,
    {
      layoutMdCount: number;
      variantCount: number;
      totalCost: number;
      lastActive: string;
      mode: string;
    }
  >();

  for (const log of usageLogs) {
    const uid = log.user_id;
    if (!uid) continue;
    let entry = userUsage.get(uid);
    if (!entry) {
      entry = {
        layoutMdCount: 0,
        variantCount: 0,
        totalCost: 0,
        lastActive: "",
        mode: "hosted",
      };
      userUsage.set(uid, entry);
    }
    if (log.endpoint === "layout-md") entry.layoutMdCount++;
    if (log.endpoint === "explore") entry.variantCount++;
    if (typeof log.cost_estimate_gbp === "number") {
      entry.totalCost += log.cost_estimate_gbp;
    }
    if (log.created_at > entry.lastActive) {
      entry.lastActive = log.created_at;
    }
    if (log.mode === "byok") entry.mode = "byok";
  }

  // Index projects by user
  const projectCounts = new Map<string, number>();
  for (const p of projects) {
    if (p.user_id) {
      projectCounts.set(p.user_id, (projectCounts.get(p.user_id) ?? 0) + 1);
    }
  }

  // Index subscriptions
  const tierMap = new Map<string, string>();
  for (const s of subscriptions) {
    if (s.user_id) tierMap.set(s.user_id, s.tier);
  }

  // Index Figma connections
  const figmaSet = new Set(figmaConnections.map((c) => c.user_id));

  // Build user list — matches UserRow interface in DashboardTab
  const users = allUsers.map((u) => {
    const usage = userUsage.get(u.id);
    return {
      email: maskEmail(u.email),
      projects: projectCounts.get(u.id) ?? 0,
      layoutMds: usage?.layoutMdCount ?? 0,
      variants: usage?.variantCount ?? 0,
      cost: Math.round((usage?.totalCost ?? 0) * 100) / 100,
      lastActive: usage?.lastActive ?? u.created_at,
      tier: tierMap.get(u.id) ?? "free",
      mode: usage?.mode ?? "hosted",
      hasFigma: figmaSet.has(u.id),
    };
  });

  // Sort
  const sortFns: Record<SortField, (a: typeof users[0], b: typeof users[0]) => number> = {
    cost: (a, b) => b.cost - a.cost,
    layoutMds: (a, b) => b.layoutMds - a.layoutMds,
    variants: (a, b) => b.variants - a.variants,
    projects: (a, b) => b.projects - a.projects,
    createdAt: (a, b) => b.lastActive.localeCompare(a.lastActive),
    lastActive: (a, b) => b.lastActive.localeCompare(a.lastActive),
  };

  const sortFn = sortFns[sort] ?? sortFns.cost;
  users.sort(sortFn);

  return NextResponse.json({
    users: users.slice(0, limit),
    _debug: {
      totalUsersQueried: allUsers.length,
      usageLogsQueried: usageLogs.length,
      projectsQueried: projects.length,
      errors: {
        users: usersRes.error?.message ?? null,
        usage: usageRes.error?.message ?? null,
        projects: projectsRes.error?.message ?? null,
        subscriptions: subscriptionsRes.error?.message ?? null,
        figma: figmaRes.error?.message ?? null,
      },
    },
  }, { headers: { "Cache-Control": "no-store, private" } });
}
