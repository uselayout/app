import Anthropic from "@anthropic-ai/sdk";
import type { StreamWithUsage, TokenUsageResult } from "@/lib/types/billing";

const SYSTEM_PROMPT = `You are an expert design system editor. You receive a DESIGN.md file (a structured design system specification) and a user instruction describing what to change.

RULES:
- Return ONLY the complete updated DESIGN.md — no explanation, no commentary, no code fences.
- Preserve ALL existing structure, sections, and formatting exactly as-is.
- Only modify what the user's instruction explicitly asks for.
- Never remove sections, tokens, or content unless the user explicitly asks you to.
- Maintain consistent formatting: same heading levels, same table structures, same code block styles.
- If the instruction is ambiguous, make the most conservative reasonable interpretation.
- Do not add new sections unless the user asks for them.
- Keep token names consistent with existing naming conventions in the document.`;

export function createEditStream(
  instruction: string,
  designMd: string,
  apiKey?: string
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
          model: "claude-sonnet-4-6",
          max_tokens: 16384,
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: "user",
              content: `Here is the current DESIGN.md:\n\n${designMd}\n\n---\n\nInstruction: ${instruction}`,
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
