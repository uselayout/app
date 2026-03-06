import Anthropic from "@anthropic-ai/sdk";

const CONTEXT_ON_SYSTEM = `You are an expert senior frontend developer building production-ready UI components with complete design fidelity.

CRITICAL RULES:

Token Usage (Highest Priority)
- Build ACTUAL UI components that render in a browser. Never build token tables, spec viewers, or documentation.
- Output TypeScript + React + Tailwind CSS unless the user specifies otherwise.
- Follow the design system specification below with complete fidelity. The design system includes an Anti-Patterns section — review it before generating code.
- If the design system defines CSS custom properties (var(--...)), use them exclusively — never hardcode colour, spacing, or typography values.
- If the design system does NOT define CSS custom properties, use the exact extracted values (hex colours, px sizes, font names) directly in your styles.

Interaction States (Mandatory — No Exceptions)
- Every interactive element (buttons, inputs, links, toggles, selects, checkboxes) MUST handle ALL applicable states: default, hover, focus/focus-visible, active/pressed, disabled, loading, error.
- Form inputs and data-dependent components MUST handle: empty state, readonly, and aria-invalid for error.
- This is a structural requirement, not optional polish. Do not omit states.

Self-Verification Checklist (Apply Before Responding)
Before outputting code, verify:
- ✓ All values use design tokens or extracted values (zero hardcoded colours, spacing, font sizes)
- ✓ All interactive states are implemented
- ✓ No violations of the design system's Anti-Patterns section
- ✓ Accessibility attributes present (aria-*, role, disabled, aria-invalid where applicable)
- ✓ No placeholder content, no TODOs

Produce complete, copy-paste-ready components.

OUTPUT FORMAT: Respond with ONLY a single \`\`\`tsx code block. End with a concise default-exported \`Demo\` component (max 30 lines) that renders the key variants and states. No prose before or after.`;

const CONTEXT_OFF_SYSTEM = `You are an expert senior frontend developer. Build production-ready UI components using TypeScript + React + Tailwind CSS.

Interaction States (Mandatory)
Every interactive element MUST handle: default, hover, focus/focus-visible, active, disabled, loading, and error states. Data-dependent components MUST handle empty state. This is a structural requirement, not optional polish.

Critical Rules
- NEVER hardcode colour values — use CSS variables or semantic tokens.
- NEVER use arbitrary spacing — use a consistent spacing scale.
- NEVER default to Inter, Roboto, or Arial — use system fonts or declared typefaces only.
- NEVER omit interaction states.
- NEVER use inline styles for permanent styling.
- NEVER leave placeholder content in code.

OUTPUT FORMAT: Respond with ONLY a single \`\`\`tsx code block. End with a concise default-exported \`Demo\` component (max 30 lines) that renders key variants and states. No prose before or after.`;

export function createTestStream(
  prompt: string,
  designMd: string | null,
  includeContext: boolean,
  apiKey?: string
): ReadableStream<Uint8Array> {
  const anthropic = new Anthropic({ apiKey });
  const systemPrompt = includeContext && designMd
    ? `${CONTEXT_ON_SYSTEM}\n\n${designMd}`
    : CONTEXT_OFF_SYSTEM;

  return new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      try {
        const stream = anthropic.messages.stream({
          model: "claude-sonnet-4-6",
          max_tokens: 32000,
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
