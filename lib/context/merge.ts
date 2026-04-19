import type { ContextDocument, ContextFile } from "@/lib/types";

/**
 * Merge project-scoped ContextDocuments with session-scoped ContextFiles.
 *
 * Rules:
 *   - Pinned project docs come first, then unpinned
 *   - Session files win on name collision (user intent for this generation
 *     overrides the durable project attachment)
 *   - Result stays within the 3-file explore-route cap by truncating
 *     (session files preserved first)
 */
export function mergeContextForGeneration(opts: {
  projectDocs: ContextDocument[];
  sessionFiles: ContextFile[] | undefined;
  includeProjectContext: boolean;
  maxFiles?: number;
}): ContextFile[] | undefined {
  const max = opts.maxFiles ?? 3;
  const session = opts.sessionFiles ?? [];

  if (!opts.includeProjectContext || opts.projectDocs.length === 0) {
    return session.length > 0 ? session : undefined;
  }

  const sessionNames = new Set(session.map((f) => f.name));
  const sortedProjectDocs = [...opts.projectDocs].sort(
    (a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned))
  );

  const projectAsFiles: ContextFile[] = sortedProjectDocs
    .filter((doc) => !sessionNames.has(doc.name))
    .map((doc) => ({ name: doc.name, content: doc.content }));

  const merged = [...session, ...projectAsFiles].slice(0, max);
  return merged.length > 0 ? merged : undefined;
}
