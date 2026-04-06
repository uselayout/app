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
  const daysParam = parseInt(request.nextUrl.searchParams.get("days") ?? "0", 10);

  let usageQuery = supabase
    .from("layout_usage_log")
    .select("user_id, endpoint, cost_estimate_gbp, created_at, mode")
    .limit(10000);

  if (daysParam > 0) {
    const since = new Date(Date.now() - daysParam * 24 * 60 * 60 * 1000).toISOString();
    usageQuery = usageQuery.gte("created_at", since);
  }

  const [usersRes, usageRes, projectsRes, subscriptionsRes] =
    await Promise.all([
      supabase
        .from("layout_user")
        .select('id, email, "createdAt"')
        .order("createdAt", { ascending: false })
        .limit(200),

      usageQuery,

      supabase.from("layout_projects").select("user_id"),

      supabase.from("layout_subscription").select("user_id, tier"),

    ]);

  const allUsers = usersRes.data ?? [];
  const usageLogs = usageRes.data ?? [];
  const projects = projectsRes.data ?? [];
  const subscriptions = subscriptionsRes.data ?? [];
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

  // Build user list — matches UserRow interface in DashboardTab
  const users = allUsers.map((u) => {
    const usage = userUsage.get(u.id);
    const createdAt = (u as Record<string, unknown>).createdAt as string ?? "";
    return {
      email: maskEmail(u.email),
      projects: projectCounts.get(u.id) ?? 0,
      layoutMds: usage?.layoutMdCount ?? 0,
      variants: usage?.variantCount ?? 0,
      cost: Math.round((usage?.totalCost ?? 0) * 100) / 100,
      lastActive: usage?.lastActive ?? createdAt,
      tier: tierMap.get(u.id) ?? "free",
      mode: usage?.mode ?? "hosted",
      hasFigma: false, // Can't reliably map user->org without extra query
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

  return NextResponse.json({ users: users.slice(0, limit) }, { headers: { "Cache-Control": "no-store, private" } });
}
