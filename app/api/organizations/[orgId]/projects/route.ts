import { NextResponse } from "next/server";
import { requireOrgAuth } from "@/lib/api/auth-context";
import { fetchAllProjectsSummary } from "@/lib/supabase/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;

  const authResult = await requireOrgAuth(orgId, "viewProject");
  if (authResult instanceof NextResponse) return authResult;

  const projects = await fetchAllProjectsSummary(orgId);
  return NextResponse.json(projects);
}
