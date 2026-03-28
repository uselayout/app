import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/api/admin-context";
import { createInviteCodes } from "@/lib/supabase/invite-codes";
import { supabase } from "@/lib/supabase/client";
import { sendEmail } from "@/lib/email/send";
import {
  welcomeEmailHtml,
  welcomeEmailSubject,
} from "@/lib/email/templates/welcome";

const SENDER_OPTIONS: Record<string, string> = {
  "matt@layout.design": "Matt from Layout <matt@layout.design>",
  "ben@layout.design": "Ben from Layout <ben@layout.design>",
  "hello@layout.design": "Layout <hello@layout.design>",
};

const PatchSchema = z.object({
  status: z.enum(["approved", "rejected"]).optional(),
  inviteCode: z.string().optional(),
  email: z.string().email().optional(),
  name: z.string().min(1).optional(),
  whatBuilding: z.string().optional(),
  howHeard: z.string().optional(),
  fromEmail: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { status, inviteCode, email, name, whatBuilding, howHeard, fromEmail } = parsed.data;

  // If approving without a code, auto-generate one
  let resolvedCode = inviteCode;
  if (status === "approved" && !resolvedCode) {
    try {
      const [generated] = await createInviteCodes(auth.userId, 1);
      resolvedCode = generated.code;
    } catch (err) {
      return NextResponse.json(
        {
          error: err instanceof Error ? err.message : "Failed to generate code",
        },
        { status: 500 }
      );
    }
  }

  const updatePayload: Record<string, string | null> = {};
  if (status) updatePayload.status = status;
  if (resolvedCode) updatePayload.invite_code = resolvedCode;
  if (email) updatePayload.email = email;
  if (name) updatePayload.name = name;
  if (whatBuilding) updatePayload.what_building = whatBuilding;
  if (howHeard) updatePayload.how_heard = howHeard;

  if (Object.keys(updatePayload).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("access_requests")
    .update(updatePayload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: `Failed to update access request: ${error.message}` },
      { status: 500 }
    );
  }

  // Send welcome email on approval
  let emailSent = false;
  if (status === "approved" && resolvedCode && data) {
    const recipientEmail = (data as Record<string, string>).email;
    const recipientName = (data as Record<string, string>).name;
    if (recipientEmail && recipientName) {
      const from = fromEmail && SENDER_OPTIONS[fromEmail]
        ? SENDER_OPTIONS[fromEmail]
        : undefined;
      const result = await sendEmail({
        to: recipientEmail,
        subject: welcomeEmailSubject(),
        html: welcomeEmailHtml({ name: recipientName, inviteCode: resolvedCode }),
        from,
      });
      emailSent = result.success && !("skipped" in result);
      if (!result.success) {
        console.error("Welcome email failed for", recipientEmail, result.error);
      }
    }
  }

  return NextResponse.json({
    request: data,
    inviteCode: resolvedCode ?? null,
    emailSent,
  });
}
