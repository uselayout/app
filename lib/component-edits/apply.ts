/**
 * Deterministic apply functions for the inspector form editor.
 *
 * Token swaps and text edits mutate the TSX source string directly so the
 * preview iframe can re-transpile and re-render without an AI roundtrip.
 * Variant toggles do NOT mutate the TSX — the preview wraps the generated
 * component and passes the current variant prop values, so toggling Size or
 * State just re-renders.
 */

import type { EditSchema, EditableProp, TokenProp } from "@/lib/types/component";

/**
 * Locate the JSX opening tag that owns `data-edit-id="<id>"`. Returns the
 * opening tag's start/end indices in `code`, or null if not found.
 */
function findOpenTagRange(
  code: string,
  elementId: string
): { start: number; end: number; tag: string } | null {
  const re = new RegExp(
    `<\\w+\\b[^>]*?\\bdata-edit-id\\s*=\\s*["']${escapeRegex(elementId)}["'][^>]*?\\/?>`,
    "s"
  );
  const m = re.exec(code);
  if (!m) return null;
  return {
    start: m.index,
    end: m.index + m[0].length,
    tag: m[0],
  };
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Swap the CSS variable name used for a token-typed prop on a specific
 * element. Both `oldVar` and `newVar` are bare names — e.g. "--color-primary".
 */
export function applyTokenSwap(
  code: string,
  elementId: string,
  oldVar: string,
  newVar: string
): string {
  if (oldVar === newVar) return code;
  const range = findOpenTagRange(code, elementId);
  if (!range) return code;
  const replaced = range.tag
    .split(`var(${oldVar})`)
    .join(`var(${newVar})`);
  return code.slice(0, range.start) + replaced + code.slice(range.end);
}

/**
 * Replace the text content of a specific element. Strategy: find the
 * element's open tag, then locate the matching close tag (by tag name) and
 * replace everything between them with the new text.
 */
export function applyTextChange(
  code: string,
  elementId: string,
  newText: string
): string {
  const open = findOpenTagRange(code, elementId);
  if (!open) return code;
  const tagNameMatch = /^<(\w+)/.exec(open.tag);
  if (!tagNameMatch) return code;
  const tagName = tagNameMatch[1];
  if (open.tag.endsWith("/>")) return code;
  const closeRe = new RegExp(`</${tagName}\\s*>`, "g");
  closeRe.lastIndex = open.end;
  const closeMatch = closeRe.exec(code);
  if (!closeMatch) return code;
  return (
    code.slice(0, open.end) +
    escapeJsx(newText) +
    code.slice(closeMatch.index)
  );
}

function escapeJsx(s: string): string {
  return s
    .replace(/{/g, "&#123;")
    .replace(/}/g, "&#125;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Update a prop's value in the editSchema. Returns a new schema. */
export function updateSchemaPropValue(
  schema: EditSchema,
  elementId: string,
  propKey: string,
  newValue: string,
  options?: string[]
): EditSchema {
  return {
    ...schema,
    elements: schema.elements.map((el) =>
      el.id !== elementId
        ? el
        : {
            ...el,
            props: el.props.map((p) =>
              p.key !== propKey
                ? p
                : ({ ...p, value: newValue, ...(options ? { options } : {}) } as EditableProp)
            ),
          }
    ),
  };
}

/** Default variant values: first option for each axis. */
export function defaultVariantValues(
  schema: EditSchema
): Record<string, string> {
  const out: Record<string, string> = {};
  if (!schema.variants) return out;
  for (const [key, options] of Object.entries(schema.variants)) {
    if (options.length > 0) out[key] = options[0];
  }
  return out;
}

/**
 * Build invocation TSX that mounts the generated component with the chosen
 * variant prop values. Appended to the generated module before transpile.
 */
export function buildVariantInvocation(
  componentExportName: string,
  variantValues: Record<string, string>
): string {
  const props = Object.entries(variantValues)
    .map(([k, v]) => `${k}="${escapeAttr(v)}"`)
    .join(" ");
  return `function __PreviewWrapper() {
  return <${componentExportName} ${props} />;
}`;
}

function escapeAttr(s: string): string {
  return s.replace(/"/g, "&quot;");
}

/** Detect the default-exported function name. Falls back to "Component". */
export function detectExportName(code: string): string {
  const named = /export\s+default\s+function\s+(\w+)/.exec(code);
  if (named) return named[1];
  const fallback = /function\s+(\w+)\s*\([^)]*\)/.exec(code);
  return fallback?.[1] ?? "Component";
}

/** Type guard: prop is a token-driven prop. */
export function isTokenProp(p: EditableProp): p is TokenProp {
  return (
    p.type === "color-token" ||
    p.type === "spacing-token" ||
    p.type === "radius-token" ||
    p.type === "type-token" ||
    p.type === "shadow-token"
  );
}
