/**
 * Convert a CSS colour value to a hex string for use with <input type="color">.
 * Supports hex (3/4/6/8 digit), rgb(), rgba(). Returns null if not convertible.
 */
export function toHex(value: string): string | null {
  const trimmed = value.trim();

  // Already hex
  if (/^#[0-9a-f]{6}$/i.test(trimmed)) return trimmed.toLowerCase();
  if (/^#[0-9a-f]{3}$/i.test(trimmed)) {
    const [, r, g, b] = trimmed.match(/^#(.)(.)(.)$/)!;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  // 8-digit hex — drop alpha
  if (/^#[0-9a-f]{8}$/i.test(trimmed)) return trimmed.slice(0, 7).toLowerCase();
  // 4-digit hex — expand and drop alpha
  if (/^#[0-9a-f]{4}$/i.test(trimmed)) {
    const [, r, g, b] = trimmed.match(/^#(.)(.)(.).$/)!;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }

  // rgb(r, g, b) or rgba(r, g, b, a)
  const rgbMatch = trimmed.match(
    /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/
  );
  if (rgbMatch) {
    const [, r, g, b] = rgbMatch;
    return (
      "#" +
      [r, g, b]
        .map((c) =>
          Math.max(0, Math.min(255, parseInt(c, 10)))
            .toString(16)
            .padStart(2, "0")
        )
        .join("")
    );
  }

  return null;
}

/**
 * Check if a string looks like a CSS colour value.
 */
export function isColorValue(value: string): boolean {
  const v = value.trim();
  return (
    /^#[0-9a-f]{3,8}$/i.test(v) ||
    /^rgba?\(/i.test(v) ||
    /^hsla?\(/i.test(v) ||
    /^oklch\(/i.test(v) ||
    /^var\(/i.test(v)
  );
}
