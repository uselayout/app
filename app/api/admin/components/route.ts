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

  const [componentsRes, usersRes] = await Promise.all([
    supabase
      .from("layout_component")
      .select("id, name, code, category, tags, design_type, source, org_id, created_by, created_at")
      .eq("source", "explorer")
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("layout_user")
      .select("id, email")
      .limit(500),
  ]);

  const components = componentsRes.data ?? [];
  const users = usersRes.data ?? [];

  const userMap = new Map<string, string>();
  for (const u of users) {
    if (u.id && u.email) userMap.set(u.id, u.email);
  }

  const result = components.map((c) => ({
    id: c.id,
    name: c.name,
    code: c.code,
    category: c.category,
    tags: c.tags,
    designType: c.design_type,
    source: c.source,
    orgId: c.org_id,
    createdBy: c.created_by,
    createdByEmail: c.created_by ? maskEmail(userMap.get(c.created_by) ?? "unknown") : "***",
    createdAt: c.created_at,
  }));

  return NextResponse.json({ components: result }, { headers: { "Cache-Control": "no-store, private" } });
}
