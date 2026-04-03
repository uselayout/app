import crypto from "crypto";

const SECRET =
  process.env.UNSUBSCRIBE_SECRET || process.env.RESEND_API_KEY || "fallback-dev-secret";

function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

/** Generate an HMAC token for an email address */
function sign(email: string): string {
  return crypto
    .createHmac("sha256", SECRET)
    .update(email.toLowerCase())
    .digest("hex");
}

/** Generate a full unsubscribe URL for an email */
export function generateUnsubscribeUrl(email: string): string {
  const token = sign(email);
  const encoded = encodeURIComponent(email.toLowerCase());
  return `${getAppUrl()}/api/email/unsubscribe?email=${encoded}&token=${token}`;
}

/** Verify an unsubscribe token matches the email */
export function verifyUnsubscribeToken(
  email: string,
  token: string
): boolean {
  const expected = sign(email);
  return crypto.timingSafeEqual(
    Buffer.from(token, "hex"),
    Buffer.from(expected, "hex")
  );
}
