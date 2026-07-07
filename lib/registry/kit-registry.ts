/**
 * Gallery kit → shadcn registry item.
 *
 * CANONICAL SOURCE: this is a faithful port of the CLI generator at
 * layout-context/src/export/registry.ts (uselayout/cli). That file is
 * canonical: if the two drift, update this one to match the CLI.
 *
 * Turns a published gallery kit into a shadcn-compatible registry item JSON
 * so anyone can install it with the stock shadcn CLI:
 *
 *   npx shadcn add https://layout.design/api/public/kits/<slug>/registry
 *
 * The item is a `registry:base` style entry: cssVars carry the kit's tokens
 * (root-mode under `theme`, dark-mode under `dark`), and the kit files
 * (layout.md, tokens.css, tokens.json, kit.json) install into `.layout/` via
 * `registry:file` targets, so the Layout MCP server picks the kit up too.
 *
 * Distinct from lib/registry/kit-theme.ts, which compiles the style profile
 * into a lighter `registry:theme` item (shadcn variable names only).
 */
import type { PublicKit } from "@/lib/types/kit";

export interface RegistryItemFileJson {
  path: string;
  type: string;
  target: string;
  content: string;
}

export interface KitRegistryItemJson {
  $schema: string;
  name: string;
  type: string;
  title: string;
  description: string;
  author?: string;
  cssVars: {
    theme?: Record<string, string>;
    dark?: Record<string, string>;
  };
  files: RegistryItemFileJson[];
}

const ITEM_SCHEMA = "https://ui.shadcn.com/schema/registry-item.json";

interface CssVariable {
  /** Custom property name WITHOUT the leading `--`. */
  name: string;
  value: string;
  /** "dark" when declared under a dark-mode selector; undefined for :root. */
  mode?: string;
}

/**
 * Parse custom properties out of a flat token stylesheet (:root plus optional
 * `[data-theme="dark"]` / `.dark` blocks). Port of the CLI's
 * parseCssVariables (layout-context/src/export/kit-tokens.ts). Deliberately
 * simple: kit token files are generated, flat CSS without nested at-rules.
 */
export function parseCssVariables(css: string): CssVariable[] {
  const vars: CssVariable[] = [];
  const blockRe = /([^{}]+)\{([^{}]*)\}/g;
  let block: RegExpExecArray | null;
  while ((block = blockRe.exec(css)) !== null) {
    const selector = (block[1] ?? "").trim();
    const body = block[2] ?? "";
    const mode =
      /data-theme=['"]?dark['"]?|\.dark\b/.test(selector) ? "dark" : undefined;
    const declRe = /--([\w-]+)\s*:\s*([^;]+);/g;
    let decl: RegExpExecArray | null;
    while ((decl = declRe.exec(body)) !== null) {
      const name = decl[1];
      const value = decl[2];
      if (!name || !value) continue;
      vars.push({ name, value: value.trim(), mode });
    }
  }
  return vars;
}

function kitFile(
  kitSlug: string,
  fileName: string,
  content: string,
): RegistryItemFileJson {
  return {
    path: `registry/${kitSlug}/.layout/${fileName}`,
    type: "registry:file",
    // `~/` = project root in shadcn target resolution.
    target: `~/.layout/${fileName}`,
    content,
  };
}

/** Build the shadcn registry item for a gallery kit. */
export function generateKitRegistryItem(kit: PublicKit): KitRegistryItemJson {
  const theme: Record<string, string> = {};
  const dark: Record<string, string> = {};
  if (kit.tokensCss) {
    for (const v of parseCssVariables(kit.tokensCss)) {
      if (v.mode === "dark") dark[v.name] = v.value;
      else theme[v.name] = v.value;
    }
  }

  const cssVars: KitRegistryItemJson["cssVars"] = {};
  if (Object.keys(theme).length > 0) cssVars.theme = theme;
  if (Object.keys(dark).length > 0) cssVars.dark = dark;

  const files: RegistryItemFileJson[] = [];
  files.push(kitFile(kit.slug, "layout.md", kit.layoutMd));
  if (kit.tokensCss) files.push(kitFile(kit.slug, "tokens.css", kit.tokensCss));
  if (kit.tokensJson && Object.keys(kit.tokensJson).length > 0) {
    files.push(
      kitFile(kit.slug, "tokens.json", JSON.stringify(kit.tokensJson, null, 2) + "\n"),
    );
  }
  files.push(
    kitFile(kit.slug, "kit.json", JSON.stringify(kit.kitJson, null, 2) + "\n"),
  );

  return {
    $schema: ITEM_SCHEMA,
    name: kit.slug,
    type: "registry:base",
    title: kit.name,
    description:
      kit.description ??
      `${kit.name} design-system kit from the layout.design gallery.`,
    author: "Layout <https://layout.design>",
    cssVars,
    files,
  };
}
