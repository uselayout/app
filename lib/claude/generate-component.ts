import Anthropic from "@anthropic-ai/sdk";
import type { ContentBlockParam } from "@anthropic-ai/sdk/resources/messages";
import { getModelMaxOutputTokens } from "@/lib/ai/models";
import type { EditSchema } from "@/lib/types/component";
import type { ExtractedComponent, ExtractedToken, TokenType } from "@/lib/types";

const TOKEN_CONTEXT_CAP = 100;
const SEMANTIC_NAME_FRAGMENTS = [
  "primary",
  "secondary",
  "tertiary",
  "surface",
  "background",
  "outline",
  "border",
  "text",
  "on-",
  "error",
  "warning",
  "success",
  "info",
  "accent",
  "muted",
  "subtle",
  "elevated",
  "panel",
];

/**
 * Filter the project's full token list down to a bounded, relevant subset
 * for AI generation context. For Material-3-scale projects with 500+ tokens
 * we'd otherwise blow Claude's input budget AND degrade output quality
 * (more options ≠ better generations — the model picks worse defaults
 * when buried in primitives).
 */
export function filterRelevantTokens(
  component: ExtractedComponent,
  allTokens: ExtractedToken[],
  pinnedTokenVars?: string[]
): ExtractedToken[] {
  // Pinned tokens are always kept first — they're referenced by existing
  // components we want this generation to compose against, so the AI MUST
  // see them in the prompt's token list regardless of the relevance cap.
  const pinSet = new Set(pinnedTokenVars ?? []);
  const pinned: ExtractedToken[] = [];
  const rest: ExtractedToken[] = [];
  for (const t of allTokens) {
    const varName = t.cssVariable ?? `--${t.name}`;
    if (pinSet.has(varName)) pinned.push(t);
    else rest.push(t);
  }

  if (allTokens.length <= TOKEN_CONTEXT_CAP) {
    // Below the cap — still return pinned-first so the AI sees them at the
    // top of the list (slight ranking signal).
    return [...pinned, ...rest];
  }

  const desc = (component.description ?? "").toLowerCase();
  const propKeys = component.properties ? Object.keys(component.properties).join(" ").toLowerCase() : "";
  const blob = `${desc} ${propKeys}`;

  const include: Set<TokenType> = new Set(["color", "spacing", "radius", "typography"]);
  if (/shadow|elevation|elevated|raised|float|depth/.test(blob)) {
    include.add("effect");
  }
  if (/motion|animation|transition|duration|easing/.test(blob)) {
    include.add("motion");
  }

  const candidates = rest.filter((t) => include.has(t.type));
  const budget = Math.max(0, TOKEN_CONTEXT_CAP - pinned.length);
  if (candidates.length <= budget) return [...pinned, ...candidates];

  // Two-pass: prefer semantically-named tokens (primary, surface, on-*, etc.)
  // then fill remaining slots in document order.
  const isSemantic = (t: ExtractedToken) => {
    const name = t.name.toLowerCase();
    return SEMANTIC_NAME_FRAGMENTS.some((frag) => name.includes(frag));
  };
  const semantic = candidates.filter(isSemantic);
  const primitive = candidates.filter((t) => !isSemantic(t));

  const result = [...pinned, ...semantic.slice(0, budget)];
  for (const t of primitive) {
    if (result.length >= TOKEN_CONTEXT_CAP) break;
    result.push(t);
  }
  return result;
}

const SYSTEM_PROMPT = `You generate a single React component (TSX) from a Figma component reference.

OUTPUT FORMAT — strict:
Return EXACTLY two fenced code blocks, in order, with no other prose:

\`\`\`tsx
<the TSX component>
\`\`\`

\`\`\`json
<the edit schema>
\`\`\`

TSX RULES:
- One default-exported function component. No imports — assume React is global. No types/interfaces.
- Use ONLY the project's design system tokens via CSS custom properties (var(--token-name)).
- Inline styles only via the \`style\` prop. No Tailwind classes. No external CSS.
- NEVER use emoji or Unicode glyphs (✓ ★ → ⚡). Use inline <svg> for icons.
- Tag every editable element with a stable \`data-edit-id="<id>"\` attribute. The id must match an entry in the JSON schema below.
- Use double quotes for the data-edit-id attribute value: data-edit-id="root", NOT data-edit-id={'root'}. The form editor's apply layer relies on this exact form.

STYLE EXPRESSIONS — INLINE ONLY (critical for the form editor):
- EVERY \`var(--token)\` reference MUST appear directly inside the \`style\` prop expression on the JSX element that uses it. The form editor scopes token swaps to the JSX opening tag — refs that live elsewhere do not get updated when the user changes a token.
- DO NOT extract style values to const variables outside the JSX, e.g. \`const bg = "var(--primary)"\` then \`style={{ background: bg }}\`. Inline the var() ref directly: \`style={{ background: "var(--primary)" }}\`.
- DO NOT compute styles via helper functions or spread style objects from outside.
- For variant branching, use INLINE ternaries inside the style object:

    style={{
      background: variant === "primary" ? "var(--brand-500)" : "var(--brand-100)",
      cursor: state === "disabled" ? "not-allowed" : "pointer",
      opacity: state === "disabled" ? 0.5 : 1,
    }}

- DO NOT use the \`var(--name, fallback)\` two-argument form. Always plain \`var(--name)\`. Fallbacks make swaps fragile.
- This rule is non-negotiable. Generated components without inline var() refs will not let the user edit them properly.

TOKEN NAME EXACTNESS:
- Use each token name VERBATIM as it appears in the "Project tokens" section below. Do not change case, do not add or remove hyphens, do not invent variants. If the list shows \`--brand-400\`, you MUST write \`var(--brand-400)\` — never \`var(--Brand-400)\`, \`var(--BRAND-400)\`, or \`var(--brand_400)\`.
- The schema's "value" field for token props MUST also use the exact same name string. Schema and TSX must agree byte-for-byte on the token name.

NO HARDCODED VALUES FOR TOKENISED PROPERTIES:
- If the project provides a token category for a property, you MUST use a token from that category. Do not write \`padding: "12px"\` when spacing-tokens exist. Do not write \`borderRadius: "8px"\` when radius-tokens exist. Do not write \`color: "#fff"\` when color-tokens exist.
- **borderRadius specifically**: never write a numeric or pixel value. Pick from the project's radius tokens (\`--radius-100\`, \`--radius-200\`, \`--radius-400\`, \`--radius-full\`, etc.). For a fully rounded pill, use \`var(--radius-full)\` — never \`"9999px"\` or \`"999px"\`. For moderate corners, use \`var(--radius-200)\` or \`var(--radius-400)\` depending on what the Figma reference suggests. If absolutely no radius token fits, omit \`borderRadius\` from the style and the schema rather than hardcode a pixel value.
- Acceptable inline string concatenation for compound properties: \`padding: \\\`\${"var(--space-3)"} \${"var(--space-6)"}\\\`\` — though \`paddingX\` / \`paddingY\` as separate style keys with single var() refs is clearer and preferred.
- If no token of the right category exists for a property you need, omit that property from the schema rather than picking a wrong-category token (e.g. don't use --stroke-border for paddingY just because nothing else fits).

COMPOSITION — reuse the user's existing components:
- The user message may include an "Existing components in this design system" section listing other components the user has already saved for this project.
- If your component visually contains any of them (e.g. you are generating a Notification or Card with a button inside, and a Button already exists), inline the SAME structure, the SAME tokens, and the SAME variant prop names as the existing component.
- Match every visual property of the embedded copy to the saved component: \`borderRadius\`, \`padding\`, \`background\`, \`border\`, \`color\`, \`fontFamily\`, \`fontWeight\`, \`fontSize\`. If the saved Button uses \`borderRadius: "var(--radius-200)"\`, your inline button MUST use \`borderRadius: "var(--radius-200)"\` — not \`"9999px"\`, not \`"4px"\`, not anything else.
- **The existing component overrides the Figma reference image for embedded parts.** The reference is authoritative for layout and structure (where elements sit, what they contain) but NOT for the visual treatment of components the user has already saved. If the Figma image shows a fully-rounded pill button inside a Notification but the saved Button uses an 8px radius, your inline copy MUST use the 8px radius. The codebase will import the real Button anyway — your inline is only for the preview iframe.
- BAD example to avoid: Notification's Figma image shows a pill-shaped action button. Saved Button uses \`borderRadius: "var(--radius-200)"\`. You write \`borderRadius: "9999px"\` for the embedded button to match the image. WRONG. Use \`var(--radius-200)\`.
- Do NOT invent a different visual treatment. Do NOT pick different tokens for the embedded button than the saved Button uses.
- The user's exported codebase will import the saved component via \`import { Button } from './Button'\`. Your inline copy is only for the preview iframe (which can't resolve cross-file imports). Treat the inline as a duplicate-for-preview, not a redesign.
- If you reuse a component this way, do NOT add separate \`data-edit-id\`s for its internal elements. The user edits the source component on its own; the embedded copy should be a faithful inline render only.

VARIANT WIRING (critical — this section is non-negotiable):
- Every variant axis present in the schema's "variants" map MUST be wired as a TSX prop AND must produce a visible visual change when toggled.
- Use the EXACT axis names from the imported component's variantGroupProperties as prop names (case-sensitive). If Figma calls the axis "State" with values "Default", "Hover", "Disabled", the prop is named \`State\` and accepts those exact strings.
- Branch styles inside the component on each axis. A single \`Size\` prop is not enough — \`State\` must change colour/opacity/cursor, \`Variant\` must change background/border/text, \`Theme\` must flip the colour scheme, etc.
- Concrete pattern (DO follow this shape):

    function Button({ Size = "Medium", State = "Default", Variant = "Primary" }) {
      const padX = Size === "Small" ? "var(--space-2)" : Size === "Large" ? "var(--space-6)" : "var(--space-4)";
      const padY = Size === "Small" ? "var(--space-1)" : Size === "Large" ? "var(--space-3)" : "var(--space-2)";
      const bg =
        Variant === "Primary" ? "var(--color-primary)"
        : Variant === "Subtle" ? "var(--color-surface)"
        : "transparent";
      const fg = Variant === "Primary" ? "var(--color-on-primary)" : "var(--color-on-surface)";
      const opacity = State === "Disabled" ? 0.5 : 1;
      const cursor = State === "Disabled" ? "not-allowed" : "pointer";
      const filter = State === "Hover" ? "brightness(1.05)" : undefined;
      return (
        <button data-edit-id="root" style={{ background: bg, color: fg, padding: padY + " " + padX, opacity, cursor, filter }}>
          <span data-edit-id="label">Button</span>
        </button>
      );
    }

- Render a single representative variant by default (the prop defaults). Variant prop changes from outside MUST visibly change the rendered output.

TOKEN CATEGORY DISCIPLINE:
- Match each prop to the right token category. paddingX/paddingY/gap/margin → spacing-token. background/borderColor → color-token. borderRadius → radius-token. fontFamily/fontSize/lineHeight → type-token. boxShadow → shadow-token.
- DO NOT pick tokens whose names suggest a different role for a prop (e.g. don't use --Stroke-Border as a paddingY value just because the project has it). If no good token exists for a property, omit the prop from the schema rather than picking a wrong-category one.

JSON SCHEMA RULES:
- Shape: { "version": 1, "elements": [...], "variants": { "PropName": ["v1","v2"] }, "sourceComponentName": "..." }
- Every \`data-edit-id\` in the TSX MUST appear as an element id in the schema, and vice versa. No orphans.
- Each element has: { "id": string, "label": string (human-friendly), "props": [...] }
- A prop is one of:
    { "type": "color-token",   "key": string, "value": string }
    { "type": "spacing-token", "key": string, "value": string }
    { "type": "radius-token",  "key": string, "value": string }
    { "type": "type-token",    "key": string, "value": string }
    { "type": "shadow-token",  "key": string, "value": string }
    { "type": "text",          "key": string, "value": string }
    { "type": "enum",          "key": string, "value": string, "options": string[] }
- Token \`value\` is the CSS variable NAME without the var() wrapper, e.g. "--color-primary". It MUST exist in the project's token list provided below.
- "key" is the CSS property name being driven by the token (e.g. "background", "paddingX", "borderRadius") OR a logical key for text props (e.g. "content", "ariaLabel").
- "variants" lists the valid values for each variant prop (matching the TSX function signature).

DESIGN FIDELITY:
- Match the Figma component's structure, hierarchy, and visual character as closely as the reference image and metadata allow.
- If a reference image is attached, treat it as the source of truth for layout, proportions, and visual weight.
- If the imported component has variant axes (e.g. Size, State), reflect them as TSX props.
- If unsure about a value, prefer a token that exists in the project's design system over a hardcoded value.

ACCESSIBILITY BASELINE (always apply):
- Interactive elements (buttons, links, inputs, selects, switches, checkboxes, etc.) must use the correct semantic tag — \`<button>\` for actions, \`<a>\` for navigation, \`<input>\` for fields. Never \`<div onClick>\`.
- Icon-only buttons MUST have an \`aria-label\` describing the action (e.g. close, expand, remove).
- Inputs MUST be associated with a \`<label>\` or carry an \`aria-label\`. Helper / error text MUST be linked via \`aria-describedby\`. Error state MUST set \`aria-invalid\`.
- Modals / dialogs use \`role="dialog"\` (or the native \`<dialog>\` element), \`aria-modal="true"\`, and \`aria-labelledby\` pointing at the title id.
- Toggles / switches use \`role="switch"\` with \`aria-checked\`.
- Tabs use \`role="tablist"\` / \`tab\` / \`tabpanel\` with \`aria-selected\` and \`tabIndex\` to support arrow-key roving focus.
- Tables use \`<table>\` / \`<thead>\` / \`<th scope="col">\`. Status toasts use \`role="status"\` (polite) or \`role="alert"\` (assertive) depending on severity.
- Focus state must be visible. Use a token-based ring (e.g. \`outline: "2px solid var(--color-outline-focus)"\` or a \`box-shadow\` ring) — never \`outline: none\` without a replacement. If the project has a focus-ring colour token, use it; otherwise use an existing accent token.
- Touch targets for icon buttons should be at least 32–40px on a side via padding, even when the icon glyph itself is smaller.

ANIMATION GUIDANCE:
- Do NOT import or use framer-motion, lucide-react, or any third-party motion library. The preview iframe doesn't have them and they will error.
- Animate with inline CSS only: \`transition: "background 0.15s, opacity 0.15s"\` for hover/state changes; CSS keyframes for skeletons/spinners.
- Skeleton loaders: use a CSS \`@keyframes shimmer\` injected inline via \`style={{ animation: "shimmer 1.5s ease-in-out infinite" }}\` and a wrapper \`<style>\` element. Wrap motion in \`@media (prefers-reduced-motion: reduce)\` so it disables for users who opt out.
- Toggle thumb-slide: use \`transition: transform 0.15s ease\` plus \`transform: translateX(...)\` keyed off the State variant. Don't use \`transition: all\`.

PORTAL-REQUIRING COMPONENTS (modals, dropdowns, tooltips, popovers, toasts):
- The preview iframe is a single document with no portal root. Rendering a modal at \`document.body\` won't escape any scroll/overflow parents.
- For these components, render them inline at the top of the component (still inside the data-edit-id="root" element) with an overlay sibling. The preview will show the modal/dropdown/tooltip open by default — that's the intended behaviour for the Layout inspector (it visualises the OPEN state of the component, not the closed trigger).
- For dialogs that depend on focus trap / Esc / return-focus behaviour, set the right ARIA but don't write the JS — note that the user's production codebase will wire those handlers when they import the component. The inline preview just renders the visual.

NO TAILWIND / CSS CLASSES:
- The preview iframe loads Tailwind CDN for general utilities, but mixing Tailwind with the inline-style approach causes confusion. Use ONLY \`style={{ ... }}\` for ALL visual properties. Never \`className\` for styling. Class names are only acceptable when the project's existing components use them via an established pattern (rare).`;

export interface ExistingComponentReference {
  name: string;
  /** Truncated TSX of the saved component — enough for the model to match style. */
  codeSnippet: string;
  /** Variant axes from the existing component's editSchema, if any. */
  variantAxes?: Record<string, string[]>;
}

export interface GenerateComponentInput {
  component: ExtractedComponent;
  /** Flattened token list — used to constrain the AI to real tokens. */
  tokens: ExtractedToken[];
  /** Optional layout.md excerpt for design philosophy / patterns. */
  layoutMdExcerpt?: string;
  /**
   * Reference image bytes — passed as base64 inline to Claude rather than as
   * a URL. URL passing fails on private deployments (HTTP basic auth on
   * staging, localhost in dev) because Claude can't reach those URLs. The
   * caller resolves the imageUrl to bytes via Supabase storage.
   */
  imageData?: { base64: string; mediaType: "image/png" | "image/jpeg" | "image/webp" | "image/gif" };
  /**
   * Other saved components from the same project. When the component we're
   * generating visually contains any of these, the model must match their
   * token choices, structure, and variant prop names so the exported
   * codebase can `import { Button } from './Button'` rather than reinvent
   * a slightly-different visual treatment.
   */
  existingComponents?: ExistingComponentReference[];
  /**
   * Token CSS variable names (e.g. `--brand-700`) that must always be
   * included in the prompt's token list, regardless of the relevance
   * filter. Used to guarantee tokens referenced by existing components
   * survive context bounding so composition stays consistent.
   */
  pinnedTokenVars?: string[];
  /** Override the default model. */
  modelId?: string;
  /** Anthropic API key — overrides env. */
  apiKey?: string;
}

export interface GenerateComponentResult {
  code: string;
  editSchema: EditSchema;
  rawModelOutput: string;
  usage: { inputTokens: number; outputTokens: number };
}

export class ComponentGenerationError extends Error {
  rawModelOutput: string;
  constructor(message: string, rawModelOutput: string) {
    super(message);
    this.name = "ComponentGenerationError";
    this.rawModelOutput = rawModelOutput;
  }
}

/**
 * Practical output cap for a single component generation. The model's full
 * max (e.g. 128k for Opus 4.7) is way more than we need — typical TSX +
 * edit schema is 1-3k output tokens — and forces the Anthropic SDK to demand
 * streaming because the implied timeout exceeds 10 minutes. 8k leaves
 * headroom for unusually large components without flipping into stream mode.
 */
const COMPONENT_OUTPUT_CAP = 8000;

export async function generateComponent(
  input: GenerateComponentInput
): Promise<GenerateComponentResult> {
  const modelId = input.modelId ?? "claude-sonnet-4-6";
  const anthropic = new Anthropic({ apiKey: input.apiKey });
  const modelMax = await getModelMaxOutputTokens(modelId);
  const maxTokens = Math.min(modelMax, COMPONENT_OUTPUT_CAP);

  const filteredTokens = filterRelevantTokens(
    input.component,
    input.tokens,
    input.pinnedTokenVars
  );
  const tokenList = renderTokenListForPrompt(filteredTokens);
  const componentMeta = renderComponentMeta(input.component);
  const existingComponentsBlock = renderExistingComponents(input.existingComponents ?? []);

  const userText = `# Project tokens (use only these — refer by CSS variable name)

${tokenList}

${existingComponentsBlock}# Imported Figma component metadata

${componentMeta}

${input.layoutMdExcerpt ? `# Design philosophy excerpt\n\n${input.layoutMdExcerpt}\n` : ""}

Generate the TSX + edit schema now. The user will edit token values via form
controls in Layout, so prefer rich token coverage on every visible element.`;

  const userContent: ContentBlockParam[] = [{ type: "text", text: userText }];
  if (input.imageData) {
    userContent.push({
      type: "image",
      source: {
        type: "base64",
        media_type: input.imageData.mediaType,
        data: input.imageData.base64,
      },
    });
  }

  const response = await anthropic.messages.create({
    model: modelId,
    max_tokens: maxTokens,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userContent }],
  });

  const rawModelOutput = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  const usage = {
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  };

  const parsed = parseTsxAndSchema(rawModelOutput);
  if (!parsed.ok) {
    throw new ComponentGenerationError(parsed.error, rawModelOutput);
  }

  const validation = validateEditSchema(parsed.code, parsed.editSchema, input.tokens);
  if (!validation.ok) {
    throw new ComponentGenerationError(validation.error, rawModelOutput);
  }

  return { code: parsed.code, editSchema: parsed.editSchema, rawModelOutput, usage };
}

// ---------- Helpers ----------

export function renderTokenListForPrompt(tokens: ExtractedToken[]): string {
  if (tokens.length === 0) return "(no tokens — use neutral defaults)";
  const grouped: Record<string, ExtractedToken[]> = {};
  for (const t of tokens) {
    const k = t.type;
    if (!grouped[k]) grouped[k] = [];
    grouped[k].push(t);
  }
  return Object.entries(grouped)
    .map(
      ([type, list]) =>
        `## ${type}\n` +
        list
          .map((t) => `- ${t.cssVariable ?? `--${t.name}`}: ${t.value}`)
          .join("\n")
    )
    .join("\n\n");
}

/**
 * Render the user's other saved components as compose-against context. The
 * model uses this to inline the SAME implementation when a Button (or any
 * other saved component) visually appears inside the component being
 * generated — rather than reinventing a slightly-different visual.
 *
 * The user's exported codebase will import these components from their own
 * files, so the inlined copy here exists only so the preview iframe (single
 * file, no module resolution) renders correctly.
 */
function renderExistingComponents(
  refs: Array<{ name: string; codeSnippet: string; variantAxes?: Record<string, string[]> }>
): string {
  if (refs.length === 0) return "";
  const blocks = refs.map((r) => {
    const axes = r.variantAxes
      ? "\nVariants: " +
        Object.entries(r.variantAxes)
          .map(([k, v]) => `${k}=[${v.join(", ")}]`)
          .join("; ")
      : "";
    return `## ${r.name}${axes}\n\`\`\`tsx\n${r.codeSnippet.trim()}\n\`\`\``;
  });
  return `# Existing components in this design system

The user has already generated and saved these components for this project.

If the component you're generating visually contains any of them (e.g. a
Notification containing a Button, a Card with an Icon Button, a Form with
text Inputs), inline a copy that uses THE SAME TOKENS, THE SAME STRUCTURE,
and THE SAME variant prop names as the existing component. The exported
codebase will import them — your inline copy exists only so the preview
iframe renders correctly without module resolution.

Do not invent a different visual treatment for what the user clearly means
to be the same component.

${blocks.join("\n\n")}

`;
}

function renderComponentMeta(c: ExtractedComponent): string {
  const lines: string[] = [`Name: ${c.name}`];
  if (c.description) lines.push(`Description: ${c.description}`);
  if (c.variantCount > 1) lines.push(`Variant count: ${c.variantCount}`);
  if (c.variantGroupProperties) {
    const axes = Object.entries(c.variantGroupProperties)
      .map(([k, v]) => `  - ${k}: [${v.join(", ")}]`)
      .join("\n");
    lines.push(`Variant axes:\n${axes}`);
  }
  if (c.properties) {
    const props = Object.entries(c.properties)
      .map(
        ([k, p]) =>
          `  - ${k}: ${p.type}${p.defaultValue ? ` = ${p.defaultValue}` : ""}`
      )
      .join("\n");
    if (props) lines.push(`Properties:\n${props}`);
  }
  return lines.join("\n");
}

interface ParseSuccess {
  ok: true;
  code: string;
  editSchema: EditSchema;
}
interface ParseFailure {
  ok: false;
  error: string;
}
type ParseResult = ParseSuccess | ParseFailure;

export function parseTsxAndSchema(text: string): ParseResult {
  const tsxMatch = text.match(/```tsx\s*\n([\s\S]*?)```/);
  if (!tsxMatch) {
    return { ok: false, error: "No tsx code block found in model output" };
  }
  const jsonMatch = text.match(/```json\s*\n([\s\S]*?)```/);
  if (!jsonMatch) {
    return { ok: false, error: "No json schema block found in model output" };
  }
  const code = tsxMatch[1].trim();
  let editSchema: EditSchema;
  try {
    editSchema = JSON.parse(jsonMatch[1]) as EditSchema;
  } catch (e) {
    return {
      ok: false,
      error: `Edit schema is not valid JSON: ${(e as Error).message}`,
    };
  }
  if (editSchema.version !== 1) {
    return {
      ok: false,
      error: `Unexpected schema version: ${editSchema.version}`,
    };
  }
  if (!Array.isArray(editSchema.elements)) {
    return { ok: false, error: "Schema missing elements array" };
  }
  return { ok: true, code, editSchema };
}

interface ValidateSuccess { ok: true; }
interface ValidateFailure { ok: false; error: string; }
type ValidateResult = ValidateSuccess | ValidateFailure;

/**
 * Validate the AI's output. Catches the most common generation failure modes
 * before we save:
 *
 * 1. data-edit-id markers in TSX must 1:1 match schema element ids
 * 2. Every variant axis in schema.variants must appear as a destructured
 *    parameter in the function signature (otherwise the form's variant
 *    toggle silently does nothing — the prop never reaches the renderer).
 * 3. Every token-typed schema prop's `value` must reference a real token
 *    in the project (otherwise the picker shows nothing and the iframe
 *    renders an unresolved var()).
 * 4. Text-typed schema props can't target an element whose JSX body
 *    contains nested children — applyTextChange would wipe them.
 */
export function validateEditSchema(
  code: string,
  schema: EditSchema,
  projectTokens: ExtractedToken[]
): ValidateResult {
  const tsxIds = new Set(
    [...code.matchAll(/data-edit-id\s*=\s*["']([^"']+)["']/g)].map((m) => m[1])
  );
  const schemaIds = new Set(schema.elements.map((e) => e.id));
  const missing = [...tsxIds].filter((id) => !schemaIds.has(id));
  const orphan = [...schemaIds].filter((id) => !tsxIds.has(id));
  if (missing.length > 0) {
    return {
      ok: false,
      error: `data-edit-id present in TSX but missing from schema: ${missing.join(", ")}`,
    };
  }
  if (orphan.length > 0) {
    return {
      ok: false,
      error: `Schema element ids not present in TSX: ${orphan.join(", ")}`,
    };
  }
  if (schema.elements.length === 0) {
    return { ok: false, error: "Schema has zero editable elements" };
  }

  // Variant axes must be in the function signature
  if (schema.variants && Object.keys(schema.variants).length > 0) {
    const sigMatch = code.match(/function\s+\w+\s*\(\s*\{([^}]*)\}/);
    const params = sigMatch
      ? new Set(
          sigMatch[1]
            .split(",")
            .map((s) => s.trim().split(/[=:\s]/)[0])
            .filter(Boolean)
        )
      : new Set<string>();
    const missingAxes = Object.keys(schema.variants).filter((axis) => !params.has(axis));
    if (missingAxes.length > 0) {
      return {
        ok: false,
        error: `Variant axes in schema not destructured in function signature (would render no-op on toggle): ${missingAxes.join(", ")}. Function signature parameters: ${sigMatch?.[1].trim() ?? "<not found>"}`,
      };
    }
  }

  // Token values must reference real tokens of the right category
  const projectVars = new Map<string, ExtractedToken>();
  for (const t of projectTokens) {
    const varName = t.cssVariable ?? `--${t.name}`;
    projectVars.set(varName, t);
  }
  const typeToCategory: Record<string, "color" | "spacing" | "radius" | "typography" | "effect"> = {
    "color-token": "color",
    "spacing-token": "spacing",
    "radius-token": "radius",
    "type-token": "typography",
    "shadow-token": "effect",
  };
  for (const el of schema.elements) {
    for (const prop of el.props) {
      if (prop.type in typeToCategory) {
        const expected = typeToCategory[prop.type];
        const tokenName = (prop as { value: string }).value;
        const token = projectVars.get(tokenName);
        if (!token) {
          return {
            ok: false,
            error: `Schema references unknown token "${tokenName}" on element "${el.id}" / prop "${prop.key}". Token must exist in the project's ${expected} tokens.`,
          };
        }
        if (token.type !== expected) {
          return {
            ok: false,
            error: `Schema marks "${tokenName}" as ${prop.type} but the project token is type "${token.type}". Pick a token of the right category.`,
          };
        }
      }
    }
  }

  // Text props can't target elements with nested children
  for (const el of schema.elements) {
    const hasTextProp = el.props.some((p) => p.type === "text" && p.key === "content");
    if (!hasTextProp) continue;
    const openTagPattern = new RegExp(
      `<(\\w+)\\b[^>]*?\\bdata-edit-id\\s*=\\s*["']${escapeRegexLocal(el.id)}["'][^>]*?(\\/?)>`,
      "s"
    );
    const m = code.match(openTagPattern);
    if (!m || m.index === undefined) continue;
    const tagName = m[1];
    if (m[2] === "/") continue; // self-closing, no children possible
    const tail = code.slice(m.index + m[0].length);
    const closeMatch = tail.match(new RegExp(`</${tagName}\\s*>`));
    if (!closeMatch || closeMatch.index === undefined) continue;
    const inner = tail.slice(0, closeMatch.index);
    if (/<[^>]/.test(inner)) {
      return {
        ok: false,
        error: `Element "${el.id}" has a text content prop in schema but its JSX contains nested children (<${tagName}>...). Text edit would wipe them. Either move text into a leaf child with its own data-edit-id, or remove the content prop from this element.`,
      };
    }
  }

  return { ok: true };
}

function escapeRegexLocal(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
