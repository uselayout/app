import type { StyleEdit, ElementAnnotation } from "@/lib/types";

/**
 * Build a structured prompt for Claude to rewrite TSX code
 * based on visual style edits or annotations.
 */

export function buildStyleEditPrompt(
  originalCode: string,
  styleEdits: StyleEdit[],
  layoutMd?: string
): string {
  const editsDescription = styleEdits
    .map((edit) => {
      const target = edit.elementClasses
        ? `<${edit.elementTag} class="${edit.elementClasses}">`
        : `<${edit.elementTag}>`;
      return `- On ${target}: change ${edit.property} from "${edit.before}" to "${edit.after}"${
        edit.tokenMatch ? ` (design token: ${edit.tokenMatch})` : ""
      }`;
    })
    .join("\n");

  return `You are updating a React/TSX component based on specific style changes the user made visually.

## Rules
1. Apply ONLY the requested changes — do not modify anything else
2. Use Tailwind CSS classes where possible, not inline styles
3. If a design token is specified, use the CSS variable (e.g. var(--color-primary)) instead of the raw value
4. Preserve the exact component structure, props, and logic
5. Return ONLY the complete updated TSX code, no explanation

## Style Changes
${editsDescription}

${layoutMd ? `## Design System Context\n${layoutMd.slice(0, 4000)}` : ""}

## Original Code
\`\`\`tsx
${originalCode}
\`\`\`

Return the updated TSX code:`;
}

export function buildAnnotationPrompt(
  originalCode: string,
  annotations: ElementAnnotation[],
  layoutMd?: string
): string {
  const notesDescription = annotations
    .map((ann) => {
      return `- On <${ann.elementTag}> at position (${Math.round(ann.rect.x)}, ${Math.round(ann.rect.y)}): "${ann.note}"`;
    })
    .join("\n");

  return `You are updating a React/TSX component based on design feedback annotations placed on specific elements.

## Rules
1. Interpret each annotation and apply the requested visual change
2. Use Tailwind CSS classes where possible, not inline styles
3. Use design system tokens from the context if available
4. Preserve the exact component structure, props, and logic
5. Return ONLY the complete updated TSX code, no explanation

## Annotations
${notesDescription}

${layoutMd ? `## Design System Context\n${layoutMd.slice(0, 4000)}` : ""}

## Original Code
\`\`\`tsx
${originalCode}
\`\`\`

Return the updated TSX code:`;
}
