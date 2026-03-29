import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/api/admin-context";
import { supabase } from "@/lib/supabase/client";
import { sendEmail } from "@/lib/email/send";
import { resolveSender } from "@/lib/email/senders";
import { logEmail } from "@/lib/email/log";
import type { EmailType } from "@/lib/email/log";
import {
  welcomeEmailHtml,
  welcomeEmailSubject,
} from "@/lib/email/templates/welcome";
import {
  reminderEmailHtml,
  reminderEmailSubject,
} from "@/lib/email/templates/reminder";

const Schema = z.object({
  fromEmail: z.string().optional(),
  type: z.enum(["welcome", "reminder", "final_reminder"]),
});

export async function POST(
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

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { fromEmail, type } = parsed.data;

  // Fetch access request with invite code status
  const { data: req, error: fetchErr } = await supabase
    .from("access_requests")
    .select("id, name, email, status, invite_code")
    .eq("id", id)
    .single();

  if (fetchErr || !req) {
    return NextResponse.json(
      { error: "Access request not found" },
      { status: 404 }
    );
  }

  if (req.status !== "approved") {
    return NextResponse.json(
      { error: "Can only resend emails for approved requests" },
      { status: 400 }
    );
  }

  if (!req.invite_code) {
    return NextResponse.json(
      { error: "No invite code assigned" },
      { status: 400 }
    );
  }

  // Check the code hasn't been redeemed
  const { data: codeRow } = await supabase
    .from("invite_codes")
    .select("redeemed_by")
    .eq("code", req.invite_code)
    .single();

  if (codeRow?.redeemed_by) {
    return NextResponse.json(
      { error: "User has already signed up" },
      { status: 400 }
    );
  }

  // Build email based on type
  const from = resolveSender(fromEmail);
  let subject: string;
  let html: string;

  switch (type) {
    case "welcome":
      subject = welcomeEmailSubject();
      html = welcomeEmailHtml({
        name: req.name as string,
        inviteCode: req.invite_code as string,
      });
      break;
    case "reminder":
      subject = reminderEmailSubject(false);
      html = reminderEmailHtml({
        name: req.name as string,
        inviteCode: req.invite_code as string,
        isFinal: false,
      });
      break;
    case "final_reminder":
      subject = reminderEmailSubject(true);
      html = reminderEmailHtml({
        name: req.name as string,
        inviteCode: req.invite_code as string,
        isFinal: true,
      });
      break;
  }

  const result = await sendEmail({
    to: req.email as string,
    subject,
    html,
    from,
  });

  const emailSent = result.success && !("skipped" in result);

  if (emailSent) {
    await logEmail({
      accessRequestId: id,
      emailType: type as EmailType,
      fromEmail: fromEmail ?? undefined,
      resendId: "id" in result ? (result.id as string) : undefined,
    });
  }

  if (!result.success) {
    console.error("Resend email failed for", req.email, result.error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, emailSent });
}
