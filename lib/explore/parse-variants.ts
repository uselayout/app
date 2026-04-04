import type { DesignVariant } from "@/lib/types";

/**
 * Parse streamed multi-variant output into DesignVariant objects.
 *
 * Expected format from Claude:
 *   ### Variant 1: Bold Hero
 *   A high-impact hero with large typography and full-width background.
 *   ```tsx
 *   export default function Variant1() { ... }
 *   ```
 *
 *   ### Variant 2: Minimal
 *   ...
 */

interface ParseOptions {
  idOffset?: number;
  batchId?: string;
  batchPrompt?: string;
}

export function parseVariants(output: string, options: ParseOptions = {}): DesignVariant[] {
  const { idOffset = 0, batchId, batchPrompt } = options;
  const sections = output.split(/^### Variant \d+:\s*/m).filter(Boolean);
  const variants: DesignVariant[] = [];

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i].trim();
    if (!section) continue;

    // First line is the name (may include trailing whitespace/newline)
    const firstNewline = section.indexOf("\n");
    const name = firstNewline === -1 ? section : section.slice(0, firstNewline).trim();

    // Everything after the name until the code block is the rationale
    const rest = firstNewline === -1 ? "" : section.slice(firstNewline + 1);
    const codeMatch = rest.match(/```(?:tsx|typescript|jsx)?\r?\n([\s\S]*?)```/);
    const code = codeMatch?.[1]?.trim() ?? "";

    // Rationale is text between the name line and the code block
    const codeBlockStart = rest.indexOf("```");
    const rationale =
      codeBlockStart > 0
        ? rest.slice(0, codeBlockStart).trim()
        : "";

    if (!code) continue;

    variants.push({
      id: `variant-${idOffset + i}`,
      name,
      rationale,
      code,
      ...(batchId != null && { batchId }),
      ...(batchPrompt != null && { batchPrompt }),
    });
  }

  return variants;
}

/**
 * Partial variant data extracted from an in-progress stream.
 * Used to drive the live preview before transpilation.
 */
export interface PartialVariant {
  index: number;
  name: string | null;
  rationale: string | null;
  codeInProgress: string;
  isComplete: boolean;
}

/**
 * Parse streaming output into partial variants, including in-progress ones.
 * Unlike parseVariants(), this returns variants whose code blocks haven't
 * closed yet, enabling live preview of the UI as it streams.
 */
export function parsePartialVariants(output: string): PartialVariant[] {
  const headingPattern = /^### Variant \d+:\s*/m;
  const sections = output.split(headingPattern);
  // First element is text before the first heading (discard)
  const filtered = sections.slice(1);
  const results: PartialVariant[] = [];

  for (let i = 0; i < filtered.length; i++) {
    const section = filtered[i];
    if (!section) continue;

    const firstNewline = section.indexOf("\n");
    const name = firstNewline === -1 ? section.trim() : section.slice(0, firstNewline).trim();
    const rest = firstNewline === -1 ? "" : section.slice(firstNewline + 1);

    // Check for a complete code block (closed ```)
    const closedMatch = rest.match(/```(?:tsx|typescript|jsx)?\r?\n([\s\S]*?)```/);
    if (closedMatch) {
      const codeBlockStart = rest.indexOf("```");
      const rationale = codeBlockStart > 0 ? rest.slice(0, codeBlockStart).trim() : "";
      results.push({
        index: i,
        name: name || null,
        rationale: rationale || null,
        codeInProgress: closedMatch[1]?.trim() ?? "",
        isComplete: true,
      });
      continue;
    }

    // Check for an open (unclosed) code block
    const openMatch = rest.match(/```(?:tsx|typescript|jsx)?\r?\n([\s\S]*)/);
    if (openMatch) {
      const codeBlockStart = rest.indexOf("```");
      const rationale = codeBlockStart > 0 ? rest.slice(0, codeBlockStart).trim() : "";
      results.push({
        index: i,
        name: name || null,
        rationale: rationale || null,
        codeInProgress: openMatch[1] ?? "",
        isComplete: false,
      });
      continue;
    }

    // Heading exists but no code block yet
    results.push({
      index: i,
      name: name || null,
      rationale: rest.trim() || null,
      codeInProgress: "",
      isComplete: false,
    });
  }

  return results;
}

/**
 * Check if a streaming output has a new complete variant since the last parse.
 * Returns the number of complete variants found.
 */
export function countCompleteVariants(output: string): number {
  const matches = output.match(/### Variant \d+:/g);
  const codeBlocks = output.match(/```(?:tsx|typescript|jsx)?\r?\n[\s\S]*?```/g);
  // A variant is complete when it has both a heading and a closed code block
  return Math.min(matches?.length ?? 0, codeBlocks?.length ?? 0);
}
