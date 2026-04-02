import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/admin-context";
import { supabase } from "@/lib/supabase/client";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  // Fetch users with zero credits
  const { data: zeroCredits } = await supabase
    .from("layout_credit_balance")
    .select("user_id, design_md_remaining, topup_design_md")
    .eq("design_md_remaining", 0)
    .eq("topup_design_md", 0);

  if (!zeroCredits?.length) {
    return NextResponse.json({ users: [] }, { headers: { "Cache-Control": "no-store, private" } });
  }

  // Look up emails
  const userIds = zeroCredits.map((c) => c.user_id).filter(Boolean);
  const { data: userRows } = await supabase
    .from("layout_user")
    .select("id, email")
    .in("id", userIds);

  const emailMap = new Map<string, string>();
  for (const u of userRows ?? []) {
    if (u.id && u.email) emailMap.set(u.id, u.email);
  }

  const users = zeroCredits
    .filter((c) => emailMap.has(c.user_id))
    .map((c) => ({
      email: emailMap.get(c.user_id)!,
      layoutMdRemaining: c.design_md_remaining,
      topupLayoutMd: c.topup_design_md,
    }));

  return NextResponse.json({ users }, { headers: { "Cache-Control": "no-store, private" } });
}
