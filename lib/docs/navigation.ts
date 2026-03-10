export type DocNavItem = {
  title: string;
  href: string;
  children?: DocNavItem[];
};

export const docsNavigation: DocNavItem[] = [
  { title: "Getting Started", href: "/docs" },
  { title: "Studio", href: "/docs/studio" },
  { title: "CLI", href: "/docs/cli" },
  {
    title: "Integrations",
    href: "/docs/integrations",
    children: [
      { title: "Claude Code", href: "/docs/integrations/claude-code" },
      { title: "Cursor", href: "/docs/integrations/cursor" },
      { title: "GitHub Copilot", href: "/docs/integrations/copilot" },
      { title: "Windsurf", href: "/docs/integrations/windsurf" },
      { title: "OpenAI Codex", href: "/docs/integrations/codex" },
    ],
  },
  { title: "API Reference", href: "/docs/api-reference" },
  { title: "DESIGN.md Spec", href: "/docs/design-md" },
];

/** Flatten the nav tree into a single ordered list of leaf/top-level items. */
function flattenNav(items: DocNavItem[]): DocNavItem[] {
  const result: DocNavItem[] = [];
  for (const item of items) {
    result.push(item);
    if (item.children) {
      result.push(...item.children);
    }
  }
  return result;
}

export function getAdjacentPages(currentPath: string): {
  prev: DocNavItem | null;
  next: DocNavItem | null;
} {
  const flat = flattenNav(docsNavigation);
  const index = flat.findIndex((item) => item.href === currentPath);

  if (index === -1) return { prev: null, next: null };

  return {
    prev: index > 0 ? flat[index - 1] : null,
    next: index < flat.length - 1 ? flat[index + 1] : null,
  };
}
