import type { Project } from "@/lib/types";
import { extractQuickReference } from "./extract-quick-reference";

export function generateClaudeMd(project: Project): string {
  const quickRefLines = extractQuickReference(project.designMd);

  return `## Design System — ${project.name}

This project uses the **${project.name}** design system.
AI coding agents: follow all rules in this section precisely.
Violations will produce inconsistent, off-brand output.

### Critical Rules (always apply)
${quickRefLines}

### Design System Context

If the **layout** MCP server is connected, use these tools:
- \`get-design-system\` — full DESIGN.md or a specific section (colours, typography, spacing, components)
- \`get-tokens\` — design tokens in CSS or JSON format
- \`list-components\` / \`get-component\` — component inventory and specs
- \`check-compliance\` — validate code against design system rules
- \`design-in-figma\` — create Figma mockups using the design system (requires Figma MCP)

Otherwise, read the local files in \`.layout/\`:
- \`.layout/DESIGN.md\` — complete design system specification
- \`.layout/tokens.css\` — CSS custom properties
- \`.layout/tokens.json\` — W3C DTCG token format

**Before building any UI component, read the design system first.**
`;
}
