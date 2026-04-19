import Anthropic from "@anthropic-ai/sdk";
import type { StreamWithUsage, TokenUsageResult } from "@/lib/types/billing";

const SYSTEM_PROMPT = `You are an expert design system editor. You receive a layout.md file (a structured design system specification) and a user instruction describing what to change.

RULES:
- Return ONLY the complete updated layout.md — no explanation, no commentary, no code fences.
- Preserve ALL existing structure, sections, and formatting exactly as-is.
- Only modify what the user's instruction explicitly asks for.
- Never remove sections, tokens, or content unless the user explicitly asks you to.
- Maintain consistent formatting: same heading levels, same table structures, same code block styles.
- If the instruction is ambiguous, make the most conservative reasonable interpretation.
- Add new sections when the user asks for them — place them in the logical position within the document structure.
- Keep token names consistent with existing naming conventions in the document.`;

export function createEditStream(
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

      try {
        const msgStream = anthropic.messages.stream({
          model: modelId,
          // 64k fits a ~12k-token layout.md rewrite with plenty of headroom.
          // Sonnet 4.6 supports 64k output; Opus 4.7 supports 128k. Previously
          // 32768, which silently truncated large-file rewrites (see the
          // Ramp project incident, 2026-04-19).
          max_tokens: 64_000,
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: "user",
              content: `Here is the current layout.md:\n\n${layoutMd}\n\n---\n\nInstruction: ${instruction}`,
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
        // If the model hit the output ceiling the response is truncated.
        // Emit a structured marker so clients can reject the rewrite and
        // restore the pre-edit version instead of silently accepting a
        // partial file.
        if (finalMessage.stop_reason === "max_tokens") {
          controller.enqueue(
            encoder.encode(
              "\n\n[AI_EDIT_TRUNCATED: Response hit the output token limit. The rewrite is incomplete and MUST NOT be saved.]"
            )
          );
        }
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

/** Structured marker the stream emits when the model runs out of output budget. */
export const AI_EDIT_TRUNCATED_MARKER = "[AI_EDIT_TRUNCATED:";

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

      try {
        const msgStream = anthropic.messages.stream({
          model: modelId,
          max_tokens: 8192,
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
