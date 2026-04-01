import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { requireAdmin } from "@/lib/api/admin-context";
import { supabase } from "@/lib/supabase/client";
import { sendEmail } from "@/lib/email/send";
import { resolveSender } from "@/lib/email/senders";
import { wrapBroadcastHtml } from "@/lib/email/templates/broadcast-wrapper";
import { logBroadcastEmail } from "@/lib/email/log";

const BroadcastSchema = z.object({
  subject: z.string().min(1).max(200),
  bodyHtml: z.string().min(1),
  segment: z.enum(["all_users", "approved_not_signed_up", "individual"]),
  individualEmails: z.array(z.string().email()).optional(),
  fromEmail: z.string().optional(),
});

async function resolveRecipients(
  segment: string,
  individualEmails?: string[]
): Promise<Array<{ email: string; name: string }>> {
  if (segment === "individual" && individualEmails) {
    return individualEmails.map((email) => ({ email, name: "" }));
  }

  if (segment === "all_users") {
    const { data } = await supabase
      .from("layout_user")
      .select("email, name")
      .order("email");
    return (data ?? []).map((u) => ({
      email: u.email as string,
      name: (u.name as string) ?? "",
    }));
  }

  if (segment === "approved_not_signed_up") {
    const { data: approved } = await supabase
      .from("access_requests")
      .select("name, email, invite_code")
      .eq("status", "approved")
      .order("email");

    const codes = (approved ?? [])
      .map((r) => r.invite_code)
      .filter((c): c is string => c !== null);

    let redeemedCodes = new Set<string>();
    if (codes.length > 0) {
      const { data: redeemed } = await supabase
        .from("invite_codes")
        .select("code")
        .in("code", codes)
        .not("redeemed_by", "is", null);
      redeemedCodes = new Set((redeemed ?? []).map((r) => r.code as string));
    }

    return (approved ?? [])
      .filter((r) => !r.invite_code || !redeemedCodes.has(r.invite_code))
      .map((r) => ({ email: r.email as string, name: (r.name as string) ?? "" }));
  }

  return [];
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = BroadcastSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { subject, bodyHtml, segment, individualEmails, fromEmail } = parsed.data;
  const recipients = await resolveRecipients(segment, individualEmails);

  if (recipients.length === 0) {
    return NextResponse.json({ error: "No recipients found" }, { status: 400 });
  }

  const wrappedHtml = wrapBroadcastHtml(bodyHtml);
  const from = resolveSender(fromEmail);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      let sent = 0;
      let failed = 0;

      for (const recipient of recipients) {
        try {
          const result = await sendEmail({
            to: recipient.email,
            subject,
            html: wrappedHtml,
            from,
          });

          await logBroadcastEmail({
            recipientEmail: recipient.email,
            subject,
            fromEmail,
            resendId: result.id,
          });

          sent++;
        } catch (err) {
          // Retry once on rate limit
          if (err && typeof err === "object" && "statusCode" in err && (err as { statusCode: number }).statusCode === 429) {
            await new Promise((r) => setTimeout(r, 1000));
            try {
              const retryResult = await sendEmail({
                to: recipient.email,
                subject,
                html: wrappedHtml,
                from,
              });
              await logBroadcastEmail({
                recipientEmail: recipient.email,
                subject,
                fromEmail,
                resendId: retryResult.id,
              });
              sent++;
            } catch {
              failed++;
            }
          } else {
            failed++;
          }
        }

        send({
          type: "progress",
          total: recipients.length,
          sent,
          failed,
          current: recipient.email,
        });
      }

      send({ type: "done", total: recipients.length, sent, failed });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
