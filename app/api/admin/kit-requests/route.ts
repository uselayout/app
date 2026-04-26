import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/api/admin-context";
import { listAllKitRequests } from "@/lib/supabase/kit-requests";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (admin instanceof NextResponse) return admin;

  const requests = await listAllKitRequests();
  return NextResponse.json({ requests });
}
