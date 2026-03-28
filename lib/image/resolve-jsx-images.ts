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
 * Inject a __imageUrls map into the component source and add src attributes
 * to img tags that use JSX expressions for data-generate-image.
 */
function injectUrlMap(
  code: string,
  urlMap: Record<string, string>,
): string {
  if (Object.keys(urlMap).length === 0) return code;

  let result = code;

  // Inject the URL map before the first `return (` or `return(`
  const mapJson = JSON.stringify(urlMap);
  const returnMatch = result.match(/^(\s*)(return\s*\()/m);
  if (returnMatch) {
    const indent = returnMatch[1];
    const mapDecl = `${indent}const __imageUrls: Record<string, string> = ${mapJson};\n${indent}`;
    result = result.replace(
      returnMatch[0],
      `${mapDecl}${returnMatch[2]}`,
    );
  }

  // Add src={__imageUrls[expr]} to each <img ... data-generate-image={expr} ...>
  JSX_EXPR_ATTR_RE.lastIndex = 0;
  result = result.replace(
    /(<img\s[^>]*?)data-generate-image=(\{[^}]+\})([^>]*?)\/?>/gi,
    (fullMatch, before: string, exprWithBraces: string, after: string) => {
      // Skip if already has a src attribute (from a previous run)
      if (/\bsrc=/.test(before + after)) {
        // Update the existing src to use __imageUrls
        const withUpdatedSrc = (before + `data-generate-image=${exprWithBraces}` + after)
          .replace(/\bsrc=\{[^}]*\}/, `src={__imageUrls[${exprWithBraces.slice(1, -1)}]}`)
          .replace(/\bsrc="[^"]*"/, `src={__imageUrls[${exprWithBraces.slice(1, -1)}]}`);
        return withUpdatedSrc + " />";
      }
      // Add src using the same expression as the key into __imageUrls
      const expr = exprWithBraces.slice(1, -1); // remove { and }
      return `${before}src={__imageUrls[${expr}]} data-generate-image=${exprWithBraces}${after} />`;
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

  // Step 1: Extract prompts — try evaluation first, fall back to regex
  let collected = extractPromptsViaEval(code);

  // Filter to only images that came from JSX expressions (not literal strings)
  // The eval approach also picks up literal data-generate-image="..." attrs,
  // which the main pipeline already handles. We only need the ones from expressions.
  // To determine which are from expressions, we check if the prompt exists
  // as a literal in the source. If it does, skip it (the main pipeline handles it).
  const literalPromptRe = /data-generate-image=["']([^"']+)["']/g;
  const literalPrompts = new Set<string>();
  for (const m of code.matchAll(literalPromptRe)) {
    literalPrompts.add(m[1]);
  }
  collected = collected.filter((c) => !literalPrompts.has(c.prompt));

  // If eval found nothing (but we know expressions exist), try regex fallback
  if (collected.length === 0) {
    collected = extractPromptsViaRegex(code);
  }

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
