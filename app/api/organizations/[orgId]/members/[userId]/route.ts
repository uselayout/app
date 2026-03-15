import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOrgAuth } from "@/lib/api/auth-context";
import {
  getOrgMember,
  updateMemberRole,
  removeMember,
} from "@/lib/supabase/organization";

const updateRoleSchema = z.object({
  role: z.enum(["admin", "editor", "viewer"]),
});

type Params = { params: Promise<{ orgId: string; userId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { orgId, userId } = await params;

  const authResult = await requireOrgAuth(orgId, "manageMembers");
  if (authResult instanceof NextResponse) return authResult;

  // Cannot change own role
  if (authResult.userId === userId) {
    return NextResponse.json(
      { error: "Cannot change your own role" },
      { status: 400 }
    );
  }

  // Cannot change owner's role
  const target = await getOrgMember(orgId, userId);
  if (!target) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }
  if (target.role === "owner") {
    return NextResponse.json(
      { error: "Cannot change the owner's role" },
      { status: 400 }
    );
  }

  const body: unknown = await request.json();
  const parsed = updateRoleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const updated = await updateMemberRole(orgId, userId, parsed.data.role);
  if (!updated) {
    return NextResponse.json(
      { error: "Failed to update role" },
      { status: 500 }
    );
  }

  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { orgId, userId } = await params;

  const authResult = await requireOrgAuth(orgId, "manageMembers");
  if (authResult instanceof NextResponse) return authResult;

  // Cannot remove self
  if (authResult.userId === userId) {
    return NextResponse.json(
      { error: "Cannot remove yourself" },
      { status: 400 }
    );
  }

  // Cannot remove owner
  const target = await getOrgMember(orgId, userId);
  if (!target) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }
  if (target.role === "owner") {
    return NextResponse.json(
      { error: "Cannot remove the owner" },
      { status: 400 }
    );
  }

  const success = await removeMember(orgId, userId);
  if (!success) {
    return NextResponse.json(
      { error: "Failed to remove member" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
