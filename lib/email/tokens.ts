export const EMAIL_TOKENS = ["{{firstName}}", "{{name}}", "{{email}}"] as const;

export function substituteRecipientTokens(
  input: string,
  recipient: { email: string; name: string | null | undefined },
): string {
  const localPart = recipient.email.split("@")[0] ?? "";
  const niceLocalPart = localPart.charAt(0).toUpperCase() + localPart.slice(1);

  const fullName = (recipient.name || "").trim() || niceLocalPart || "there";
  const firstName = fullName.split(/\s+/)[0] || fullName;

  return input
    .replace(/\{\{\s*firstName\s*\}\}/gi, firstName)
    .replace(/\{\{\s*name\s*\}\}/gi, fullName)
    .replace(/\{\{\s*email\s*\}\}/gi, recipient.email);
}
