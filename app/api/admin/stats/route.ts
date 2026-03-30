import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/admin-context";
import { supabase } from "@/lib/supabase/client";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  // Run all count queries in parallel
  const [requestsRes, codesRes] = await Promise.all([
    supabase.from("access_requests").select("status"),
    supabase
      .from("invite_codes")
      .select("redeemed_by")
      .not("redeemed_by", "is", null),
  ]);

  const requests = requestsRes.data ?? [];
  const pending = requests.filter((r) => r.status === "pending").length;
  const approved = requests.filter((r) => r.status === "approved").length;
  const rejected = requests.filter((r) => r.status === "rejected").length;
  const signedUp = codesRes.data?.length ?? 0;

  return NextResponse.json({
    totalRequests: requests.length,
    pending,
    approved,
    rejected,
    signedUp,
  });
}
