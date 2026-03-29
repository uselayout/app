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
 * Resolve CSS variable references in a token value using a lookup map.
 * Handles var(--name), var(--name, fallback), and nested references (up to 5 passes).
 * For color-mix() expressions, resolves inner var() refs then extracts the first
 * colour argument as a best-effort displayable value.
 */
export function resolveTokenValue(
  value: string,
  cssVariables: Record<string, string>
): string {
  if (!value.includes("var(")) return value;

  let resolved = value;

  // Iteratively resolve var() references (handles nesting up to 5 levels)
  for (let i = 0; i < 5; i++) {
    const before = resolved;
    resolved = resolved.replace(
      /var\(\s*(--[a-zA-Z0-9_-]+)\s*(?:,\s*([^)]+))?\)/g,
      (_match, varName: string, fallback: string | undefined) => {
        const looked = cssVariables[varName];
        if (looked) return looked;
        if (fallback) return fallback.trim();
        return _match; // keep original if unresolvable
      }
    );
    if (resolved === before) break; // no more substitutions
  }

  // For color-mix() that still can't be used as inline backgroundColor,
  // extract the first colour argument as a best-effort swatch colour
  if (resolved.startsWith("color-mix(")) {
    const colourMatch = resolved.match(
      /color-mix\(\s*in\s+\w+\s*,\s*(#[0-9a-f]{3,8}|rgba?\([^)]+\))/i
    );
    if (colourMatch) return colourMatch[1];
  }

  return resolved;
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
