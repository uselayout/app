import Anthropic from "@anthropic-ai/sdk";
import { transpileTsx } from "@/lib/transpile";

// System prompt constraining Claude to emit a TSX module that renders a design
// system showcase inside our existing iframe runtime. The iframe provides
// React globally (useState, useEffect, Fragment are pre-destructured), plus a
// commonjs-style `module.exports`. JSX is fine — our transpileTsx pipeline
// runs the output through the TypeScript compiler with jsxFactory set to
// React.createElement, so the iframe receives pure JS.
//
// We keep the output constrained: fixed sections in fixed order so every kit
// feels comparable, but the model picks layout density, hero treatment, and
// how to present each section given the kit's aesthetic. If Claude forgets
// the export or produces invalid TS we reject and fall back to the uniform
// template.

const SYSTEM = `You generate a single TypeScript (TSX) module that renders a design system showcase inside a sandboxed React 18 iframe.

# Hard rules

1. Produce **only** TypeScript source code. No prose, no markdown fencing, no comments outside the code.
2. The module must end with \`export default App;\` — the runtime calls \`ReactDOM.createRoot(...).render(React.createElement(App))\`.
3. Use JSX syntax freely. The output is transpiled by the TypeScript compiler with jsxFactory set to React.createElement.
4. The iframe already exposes React, useState, useEffect, useRef, useMemo, useCallback as globals. Do NOT import anything. Do not write \`import React from "react"\`.
5. The iframe has Tailwind loaded. Use a mix of Tailwind classes and inline \`style={}\` with the kit's CSS custom properties via \`var(--name)\`.
6. Read the kit's tokens by iterating \`document.styleSheets\` at mount time. A helper \`readRootCssVars()\` is provided below — copy it verbatim into your output.
7. Render **these sections, in this order, at these headings**:
   - Hero: the kit name as a large heading and a one-line aesthetic description underneath. **Do not add a pill, badge, emoji, eyebrow label, or "Design System" tag above or beside the kit name.** Name + description only. **If brand assets are provided in the user message, render the primary logo at the top of the hero as an \`<img src="..." alt="..." />\` tag (max-height around 48-80px). Do not re-draw or restyle the mark; just render it.**
   - "Colour palette" (grouped by role: backgrounds, text, accent, borders, status, other)
   - "Typography" (Display / Heading / Body / Caption samples at sensible sizes)
   - "Spacing" (horizontal bars from smallest to largest --space-* tokens)
   - "Radius" (boxes with each --radius-* value)
   - "Elevation" (if any --shadow-* tokens exist; skip if none)
   - "Components" (buttons: primary / secondary / ghost / disabled; input; two badges; one card)
8. Use the kit's tokens. Prefer \`var(--token-name)\` inline for surface/accent/border. Pick sensible fallbacks if tokens are missing.
9. Design quality matters: respect the kit's aesthetic (dense vs airy, sharp vs soft), but keep section structure identical to rules 7.
10. **Ignore motion/animation tokens entirely.** Any CSS variable whose name starts with \`--motion-\`, \`--animation-\`, \`--transition-\`, \`--keyframe-\`, \`--duration-\`, \`--ease-\`, or whose value contains \`@keyframes\` is NOT a visual token and must not appear in the palette, typography, or any other rendered section. The user message passes tokens.css with these already stripped, but the iframe's \`readRootCssVars()\` may still expose them — filter them inside your component before rendering.

# Helper to copy verbatim

\`\`\`
type CssVar = { name: string; value: string };
function readRootCssVars(): CssVar[] {
  const out: CssVar[] = []; const seen = new Set<string>();
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList | null = null;
    try { rules = sheet.cssRules; } catch { continue; }
    if (!rules) continue;
    for (const rule of Array.from(rules)) {
      const visit = (r: CSSRule) => {
        if (r instanceof CSSStyleRule && r.selectorText.trim() === ":root") {
          for (let i = 0; i < r.style.length; i++) {
            const n = r.style[i];
            if (n && n.startsWith("--") && !seen.has(n)) {
              seen.add(n);
              out.push({ name: n, value: r.style.getPropertyValue(n).trim() });
            }
          }
        }
      };
      visit(rule);
      if ((rule as CSSGroupingRule).cssRules) {
        for (const inner of Array.from((rule as CSSGroupingRule).cssRules)) visit(inner);
      }
    }
  }
  return out;
}
\`\`\`

# Output

Return ONLY the TSX source. No backticks, no explanation. Starts with \`type CssVar\` or similar, ends with \`export default App;\`.`;

export interface GeneratedShowcase {
  tsx: string;
  js: string;
}

export interface KitBrandingAsset {
  slot: string;
  url: string;
  name?: string;
  mimeType?: string;
}

interface GenerateInput {
  kitName: string;
  kitDescription?: string;
  kitTags: string[];
  layoutMd: string;
  tokensCss: string;
  /** Branding assets (logos, wordmarks) from rich_bundle. When present, the
   * prompt tells Claude to render the primary logo prominently in the hero. */
  brandingAssets?: KitBrandingAsset[];
  apiKey?: string;
  modelId?: string;
}

function stripFences(raw: string): string {
  let out = raw.trim();
  // Drop surrounding triple-backtick fences if the model ignored the rule.
  out = out.replace(/^```(?:tsx|ts|typescript)?\s*/i, "");
  out = out.replace(/```\s*$/, "");
  return out.trim();
}

// Motion tokens (@keyframes, --motion-*, --animation-*, --transition-*) bloat
// the showcase when the model tries to render them as visual tokens. Strip
// them from tokens.css before sending to Claude so the model doesn't see them
// in the first place.
function stripMotionTokens(css: string): string {
  // Remove @keyframes blocks (including their nested braces)
  let out = css.replace(/@keyframes\s+[^{]*\{(?:[^{}]*\{[^{}]*\}[^{}]*)*[^{}]*\}/g, "");
  // Remove lines declaring motion-family custom properties
  out = out.replace(/^\s*--(motion|animation|transition|keyframe|duration|ease|easing)[^;]*;\s*$/gim, "");
  return out;
}

function hasExportDefault(code: string): boolean {
  return /export\s+default\s+(App|\w+)/.test(code);
}

/**
 * Generate a bespoke showcase for a kit. Returns both the raw TSX (for audit +
 * later regeneration) and the transpiled JS the iframe will run. Throws on any
 * validation failure so callers can keep the fallback to the uniform template.
 */
export async function generateKitShowcase(input: GenerateInput): Promise<GeneratedShowcase> {
  const anthropic = new Anthropic(input.apiKey ? { apiKey: input.apiKey } : {});

  const logo = input.brandingAssets?.find((a) => /^(logo|mark|wordmark)$/i.test(a.slot));
  const otherBranding = (input.brandingAssets ?? []).filter((a) => a !== logo).slice(0, 4);

  const brandingSection = logo || otherBranding.length > 0
    ? [
        "",
        "Brand assets (render the primary logo prominently in the hero via an <img> tag, not a re-drawn mark):",
        logo ? `- primary logo: src=\"${logo.url}\" alt=\"${input.kitName} logo\" (slot: ${logo.slot}${logo.mimeType ? `, ${logo.mimeType}` : ""})` : "",
        ...otherBranding.map((a) => `- ${a.slot}: ${a.url}${a.name ? ` (${a.name})` : ""}`),
      ].filter(Boolean).join("\n")
    : "";

  const userMessage = [
    `Kit name: ${input.kitName}`,
    input.kitDescription ? `Description: ${input.kitDescription}` : "",
    input.kitTags.length > 0 ? `Tags: ${input.kitTags.join(", ")}` : "",
    brandingSection,
    "",
    "tokens.css (keyframes and motion variables stripped):",
    "```css",
    stripMotionTokens(input.tokensCss).slice(0, 4000),
    "```",
    "",
    "First ~3000 chars of layout.md:",
    "```",
    input.layoutMd.slice(0, 3000),
    "```",
  ]
    .filter(Boolean)
    .join("\n");

  const response = await anthropic.messages.create({
    model: input.modelId ?? "claude-sonnet-4-6",
    max_tokens: 8000,
    system: SYSTEM,
    messages: [{ role: "user", content: userMessage }],
  });

  const raw = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  const tsx = stripFences(raw);

  if (!hasExportDefault(tsx)) {
    throw new Error("Generated showcase missing `export default App`.");
  }
  // JSX is fine — transpileTsx handles it with jsxFactory: React.createElement.
  // The iframe runtime only needs the compiled output to be valid CommonJS.

  let js: string;
  try {
    js = transpileTsx(tsx);
  } catch (err) {
    throw new Error(
      "Generated showcase failed to transpile: " +
        (err instanceof Error ? err.message : String(err)),
    );
  }

  if (!js || js.trim().length === 0) {
    throw new Error("Transpilation produced empty output.");
  }

  return { tsx, js };
}
