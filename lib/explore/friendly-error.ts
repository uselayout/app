export function friendlyError(err: { error?: string; type?: string }): string {
  const type = err.type ?? "";
  const msg = err.error ?? "";

  if (type === "overloaded_error" || msg.includes("overloaded"))
    return "Claude is currently overloaded. Please wait a moment and try again.";
  if (type === "rate_limit_error" || msg.includes("rate limit"))
    return "Rate limit reached. Please wait a moment and try again.";
  if (msg.includes("authentication") || msg.includes("401"))
    return "Authentication failed. Check your API key in Settings.";
  if (msg.includes("NO_API_KEY") || msg.includes("402"))
    return msg; // Already user-friendly from our backend

  return msg || "Something went wrong. Please try again.";
}
