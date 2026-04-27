import Anthropic from "@anthropic-ai/sdk";
import type { StreamWithUsage, TokenUsageResult } from "@/lib/types/billing";
import { getModelMaxOutputTokens } from "@/lib/ai/models";
import { applyPatches, parsePatches, type PatchApplyError } from "./edit-patches";

const EDIT_SYSTEM_PROMPT = `You are a surgical editor for a layout.md file (a structured design system specification). You receive the current file and a user instruction.

OUTPUT FORMAT — this is strict:
Return one or more search/replace blocks using exactly this format:

<<<<<<< SEARCH
exact text to find, copied verbatim from the file
=======
the replacement text
>>>>>>> REPLACE

RULES:
- Each SEARCH must match the file EXACTLY ONCE. Include enough surrounding context (a full line or two) to make it unique. NEVER paraphrase the SEARCH text.
- Only produce the smallest blocks needed to satisfy the instruction. Do NOT rewrite unrelated prose, whitespace, or formatting.
- To delete content: leave REPLACE empty.
- To add a new section or new content: anchor SEARCH on an existing line (usually the nearest heading or the final line of the file) and include that line verbatim in REPLACE, followed by the new content.
- For multiple independent edits, emit multiple blocks.
- Do not emit code fences around the blocks. Do not wrap the output in any other container.
- Short explanatory prose before the first block is allowed and will be ignored, but keep it under two sentences.
- If the instruction is truly impossible to carry out with surgical edits, return NO blocks and a single sentence explaining why.`;

export interface EditPlanSuccess {
  ok: true;
  newLayoutMd: string;
  appliedCount: number;
  rawModelOutput: string;
  usage: TokenUsageResult;
}

export interface EditPlanFailure {
  ok: false;
  error: PatchApplyError;
  rawModelOutput: string;
  usage: TokenUsageResult;
}

export type EditPlanResult = EditPlanSuccess | EditPlanFailure;

export async function planEdit(
  instruction: string,
  layoutMd: string,
  apiKey?: string,
  modelId: string = "claude-sonnet-4-6"
): Promise<EditPlanResult> {
  const anthropic = new Anthropic({ apiKey });
  const maxTokens = await getModelMaxOutputTokens(modelId);

  const response = await anthropic.messages.create({
    model: modelId,
    max_tokens: maxTokens,
    system: EDIT_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Here is the current layout.md:\n\n${layoutMd}\n\n---\n\nInstruction: ${instruction}\n\nReturn only SEARCH/REPLACE blocks.`,
      },
    ],
  });

  const rawModelOutput = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  const usage: TokenUsageResult = {
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  };

  const patches = parsePatches(rawModelOutput);
  const applied = applyPatches(layoutMd, patches);

  if (!applied.ok) {
    return { ok: false, error: applied.error, rawModelOutput, usage };
  }

  return {
    ok: true,
    newLayoutMd: applied.result.newLayoutMd,
    appliedCount: applied.result.applied,
    rawModelOutput,
    usage,
  };
}

const FIX_SYSTEM_PROMPT = `You are an expert design system editor. You receive a layout.md file and a list of missing content that needs to be added.

RULES:
- Return ONLY the new content to append — do NOT return the existing document.
- No explanation, no commentary, no code fences wrapping the output.
- Match the heading levels, formatting conventions, and naming style of the existing document.
- Generate complete, high-quality sections with real design system content based on what's already in the document.
- Use the same CSS custom property naming conventions found in the existing document.
- For anti-patterns: use failure narrative format (Rule → Why it fails → What to do instead).
- For missing sub-items within existing sections: output only the additional content with a comment like "<!-- Add to [Section Name] section -->" above it.`;

export function createFixStream(
  instruction: string,
  layoutMd: string,
  apiKey?: string,
  modelId: string = "claude-sonnet-4-6"
): StreamWithUsage {
  const anthropic = new Anthropic({ apiKey });

  let resolveUsage: (u: TokenUsageResult) => void;
  const usage = new Promise<TokenUsageResult>((resolve) => {
    resolveUsage = resolve;
  });

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const maxTokens = await getModelMaxOutputTokens(modelId);

      try {
        const msgStream = anthropic.messages.stream({
          model: modelId,
          max_tokens: maxTokens,
          system: FIX_SYSTEM_PROMPT,
          messages: [
            {
              role: "user",
              content: `Here is the current layout.md:\n\n${layoutMd}\n\n---\n\nGenerate ONLY the following missing content to append:\n\n${instruction}`,
            },
          ],
        });

        for await (const event of msgStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }

        const finalMessage = await msgStream.finalMessage();
        resolveUsage({
          inputTokens: finalMessage.usage.input_tokens,
          outputTokens: finalMessage.usage.output_tokens,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        controller.enqueue(encoder.encode(`\n\n[Error: ${msg}]`));
        resolveUsage({ inputTokens: 0, outputTokens: 0 });
      } finally {
        controller.close();
      }
    },
  });

  return { stream, usage };
}
