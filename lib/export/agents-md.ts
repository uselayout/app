import type { Project } from "@/lib/types";
import { extractQuickReference } from "./extract-quick-reference";

/**
 * Generates AGENTS.md — the open standard context file for AI coding agents.
 * Supported by: OpenAI Codex, Cursor, Google Jules, Factory, Amp, and others.
 * See: https://agents.md
 */
export function generateAgentsMd(project: Project): string {
  const quickRefLines = extractQuickReference(project.layoutMd);

  return `# ${project.name} — Design System Context

> This file is read automatically by OpenAI Codex, Cursor, Google Jules, Factory, Amp,
> and any agent that follows the AGENTS.md standard (https://agents.md).
> Place at your project root. For subdirectory overrides use AGENTS.override.md.

## Design System

This project uses the **${project.name}** design system.
All UI code MUST follow the rules below. Violations produce off-brand, inconsistent output.

${quickRefLines}

## Full Reference

The complete design system is in \`layout.md\` (included in this bundle).
Read it before generating any UI component — it contains token definitions,
component patterns, anti-patterns, and confidence annotations.

## Files in This Bundle

| File | Purpose |
|------|---------|
| \`layout.md\` | Full design system specification |
| \`AGENTS.md\` | This file — agent context (Codex, Jules, etc.) |
| \`CLAUDE.md\` | Claude Code context section |
| \`.cursor/rules/\` | Cursor MDC rules |
| \`tokens.css\` | CSS custom properties |
| \`tokens.json\` | W3C DTCG token format |
| \`tailwind.config.js\` | Tailwind theme extension |
`;
}
