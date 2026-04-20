import type {
  BrandingAsset,
  ContextDocument,
  ExtractedToken,
  ExtractedTokens,
  Project,
  ProjectStandardisation,
  ScannedComponent,
} from "@/lib/types";
import { CORE_TOKENS_BLOCK_REGEX } from "@/lib/tokens/core-tokens-block";
import { ICON_PACKS } from "@/lib/icons/registry";

// The derive engine composes the canonical layout.md on every read from live
// project state. Callers that previously read `project.layoutMd` directly
// (MCP, Explorer, export) should read through `deriveLayoutMd(project)` so
// the CORE TOKENS block, Appendix A, Icons block, Brand Assets and Product
// Context sections always reflect the current curated assignments, extracted
// tokens, scanned components, selected icon packs, uploaded branding and
// context documents.
//
// Authored prose (Design Direction, Component Patterns narrative, Anti-pattern
// stories) is preserved from `project.layoutMd` untouched. Only the blocks
// this file regenerates are touched. That lets users continue hand-editing
// layout.md through Monaco while eliminating the silent regex-miss bug class
// that plagued the previous write-then-read model.

export interface DeriveOptions {
  // If true, skip the CORE TOKENS regeneration.
  skipCoreTokens?: boolean;
  // If true, skip the Appendix A regeneration.
  skipAppendixA?: boolean;
  // If true, skip the orphan-feature sections (Icons, Brand Assets, Component
  // Inventory, Product Context).
  skipOrphanSections?: boolean;
}

// Minimum input shape the derive engine needs. Callers can pass a partial
// project without fetching heavy columns (explorations, snapshots) they don't
// need.
export type DeriveInput = Pick<
  Project,
  | "layoutMd"
  | "layoutMdAuthored"
  | "standardisation"
  | "extractionData"
  | "iconPacks"
  | "brandingAssets"
  | "contextDocuments"
  | "scannedComponents"
>;

export function deriveLayoutMd(input: DeriveInput, options: DeriveOptions = {}): string {
  // Prefer layoutMdAuthored when populated — it's the user's prose with derived
  // blocks already stripped, so injecting fresh blocks produces a clean doc.
  // Falls back to legacy layoutMd (which may contain stale derived content)
  // so projects predating Phase 5 keep rendering correctly until they migrate.
  let md = input.layoutMdAuthored ?? input.layoutMd ?? "";

  if (!options.skipCoreTokens && input.standardisation) {
    md = injectCoreTokensBlock(md, input.standardisation);
  }

  // Order matters: derived sections accumulate between authored prose and
  // Appendix A. Emitting them in this fixed order keeps the document stable
  // across re-derives, which is what makes the engine idempotent.
  if (!options.skipOrphanSections) {
    md = replaceOrInsertSection(md, "## Brand Assets", renderBrandAssetsSection(input.brandingAssets));
    md = replaceOrInsertSection(md, "## Icons", renderIconsSection(input.iconPacks));
    md = replaceOrInsertSection(
      md,
      "## Component Inventory",
      renderComponentInventorySection(input.scannedComponents)
    );
    md = replaceOrInsertSection(md, "## Product Context", renderProductContextSection(input.contextDocuments));
  }

  if (!options.skipAppendixA && input.extractionData?.tokens) {
    md = injectAppendixA(md, input.extractionData.tokens);
  }

  return md;
}

// ─── CORE TOKENS ────────────────────────────────────────────────────────────

export function renderCoreTokensBlock(standardisation: ProjectStandardisation): string {
  const assignments = Object.values(standardisation.assignments);
  if (assignments.length === 0) return "";

  const colourRoleKeys = ["bg-", "text-", "border", "accent", "success", "warning", "error", "info"];
  const isColour = (roleKey: string) =>
    colourRoleKeys.some((k) => roleKey.startsWith(k) || roleKey.includes(k));

  // Partition by mode. Default (undefined) assignments live in :root; each
  // non-default mode gets its own [data-theme="{mode}"] block so downstream
  // CSS selectors can flip the full token set by toggling the attribute.
  type Assignment = (typeof assignments)[number];
  const byMode = new Map<string | undefined, Assignment[]>();
  for (const a of assignments) {
    const bucket = byMode.get(a.mode) ?? [];
    bucket.push(a);
    byMode.set(a.mode, bucket);
  }

  const renderDeclarations = (items: Assignment[]): string => {
    const lines: string[] = [];
    const colours = items.filter((a) => isColour(a.roleKey));
    const other = items.filter((a) => !isColour(a.roleKey));
    if (colours.length > 0) {
      lines.push("  /* Colours */");
      for (const a of colours) {
        lines.push(`  ${a.standardName}: ${a.value};`);
      }
    }
    if (other.length > 0) {
      if (lines.length > 0) lines.push("");
      lines.push("  /* Other */");
      for (const a of other) {
        lines.push(`  ${a.standardName}: ${a.value};`);
      }
    }
    return lines.join("\n");
  };

  const parts: string[] = ["/* ── CORE TOKENS ── */"];

  const defaultItems = byMode.get(undefined) ?? [];
  if (defaultItems.length > 0) {
    parts.push(`:root {\n${renderDeclarations(defaultItems)}\n}`);
  }

  // Emit non-default modes in alphabetical order so idempotent re-derives
  // don't reshuffle blocks when the assignment Map iteration order changes.
  const modeKeys = [...byMode.keys()].filter((m): m is string => Boolean(m)).sort();
  for (const mode of modeKeys) {
    const items = byMode.get(mode);
    if (!items || items.length === 0) continue;
    parts.push(`[data-theme="${mode}"] {\n${renderDeclarations(items)}\n}`);
    // Mirror dark mode into a prefers-color-scheme query for systems without
    // the selector attribute. Other modes are user-defined and don't get
    // automatic media queries.
    if (mode === "dark") {
      parts.push(`@media (prefers-color-scheme: dark) {\n  :root {\n${renderDeclarations(items).replace(/^/gm, "  ")}\n  }\n}`);
    }
  }

  if (parts.length === 1) return ""; // nothing but the header

  return "```css\n" + parts.join("\n\n") + "\n```";
}

function injectCoreTokensBlock(md: string, standardisation: ProjectStandardisation): string {
  const rendered = renderCoreTokensBlock(standardisation);
  if (!rendered) return md;

  // Only replace an existing block. Creating a fresh §0 Quick Reference
  // requires narrative Claude produces and is out of scope for derive.
  if (CORE_TOKENS_BLOCK_REGEX.test(md)) {
    return md.replace(CORE_TOKENS_BLOCK_REGEX, rendered);
  }
  return md;
}

// ─── Appendix A: Complete Token Reference ──────────────────────────────────

const APPENDIX_A_SECTION_REGEX = /^## Appendix A[^\n]*\n[\s\S]*?(?=^## |$(?![\s\S]))/m;

export function renderAppendixA(tokens: ExtractedTokens): string {
  const lines: string[] = [];
  const emitCategory = (label: string, toks: ExtractedToken[]) => {
    if (toks.length === 0) return;
    if (lines.length > 0) lines.push("");
    lines.push(`/* ${label} (${toks.length}) */`);
    for (const t of toks) {
      const cssVar = t.cssVariable ?? `--${t.name}`;
      const trailing = [
        t.description ? t.description : null,
        t.mode ? `mode: ${t.mode}` : null,
      ].filter((s): s is string => Boolean(s));
      const comment = trailing.length > 0 ? ` /* ${trailing.join(" — ")} */` : "";
      lines.push(`${cssVar}: ${t.value};${comment}`);
    }
  };

  emitCategory("Colours", tokens.colors);
  emitCategory("Typography", tokens.typography);
  emitCategory("Spacing", tokens.spacing);
  emitCategory("Radius", tokens.radius);
  emitCategory("Effects", tokens.effects);
  emitCategory("Motion", tokens.motion ?? []);

  if (lines.length === 0) return "";

  return [
    "## Appendix A: Complete Token Reference",
    "",
    "Every token extracted from the source. §0 CORE TOKENS is the primary AI signal; this appendix is reference material an AI can cross-check against when a curated role is missing.",
    "",
    "```css",
    lines.join("\n"),
    "```",
  ].join("\n");
}

function injectAppendixA(md: string, tokens: ExtractedTokens): string {
  const rendered = renderAppendixA(tokens);
  if (!rendered) return md;

  if (APPENDIX_A_SECTION_REGEX.test(md)) {
    return md.replace(APPENDIX_A_SECTION_REGEX, rendered + "\n\n");
  }

  const appendixBIndex = md.search(/^## Appendix B\b/m);
  if (appendixBIndex !== -1) {
    return md.slice(0, appendixBIndex) + rendered + "\n\n" + md.slice(appendixBIndex);
  }

  const trimmed = md.replace(/\s*$/, "");
  const separator = trimmed.length > 0 ? "\n\n" : "";
  return trimmed + separator + rendered + "\n\n";
}

// ─── Brand Assets ──────────────────────────────────────────────────────────

export function renderBrandAssetsSection(assets: BrandingAsset[] | undefined): string {
  if (!assets || assets.length === 0) return "";

  // Group by slot so AI can quickly find "the primary colour logo" etc.
  const bySlot = new Map<string, BrandingAsset[]>();
  for (const a of assets) {
    const list = bySlot.get(a.slot) ?? [];
    list.push(a);
    bySlot.set(a.slot, list);
  }

  const lines: string[] = [
    "## Brand Assets",
    "",
    "Uploaded brand marks for this project. When generating UI that references the brand (headers, login screens, loading states) prefer these over stock placeholder imagery. Reference by slot and variant via the `data-brand-logo` convention the Studio injects into previews.",
    "",
  ];

  for (const [slot, items] of bySlot) {
    lines.push(`### ${slot}`);
    for (const a of items) {
      const variant = a.variant ? ` (${a.variant})` : "";
      lines.push(`- **${a.name}**${variant} — ${a.url}`);
    }
    lines.push("");
  }

  return lines.join("\n").trimEnd();
}

// ─── Icons ─────────────────────────────────────────────────────────────────

export function renderIconsSection(iconPackIds: string[] | undefined): string {
  if (!iconPackIds || iconPackIds.length === 0) return "";

  const packs = iconPackIds
    .map((id) => ICON_PACKS[id])
    .filter((p): p is (typeof ICON_PACKS)[string] => Boolean(p));

  if (packs.length === 0) return "";

  const lines: string[] = [
    "## Icons",
    "",
    "Icon libraries selected for this project. AI coding agents should use icons from these packs exclusively — do not invent SVG inline or pull from other libraries.",
    "",
  ];

  for (const pack of packs) {
    lines.push(`### ${pack.name} (${pack.npmPackage})`);
    lines.push("");
    lines.push(`- Import: \`${pack.importSyntax}\``);
    lines.push(`- Naming: ${pack.namingConvention}`);
    if (pack.commonIcons.length > 0) {
      const iconList = pack.commonIcons.slice(0, 20).join(", ");
      lines.push(`- Common icons: ${iconList}`);
    }
    lines.push("");
  }

  return lines.join("\n").trimEnd();
}

// ─── Component Inventory (scanned) ─────────────────────────────────────────

export function renderComponentInventorySection(
  components: ScannedComponent[] | undefined
): string {
  if (!components || components.length === 0) return "";

  const lines: string[] = [
    "## Component Inventory",
    "",
    "Components scanned from the codebase. When generating UI, prefer importing these over rebuilding equivalents from scratch. Match to an entry here by intent (e.g. `Button`, `InputField`) and import via the listed path.",
    "",
  ];

  // Group by source so Storybook components surface first — they include
  // rendered story args that help the AI pick the right variant.
  const storybook = components.filter((c) => c.source === "storybook");
  const codebase = components.filter((c) => c.source === "codebase");

  const emitComponent = (c: ScannedComponent) => {
    const exportKind = c.exportType === "default" ? "default" : "named";
    lines.push(`### ${c.name}`);
    lines.push("");
    lines.push(`- Import: \`import ${exportKind === "default" ? c.name : `{ ${c.name} }`} from "${c.importPath}"\``);
    if (c.props.length > 0) {
      lines.push(`- Props: ${c.props.join(", ")}`);
    }
    if (c.stories && c.stories.length > 0) {
      lines.push(`- Stories: ${c.stories.join(", ")}`);
    }
    if (c.args && c.args.length > 0) {
      const argSummary = c.args
        .slice(0, 8)
        .map((a) => (a.options && a.options.length > 0 ? `${a.name} (${a.options.join("|")})` : a.name))
        .join(", ");
      lines.push(`- Args: ${argSummary}`);
    }
    if (c.designSystemMatch) {
      const confidence = c.matchConfidence ? ` (${Math.round(c.matchConfidence * 100)}% confidence)` : "";
      lines.push(`- Design system match: ${c.designSystemMatch}${confidence}`);
    }
    lines.push("");
  };

  if (storybook.length > 0) {
    lines.push("### Storybook components");
    lines.push("");
    for (const c of storybook) emitComponent(c);
  }
  if (codebase.length > 0) {
    lines.push("### Codebase components");
    lines.push("");
    for (const c of codebase) emitComponent(c);
  }

  return lines.join("\n").trimEnd();
}

// ─── Product Context ───────────────────────────────────────────────────────

// Cap embedded doc content per document to keep the derived output readable.
// Full documents are still available via the API / export bundle.
const PRODUCT_CONTEXT_MAX_CHARS_PER_DOC = 4000;

export function renderProductContextSection(docs: ContextDocument[] | undefined): string {
  if (!docs || docs.length === 0) return "";

  // Pinned docs first — they're flagged as higher-priority context.
  const ordered = [...docs].sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)));

  const lines: string[] = [
    "## Product Context",
    "",
    "Brand voice, tone guidelines, and product descriptions attached to this project. AI coding agents should treat these as the source of truth for copy, messaging, and feature scope — tokens rule visuals, these rule words.",
    "",
  ];

  for (const doc of ordered) {
    const pinMarker = doc.pinned ? " (pinned)" : "";
    lines.push(`### ${doc.name}${pinMarker}`);
    lines.push("");
    const trimmed = doc.content.length > PRODUCT_CONTEXT_MAX_CHARS_PER_DOC
      ? doc.content.slice(0, PRODUCT_CONTEXT_MAX_CHARS_PER_DOC).trimEnd() + "\n\n…(truncated)"
      : doc.content.trimEnd();
    lines.push(trimmed);
    lines.push("");
  }

  return lines.join("\n").trimEnd();
}

// ─── Shared insertion helper ───────────────────────────────────────────────

/**
 * Replace a top-level markdown section identified by its heading (e.g.
 * `## Brand Assets`) with fresh content, or insert the rendered content
 * before Appendix A / at the document end if the section doesn't exist yet.
 * No-ops when `rendered` is an empty string so callers can pass through
 * "nothing to render" without conditionals.
 */
function replaceOrInsertSection(
  md: string,
  heading: string,
  rendered: string
): string {
  if (!rendered) return md;

  // Match the heading and everything up to the next ## heading or document end.
  const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const sectionRegex = new RegExp(
    `^${escapedHeading}[^\\n]*\\n[\\s\\S]*?(?=^## |$(?![\\s\\S]))`,
    "m"
  );

  if (sectionRegex.test(md)) {
    return md.replace(sectionRegex, rendered + "\n\n");
  }

  // Insert before Appendix A if present so reference material stays at the end.
  const appendixAIndex = md.search(/^## Appendix [A-Z]\b/m);
  if (appendixAIndex !== -1) {
    return md.slice(0, appendixAIndex) + rendered + "\n\n" + md.slice(appendixAIndex);
  }

  const trimmed = md.replace(/\s*$/, "");
  const separator = trimmed.length > 0 ? "\n\n" : "";
  return trimmed + separator + rendered + "\n\n";
}
