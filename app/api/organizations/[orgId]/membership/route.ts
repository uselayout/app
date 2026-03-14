import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth-context";
import { getOrgMember } from "@/lib/supabase/organization";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const { userId } = authResult;
  const { orgId } = await params;

  const member = await getOrgMember(orgId, userId);

  if (!member) {
    return NextResponse.json(
      { error: "Not a member of this organisation" },
      { status: 403 }
    );
  }

  return NextResponse.json(member);
}
