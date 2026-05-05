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
function filterRelevantTokens(
  component: ExtractedComponent,
  allTokens: ExtractedToken[]
): ExtractedToken[] {
  if (allTokens.length <= TOKEN_CONTEXT_CAP) return allTokens;

  const desc = (component.description ?? "").toLowerCase();
  const propKeys = component.properties ? Object.keys(component.properties).join(" ").toLowerCase() : "";
  const blob = `${desc} ${propKeys}`;

  const include: Set<TokenType> = new Set(["color", "spacing", "radius"]);
  if (/text|label|title|heading|caption|body|paragraph|copy/.test(blob)) {
    include.add("typography");
  } else {
    include.add("typography");
  }
  if (/shadow|elevation|elevated|raised|float|depth/.test(blob)) {
    include.add("effect");
  }
  if (/motion|animation|transition|duration|easing/.test(blob)) {
    include.add("motion");
  }

  const candidates = allTokens.filter((t) => include.has(t.type));
  if (candidates.length <= TOKEN_CONTEXT_CAP) return candidates;

  // Two-pass: prefer semantically-named tokens (primary, surface, on-*, etc.)
  // then fill remaining slots in document order.
  const isSemantic = (t: ExtractedToken) => {
    const name = t.name.toLowerCase();
    return SEMANTIC_NAME_FRAGMENTS.some((frag) => name.includes(frag));
  };
  const semantic = candidates.filter(isSemantic);
  const primitive = candidates.filter((t) => !isSemantic(t));

  const result = semantic.slice(0, TOKEN_CONTEXT_CAP);
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
- Variant props (Size, State, Theme, etc.) must be wired as props on the function component with sensible defaults that match the schema's "variants" map.
- Render a single representative variant by default. Variant prop changes must affect visible output.

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
- If unsure about a value, prefer a token that exists in the project's design system over a hardcoded value.`;

export interface GenerateComponentInput {
  component: ExtractedComponent;
  /** Flattened token list — used to constrain the AI to real tokens. */
  tokens: ExtractedToken[];
  /** Optional layout.md excerpt for design philosophy / patterns. */
  layoutMdExcerpt?: string;
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

export async function generateComponent(
  input: GenerateComponentInput
): Promise<GenerateComponentResult> {
  const modelId = input.modelId ?? "claude-sonnet-4-6";
  const anthropic = new Anthropic({ apiKey: input.apiKey });
  const maxTokens = await getModelMaxOutputTokens(modelId);

  const filteredTokens = filterRelevantTokens(input.component, input.tokens);
  const tokenList = renderTokenListForPrompt(filteredTokens);
  const componentMeta = renderComponentMeta(input.component);

  const userText = `# Project tokens (use only these — refer by CSS variable name)

${tokenList}

# Imported Figma component metadata

${componentMeta}

${input.layoutMdExcerpt ? `# Design philosophy excerpt\n\n${input.layoutMdExcerpt}\n` : ""}

Generate the TSX + edit schema now. The user will edit token values via form
controls in Layout, so prefer rich token coverage on every visible element.`;

  const userContent: ContentBlockParam[] = [{ type: "text", text: userText }];
  if (input.component.imageUrl) {
    // The image lives behind /api/storage/... so the model needs an absolute
    // URL. Caller is expected to resolve to absolute when imageUrl is relative.
    userContent.push({
      type: "image",
      source: { type: "url", url: input.component.imageUrl },
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

  const validation = validateEditSchema(parsed.code, parsed.editSchema);
  if (!validation.ok) {
    throw new ComponentGenerationError(validation.error, rawModelOutput);
  }

  return { code: parsed.code, editSchema: parsed.editSchema, rawModelOutput, usage };
}

// ---------- Helpers ----------

function renderTokenListForPrompt(tokens: ExtractedToken[]): string {
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

function parseTsxAndSchema(text: string): ParseResult {
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
 * Pull every data-edit-id="..." from the TSX and confirm it matches the schema
 * 1:1. Catches the most common AI failure mode (drifting ids between TSX and
 * JSON) before we save anything.
 */
function validateEditSchema(code: string, schema: EditSchema): ValidateResult {
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
  return { ok: true };
}
