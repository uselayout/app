import Anthropic from "@anthropic-ai/sdk";
import {
  parseStyleProfile,
  DEFAULT_STYLE_PROFILE,
  type KitStyleProfile,
} from "@/lib/types/kit-style-profile";

// Claude derives a small structured profile from the kit's layout.md +
// tokens.css. The output JSON tells the uniform Live Preview how each
// block should render for THIS kit — radii, weights, paddings, fill
// styles, density. Cheap (~$0.005/kit), predictable (validated against
// a strict schema), and easy to evolve (improve renderer once, every
// kit benefits).
//
// Falls back to DEFAULT_STYLE_PROFILE if Claude returns garbage.

const SYSTEM = `You analyse a design system's documentation and tokens and produce a small JSON object describing how its UI looks. Your only job is the JSON — no prose, no markdown fences.

The JSON has this exact shape (every field required, even if you keep the default):

{
  "version": 1,
  "mode": "light" | "dark",
  "density": "compact" | "comfortable" | "airy",
  "headingWeight": 400-800,
  "button": {
    "radius": "var(--radius-NAME)" | "Npx",
    "weight": 400-700,
    "padding": "Npx Npx",
    "fillStyle": "filled" | "shadowed" | "subtle"
  },
  "input": {
    "radius": "var(--radius-NAME)" | "Npx",
    "borderWidth": 1 | 1.5 | 2,
    "focusStyle": "ring" | "border"
  },
  "card": {
    "radius": "var(--radius-NAME)" | "Npx",
    "padding": 12-32,
    "elevation": "soft" | "shadow" | "elevated"
  },
  "badge": {
    "shape": "pill" | "rounded" | "square",
    "weight": 400-700
  },
  "tab": {
    "indicator": "underline" | "pill" | "filled" | "subtle"
  }
}

# How to choose values

- **mode**: which surface the brand's product lives on. Linear, Vercel, Spotify, Sentry, Cursor, Supabase, ElevenLabs, Perplexity, Revolut, Mercedes, Netflix, Attio, Fey → "dark". Most others (Stripe, Notion, Apple, Klarna, Wise, Ramp, Asana, Folk, Bonsai, Webflow, Coinbase, Shopify, Zendesk, Dropbox, etc.) → "light". When uncertain, look for hints in layout.md ("dark UI", "primarily dark surface").

- **density**: how breathable the layout is. Apple, Stripe, Bonsai → "airy". Linear, Vercel, Notion → "comfortable". IBM, Salesforce, Microsoft, ClickUp → "compact".

- **headingWeight**: the brand's display weight on h1 / h2.
  - Apple, Vercel, Stripe display lean towards 500-600 (refined / editorial)
  - Linear, Notion, Figma sit around 600-700 (confident / direct)
  - IBM, Salesforce, Microsoft go 700-800 (assertive / corporate)

- **button.radius**: prefer a CSS variable reference if a sensibly-named radius token exists (e.g. \`var(--radius-md)\`, \`var(--radius-lg)\`). Pill-button kits (Stripe, Linear, Wise) use the pill / full radius. Sharp-cornered kits (IBM, Notion) use sm/md radii (4-8px). Modern soft kits (Apple, Vercel, Cursor) use a medium radius (8-14px).
- **button.weight**: 500 is most common. 600 for assertive brands (IBM, Salesforce). 400 for serif / editorial brands.
- **button.padding**: "10px 18px" is a sensible default. Compact kits → "8px 14px". Airy kits → "12px 22px".
- **button.fillStyle**: "filled" is the default solid CTA. "shadowed" if the brand uses a soft drop-shadow on primary buttons (Stripe, Webflow). "subtle" if primary is a tinted background not solid (rare; Notion-like).

- **input.radius**: usually a smaller radius than buttons. \`var(--radius-md)\` or \`var(--radius-sm)\`.
- **input.borderWidth**: 1 default. 1.5 for kits with emphasis (Notion). 2 only for very chunky borders.
- **input.focusStyle**: "ring" if the brand uses an accent-coloured outer ring/glow on focus (Stripe). "border" if just the border colour shifts (Linear, Apple).

- **card.radius**: usually larger than buttons. \`var(--radius-lg)\` is most common. 16-24px.
- **card.padding**: 20 default. 16 for compact, 28 for airy.
- **card.elevation**: "soft" = border, no shadow (Linear, Stripe). "shadow" = border + soft shadow (Notion, Asana). "elevated" = shadow only, no border (Material / Google).

- **badge.shape**: "pill" for most (universal default). "rounded" if the brand uses small-radius status chips. "square" rare.
- **badge.weight**: usually 500. 600 for emphatic brands.

- **tab.indicator**: "underline" most common (Linear, Stripe, Notion). "pill" if active tab gets a pill-shaped background (Apple Music). "filled" if active tab gets full accent fill. "subtle" if the active marker is just bold + colour shift.

# Hard rules

- Output ONLY a JSON object. No explanation, no markdown, no leading/trailing whitespace.
- Every field must be present. If you're uncertain, pick the closest of the listed values.
- "var(--...)" strings must reference a token name that actually appears in tokens.css. Don't invent.
- Numeric fields must be plain numbers, not strings.
- Do not include any field outside the schema above.`;

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
 * Generate the kit style profile via Claude. Always returns a valid
 * profile — if Claude's output fails to parse, falls back to
 * DEFAULT_STYLE_PROFILE. Never throws.
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
    "First ~2000 chars of layout.md:",
    "```",
    input.layoutMd.slice(0, 2000),
    "```",
    "",
    "tokens.css (for var() name references; first 3000 chars):",
    "```css",
    input.tokensCss.slice(0, 3000),
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
      max_tokens: 1500,
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
    console.error("[style-profile] JSON parse failed:", err, "\nraw:", raw.slice(0, 200));
    return DEFAULT_STYLE_PROFILE;
  }

  return parseStyleProfile(parsed) ?? DEFAULT_STYLE_PROFILE;
}
