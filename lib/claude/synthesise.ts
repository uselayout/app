import Anthropic from "@anthropic-ai/sdk";
import type {
  TextBlockParam,
  ImageBlockParam,
} from "@anthropic-ai/sdk/resources/messages";
import type { ExtractionResult } from "@/lib/types";
import type { StreamWithUsage, TokenUsageResult } from "@/lib/types/billing";

const SYSTEM_PROMPT = `You are a design system architect synthesizing extracted design data into a DESIGN.md context file. This file will be consumed by AI coding agents (Claude Code, Cursor, Copilot) to generate pixel-accurate UI components.

CRITICAL PRINCIPLES:
1. Format tokens as CSS custom properties in fenced code blocks — this is the format AI agents will generate code with, so zero translation is needed.
2. Every token MUST include a semantic name, exact value, AND usage description in a comment.
3. Use the three-tier token architecture: primitive values → semantic aliases → component applications. Prioritise documenting the semantic tier — it provides named intent with concrete values.
4. Include composite tokens as structured groups. Typography is a composite: font-family + font-size + font-weight + line-height + letter-spacing bundled together — NEVER list these as separate tokens.
5. Write prohibitions as absolute rules ("NEVER"), not suggestions ("try to avoid").
6. Include ONE real production-ready code example per key component showing correct token usage with all states.
7. For sparse or reconstructed token data, annotate confidence level inline: /* extracted: high confidence */ vs /* reconstructed: moderate confidence, inferred from 3 elements */
8. Keep Section 0 (Quick Reference) to exactly 50-75 lines — it must be copy-pasteable as standalone context into CLAUDE.md or .cursorrules.
9. Name colours by PURPOSE (--color-action-primary), not appearance (--color-blue-button).
10. Write anti-patterns as "failure narratives": explain WHY the AI fails in that specific way, not just that it fails. Format: **Rule → Why it fails → What to do instead.**
11. Write rules with extreme specificity — "16px" not "medium spacing", exact hex values, exact font names.
12. If you genuinely lack data for a value, write "[TBD - extract manually]" — never fabricate values.

HANDLING SPARSE OR RECONSTRUCTED TOKEN DATA:
If the extracted design system has few/no CSS custom properties:
- Do NOT scatter literal hex values through the DESIGN.md — always create a CSS variable token system first
- Synthesise tokens from computed styles by clustering: group colours by hue family, spacing by multiples (4px grid? 8px?)
- Map clusters to semantic intent: dominant background colour → --color-surface, primary accent → --color-primary, body text colour → --color-text
- Annotate each synthetic token with confidence level inline in the comment

OUTPUT FORMAT RULES:
- All tokens: fenced \`\`\`css code blocks with inline usage description comments
- Colour palettes, spacing scales, state tables: markdown tables
- Bold 1-3 critical values or rules per section for quick scanning

The DESIGN.md section structure:

## 0. Quick Reference
50-75 lines. Standalone injectable — copy-pasteable into CLAUDE.md or .cursorrules.
Structure: [1] Stack & styling approach + token source [2] Core tokens in ONE fenced CSS code block [3] ONE real component example in a tsx code block [4] 5-8 critical prohibitions as NEVER rules [5] "Full design system → see DESIGN.md" link.
This section alone must produce significantly better AI output than no context at all.

## 1. Design Direction & Philosophy
Personality, aesthetic intent, what this design explicitly rejects. The "direction before building" layer.
Answer: What is the character? What mood or feeling? What are we NOT doing? (e.g. "Never use rounded corners > 8px. Never use warm colours.")

## 2. Colour System
Three tiers documented explicitly: Primitive values → Semantic aliases → Component tokens (if they differ).
Semantic tier is mandatory. Include usage description for every token. Mode variants (light/dark) if applicable.
Format as a fenced CSS code block.

## 3. Typography System
Composite token groups only — NEVER isolated properties. Each group: font-family + font-size + font-weight + line-height + letter-spacing.
Font stack with fallbacks. Weight scale. Pairing rules. Format as CSS code block or markdown table.

## 4. Spacing & Layout
Base unit. Complete spacing scale. Grid system and breakpoints. Container widths. Flex vs grid decision rules.
Format as CSS code block.

## 5. Page Structure & Layout Patterns
Derived from visual analysis of the page screenshots (if provided).
5.1 Section Map: ordered table — section name, layout type, approximate height, key elements. This is the actual structure of the extracted page that agents MUST follow when building UI for this design system.
5.2 Layout Patterns: how each section is laid out (grid, flex, full-width vs contained, column ratios, asymmetric splits).
5.3 Visual Hierarchy: what is visually prominent, CTA placement, image positions, whitespace rhythm between sections.
5.4 Content Patterns: repeating text/image/CTA arrangements that agents should replicate.
If no screenshots are provided, omit this section entirely.

## 6. Component Patterns
5-10 key components. Each MUST include:
- Anatomy (what sub-elements exist)
- Token-to-property mappings for ALL states: default, hover, focus, active, disabled, loading, error
- ONE real TSX code example showing correct token usage and full state handling

## 7. Elevation & Depth
Shadow tokens, border tokens, z-index scale, layering principles.
Format as CSS code block.

## 8. Motion
Timing functions, durations, easing tokens. When to animate and when not to.
Format as CSS code block.

## 9. Anti-Patterns & Constraints
Numbered list. Each follows format: **Rule → Why it fails → What to do instead.**
Minimum items: hardcoded colours, arbitrary spacing, font defaults (Inter/Roboto/Arial), dynamic Tailwind class construction, missing interaction states, inline styles, !important abuse, absolute positioning for layout, placeholder content, mixing styling approaches.

## Appendix A: Complete Token Reference
Full CSS variable table — name, value, usage. All tiers. (Long is fine — this is reference material.)

## Appendix B: Token Source Metadata
tokenSource: [extracted-css-vars | extracted-config | reconstructed-from-computed]
Confidence level. Clustering method used for any reconstructed tokens.
If Tailwind: note v3 (no CSS vars) vs v4 (CSS vars via @theme).`;

function buildUserContent(
  data: ExtractionResult
): Array<TextBlockParam | ImageBlockParam> {
  const sections: string[] = [];

  // Token source metadata — classify confidence upfront
  const cssVarCount = Object.keys(data.cssVariables).length;
  const isTailwind = data.librariesDetected?.["tailwind-css"] === true;
  const tokenSource = cssVarCount > 10
    ? "extracted-css-vars"
    : isTailwind
      ? "utility-class-based"
      : "reconstructed-from-computed";

  sections.push(
    `Design system extracted from: ${data.sourceName}`,
    `Source type: ${data.sourceType}`,
    `Token source: ${tokenSource}`,
    `Confidence: ${cssVarCount > 20 ? "high" : cssVarCount > 5 ? "medium" : "low"} (${cssVarCount} CSS custom properties found)`,
  );

  if (cssVarCount > 0) {
    // Group CSS variables by category for structured synthesis
    const allVars = Object.entries(data.cssVariables).slice(0, 100);
    const colourVars = allVars.filter(([k]) => /color|colour|bg|background|fill|stroke|text|border|ring|shadow/i.test(k));
    const spacingVars = allVars.filter(([k]) => /space|spacing|gap|padding|margin|size|width|height|radius|rounded/i.test(k));
    const typographyVars = allVars.filter(([k]) => /font|text|size|weight|leading|tracking|line/i.test(k));
    const otherVars = allVars.filter(([k]) =>
      !colourVars.find(([c]) => c === k) &&
      !spacingVars.find(([s]) => s === k) &&
      !typographyVars.find(([t]) => t === k)
    );

    const formatVars = (vars: [string, string][]) =>
      vars.map(([k, v]) => {
        const desc = data.tokens.colors.find(t => t.name === k || t.cssVariable === k)?.description
          ?? data.tokens.typography.find(t => t.name === k || t.cssVariable === k)?.description;
        return `  ${k}: ${v}${desc ? ` /* ${desc} */` : ""}`;
      }).join("\n");

    sections.push(
      `--- EXTRACTED CSS CUSTOM PROPERTIES ---\n` +
      (colourVars.length > 0 ? `/* COLOURS */\n${formatVars(colourVars)}\n` : "") +
      (spacingVars.length > 0 ? `/* SPACING & LAYOUT */\n${formatVars(spacingVars)}\n` : "") +
      (typographyVars.length > 0 ? `/* TYPOGRAPHY */\n${formatVars(typographyVars)}\n` : "") +
      (otherVars.length > 0 ? `/* OTHER */\n${formatVars(otherVars)}` : "")
    );
  } else {
    sections.push(
      `--- CSS CUSTOM PROPERTIES ---\n` +
      `NONE FOUND NATIVELY. Synthesise a CSS variable token system from the computed styles below. ` +
      `Mark every synthesised token with "/* reconstructed */" in its comment. ` +
      `Create semantic tokens (--color-primary, --color-text, --space-md, etc.) by clustering computed values — ` +
      `group colours by hue family, spacing by grid multiples (4px? 8px?). ` +
      `This gives the consuming AI agent a closed token set to generate from.`
    );
  }

  if (data.fonts.length > 0) {
    sections.push(
      `--- EXTRACTED FONT DECLARATIONS ---\n${JSON.stringify(data.fonts, null, 2)}`
    );
  }

  if (Object.keys(data.computedStyles).length > 0) {
    sections.push(
      `--- COMPUTED STYLES FOR KEY ELEMENTS (use for token synthesis/clustering) ---\n${JSON.stringify(data.computedStyles, null, 2)}`
    );
  }

  if (data.components.length > 0) {
    const comps = data.components
      .slice(0, 30)
      .map((c) =>
        `- ${c.name} (${c.variantCount} variants)${c.description ? `: ${c.description}` : ""}\n` +
        `  REQUIRED states: default, hover, focus, active, disabled, loading, error`
      )
      .join("\n");
    sections.push(`--- COMPONENT INVENTORY ---\n${comps}`);
  }

  if (data.tokens.colors.length > 0) {
    const colours = data.tokens.colors
      .map((t) => `  ${t.name}: ${t.value}${t.description ? ` /* ${t.description} */` : ""}`)
      .join("\n");
    sections.push(`--- COLOUR TOKENS (with descriptions where available) ---\n${colours}`);
  }

  if (data.tokens.typography.length > 0) {
    const typo = data.tokens.typography
      .map((t) => `  ${t.name}: ${t.value}${t.description ? ` /* ${t.description} */` : ""}`)
      .join("\n");
    sections.push(
      `--- TYPOGRAPHY TOKENS (group these as composites in the DESIGN.md — never list individually) ---\n${typo}`
    );
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

  const hasScreenshots = data.screenshots.length > 0;

  sections.push(
    `Generate a complete DESIGN.md following the Layout specification:\n` +
    `0. Quick Reference (50-75 lines, standalone injectable)\n` +
    `1. Design Direction & Philosophy\n` +
    `2. Colour System (three-tier: primitives → semantic → component)\n` +
    `3. Typography System (composite groups, never isolated properties)\n` +
    `4. Spacing & Layout\n` +
    (hasScreenshots ? `5. Page Structure & Layout Patterns (from screenshots — section map, layout patterns, visual hierarchy, content patterns)\n` : "") +
    `6. Component Patterns (with code examples and full state coverage)\n` +
    `7. Elevation & Depth\n` +
    `8. Motion\n` +
    `9. Anti-Patterns & Constraints (failure narratives: Rule → Why it fails → What to do instead)\n` +
    `Appendix A: Complete Token Reference\n` +
    `Appendix B: Token Source Metadata`
  );

  const contentBlocks: Array<TextBlockParam | ImageBlockParam> = [];

  // All text sections as one block
  contentBlocks.push({ type: "text", text: sections.join("\n\n") });

  // Add screenshots as image blocks for page structure analysis
  if (hasScreenshots) {
    for (const screenshot of data.screenshots) {
      if (!screenshot) continue;
      const base64Data = screenshot.replace(/^data:image\/\w+;base64,/, "");
      contentBlocks.push({
        type: "image",
        source: {
          type: "base64",
          media_type: "image/png",
          data: base64Data,
        },
      });
    }
    contentBlocks.push({
      type: "text",
      text: "Analyse the screenshots above to write Section 5 (Page Structure & Layout Patterns). " +
        "Document the actual page sections in order, their layout patterns, visual hierarchy, and content arrangements. " +
        "This section is critical — AI agents will use it to replicate the real page structure instead of generating generic layouts.",
    });
  }

  return contentBlocks;
}

export function createDesignMdStream(
  extractionData: ExtractionResult,
  apiKey?: string
): StreamWithUsage {
  const anthropic = new Anthropic(apiKey ? { apiKey } : {});
  const userContent = buildUserContent(extractionData);

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
        controller.enqueue(encoder.encode(`\n\n[Error generating DESIGN.md: ${msg}]`));
        resolveUsage({ inputTokens: 0, outputTokens: 0 });
      } finally {
        controller.close();
      }
    },
  });

  return { stream, usage };
}
