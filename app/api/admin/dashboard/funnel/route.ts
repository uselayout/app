import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/admin-context";
import { supabase } from "@/lib/supabase/client";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const [
    requestsRes,
    approvedRes,
    signedUpRes,
    projectUsersRes,
    extractionUsersRes,
    layoutMdUsersRes,
    variantUsersRes,
    exportUsersRes,
    cliMcpUsersRes,
  ] = await Promise.all([
    // Requested access
    supabase
      .from("access_requests")
      .select("*", { count: "exact", head: true }),

    // Approved
    supabase
      .from("access_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "approved"),

    // Signed up (redeemed invite codes)
    supabase
      .from("invite_codes")
      .select("*", { count: "exact", head: true })
      .not("redeemed_by", "is", null),

    // Created project (distinct user_id)
    supabase
      .from("layout_projects")
      .select("user_id"),

    // Extracted design system (distinct events)
    supabase
      .from("layout_platform_event")
      .select("org_id")
      .eq("event", "extraction.complete"),

    // Generated layout.md (distinct user_id)
    supabase
      .from("layout_usage_log")
      .select("user_id")
      .eq("endpoint", "layout-md"),

    // Generated variants (distinct user_id)
    supabase
      .from("layout_usage_log")
      .select("user_id")
      .eq("endpoint", "explore"),

    // Exported bundle (distinct user_id from platform events)
    supabase
      .from("layout_platform_event")
      .select("org_id, event")
      .like("event", "export.%"),

    // Used CLI/MCP
    supabase
      .from("layout_platform_event")
      .select("org_id, event")
      .in("event", ["mcp.tool_call", "export.pull"]),
  ]);

  const requested = requestsRes.count ?? 0;
  const approved = approvedRes.count ?? 0;
  const signedUp = signedUpRes.count ?? 0;
  const createdProject = new Set(
    (projectUsersRes.data ?? []).map((r) => r.user_id)
  ).size;
  const extracted = new Set(
    (extractionUsersRes.data ?? []).map((r) => r.org_id)
  ).size;
  const generatedLayoutMd = new Set(
    (layoutMdUsersRes.data ?? []).map((r) => r.user_id)
  ).size;
  const generatedVariants = new Set(
    (variantUsersRes.data ?? []).map((r) => r.user_id)
  ).size;
  const exported = new Set(
    (exportUsersRes.data ?? []).map((r) => r.org_id)
  ).size;
  const usedCliMcp = new Set(
    (cliMcpUsersRes.data ?? []).map((r) => r.org_id)
  ).size;

  const stages = [
    { stage: "Requested Access", count: requested },
    { stage: "Approved", count: approved },
    { stage: "Signed Up", count: signedUp },
    { stage: "Created Project", count: createdProject },
    { stage: "Extracted Design System", count: extracted },
    { stage: "Generated Layout.md", count: generatedLayoutMd },
    { stage: "Generated Variants", count: generatedVariants },
    { stage: "Exported Bundle", count: exported },
    { stage: "Used CLI/MCP", count: usedCliMcp },
  ];

  const funnel = stages.map((s, i) => {
    if (i === 0) return s;
    const prev = stages[i - 1].count;
    const conversion =
      prev > 0 ? Math.round((s.count / prev) * 1000) / 10 : 0;
    return { ...s, conversion };
  });

  return NextResponse.json({ funnel }, { headers: { "Cache-Control": "no-store, private" } });
}
