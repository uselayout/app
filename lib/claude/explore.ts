import Anthropic from "@anthropic-ai/sdk";
import type { StreamWithUsage, TokenUsageResult } from "@/lib/types/billing";

const EXPLORE_SYSTEM = `You are an expert design explorer. You generate multiple distinct UI component variations that all faithfully follow a provided design system.

CRITICAL RULES:

Token Usage (Highest Priority)
- Build ACTUAL UI components that render in a browser. Never build token tables, spec viewers, or documentation.
- Output TypeScript + React + Tailwind CSS.
- Follow the design system specification below with complete fidelity.
- If the design system defines CSS custom properties (var(--...)), use them exclusively — never hardcode colour, spacing, or typography values.
- If the design system does NOT define CSS custom properties, use the exact extracted values directly.

Variant Diversity
- Each variant MUST explore a genuinely different layout, composition, or visual approach.
- Vary: layout direction, visual weight, whitespace, alignment, density, imagery use, CTA placement.
- Do NOT just change colours between variants — the design system tokens stay the same.
- Think like a senior designer presenting options to a client.

Interaction States (Mandatory)
- Every interactive element MUST handle: default, hover, focus-visible, active, disabled states.
- This is a structural requirement, not optional polish.

OUTPUT FORMAT:
For each variant, output EXACTLY this format:

### Variant 1: [Short Name]
[One sentence describing the design direction and what makes it different]
\`\`\`tsx
export default function Variant1() {
  // complete, self-contained component
}
\`\`\`

### Variant 2: [Short Name]
[One sentence rationale]
\`\`\`tsx
export default function Variant2() { ... }
\`\`\`

IMPORTANT: Each component must be fully self-contained. No shared imports between variants. No prose outside the variant blocks.`;

const REFINE_SYSTEM = `You are an expert design refiner. You take an existing UI component and generate refined variations based on specific feedback, while staying faithful to the design system.

CRITICAL RULES:
- Start from the provided base component — preserve its core structure and intent.
- Apply the requested refinement to create distinct variations of the improvement.
- Follow the design system specification with complete fidelity.
- If the design system defines CSS custom properties (var(--...)), use them exclusively.
- Every interactive element MUST handle: default, hover, focus-visible, active, disabled states.

OUTPUT FORMAT:
For each variant, output EXACTLY this format:

### Variant 1: [Short Name]
[One sentence describing what changed from the base and why]
\`\`\`tsx
export default function Variant1() {
  // complete, self-contained component
}
\`\`\`

IMPORTANT: Each component must be fully self-contained. No shared imports between variants. No prose outside the variant blocks.`;

export function createExploreStream(
  prompt: string,
  designMd: string,
  variantCount: number,
  apiKey?: string
): StreamWithUsage {
  const anthropic = new Anthropic({ apiKey });
  const systemPrompt = `${EXPLORE_SYSTEM}\n\nGenerate exactly ${variantCount} variants.\n\n${designMd}`;

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
          max_tokens: 64000,
          system: systemPrompt,
          messages: [{ role: "user", content: prompt }],
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

/**
 * Create a streaming refinement — takes a base variant and generates new variations
 * based on a follow-up prompt.
 */
export function createRefineStream(
  baseCode: string,
  refinementPrompt: string,
  designMd: string,
  variantCount: number,
  apiKey?: string
): StreamWithUsage {
  const anthropic = new Anthropic({ apiKey });
  const systemPrompt = `${REFINE_SYSTEM}\n\nGenerate exactly ${variantCount} refined variants.\n\n${designMd}`;

  let resolveUsage: (u: TokenUsageResult) => void;
  const usage = new Promise<TokenUsageResult>((resolve) => {
    resolveUsage = resolve;
  });

  const userMessage = `Here is the base component to refine:

\`\`\`tsx
${baseCode}
\`\`\`

Refinement request: ${refinementPrompt}`;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      try {
        const msgStream = anthropic.messages.stream({
          model: "claude-sonnet-4-6",
          max_tokens: 64000,
          system: systemPrompt,
          messages: [{ role: "user", content: userMessage }],
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
