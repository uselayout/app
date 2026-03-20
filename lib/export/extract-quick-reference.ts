/**
 * Extract the Quick Reference section (Section 0) from a layout.md string.
 * Shared by claude-md, agents-md, and any future export generators.
 */
export function extractQuickReference(layoutMd: string): string {
  // Match "## 0. Quick Reference" followed by content until the next numbered section
  const quickRefMatch = layoutMd.match(
    /## 0\. Quick Reference\s*\n([\s\S]*?)(?=\n## \d|$)/
  );
  if (quickRefMatch) {
    return quickRefMatch[1].trim();
  }
  return `- Follow the layout.md specification for all design decisions
- Never hardcode colour values — use CSS custom properties
- Use the specified font family and weights only
- Every interactive element must handle: default, hover, focus, active, disabled, loading, error states`;
}
