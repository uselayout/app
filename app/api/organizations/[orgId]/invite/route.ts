import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOrgAuth } from "@/lib/api/auth-context";
import {
  createInvitation,
  getOrganization,
} from "@/lib/supabase/organization";
import { sendEmail } from "@/lib/email/send";
import {
  inviteEmailHtml,
  inviteEmailSubject,
} from "@/lib/email/templates/invite";

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

  const { userId, session } = authResult;

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

  // Send invite email (non-blocking — don't fail the request if email fails)
  const org = await getOrganization(orgId);
  const inviterName =
    session?.user?.name || session?.user?.email || "A team member";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const acceptUrl = `${appUrl}/invite/${invitation.token}`;

  sendEmail({
    to: email,
    subject: inviteEmailSubject(org?.name || "your team"),
    html: inviteEmailHtml({
      orgName: org?.name || "your team",
      inviterName,
      role,
      acceptUrl,
    }),
  }).catch((err) => {
    console.error("Failed to send invite email:", err);
  });

  return NextResponse.json(invitation, { status: 201 });
}
