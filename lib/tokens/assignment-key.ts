// Canonical key helper for ProjectStandardisation.assignments.
//
// The record is keyed by a compound string so one role can host multiple
// mode-scoped assignments (e.g. "bg-app" for light, "bg-app::dark" for dark)
// without changing the surrounding data shape. Always go through this helper
// rather than concatenating keys by hand; the separator is deliberate and
// invalid inside role keys themselves.

export const MODE_SEPARATOR = "::";

export function assignmentKey(roleKey: string, mode?: string): string {
  return mode ? `${roleKey}${MODE_SEPARATOR}${mode}` : roleKey;
}

/** Inverse of assignmentKey. Returns the roleKey and mode (undefined for default). */
export function parseAssignmentKey(key: string): { roleKey: string; mode?: string } {
  const idx = key.indexOf(MODE_SEPARATOR);
  if (idx === -1) return { roleKey: key };
  return { roleKey: key.slice(0, idx), mode: key.slice(idx + MODE_SEPARATOR.length) };
}
