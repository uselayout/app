import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOrgAuth } from "@/lib/api/auth-context";
import { createInvitation } from "@/lib/supabase/organization";

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "editor", "viewer"]),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;

  const authResult = await requireOrgAuth(orgId, "manageMembers");
  if (authResult instanceof NextResponse) return authResult;

  const { userId } = authResult;

  const body: unknown = await request.json();
  const parsed = inviteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { email, role } = parsed.data;

  const invitation = await createInvitation(orgId, email, role, userId);

  if (!invitation) {
    return NextResponse.json(
      { error: "Failed to create invitation" },
      { status: 500 }
    );
  }

  return NextResponse.json(invitation, { status: 201 });
}
