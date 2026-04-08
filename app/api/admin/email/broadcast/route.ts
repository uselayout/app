import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { requireAdmin } from "@/lib/api/admin-context";
import { supabase } from "@/lib/supabase/client";
import { sendEmail } from "@/lib/email/send";
import { resolveSender } from "@/lib/email/senders";
import { wrapBroadcastHtml } from "@/lib/email/templates/broadcast-wrapper";
import { outreachEmailHtml } from "@/lib/email/templates/outreach";
import { logBroadcastEmail } from "@/lib/email/log";
import { getSuppressedEmails } from "@/lib/email/suppression";
import { generateUnsubscribeUrl } from "@/lib/email/unsubscribe";

const BroadcastSchema = z.object({
  subject: z.string().min(1).max(200),
  bodyHtml: z.string().min(1),
  segment: z.enum(["all_users", "approved_not_signed_up", "individual", "outreach"]),
  individualEmails: z.array(z.string().email()).optional(),
  outreachRecipients: z.array(z.object({ email: z.string().email(), name: z.string() })).optional(),
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

  const { subject, bodyHtml, segment, individualEmails, outreachRecipients, fromEmail } = parsed.data;
  const isOutreach = segment === "outreach";

  let recipients: Array<{ email: string; name: string }>;
  if (isOutreach && outreachRecipients) {
    recipients = outreachRecipients;
  } else {
    recipients = await resolveRecipients(segment, individualEmails);
  }

  // Filter out suppressed emails
  const suppressed = await getSuppressedEmails(recipients.map((r) => r.email));
  recipients = recipients.filter((r) => !suppressed.has(r.email.toLowerCase()));

  if (recipients.length === 0) {
    return NextResponse.json({ error: "No recipients found (all may be suppressed)" }, { status: 400 });
  }

  const from = resolveSender(fromEmail);
  // Extract sender name for outreach template (e.g. "Matt from Layout" from "Matt from Layout <matt@...>")
  const senderDisplayName = from?.replace(/<[^>]+>/, "").trim();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          // Controller closed — client disconnected
        }
      };

      let sent = 0;
      let failed = 0;

      for (const recipient of recipients) {
        let html: string;
        let headers: Record<string, string> | undefined;

        if (isOutreach) {
          const unsubUrl = generateUnsubscribeUrl(recipient.email);
          html = outreachEmailHtml({
            name: recipient.name,
            bodyHtml,
            unsubscribeUrl: unsubUrl,
            senderName: senderDisplayName,
          });
          headers = { "List-Unsubscribe": `<${unsubUrl}>` };
        } else {
          html = wrapBroadcastHtml(bodyHtml);
        }

        try {
          const result = await sendEmail({
            to: recipient.email,
            subject,
            html,
            from,
            headers,
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
                html,
                from,
                headers,
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
