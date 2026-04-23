import type { Project } from "@/lib/types";
import { extractQuickReference } from "./extract-quick-reference";

export function generateClaudeMd(project: Project): string {
  const quickRefLines = extractQuickReference(project.layoutMd);
  const hasBranding = (project.brandingAssets?.length ?? 0) > 0;
  const hasContext = (project.contextDocuments?.length ?? 0) > 0;

  const brandingSection = hasBranding
    ? `\n- \`.layout/branding/\` — brand logos, wordmarks, favicons. Reference in generated code with \`data-brand-logo="primary"\` (also "secondary", "wordmark", "favicon", "mark"). Do **not** hardcode URLs; the Layout runtime resolves the attribute.`
    : "";

  const contextSection = hasContext
    ? `\n- \`.layout/context/\` — project context documents (brand voice, product descriptions, copy guidelines). Read before writing user-facing copy.`
    : "";

  return `## Design System — ${project.name}

This project uses the **${project.name}** design system.
AI coding agents: follow all rules in this section precisely.
Violations will produce inconsistent, off-brand output.

### Critical Rules (always apply)
${quickRefLines}

### Design System Context

If the **layout** MCP server is connected, use these tools:
- \`get-design-system\` — full layout.md or a specific section (colours, typography, spacing, components)
- \`get-tokens\` — design tokens in CSS or JSON format
- \`list-components\` / \`get-component\` — component inventory and specs
- \`check-compliance\` — validate code against design system rules
- \`design-in-figma\` — create Figma mockups using the design system (requires Figma MCP)

Otherwise, read the local files in \`.layout/\`:
- \`.layout/layout.md\` — complete design system specification
- \`.layout/tokens.css\` — CSS custom properties
- \`.layout/tokens.json\` — W3C DTCG token format${brandingSection}${contextSection}

**Before building any UI component, read the design system first.**
`;
}
