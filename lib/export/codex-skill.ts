import { buildCuratedExtractedTokens } from "@/lib/tokens/curated-to-extracted";
import type { ExtractedToken, Project } from "@/lib/types";

// Emits an OpenAI Codex Agent Skill folder for the kit. Codex discovers
// skills in `.codex/skills/<name>/SKILL.md` and loads them on demand, so the
// skill body stays compact: purpose, invocation triggers, a token quick
// reference, and a pointer to the MCP server for full context.

export interface CodexSkillFile {
  /** Zip-relative path, e.g. `.codex/skills/acme/SKILL.md` */
  path: string;
  content: string;
}

function kitSlug(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "design-system"
  );
}

/** Escape pipes so token values don't break the markdown table. */
function cell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\n/g, " ").trim();
}

function tokenTable(heading: string, tokens: ExtractedToken[], limit = 20): string {
  const rootTokens = tokens.filter((t) => !t.mode).slice(0, limit);
  if (rootTokens.length === 0) return "";
  const rows = rootTokens.map(
    (t) => `| ${cell(t.cssVariable ?? t.name)} | ${cell(t.value)} |`
  );
  const overflow =
    tokens.filter((t) => !t.mode).length > limit
      ? `\n\n_${tokens.filter((t) => !t.mode).length - limit} more — see layout.md for the full set._`
      : "";
  return `### ${heading}\n\n| Token | Value |\n| --- | --- |\n${rows.join("\n")}${overflow}`;
}

/**
 * Generate a Codex Agent Skill (SKILL.md) for the project's design system.
 * Returned as a path + content pair so the bundle route can place it at
 * `.codex/skills/<kit-slug>/SKILL.md` inside the zip.
 */
export function generateCodexSkill(
  project: Pick<Project, "name" | "extractionData" | "standardisation">
): CodexSkillFile {
  const slug = kitSlug(project.name);
  const tokens =
    buildCuratedExtractedTokens(project.standardisation) ??
    project.extractionData?.tokens;

  const tableSections = tokens
    ? [
        tokenTable("Colours", tokens.colors),
        tokenTable("Spacing", tokens.spacing),
        tokenTable("Typography", tokens.typography),
      ].filter(Boolean)
    : [];

  const content = `---
name: ${slug}
description: ${project.name} design system. Use this kit's tokens and components whenever building or editing UI for this project.
---

# ${project.name} design system

## Purpose

Use this kit's design tokens and components when building UI for ${project.name}. Never invent colours, spacing, or type values — every visual decision should reference a token below or a component from the kit.

## When to invoke

- Building or editing any UI component, page, or style for this project
- Choosing colour, spacing, radius, or typography values
- Reviewing UI code for design system compliance

## Token quick reference

${tableSections.length > 0 ? tableSections.join("\n\n") : "_No tokens extracted yet — run an extraction in Layout Studio, then re-export._"}

## Full context

This is a summary. For the complete design system (all tokens, component specs, anti-patterns, compliance checks), run the Layout MCP server from the repo root:

\`\`\`bash
npx @layoutdesign/context serve
\`\`\`

The full specification also ships in this bundle as \`layout.md\`.
`;

  return { path: `.codex/skills/${slug}/SKILL.md`, content };
}
