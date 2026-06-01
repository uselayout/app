import Anthropic from "@anthropic-ai/sdk";
import { transpileTsx } from "@/lib/transpile";
import { bespokeShowcaseLimit } from "@/lib/concurrency";
import { getModelMaxOutputTokens } from "@/lib/ai/models";
import { KIT_SHOWCASE_TSX } from "@/components/gallery/kit-showcase-source";

// Default model for bespoke generation. Opus gives the best brand fidelity on
// the per-section bodies; callers (regen script / admin route) can override.
const DEFAULT_BESPOKE_MODEL = "claude-opus-4-8";

// System prompt for bespoke generation. Claude does NOT build the whole page:
// it produces only the on-brand Hero/Forms/Components section *bodies* as a
// single `BESPOKE_BLOCKS` object. We concatenate that with our fixed shell
// (KIT_SHOWCASE_TSX — nav, scroll-spy, section framing, token-driven
// Foundations) and transpile the combination. The shell's registry resolves
// each section through `GENERIC_BLOCKS ⊕ BESPOKE_BLOCKS`, so Claude's blocks
// override the generic ones; any missing/throwing block falls back to generic
// via a per-section error boundary. This keeps the navigable shell identical
// and bug-free across kits while the bodies stay fully on-brand.

const SYSTEM = `You are a senior brand designer producing the on-brand UI for ONE specific design-system kit. Your output plugs into a fixed shell we own (left nav, scroll-spy, section framing, and the token-driven Foundations — colour, typography, spacing, sizes, radius, elevation, icons). You do NOT build the page, the nav, or the Foundations. You ONLY design the bodies for the **Hero, Forms, and Components** sections. Your job is brand fidelity: an Apple kit must feel iOS, a Linear kit must feel Linear, a Stripe kit must feel Stripe — by every visual detail, not just colour.

# What you output — EXACTLY this shape

Output a SINGLE top-level statement and nothing else: a \`const BESPOKE_BLOCKS = { ... }\` object whose keys are section ids and whose values are functions \`(ctx) => ReactElement\`:

\`\`\`tsx
const BESPOKE_BLOCKS = {
  hero: (ctx) => ( /* on-brand hero: heading from window.__KIT__ + description */ ),
  "text-fields": (ctx) => ( /* search-with-icon, prefixed (@) input, textarea */ ),
  selects: (ctx) => ( /* a select-with-chevron + an open dropdown menu */ ),
  choice: (ctx) => { /* checkboxes (checked+unchecked) + radios; useState */ },
  switches: (ctx) => { /* 2-3 labelled toggles; useState */ },
  field: (ctx) => ( /* default / focused / error field states */ ),
  buttons: (ctx) => ( /* primary, secondary, ghost, disabled + small + icon */ ),
  badge: (ctx) => ( /* Default(accent), Success, Warning, Error, Info, Draft(outline) */ ),
  avatars: (ctx) => ( /* avatar group of 4-5 + "+12", single avatar w/ status dot, mini list-item */ ),
  tabs: (ctx) => { /* 4-tab row (one active) + 3-option segmented control; useState */ },
  tooltip: (ctx) => ( /* a tooltip bubble on a target element */ ),
  alert: (ctx) => ( /* info banner: icon + "Heads up" + body + action */ ),
  progress: (ctx) => ( /* labelled bar at 64% + 2-3 skeleton lines */ ),
  accordion: (ctx) => { /* 2-3 expandable rows; useState */ },
  breadcrumb: (ctx) => ( /* a 3-level breadcrumb trail */ ),
  pagination: (ctx) => ( /* Prev / 1 2 3 … 12 / Next, one active */ ),
  stats: (ctx) => ( /* 3 KPI tiles: Active users 12,408 +8.2%; Conversion 4.6% +0.4pp; Avg. response 184ms -12ms */ ),
  card: (ctx) => ( /* header (mark + "Q3 product roadmap" + "Updated 2 hours ago") + body + "In progress" pill + View/Share */ ),
  table: (ctx) => ( /* header + 3 rows: INC-204 Render pipeline Open 2h ago; INC-198 Auth retry loop Triaged 5h ago; INC-191 Webhook latency Resolved 1d ago */ ),
};
\`\`\`

RULES on the shape (strict):
- Output ONLY \`const BESPOKE_BLOCKS = { ... };\`. No \`App\`, no nav, no Foundations, no \`export\`, no \`readRootCssVars\`, NO other top-level declarations. Define any helpers INSIDE each block's closure — top-level helpers collide with the shell and break the build.
- Each value is a function \`(ctx) => ReactElement\`. The four stateful blocks — \`choice\`, \`switches\`, \`tabs\`, \`accordion\` — may call the global \`useState\` (they are mounted as components in their own scope).
- Use the EXACT keys shown (note \`"text-fields"\` is a quoted key). Provide ALL of them — a missing or runtime-throwing key silently falls back to a generic block, so completeness = full brand coverage.
- Do NOT output the keys colour, typography, spacing, sizes, radius, elevation, icons — the shell renders those from the kit's real tokens.

# The ctx each block receives

Every block is called with one \`ctx\` object. Use it so bodies match the kit — or hardcode brand-specific values when you know the brand (you are designing for ONE brand):
- \`ctx.bg\`, \`ctx.surface\`, \`ctx.surfaceElevated\` — background colours
- \`ctx.text\`, \`ctx.headingText\` — text colours
- \`ctx.accent\`, \`ctx.onAccent\` — brand accent + a legible colour to paint ON the accent
- \`ctx.border\` — neutral border colour
- \`ctx.radii\` — \`{ sm, md, lg, pill }\` CSS values from the kit's radius scale
- \`ctx.profile\` — style profile: \`profile.colours.{success,warning,error,info}\`, \`profile.button\`, \`profile.input\`, \`profile.card\`, \`profile.badge\`, \`profile.tab\`, \`profile.density\`
- \`ctx.fontFamily\` — the kit's font stack
- \`ctx.withAlpha(value, alpha)\` → an rgba() of a colour; \`ctx.onColour(bg)\` → white or near-black for contrast on \`bg\`

You may also reference kit tokens directly inline as \`var(--token-name)\` with sensible fallbacks.

# The brand fidelity contract — what makes Apple feel iOS

This is the part most generators get wrong. Render each block the way THIS BRAND actually renders it. Concrete patterns to study and apply:

- **Apple / iOS** — light mode default, San Francisco-ish typography, near-black text \`#1d1d1f\`, accent Apple System Blue \`#0071e3\`, buttons soft-rounded ~22px (not pill, not square), filled-blue primary, light-grey secondary, no drop-shadows on buttons, iOS-style toggles (capsule, no border, soft inner shadow), checkboxes with the iOS checkmark, badges very compact + filled, segmented controls with a soft pill behind the active item. Status colours subdued: success #34c759, warning #ff9500, error #ff3b30. Cards have a subtle 1px border + minimal shadow.
- **Linear** — dark mode default \`#08090a\` background, indigo accent \`#5e6ad2\`, monospace touches, buttons pill-shaped (radius 9999), no shadows, secondary is just a 1px border on transparent, inputs have very subtle borders, tabs use a 2px underline in accent, table rows use a hairline border in white at 6% opacity, density is dense.
- **Stripe** — light mode \`#ffffff\` bg, ink \`#0a2540\` headings, body \`#425466\`, accent \`#635bff\`, primary button has a SIGNATURE drop-shadow \`0 1px 2px rgba(50,50,93,0.10), 0 4px 12px rgba(50,50,93,0.10)\` and lifts on hover, focused inputs get a 3px accent ring, cards have generous padding ~24px, buttons radius ~6-8px.
- **Notion** — warm white \`#ffffff\` bg, surface \`#f7f6f3\`, text \`#37352f\`, accent \`#2383e2\` blue, headings serif-feel (weight 600, slight tracking), cards use a soft drop-shadow not a border, buttons radius ~4-6px, density airy.
- **Figma** — light mode \`#ffffff\`, accent Figma-blue \`#0d99ff\`, near-black text, rounded UI throughout (radius-md ~6-8px on buttons, larger on cards), status colours from Figma's actual palette: success #14ae5c, warning #ffc738, error #f24822. Tabs use underline.
- **Vercel** — dark \`#000000\`, surface \`#0a0a0a\`, accent \`#ffffff\` (white-on-black is the brand), monochrome, sharp 6px radii on buttons, inputs use subtle 1px white-at-14% borders, geometric Geist-like typography.
- **IBM (Carbon)** — sharp 4px button radius, headingWeight 700, dense layout, strict grid feel, status colours from the IBM palette.
- **Asana** — light mode, coral/red accent (around #f06a6a or the kit's tokens), warm rounded UI, buttons radius ~10px (not pill), card elevation soft shadow, tabs 2px coral underline, friendly approachable type.
- **Spotify** — dark \`#121212\`, surface \`#181818\`, accent green \`#1ed760\`, pill buttons used aggressively, green primary with DARK text on the green (it's so bright), bold display type.
- **Ramp** — cream \`#fafaf7\` bg, near-black accent, no shadows, buttons radius ~24px, editorial sans, dense stat tiles.
- **For any kit you don't recognise**: read the kit's layout.md and tokens.css. Identify the primary CTA pattern (filled / shadowed / outlined?), button radius, input style, card pattern, status palette. Apply consistently across all blocks.

# Hero rules (the \`hero\` block)

**HARD RULE: read the kit name and description from \`window.__KIT__\` at runtime — NEVER hardcode them as string literals.** Pattern:

\`\`\`tsx
const kit = (window as any).__KIT__ ?? {};
const heading = kit.name ?? "Design System";
const sub = kit.description ?? "";
// <h1>{heading}</h1><p>{sub}</p>
\`\`\`

The brand name string (e.g. "Airtable") must NOT appear in your output — read it from the global. Render \`kit.logoUrl\` as an \`<img>\` (max-height 48-80px) ONLY if it is present. **When no logo is present, the hero is text only** — no \`<img>\`, no \`<svg>\` mark, no coloured square/monogram/icon next to the name, and NO eyebrow/kicker label (no "DESIGN SYSTEM" / "Design Tokens" / "UI Kit" span above the heading). The kit name alone is the hero; the description sits underneath as plain prose.

# Iframe runtime rules

1. Output is ONLY TypeScript source — the single \`const BESPOKE_BLOCKS\`. No prose, no markdown fences, no commentary.
2. Use JSX freely (transpiled with jsxFactory React.createElement).
3. Globals available: React, useState, useEffect, useRef, useMemo, useCallback. Do NOT import anything.
4. Tailwind is loaded; you may mix Tailwind classes with inline \`style={}\`.
5. Buttons painted on the accent derive their label colour from luminance — use \`ctx.onAccent\` (or \`ctx.onColour(bg)\`). Never hardcode #fff/#000 without a luminance check.
6. **NEVER use emojis anywhere.** Icons are inline SVG (12-20px) in the kit's accent or text colour. Avatars are coloured circles with initials.
7. Interactive controls (toggle, checkbox, radio, tabs, segmented, accordion) use \`useState\` so clicking flips state. Tabs/segmented are \`<button type="button">\` — never anchors; onClick only updates state (it must not scroll the page).
8. For hover/cursor states, add these data-attributes — the shell already styles them, so do NOT inject your own global \`<style>\`: \`data-showcase-btn="true"\` (plus \`data-variant="primary"|"secondary"|"ghost"\`) on buttons; and \`data-showcase-tab\`, \`data-showcase-segment\`, \`data-showcase-toggle\`, \`data-showcase-checkbox\`, \`data-showcase-radio\`, \`data-showcase-card\`, \`data-showcase-input\` on the matching elements.
9. Ignore motion/animation tokens entirely.

# Output

Return ONLY \`const BESPOKE_BLOCKS = { ... };\`. No backticks, no explanation.`;

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
  /** Abort the Anthropic call when the upstream request is cancelled (client
   * disconnect, route timeout). Without this, a hung stream keeps the
   * bespokeShowcaseLimit slot busy until the 180s queue timeout fires. */
  signal?: AbortSignal;
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
  // Strip @keyframes blocks. Earlier this used a single regex with nested
  // quantifiers — `(?:[^{}]*\{[^{}]*\}[^{}]*)*` — which on tokens.css with
  // many brace pairs but no @keyframes to anchor (Linear's, for one)
  // exhibited catastrophic backtracking and pegged the Node thread until
  // Coolify killed the container. Bracket-counter is O(n) and immune.
  let out = "";
  let i = 0;
  while (i < css.length) {
    const next = css.indexOf("@keyframes", i);
    if (next === -1) {
      out += css.slice(i);
      break;
    }
    out += css.slice(i, next);
    let j = next + "@keyframes".length;
    while (j < css.length && css[j] !== "{") j++;
    if (j >= css.length) {
      out += css.slice(next);
      break;
    }
    let depth = 1;
    j++;
    while (j < css.length && depth > 0) {
      if (css[j] === "{") depth++;
      else if (css[j] === "}") depth--;
      j++;
    }
    i = j;
  }
  // Remove lines declaring motion-family custom properties. Per-line, no
  // nesting, safe.
  out = out.replace(/^\s*--(motion|animation|transition|keyframe|duration|ease|easing)[^;]*;\s*$/gim, "");
  return out;
}

/** The bespoke generator now emits only a `BESPOKE_BLOCKS` object; our shell
 * (KIT_SHOWCASE_TSX) provides App/nav/Foundations and reads it at render time.
 * Confirm the model produced the object so we never store a shell with zero
 * overrides (which would just be the uniform template). */
function hasBespokeBlocks(code: string): boolean {
  return /\b(?:const|let|var)\s+BESPOKE_BLOCKS\s*=/.test(code);
}

/** Concatenate the on-brand blocks with our fixed shell. The shell ends in
 * `export default App;` and resolves each section through GENERIC_BLOCKS ⊕
 * BESPOKE_BLOCKS, so the model's blocks override the generic ones; missing or
 * throwing blocks fall back to generic via the shell's error boundary. */
export function composeBespokeShowcase(blocksTsx: string): string {
  return blocksTsx.trim() + "\n\n" + KIT_SHOWCASE_TSX;
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
/** Belt-and-braces post-processor: when the kit has no primary logo,
 * strip every fabrication Claude tends to invent in the hero region —
 * <img>, <svg> mark, and "DESIGN SYSTEM" / "Design Tokens" / "UI Kit"
 * eyebrow spans. Only fires when no primary logo was provided, so kits
 * that legitimately have brand assets aren't touched. The post-processor
 * is the safety net for when prompt rules get ignored under generation
 * pressure (which happens — see commits 3b2c662, 49e7035 for prior
 * tightenings on the same surface).
 *
 * Renamed from stripImgsWhenNoLogo (which only handled the <img> case). */
export function stripFakeBrandingWhenNoLogo(code: string, hadPrimaryLogo: boolean): string {
  if (hadPrimaryLogo) return code;

  let out = code;

  // 1. Strip every <img> tag (existing behaviour). Three forms covering
  //    self-closing, open+close, and bare void-element style.
  out = out.replace(/<img\b[^>]*\/>/gi, "");
  out = out.replace(/<img\b[^>]*>\s*<\/img>/gi, "");
  out = out.replace(/<img\b[^>]*>/gi, "");

  // 2. Strip <svg>...</svg> blocks that appear before the first <h1.
  //    Heuristic: a logo-shaped SVG lives in the hero region; legitimate
  //    icons (status badges, status dots, table chevrons) live further
  //    down. The first <h1 is a reliable hero/body boundary because
  //    Claude always renders the kit name as the top heading.
  const heroBoundary = out.search(/<h1\b/i);
  if (heroBoundary > 0) {
    const head = out.slice(0, heroBoundary).replace(/<svg\b[\s\S]*?<\/svg>/gi, "");
    out = head + out.slice(heroBoundary);
  }

  // 3. Strip eyebrow / kicker labels — short text wrapped in a span/div/p
  //    that contains a known fabricated label AND has eyebrow-style CSS
  //    (uppercase, letter-spaced, or tiny font-size). Three signals must
  //    line up so we don't accidentally strip a legitimate paragraph.
  const FORBIDDEN_LABELS = /(Design System|Design Tokens|Style Guide|Brand Guide|UI Kit|Design Kit)/i;
  const EYEBROW_STYLE = /(textTransform[^,}]*uppercase|letterSpacing|fontSize\s*:\s*['"](?:1[0-2]|9)px)/i;
  out = out.replace(
    /<(span|div|p)\b([^>]*)>([\s\S]*?)<\/\1>/gi,
    (match, _tag, attrs, inner) => {
      if (typeof inner !== "string" || inner.length > 40) return match;
      if (!FORBIDDEN_LABELS.test(inner)) return match;
      if (!EYEBROW_STYLE.test(attrs ?? "")) return match;
      return "";
    },
  );

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
 *
 * Retries once on TSX validation failures (transpile error, missing
 * `export default`, empty output). These are caused by Claude emitting
 * non-deterministic output with a typo or truncated JSX, and a fresh
 * sample usually parses cleanly. Network/abort errors are not retried.
 */
export async function generateKitShowcase(input: GenerateInput): Promise<GeneratedShowcase> {
  return bespokeShowcaseLimit(async () => {
    try {
      return await generateKitShowcaseInner(input);
    } catch (err) {
      if (input.signal?.aborted) throw err;
      if (!isRetryableShowcaseError(err)) throw err;
      console.warn(
        "[bespoke-showcase] retrying after validation failure:",
        err instanceof Error ? err.message : String(err),
      );
      return generateKitShowcaseInner(input);
    }
  });
}

function isRetryableShowcaseError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : "";
  return (
    msg.startsWith("Generated showcase failed to transpile:") ||
    msg === "Generated showcase missing `export default App`." ||
    msg === "Generated showcase missing `BESPOKE_BLOCKS`." ||
    msg === "Transpilation produced empty output."
  );
}

async function generateKitShowcaseInner(input: GenerateInput): Promise<GeneratedShowcase> {
  const anthropic = new Anthropic(input.apiKey ? { apiKey: input.apiKey } : {});

  const logo = input.brandingAssets?.find((a) => /^(logo|mark|wordmark)$/i.test(a.slot));
  const otherBranding = (input.brandingAssets ?? []).filter((a) => a !== logo).slice(0, 4);

  const brandingSection = logo || otherBranding.length > 0
    ? [
        "",
        "Brand assets (render the primary logo prominently in the hero via an <img> tag, not a re-drawn mark):",
        logo ? `- primary logo: src="${logo.url}" alt="${input.kitName} logo" (slot: ${logo.slot}${logo.mimeType ? `, ${logo.mimeType}` : ""})` : "",
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

  const modelId = input.modelId ?? DEFAULT_BESPOKE_MODEL;
  const maxTokens = await getModelMaxOutputTokens(modelId);

  // Streaming: gives CLI callers a progress signal so they can see the
  // call is alive. The non-streaming path used to freeze terminals for
  // 1-3 minutes with no output, indistinguishable from a network stall.
  const stream = anthropic.messages.stream(
    {
      model: modelId,
      max_tokens: maxTokens,
      system: SYSTEM,
      messages: [{ role: "user", content: userMessage }],
    },
    input.signal ? { signal: input.signal } : undefined,
  );

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
  const blocks = stripFakeBrandingWhenNoLogo(stripFences(raw), hadPrimaryLogo);

  if (!hasBespokeBlocks(blocks)) {
    // Final safety net: log the first chunk so we can diagnose what Claude
    // actually returned, instead of failing silently.
    console.error(
      "[bespoke-showcase] no BESPOKE_BLOCKS found. First 300 chars of raw:",
      raw.slice(0, 300),
    );
    throw new Error("Generated showcase missing `BESPOKE_BLOCKS`.");
  }

  // Concatenate the on-brand blocks with our fixed shell, then transpile the
  // combination. ensureExportDefault is a belt-and-braces no-op (the shell
  // already exports App). JSX is fine — transpileTsx handles it with
  // jsxFactory: React.createElement, and yields the event loop before the
  // synchronous compile so the healthcheck stays responsive.
  const tsx = ensureExportDefault(composeBespokeShowcase(blocks));

  if (!hasExportDefault(tsx)) {
    throw new Error("Generated showcase missing `export default App`.");
  }

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
