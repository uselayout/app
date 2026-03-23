/**
 * Replace a CSS custom property value inside fenced CSS blocks of a layout.md string.
 * Returns the updated markdown, or null if the token was not found in any CSS block.
 */
export function replaceTokenInLayoutMd(
  markdown: string,
  tokenName: string,
  newValue: string
): string | null {
  const fencedBlockRegex = /```css\s*\n([\s\S]*?)```/gi;
  let result = markdown;
  let found = false;
  let offset = 0;

  // Reset regex state
  fencedBlockRegex.lastIndex = 0;

  let blockMatch: RegExpExecArray | null;
  while ((blockMatch = fencedBlockRegex.exec(markdown)) !== null) {
    const blockStart = blockMatch.index + blockMatch[0].indexOf(blockMatch[1]);
    const blockContent = blockMatch[1];

    // Find the token declaration within this block
    const escaped = tokenName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const declRegex = new RegExp(`(${escaped}\\s*:\\s*)([^;]+)(;)`, "g");

    let declMatch: RegExpExecArray | null;
    while ((declMatch = declRegex.exec(blockContent)) !== null) {
      found = true;
      const absoluteStart = blockStart + declMatch.index + declMatch[1].length;
      const oldValueLength = declMatch[2].length;

      // Apply replacement accounting for prior offset changes
      const adjustedStart = absoluteStart + offset;
      result =
        result.slice(0, adjustedStart) +
        newValue +
        result.slice(adjustedStart + oldValueLength);

      offset += newValue.length - oldValueLength;
    }
  }

  return found ? result : null;
}
