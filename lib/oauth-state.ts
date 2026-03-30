import crypto from "crypto";

interface OAuthStatePayload {
  orgId: string;
  nonce: string;
}

const SECRET =
  process.env.BETTER_AUTH_SECRET ?? process.env.AUTH_SECRET ?? "";

function hmac(data: string): string {
  return crypto.createHmac("sha256", SECRET).update(data).digest("hex");
}

/**
 * Create an HMAC-signed OAuth state parameter.
 * Prevents attackers from crafting arbitrary orgId values.
 */
export function signOAuthState(payload: OAuthStatePayload): string {
  const data = JSON.stringify(payload);
  const sig = hmac(data);
  return Buffer.from(JSON.stringify({ ...payload, sig })).toString("base64url");
}

/**
 * Verify and decode an HMAC-signed OAuth state parameter.
 * Returns the payload if valid, null if tampered or malformed.
 */
export function verifyOAuthState(
  stateParam: string,
): OAuthStatePayload | null {
  try {
    const parsed = JSON.parse(
      Buffer.from(stateParam, "base64url").toString(),
    ) as OAuthStatePayload & { sig: string };

    const { sig, ...payload } = parsed;
    const expected = hmac(JSON.stringify(payload));

    if (
      !sig ||
      !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
