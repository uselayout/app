import { Resend } from "resend";

const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "Layout <noreply@layout.design>";

let _resend: Resend | null = null;
function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}

export async function sendEmail({ to, subject, html, from, replyTo }: SendEmailOptions) {
  const resend = getResend();
  if (!resend) {
    console.warn("RESEND_API_KEY not set - skipping email send to", to);
    return { success: true, skipped: true };
  }

  const fromAddr = from || FROM_EMAIL;
  // Extract email from "Name <email>" format for replyTo fallback
  const emailMatch = fromAddr.match(/<(.+)>/);
  const resolvedReplyTo = replyTo || (emailMatch ? emailMatch[1] : fromAddr);

  const { data, error } = await resend.emails.send({
    from: fromAddr,
    to,
    subject,
    html,
    replyTo: resolvedReplyTo,
  });

  if (error) {
    console.error("Failed to send email:", error);
    return { success: false, error };
  }

  return { success: true, id: data?.id };
}
