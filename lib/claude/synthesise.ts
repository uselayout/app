import Anthropic from "@anthropic-ai/sdk";
import type { ExtractionResult } from "@/lib/types";

const SYSTEM_PROMPT = `You are a design systems expert creating LLM-optimised design context files for SuperDuper AI Studio. Your output will be used by AI coding agents (Claude Code, Cursor, GitHub Copilot) to generate pixel-perfect UI components.

Critical requirements:
1. Follow the SuperDuper AI Studio DESIGN.md 8-section format exactly
2. Write rules with extreme specificity - "16px" not "medium spacing"
3. Every component spec must include the exact token-to-property mapping
4. The Anti-Patterns section (Section 8) is as important as the positive rules
5. Write as if a junior developer who has never seen this design will implement it
6. If you lack data for a value, write "[TBD - extract manually]" - never guess
7. Be opinionated and specific - vague specs produce inconsistent AI output
8. Section 0 (Quick Reference) must be self-sufficient - if only one section is read, output should still be significantly better than no context

The 8-section format:
## 0. Quick Reference (15 most important rules)
## 1. Visual Identity (design character + principles)
## 2. Colour System (CSS custom properties + usage rules)
## 3. Typography (type scale + hierarchy table)
## 4. Spacing & Layout (spacing scale + spatial rules)
## 5. Components (component specifications)
## 6. Patterns (page layout patterns)
## 7. Motion (timing functions + motion rules)
## 8. Anti-Patterns (never do / always do lists)`;

function buildUserPrompt(data: ExtractionResult): string {
  const sections: string[] = [
    `Design system data extracted from: ${data.sourceName}`,
    `Source type: ${data.sourceType}`,
  ];

  if (Object.keys(data.cssVariables).length > 0) {
    const vars = Object.entries(data.cssVariables)
      .slice(0, 100)
      .map(([k, v]) => `  ${k}: ${v}`)
      .join("\n");
    sections.push(`--- EXTRACTED CSS CUSTOM PROPERTIES ---\n${vars}`);
  } else {
    sections.push(
      `--- CSS CUSTOM PROPERTIES ---\nNONE FOUND: This design system does NOT use CSS custom properties. Do NOT invent or suggest CSS variable names in the DESIGN.md. Document extracted values (hex colours, font names, pixel sizes) directly as literal values.`
    );
  }

  if (data.fonts.length > 0) {
    sections.push(
      `--- EXTRACTED FONT DECLARATIONS ---\n${JSON.stringify(data.fonts, null, 2)}`
    );
  }

  if (Object.keys(data.computedStyles).length > 0) {
    sections.push(
      `--- COMPUTED STYLES FOR KEY ELEMENTS ---\n${JSON.stringify(data.computedStyles, null, 2)}`
    );
  }

  if (data.components.length > 0) {
    const comps = data.components
      .slice(0, 30)
      .map((c) => `- ${c.name} (${c.variantCount} variants)${c.description ? `: ${c.description}` : ""}`)
      .join("\n");
    sections.push(`--- COMPONENT INVENTORY ---\n${comps}`);
  }

  if (data.tokens.colors.length > 0) {
    const colours = data.tokens.colors
      .map((t) => `  ${t.name}: ${t.value}`)
      .join("\n");
    sections.push(`--- COLOUR TOKENS ---\n${colours}`);
  }

  if (data.tokens.typography.length > 0) {
    const typo = data.tokens.typography
      .map((t) => `  ${t.name}: ${t.value}`)
      .join("\n");
    sections.push(`--- TYPOGRAPHY TOKENS ---\n${typo}`);
  }

  if (Object.keys(data.librariesDetected).length > 0) {
    const libs = Object.entries(data.librariesDetected)
      .filter(([, v]) => v)
      .map(([k]) => k)
      .join(", ");
    if (libs) {
      sections.push(`--- DETECTED LIBRARIES ---\n${libs}`);
    }
  }

  sections.push(
    "Generate a complete DESIGN.md following the SuperDuper AI Studio format specification."
  );

  return sections.join("\n\n");
}

export function createDesignMdStream(
  extractionData: ExtractionResult,
  apiKey?: string
): ReadableStream<Uint8Array> {
  const anthropic = new Anthropic({ apiKey });
  const userPrompt = buildUserPrompt(extractionData);

  return new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      try {
        const stream = anthropic.messages.stream({
          model: "claude-sonnet-4-6",
          max_tokens: 8192,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: userPrompt }],
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
        controller.enqueue(encoder.encode(`\n\n[Error generating DESIGN.md: ${msg}]`));
      } finally {
        controller.close();
      }
    },
  });
}
