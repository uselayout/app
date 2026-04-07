/**
 * Codebase scanner that detects existing React components in a user's project.
 * Used to prevent AI from generating duplicate components and to map
 * existing code against design system component names.
 *
 * Uses regex-based parsing to avoid additional npm dependencies.
 */

import { readdir, readFile } from "fs/promises";
import { join, relative } from "path";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ScannedComponent {
  /** Component name (PascalCase) */
  name: string;
  /** File path relative to project root */
  filePath: string;
  /** Whether it's a default or named export */
  exportType: "default" | "named";
  /** Props interface/type name if found */
  propsType?: string;
  /** Extracted prop names (from interface/type) */
  props: string[];
  /** Whether it uses forwardRef */
  usesForwardRef: boolean;
  /** Import path that other files would use */
  importPath: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const SKIP_DIRS = new Set([
  "node_modules",
  ".next",
  "dist",
  "build",
  "coverage",
  ".git",
  ".turbo",
  "__tests__",
]);

const SKIP_FILE_PATTERNS = [
  /\.test\.tsx?$/,
  /\.spec\.tsx?$/,
  /\.stories\.tsx?$/,
];

const STRIP_PREFIXES = ["custom", "base", "app", "my"];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Check if a name is PascalCase (likely a React component). */
function isPascalCase(name: string): boolean {
  return /^[A-Z][a-zA-Z0-9]*$/.test(name);
}

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
    if (depth === 0) return source.slice(openIdx + 1, i);
  }
  return null;
}

/**
 * Extract prop names from the body of a TypeScript interface or type literal.
 * Handles simple cases: `propName: type;` or `propName?: type;`
 */
function extractPropNames(interfaceBody: string): string[] {
  const props: string[] = [];
  const propPattern = /^\s*(\w+)\s*\??:/gm;
  let match: RegExpExecArray | null;

  while ((match = propPattern.exec(interfaceBody)) !== null) {
    props.push(match[1]);
  }

  return props;
}

/**
 * Find a props interface or type for a given component name.
 * Looks for `interface ButtonProps { ... }` or `type ButtonProps = { ... }`
 */
function findPropsType(
  content: string,
  componentName: string
): { propsTypeName: string; props: string[] } | null {
  const propsTypeName = `${componentName}Props`;

  // Try interface pattern: `interface ButtonProps {`
  const interfacePattern = new RegExp(
    `interface\\s+${propsTypeName}\\s*(?:extends\\s+[^{]*)?\\{`
  );
  const interfaceMatch = content.match(interfacePattern);
  if (interfaceMatch && interfaceMatch.index !== undefined) {
    const body = extractBracedBlock(content, interfaceMatch.index);
    if (body) {
      return { propsTypeName, props: extractPropNames(body) };
    }
  }

  // Try type pattern: `type ButtonProps = {`
  const typePattern = new RegExp(
    `type\\s+${propsTypeName}\\s*=\\s*\\{`
  );
  const typeMatch = content.match(typePattern);
  if (typeMatch && typeMatch.index !== undefined) {
    const body = extractBracedBlock(content, typeMatch.index);
    if (body) {
      return { propsTypeName, props: extractPropNames(body) };
    }
  }

  return null;
}

/**
 * Build the import path from a file path relative to the project root.
 * Removes extension and converts to posix separators.
 */
function buildImportPath(relativePath: string): string {
  const posixPath = relativePath.split("\\").join("/");
  // Remove .tsx / .jsx / .ts / .js extension
  const withoutExt = posixPath.replace(/\.(tsx?|jsx?)$/, "");
  // Remove /index suffix (allows importing from directory)
  const cleaned = withoutExt.replace(/\/index$/, "");
  return `./${cleaned}`;
}

// ─── Main parser ─────────────────────────────────────────────────────────────

/**
 * Scan a single .tsx/.jsx file for React component exports.
 */
export function parseComponentFile(
  content: string,
  filePath: string,
  projectRoot: string
): ScannedComponent[] {
  const components: ScannedComponent[] = [];
  const relativePath = filePath.startsWith(projectRoot)
    ? relative(projectRoot, filePath).split("\\").join("/")
    : filePath;
  const importPath = buildImportPath(relativePath);

  const seenNames = new Set<string>();

  // Check if file uses forwardRef anywhere
  const fileUsesForwardRef = /forwardRef/.test(content);

  // ── 1. Named function exports: export function Button(...) ─────────

  const namedFnPattern = /export\s+function\s+(\w+)\s*[(<]/g;
  let match: RegExpExecArray | null;

  while ((match = namedFnPattern.exec(content)) !== null) {
    const name = match[1];
    if (!isPascalCase(name) || seenNames.has(name)) continue;
    seenNames.add(name);

    const propsInfo = findPropsType(content, name);
    components.push({
      name,
      filePath: relativePath,
      exportType: "named",
      propsType: propsInfo?.propsTypeName,
      props: propsInfo?.props ?? [],
      usesForwardRef: false,
      importPath,
    });
  }

  // ── 2. Named const exports: export const Button = ─────────────────

  // Matches: export const Button = (...) => | export const Button = forwardRef<...>(
  // Also: export const Button: React.FC<...> =
  const namedConstPattern =
    /export\s+const\s+(\w+)\s*(?::\s*[^=]+)?\s*=\s*/g;

  while ((match = namedConstPattern.exec(content)) !== null) {
    const name = match[1];
    if (!isPascalCase(name) || seenNames.has(name)) continue;

    // Check what follows the `=` to confirm it's a component
    const afterEqualsStart = (match.index ?? 0) + match[0].length;
    const afterEquals = content.slice(afterEqualsStart, afterEqualsStart + 200);

    const looksLikeComponent =
      /^(?:\(|(?:React\.)?(?:forwardRef|memo|lazy)\s*[<(]|function\s*[<(])/.test(
        afterEquals
      );

    if (!looksLikeComponent) continue;
    seenNames.add(name);

    const usesForwardRef = /forwardRef/.test(afterEquals.slice(0, 100));
    const propsInfo = findPropsType(content, name);

    components.push({
      name,
      filePath: relativePath,
      exportType: "named",
      propsType: propsInfo?.propsTypeName,
      props: propsInfo?.props ?? [],
      usesForwardRef,
      importPath,
    });
  }

  // ── 3. Default function exports: export default function Button ────

  const defaultFnMatch = content.match(
    /export\s+default\s+function\s+(\w+)\s*[(<]/
  );
  if (defaultFnMatch) {
    const name = defaultFnMatch[1];
    if (isPascalCase(name) && !seenNames.has(name)) {
      seenNames.add(name);
      const propsInfo = findPropsType(content, name);
      components.push({
        name,
        filePath: relativePath,
        exportType: "default",
        propsType: propsInfo?.propsTypeName,
        props: propsInfo?.props ?? [],
        usesForwardRef: false,
        importPath,
      });
    }
  }

  // ── 4. Default export of existing identifier ──────────────────────

  // `export default Button` (where Button is defined earlier in the file)
  const defaultIdentMatch = content.match(
    /export\s+default\s+(\w+)\s*;/
  );
  if (defaultIdentMatch) {
    const name = defaultIdentMatch[1];
    if (isPascalCase(name) && !seenNames.has(name)) {
      // Verify the identifier is defined as a component in this file
      const definedPattern = new RegExp(
        `(?:function|const|let|var)\\s+${name}\\b`
      );
      if (definedPattern.test(content)) {
        seenNames.add(name);
        const propsInfo = findPropsType(content, name);
        const usesRef =
          fileUsesForwardRef &&
          new RegExp(`${name}\\s*=\\s*(?:React\\.)?forwardRef`).test(content);

        components.push({
          name,
          filePath: relativePath,
          exportType: "default",
          propsType: propsInfo?.propsTypeName,
          props: propsInfo?.props ?? [],
          usesForwardRef: usesRef,
          importPath,
        });
      }
    }
  }

  return components;
}

// ─── Directory scanner ───────────────────────────────────────────────────────

/**
 * Scan a project directory for all React component files.
 */
export async function scanProjectComponents(
  projectDir: string
): Promise<ScannedComponent[]> {
  const allComponents: ScannedComponent[] = [];
  const seenNames = new Set<string>();

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

      // Only scan .tsx and .jsx files
      if (!entry.isFile() || !/\.[jt]sx$/.test(entry.name)) continue;

      // Skip test, spec, and story files
      if (SKIP_FILE_PATTERNS.some((p) => p.test(entry.name))) continue;

      promises.push(
        readFile(fullPath, "utf-8").then((content) => {
          const components = parseComponentFile(content, fullPath, projectDir);
          for (const comp of components) {
            // Deduplicate by name, keeping first occurrence
            if (!seenNames.has(comp.name)) {
              seenNames.add(comp.name);
              allComponents.push(comp);
            }
          }
        })
      );
    }

    await Promise.all(promises);
  }

  await walk(projectDir);
  return allComponents;
}

// ─── Component matching ──────────────────────────────────────────────────────

function normalise(name: string): string {
  return name.toLowerCase();
}

function stripPrefix(name: string): string {
  const lower = name.toLowerCase();
  for (const prefix of STRIP_PREFIXES) {
    if (lower.startsWith(prefix) && lower.length > prefix.length) {
      const remainder = name.slice(prefix.length);
      if (/^[A-Z]/.test(remainder)) {
        return remainder;
      }
    }
  }
  return name;
}

/**
 * Match scanned codebase components against design system components.
 */
export function matchCodebaseToDesignSystem(
  scannedComponents: ScannedComponent[],
  designSystemComponentNames: string[]
): Array<{
  scanned: ScannedComponent;
  designSystemMatch: string | null;
  confidence: number;
}> {
  const dsNormalised = designSystemComponentNames.map((n) => ({
    original: n,
    normalised: normalise(n),
    stripped: normalise(stripPrefix(n)),
  }));

  return scannedComponents.map((sc) => {
    const scNorm = normalise(sc.name);
    const scStripped = normalise(stripPrefix(sc.name));

    // 1. Exact match (case-insensitive)
    for (const ds of dsNormalised) {
      if (scNorm === ds.normalised) {
        return { scanned: sc, designSystemMatch: ds.original, confidence: 1.0 };
      }
    }

    // 2. Match after stripping prefixes from either side
    for (const ds of dsNormalised) {
      if (
        scStripped === ds.normalised ||
        scNorm === ds.stripped ||
        scStripped === ds.stripped
      ) {
        return { scanned: sc, designSystemMatch: ds.original, confidence: 0.8 };
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
        scanned: sc,
        designSystemMatch: bestSubstring.name,
        confidence: 0.5,
      };
    }

    return { scanned: sc, designSystemMatch: null, confidence: 0 };
  });
}
