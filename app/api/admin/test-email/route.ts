import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/api/admin-context";
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

const Schema = z.object({
  to: z.string().email(),
  fromEmail: z.string().optional(),
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

  const { to, fromEmail } = parsed.data;
  const from =
    fromEmail && SENDER_OPTIONS[fromEmail]
      ? SENDER_OPTIONS[fromEmail]
      : undefined;

  const result = await sendEmail({
    to,
    subject: `[TEST] ${welcomeEmailSubject()}`,
    html: welcomeEmailHtml({ name: "Test User", inviteCode: "TEST1234" }),
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
