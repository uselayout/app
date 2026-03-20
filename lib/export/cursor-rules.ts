import type { Project } from "@/lib/types";

export function generateCursorRules(project: Project): {
  designSystem: string;
  components: string;
} {
  const quickRef = extractSection(project.layoutMd, "0. Quick Reference");
  const componentsSection = extractSection(project.layoutMd, "5. Components");

  const designSystem = `---
description: Core design system rules - always active
alwaysApply: true
---

# ${project.name} Design System

## Critical rules
${quickRef || "- Follow layout.md for all design decisions\n- Never hardcode colour values"}

See full spec: @layout.md
`;

  const components = `---
description: Component specifications - auto-attached when working on .tsx files
globs: ["**/*.tsx", "**/*.jsx"]
---

# ${project.name} Components

${componentsSection || "See layout.md Section 5 for component specifications."}
`;

  return { designSystem, components };
}

function extractSection(layoutMd: string, sectionTitle: string): string | null {
  const escaped = sectionTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(
    `## ${escaped}\\s*\\n([\\s\\S]*?)(?=\\n## \\d|$)`
  );
  const match = layoutMd.match(regex);
  return match ? match[1].trim() : null;
}
