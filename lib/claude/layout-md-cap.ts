/**
 * Post-hoc enforcement for Section 0 (Quick Reference) length. The synthesis
 * prompt declares a 75-line cap; the LLM will usually comply but may overshoot.
 * This helper trims the Quick Reference block if it exceeds the cap, preserving
 * any trailing fenced code block boundaries.
 *
 * The cap is applied between the "## 0. Quick Reference" heading (exclusive)
 * and the next top-level "## " heading (exclusive). Leading and trailing blank
 * lines are preserved; if a fenced ```...``` block would be split, the trim
 * snaps to the closing ``` so the resulting markdown stays valid.
 */
export function capQuickReferenceInLayoutMd(
  markdown: string,
  maxBodyLines = 75
): string {
  const headingRegex = /^##\s*0\.\s*Quick\s+Reference\b.*$/im;
  const start = markdown.match(headingRegex);
  if (!start || start.index === undefined) return markdown;

  const headingEnd = start.index + start[0].length;

  // Find the next "## " heading (case-insensitive on the digit).
  const rest = markdown.slice(headingEnd);
  const nextHeading = rest.search(/^##\s+\d+\./m);
  const sectionEndAbs = nextHeading === -1 ? markdown.length : headingEnd + nextHeading;

  const body = markdown.slice(headingEnd + 1, sectionEndAbs);
  const bodyLines = body.split("\n");
  if (bodyLines.length <= maxBodyLines) return markdown;

  let trimmed = bodyLines.slice(0, maxBodyLines).join("\n");

  // If the trim landed inside a fenced code block, cut back to just before
  // the unclosed fence so the output stays valid markdown.
  const fenceCount = (trimmed.match(/^```/gm) ?? []).length;
  if (fenceCount % 2 === 1) {
    const lastFence = trimmed.lastIndexOf("\n```");
    if (lastFence >= 0) trimmed = trimmed.slice(0, lastFence);
  }

  const notice = "\n\n<!-- Quick Reference truncated to fit the 75-line cap. See later sections for the full design system. -->\n";

  return markdown.slice(0, headingEnd + 1) + trimmed + notice + markdown.slice(sectionEndAbs);
}
