export interface Patch {
  search: string;
  replace: string;
}

export type PatchApplyError =
  | { code: "NO_EDITS"; message: string }
  | { code: "SEARCH_NOT_FOUND"; message: string; search: string }
  | { code: "SEARCH_AMBIGUOUS"; message: string; search: string };

export interface PatchApplyResult {
  newLayoutMd: string;
  applied: number;
}

const BLOCK_REGEX =
  /<{3,}\s*SEARCH\s*\r?\n([\s\S]*?)\r?\n={3,}\s*\r?\n([\s\S]*?)\r?\n>{3,}\s*REPLACE/g;

export function parsePatches(output: string): Patch[] {
  const patches: Patch[] = [];
  BLOCK_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = BLOCK_REGEX.exec(output)) !== null) {
    patches.push({ search: match[1], replace: match[2] });
  }
  return patches;
}

function countOccurrences(haystack: string, needle: string): number {
  if (needle.length === 0) return 0;
  let count = 0;
  let idx = 0;
  while ((idx = haystack.indexOf(needle, idx)) !== -1) {
    count++;
    idx += needle.length;
  }
  return count;
}

function shortSearchForError(search: string): string {
  const firstLine = search.split("\n")[0].trim();
  return firstLine.length > 60 ? `${firstLine.slice(0, 60)}...` : firstLine;
}

export function applyPatches(
  layoutMd: string,
  patches: Patch[]
): { ok: true; result: PatchApplyResult } | { ok: false; error: PatchApplyError } {
  if (patches.length === 0) {
    return {
      ok: false,
      error: {
        code: "NO_EDITS",
        message:
          "No changes were produced. Try a more specific instruction or quote the exact text to change.",
      },
    };
  }

  let current = layoutMd;
  for (const patch of patches) {
    const count = countOccurrences(current, patch.search);
    if (count === 0) {
      return {
        ok: false,
        error: {
          code: "SEARCH_NOT_FOUND",
          message: `Couldn't locate text to edit near "${shortSearchForError(patch.search)}". Try quoting the exact phrase from layout.md.`,
          search: patch.search,
        },
      };
    }
    if (count > 1) {
      return {
        ok: false,
        error: {
          code: "SEARCH_AMBIGUOUS",
          message: `Edit target was ambiguous near "${shortSearchForError(patch.search)}". Add more surrounding context and retry.`,
          search: patch.search,
        },
      };
    }
    // Use function form to avoid $-pattern interpretation in the replacement string.
    const idx = current.indexOf(patch.search);
    current = current.slice(0, idx) + patch.replace + current.slice(idx + patch.search.length);
  }

  return { ok: true, result: { newLayoutMd: current, applied: patches.length } };
}
