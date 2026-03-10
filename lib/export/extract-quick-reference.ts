/**
 * Extract the Quick Reference section (Section 0) from a DESIGN.md string.
 * Shared by claude-md, agents-md, and any future export generators.
 */
export function extractQuickReference(designMd: string): string {
  // Match "## 0. Quick Reference" followed by content until the next numbered section
  const quickRefMatch = designMd.match(
    /## 0\. Quick Reference\s*\n([\s\S]*?)(?=\n## \d|$)/
  );
  if (quickRefMatch) {
    return quickRefMatch[1].trim();
  }
  return `- Follow the DESIGN.md specification for all design decisions
- Never hardcode colour values — use CSS custom properties
- Use the specified font family and weights only
- Every interactive element must handle: default, hover, focus, active, disabled, loading, error states`;
}
