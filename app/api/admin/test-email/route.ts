import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/api/admin-context";
import { sendEmail } from "@/lib/email/send";
import { resolveSender } from "@/lib/email/senders";
import {
  welcomeEmailHtml,
  welcomeEmailSubject,
} from "@/lib/email/templates/welcome";
import {
  reminderEmailHtml,
  reminderEmailSubject,
} from "@/lib/email/templates/reminder";

const Schema = z.object({
  to: z.string().email(),
  fromEmail: z.string().optional(),
  template: z.enum(["welcome", "reminder", "final_reminder"]).optional(),
});

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

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

  const { to, fromEmail, template = "welcome" } = parsed.data;
  const from = resolveSender(fromEmail);

  let subject: string;
  let html: string;
  const testParams = { name: "Test User", inviteCode: "TEST1234" };

  switch (template) {
    case "reminder":
      subject = reminderEmailSubject(false);
      html = reminderEmailHtml({ ...testParams, isFinal: false });
      break;
    case "final_reminder":
      subject = reminderEmailSubject(true);
      html = reminderEmailHtml({ ...testParams, isFinal: true });
      break;
    default:
      subject = welcomeEmailSubject();
      html = welcomeEmailHtml(testParams);
      break;
  }

  const result = await sendEmail({
    to,
    subject: `[TEST] ${subject}`,
    html,
    from,
  });

  if (!result.success) {
    return NextResponse.json(
      { error: "Failed to send", details: result.error },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, skipped: "skipped" in result });
}
