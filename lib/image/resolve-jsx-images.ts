/**
 * JSX Image Resolver — evaluates component code with mocked React to
 * extract ALL data-generate-image values, regardless of how they're
 * expressed (variables, template literals, ternaries, function calls, etc.).
 *
 * Falls back to regex-based resolution if evaluation fails.
 */

import vm from "node:vm";
import { transpileTsx } from "@/lib/transpile";
import { generateImage, type ImageStyle, type AspectRatio } from "./generate";
import { FALLBACK_SVG } from "./fallback";
import type { PipelineOptions } from "./pipeline";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CollectedImage {
  prompt: string;
  style?: string;
  ratio?: string;
  alt?: string;
}

export interface JsxResolveResult {
  /** Updated source code (with __imageUrls map + src attributes injected) */
  code: string;
  /** Number of dynamic images found and processed */
  count: number;
  /** Number that failed to generate */
  failedCount: number;
  /** Error messages */
  errors: string[];
}

// ---------------------------------------------------------------------------
// JSX Expression Detection
// ---------------------------------------------------------------------------

/** Matches data-generate-image={...} (JSX expression syntax) */
const JSX_EXPR_ATTR_RE = /data-generate-image=\{([^}]+)\}/g;

/** Check if code contains any JSX expression-style data-generate-image attrs */
export function hasJsxImageExpressions(code: string): boolean {
  JSX_EXPR_ATTR_RE.lastIndex = 0;
  return JSX_EXPR_ATTR_RE.test(code);
}

// ---------------------------------------------------------------------------
// Evaluation-based prompt extraction
// ---------------------------------------------------------------------------

/**
 * Transpile TSX and evaluate with mocked React to collect all
 * data-generate-image prop values as resolved strings.
 */
function extractPromptsViaEval(code: string): CollectedImage[] {
  const collected: CollectedImage[] = [];

  // Transpile TSX → JS (React.createElement calls)
  let transpiledJs: string;
  try {
    transpiledJs = transpileTsx(code);
  } catch {
    return [];
  }

  // Mock React that spies on createElement
  const mockCreateElement = (
    _type: unknown,
    props: Record<string, unknown> | null,
    ..._children: unknown[]
  ) => {
    if (props && typeof props["data-generate-image"] === "string") {
      collected.push({
        prompt: props["data-generate-image"] as string,
        style: props["data-image-style"] as string | undefined,
        ratio: props["data-image-ratio"] as string | undefined,
        alt: props["alt"] as string | undefined,
      });
    }
    return { props, children: _children };
  };

  const mockReact = {
    createElement: mockCreateElement,
    useState: (init: unknown) => [init, () => {}],
    useRef: (init: unknown) => ({ current: init }),
    useEffect: () => {},
    useLayoutEffect: () => {},
    useCallback: (fn: unknown) => fn,
    useMemo: (fn: () => unknown) => {
      try {
        return fn();
      } catch {
        return undefined;
      }
    },
    useContext: () => ({}),
    useReducer: (
      _reducer: unknown,
      init: unknown,
    ) => [init, () => {}],
    useId: () => "mock-id",
    Fragment: Symbol("Fragment"),
    forwardRef: (fn: unknown) => fn,
    memo: (fn: unknown) => fn,
    createContext: () => ({
      Provider: Symbol("Provider"),
      Consumer: Symbol("Consumer"),
    }),
  };

  // Build a CommonJS wrapper — the transpiled code uses require/exports
  const wrappedCode = `
    const exports = {};
    const module = { exports: exports };
    ${transpiledJs}
    const Component = module.exports.default || module.exports;
    if (typeof Component === 'function') {
      try { Component(); } catch (e) {}
    }
  `;

  try {
    const sandbox = {
      React: mockReact,
      console: { log: () => {}, warn: () => {}, error: () => {} },
    };

    vm.runInNewContext(wrappedCode, sandbox, {
      timeout: 2000,
      filename: "component-eval.js",
    });
  } catch {
    // Evaluation failed — return whatever we collected before the error
  }

  return collected;
}

// ---------------------------------------------------------------------------
// Regex-based fallback
// ---------------------------------------------------------------------------

/**
 * Fallback: extract prompts by finding property/variable values
 * referenced in data-generate-image={expr} expressions.
 */
function extractPromptsViaRegex(code: string): CollectedImage[] {
  JSX_EXPR_ATTR_RE.lastIndex = 0;
  const expressions = [...code.matchAll(JSX_EXPR_ATTR_RE)];
  if (expressions.length === 0) return [];

  const collected: CollectedImage[] = [];
  const seenProps = new Set<string>();

  for (const [, expr] of expressions) {
    const trimmed = expr.trim();

    // Case 1: obj.prop (e.g., member.prompt, f.imageDesc)
    const memberMatch = trimmed.match(/\.(\w+)$/);
    if (memberMatch) {
      const propName = memberMatch[1];
      if (seenProps.has(propName)) continue;
      seenProps.add(propName);

      // Find all values assigned to this property in the source
      const propRe = new RegExp(
        "\\b" + propName + '\\s*:\\s*(?:"([^"]+)"|' + "'([^']+)')",
        "g",
      );
      for (const m of code.matchAll(propRe)) {
        const value = m[1] ?? m[2] ?? m[3];
        if (value) collected.push({ prompt: value });
      }
      continue;
    }

    // Case 2: simple variable (e.g., imagePrompt)
    const varMatch = trimmed.match(/^(\w+)$/);
    if (varMatch) {
      const varName = varMatch[1];
      const varRe = new RegExp(
        "(?:const|let|var)\\s+" + varName + '\\s*=\\s*(?:"([^"]+)"|' + "'([^']+)')",
      );
      const m = code.match(varRe);
      if (m) {
        const value = m[1] ?? m[2];
        if (value) collected.push({ prompt: value });
      }
      continue;
    }
  }

  // Extract style/ratio hints from the img tags in the source
  // (regex fallback can't resolve these from variables, so check for literal attrs nearby)
  return collected;
}

// ---------------------------------------------------------------------------
// URL map injection
// ---------------------------------------------------------------------------

/**
 * Inject a __imageUrls map into the component source at module scope and
 * add src attributes to img tags that use JSX expressions for data-generate-image.
 *
 * Module-scope injection (previously: before the first `return (`) avoids the
 * scope-escape bug where an earlier `return (` inside a useMemo/useCallback/
 * helper would capture the declaration, leaving outer JSX with an undefined
 * `__imageUrls` identifier.
 */
function injectUrlMap(
  code: string,
  urlMap: Record<string, string>,
): string {
  if (Object.keys(urlMap).length === 0) return code;

  const mapJson = JSON.stringify(urlMap);
  const mapDecl = `const __imageUrls: Record<string, string> = ${mapJson};\n\n`;

  // React directive prologues ("use client", "use server", "use strict")
  // MUST remain the first statement in the file. Insert the map after any
  // such leading directive, otherwise at position 0.
  const directiveMatch = code.match(/^\s*["'](?:use\s+(?:client|server|strict))["']\s*;?\s*\n/);
  const insertAt = directiveMatch ? directiveMatch[0].length : 0;
  let result = code.slice(0, insertAt) + mapDecl + code.slice(insertAt);

  // Strip every existing `src=` form from an <img ...> tag before re-injecting,
  // so refine cycles don't accumulate stacked src attributes (JSX duplicate
  // attrs: last wins, but stacked src muddies diffs and confuses readers).
  const stripSrcAttrs = (s: string): string =>
    s
      .replace(/\s+src=\{[^}]*\}/g, "")
      .replace(/\s+src="[^"]*"/g, "")
      .replace(/\s+src='[^']*'/g, "");

  result = result.replace(
    /(<img\s[^>]*?)data-generate-image=(\{[^}]+\})([^>]*?)(\/?)>/gi,
    (_full, before: string, exprWithBraces: string, after: string, selfClose: string) => {
      const expr = exprWithBraces.slice(1, -1);
      const cleanBefore = stripSrcAttrs(before);
      const cleanAfter = stripSrcAttrs(after);
      // JSX requires self-closing img. If the original omitted the slash we
      // add one rather than leaving an unclosed tag that React rejects.
      const close = selfClose || "/";
      return `${cleanBefore}src={__imageUrls[${expr}]} data-generate-image=${exprWithBraces}${cleanAfter}${close}>`;
    },
  );

  return result;
}

// ---------------------------------------------------------------------------
// Main resolver
// ---------------------------------------------------------------------------

/**
 * Resolve JSX expression-based data-generate-image attributes.
 *
 * 1. Evaluates the component with mocked React to extract all prompt strings
 * 2. Falls back to regex if evaluation fails
 * 3. Generates images for each unique prompt
 * 4. Injects a __imageUrls lookup map into the source code
 */
export async function resolveJsxImages(
  code: string,
  options: PipelineOptions = {},
): Promise<JsxResolveResult> {
  // Quick check: does the code even have JSX expression attrs?
  if (!hasJsxImageExpressions(code)) {
    return { code, count: 0, failedCount: 0, errors: [] };
  }

  // Step 1: Extract prompts — run BOTH eval and regex, prefer the one with
  // more unique prompts. Eval usually wins for dynamic values, but when the
  // AI collapses a list template to a shared prompt variable (e.g.
  // `const avatarPrompt = "portrait"; members.map(m => <img data-generate-image={avatarPrompt} />)`),
  // the eval path collects one unique prompt and every rendered item ends up
  // with the same URL. The regex path walks data literals in the source and
  // recovers per-item variety the eval missed.
  const literalPromptRe = /data-generate-image=["']([^"']+)["']/g;
  const literalPrompts = new Set<string>();
  for (const m of code.matchAll(literalPromptRe)) {
    literalPrompts.add(m[1]);
  }
  const dropLiterals = (items: CollectedImage[]) =>
    items.filter((c) => !literalPrompts.has(c.prompt));

  const evalCollected = dropLiterals(extractPromptsViaEval(code));
  const regexCollected = dropLiterals(extractPromptsViaRegex(code));

  const evalUniqueCount = new Set(evalCollected.map((c) => c.prompt)).size;
  const regexUniqueCount = new Set(regexCollected.map((c) => c.prompt)).size;
  const collected = regexUniqueCount > evalUniqueCount ? regexCollected : evalCollected;

  if (collected.length === 0) {
    return { code, count: 0, failedCount: 0, errors: [] };
  }

  // Step 2: Deduplicate by prompt
  const uniquePrompts = [...new Map(collected.map((c) => [c.prompt, c])).values()];

  // Step 3: Generate images (same concurrency as main pipeline)
  const concurrency = options.concurrency ?? 3;
  const urlMap: Record<string, string> = {};
  let failedCount = 0;
  const errors: string[] = [];

  for (let i = 0; i < uniquePrompts.length; i += concurrency) {
    // Stop if client disconnected or request was cancelled
    if (options.signal?.aborted) break;

    const batch = uniquePrompts.slice(i, i + concurrency);

    const results = await Promise.allSettled(
      batch.map((img) =>
        generateImage({
          prompt: img.prompt,
          style: (img.style as ImageStyle) ?? undefined,
          aspectRatio: (img.ratio as AspectRatio) ?? "16:9",
          orgId: options.orgId,
          brandColours: options.brandColours,
          brandStyle: options.brandStyle,
          googleApiKey: options.googleApiKey,
        }),
      ),
    );

    for (let j = 0; j < batch.length; j++) {
      const result = results[j];
      if (result.status === "fulfilled") {
        urlMap[batch[j].prompt] = result.value.url;
      } else {
        failedCount++;
        // Critical: map the prompt to a visible placeholder even on failure,
        // otherwise src={__imageUrls[prompt]} resolves to undefined and the
        // rendered <img> shows a broken-image icon. Users see "something went
        // wrong" instead of an unreadable variant.
        urlMap[batch[j].prompt] = FALLBACK_SVG;
        const errMsg =
          result.reason instanceof Error
            ? result.reason.message
            : String(result.reason);
        errors.push(errMsg);
      }
    }
  }

  // Step 4: Inject URL map into the source code
  const updatedCode = injectUrlMap(code, urlMap);

  return {
    code: updatedCode,
    count: uniquePrompts.length,
    failedCount,
    errors,
  };
}
