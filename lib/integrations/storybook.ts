/**
 * Storybook CSF3 story parser.
 * Extracts component metadata from *.stories.ts/tsx files without
 * requiring Storybook as a runtime dependency.
 *
 * Uses regex-based parsing to avoid additional npm dependencies.
 */

import { readdir, readFile } from "fs/promises";
import { join, relative } from "path";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface StoryComponentMeta {
  /** Component name from the default export's title or component field */
  componentName: string;
  /** File path relative to project root */
  filePath: string;
  /** Resolved component import path (from the `component` field's import) */
  componentImportPath?: string;
  /** Args/props extracted from argTypes or args */
  args: StoryArg[];
  /** Named story exports */
  stories: string[];
  /** Tags from the meta (e.g. ['autodocs']) */
  tags: string[];
}

export interface StoryArg {
  name: string;
  type?: string;
  defaultValue?: string;
  options?: string[];
  description?: string;
}

// ─── Directories to skip when scanning ───────────────────────────────────────

const SKIP_DIRS = new Set([
  "node_modules",
  ".next",
  "dist",
  "build",
  "coverage",
  ".git",
  ".turbo",
]);

// ─── Prefixes to strip for fuzzy matching ────────────────────────────────────

const STRIP_PREFIXES = ["custom", "base", "app", "my"];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Extract the content of a balanced-brace block starting at the first `{`
 * found at or after `startIndex`.
 */
function extractBracedBlock(source: string, startIndex: number): string | null {
  const openIdx = source.indexOf("{", startIndex);
  if (openIdx === -1) return null;

  let depth = 0;
  for (let i = openIdx; i < source.length; i++) {
    if (source[i] === "{") depth++;
    else if (source[i] === "}") depth--;
    if (depth === 0) return source.slice(openIdx, i + 1);
  }
  return null;
}

/**
 * Extract the component name from a `title` field value.
 * e.g. "Components/Forms/Button" -> "Button"
 */
function componentNameFromTitle(title: string): string {
  const parts = title.split("/");
  return parts[parts.length - 1].trim();
}

/**
 * Parse argTypes block into StoryArg[].
 */
function parseArgTypes(argTypesBlock: string): StoryArg[] {
  const args: StoryArg[] = [];

  // Match top-level keys: `someProp: { ... }`
  const entryPattern = /(\w+)\s*:\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/g;
  let match: RegExpExecArray | null;

  while ((match = entryPattern.exec(argTypesBlock)) !== null) {
    const name = match[1];
    const body = match[2];

    const arg: StoryArg = { name };

    // Extract control.type or type.name
    const controlTypeMatch = body.match(
      /control\s*:\s*(?:\{\s*type\s*:\s*['"](\w+)['"]|['"](\w+)['"])/
    );
    if (controlTypeMatch) {
      arg.type = controlTypeMatch[1] ?? controlTypeMatch[2];
    }

    const typeNameMatch = body.match(/type\s*:\s*\{\s*name\s*:\s*['"](\w+)['"]/);
    if (typeNameMatch && !arg.type) {
      arg.type = typeNameMatch[1];
    }

    // Extract options array
    const optionsMatch = body.match(/options\s*:\s*\[([^\]]*)\]/);
    if (optionsMatch) {
      arg.options = optionsMatch[1]
        .split(",")
        .map((o) => o.trim().replace(/^['"]|['"]$/g, ""))
        .filter(Boolean);
    }

    // Extract description
    const descMatch = body.match(/description\s*:\s*['"]([^'"]*)['"]/);
    if (descMatch) {
      arg.description = descMatch[1];
    }

    args.push(arg);
  }

  return args;
}

/**
 * Parse args block to extract default values, merging with existing StoryArg[].
 */
function parseArgs(argsBlock: string, existingArgs: StoryArg[]): StoryArg[] {
  const argMap = new Map(existingArgs.map((a) => [a.name, a]));

  // Match key: value pairs (simple values only)
  const kvPattern = /(\w+)\s*:\s*(?:['"]([^'"]*)['"]\s*,?|(\w+)\s*,?|([\d.]+)\s*,?)/g;
  let match: RegExpExecArray | null;

  while ((match = kvPattern.exec(argsBlock)) !== null) {
    const name = match[1];
    const value = match[2] ?? match[3] ?? match[4];

    const existing = argMap.get(name);
    if (existing) {
      existing.defaultValue = value;
    } else {
      argMap.set(name, { name, defaultValue: value });
    }
  }

  return Array.from(argMap.values());
}

// ─── Main parser ─────────────────────────────────────────────────────────────

/**
 * Parse a single .stories.ts/.tsx file content and extract metadata.
 */
export function parseStoryFile(
  content: string,
  filePath: string
): StoryComponentMeta | null {
  // ── 1. Find the meta object ────────────────────────────────────────────

  // Pattern A: `export default { ... }` (inline)
  // Pattern B: `const meta = { ... }; export default meta;`
  // Pattern C: `const meta: Meta<typeof X> = { ... } satisfies Meta<...>; export default meta;`

  let metaBlock: string | null = null;

  // Try inline default export first
  const inlineDefaultMatch = content.match(/export\s+default\s*\{/);
  if (inlineDefaultMatch && inlineDefaultMatch.index !== undefined) {
    metaBlock = extractBracedBlock(content, inlineDefaultMatch.index);
  }

  // Try variable assignment patterns
  if (!metaBlock) {
    const varMetaMatch = content.match(
      /(?:const|let|var)\s+(\w+)\s*(?::\s*Meta\s*<[^>]*>\s*)?=\s*\{/
    );
    if (varMetaMatch && varMetaMatch.index !== undefined) {
      // Verify this variable is the default export
      const varName = varMetaMatch[1];
      const defaultExportPattern = new RegExp(
        `export\\s+default\\s+${varName}\\b`
      );
      if (defaultExportPattern.test(content)) {
        metaBlock = extractBracedBlock(content, varMetaMatch.index);
      }
    }
  }

  if (!metaBlock) return null;

  // ── 2. Extract title ───────────────────────────────────────────────────

  let componentName: string | undefined;

  const titleMatch = metaBlock.match(/title\s*:\s*['"]([^'"]+)['"]/);
  if (titleMatch) {
    componentName = componentNameFromTitle(titleMatch[1]);
  }

  // ── 3. Extract component field ─────────────────────────────────────────

  const componentFieldMatch = metaBlock.match(/component\s*:\s*(\w+)/);
  const componentFieldName = componentFieldMatch?.[1];

  // Fall back to component field name if no title
  if (!componentName && componentFieldName) {
    componentName = componentFieldName;
  }

  if (!componentName) return null;

  // ── 4. Resolve component import path ───────────────────────────────────

  let componentImportPath: string | undefined;
  if (componentFieldName) {
    // Look for: import { ComponentName } from '...' or import ComponentName from '...'
    const importPattern = new RegExp(
      `import\\s+(?:\\{[^}]*\\b${componentFieldName}\\b[^}]*\\}|${componentFieldName})\\s+from\\s+['"]([^'"]+)['"]`
    );
    const importMatch = content.match(importPattern);
    if (importMatch) {
      componentImportPath = importMatch[1];
    }
  }

  // ── 5. Extract argTypes ────────────────────────────────────────────────

  let args: StoryArg[] = [];

  const argTypesStart = metaBlock.match(/argTypes\s*:\s*\{/);
  if (argTypesStart && argTypesStart.index !== undefined) {
    const braceOffset = argTypesStart.index + argTypesStart[0].indexOf("{");
    const argTypesBlock = extractBracedBlock(metaBlock, braceOffset);
    if (argTypesBlock) {
      args = parseArgTypes(argTypesBlock);
    }
  }

  // ── 6. Extract args (default values) ───────────────────────────────────

  // Match `args:` that is NOT inside argTypes
  const argsStart = metaBlock.match(/(?<!\w)args\s*:\s*\{/);
  if (argsStart && argsStart.index !== undefined) {
    // Make sure this isn't the argTypes match
    const prefix = metaBlock.slice(0, argsStart.index);
    if (!prefix.endsWith("argType") && !prefix.endsWith("argTypes")) {
      const braceOffset = argsStart.index + argsStart[0].indexOf("{");
      const argsBlock = extractBracedBlock(metaBlock, braceOffset);
      if (argsBlock) {
        args = parseArgs(argsBlock, args);
      }
    }
  }

  // ── 7. Extract named story exports ─────────────────────────────────────

  const stories: string[] = [];
  const namedExportPattern =
    /export\s+(?:const|function)\s+(\w+)(?:\s*[=:({])/g;
  let storyMatch: RegExpExecArray | null;

  while ((storyMatch = namedExportPattern.exec(content)) !== null) {
    const name = storyMatch[1];
    if (name === "default") continue;
    stories.push(name);
  }

  // ── 8. Extract tags ────────────────────────────────────────────────────

  const tags: string[] = [];
  const tagsMatch = metaBlock.match(/tags\s*:\s*\[([^\]]*)\]/);
  if (tagsMatch) {
    const tagEntries = tagsMatch[1]
      .split(",")
      .map((t) => t.trim().replace(/^['"]|['"]$/g, ""))
      .filter(Boolean);
    tags.push(...tagEntries);
  }

  return {
    componentName,
    filePath,
    componentImportPath,
    args,
    stories,
    tags,
  };
}

// ─── Directory scanner ───────────────────────────────────────────────────────

/**
 * Scan a directory for .stories.ts/.tsx files and parse all of them.
 */
export async function scanStorybookComponents(
  projectDir: string
): Promise<StoryComponentMeta[]> {
  const results: StoryComponentMeta[] = [];

  async function walk(dir: string): Promise<void> {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      // Permission denied or missing directory
      return;
    }

    const promises: Promise<void>[] = [];

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name)) {
          promises.push(walk(fullPath));
        }
        continue;
      }

      if (entry.isFile() && /\.stories\.tsx?$/.test(entry.name)) {
        promises.push(
          readFile(fullPath, "utf-8").then((content) => {
            const relativePath = relative(projectDir, fullPath);
            const normalisedPath = relativePath.split("\\").join("/");
            const meta = parseStoryFile(content, normalisedPath);
            if (meta) {
              results.push(meta);
            }
          })
        );
      }
    }

    await Promise.all(promises);
  }

  await walk(projectDir);
  return results;
}

// ─── Component matching ──────────────────────────────────────────────────────

function normalise(name: string): string {
  return name.toLowerCase();
}

function stripPrefix(name: string): string {
  const lower = name.toLowerCase();
  for (const prefix of STRIP_PREFIXES) {
    if (lower.startsWith(prefix) && lower.length > prefix.length) {
      // Only strip if the remainder starts with uppercase (PascalCase boundary)
      const remainder = name.slice(prefix.length);
      if (/^[A-Z]/.test(remainder)) {
        return remainder;
      }
    }
  }
  return name;
}

/**
 * Match Storybook components against design system component names.
 * Returns pairs of (storybook component, matching design system component name).
 */
export function matchComponents(
  storyComponents: StoryComponentMeta[],
  designSystemComponentNames: string[]
): Array<{
  storyComponent: StoryComponentMeta;
  designSystemMatch: string | null;
  confidence: number;
}> {
  const dsNormalised = designSystemComponentNames.map((n) => ({
    original: n,
    normalised: normalise(n),
    stripped: normalise(stripPrefix(n)),
  }));

  return storyComponents.map((sc) => {
    const scNorm = normalise(sc.componentName);
    const scStripped = normalise(stripPrefix(sc.componentName));

    // 1. Exact match (case-insensitive)
    for (const ds of dsNormalised) {
      if (scNorm === ds.normalised) {
        return { storyComponent: sc, designSystemMatch: ds.original, confidence: 1.0 };
      }
    }

    // 2. Match after stripping prefixes from either side
    for (const ds of dsNormalised) {
      if (
        scStripped === ds.normalised ||
        scNorm === ds.stripped ||
        scStripped === ds.stripped
      ) {
        return { storyComponent: sc, designSystemMatch: ds.original, confidence: 0.8 };
      }
    }

    // 3. Substring match (one contains the other)
    let bestSubstring: { name: string; length: number } | null = null;
    for (const ds of dsNormalised) {
      if (scNorm.includes(ds.normalised) || ds.normalised.includes(scNorm)) {
        if (!bestSubstring || ds.normalised.length > bestSubstring.length) {
          bestSubstring = { name: ds.original, length: ds.normalised.length };
        }
      }
    }

    if (bestSubstring) {
      return {
        storyComponent: sc,
        designSystemMatch: bestSubstring.name,
        confidence: 0.5,
      };
    }

    return { storyComponent: sc, designSystemMatch: null, confidence: 0 };
  });
}
