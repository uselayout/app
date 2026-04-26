import Anthropic from "@anthropic-ai/sdk";
import { transpileTsx } from "@/lib/transpile";
import { bespokeShowcaseLimit } from "@/lib/concurrency";

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

const SYSTEM = `You are a senior brand designer rendering a design system showcase. The output is a single TSX module that runs in a sandboxed React 18 iframe and shows what THIS specific kit's UI looks like. Your job is brand fidelity: an Apple kit must feel iOS, a Linear kit must feel Linear, a Stripe kit must feel Stripe — not just by colour, by every visual detail.

# The hard structural contract — uniform across all kits

Every kit renders the SAME set of sections in the SAME order so visitors can compare like-for-like. Do not skip, reorder, or add sections. Within each section you have full design freedom.

Sections, in order:

1. **Hero** — kit name as a large heading + one-line description.

   **HARD RULE: Read the kit name and description from \`window.__KIT__\` at runtime — NEVER hardcode them as string literals.** The page hydrates \`window.__KIT__\` on every load with the current values from the DB, so name/description edits in admin propagate without re-running you. Pattern:

   \`\`\`tsx
   const kit = (window as any).__KIT__ ?? {};
   const heading = kit.name ?? "Design System";
   const sub = kit.description ?? "";
   // <h1>{heading}</h1><p>{sub}</p>
   \`\`\`

   Do NOT write \`<h1>Airtable</h1>\` or \`<h1>{"Airtable"}</h1>\`. The string "Airtable" must not appear in your output for an Airtable kit. Read it from the global.
 If — and ONLY if — a "primary logo" entry appears in the brand assets list in the user message, render it as an \`<img src="..." alt="..." />\` (max-height 48-80px) at the top.

   **HARD RULE: When NO primary logo URL is provided, the hero contains text only.** Do not render an \`<img>\`, \`<svg>\`, or any \`<div>\` styled to evoke a logo. Do not draw a coloured square, gradient mark, monogram, or icon next to the kit name. Text alone. The user will know what brand it is from the heading. A made-up logo is worse than no logo.

   Examples of what is FORBIDDEN when no primary logo is provided:
   - A 32×32 rounded square with the kit's accent colour and the kit's first letter inside
   - A grid of coloured squares meant to look like the brand's app icon
   - An SVG mark guessed from the brand name
   - Any decorative element to the left of the heading

   No pills, eyebrows, or "Design System" tags.
2. **Colour palette** — grouped by role (backgrounds, text, accent, borders, status, other)
3. **Typography** — Display / Heading / Body / Caption samples
4. **Spacing** — horizontal bars from smallest to largest \`--space-*\` token, neutral fill (NOT the brand accent)
5. **Radius** — chips for each \`--radius-*\` token, neutral fill (NOT the brand accent)
6. **Elevation** — only if \`--shadow-*\` tokens exist
7. **Components** — render every block below, with small uppercase sub-labels:
   a. **Buttons** — primary, secondary, ghost, disabled + small variants + one icon button
   b. **Inputs** — search-with-icon, prefixed (\`@\`), select-with-chevron, textarea
   c. **Field states** — default, focused, error
   d. **Controls** — toggle (on + off), checkbox (checked + unchecked, labelled), radio (selected + unselected, labelled)
   e. **Status badges** — Default (kit accent), Success, Warning, Error, Info, Draft (outline)
   f. **Navigation** — tabs row (4 items, one active) AND a 3-option segmented control (one active)
   g. **People** — avatar group of 4-5 with "+12" chip, single avatar with status dot, mini list-item with avatar + "Avery Sloan" + "Owner · 2m ago"
   h. **Progress** — labelled progress bar at 64%, plus 2-3 skeleton lines
   i. **Alert** — info banner with icon + title "Heads up" + body + action button
   j. **Stat tiles** — 3 KPI cards: "Active users · 12,408 · +8.2%", "Conversion · 4.6% · +0.4 pp", "Avg. response · 184ms · -12ms"
   k. **Card** — header (icon + "Q3 product roadmap" + "Updated 2 hours ago") + body paragraph + status pill "In progress" + actions (View + Share)
   l. **Data table** — header row in monospace + 3 rows: "INC-204 · Render pipeline · Open · 2h ago", "INC-198 · Auth retry loop · Triaged · 5h ago", "INC-191 · Webhook latency · Resolved · 1d ago"

# The brand fidelity contract — what makes Apple feel iOS

This is the part most generators get wrong. Within each section, render the components the way THIS BRAND actually renders them. Concrete patterns to study and apply:

- **Apple / iOS** — light mode default, San Francisco-ish typography, near-black text \`#1d1d1f\`, accent Apple System Blue \`#0071e3\`, buttons soft-rounded ~22px (not pill, not square), filled-blue primary, light-grey secondary, no drop-shadows on buttons, iOS-style toggles (capsule, no border, soft inner shadow), checkboxes with the iOS checkmark, badges very compact + filled, segmented controls with a soft pill behind the active item. Status colours subdued: success #34c759, warning #ff9500, error #ff3b30. Cards have a subtle 1px border + minimal shadow.
- **Linear** — dark mode default \`#08090a\` background, indigo accent \`#5e6ad2\`, monospace touches, buttons pill-shaped (radius 9999), no shadows, secondary is just a 1px border on transparent, inputs have very subtle borders, tabs use a 2px underline in accent, table rows use a hairline border in white at 6% opacity, density is dense.
- **Stripe** — light mode \`#ffffff\` bg, ink \`#0a2540\` headings, body \`#425466\`, accent \`#635bff\`, primary button has a SIGNATURE drop-shadow \`0 1px 2px rgba(50,50,93,0.10), 0 4px 12px rgba(50,50,93,0.10)\` and lifts on hover, focused inputs get a 3px accent ring, cards have generous padding ~24px, buttons radius ~6-8px.
- **Notion** — warm white \`#ffffff\` bg, surface \`#f7f6f3\`, text \`#37352f\`, accent \`#2383e2\` blue, headings serif-feel (weight 600, slight tracking), cards use a soft drop-shadow not a border, buttons radius ~4-6px, density airy. Often shows a small emoji-or-icon block in card headers.
- **Figma** — light mode \`#ffffff\`, accent Figma-blue \`#0d99ff\`, near-black text, rounded UI throughout (radius-md ~6-8px on buttons, larger on cards), status colours from Figma's actual palette: success #14ae5c, warning #ffc738, error #f24822. Tabs use underline. Has a multi-colour secondary palette.
- **Vercel** — dark \`#000000\`, surface \`#0a0a0a\`, accent \`#ffffff\` (yes, white-on-black is the brand), monochrome, sharp 6px radii on buttons, inputs use subtle 1px white-at-14% borders, geometric Geist-like typography.
- **Apple-like sharp brands (IBM)** — sharp 4px button radius, headingWeight 700, dense layout, status colours from IBM palette, strict grid feel.
- **Asana** — light mode, coral/red accent (around #f06a6a or whatever the kit's tokens specify), warm rounded UI, buttons radius ~10px (not pill), card elevation soft shadow, tabs use a 2px underline in coral, friendly approachable type. Status badges in Asana's actual palette.
- **Spotify** — dark \`#121212\`, surface \`#181818\`, accent green \`#1ed760\`, pill buttons (Spotify uses pills aggressively), green-on-dark primary with DARK text on the green (because the green is so bright). Bold display type.
- **Ramp** — cream \`#fafaf7\` bg, near-black accent, no shadows, buttons radius ~24px, editorial sans, dense stat tiles.
- **For any kit you don't recognise**: read the kit's layout.md and tokens.css. Identify the brand's primary CTA pattern (filled / shadowed / outlined?), button radius, input style, card pattern, status palette. Apply consistently.

# Iframe runtime rules

1. Output is **only** TypeScript source. No prose, no markdown fencing, no comments outside the code.
2. The module must end with \`export default App;\`. The runtime calls \`ReactDOM.createRoot(...).render(React.createElement(App))\`.
3. Use JSX freely — transpiled with jsxFactory \`React.createElement\`.
4. Iframe globals: React, useState, useEffect, useRef, useMemo, useCallback. Do NOT import anything. No \`import React from "react"\`.
5. Tailwind is loaded. Mix Tailwind classes with inline \`style={}\`.
6. Read tokens by copying \`readRootCssVars()\` verbatim (below). Inside the App, read once on mount via \`useState\` + \`useEffect\`.
7. Use the kit's tokens via \`var(--token-name)\` inline. Sensible fallbacks if a token's missing.
8. **Buttons painted on the accent must derive their text colour from the accent's luminance** — white if accent is dark, near-black if light. Never hardcode \`#fff\` or \`#000\` for that label without a luminance check.
9. **Ignore motion/animation tokens entirely.** Any var starting with \`--motion-\`, \`--animation-\`, \`--transition-\`, \`--keyframe-\`, \`--duration-\`, \`--ease-\`, or with a value containing \`@keyframes\`. Filter inside the component.
10. Make controls (toggle, checkbox, radio, tabs, segmented) **interactive** with \`useState\` so clicking flips state. Keep the visual treatment of each control matched to the brand (iOS toggle for Apple, simple capsule for Linear, etc.).
11. **NEVER use emojis anywhere.** Not in headings, not in card icons, not in alert banners, not in placeholders, not in stub avatars — never. If you need an icon, draw an inline SVG (12-20px) using the kit's accent or text colour. Avatars are coloured circles with initials, not emojis.
12. **Tabs and segmented controls must NOT scroll the page when clicked.** They are \`<button type="button">\` elements (never anchors, never \`href="#..."\`). Their onClick handler ONLY updates useState. If you must use an anchor for visual reasons, call \`e.preventDefault()\`.
13. **Every button MUST have a visible hover state.** Inject a single \`<style>\` element at the top of the App body whose first child is a template literal of CSS — e.g. \`<style>{\\\`.btn-primary:hover { ... } .btn-secondary:hover { ... }\\\`}</style>\`. Apply matching className to the buttons. Hover treatment matches the brand: Apple uses brightness shift, Stripe lifts with a stronger shadow, Linear shifts background. Tailwind \`hover:\` classes are unreliable in this iframe — use explicit CSS rules.

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
  /** Called with each text delta from the Claude stream. CLI scripts use it
   * to print live progress so the operator can see the call is alive. */
  onProgress?: (delta: string, totalChars: number) => void;
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
  // Accept many export shapes Claude tends to emit:
  //   export default App;
  //   export default function App() { ... }
  //   export default () => ...
  //   export { App as default }
  //   module.exports = App
  return (
    /export\s+default\s+/.test(code) ||
    /export\s*\{\s*\w+\s+as\s+default\s*\}/.test(code) ||
    /module\.exports\s*=\s*App/.test(code)
  );
}

/** When Claude defines `function App` or `const App` but forgets to export
 * it, append the export ourselves so the iframe runtime can pick it up.
 * Cheaper than rejecting the whole generation. */
/** When the kit has no primary logo asset, strip every <img> tag from
 * the generated TSX. Belt-and-braces against Claude inventing a fake
 * brand mark even after the prompt forbids it. Only fires when the
 * caller didn't pass a primary logo, so legitimate logo <img>s on
 * brand-asset-bearing kits aren't touched. */
function stripImgsWhenNoLogo(code: string, hadPrimaryLogo: boolean): string {
  if (hadPrimaryLogo) return code;
  // Self-closing: <img src="..." />
  let out = code.replace(/<img\b[^>]*\/>/gi, "");
  // Open + close: <img src="...">  ... </img>
  out = out.replace(/<img\b[^>]*>\s*<\/img>/gi, "");
  // Bare opening tag with no slash (HTML void element style)
  out = out.replace(/<img\b[^>]*>/gi, "");
  return out;
}

function ensureExportDefault(code: string): string {
  if (hasExportDefault(code)) return code;
  if (/(?:function|const|let|var)\s+App\b/.test(code)) {
    return code.trimEnd() + "\n\nexport default App;\n";
  }
  return code;
}

/**
 * Generate a bespoke showcase for a kit. Returns both the raw TSX (for audit +
 * later regeneration) and the transpiled JS the iframe will run. Throws on any
 * validation failure so callers can keep the fallback to the uniform template.
 *
 * Wrapped in bespokeShowcaseLimit (max 2 concurrent) so parallel admin
 * regens don't peg the Node single-thread on transpile and starve the
 * /api/health/ready endpoint. Excess calls queue.
 */
export async function generateKitShowcase(input: GenerateInput): Promise<GeneratedShowcase> {
  return bespokeShowcaseLimit(() => generateKitShowcaseInner(input));
}

async function generateKitShowcaseInner(input: GenerateInput): Promise<GeneratedShowcase> {
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

  // Streaming: gives CLI callers a progress signal so they can see the
  // call is alive. The non-streaming path used to freeze terminals for
  // 1-3 minutes with no output, indistinguishable from a network stall.
  const stream = anthropic.messages.stream({
    model: input.modelId ?? "claude-sonnet-4-6",
    max_tokens: 16000,
    system: SYSTEM,
    messages: [{ role: "user", content: userMessage }],
  });

  let totalChars = 0;
  if (input.onProgress) {
    stream.on("text", (delta) => {
      totalChars += delta.length;
      input.onProgress!(delta, totalChars);
    });
  }

  const response = await stream.finalMessage();

  const raw = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  const hadPrimaryLogo = !!logo;
  const tsx = ensureExportDefault(
    stripImgsWhenNoLogo(stripFences(raw), hadPrimaryLogo),
  );

  if (!hasExportDefault(tsx)) {
    // Final safety net: log the first chunk so we can diagnose what
    // Claude actually returned, instead of failing silently.
    console.error(
      "[bespoke-showcase] no export default found. First 300 chars of raw:",
      raw.slice(0, 300),
    );
    throw new Error("Generated showcase missing `export default App`.");
  }
  // JSX is fine — transpileTsx handles it with jsxFactory: React.createElement.
  // The iframe runtime only needs the compiled output to be valid CommonJS.

  let js: string;
  try {
    js = await transpileTsx(tsx);
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
