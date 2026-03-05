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

export async function validateExtractionUrl(rawUrl: string): Promise<URL> {
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
  try {
    const { address } = await dns.lookup(hostname);
    if (isPrivateIp(address)) {
      throw new SsrfError(
        "Requests to private/internal IP addresses are not allowed"
      );
    }
  } catch (err) {
    if (err instanceof SsrfError) throw err;
    throw new SsrfError(`Could not resolve hostname: ${hostname}`);
  }

  return parsed;
}
