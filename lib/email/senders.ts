export const SENDER_OPTIONS: Record<string, string> = {
  "matt@layout.design": "Matt from Layout <matt@layout.design>",
  "ben@layout.design": "Ben from Layout <ben@layout.design>",
  "hello@layout.design": "Layout <hello@layout.design>",
};

export function resolveSender(fromEmail?: string): string | undefined {
  return fromEmail && SENDER_OPTIONS[fromEmail]
    ? SENDER_OPTIONS[fromEmail]
    : undefined;
}
