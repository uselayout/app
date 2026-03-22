import { promises as dns } from "dns";

const BLOCKED_CIDRS = [
  // Loopback
  /^127\./,
  /^::1$/,
  /^0\.0\.0\.0/,
  // Private networks
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[01])\./,
  /^192\.168\./,
  // Link-local / cloud metadata
  /^169\.254\./,
  /^fe80:/i,
  // Unique local (IPv6 private)
  /^fc/i,
  /^fd/i,
  // IPv4-mapped IPv6 addresses (e.g. ::ffff:127.0.0.1)
  /^::ffff:127\./i,
  /^::ffff:10\./i,
  /^::ffff:172\.(1[6-9]|2[0-9]|3[01])\./i,
  /^::ffff:192\.168\./i,
  /^::ffff:169\.254\./i,
  /^::ffff:0\.0\.0\.0/i,
];

function isPrivateIp(ip: string): boolean {
  return BLOCKED_CIDRS.some((re) => re.test(ip));
}

export class SsrfError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SsrfError";
  }
}

/**
 * Validate a URL for SSRF safety and return the resolved IP address.
 * The caller should use the returned IP to connect, avoiding DNS rebinding.
 */
export async function validateExtractionUrl(
  rawUrl: string
): Promise<{ url: URL; resolvedIp: string }> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new SsrfError("Invalid URL format");
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new SsrfError(
      `Protocol "${parsed.protocol}" is not allowed. Only http and https are supported.`
    );
  }

  const hostname = parsed.hostname;

  // Reject bare IP literals that are obviously private
  if (isPrivateIp(hostname)) {
    throw new SsrfError(
      "Requests to private/internal IP addresses are not allowed"
    );
  }

  // Resolve hostname and check resulting IPs
  let resolvedIp: string;
  try {
    const { address } = await dns.lookup(hostname);
    resolvedIp = address;
    if (isPrivateIp(address)) {
      throw new SsrfError(
        "Requests to private/internal IP addresses are not allowed"
      );
    }
  } catch (err) {
    if (err instanceof SsrfError) throw err;
    throw new SsrfError(`Could not resolve hostname: ${hostname}`);
  }

  return { url: parsed, resolvedIp };
}
