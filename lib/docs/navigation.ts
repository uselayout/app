export type DocNavItem = {
  title: string;
  href: string;
  children?: DocNavItem[];
};

export type DocNavSection = {
  label: string;
  items: DocNavItem[];
};

export const docsNavigation: DocNavSection[] = [
  {
    label: "Getting Started",
    items: [
      { title: "Introduction", href: "/docs" },
      { title: "Walkthrough", href: "/docs/walkthrough" },
    ],
  },
  {
    label: "Studio",
    items: [
      { title: "Studio Guide", href: "/docs/studio" },
      { title: "Explorer Canvas", href: "/docs/explorer" },
      { title: "Component Library", href: "/docs/component-library" },
    ],
  },
  {
    label: "Integrations",
    items: [
      { title: "CLI & MCP Server", href: "/docs/cli" },
      {
        title: "AI Agents",
        href: "/docs/integrations",
        children: [
          { title: "Claude Code", href: "/docs/integrations/claude-code" },
          { title: "Cursor", href: "/docs/integrations/cursor" },
          { title: "GitHub Copilot", href: "/docs/integrations/copilot" },
          { title: "Windsurf", href: "/docs/integrations/windsurf" },
          { title: "OpenAI Codex", href: "/docs/integrations/codex" },
        ],
      },
      { title: "Figma Plugin", href: "/docs/figma-plugin" },
      { title: "Chrome Extension", href: "/docs/chrome-extension" },
    ],
  },
  {
    label: "Platform",
    items: [
      { title: "Organisations", href: "/docs/organisations" },
      { title: "Dashboard & Settings", href: "/docs/dashboard" },
      { title: "Webhooks", href: "/docs/webhooks" },
    ],
  },
  {
    label: "Reference",
    items: [
      { title: "API Reference", href: "/docs/api-reference" },
      { title: "DESIGN.md Spec", href: "/docs/design-md" },
      { title: "Self-Hosting", href: "/docs/self-hosting" },
    ],
  },
];

/** Flatten all sections into a single ordered list for prev/next navigation. */
function flattenAllItems(sections: DocNavSection[]): DocNavItem[] {
  const result: DocNavItem[] = [];
  for (const section of sections) {
    for (const item of section.items) {
      result.push(item);
      if (item.children) {
        result.push(...item.children);
      }
    }
  }
  return result;
}

export function getAdjacentPages(currentPath: string): {
  prev: DocNavItem | null;
  next: DocNavItem | null;
} {
  const flat = flattenAllItems(docsNavigation);
  const index = flat.findIndex((item) => item.href === currentPath);

  if (index === -1) return { prev: null, next: null };

  return {
    prev: index > 0 ? flat[index - 1] : null,
    next: index < flat.length - 1 ? flat[index + 1] : null,
  };
}
