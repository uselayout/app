import Anthropic from "@anthropic-ai/sdk";
import { getModelMaxOutputTokens } from "@/lib/ai/models";
import type { EditSchema } from "@/lib/types/component";
import type { ExtractedToken } from "@/lib/types";
import {
  ComponentGenerationError,
  filterRelevantTokens,
  parseTsxAndSchema,
  renderTokenListForPrompt,
  validateEditSchema,
} from "./generate-component";

const REFINE_OUTPUT_CAP = 8000;

const REFINE_SYSTEM_PROMPT = `You refine an existing generated component based on a short natural-language instruction from the user.

OUTPUT FORMAT — strict:
Return EXACTLY two fenced code blocks, in order, with no other prose:

\`\`\`tsx
<the updated TSX>
\`\`\`

\`\`\`json
<the updated edit schema>
\`\`\`

PRINCIPLES:
- Make the smallest change necessary to satisfy the instruction. Preserve unrelated styling, structure, variant logic, and props.
- Keep the same default-exported function name unless the instruction explicitly asks to rename.
- Keep every existing data-edit-id stable. Add new ones only when the instruction introduces a new editable element.
- The output must satisfy all of the same rules the original generation did: inline style only (no className, no var(--, fallback) two-arg form), every var(--token) inline in the style prop, no const indirection, no hardcoded values when a token category exists, all variant axes destructured in the function signature, accessibility baselines, etc.
- If the instruction conflicts with the design system rules (e.g. user asks for a specific hex colour and the project has only tokens), use the closest token instead and add nothing to the schema for that property.
- The edit schema must remain consistent: every data-edit-id in the TSX appears in schema.elements, and vice versa. Token values must reference real tokens in the project's token list provided below.

EXISTING TSX, SCHEMA, AND PROJECT CONTEXT FOLLOW IN THE USER MESSAGE.`;

export interface RefineComponentInput {
  /** Existing TSX from the saved component. */
  code: string;
  /** Existing edit schema. */
  editSchema: EditSchema;
  /** Natural language refinement instruction from the user. */
  instruction: string;
  /** Flat token list — used both for the prompt and for schema validation. */
  tokens: ExtractedToken[];
  /** Pinned token CSS var names that must survive context filtering. */
  pinnedTokenVars?: string[];
  /** Optional layout.md excerpt for context. */
  layoutMdExcerpt?: string;
  /** Override the default model. */
  modelId?: string;
  /** Anthropic API key — overrides env. */
  apiKey?: string;
}

export interface RefineComponentResult {
  code: string;
  editSchema: EditSchema;
  rawModelOutput: string;
  usage: { inputTokens: number; outputTokens: number };
}

/**
 * Apply a natural-language instruction to an existing saved component. Used
 * by the inspector's Refine chat input — the user types "make the corners
 * smaller" or "use the brand colour for the title" and Claude returns a new
 * TSX + schema with the smallest change that satisfies the request.
 *
 * Reuses the parser + validator from generate-component.ts so the same
 * safety nets (variant case, token existence, text-on-leaf-only) apply.
 */
export async function refineComponent(
  input: RefineComponentInput
): Promise<RefineComponentResult> {
  const modelId = input.modelId ?? "claude-sonnet-4-6";
  const anthropic = new Anthropic({ apiKey: input.apiKey });
  const modelMax = await getModelMaxOutputTokens(modelId);
  const maxTokens = Math.min(modelMax, REFINE_OUTPUT_CAP);

  // Use the same token filtering as generate so the refine prompt is sized
  // similarly and we don't blow context on enterprise kits.
  const filteredTokens = filterRelevantTokens(
    { name: "refine", description: input.instruction, variantCount: 1 },
    input.tokens,
    input.pinnedTokenVars
  );
  const tokenList = renderTokenListForPrompt(filteredTokens);

  const userText = `# Project tokens (use only these — refer by exact CSS variable name)

${tokenList}

# Existing TSX

\`\`\`tsx
${input.code}
\`\`\`

# Existing edit schema

\`\`\`json
${JSON.stringify(input.editSchema, null, 2)}
\`\`\`

${input.layoutMdExcerpt ? `# Design philosophy excerpt\n\n${input.layoutMdExcerpt}\n\n` : ""}# User instruction

${input.instruction}

Apply the instruction with the smallest change possible. Return the updated TSX and edit schema in the two fenced code blocks as specified.`;

  const response = await anthropic.messages.create({
    model: modelId,
    max_tokens: maxTokens,
    system: REFINE_SYSTEM_PROMPT,
    messages: [{ role: "user", content: [{ type: "text", text: userText }] }],
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

  return {
    code: parsed.code,
    editSchema: parsed.editSchema,
    rawModelOutput,
    usage,
  };
}
