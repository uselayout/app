/**
 * Rename a CSS custom property throughout an entire layout.md string.
 * Updates:
 *  1. The declaration itself (--old-name: value → --new-name: value)
 *  2. All var(--old-name) references in other token values
 *  3. All plain-text mentions of --old-name in prose/tables/comments
 *
 * Returns the updated markdown, or null if the old name was not found at all.
 */
export function renameTokenInLayoutMd(
  markdown: string,
  oldName: string,
  newName: string
): string | null {
  if (oldName === newName) return null;

  // Escape for use in regex
  const escaped = oldName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // Match the old name as a whole token (word boundary after --)
  // This catches: declarations, var() references, and prose mentions
  const globalRegex = new RegExp(escaped + "(?=[\\s:;,)\\]}\"'`]|$)", "g");

  let found = false;
  const result = markdown.replace(globalRegex, () => {
    found = true;
    return newName;
  });

  return found ? result : null;
}

/**
 * Count how many times a token name appears in layout.md
 * (declarations + var() references + prose mentions).
 */
export function countTokenReferences(
  markdown: string,
  tokenName: string
): number {
  const escaped = tokenName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const globalRegex = new RegExp(escaped + "(?=[\\s:;,)\\]}\"'`]|$)", "g");
  const matches = markdown.match(globalRegex);
  return matches ? matches.length : 0;
}
