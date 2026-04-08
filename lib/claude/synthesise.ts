import Anthropic from "@anthropic-ai/sdk";
import type {
  TextBlockParam,
  ImageBlockParam,
} from "@anthropic-ai/sdk/resources/messages";
import type { ExtractionResult, ExtractedToken } from "@/lib/types";
import type { StreamWithUsage, TokenUsageResult } from "@/lib/types/billing";
import { isTransientError, friendlyApiError } from "@/lib/api-error";

const SYSTEM_PROMPT = `You are a design system architect synthesizing extracted design data into a layout.md context file. This file will be consumed by AI coding agents (Claude Code, Cursor, Copilot) to generate pixel-accurate UI components.

CRITICAL PRINCIPLES:
1. Format tokens as CSS custom properties in fenced code blocks — this is the format AI agents will generate code with, so zero translation is needed.
2. Every token MUST include a semantic name, exact value, AND usage description in a comment.
3. Use the three-tier token architecture: primitive values → semantic aliases → component applications. Prioritise documenting the semantic tier — it provides named intent with concrete values.
4. Include composite tokens as structured groups. Typography is a composite: font-family + font-size + font-weight + line-height + letter-spacing bundled together — NEVER list these as separate tokens.
5. Write prohibitions as absolute rules ("NEVER"), not suggestions ("try to avoid").
6. Include ONE real production-ready code example per key component showing correct token usage with all states.
7. For sparse or reconstructed token data, annotate confidence level inline: /* extracted: high confidence */ vs /* reconstructed: moderate confidence, inferred from 3 elements */
8. Keep Section 0 (Quick Reference) to exactly 50-75 lines — it must be copy-pasteable as standalone context into CLAUDE.md or .cursorrules.
9. Name colours by PURPOSE (--color-action-primary), not appearance (--color-blue-button). However, if the site already defines CSS custom properties, PRESERVE their original names exactly as extracted. Only apply semantic naming to tokens you synthesise from computed styles.
NOTE: The output file is called layout.md (not design.md). References within the content should use "layout.md".
10. Write anti-patterns as "failure narratives": explain WHY the AI fails in that specific way, not just that it fails. Format: **Rule → Why it fails → What to do instead.**
11. Write rules with extreme specificity — "16px" not "medium spacing", exact hex values, exact font names.
12. If you genuinely lack data for a value, write "[TBD - extract manually]" — never fabricate values.
13. PRESERVE original CSS variable names from the extraction. If the site defines --primary, use --primary in the token system, not --color-action-primary. Only synthesise NEW names for tokens derived from computed styles (not from CSS variables). The goal is 1:1 fidelity with the site's actual CSS, augmented with usage descriptions and grouping.
14. In Section 0 (Quick Reference), include a "How to apply" one-liner: "Use as var(--token-name) in CSS, style={{ prop: 'var(--token-name)' }} in JSX, or bg-[var(--token-name)] in Tailwind."

HANDLING SPARSE OR RECONSTRUCTED TOKEN DATA:
These rules apply ONLY when the token source is "reconstructed-from-computed" (the site has few/no CSS custom properties).
When the token source is "extracted-css-vars", use the original CSS variable names exactly as provided and skip reconstruction.
- Do NOT scatter literal hex values through the layout.md — always create a CSS variable token system first
- Synthesise tokens from computed styles by clustering: group colours by hue family, spacing by multiples (4px grid? 8px?)
- Map clusters to semantic intent: dominant background colour → --color-surface, primary accent → --color-primary, body text colour → --color-text
- Annotate each synthetic token with confidence level inline in the comment
- For border-radius: identify the distinct radius scale from extracted values. Common patterns:
  - Sharp (0px), small (4px), medium (8px), large (16px), pill/full (>=50px)
  - Many sites use pill-shaped buttons (border-radius >= 50px). If the radius census shows large values on CTA buttons, the primary button radius is pill-shaped, NOT 8px
  - Name radius tokens by scale: --radius-sm, --radius-md, --radius-lg, --radius-full
  - CRITICAL: cookie banners and modals often have different radius values than the brand UI. Use the element context to identify which values belong to the main design system
- For layout properties: use the extracted display, flexDirection, justifyContent, alignItems, and gap values to document how components are laid out — not just how they look

OUTPUT FORMAT RULES:
- All tokens: fenced \`\`\`css code blocks with inline usage description comments
- Colour palettes, spacing scales, state tables: markdown tables
- Bold 1-3 critical values or rules per section for quick scanning

The layout.md section structure:

## 0. Quick Reference
50-75 lines. Standalone injectable — copy-pasteable into CLAUDE.md or .cursorrules.
Structure: [1] Stack & styling approach + token source [2] Core tokens in ONE fenced CSS code block [3] ONE real component example in a tsx code block [4] 5-8 critical prohibitions as NEVER rules [5] "Full design system → see layout.md" link.
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
tokenSource: [extracted-from-figma | extracted-css-vars | extracted-config | utility-class-based | reconstructed-from-computed]
Confidence level. Clustering method used for any reconstructed tokens.
If Figma: note that tokens are authoritative design intent, not reverse-engineered.
If Tailwind: note v3 (no CSS vars) vs v4 (CSS vars via @theme).`;

// Synthesis caps — truncate at synthesis time, full data stays in project store
const MAX_CSS_VARIABLES = 400;
const MAX_COLOUR_TOKENS = 200;
const MAX_TYPOGRAPHY_TOKENS = 75;
const MAX_COMPUTED_STYLES = 30;
const MAX_SCREENSHOTS = 3;

/** Priority order for CSS variable truncation (lower = higher priority). */
function cssVarPriority(name: string): number {
  const lower = name.toLowerCase();
  if (/color|colour|bg|background|text|border|fill|stroke|shadow/.test(lower)) return 0;
  if (/space|spacing|gap|padding|margin|size|width|height/.test(lower)) return 1;
  if (/font|weight|leading|tracking|line/.test(lower)) return 2;
  if (/radius|rounded/.test(lower)) return 3;
  return 4;
}

function buildUserContent(
  data: ExtractionResult
): Array<TextBlockParam | ImageBlockParam> {
  const sections: string[] = [];

  // Token source metadata — classify confidence upfront
  const cssVarCount = Object.keys(data.cssVariables).length;
  const isTailwind = data.librariesDetected?.["tailwind-css"] === true;
  const isFigma = data.extractionSource === "figma" || data.sourceType === "figma";
  const totalTokenCount =
    data.tokens.colors.length +
    data.tokens.typography.length +
    data.tokens.spacing.length +
    data.tokens.radius.length +
    data.tokens.effects.length +
    data.tokens.motion.length;

  const tokenSource = isFigma && totalTokenCount > 10
    ? "extracted-from-figma"
    : cssVarCount > 10
      ? "extracted-css-vars"
      : isTailwind
        ? "utility-class-based"
        : "reconstructed-from-computed";

  const confidence = tokenSource === "extracted-from-figma"
    ? (totalTokenCount > 30 ? "high" : "medium")
    : cssVarCount > 20 ? "high" : cssVarCount > 5 ? "medium" : "low";

  sections.push(
    `Design system extracted from: ${data.sourceName}`,
    `Source type: ${data.sourceType}`,
    `Token source: ${tokenSource}`,
    `Confidence: ${confidence} (${isFigma ? `${totalTokenCount} tokens extracted from Figma` : `${cssVarCount} CSS custom properties found`})`,
  );

  if (tokenSource === "extracted-from-figma") {
    sections.push(
      `IMPORTANT: These tokens were extracted directly from a Figma design file. ` +
      `They are authoritative — use exact values and names. ` +
      `Annotate tokens with /* extracted */ not /* reconstructed */. ` +
      `Confidence should be "high" for all Figma-sourced tokens.`
    );
  }

  if (cssVarCount > 0) {
    // Group CSS variables by category for structured synthesis
    const sortedVars = Object.entries(data.cssVariables)
      .sort(([a], [b]) => cssVarPriority(a) - cssVarPriority(b));
    const allVars = sortedVars.slice(0, MAX_CSS_VARIABLES);
    const cssVarsOmitted = sortedVars.length - allVars.length;
    if (cssVarsOmitted > 0) {
      sections.push(
        `NOTE: ${cssVarsOmitted} CSS variables omitted for context budget (${sortedVars.length} total, showing top ${MAX_CSS_VARIABLES}). Full set available in tokens.css.`
      );
    }

    if (tokenSource === "extracted-css-vars") {
      sections.push(
        `IMPORTANT: Preserve all CSS variable names exactly as extracted. ` +
        `Do not rename --primary to --color-primary or similar. ` +
        `Add descriptive comments and group logically, but keep original names.`
      );
    }
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
  } else if (tokenSource === "extracted-from-figma") {
    // Figma extractions don't have CSS variables but have structured tokens.
    // Present all tokens as the authoritative source.
    const formatFigmaTokens = (label: string, tokens: ExtractedToken[]) => {
      if (tokens.length === 0) return "";
      return `/* ${label} */\n` + tokens
        .map((t) => `  --${t.name}: ${t.value};${t.description ? ` /* ${t.description} */` : ""}`)
        .join("\n") + "\n";
    };

    sections.push(
      `--- FIGMA DESIGN TOKENS (Source of Truth) ---\n` +
      `These tokens are extracted directly from Figma styles and variables. ` +
      `Use these EXACT names as CSS custom properties. Do NOT rename or remap them. ` +
      `Mark every token with "/* extracted */" in its comment.\n\n` +
      formatFigmaTokens("COLOURS", data.tokens.colors.slice(0, MAX_COLOUR_TOKENS)) +
      formatFigmaTokens("TYPOGRAPHY", data.tokens.typography.slice(0, MAX_TYPOGRAPHY_TOKENS)) +
      formatFigmaTokens("SPACING", data.tokens.spacing) +
      formatFigmaTokens("RADIUS", data.tokens.radius) +
      formatFigmaTokens("EFFECTS", data.tokens.effects) +
      formatFigmaTokens("MOTION", data.tokens.motion)
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

  // Include uploaded custom fonts so Claude knows they're available
  const uploadedFonts = (data as unknown as Record<string, unknown>)._uploadedFonts;
  if (Array.isArray(uploadedFonts) && uploadedFonts.length > 0) {
    const fontNames = uploadedFonts.map((f: Record<string, unknown>) => `${f.family} (${f.weight}, ${f.format})`).join(", ");
    sections.push(
      `--- CUSTOM FONT FILES AVAILABLE ---\nThe following custom font files have been uploaded and are available in the .layout/fonts/ directory with a fonts.css file containing @font-face declarations:\n${fontNames}\n\nIMPORTANT: In the Typography System section, include a note that custom font files are available at .layout/fonts/fonts.css and should be imported with @import './.layout/fonts/fonts.css' or a <link> tag. AI coding agents should reference this file to load the custom fonts.`
    );
  }

  if (Object.keys(data.computedStyles).length > 0) {
    const styleEntries = Object.entries(data.computedStyles);
    const capped = Object.fromEntries(styleEntries.slice(0, MAX_COMPUTED_STYLES));
    const omitted = styleEntries.length - Math.min(styleEntries.length, MAX_COMPUTED_STYLES);
    sections.push(
      `--- COMPUTED STYLES FOR KEY ELEMENTS (use for token synthesis/clustering) ---\n${JSON.stringify(capped, null, 2)}` +
      (omitted > 0 ? `\n/* ... ${omitted} additional element samples omitted */` : "")
    );
  }

  if (data.tokens.radius.length > 0) {
    const radiusTokens = data.tokens.radius
      .map((t) => `  ${t.name}: ${t.value}${t.description ? ` /* ${t.description} */` : ""}`)
      .join("\n");
    sections.push(
      `--- EXTRACTED BORDER-RADIUS VALUES ---\n` +
      `These were mined from actual page elements. Pill-shaped buttons (radius >= 50px) indicate the brand uses pill buttons.\n` +
      radiusTokens
    );
  }

  if (data.interactiveStates && Object.keys(data.interactiveStates).length > 0) {
    const capped = Object.fromEntries(
      Object.entries(data.interactiveStates).slice(0, 50)
    );
    sections.push(
      `--- INTERACTIVE STATE STYLES (hover/focus/active/disabled from CSS rules) ---\n` +
      `Use these to document accurate hover, focus, active, and disabled states for components.\n` +
      JSON.stringify(capped, null, 2)
    );
  }

  if (data.breakpoints && data.breakpoints.length > 0) {
    sections.push(
      `--- EXTRACTED BREAKPOINTS (from media queries) ---\n` +
      data.breakpoints.join(", ")
    );
  }

  if (data.layoutPatterns && data.layoutPatterns.length > 0) {
    const patterns = data.layoutPatterns
      .slice(0, 20)
      .map(p => `  ${p.direction} | main-axis: ${p.mainAxis} | cross-axis: ${p.crossAxis} (${p.count} instances)`)
      .join("\n");
    sections.push(
      `--- LAYOUT PATTERNS (from auto-layout analysis) ---\n` +
      `These are the most common flex/layout patterns found in Figma components. Use these to inform Section 4 (Spacing & Layout):\n` +
      patterns
    );
  }

  if (data.components.length > 0) {
    const comps = data.components
      .slice(0, 30)
      .map((c) => {
        let line = `- ${c.name} (${c.variantCount} variants)${c.description ? `: ${c.description}` : ""}`;
        if (c.properties) {
          const props = Object.entries(c.properties)
            .map(([key, prop]) => {
              let propStr = `${key}: ${prop.type}`;
              if (prop.defaultValue) propStr += ` = ${prop.defaultValue}`;
              if (prop.preferredValues?.length) propStr += ` [${prop.preferredValues.join(", ")}]`;
              return propStr;
            })
            .join(", ");
          if (props) line += `\n  Props: ${props}`;
        }
        line += `\n  REQUIRED states: default, hover, focus, active, disabled, loading, error`;
        return line;
      })
      .join("\n");
    sections.push(`--- COMPONENT INVENTORY ---\n${comps}`);
  }

  if (data.tokens.colors.length > 0) {
    const allColours = data.tokens.colors;
    const capped = allColours.slice(0, MAX_COLOUR_TOKENS);

    // Split by mode
    const defaultTokens = capped.filter((t) => !t.mode);
    const modeGroups = new Map<string, ExtractedToken[]>();
    for (const t of capped) {
      if (t.mode) {
        const group = modeGroups.get(t.mode) ?? [];
        group.push(t);
        modeGroups.set(t.mode, group);
      }
    }

    const formatTokens = (tokens: ExtractedToken[]) =>
      tokens
        .map((t) => `  ${t.name}: ${t.value}${t.description ? ` /* ${t.description} */` : ""}`)
        .join("\n");

    const omitted = allColours.length - capped.length;

    if (modeGroups.size > 0) {
      // Multi-mode: group by mode
      let colourSection = `--- COLOUR TOKENS ---\n`;
      if (defaultTokens.length > 0) {
        colourSection += `/* Default / Light mode */\n${formatTokens(defaultTokens)}\n\n`;
      }
      for (const [mode, tokens] of modeGroups) {
        colourSection += `/* ${mode} mode */\n${formatTokens(tokens)}\n\n`;
      }
      colourSection += `NOTE: This design system has multiple colour modes. Document all modes in the Colour System section. Use [data-theme="${[...modeGroups.keys()].join('"]/[data-theme="')}"] selectors for mode switching.`;
      if (omitted > 0) colourSection += `\n/* ... ${omitted} additional colour tokens omitted */`;
      sections.push(colourSection);
    } else {
      // Single mode: original behaviour
      sections.push(
        `--- COLOUR TOKENS (with descriptions where available) ---\n${formatTokens(defaultTokens)}` +
        (omitted > 0 ? `\n  /* ... ${omitted} additional colour tokens omitted for context budget */` : "")
      );
    }
  }

  if (data.tokens.typography.length > 0) {
    const allTypo = data.tokens.typography;
    const capped = allTypo.slice(0, MAX_TYPOGRAPHY_TOKENS);
    const typo = capped
      .map((t) => `  ${t.name}: ${t.value}${t.description ? ` /* ${t.description} */` : ""}`)
      .join("\n");
    const omitted = allTypo.length - capped.length;
    sections.push(
      `--- TYPOGRAPHY TOKENS (group these as composites in the layout.md — never list individually) ---\n${typo}` +
      (omitted > 0 ? `\n  /* ... ${omitted} additional typography tokens omitted for context budget */` : "")
    );
  }

  // Include effect tokens that contain border definitions
  const borderTokens = data.tokens.effects.filter((t) =>
    t.value.includes("solid") || t.value.includes("dashed") || t.value.includes("dotted")
  );
  if (borderTokens.length > 0) {
    const borders = borderTokens
      .map((t) => `  ${t.name}: ${t.value}${t.description ? ` /* ${t.description} */` : ""}`)
      .join("\n");
    sections.push(
      `--- BORDER TOKENS (use these for all border/divider styling — do not hardcode border values) ---\n${borders}`
    );
  }

  // Include motion tokens
  if (data.tokens.motion?.length > 0) {
    const motionList = data.tokens.motion
      .map((t) => `  ${t.name}: ${t.value}${t.description ? ` /* ${t.description} */` : ""}`)
      .join("\n");
    sections.push(
      `--- MOTION TOKENS (use for transitions and animations) ---\n${motionList}`
    );
  }

  if (Object.keys(data.librariesDetected).length > 0) {
    const libs = Object.entries(data.librariesDetected)
      .filter(([, v]) => v)
      .map(([k]) => k)
      .join(", ");
    if (libs) {
      sections.push(`--- DETECTED LIBRARIES ---\n${libs}`);
      if (data.librariesDetected["tailwind-css"]) {
        sections.push(
          `The site uses Tailwind CSS. Component code examples in the layout.md should use Tailwind utility classes ` +
          `(e.g. bg-[var(--color-primary)] text-sm rounded-lg) rather than inline styles or vanilla CSS.`
        );
      }
    }
  }

  const hasScreenshots = data.screenshots.length > 0;

  sections.push(
    `Generate a complete layout.md following the Layout specification:\n` +
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
    for (const screenshot of data.screenshots.slice(0, MAX_SCREENSHOTS)) {
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

export function createLayoutMdStream(
  extractionData: ExtractionResult,
  apiKey?: string
): StreamWithUsage {
  const anthropic = new Anthropic(apiKey ? { apiKey } : {});
  const userContent = buildUserContent(extractionData);

  let resolveUsage: (u: TokenUsageResult) => void;
  let rejectUsage: (err: unknown) => void;
  const usage = new Promise<TokenUsageResult>((resolve, reject) => {
    resolveUsage = resolve;
    rejectUsage = reject;
  });

  // Guard against double-settling (e.g. cancel() after reject)
  let usageSettled = false;
  const settle = {
    resolve(u: TokenUsageResult) {
      if (!usageSettled) { usageSettled = true; resolveUsage(u); }
    },
    reject(err: unknown) {
      if (!usageSettled) { usageSettled = true; rejectUsage(err); }
    },
  };

  const MAX_RETRIES = 2;

  const FINAL_MESSAGE_TIMEOUT_MS = 30_000;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let hasEnqueued = false;

      try {
        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
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
                hasEnqueued = true;
                controller.enqueue(encoder.encode(event.delta.text));
              }
            }

            // Race finalMessage against a timeout to prevent indefinite hangs
            const finalMessage = await Promise.race([
              msgStream.finalMessage(),
              new Promise<null>((resolve) =>
                setTimeout(() => resolve(null), FINAL_MESSAGE_TIMEOUT_MS)
              ),
            ]);

            if (finalMessage) {
              settle.resolve({
                inputTokens: finalMessage.usage.input_tokens,
                outputTokens: finalMessage.usage.output_tokens,
              });
            } else {
              // Timed out waiting for final usage stats; content was streamed OK
              settle.resolve({ inputTokens: 0, outputTokens: 0 });
            }
            return; // success
          } catch (err) {
            // Only retry if no content has been sent to the client yet
            // (retrying after partial output would produce corrupted content)
            if (!hasEnqueued && isTransientError(err) && attempt < MAX_RETRIES) {
              const delay = Math.pow(2, attempt) * 2000 + Math.random() * 1000;
              await new Promise((r) => setTimeout(r, delay));
              continue;
            }

            const friendly = friendlyApiError(err);
            controller.enqueue(
              encoder.encode(`\n\n[Error generating layout.md: ${friendly}]`)
            );
            settle.reject(err);
            return;
          }
        }
      } finally {
        controller.close();
      }
    },
    cancel() {
      // Stream cancelled by client; resolve with zeros (no refund needed)
      settle.resolve({ inputTokens: 0, outputTokens: 0 });
    },
  });

  return { stream, usage };
}
