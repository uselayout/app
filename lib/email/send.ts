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
  text?: string;
  from?: string;
  replyTo?: string;
  headers?: Record<string, string>;
}

function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&ndash;/g, "-")
    .replace(/&mdash;/g, "-")
    .replace(/&middot;/g, ".")
    .replace(/&nbsp;/g, " ")
    .replace(/&#\d+;/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function sendEmail({ to, subject, html, text, from, replyTo, headers }: SendEmailOptions) {
  const resend = getResend();
  if (!resend) {
    console.warn("RESEND_API_KEY not set - skipping email send to", to);
    return { success: true, skipped: true };
  }

  const fromAddr = from || FROM_EMAIL;
  // Extract email from "Name <email>" format for replyTo fallback
  const emailMatch = fromAddr.match(/<(.+)>/);
  const resolvedReplyTo = replyTo || (emailMatch ? emailMatch[1] : fromAddr);

  // Resend requires an array for multiple recipients
  const toAddresses = to.includes(",")
    ? to.split(",").map((e) => e.trim()).filter(Boolean)
    : to;

  const plainText = text || htmlToText(html);

  const { data, error } = await resend.emails.send({
    from: fromAddr,
    to: toAddresses,
    subject,
    html,
    text: plainText,
    replyTo: resolvedReplyTo,
    ...(headers ? { headers } : {}),
  });

  if (error) {
    console.error("Failed to send email:", error);
    return { success: false, error };
  }

  return { success: true, id: data?.id };
}
