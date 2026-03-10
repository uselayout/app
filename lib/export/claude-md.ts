import type { Project } from "@/lib/types";
import { extractQuickReference } from "./extract-quick-reference";

export function generateClaudeMd(project: Project): string {
  const quickRefLines = extractQuickReference(project.designMd);

  return `## Design System - ${project.name}

This project uses the ${project.name} design system.
AI coding agents: follow all rules in this section precisely.
Violations will produce inconsistent, off-brand output.

### Critical Rules (always apply)
${quickRefLines}

### Files
Full design system context is available in:
@./ai-kit/DESIGN.md        (complete specification)
@./ai-kit/COMPONENTS.md    (component inventory + usage rules)
@./ai-kit/tokens/tokens.css (complete token reference)

When building any UI component, read DESIGN.md first.
`;
}
