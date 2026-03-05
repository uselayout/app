import Anthropic from "@anthropic-ai/sdk";

const CONTEXT_ON_SYSTEM = `You are an expert senior frontend developer. You MUST follow the design system specification below with complete fidelity. Every rule, every token, every constraint is non-negotiable. Building something that violates these rules is a failure.

Output format: TypeScript + React + Tailwind CSS unless the user specifies otherwise.
Always use the CSS custom properties from the token set - never hardcode values.
Always include hover, focus, and disabled states unless the user says otherwise.`;

const CONTEXT_OFF_SYSTEM = `You are an expert senior frontend developer. Build UI components using TypeScript + React + Tailwind CSS. Use best practices.`;

export function createTestStream(
  prompt: string,
  designMd: string | null,
  includeContext: boolean
): ReadableStream<Uint8Array> {
  const anthropic = new Anthropic();
  const systemPrompt = includeContext && designMd
    ? `${CONTEXT_ON_SYSTEM}\n\n${designMd}`
    : CONTEXT_OFF_SYSTEM;

  return new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      try {
        const stream = anthropic.messages.stream({
          model: "claude-sonnet-4-6",
          max_tokens: 4096,
          system: systemPrompt,
          messages: [{ role: "user", content: prompt }],
        });

        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        controller.enqueue(encoder.encode(`\n\n[Error: ${msg}]`));
      } finally {
        controller.close();
      }
    },
  });
}
