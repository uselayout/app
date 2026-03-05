import type { Project } from "@/lib/types";

export function generateCursorRules(project: Project): {
  designSystem: string;
  components: string;
} {
  const quickRef = extractSection(project.designMd, "0. Quick Reference");
  const componentsSection = extractSection(project.designMd, "5. Components");

  const designSystem = `---
description: Core design system rules - always active
alwaysApply: true
---

# ${project.name} Design System

## Critical rules
${quickRef || "- Follow DESIGN.md for all design decisions\n- Never hardcode colour values"}

See full spec: @DESIGN.md
`;

  const components = `---
description: Component specifications - auto-attached when working on .tsx files
globs: ["**/*.tsx", "**/*.jsx"]
---

# ${project.name} Components

${componentsSection || "See DESIGN.md Section 5 for component specifications."}
`;

  return { designSystem, components };
}

function extractSection(designMd: string, sectionTitle: string): string | null {
  const escaped = sectionTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(
    `## ${escaped}\\s*\\n([\\s\\S]*?)(?=\\n## \\d|$)`
  );
  const match = designMd.match(regex);
  return match ? match[1].trim() : null;
}
