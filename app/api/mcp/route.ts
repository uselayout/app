import { NextResponse } from "next/server";
import { z } from "zod";
import { requireMcpAuth } from "@/lib/api/mcp-auth";
import type { McpAuthResult } from "@/lib/api/mcp-auth";
import { getComponentBySlug, getComponentsByOrg } from "@/lib/supabase/components";
import { generateTokensCss } from "@/lib/export/tokens-css";
import { generateTokensJson } from "@/lib/export/tokens-json";
import { supabase } from "@/lib/supabase/client";

import { logEvent } from "@/lib/logging/platform-event";
import { summariseStorybookMetadata } from "@/lib/claude/scanned-component-prompt";
import { buildCuratedExtractedTokens } from "@/lib/tokens/curated-to-extracted";
import { resolveTokenAlias } from "@/lib/tokens/resolve-alias";
import type { ExtractionResult, ScannedComponent, ProjectStandardisation } from "@/lib/types";

// ─── Schema ──────────────────────────────────────────────────────────────────

const McpRequestSchema = z.object({
  tool: z.enum([
    "get_design_system",
    "get_design_section",
    "get_tokens",
    "get_component",
    "get_component_with_context",
    "list_components",
    "check_compliance",
  ]),
  params: z.record(z.string(), z.unknown()).optional().default({}),
});

// ─── Tool Handlers ───────────────────────────────────────────────────────────

async function handleGetDesignSystem(
  orgId: string,
  params: Record<string, unknown>
) {
  const projectId = typeof params.projectId === "string" ? params.projectId : null;

  if (projectId) {
    const { data, error } = await supabase
      .from("layout_projects")
      .select("id, name, layout_md")
      .eq("id", projectId)
      .eq("org_id", orgId)
      .single();

    if (error || !data) {
      return { error: "Project not found or does not belong to this organisation" };
    }

    return {
      result: {
        layoutMd: data.layout_md as string,
        projectName: data.name as string,
        projectId: data.id as string,
      },
    };
  }

  const { data, error } = await supabase
    .from("layout_projects")
    .select("id, name, layout_md")
    .eq("org_id", orgId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return { error: "No projects found for this organisation" };
  }

  return {
    result: {
      layoutMd: data.layout_md as string,
      projectName: data.name as string,
      projectId: data.id as string,
    },
  };
}

// ─── Section-level query ─────────────────────────────────────────────────────

const SECTION_PATTERNS: Record<string, RegExp> = {
  colours: /^#{1,3}\s*(?:\d[.)]?\s*)?colou?rs?\b/im,
  typography: /^#{1,3}\s*(?:\d[.)]?\s*)?typography\b/im,
  spacing: /^#{1,3}\s*(?:\d[.)]?\s*)?spacing\b/im,
  components: /^#{1,3}\s*(?:\d[.)]?\s*)?components?\b/im,
  "anti-patterns": /^#{1,3}\s*(?:\d[.)]?\s*)?(?:anti.?patterns?|constraints?)\b/im,
  "quick-reference": /^#{1,3}\s*(?:\d[.)]?\s*)?quick\s*reference\b/im,
  radius: /^#{1,3}\s*(?:\d[.)]?\s*)?(?:radius|border.?radius|corners?)\b/im,
  effects: /^#{1,3}\s*(?:\d[.)]?\s*)?(?:effects?|shadows?|elevation)\b/im,
  motion: /^#{1,3}\s*(?:\d[.)]?\s*)?(?:motion|animation|transition)\b/im,
};

function extractSection(md: string, sectionPattern: RegExp): string | null {
  const match = sectionPattern.exec(md);
  if (!match) return null;

  const headingLine = match[0];
  const level = (headingLine.match(/^#+/) ?? ["##"])[0].length;
  const afterHeading = md.slice(match.index + headingLine.length);
  const nextHeadingPattern = new RegExp(`^#{1,${level}}\\s`, "m");
  const nextMatch = nextHeadingPattern.exec(afterHeading);
  const body = nextMatch ? afterHeading.slice(0, nextMatch.index) : afterHeading;

  return (headingLine + body).trim();
}

async function handleGetDesignSection(
  orgId: string,
  params: Record<string, unknown>
) {
  const sectionName = typeof params.section === "string" ? params.section.toLowerCase() : null;
  if (!sectionName) {
    return {
      error: "Missing required parameter: section. Available sections: " +
        Object.keys(SECTION_PATTERNS).join(", "),
    };
  }

  const pattern = SECTION_PATTERNS[sectionName];
  if (!pattern) {
    return {
      error: `Unknown section "${sectionName}". Available: ${Object.keys(SECTION_PATTERNS).join(", ")}`,
    };
  }

  const projectId = typeof params.projectId === "string" ? params.projectId : null;

  let query = supabase
    .from("layout_projects")
    .select("id, name, layout_md")
    .eq("org_id", orgId)
    .not("layout_md", "is", null);

  if (projectId) {
    query = query.eq("id", projectId);
  } else {
    query = query.order("updated_at", { ascending: false }).limit(1);
  }

  const { data, error } = await query.single();
  if (error || !data) {
    return { error: "No project with layout.md found" };
  }

  const layoutMd = data.layout_md as string;
  const sectionContent = extractSection(layoutMd, pattern);

  if (!sectionContent) {
    return {
      error: `Section "${sectionName}" not found in layout.md for project "${data.name as string}"`,
    };
  }

  return {
    result: {
      section: sectionName,
      content: sectionContent,
      projectName: data.name as string,
      projectId: data.id as string,
    },
  };
}

// ─── Component with full context ─────────────────────────────────────────────

async function handleGetComponentWithContext(
  orgId: string,
  params: Record<string, unknown>
) {
  const slug = typeof params.slug === "string" ? params.slug : null;
  if (!slug) {
    return { error: "Missing required parameter: slug" };
  }

  const component = await getComponentBySlug(orgId, slug);
  if (!component) {
    return { error: `Component "${slug}" not found` };
  }

  // Fetch design tokens from latest project to cross-reference
  const { data: projectData } = await supabase
    .from("layout_projects")
    .select("extraction_data, layout_md")
    .eq("org_id", orgId)
    .not("extraction_data", "is", null)
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  // Build token context: resolve actual values for tokens this component uses.
  // Follows the `reference` chain so primitive-to-semantic aliases return the
  // concrete value the agent should emit, not an opaque var(--primary) hop.
  const tokenContext: Array<{
    variable: string;
    value: string;
    type: string;
    isAlias?: boolean;
    aliasChain?: string[];
    partial?: boolean;
  }> = [];
  if (projectData?.extraction_data && component.tokensUsed.length > 0) {
    const extraction = projectData.extraction_data as ExtractionResult;
    if (extraction.tokens) {
      const allTokens = [
        ...extraction.tokens.colors,
        ...extraction.tokens.typography,
        ...extraction.tokens.spacing,
        ...extraction.tokens.radius,
        ...extraction.tokens.effects,
      ];

      for (const tokenVar of component.tokensUsed) {
        const found = allTokens.find((t) => t.cssVariable === tokenVar);
        if (!found) continue;
        const resolved = resolveTokenAlias(found, allTokens);
        tokenContext.push({
          variable: tokenVar,
          value: resolved.resolvedValue,
          type: found.type,
          ...(resolved.isAlias ? { isAlias: true, aliasChain: resolved.chain } : {}),
          ...(resolved.partial ? { partial: true } : {}),
        });
      }
    }
  }

  // Extract relevant design guidelines from layout.md
  let usageGuidelines: string | null = null;
  if (projectData?.layout_md) {
    const layoutMd = projectData.layout_md as string;
    // Search for component name mentions in layout.md
    const componentPattern = new RegExp(
      `(?:^|\\n).*${component.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}.*(?:\\n|$)`,
      "gi"
    );
    const mentions = layoutMd.match(componentPattern);
    if (mentions && mentions.length > 0) {
      usageGuidelines = mentions.join("\n").trim();
    }
  }

  return {
    result: {
      name: component.name,
      slug: component.slug,
      description: component.description,
      category: component.category,
      code: component.code,
      props: component.props,
      variants: component.variants,
      states: component.states,
      tokensUsed: component.tokensUsed,
      tokenContext,
      usageGuidelines,
      version: component.version,
      tags: component.tags,
    },
  };
}

async function handleGetTokens(
  orgId: string,
  params: Record<string, unknown>
) {
  const format = params.format === "json" ? "json" : "css";
  // source: "curated" (default when curation exists) | "raw" | "both"
  const requestedSource =
    params.source === "raw" || params.source === "both" || params.source === "curated"
      ? (params.source as "curated" | "raw" | "both")
      : "curated";

  const { data, error } = await supabase
    .from("layout_projects")
    .select("id, name, extraction_data, standardisation")
    .eq("org_id", orgId)
    .not("extraction_data", "is", null)
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return { error: "No project with extraction data found" };
  }

  const extraction = data.extraction_data as ExtractionResult;
  if (!extraction?.tokens) {
    return { error: "Extraction data does not contain tokens" };
  }

  const standardisation = (data.standardisation ?? undefined) as
    | ProjectStandardisation
    | undefined;
  const curated = buildCuratedExtractedTokens(standardisation);
  const effectiveSource: "curated" | "raw" | "both" =
    requestedSource === "curated" && !curated ? "raw" : requestedSource;

  const render = (tokens: ExtractionResult["tokens"]) =>
    format === "json" ? generateTokensJson(tokens) : generateTokensCss(tokens);

  if (effectiveSource === "both" && curated) {
    return {
      result: {
        format,
        source: "both",
        curatedTokens: render(curated),
        rawTokens: render(extraction.tokens),
        projectName: data.name as string,
        curatedAvailable: true,
      },
    };
  }

  const tokens =
    effectiveSource === "curated" && curated ? curated : extraction.tokens;

  return {
    result: {
      tokens: render(tokens),
      format,
      source: effectiveSource,
      projectName: data.name as string,
      curatedAvailable: curated !== null,
    },
  };
}

async function handleGetComponent(
  orgId: string,
  params: Record<string, unknown>
) {
  const slug = typeof params.slug === "string" ? params.slug : null;
  if (!slug) {
    return { error: "Missing required parameter: slug" };
  }

  const component = await getComponentBySlug(orgId, slug);
  if (!component || component.status !== "approved") {
    return { error: `Component "${slug}" not found or not approved` };
  }

  return {
    result: {
      name: component.name,
      slug: component.slug,
      description: component.description,
      category: component.category,
      code: component.code,
      props: component.props,
      variants: component.variants,
      states: component.states,
      version: component.version,
    },
  };
}

async function handleListComponents(
  orgId: string,
  params: Record<string, unknown>
) {
  const category = typeof params.category === "string" ? params.category : undefined;

  const components = await getComponentsByOrg(orgId, {
    status: "approved",
    category,
  });

  // Also include scanned codebase components if projectId provided
  const projectId = typeof params.projectId === "string" ? params.projectId : null;
  let scannedComponents: Array<Record<string, unknown>> = [];

  if (projectId) {
    const { data: projectData } = await supabase
      .from("layout_projects")
      .select("scanned_components")
      .eq("id", projectId)
      .eq("org_id", orgId)
      .single();

    if (projectData?.scanned_components) {
      scannedComponents = projectData.scanned_components as Array<Record<string, unknown>>;
    }
  }

  return {
    result: {
      components: components.map((c) => ({
        name: c.name,
        slug: c.slug,
        description: c.description,
        category: c.category,
        tags: c.tags,
        tokensUsed: c.tokensUsed,
        propsCount: c.props.length,
        variantsCount: c.variants.length,
        statesCount: c.states.length,
        version: c.version,
        codePreview: c.code.slice(0, 200) + (c.code.length > 200 ? "..." : ""),
      })),
      codebaseComponents: scannedComponents.map((raw) => {
        const c = raw as unknown as ScannedComponent;
        const meta = summariseStorybookMetadata(c);
        return {
          name: c.name,
          filePath: c.filePath,
          props: c.props,
          source: c.source,
          importPath: c.importPath,
          ...meta,
        };
      }),
    },
  };
}

async function handleCheckCompliance(
  orgId: string,
  params: Record<string, unknown>
) {
  const code = typeof params.code === "string" ? params.code : null;
  if (!code) {
    return { error: "Missing required parameter: code" };
  }

  const issues: Array<{ rule: string; message: string; severity: "error" | "warning" }> = [];

  // Fetch project extraction data up front — several rules use it.
  const { data: projectDataForPreChecks } = await supabase
    .from("layout_projects")
    .select("extraction_data, layout_md")
    .eq("org_id", orgId)
    .not("extraction_data", "is", null)
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();
  const extractionForPreChecks = projectDataForPreChecks?.extraction_data
    ? (projectDataForPreChecks.extraction_data as ExtractionResult)
    : null;
  const layoutMdForChecks = (projectDataForPreChecks?.layout_md ?? "") as string;

  // Normalise hex to long-form lowercase so #fff and #FFFFFF compare equal.
  const normHex = (h: string) => {
    const lower = h.toLowerCase();
    if (lower.length === 4) return `#${lower[1]}${lower[1]}${lower[2]}${lower[2]}${lower[3]}${lower[3]}`;
    if (lower.length === 5) return `#${lower[1]}${lower[1]}${lower[2]}${lower[2]}${lower[3]}${lower[3]}${lower[4]}${lower[4]}`;
    return lower;
  };

  // Build a lookup of hex → token CSS variable so we can suggest the right token
  // when a hardcoded hex matches a known design-system value.
  const hexToTokenVar = new Map<string, string>();
  if (extractionForPreChecks?.tokens?.colors) {
    for (const t of extractionForPreChecks.tokens.colors) {
      if (!t.cssVariable || !t.value) continue;
      const hex = t.value.match(/#[0-9a-fA-F]{3,8}\b/)?.[0];
      if (hex) {
        const key = normHex(hex);
        if (!hexToTokenVar.has(key)) hexToTokenVar.set(key, t.cssVariable);
      }
    }
  }

  // Check for hardcoded hex colours (not inside var() calls)
  for (const hit of code.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) {
    const idx = hit.index ?? 0;
    const before = code.slice(Math.max(0, idx - 30), idx);
    if (before.includes("var(")) continue;
    const suggestion = hexToTokenVar.get(normHex(hit[0]));
    issues.push({
      rule: "no-hardcoded-colours",
      message: suggestion
        ? `Hardcoded colour "${hit[0]}" — use var(${suggestion}) from the design system instead`
        : `Hardcoded colour "${hit[0]}" — use a design token instead`,
      severity: "error",
    });
  }

  // ── Rule (new): composite-typography-coupling ─────────────────────────────
  // When typography tokens exist, CSS that sets font-family without a
  // line-height (within the same declaration block or style object) leaks
  // away from composite typography tokens and produces inconsistent text.
  // Matches both kebab-case (CSS) and camelCase (JSX inline style).
  if (extractionForPreChecks?.tokens?.typography && extractionForPreChecks.tokens.typography.length > 0) {
    const fontFamilyRe = /(?:font-family|fontFamily)\s*[:=]\s*[^;{},]+/g;
    for (const ff of code.matchAll(fontFamilyRe)) {
      const idx = ff.index ?? 0;
      const window = code.slice(idx, Math.min(code.length, idx + 400));
      const hasLineHeight = /line-height\s*[:=]|lineHeight\s*[:=]/i.test(window);
      const usesTypoToken = /var\(--[^)]*(?:typography|typo|text|heading|body)/i.test(window);
      if (!hasLineHeight && !usesTypoToken) {
        issues.push({
          rule: "composite-typography-coupling",
          message: `font-family set without an accompanying line-height — use a composite typography token (font-family + size + weight + line-height bundled)`,
          severity: "warning",
        });
      }
    }
  }

  // ── Rule (new): multi-mode-coverage ───────────────────────────────────────
  // If layout.md defines a dark-mode block, code that uses colour tokens
  // should acknowledge dark mode (either via Tailwind dark:, data-theme, or
  // a prefers-color-scheme query). Warning only — not every snippet needs it.
  const hasDarkModeInLayoutMd = /\[data-theme\s*=\s*["']dark["']\]|\.dark\b\s*\{|@media\s*\(\s*prefers-color-scheme\s*:\s*dark/i.test(layoutMdForChecks);
  if (hasDarkModeInLayoutMd && /var\(--/.test(code)) {
    const acknowledgesMode = /\bdark:|data-theme\s*=\s*["']|className=\{[^}]*dark|prefers-color-scheme/i.test(code);
    if (!acknowledgesMode) {
      issues.push({
        rule: "multi-mode-coverage",
        message: "Design system defines a dark mode but this code contains no dark-mode switch (Tailwind `dark:` variant, data-theme, or prefers-color-scheme). Confirm the component works in both modes.",
        severity: "warning",
      });
    }
  }

  // Check for inline styles
  if (/\bstyle\s*=\s*\{/g.test(code)) {
    issues.push({
      rule: "no-inline-styles",
      message: "Inline styles detected — prefer CSS classes or token-based utilities",
      severity: "warning",
    });
  }

  // Check for !important
  if (/!important/g.test(code)) {
    issues.push({
      rule: "no-important",
      message: "!important usage detected — avoid overriding styles this way",
      severity: "warning",
    });
  }

  // Reuse the extraction fetched at the top of the handler.
  const extraction = extractionForPreChecks;

  // ── Rule 4: unknown-token ───────────────────────────────────────────────
  // Extract var() references and compare against known tokens
  const varPattern = /var\(--([^)]+)\)/g;
  const usedVars: string[] = [];
  let varMatch: RegExpExecArray | null;
  while ((varMatch = varPattern.exec(code)) !== null) {
    usedVars.push(`--${varMatch[1]}`);
  }

  if (usedVars.length > 0) {
    // Fetch approved components to build a set of known token names
    const components = await getComponentsByOrg(orgId, { status: "approved" });
    const knownTokens = new Set<string>();
    for (const comp of components) {
      for (const token of comp.tokensUsed) {
        knownTokens.add(token);
      }
    }

    if (extraction) {
      if (extraction.tokens) {
        const allTokens = [
          ...extraction.tokens.colors,
          ...extraction.tokens.typography,
          ...extraction.tokens.spacing,
          ...extraction.tokens.radius,
          ...extraction.tokens.effects,
        ];
        for (const token of allTokens) {
          if (token.cssVariable) {
            knownTokens.add(token.cssVariable);
          }
        }
      }
      if (extraction.cssVariables) {
        for (const varName of Object.keys(extraction.cssVariables)) {
          knownTokens.add(varName);
        }
      }
    }

    // Only flag unknown vars if we have known tokens to compare against
    if (knownTokens.size > 0) {
      for (const varName of usedVars) {
        if (!knownTokens.has(varName)) {
          issues.push({
            rule: "unknown-token",
            message: `Unknown CSS variable "${varName}" — not found in design system`,
            severity: "warning",
          });
        }
      }
    }
  }

  // ── Rule 5: spacing-compliance ──────────────────────────────────────────
  // Flag arbitrary Tailwind spacing values not on the design system grid
  if (extraction?.tokens?.spacing) {
    const spacingScale = new Set<number>();
    for (const token of extraction.tokens.spacing) {
      const px = parseInt(token.value, 10);
      if (!isNaN(px)) spacingScale.add(px);
    }

    if (spacingScale.size > 0) {
      const spacingArbitraryPattern = /(?:p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml|gap|gap-x|gap-y|space-x|space-y|inset|top|right|bottom|left|w|h|min-w|min-h|max-w|max-h)-\[(\d+)px\]/g;
      let spacingMatch: RegExpExecArray | null;
      while ((spacingMatch = spacingArbitraryPattern.exec(code)) !== null) {
        const value = parseInt(spacingMatch[1], 10);
        if (!spacingScale.has(value)) {
          issues.push({
            rule: "spacing-compliance",
            message: `Arbitrary spacing "${spacingMatch[0]}" (${value}px) is not on the design system spacing scale`,
            severity: "warning",
          });
        }
      }
    }
  }

  // ── Rule 6: font-family-compliance ──────────────────────────────────────
  // Flag system fonts when the design system defines custom fonts
  const designFonts = new Set<string>();
  if (extraction?.fonts) {
    for (const font of extraction.fonts) {
      if (font.family) designFonts.add(font.family.toLowerCase().replace(/['"]/g, ""));
    }
  }
  if (extraction?.tokens?.typography) {
    for (const token of extraction.tokens.typography) {
      const familyMatch = token.value.match(/font-family:\s*([^;]+)/);
      if (familyMatch) {
        const family = familyMatch[1].trim().toLowerCase().replace(/['"]/g, "");
        designFonts.add(family.split(",")[0].trim());
      }
    }
  }

  if (designFonts.size > 0) {
    const systemFontPattern = /font-family:\s*['"]?(\b(?:Arial|Helvetica|Times New Roman|Times|Courier New|Courier|Georgia|Verdana|Tahoma|Trebuchet MS)\b)['"]?/gi;
    let fontMatch: RegExpExecArray | null;
    while ((fontMatch = systemFontPattern.exec(code)) !== null) {
      const usedFont = fontMatch[1].toLowerCase();
      if (!designFonts.has(usedFont)) {
        issues.push({
          rule: "font-family-compliance",
          message: `System font "${fontMatch[1]}" used but design system defines: ${[...designFonts].join(", ")}`,
          severity: "warning",
        });
      }
    }
  }

  // ── Rule 7: border-radius-compliance ────────────────────────────────────
  // Flag arbitrary Tailwind radius values not on the design system scale
  if (extraction?.tokens?.radius) {
    const radiusScale = new Set<number>();
    for (const token of extraction.tokens.radius) {
      const px = parseInt(token.value, 10);
      if (!isNaN(px)) radiusScale.add(px);
    }

    if (radiusScale.size > 0) {
      const radiusArbitraryPattern = /rounded(?:-(?:t|r|b|l|tl|tr|br|bl|s|e|ss|se|es|ee))?-\[(\d+)px\]/g;
      let radiusMatch: RegExpExecArray | null;
      while ((radiusMatch = radiusArbitraryPattern.exec(code)) !== null) {
        const value = parseInt(radiusMatch[1], 10);
        if (!radiusScale.has(value)) {
          issues.push({
            rule: "border-radius-compliance",
            message: `Arbitrary radius "${radiusMatch[0]}" (${value}px) is not on the design system radius scale`,
            severity: "warning",
          });
        }
      }
    }
  }

  // ── Rule 12: motion-token-compliance ────────────────────────────────────
  // Flag hardcoded transition/animation values when design system defines motion tokens
  if (extraction?.tokens?.motion && extraction.tokens.motion.length > 0) {
    const motionHardcodedPattern = /(?:transition-duration|transition-delay|animation-duration|animation-delay)\s*:\s*[\d.]+(?:ms|s)\b/g;
    let motionMatch: RegExpExecArray | null;
    while ((motionMatch = motionHardcodedPattern.exec(code)) !== null) {
      // Skip if inside a var() call
      const beforeMotion = code.slice(Math.max(0, motionMatch.index - 30), motionMatch.index);
      if (!beforeMotion.includes("var(")) {
        issues.push({
          rule: "motion-token-compliance",
          message: `Hardcoded motion value "${motionMatch[0]}" — design system defines motion tokens, use them instead`,
          severity: "warning",
        });
      }
    }

    // Also check shorthand transition with hardcoded duration e.g. "transition: all 0.3s"
    const shorthandPattern = /transition\s*:\s*[^;]*?\b[\d.]+(?:ms|s)\b/g;
    let shorthandMatch: RegExpExecArray | null;
    while ((shorthandMatch = shorthandPattern.exec(code)) !== null) {
      const beforeShorthand = code.slice(Math.max(0, shorthandMatch.index - 30), shorthandMatch.index);
      if (!beforeShorthand.includes("var(")) {
        issues.push({
          rule: "motion-token-compliance",
          message: `Hardcoded transition "${shorthandMatch[0]}" — use design system motion tokens instead`,
          severity: "warning",
        });
      }
    }
  }

  // ── Rule 8: interactive-state-coverage ──────────────────────────────────
  // Check interactive elements have hover and focus state handling
  const interactivePattern = /<(?:button|a\s|input|select|textarea)\b|role=["']button["']/g;
  const hasHoverState = /hover:|:hover|onMouseEnter/.test(code);
  const hasFocusState = /focus:|:focus|onFocus/.test(code);
  const interactiveCount = (code.match(interactivePattern) ?? []).length;

  if (interactiveCount > 0) {
    if (!hasHoverState) {
      issues.push({
        rule: "interactive-state-coverage",
        message: `${interactiveCount} interactive element(s) found but no hover state handling detected (hover:, :hover, or onMouseEnter)`,
        severity: "warning",
      });
    }
    if (!hasFocusState) {
      issues.push({
        rule: "interactive-state-coverage",
        message: `${interactiveCount} interactive element(s) found but no focus state handling detected (focus:, :focus, or onFocus)`,
        severity: "warning",
      });
    }
  }

  // ── Rule 9: accessibility-alt-text ────────────────────────────────────────
  // Check images have alt attributes
  const imgWithoutAltPattern = /<(?:img|Image)\b(?:(?!alt=)[^>])*>/g;
  let imgMatch: RegExpExecArray | null;
  while ((imgMatch = imgWithoutAltPattern.exec(code)) !== null) {
    if (!imgMatch[0].includes("alt=")) {
      issues.push({
        rule: "accessibility-alt-text",
        message: `Image element without alt attribute: ${imgMatch[0].slice(0, 60)}${imgMatch[0].length > 60 ? "..." : ""}`,
        severity: "error",
      });
    }
  }

  // Check role="img" without aria-label
  const roleImgWithoutLabelPattern = /role=["']img["'](?:(?!aria-label)[^>])*>/g;
  let roleImgMatch: RegExpExecArray | null;
  while ((roleImgMatch = roleImgWithoutLabelPattern.exec(code)) !== null) {
    if (!roleImgMatch[0].includes("aria-label")) {
      issues.push({
        rule: "accessibility-alt-text",
        message: "Element with role=\"img\" missing aria-label",
        severity: "error",
      });
    }
  }

  // ── Rule 10: accessibility-button-label ───────────────────────────────────
  // Check icon-only buttons have accessible labels
  const iconButtonPattern = /<button\b[^>]*>[\s\n]*(?:<svg\b|<(?:Icon|[A-Z]\w*Icon)\b)[^]*?<\/button>/g;
  let iconBtnMatch: RegExpExecArray | null;
  while ((iconBtnMatch = iconButtonPattern.exec(code)) !== null) {
    const btnContent = iconBtnMatch[0];
    const hasLabel = /aria-label|aria-labelledby|sr-only|visually-hidden/.test(btnContent);
    // Check for visible text content outside of SVG/icon elements
    const textContent = btnContent
      .replace(/<button\b[^>]*>/, "")
      .replace(/<\/button>/, "")
      .replace(/<svg\b[^]*?<\/svg>/g, "")
      .replace(/<[^>]+>/g, "")
      .trim();

    if (!hasLabel && textContent.length === 0) {
      issues.push({
        rule: "accessibility-button-label",
        message: `Icon-only button without aria-label or aria-labelledby: ${btnContent.slice(0, 60)}...`,
        severity: "warning",
      });
    }
  }

  // ── Rule 11: semantic-html ────────────────────────────────────────────────
  // Suggest semantic HTML when code is div-heavy
  const divCount = (code.match(/<div\b/g) ?? []).length;
  const semanticElementPattern = /<(?:main|nav|section|article|header|footer|aside)\b/g;
  const semanticCount = (code.match(semanticElementPattern) ?? []).length;

  if (divCount >= 10 && semanticCount === 0) {
    issues.push({
      rule: "semantic-html",
      message: `${divCount} <div> elements but no semantic HTML (<main>, <nav>, <section>, <article>, <header>, <footer>, <aside>). Consider using semantic elements for better accessibility`,
      severity: "warning",
    });
  }

  return {
    result: {
      compliant: issues.filter((i) => i.severity === "error").length === 0,
      issues,
    },
  };
}

// ─── Route Handler ───────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const authResult = await requireMcpAuth(request, "read");
  if (authResult instanceof NextResponse) return authResult;

  const { orgId } = authResult as McpAuthResult;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const parsed = McpRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { tool, params } = parsed.data;

  type ToolResult = { result?: unknown; error?: string };
  let toolResult: ToolResult;

  switch (tool) {
    case "get_design_system":
      toolResult = await handleGetDesignSystem(orgId, params);
      break;
    case "get_design_section":
      toolResult = await handleGetDesignSection(orgId, params);
      break;
    case "get_tokens":
      toolResult = await handleGetTokens(orgId, params);
      break;
    case "get_component":
      toolResult = await handleGetComponent(orgId, params);
      break;
    case "get_component_with_context":
      toolResult = await handleGetComponentWithContext(orgId, params);
      break;
    case "list_components":
      toolResult = await handleListComponents(orgId, params);
      break;
    case "check_compliance":
      toolResult = await handleCheckCompliance(orgId, params);
      break;
  }

  void logEvent("mcp.tool_call", "cli", { orgId, metadata: { tool } });

  if (toolResult.error) {
    return NextResponse.json(
      { tool, error: toolResult.error },
      { status: 404 }
    );
  }

  return NextResponse.json({ tool, result: toolResult.result });
}
