import { NextResponse } from "next/server";
import { requireOrgAuth } from "@/lib/api/auth-context";
import { deleteInvitation } from "@/lib/supabase/organization";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ orgId: string; invitationId: string }> }
) {
  const { orgId, invitationId } = await params;

  const authResult = await requireOrgAuth(orgId, "manageMembers");
  if (authResult instanceof NextResponse) return authResult;

  const success = await deleteInvitation(invitationId, orgId);
  if (!success) {
    return NextResponse.json(
      { error: "Failed to cancel invitation" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
