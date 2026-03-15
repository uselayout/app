import { NextResponse } from "next/server";
import { requireOrgAuth } from "@/lib/api/auth-context";
import { getOrgInvitations } from "@/lib/supabase/organization";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;

  const authResult = await requireOrgAuth(orgId, "manageMembers");
  if (authResult instanceof NextResponse) return authResult;

  const invitations = await getOrgInvitations(orgId);

  return NextResponse.json(invitations);
}
