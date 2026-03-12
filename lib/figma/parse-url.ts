/**
 * Parse a Figma design URL into fileKey and nodeId.
 * Handles URLs like: figma.com/design/FILE_KEY/File-Name?node-id=1-2
 */
export function parseFigmaUrl(
  url: string
): { fileKey: string; nodeId: string } | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const match = u.pathname.match(/\/design\/([^/]+)/);
    if (!match) return null;
    const fileKey = match[1];
    const nodeId = u.searchParams.get("node-id")?.replaceAll("-", ":") ?? "";
    if (!nodeId) return null;
    return { fileKey, nodeId };
  } catch {
    return null;
  }
}
