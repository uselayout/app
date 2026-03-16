import Anthropic from "@anthropic-ai/sdk";
import type { ContentBlockParam } from "@anthropic-ai/sdk/resources/messages";
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

Responsive Design (Mandatory)
- Use mobile-first Tailwind: base styles for mobile (375px), then sm: (640px), md: (768px), lg: (1024px), xl: (1280px).
- Every layout MUST adapt across breakpoints. Example: "flex flex-col md:flex-row", "w-full sm:w-1/2 lg:w-1/3".
- Typography scales: "text-sm md:text-base lg:text-lg" — never a single fixed size.
- Spacing adapts: "p-4 md:p-6 lg:p-8", "gap-3 md:gap-4 lg:gap-6".
- Grid columns adapt: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3".
- Hide/show elements per breakpoint when it improves the layout: "hidden md:block".
- The component will be previewed at 375px, 768px, and 1280px — it must look intentional at ALL three.

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

Images (MANDATORY — read carefully)
- ALL images — hero photos, product shots, team photos, avatars, headshots, thumbnails, icons — MUST use this exact format:
  <img data-generate-image="descriptive prompt" data-image-style="photo" data-image-ratio="16:9" alt="..." className="..." />
- data-image-style options: "photo", "illustration", "icon", "abstract"
- data-image-ratio options: "1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "21:9"
- For small images like avatars/headshots, use data-image-ratio="1:1": <img data-generate-image="professional headshot of a smiling woman in her 30s" data-image-style="photo" data-image-ratio="1:1" alt="Sarah Chen" className="w-10 h-10 rounded-full object-cover" />
- Write detailed, specific prompts — e.g. "A diverse team collaborating in a modern sunlit office with plants" not "team photo".
- NEVER use placeholder services (placehold.co, placeholder.com, via.placeholder.com, unsplash, picsum, dummyimage, or ANY external image URL).
- NEVER use empty src, data: URIs, or inline SVG placeholders for images. Omit the src attribute entirely — the pipeline adds it.
- If a section has testimonials, team members, or any people — each person MUST have a data-generate-image headshot.

IMPORTANT: Each component must be fully self-contained. No shared imports between variants. No prose outside the variant blocks.`;

const REFINE_SYSTEM = `You are an expert design refiner. You take an existing UI component and generate refined variations based on specific feedback, while staying faithful to the design system.

CRITICAL RULES:
- Start from the provided base component — preserve its core structure and intent.
- Apply the requested refinement to create distinct variations of the improvement.
- Follow the design system specification with complete fidelity.
- If the design system defines CSS custom properties (var(--...)), use them exclusively.
- Every interactive element MUST handle: default, hover, focus-visible, active, disabled states.

Responsive Design (Mandatory)
- Use mobile-first Tailwind: base styles for mobile (375px), then sm: (640px), md: (768px), lg: (1024px), xl: (1280px).
- Every layout MUST adapt across breakpoints. Example: "flex flex-col md:flex-row", "w-full sm:w-1/2 lg:w-1/3".
- Typography scales: "text-sm md:text-base lg:text-lg" — never a single fixed size.
- Spacing adapts: "p-4 md:p-6 lg:p-8", "gap-3 md:gap-4 lg:gap-6".
- Grid columns adapt: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3".
- The component will be previewed at 375px, 768px, and 1280px — it must look intentional at ALL three.

OUTPUT FORMAT:
For each variant, output EXACTLY this format:

### Variant 1: [Short Name]
[One sentence describing what changed from the base and why]
\`\`\`tsx
export default function Variant1() {
  // complete, self-contained component
}
\`\`\`

Images (MANDATORY)
- ALL images MUST use: <img data-generate-image="descriptive prompt" data-image-style="photo" data-image-ratio="16:9" alt="..." className="..." />
- This includes avatars, headshots, thumbnails — use data-image-ratio="1:1" for small square images.
- NEVER use placeholder services (placehold.co, placeholder.com, unsplash, etc.) or empty src attributes.

IMPORTANT: Each component must be fully self-contained. No shared imports between variants. No prose outside the variant blocks.`;

export function createExploreStream(
  prompt: string,
  designMd: string,
  variantCount: number,
  apiKey?: string,
  imageDataUrl?: string,
  contextFiles?: Array<{ name: string; content: string }>,
): StreamWithUsage {
  const anthropic = new Anthropic({ apiKey });
  const systemPrompt = `${EXPLORE_SYSTEM}\n\nGenerate exactly ${variantCount} variants.\n\n${designMd}`;

  // Build user message — text-only or multi-content with image + context files
  const userContent = buildUserContent(prompt, imageDataUrl, contextFiles);

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
          messages: [{ role: "user", content: userContent }],
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
  apiKey?: string,
  contextFiles?: Array<{ name: string; content: string }>,
): StreamWithUsage {
  const anthropic = new Anthropic({ apiKey });
  const systemPrompt = `${REFINE_SYSTEM}\n\nGenerate exactly ${variantCount} refined variants.\n\n${designMd}`;

  let resolveUsage: (u: TokenUsageResult) => void;
  const usage = new Promise<TokenUsageResult>((resolve) => {
    resolveUsage = resolve;
  });

  const contextBlock = contextFiles?.length
    ? contextFiles.map((f) => `--- context: ${f.name} ---\n${f.content}\n--- end ---`).join("\n\n") + "\n\n"
    : "";

  const userMessage = `${contextBlock}Here is the base component to refine:

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseDataUrl(dataUrl: string): { mediaType: "image/png" | "image/jpeg" | "image/webp"; data: string } | null {
  const match = dataUrl.match(/^data:(image\/(png|jpeg|webp));base64,(.+)$/);
  if (!match) return null;
  return { mediaType: match[1] as "image/png" | "image/jpeg" | "image/webp", data: match[3] };
}

function buildUserContent(
  prompt: string,
  imageDataUrl?: string,
  contextFiles?: Array<{ name: string; content: string }>,
): string | ContentBlockParam[] {
  const contextBlock = contextFiles?.length
    ? contextFiles.map((f) => `--- context: ${f.name} ---\n${f.content}\n--- end ---`).join("\n\n") + "\n\n"
    : "";
  const fullPrompt = contextBlock + prompt;

  if (!imageDataUrl) return fullPrompt;
  const parsed = parseDataUrl(imageDataUrl);
  if (!parsed) return fullPrompt;
  return [
    {
      type: "image" as const,
      source: { type: "base64" as const, media_type: parsed.mediaType, data: parsed.data },
    },
    { type: "text" as const, text: fullPrompt },
  ];
}
