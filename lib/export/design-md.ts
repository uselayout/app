import type { ExtractedToken, ExtractedTokens, Project } from "@/lib/types";

// Emits a companion design.md file alongside the canonical layout.md, so agents
// trained on Google's design.md format (google-labs-code/design.md) can read
// the project's design system without any extra configuration.
//
// Layout's layout.md is a superset: the two formats share the dual-layer idea
// (machine-readable tokens + human-readable prose), but layout.md carries
// extras like three-tier tokens, confidence annotations, motion tokens, and
// multi-mode support that design.md does not yet model.
//
// We emit the design.md frontmatter from the same ExtractedTokens that drive
// tokens.css and tokens.json, then include the full layout.md content in the
// body so prose survives the round-trip.
//
// Spec reference: https://github.com/google-labs-code/design.md

function safeKey(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "token";
}

function yamlStringEscape(value: string): string {
  if (/^[a-zA-Z0-9_.-]+$/.test(value)) return value;
  return `"${value.replace(/"/g, '\\"')}"`;
}

function formatColourBlock(tokens: ExtractedToken[]): string {
  const rootTokens = tokens.filter((t) => !t.mode);
  if (rootTokens.length === 0) return "";
  const lines = ["colors:"];
  for (const token of rootTokens) {
    lines.push(`  ${safeKey(token.name)}: ${yamlStringEscape(token.value)}`);
  }
  return lines.join("\n");
}

function formatTypographyBlock(tokens: ExtractedToken[]): string {
  const rootTokens = tokens.filter((t) => !t.mode);
  if (rootTokens.length === 0) return "";
  const lines = ["typography:"];
  for (const token of rootTokens) {
    // Typography tokens carry a composite value string; pass it through as a
    // plain YAML scalar. design.md v0.1 treats these permissively.
    lines.push(`  ${safeKey(token.name)}: ${yamlStringEscape(token.value)}`);
  }
  return lines.join("\n");
}

function formatDimensionBlock(category: string, tokens: ExtractedToken[]): string {
  const rootTokens = tokens.filter((t) => !t.mode);
  if (rootTokens.length === 0) return "";
  const lines = [`${category}:`];
  for (const token of rootTokens) {
    lines.push(`  ${safeKey(token.name)}: ${yamlStringEscape(token.value)}`);
  }
  return lines.join("\n");
}

/**
 * Generate a design.md file for interop with Google's spec. Takes the project
 * so we can use the same layoutMd body the rest of the bundle ships.
 */
export function generateDesignMd(
  project: Pick<Project, "name" | "layoutMd" | "extractionData">
): string {
  const tokens: ExtractedTokens | undefined = project.extractionData?.tokens;
  const blocks: string[] = [];

  blocks.push(`name: ${yamlStringEscape(project.name)}`);
  blocks.push(`generator: "Layout (layout.design)"`);
  blocks.push(`layoutMdVersion: 1`);

  if (tokens) {
    const colourBlock = formatColourBlock(tokens.colors);
    if (colourBlock) blocks.push(colourBlock);

    const typoBlock = formatTypographyBlock(tokens.typography);
    if (typoBlock) blocks.push(typoBlock);

    const spacingBlock = formatDimensionBlock("dimensions", tokens.spacing);
    if (spacingBlock) blocks.push(spacingBlock);

    const radiusBlock = formatDimensionBlock("rounded", tokens.radius);
    if (radiusBlock) blocks.push(radiusBlock);

    const effectsBlock = formatDimensionBlock("elevation", tokens.effects);
    if (effectsBlock) blocks.push(effectsBlock);
  }

  const frontmatter = blocks.join("\n\n");

  const preamble = [
    "<!--",
    "  This file is emitted by Layout (https://layout.design) as a companion to",
    "  the canonical layout.md. It is formatted for compatibility with agents",
    "  that follow Google's design.md spec (github.com/google-labs-code/design.md).",
    "",
    "  The frontmatter above carries the design system's tokens in a design.md",
    "  compatible shape. The prose below is the full layout.md content, which",
    "  is a superset (three-tier tokens, multi-mode, confidence annotations).",
    "-->",
  ].join("\n");

  return `---\n${frontmatter}\n---\n\n${preamble}\n\n${project.layoutMd}\n`;
}
