import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/admin-context";
import { getAccessRequests } from "@/lib/supabase/invite-codes";
import type { AccessRequest } from "@/lib/supabase/invite-codes";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const url = new URL(request.url);
  const statusParam = url.searchParams.get("status") as
    | AccessRequest["status"]
    | null;

  const requests = await getAccessRequests(
    statusParam ? { status: statusParam } : undefined
  );

  return NextResponse.json({ requests });
}
