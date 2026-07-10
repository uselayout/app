import { NextResponse } from "next/server";
import { requireOrgAuth } from "@/lib/api/auth-context";
import { supabase } from "@/lib/supabase/client";
import {
  LIVE_REQUEST_COLUMNS,
  rowToLiveSyncRequest,
  type LiveRequestRow,
} from "@/lib/supabase/live-requests";

// Dashboard view of the org's Layout Live request queue. Session-cookie
// auth (org member), unlike the machine endpoint at /api/live/requests
// which uses org API keys.

const MAX_ROWS = 500;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;
  const authResult = await requireOrgAuth(orgId, "viewProject");
  if (authResult instanceof NextResponse) return authResult;

  const { data, error } = await supabase
    .from("layout_live_requests")
    .select(LIVE_REQUEST_COLUMNS)
    .eq("org_id", authResult.orgId)
    .eq("deleted", false)
    .order("updated_at", { ascending: false })
    .limit(MAX_ROWS);

  if (error) {
    console.error("[org/live-requests] fetch failed:", error.message);
    return NextResponse.json(
      { error: "Failed to fetch live requests" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    requests: ((data ?? []) as LiveRequestRow[]).map(rowToLiveSyncRequest),
  });
}
