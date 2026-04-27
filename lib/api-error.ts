/**
 * Shared error helpers for Claude/Anthropic API errors.
 * Used by both layout-md synthesis and Explorer generation paths.
 */

interface ApiErrorLike {
  error?: string;
  type?: string;
  status?: number;
  message?: string;
}

function extractErrorInfo(err: unknown): ApiErrorLike {
  if (err instanceof Error) {
    const e = err as unknown as Record<string, unknown>;
    return {
      type: typeof e.type === "string" ? e.type : undefined,
      error: err.message,
      status: typeof e.status === "number" ? e.status : undefined,
    };
  }
  if (err && typeof err === "object") {
    const e = err as Record<string, unknown>;
    return {
      type: typeof e.type === "string" ? e.type : undefined,
      error:
        typeof e.error === "string"
          ? e.error
          : typeof e.message === "string"
            ? e.message
            : undefined,
      status: typeof e.status === "number" ? e.status : undefined,
    };
  }
  return { error: String(err) };
}

/**
 * Returns true for transient API errors that are safe to retry
 * (overloaded, rate limited, 529 status).
 */
export function isTransientError(err: unknown): boolean {
  const info = extractErrorInfo(err);
  if (info.type === "overloaded_error") return true;
  if (info.type === "rate_limit_error") return true;
  if (info.status === 529) return true;
  if (info.error?.includes("overloaded")) return true;
  if (info.error?.includes("rate limit")) return true;
  return false;
}

export type ApiErrorClass =
  | "credit_balance_exhausted"
  | "context_too_large"
  | "authentication"
  | "rate_limited"
  | "overloaded";

/**
 * Classifies an Anthropic/Google/etc API error into a stable category for
 * logging and admin filtering. Returns a normalised HTTP status so downstream
 * logs accurately reflect billing vs. server issues — an exhausted credit
 * balance is a 402, not a 500.
 */
export function classifyApiError(err: unknown): {
  errorClass: ApiErrorClass | null;
  status: number;
} {
  const info = extractErrorInfo(err);
  const type = info.type ?? "";
  const msg = info.error ?? "";

  if (type === "invalid_request_error" && /credit balance/i.test(msg)) {
    return { errorClass: "credit_balance_exhausted", status: 402 };
  }
  if (
    type === "invalid_request_error" &&
    (msg.includes("too many tokens") || msg.includes("context length") || msg.includes("too long"))
  ) {
    return { errorClass: "context_too_large", status: 400 };
  }
  if (info.status === 401 || /authentication|invalid api key/i.test(msg)) {
    return { errorClass: "authentication", status: 401 };
  }
  if (type === "rate_limit_error" || /rate limit/i.test(msg)) {
    return { errorClass: "rate_limited", status: 429 };
  }
  if (type === "overloaded_error" || info.status === 529 || /overloaded/i.test(msg)) {
    return { errorClass: "overloaded", status: 529 };
  }
  return { errorClass: null, status: typeof info.status === "number" ? info.status : 500 };
}

/**
 * Maps raw API errors to user-friendly messages.
 */
export function friendlyApiError(err: unknown): string {
  const info = extractErrorInfo(err);
  const type = info.type ?? "";
  const msg = info.error ?? "";

  if (type === "overloaded_error" || msg.includes("overloaded"))
    return "Claude is currently overloaded. Please wait a moment and try again.";
  if (type === "rate_limit_error" || msg.includes("rate limit"))
    return "Rate limit reached. Please wait a moment and try again.";
  if (
    type === "invalid_request_error" &&
    (msg.includes("too many tokens") || msg.includes("context length") || msg.includes("too long"))
  )
    return "This design system is too large for a single generation. Try a smaller file or reduce the number of styles.";
  if (type === "invalid_request_error" && /credit balance/i.test(msg))
    return "Your Anthropic API key is out of credits. Top up at console.anthropic.com and try again, or switch to hosted mode in Settings.";
  if (msg.includes("authentication") || msg.includes("401"))
    return "Authentication failed. Check your API key in Settings.";
  if (
    msg.includes("NO_API_KEY") ||
    msg.includes("402") ||
    type === "QUOTA_EXCEEDED" ||
    msg.includes("credits")
  )
    return msg; // Already user-friendly from our backend

  return msg || "Something went wrong. Please try again.";
}
