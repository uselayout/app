import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/admin-context";
import { supabase } from "@/lib/supabase/client";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  // All signed-up users
  const { data: users, error: usersError } = await supabase
    .from("layout_user")
    .select("id, email, name")
    .order("email");

  if (usersError) {
    return NextResponse.json({ error: usersError.message }, { status: 500 });
  }

  // Approved access requests where invite code not yet redeemed
  const { data: approved, error: approvedError } = await supabase
    .from("access_requests")
    .select("id, name, email, invite_code")
    .eq("status", "approved")
    .order("email");

  if (approvedError) {
    return NextResponse.json({ error: approvedError.message }, { status: 500 });
  }

  // Check which invite codes have been redeemed
  const codes = approved
    ?.map((r) => r.invite_code)
    .filter((c): c is string => c !== null) ?? [];

  let redeemedCodes = new Set<string>();
  if (codes.length > 0) {
    const { data: redeemed } = await supabase
      .from("invite_codes")
      .select("code")
      .in("code", codes)
      .not("redeemed_by", "is", null);
    redeemedCodes = new Set((redeemed ?? []).map((r) => r.code as string));
  }

  const notSignedUp = (approved ?? []).filter(
    (r) => !r.invite_code || !redeemedCodes.has(r.invite_code)
  );

  return NextResponse.json({
    segments: {
      all_users: { count: users?.length ?? 0, label: "All signed-up users" },
      approved_not_signed_up: {
        count: notSignedUp.length,
        label: "Approved (not yet signed up)",
      },
    },
    users: [
      ...(users ?? []).map((u) => ({
        email: u.email as string,
        name: (u.name as string) ?? "",
        source: "user" as const,
      })),
      ...notSignedUp.map((r) => ({
        email: r.email as string,
        name: (r.name as string) ?? "",
        source: "access_request" as const,
      })),
    ],
  });
}
