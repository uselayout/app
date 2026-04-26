import Anthropic from "@anthropic-ai/sdk";
import {
  parseStyleProfile,
  DEFAULT_STYLE_PROFILE,
  type KitStyleProfile,
} from "@/lib/types/kit-style-profile";

// Claude derives the v2 KitStyleProfile from a kit's layout.md + tokens.css.
// The output is structured JSON describing every brand-variable visual
// decision the uniform Live Preview will make: brand colours, button
// fillStyle, input focus treatment, card elevation, status palette, etc.
//
// "Uniform structure, brand-faithful skin": the renderer's 12 blocks stay
// identical across kits, but each kit gets its own derived skin so Apple
// looks Apple, Linear looks Linear, Stripe looks Stripe — with the SAME
// structural layout.
//
// Cost: ~$0.02–0.05 per kit, ~3–5s. Falls back to DEFAULT_STYLE_PROFILE
// silently if Claude returns garbage.

const SYSTEM = `You are a senior brand designer. You analyse a design system's layout.md + tokens.css and emit a structured JSON profile describing how its UI should render.

Your output drives a uniform Live Preview that shows every kit through the same 12 component blocks. Brand fidelity comes from the COLOURS, weights, paddings, and treatments you prescribe — not from changing the structure.

# Output schema

Return ONLY a JSON object. No prose, no markdown. Every field required.

{
  "version": 2,
  "mode": "light" | "dark",
  "density": "compact" | "comfortable" | "airy",
  "colours": {
    "bg": "#hex",                  // app background
    "surface": "#hex",             // card / panel surface
    "surfaceElevated": "#hex",     // hover / popover surface
    "text": "#hex",                // body text
    "headingText": "#hex",         // h1/h2 — higher contrast than text
    "textMuted": "#hex",           // captions, secondary
    "accent": "#hex",              // brand primary CTA / accent
    "accentHover": "#hex",         // primary button hover
    "accentSubtle": "#hex or rgba()",  // tinted accent for badges/alerts
    "onAccent": "#hex",            // text/icon painted on accent — pick what the brand actually uses, not just luminance-derived
    "border": "#hex or rgba()",    // neutral divider
    "borderStrong": "#hex or rgba()",  // emphasised border (focus, selected)
    "success": "#hex",             // brand success — use kit's actual green if defined
    "warning": "#hex",
    "error": "#hex",
    "info": "#hex"
  },
  "type": {
    "headingWeight": 400-800,
    "bodyWeight": 400-700,
    "headingTracking": "-0.02em" | "-0.025em" | "-0.01em" | "0" | "0.01em"
  },
  "button": {
    "radius": "var(--radius-X)" | "Npx",
    "weight": 400-700,
    "padding": "10px 18px",
    "fillStyle": "filled" | "shadowed" | "subtle" | "outlined-emphasis",
    "primaryShadow": null | "0 1px 2px rgba(0,0,0,0.08), 0 4px 12px rgba(99,91,255,0.25)",
    "hoverEffect": "brightness" | "shadow-lift" | "bg-shift" | "border-fill",
    "secondaryStyle": "outline" | "filled-light" | "ghost"
  },
  "input": {
    "radius": "...",
    "borderWidth": 1 | 1.5 | 2,
    "focusStyle": "ring" | "border" | "shadow",
    "bg": "surface" | "bg" | "#hex"
  },
  "card": {
    "radius": "...",
    "padding": 12-32,
    "elevation": "soft" | "shadow" | "elevated",
    "bg": "surface" | "bg" | "#hex"
  },
  "badge": {
    "shape": "pill" | "rounded" | "square",
    "weight": 400-700
  },
  "tab": {
    "indicator": "underline" | "pill" | "filled" | "subtle",
    "indicatorWeight": 1-4
  }
}

# How to choose values

**Mode**: which surface the brand's product lives on by default. Linear, Vercel, Spotify, Sentry, Cursor, Supabase, ElevenLabs, Perplexity, Revolut, Mercedes, Netflix, Attio, Fey → "dark". Most others (Stripe, Notion, Apple, Klarna, Wise, Ramp, Asana, Folk, Bonsai, Webflow, Coinbase, Shopify, Zendesk, Dropbox, Figma, IBM, Airtable, etc.) → "light". When uncertain, look at hints in layout.md ("Dark, ultra-minimal" → dark).

**Brand colours — be authoritative.** Use the brand's actual palette:

- **Apple** → bg #ffffff, surface #fbfbfd, text #1d1d1f, headingText #1d1d1f, accent #0071e3 (Apple System Blue), accentHover #0077ed, onAccent #ffffff, border rgba(0,0,0,0.10). Buttons rounded ~18px (NOT pill), filled style, brightness hover. Status: success #34c759, warning #ff9500, error #ff3b30, info #007aff.

- **Linear** → bg #08090a, surface #131316, text #f7f8f8, headingText #ffffff, accent #5e6ad2, accentHover #6e7adf, onAccent #ffffff, border rgba(255,255,255,0.10). Pill buttons (var(--radius-full)), brightness hover. Density comfortable.

- **Stripe** → bg #ffffff, surface #f6f9fc, text #425466, headingText #0a2540, accent #635bff, accentHover #5851ec, onAccent #ffffff, accentSubtle rgba(99,91,255,0.10). primaryShadow "0 1px 2px rgba(50,50,93,0.10), 0 4px 12px rgba(50,50,93,0.10)". hoverEffect "shadow-lift". Buttons radius ~6-8px not pill. Status colours from Stripe's own palette.

- **Notion** → bg #ffffff, surface #f7f6f3 (warm grey), text #37352f, headingText #37352f, accent #2383e2 (Notion blue), accentHover #1a6bbf, onAccent #ffffff. Card elevation "shadow". Density "airy". Headings serif-feel weight 600.

- **Figma** → bg #ffffff (or #FADCA2 ONLY if the kit's primary surface is the cream — check tokens.css), text #000000, headingText #000000, accent #0d99ff (Figma blue), accentHover #0084e0, onAccent #ffffff. Status: success #14ae5c, warning #ffc738, error #f24822, info #0d99ff. Rounded UI (radius-md, not pill).

- **Vercel** → bg #000000, surface #0a0a0a, text #ededed, headingText #ffffff, accent #ffffff, accentHover #fafafa, onAccent #000000, border rgba(255,255,255,0.14). Mono-chrome dark — primary button is white-on-black. fillStyle "filled".

- **Ramp** → bg #fafaf7 (cream), surface #ffffff, text #1a1a1a, headingText #000000, accent #1a1a1a (near-black), accentHover #000000, onAccent #fafaf7, border rgba(0,0,0,0.10). Buttons radius ~24px, filled style, no shadow. Editorial.

- **IBM** → bg #ffffff, surface #f4f4f4, text #161616, headingText #161616, accent #0f62fe (IBM blue), accentHover #0050e6, onAccent #ffffff, border #c6c6c6. Sharp corners (radius-sm 4px), headingWeight 700 (assertive corporate). Status colours strict IBM palette.

- **Airbnb** → bg #ffffff, surface #ffffff, text #222222, headingText #222222, accent #ff385c (Airbnb pink/red), accentHover #e0306c, onAccent #ffffff. Buttons rounded ~12-16px, filled. Card elevation "shadow".

- **Klarna** → bg #ffffff, surface #ffa8cd (or warmer pink), text #17120f, headingText #0c0a09, accent #ffa8cd or #000000 (Klarna alternates), buttons pill-shaped, filled.

- **Spotify** → bg #121212, surface #181818, text #b3b3b3, headingText #ffffff, accent #1ed760 (Spotify green), accentHover #1fdf64, onAccent #000000 (the green is bright, dark text on it). Pill buttons.

- **Wise** → bg #ffffff, surface #ffffff, text #0e0f0c, headingText #0e0f0c, accent #163300 (deep green) and/or #9fe870 (signature lime), onAccent #0e0f0c. Buttons rounded.

- **Coinbase** → bg #ffffff, accent #0052ff (Coinbase blue), onAccent #ffffff, headingText #0a0b0d. Sharp-ish buttons, regulated-finance feel.

- **OpenAI** → bg #ffffff, surface #fafafa, text #000000, headingText #000000, accent #10a37f (OpenAI green) — NOT default indigo. Editorial weight 500.

- **Sentry** → bg #181225 (dark purple-tinged), surface #1f1937, text #ebe6ef, accent #7553ff or #f55a91 (Sentry's actual purple/magenta — they use both). dark mode.

- **PostHog** → bg #ffffff (or warm yellow #fff4e3 in some surfaces), accent #f9bd2b (PostHog yellow) with dark text #000 on it. Onyx for primary buttons sometimes.

- **For any other brand**: study layout.md for explicit colour mentions. Inspect tokens.css for the most "brand"-named colour token (e.g. \`--f-emphasis-btn-bg-color\` is Figma's primary CTA — read its value). NEVER default to indigo or Linear's #5E6AD2. If genuinely no brand colour exists, use #1f2228 (near-black) or #ffffff (near-white) depending on mode — graceful neutral, never branded as Linear.

**Density**:
- compact: IBM, Salesforce, Microsoft, ClickUp
- comfortable: Linear, Vercel, Notion, Stripe (most kits)
- airy: Apple, Bonsai, Headspace

**fillStyle**:
- "filled": flat solid accent (most common — Linear, Notion, IBM)
- "shadowed": filled + drop-shadow (Stripe, Webflow)
- "subtle": low-saturation tinted bg (rare — some Notion variants)
- "outlined-emphasis": thick border, accent text, transparent fill

**hoverEffect**: "brightness" default. "shadow-lift" if brand uses elevated hovers (Stripe, Vercel). "bg-shift" for subtle bg colour change (most macOS-style). "border-fill" for outline buttons that fill on hover.

**secondaryStyle**: "outline" most common. "filled-light" if secondary is a tinted bg (Notion). "ghost" if it's just text with hover bg (some Apple).

**focusStyle**: "ring" if accent ring on focus (Stripe, modern web). "border" if border colour shifts only (Linear, Apple, native macOS). "shadow" rare.

**card.elevation**: "soft" = border only (Linear, Stripe, Vercel). "shadow" = border + soft shadow (Notion, Asana, Asana). "elevated" = shadow only no border (Material).

**badge.shape**: "pill" most common. "rounded" for sharp brands (IBM uses small radius). "square" rare.

**tab.indicator**: "underline" most common. "pill" if the active tab has a pill background (Apple Music). "filled" if active gets full accent fill. "subtle" if it's just bold + colour shift.

**tab.indicatorWeight**: 2 default. 1 for delicate (Apple). 3 for emphatic.

# Hard rules

- Output ONLY a JSON object. No markdown, no prose.
- Every field required.
- Colour values must be valid CSS: \`#hex\`, \`rgb(...)\`, \`rgba(...)\`, \`hsl(...)\`, \`var(--...)\`, \`oklch(...)\`. NO bare colour names ("blue") or invented values.
- Numeric fields must be plain numbers, not strings.
- Do not invent token names that aren't in the kit's tokens.css.
- For unknown brands, derive defensibly from layout.md and tokens.css. Never default to Linear-indigo (#5E6AD2 / #6366f1).`;

export interface GenerateProfileInput {
  kitName: string;
  kitDescription?: string;
  kitTags: string[];
  layoutMd: string;
  tokensCss: string;
  apiKey?: string;
  modelId?: string;
}

function stripFences(raw: string): string {
  let out = raw.trim();
  out = out.replace(/^```(?:json)?\s*/i, "");
  out = out.replace(/```\s*$/, "");
  return out.trim();
}

/**
 * Generate the v2 kit style profile via Claude. Always returns a valid
 * profile — falls back to DEFAULT_STYLE_PROFILE on any failure. Never
 * throws.
 */
export async function generateKitStyleProfile(
  input: GenerateProfileInput,
): Promise<KitStyleProfile> {
  const anthropic = new Anthropic(input.apiKey ? { apiKey: input.apiKey } : {});

  const userMessage = [
    `Kit name: ${input.kitName}`,
    input.kitDescription ? `Description: ${input.kitDescription}` : "",
    input.kitTags.length > 0 ? `Tags: ${input.kitTags.join(", ")}` : "",
    "",
    "First ~3000 chars of layout.md:",
    "```",
    input.layoutMd.slice(0, 3000),
    "```",
    "",
    "tokens.css (first 4000 chars — use these for accent values, prefer ones already declared as CSS variables):",
    "```css",
    input.tokensCss.slice(0, 4000),
    "```",
    "",
    "Return ONLY the JSON object described in the system prompt.",
  ]
    .filter(Boolean)
    .join("\n");

  let raw: string;
  try {
    const response = await anthropic.messages.create({
      model: input.modelId ?? "claude-sonnet-4-6",
      max_tokens: 4000,
      system: SYSTEM,
      messages: [{ role: "user", content: userMessage }],
    });
    raw = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n");
  } catch (err) {
    console.error("[style-profile] Claude call failed:", err);
    return DEFAULT_STYLE_PROFILE;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(stripFences(raw));
  } catch (err) {
    console.error("[style-profile] JSON parse failed:", err, "\nraw:", raw.slice(0, 300));
    return DEFAULT_STYLE_PROFILE;
  }

  return parseStyleProfile(parsed) ?? DEFAULT_STYLE_PROFILE;
}
