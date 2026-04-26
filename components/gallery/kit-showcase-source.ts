// TSX source for the Kit Showcase. Rendered inside the gallery preview iframe
// via the existing transpile pipeline (POST /api/transpile → JS → buildSrcdoc).
//
// The component runs inside the iframe's React context. It has no access to
// anything from the host app — only React globals, Tailwind classes, and the
// kit's CSS custom properties that the frame injects via cssTokenBlock.
//
// At mount time it introspects document.styleSheets to discover all --*
// variables defined in the injected tokens, categorises them, and renders a
// uniform showcase: palette, typography scale, spacing, radius, shadows,
// component samples. Every kit renders through the same template; the output
// looks different per-kit only because the tokens are different.

export const KIT_SHOWCASE_TSX = `
type CssVar = { name: string; value: string };

type Category = "color" | "space" | "radius" | "shadow" | "font" | "other";

// Style profile v2 — mirrors lib/types/kit-style-profile.ts. Inlined here
// because the iframe runtime can't import. The host injects the kit's
// profile via window.__KIT__.styleProfile; DEFAULT runs as fallback.
type KitStyleProfile = {
  version: 2;
  mode: "light" | "dark";
  density: "compact" | "comfortable" | "airy";
  colours: {
    bg: string; surface: string; surfaceElevated: string;
    text: string; headingText: string; textMuted: string;
    accent: string; accentHover: string; accentSubtle: string; onAccent: string;
    border: string; borderStrong: string;
    success: string; warning: string; error: string; info: string;
  };
  type: { headingWeight: number; bodyWeight: number; headingTracking: string };
  button: {
    radius: string; weight: number; padding: string;
    fillStyle: "filled" | "shadowed" | "subtle" | "outlined-emphasis";
    primaryShadow: string | null;
    hoverEffect: "brightness" | "shadow-lift" | "bg-shift" | "border-fill";
    secondaryStyle: "outline" | "filled-light" | "ghost";
  };
  input: { radius: string; borderWidth: number; focusStyle: "ring" | "border" | "shadow"; bg: string };
  card: { radius: string; padding: number; elevation: "soft" | "shadow" | "elevated"; bg: string };
  badge: { shape: "pill" | "rounded" | "square"; weight: number };
  tab: { indicator: "underline" | "pill" | "filled" | "subtle"; indicatorWeight: number };
};

const DEFAULT_STYLE_PROFILE: KitStyleProfile = {
  version: 2, mode: "light", density: "comfortable",
  colours: {
    bg: "#ffffff", surface: "#fafafa", surfaceElevated: "#ffffff",
    text: "#1f2228", headingText: "#08090a", textMuted: "#6b7280",
    accent: "#1f2228", accentHover: "#000000", accentSubtle: "rgba(31, 34, 40, 0.10)", onAccent: "#ffffff",
    border: "rgba(0, 0, 0, 0.10)", borderStrong: "rgba(0, 0, 0, 0.20)",
    success: "#2ea043", warning: "#d49a15", error: "#e54d2e", info: "#2383e2"
  },
  type: { headingWeight: 700, bodyWeight: 400, headingTracking: "-0.025em" },
  button: { radius: "var(--radius-lg, 10px)", weight: 500, padding: "10px 18px", fillStyle: "filled", primaryShadow: null, hoverEffect: "brightness", secondaryStyle: "outline" },
  input: { radius: "var(--radius-md, 8px)", borderWidth: 1, focusStyle: "ring", bg: "bg" },
  card: { radius: "var(--radius-lg, 12px)", padding: 20, elevation: "soft", bg: "surface" },
  badge: { shape: "pill", weight: 500 },
  tab: { indicator: "underline", indicatorWeight: 2 }
};

function readRootCssVars(): CssVar[] {
  const out: CssVar[] = [];
  const seen = new Set<string>();
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList | null = null;
    try { rules = sheet.cssRules; } catch { continue; }
    if (!rules) continue;
    for (const rule of Array.from(rules)) {
      if (!(rule instanceof CSSStyleRule)) {
        if ((rule as CSSGroupingRule).cssRules) {
          for (const inner of Array.from((rule as CSSGroupingRule).cssRules)) {
            if (inner instanceof CSSStyleRule && inner.selectorText.trim() === ":root") {
              collect(inner.style, out, seen);
            }
          }
        }
        continue;
      }
      if (rule.selectorText.trim() === ":root") {
        collect(rule.style, out, seen);
      }
    }
  }
  return out;
}

function collect(style: CSSStyleDeclaration, out: CssVar[], seen: Set<string>) {
  for (let i = 0; i < style.length; i++) {
    const name = style[i];
    if (!name || !name.startsWith("--") || seen.has(name)) continue;
    // Skip motion/animation/keyframe definitions: they aren't visual tokens
    // and dumping @keyframes into a palette grid bloats the showcase.
    if (/^--(motion|animation|keyframe|transition|duration|ease|easing)/i.test(name)) continue;
    const value = style.getPropertyValue(name).trim();
    if (/@keyframes/i.test(value)) continue;
    seen.add(name);
    out.push({ name, value });
  }
}

function categorise(v: CssVar): Category {
  const n = v.name.toLowerCase();
  const val = v.value.toLowerCase();
  if (/^#|^rgb|^rgba|^hsl|^oklch|^color\\(|^var\\(--color|^var\\(--.*color/.test(val) || /-(color|bg|text|border|fg|accent|brand|primary|success|warning|error|info|danger)$/.test(n) || /-(color|bg|text|border|fg|accent|brand|primary|success|warning|error|info|danger)-/.test(n)) return "color";
  if (/-(space|spacing|gap|size)(-|$)/.test(n) && /^-?\\d/.test(val)) return "space";
  if (/-(radius|rounded|corner)(-|$)/.test(n)) return "radius";
  if (/-(shadow|elevation|depth)(-|$)/.test(n)) return "shadow";
  if (/-(font|text|type)(-|$)/.test(n)) return "font";
  return "other";
}

function isColour(val: string): boolean {
  return /^#|^rgb|^rgba|^hsl|^oklch/.test(val.toLowerCase());
}

function contrast(fg: string, bg: string): number {
  const toRgb = (s: string): [number, number, number] | null => {
    s = s.trim();
    if (s.startsWith("#")) {
      let h = s.slice(1);
      if (h.length === 3) h = h.split("").map((c: string) => c + c).join("");
      if (h.length < 6) return null;
      return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
    }
    const m = s.match(/rgba?\\(\\s*([^)]+)\\)/);
    if (m) {
      const parts = m[1].split(",").map((p: string) => parseFloat(p));
      if (parts.length >= 3) return [parts[0], parts[1], parts[2]];
    }
    return null;
  };
  const a = toRgb(fg), b = toRgb(bg);
  if (!a || !b) return 0;
  const lum = (rgb: [number, number, number]) => {
    const c = rgb.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const la = lum(a), lb = lum(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

function sortSpacing(vars: CssVar[]): CssVar[] {
  return [...vars].sort((a, b) => parseFloat(a.value) - parseFloat(b.value));
}

function App() {
  const [vars, setVars] = React.useState<CssVar[] | null>(null);
  React.useEffect(() => {
    setVars(readRootCssVars());
    // Hover stylesheet. Profile-driven so each kit gets its brand-typical
    // hover treatment: brightness shift (default), shadow lift (Stripe),
    // bg shift (most macOS-style), or border fill (outline-emphasis kits).
    const meta = (typeof window !== "undefined" && (window as any).__KIT__) || {};
    const prof: KitStyleProfile = meta.styleProfile || DEFAULT_STYLE_PROFILE;
    const hover = prof.button.hoverEffect;
    const primaryHoverRule =
      hover === "shadow-lift" ? "[data-showcase-btn][data-variant='primary']:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 14px rgba(0,0,0,0.12); cursor: pointer; }"
      : hover === "bg-shift" ? "[data-showcase-btn][data-variant='primary']:hover:not(:disabled) { filter: brightness(1.05); cursor: pointer; }"
      : hover === "border-fill" ? "[data-showcase-btn][data-variant='primary']:hover:not(:disabled) { filter: brightness(0.96); cursor: pointer; }"
      : "[data-showcase-btn][data-variant='primary']:hover:not(:disabled) { filter: brightness(1.08); cursor: pointer; }";
    const style = document.createElement("style");
    style.textContent = [
      primaryHoverRule,
      "[data-showcase-btn]:active:not(:disabled) { filter: brightness(0.94); }",
      "[data-showcase-btn][data-variant='secondary']:hover, [data-showcase-btn][data-variant='ghost']:hover { background: rgba(127,127,127,0.08); cursor: pointer; }",
      "[data-showcase-btn]:not([data-variant='primary']):hover:not(:disabled) { cursor: pointer; }",
      "[data-showcase-tab]:hover { opacity: 1 !important; cursor: pointer; }",
      "[data-showcase-segment]:hover { cursor: pointer; }",
      "[data-showcase-toggle]:hover, [data-showcase-checkbox]:hover, [data-showcase-radio]:hover { cursor: pointer; }",
      "[data-showcase-card]:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.06); cursor: pointer; transition: box-shadow 150ms ease, transform 150ms ease; }",
      "[data-showcase-input]:focus { outline: none; }",
    ].join("\\n");
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  if (!vars) return React.createElement("div", { style: { padding: 24, color: "#999" } }, "Loading…");

  const buckets: Record<Category, CssVar[]> = {
    color: [], space: [], radius: [], shadow: [], font: [], other: []
  };
  for (const v of vars) buckets[categorise(v)].push(v);

  // Read the kit's style profile FIRST. v2 profiles include explicit
  // brand colours; the renderer trusts them and skips the heuristic
  // pickers. v1 profiles or no profile → fall back to picker.
  const kitMeta = (typeof window !== "undefined" && (window as any).__KIT__) || {};
  const profile: KitStyleProfile = kitMeta.styleProfile || DEFAULT_STYLE_PROFILE;
  const profileColours = profile.colours;

  // Profile colours win; picker is the safety net for legacy kits.
  const bg = profileColours?.bg || pickBg(buckets.color);
  const text = profileColours?.text || pickText(buckets.color, bg);
  const headingText = profileColours?.headingText || pickHeadingText(buckets.color, bg);
  const accent = profileColours?.accent || pickAccent(buckets.color);
  const surface = profileColours?.surface || pickSurface(buckets.color, bg);
  const border = profileColours?.border || pickBorder(buckets.color);
  const radii = pickRadii(buckets.radius);

  const fontFamily = buckets.font.find((v: CssVar) => /family|sans|serif/.test(v.name))?.value || "system-ui, sans-serif";

  // Density drives outer padding/gap so the showcase feels like the
  // kit's natural density, not a generic comfortable mid-tone.
  const outerGap = profile.density === "compact" ? 36 : profile.density === "airy" ? 60 : 48;
  const outerPadding = profile.density === "compact" ? "24px 32px" : profile.density === "airy" ? "44px 56px" : "32px 40px";

  return React.createElement("div", {
    style: {
      minHeight: "100vh",
      background: bg,
      color: text,
      fontFamily,
      padding: outerPadding,
      display: "flex",
      flexDirection: "column",
      gap: outerGap,
    }
  },
    Hero({ accent, border, surface, text, headingText, profile }),
    PaletteSection({ colours: buckets.color, bg, text, accent, border, surface, headingText }),
    TypographySection({ text, border, surface, accent, headingText, profile }),
    SpacingSection({ spacing: sortSpacing(buckets.space), text, border, accent, surface, headingText }),
    RadiusSection({ radii: buckets.radius, text, border, surface, accent, headingText }),
    ShadowSection({ shadows: buckets.shadow, surface, text, border, headingText }),
    ComponentsSection({ bg, text, accent, border, surface, headingText, radii, profile })
  );
}

function toRgb(s: string): [number, number, number] | null {
  s = s.trim();
  if (s.startsWith("#")) {
    let h = s.slice(1);
    if (h.length === 3) h = h.split("").map((c: string) => c + c).join("");
    if (h.length < 6) return null;
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  const m = s.match(/rgba?\\(\\s*([^)]+)\\)/);
  if (m) {
    const parts = m[1].split(",").map((p: string) => parseFloat(p));
    if (parts.length >= 3) return [parts[0], parts[1], parts[2]];
  }
  return null;
}

function luminance(value: string): number {
  const rgb = toRgb(value);
  if (!rgb) return 0.5;
  const c = [rgb[0], rgb[1], rgb[2]].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

/** Pick a legible label colour for text painted directly on the accent. */
function onColour(bg: string): string {
  return luminance(bg) < 0.5 ? "#ffffff" : "#08090a";
}

/** Convert any colour to an rgba() with the given alpha. Used to derive */
/** subtle neutral fills from the kit's text colour without grabbing the loud accent. */
function withAlpha(value: string, alpha: number): string {
  const rgb = toRgb(value);
  if (!rgb) return value;
  return "rgba(" + rgb[0] + ", " + rgb[1] + ", " + rgb[2] + ", " + alpha + ")";
}

function findByPattern(colours: CssVar[], patterns: RegExp[]): string | null {
  for (const p of patterns) {
    const match = colours.find((v: CssVar) => p.test(v.name) && isColour(v.value));
    if (match) return match.value;
  }
  return null;
}

function pickBg(colours: CssVar[]): string {
  const order = ["--bg-app", "--color-bg-app", "--color-background", "--color-bg", "--mkt-bg"];
  for (const name of order) {
    const c = colours.find((v: CssVar) => v.name === name);
    if (c && isColour(c.value)) return c.value;
  }
  return findByPattern(colours, [/-bg-app$/, /-background$/, /-bg$/]) || "#ffffff";
}
function pickText(colours: CssVar[], bg: string): string {
  const order = ["--text-primary", "--color-text-primary", "--color-text", "--color-foreground", "--mkt-text-primary"];
  for (const name of order) {
    const c = colours.find((v: CssVar) => v.name === name);
    if (c && isColour(c.value)) return c.value;
  }
  // Prefix-matched text tokens: --linear-text-primary, --acme-text, etc.
  const prefixed = findByPattern(colours, [/-text-primary$/, /-text-default$/, /-text$/, /-foreground$/]);
  if (prefixed) {
    const bgLum = luminance(bg);
    const prefLum = luminance(prefixed);
    const preferLight = bgLum < 0.5;
    const polarityOk = preferLight ? prefLum > 0.45 : prefLum < 0.55;
    if (polarityOk && contrast(prefixed, bg) >= 3) return prefixed;
  }

  // Luminance-aware fallback: dark bg, prefer light tokens. Light bg, prefer dark tokens.
  const bgLum = luminance(bg);
  const preferLight = bgLum < 0.5;
  let best: string | null = null;
  let bestRatio = 0;
  for (const v of colours) {
    if (!isColour(v.value)) continue;
    const r = contrast(v.value, bg);
    if (r === null || r < 3) continue;
    const tokenLum = luminance(v.value);
    const polarityOk = preferLight ? tokenLum > 0.55 : tokenLum < 0.45;
    if (!polarityOk) continue;
    if (r > bestRatio) { bestRatio = r; best = v.value; }
  }
  if (best) return best;
  // Hard fallback so we never render dark-on-dark.
  return preferLight ? "#f7f8f8" : "#111115";
}
function pickAccent(colours: CssVar[]): string {
  const order = ["--color-accent", "--color-primary", "--mkt-accent", "--accent", "--brand"];
  for (const name of order) {
    const c = colours.find((v: CssVar) => v.name === name);
    if (c && isColour(c.value)) return c.value;
  }
  // End-anchored pattern fallback. NEVER fall back to a hardcoded brand
  // colour — the previous "#5E6AD2" was Linear's accent and made every
  // unprofiled kit look like Linear. If no accent is found, return the
  // most saturated non-neutral colour available, else a near-black.
  const patterned = findByPattern(colours, [/-accent$/, /-primary$/, /-brand$/, /-cta$/]);
  if (patterned) return patterned;
  return "#1f2228";
}
function pickSurface(colours: CssVar[], bg: string): string {
  const order = ["--bg-surface", "--color-bg-surface", "--color-surface", "--mkt-surface"];
  for (const name of order) {
    const c = colours.find((v: CssVar) => v.name === name);
    if (c && isColour(c.value)) return c.value;
  }
  return findByPattern(colours, [/-bg-surface$/, /-bg-elevated$/, /-surface$/]) || bg;
}
type KitRadii = { sm: string; md: string; lg: string; pill: string };

/** Map the kit's --radius-* tokens to size buckets that the showcase blocks
 * can reference (button + badge → pill, input + tile → md, card → lg). When
 * a kit has no radius tokens, fall back to a sensible numeric scale. Apple-
 * style soft kits and IBM-style sharp kits then visibly differ on the same
 * components, instead of every block looking identical. */
function pickRadii(radii: CssVar[]): KitRadii {
  const parsed = radii
    .map((r: CssVar) => ({ name: r.name, value: r.value, num: parseFloat(r.value) }))
    .filter((r) => !isNaN(r.num) && r.num >= 0)
    .sort((a, b) => a.num - b.num);
  if (parsed.length === 0) return { sm: "4px", md: "8px", lg: "12px", pill: "999px" };

  const ref = (entry: typeof parsed[0]) => "var(" + entry.name + ")";
  const byName = (regex: RegExp) => parsed.find((r) => regex.test(r.name));

  const small = byName(/(-sm|-small|-xs|-tight|-2xs)/) || parsed[0];
  const medium = byName(/(-md|-medium|-default|-base|^--radius$)/) || parsed[Math.floor(parsed.length / 2)];
  const finite = parsed.filter((r) => r.num <= 64);
  const large = byName(/(-lg|-large|-xl)/) || finite[finite.length - 1] || parsed[parsed.length - 1];
  const pillToken = byName(/(-full|-pill|-circle|-round)/);
  const huge = parsed[parsed.length - 1];
  const pill = pillToken ? ref(pillToken) : (huge.num >= 50 ? ref(huge) : "999px");

  return { sm: ref(small), md: ref(medium), lg: ref(large), pill };
}

/** Pick a high-contrast text colour for headings. The general pickText
 * accepts any token whose contrast ratio is ≥ 3 — fine for body copy but
 * too soft for h1/h2 on light kits where the kit's --normal-text resolves
 * to a medium grey. Find the colour with the strongest contrast against bg. */
function pickHeadingText(colours: CssVar[], bg: string): string {
  const bgLum = luminance(bg);
  const preferDark = bgLum > 0.5;
  let best: string | null = null;
  let bestRatio = 0;
  for (const v of colours) {
    if (!isColour(v.value)) continue;
    const lum = luminance(v.value);
    // Heading must be near the polar opposite of bg, not a mid-tone.
    const polarityOk = preferDark ? lum < 0.2 : lum > 0.8;
    if (!polarityOk) continue;
    const r = contrast(v.value, bg);
    if (r === null) continue;
    if (r > bestRatio) { bestRatio = r; best = v.value; }
  }
  if (best && bestRatio >= 7) return best;
  // Hard fallback: ensure readable contrast even when the kit defines no
  // strong polar tokens.
  return preferDark ? "#08090a" : "#f7f8f8";
}

function pickBorder(colours: CssVar[]): string {
  // Many kits define semantic state borders (--color-success-border-default,
  // --color-error-border) before or alongside the neutral one. The previous
  // \`/-border-/\` regex matched any of those, so an unlucky ordering picked
  // green or red as the default frame colour. Rule: only accept names that
  // end with -border or look like a neutral default/subtle, AND reject any
  // name carrying a state stem.
  const STATE = /(success|error|warning|info|danger|positive|negative|caution|critical)/i;
  const ok = (name: string) => !STATE.test(name);

  const order = [
    "--studio-border",
    "--color-border",
    "--color-border-default",
    "--color-border-subtle",
    "--mkt-border",
    "--border",
  ];
  for (const name of order) {
    const c = colours.find((v: CssVar) => v.name === name);
    if (c && isColour(c.value) && ok(c.name)) return c.value;
  }

  // Pattern fallbacks: prefer end-anchored neutral names; skip state stems.
  const patterned = colours.filter((v: CssVar) => isColour(v.value) && ok(v.name));
  const endsWithBorder = patterned.find((v: CssVar) => /-border$/.test(v.name));
  if (endsWithBorder) return endsWithBorder.value;
  const endsWithDefault = patterned.find((v: CssVar) => /-border-default$/.test(v.name));
  if (endsWithDefault) return endsWithDefault.value;
  const endsWithSubtle = patterned.find((v: CssVar) => /-border-subtle$/.test(v.name));
  if (endsWithSubtle) return endsWithSubtle.value;
  // Last-ditch: any -border- token whose name doesn't carry a state stem.
  const generic = patterned.find((v: CssVar) => /-border-/.test(v.name));
  if (generic) return generic.value;
  return "rgba(0,0,0,0.12)";
}

function SectionHeader(props: { label: string; title: string; count?: number; headingText?: string }) {
  return React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 6 } },
    React.createElement("span", {
      style: { fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em", opacity: 0.55 }
    }, props.label + (props.count !== undefined ? " · " + props.count : "")),
    React.createElement("h2", {
      style: { fontSize: 28, lineHeight: 1.2, fontWeight: 600, margin: 0, letterSpacing: "-0.02em", color: props.headingText }
    }, props.title)
  );
}

function Hero(props: { accent: string; border: string; surface: string; text: string; headingText: string; profile: KitStyleProfile }) {
  // Kit metadata is injected by the iframe host as window.__KIT__. When
  // present, we render a logo + name + description hero — same shape as the
  // bespoke Notion showcase, so uniform and bespoke kits match aesthetically.
  // Fallback: a generic "design system rendered live" pitch.
  const kit = (typeof window !== "undefined" && (window as any).__KIT__) || {};
  const name: string = kit.name || "Your design system, rendered live";
  const description: string = kit.description || "Every kit in the Gallery renders through the same template so comparisons stay fair. Tokens drive the palette, type scale, spacing, shapes, and components below.";
  const logoUrl: string | undefined = kit.logoUrl;

  return React.createElement("div", {
    style: {
      display: "flex", flexDirection: "column", gap: 16, paddingBottom: 28,
      borderBottom: "1px solid " + props.border
    }
  },
    logoUrl ? React.createElement("img", {
      src: logoUrl,
      alt: name + " logo",
      style: { display: "block", maxHeight: 56, maxWidth: 200, objectFit: "contain", objectPosition: "left" }
    }) : null,
    React.createElement("h1", {
      style: { fontSize: 44, lineHeight: 1.05, fontWeight: props.profile.headingWeight, margin: 0, letterSpacing: "-0.025em", color: props.headingText }
    }, name),
    React.createElement("p", {
      style: { margin: 0, fontSize: 16, lineHeight: 1.6, opacity: 0.7, maxWidth: 640 }
    }, description)
  );
}

function PaletteSection(props: { colours: CssVar[]; bg: string; text: string; accent: string; border: string; surface: string; headingText: string }) {
  const groups: { title: string; match: RegExp }[] = [
    { title: "Backgrounds & surfaces", match: /-(bg|surface|panel|elevated)/ },
    { title: "Text", match: /-(text|fg|foreground|on-)/ },
    { title: "Accent / Brand", match: /-(accent|primary|brand)/ },
    { title: "Borders", match: /-(border|outline|divider)/ },
    { title: "Status", match: /-(success|warning|error|info|danger)/ },
  ];
  const used = new Set<string>();
  const rendered = groups.map((g) => {
    const items = props.colours.filter((v: CssVar) => g.match.test(v.name) && !used.has(v.name));
    items.forEach((v: CssVar) => used.add(v.name));
    if (items.length === 0) return null;
    return React.createElement("div", { key: g.title, style: { display: "flex", flexDirection: "column", gap: 10 } },
      React.createElement("span", {
        style: { fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.5 }
      }, g.title),
      React.createElement("div", {
        style: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }
      },
        ...items.map((v: CssVar) =>
          React.createElement("div", {
            key: v.name,
            style: {
              display: "flex", flexDirection: "column", gap: 6,
              borderRadius: 10, border: "1px solid " + props.border,
              background: props.surface, overflow: "hidden"
            }
          },
            React.createElement("div", { style: { height: 56, background: v.value } }),
            React.createElement("div", { style: { padding: "8px 10px", display: "flex", flexDirection: "column", gap: 2 } },
              React.createElement("span", { style: { fontFamily: "ui-monospace, SFMono-Regular, monospace", fontSize: 11, opacity: 0.85 } }, v.name),
              React.createElement("span", { style: { fontFamily: "ui-monospace, SFMono-Regular, monospace", fontSize: 10, opacity: 0.55 } }, v.value)
            )
          )
        )
      )
    );
  }).filter(Boolean);

  const others = props.colours.filter((v: CssVar) => !used.has(v.name));
  if (others.length > 0) {
    rendered.push(
      React.createElement("div", { key: "other", style: { display: "flex", flexDirection: "column", gap: 10 } },
        React.createElement("span", { style: { fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.5 } }, "Other"),
        React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 } },
          ...others.map((v: CssVar) =>
            React.createElement("div", {
              key: v.name,
              style: { display: "flex", flexDirection: "column", gap: 6, borderRadius: 10, border: "1px solid " + props.border, background: props.surface, overflow: "hidden" }
            },
              React.createElement("div", { style: { height: 56, background: v.value } }),
              React.createElement("div", { style: { padding: "8px 10px", display: "flex", flexDirection: "column", gap: 2 } },
                React.createElement("span", { style: { fontFamily: "ui-monospace, SFMono-Regular, monospace", fontSize: 11, opacity: 0.85 } }, v.name),
                React.createElement("span", { style: { fontFamily: "ui-monospace, SFMono-Regular, monospace", fontSize: 10, opacity: 0.55 } }, v.value)
              )
            )
          )
        )
      )
    );
  }

  return React.createElement("section", { style: { display: "flex", flexDirection: "column", gap: 20 } },
    SectionHeader({ headingText: props.headingText, label: "Colour", title: "Palette", count: props.colours.length }),
    ...rendered
  );
}

function TypographySection(props: { text: string; border: string; surface: string; accent: string; headingText: string; profile: KitStyleProfile }) {
  // Display + heading samples follow the kit's heading weight; body / caption stay regular.
  const hw = props.profile.headingWeight;
  const samples = [
    { label: "Display", size: 48, weight: hw },
    { label: "Heading 1", size: 32, weight: hw },
    { label: "Heading 2", size: 24, weight: Math.max(500, hw - 100) },
    { label: "Body", size: 16, weight: 400 },
    { label: "Caption", size: 12, weight: 400 }
  ];
  return React.createElement("section", { style: { display: "flex", flexDirection: "column", gap: 20 } },
    SectionHeader({ headingText: props.headingText, label: "Typography", title: "Scale" }),
    React.createElement("div", {
      style: { display: "flex", flexDirection: "column", borderRadius: 14, border: "1px solid " + props.border, background: props.surface, overflow: "hidden" }
    },
      ...samples.map((s, i) =>
        React.createElement("div", {
          key: s.label,
          style: {
            display: "flex", alignItems: "baseline", justifyContent: "space-between",
            padding: "18px 20px",
            borderTop: i === 0 ? "none" : "1px solid " + props.border, gap: 24
          }
        },
          React.createElement("span", { style: { fontSize: s.size, fontWeight: s.weight, lineHeight: 1.15 } }, "The quick brown fox"),
          React.createElement("span", { style: { fontSize: 11, fontFamily: "ui-monospace, monospace", opacity: 0.55, whiteSpace: "nowrap" } }, s.label + " · " + s.size + "px / " + s.weight)
        )
      )
    )
  );
}

function SpacingSection(props: { spacing: CssVar[]; text: string; border: string; accent: string; surface: string; headingText: string }) {
  if (props.spacing.length === 0) return null;
  // Spacing bars communicate scale, not brand. Render with a neutral
  // text-derived tint so the eye reads size differences instead of
  // the kit's accent colour repeated 14 times down the column.
  const barFill = withAlpha(props.text, 0.25);
  return React.createElement("section", { style: { display: "flex", flexDirection: "column", gap: 20 } },
    SectionHeader({ headingText: props.headingText, label: "Spacing", title: "Scale", count: props.spacing.length }),
    React.createElement("div", {
      style: { display: "flex", flexDirection: "column", gap: 10, padding: 20, borderRadius: 14, border: "1px solid " + props.border, background: props.surface }
    },
      ...props.spacing.map((v: CssVar) =>
        React.createElement("div", {
          key: v.name, style: { display: "flex", alignItems: "center", gap: 14 }
        },
          React.createElement("span", { style: { fontFamily: "ui-monospace, monospace", fontSize: 11, opacity: 0.6, width: 140, flexShrink: 0 } }, v.name),
          React.createElement("div", { style: { height: 12, background: barFill, borderRadius: 4, width: "var(" + v.name + ")", minWidth: 2 } }),
          React.createElement("span", { style: { fontFamily: "ui-monospace, monospace", fontSize: 11, opacity: 0.55 } }, v.value)
        )
      )
    )
  );
}

function RadiusSection(props: { radii: CssVar[]; text: string; border: string; surface: string; accent: string; headingText: string }) {
  if (props.radii.length === 0) return null;
  const chipFill = withAlpha(props.text, 0.28);
  return React.createElement("section", { style: { display: "flex", flexDirection: "column", gap: 20 } },
    SectionHeader({ headingText: props.headingText, label: "Shape", title: "Radius", count: props.radii.length }),
    React.createElement("div", {
      style: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12 }
    },
      ...props.radii.map((v: CssVar) =>
        React.createElement("div", {
          key: v.name,
          style: { padding: 16, borderRadius: 10, border: "1px solid " + props.border, background: props.surface, display: "flex", flexDirection: "column", gap: 10 }
        },
          React.createElement("div", {
            style: { width: 80, height: 48, background: chipFill, borderRadius: "var(" + v.name + ")" }
          }),
          React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 2 } },
            React.createElement("span", { style: { fontFamily: "ui-monospace, monospace", fontSize: 11, opacity: 0.85 } }, v.name),
            React.createElement("span", { style: { fontFamily: "ui-monospace, monospace", fontSize: 10, opacity: 0.5 } }, v.value)
          )
        )
      )
    )
  );
}

function ShadowSection(props: { shadows: CssVar[]; surface: string; text: string; border: string; headingText: string }) {
  if (props.shadows.length === 0) return null;
  return React.createElement("section", { style: { display: "flex", flexDirection: "column", gap: 20 } },
    SectionHeader({ headingText: props.headingText, label: "Depth", title: "Elevation", count: props.shadows.length }),
    React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 } },
      ...props.shadows.map((v: CssVar) =>
        React.createElement("div", {
          key: v.name,
          style: { padding: 20, borderRadius: 12, background: props.surface, boxShadow: "var(" + v.name + ")" }
        },
          React.createElement("span", { style: { fontFamily: "ui-monospace, monospace", fontSize: 11, opacity: 0.7 } }, v.name)
        )
      )
    )
  );
}

function ComponentsSection(props: { bg: string; text: string; accent: string; border: string; surface: string; headingText: string; radii: KitRadii; profile: KitStyleProfile }) {
  // onAccent: profile wins (brand may want off-white or a specific tone),
  // fall back to luminance-derived if profile colours absent.
  const onAccent = props.profile.colours?.onAccent || onColour(props.accent);
  const blockProps = { bg: props.bg, text: props.text, accent: props.accent, border: props.border, surface: props.surface, onAccent: onAccent, radii: props.radii, profile: props.profile };
  const sectionGap = props.profile.density === "compact" ? 22 : props.profile.density === "airy" ? 36 : 28;
  return React.createElement("section", { style: { display: "flex", flexDirection: "column", gap: 20 } },
    SectionHeader({ headingText: props.headingText, label: "Samples", title: "Components" }),
    React.createElement("div", {
      style: { padding: props.profile.density === "compact" ? 22 : props.profile.density === "airy" ? 36 : 28, borderRadius: props.profile.card.radius, border: "1px solid " + props.border, background: props.surface, display: "flex", flexDirection: "column", gap: sectionGap }
    },
      ButtonsBlock(blockProps),
      InputsBlock(blockProps),
      FormStatesRow(blockProps),
      // ControlsBlock and TabsBlock use useState — they must be rendered
      // via React.createElement (not called as plain functions) so React
      // tracks their hooks in their own component scope. Otherwise their
      // useState calls execute inside App's render frame, which means
      // App's hook count differs across renders (early return when vars
      // is null vs full render afterwards) → React error #310.
      React.createElement(ControlsBlock, blockProps),
      StatusBadgesBlock(blockProps),
      React.createElement(TabsBlock, blockProps),
      AvatarsBlock(blockProps),
      ProgressBlock(blockProps),
      AlertBlock(blockProps),
      StatTilesRow(blockProps),
      CardBlock(blockProps),
      DataTablePreview(blockProps)
    )
  );
}

function Subhead(text: string) {
  return React.createElement("span", {
    style: { fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em", opacity: 0.55, fontWeight: 500 }
  }, text);
}

function ButtonsBlock(p: { text: string; accent: string; border: string; onAccent: string; radii: KitRadii; profile: KitStyleProfile }) {
  // Profile-driven: radius, padding, weight, fillStyle all come from the
  // kit's derived style profile. Falls back to KitRadii when the profile
  // string is missing (defensive — parseStyleProfile guarantees it isn't).
  const r = p.profile.button.radius || p.radii.lg;
  const fw = p.profile.button.weight;
  const pad = p.profile.button.padding;
  const fill = p.profile.button.fillStyle;
  // primaryShadow: profile-prescribed CSS string wins. Fall back to a
  // generated accent-tinted shadow when fillStyle === "shadowed" but no
  // explicit string was given.
  const primaryShadow =
    p.profile.button.primaryShadow ??
    (fill === "shadowed" ? "0 1px 2px rgba(0,0,0,0.08), 0 4px 12px " + withAlpha(p.accent, 0.25) : undefined);
  const primaryBg =
    fill === "subtle" ? withAlpha(p.accent, 0.14)
    : fill === "outlined-emphasis" ? "transparent"
    : p.accent;
  const primaryColor =
    fill === "subtle" ? p.accent
    : fill === "outlined-emphasis" ? p.accent
    : p.onAccent;
  const primaryBorder = fill === "outlined-emphasis" ? "2px solid " + p.accent : "none";

  const btn = (label: string, variant: "primary" | "secondary" | "ghost" | "disabled", size: "sm" | "md" = "md") => {
    const padding = size === "sm" ? "6px 12px" : pad;
    const fontSize = size === "sm" ? 12 : 14;
    const baseTransition = { transition: "filter 120ms ease, background 120ms ease, box-shadow 120ms ease" };
    if (variant === "primary") return React.createElement("button", {
      "data-showcase-btn": "true", "data-variant": "primary",
      style: { ...baseTransition, background: primaryBg, color: primaryColor, border: primaryBorder, padding, borderRadius: r, fontSize, fontWeight: fw, cursor: "pointer", boxShadow: primaryShadow }
    }, label);
    if (variant === "secondary") {
      const sec = p.profile.button.secondaryStyle;
      const secBg = sec === "filled-light" ? withAlpha(p.text, 0.06) : "transparent";
      const secBorder = sec === "ghost" ? "none" : "1px solid " + p.border;
      return React.createElement("button", {
        "data-showcase-btn": "true", "data-variant": "secondary",
        style: { ...baseTransition, background: secBg, color: p.text, border: secBorder, padding, borderRadius: r, fontSize, fontWeight: fw, cursor: "pointer" }
      }, label);
    }
    if (variant === "ghost") return React.createElement("button", {
      "data-showcase-btn": "true", "data-variant": "ghost",
      style: { ...baseTransition, background: "transparent", color: p.text, border: "none", padding, borderRadius: r, fontSize, fontWeight: fw, cursor: "pointer", opacity: 0.7 }
    }, label);
    return React.createElement("button", {
      "data-showcase-btn": "true", "data-variant": "disabled",
      disabled: true,
      style: { background: primaryBg, color: primaryColor, border: "none", padding, borderRadius: r, fontSize, fontWeight: fw, opacity: 0.4 }
    }, label);
  };
  return React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 12 } },
    Subhead("Buttons"),
    React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" } },
      btn("Primary", "primary"),
      btn("Secondary", "secondary"),
      btn("Ghost", "ghost"),
      btn("Disabled", "disabled")
    ),
    React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" } },
      btn("Small", "primary", "sm"),
      btn("Small", "secondary", "sm"),
      React.createElement("button", {
        "data-showcase-btn": "true", "data-variant": "primary",
        style: { background: p.accent, color: p.onAccent, border: "none", width: 32, height: 32, borderRadius: p.radii.pill, fontSize: 16, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", transition: "filter 120ms ease" }
      }, "+")
    )
  );
}

function SearchIcon(props: { size?: number; opacity?: number }) {
  const size = props.size ?? 16;
  return React.createElement("svg", {
    width: size, height: size, viewBox: "0 0 24 24", fill: "none",
    stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round",
    style: { opacity: props.opacity ?? 0.6, flexShrink: 0 },
    "aria-hidden": true
  },
    React.createElement("circle", { cx: 11, cy: 11, r: 8 }),
    React.createElement("line", { x1: 21, y1: 21, x2: 16.65, y2: 16.65 })
  );
}

function ChevronDown(props: { size?: number; opacity?: number }) {
  const size = props.size ?? 16;
  return React.createElement("svg", {
    width: size, height: size, viewBox: "0 0 24 24", fill: "none",
    stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round",
    style: { opacity: props.opacity ?? 0.7, flexShrink: 0 },
    "aria-hidden": true
  },
    React.createElement("polyline", { points: "6 9 12 15 18 9" })
  );
}

function InputsBlock(p: { bg: string; text: string; accent: string; border: string; radii: KitRadii; profile: KitStyleProfile }) {
  const ir = p.profile.input.radius || p.radii.md;
  const bw = p.profile.input.borderWidth;
  const baseStyle = { padding: "10px 14px", borderRadius: ir, border: bw + "px solid " + p.border, background: p.bg, color: p.text, fontSize: 14, outline: "none", width: "100%" } as const;
  return React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 12 } },
    Subhead("Inputs"),
    React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 } },
      // Search with leading icon
      React.createElement("div", {
        style: { position: "relative", display: "flex", alignItems: "center" }
      },
        React.createElement("span", {
          style: { position: "absolute", left: 14, display: "inline-flex", color: p.text, pointerEvents: "none" }
        }, SearchIcon({ size: 16, opacity: 0.55 })),
        React.createElement("input", { placeholder: "Search…", style: { ...baseStyle, paddingLeft: 40 } })
      ),
      // Prefixed
      React.createElement("div", {
        style: { display: "flex", alignItems: "stretch", borderRadius: ir, border: bw + "px solid " + p.border, overflow: "hidden", background: p.bg }
      },
        React.createElement("span", {
          style: { padding: "10px 12px", fontSize: 14, opacity: 0.6, borderRight: "1px solid " + p.border }
        }, "@"),
        React.createElement("input", { placeholder: "username", style: { border: "none", outline: "none", padding: "10px 14px", background: "transparent", color: p.text, fontSize: 14, flex: 1 } })
      ),
      // Select
      React.createElement("div", { style: { position: "relative", display: "flex", alignItems: "center" } },
        React.createElement("select", {
          style: { ...baseStyle, appearance: "none", paddingRight: 40 }
        },
          React.createElement("option", null, "United Kingdom"),
          React.createElement("option", null, "United States"),
          React.createElement("option", null, "Germany")
        ),
        React.createElement("span", {
          style: { position: "absolute", right: 14, display: "inline-flex", color: p.text, pointerEvents: "none" }
        }, ChevronDown({ size: 16, opacity: 0.65 }))
      ),
      // Textarea
      React.createElement("textarea", {
        rows: 2, placeholder: "Leave a note…",
        style: { ...baseStyle, resize: "none", fontFamily: "inherit", lineHeight: 1.5 }
      })
    )
  );
}

function FormStatesRow(p: { bg: string; text: string; accent: string; border: string; radii: KitRadii; profile: KitStyleProfile }) {
  const ir = p.profile.input.radius || p.radii.md;
  const bw = p.profile.input.borderWidth;
  const useRing = p.profile.input.focusStyle === "ring";
  const inputBase = { padding: "10px 14px", borderRadius: ir, background: p.bg, color: p.text, fontSize: 14, outline: "none", flex: "1 1 200px" };
  // "ring" = accent ring on focus (Stripe-style). "border" = just border colour shifts (Linear, Apple).
  const focusedStyle = useRing
    ? { ...inputBase, border: bw + "px solid " + p.accent, boxShadow: "0 0 0 3px " + withAlpha(p.accent, 0.18) }
    : { ...inputBase, border: (bw + 0.5) + "px solid " + p.accent };
  return React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 12 } },
    Subhead("Field states"),
    React.createElement("div", { style: { display: "flex", gap: 12, flexWrap: "wrap" } },
      React.createElement("input", { defaultValue: "Default", style: { ...inputBase, border: bw + "px solid " + p.border } }),
      React.createElement("input", { defaultValue: "Focused", style: focusedStyle }),
      React.createElement("input", { defaultValue: "Error", style: { ...inputBase, border: bw + "px solid #e54d2e", color: "#e54d2e" } })
    )
  );
}

function ControlsBlock(p: { text: string; accent: string; border: string; bg: string; onAccent: string; radii: KitRadii; profile: KitStyleProfile }) {
  const [toggle1, setToggle1] = React.useState(true);
  const [toggle2, setToggle2] = React.useState(false);
  const [check1, setCheck1] = React.useState(true);
  const [check2, setCheck2] = React.useState(false);
  const [radio, setRadio] = React.useState<"monthly" | "annual">("monthly");

  const toggleEl = (on: boolean, onClick: () => void) =>
    React.createElement("button", {
      "data-showcase-toggle": "true",
      onClick,
      style: {
        width: 36, height: 22, borderRadius: 999,
        background: on ? p.accent : withAlpha(p.text, 0.16),
        position: "relative", display: "inline-block",
        border: "none", padding: 0,
        transition: "background 150ms ease"
      }
    },
      React.createElement("span", {
        style: {
          position: "absolute", top: 2, left: on ? 16 : 2,
          width: 18, height: 18, borderRadius: "50%", background: "#fff",
          transition: "left 150ms ease",
          boxShadow: "0 1px 2px rgba(0,0,0,0.15)"
        }
      })
    );

  const checkEl = (checked: boolean, onClick: () => void) =>
    React.createElement("button", {
      "data-showcase-checkbox": "true",
      onClick,
      style: {
        width: 18, height: 18, borderRadius: p.radii.sm,
        background: checked ? p.accent : "transparent",
        color: p.onAccent,
        border: checked ? "1.5px solid " + p.accent : "1.5px solid " + p.border,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        fontSize: 12, fontWeight: 700,
        padding: 0,
        transition: "background 150ms ease, border-color 150ms ease"
      }
    }, checked ? "✓" : "");

  const radioEl = (selected: boolean, onClick: () => void) =>
    React.createElement("button", {
      "data-showcase-radio": "true",
      onClick,
      style: {
        width: 18, height: 18, borderRadius: "50%",
        border: "1.5px solid " + (selected ? p.accent : p.border),
        background: "transparent",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        padding: 0,
        transition: "border-color 150ms ease"
      }
    },
      selected ? React.createElement("span", { style: { width: 9, height: 9, borderRadius: "50%", background: p.accent } }) : null
    );

  return React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 12 } },
    Subhead("Controls"),
    React.createElement("div", { style: { display: "flex", gap: 24, flexWrap: "wrap", alignItems: "center" } },
      React.createElement("div", { style: { display: "flex", gap: 12, alignItems: "center" } },
        toggleEl(toggle1, () => setToggle1((v) => !v)),
        toggleEl(toggle2, () => setToggle2((v) => !v))
      ),
      React.createElement("div", { style: { display: "flex", gap: 10, alignItems: "center", fontSize: 13 } },
        checkEl(check1, () => setCheck1((v) => !v)),
        React.createElement("span", null, "Notifications"),
        checkEl(check2, () => setCheck2((v) => !v)),
        React.createElement("span", { style: { opacity: 0.7 } }, "Marketing")
      ),
      React.createElement("div", { style: { display: "flex", gap: 10, alignItems: "center", fontSize: 13 } },
        radioEl(radio === "monthly", () => setRadio("monthly")),
        React.createElement("span", null, "Monthly"),
        radioEl(radio === "annual", () => setRadio("annual")),
        React.createElement("span", { style: { opacity: radio === "annual" ? 1 : 0.7 } }, "Annual")
      )
    )
  );
}

function StatusBadgesBlock(p: { text: string; accent: string; border: string; radii: KitRadii; profile: KitStyleProfile }) {
  const badgeRadius = p.profile.badge.shape === "pill" ? p.radii.pill : p.profile.badge.shape === "rounded" ? p.radii.sm : "0px";
  const fw = p.profile.badge.weight;
  // Status colours read from the profile so each kit gets its own brand
  // success/warning/error/info — Figma's #14ae5c green vs Apple's #34c759
  // vs IBM's #198038 etc. Falls back to the v2 defaults when absent.
  const c = p.profile.colours;
  const pill = (label: string, fill: string, color: string, dot?: string) =>
    React.createElement("span", {
      style: { padding: "4px 10px", borderRadius: badgeRadius, background: fill, color, fontSize: 12, fontWeight: fw, display: "inline-flex", alignItems: "center", gap: 6 }
    },
      dot ? React.createElement("span", { style: { width: 6, height: 6, borderRadius: "50%", background: dot, display: "inline-block" } }) : null,
      label
    );
  return React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 12 } },
    Subhead("Status badges"),
    React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 8 } },
      pill("Default", withAlpha(p.accent, 0.18), p.accent, p.accent),
      pill("Success", withAlpha(c.success, 0.18), c.success, c.success),
      pill("Warning", withAlpha(c.warning, 0.18), c.warning, c.warning),
      pill("Error",   withAlpha(c.error,   0.18), c.error,   c.error),
      pill("Info",    withAlpha(c.info,    0.18), c.info,    c.info),
      React.createElement("span", {
        style: { padding: "4px 10px", borderRadius: badgeRadius, border: "1px solid " + p.border, color: p.text, fontSize: 12, fontWeight: fw }
      }, "Draft")
    )
  );
}

function TabsBlock(p: { text: string; accent: string; border: string; onAccent: string; radii: KitRadii; profile: KitStyleProfile }) {
  const tabLabels = ["Overview", "Activity", "Settings", "Members"];
  const segLabels = ["Day", "Week", "Month"];
  const [activeTab, setActiveTab] = React.useState(0);
  const [activeSeg, setActiveSeg] = React.useState(1);
  const indicator = p.profile.tab.indicator;
  // Different active-tab treatments:
  //   underline = bottom border accent (Linear, Stripe, Notion)
  //   pill      = active tab gets a pill background (Apple Music)
  //   filled    = active tab gets full accent fill
  //   subtle    = no border, just bold + colour shift
  const tabStyle = (active: boolean) => {
    const base: any = {
      padding: "10px 14px",
      fontSize: 13,
      fontWeight: active ? 600 : 400,
      color: active ? p.accent : p.text,
      opacity: active ? 1 : 0.7,
      background: "transparent",
      cursor: "pointer",
      transition: "color 120ms ease, opacity 120ms ease, border-color 120ms ease, background 120ms ease",
      border: "none",
    };
    if (indicator === "underline") {
      base.borderBottom = active ? "2px solid " + p.accent : "2px solid transparent";
      base.marginBottom = -1;
    } else if (indicator === "pill") {
      if (active) {
        base.background = withAlpha(p.accent, 0.14);
        base.color = p.accent;
        base.borderRadius = p.radii.pill;
      }
    } else if (indicator === "filled") {
      if (active) {
        base.background = p.accent;
        base.color = p.onAccent;
        base.borderRadius = p.profile.button.radius;
      }
    }
    // subtle = no decoration; weight + colour already shifted above
    return base;
  };
  const tabsContainer = indicator === "underline"
    ? { display: "flex", borderBottom: "1px solid " + p.border, gap: 4 }
    : { display: "flex", gap: 4 };
  return React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 12 } },
    Subhead("Navigation"),
    React.createElement("div", { style: tabsContainer },
      ...tabLabels.map((label: string, i: number) => {
        const active = i === activeTab;
        return React.createElement("button", {
          key: label,
          "data-showcase-tab": "true",
          onClick: () => setActiveTab(i),
          style: tabStyle(active)
        }, label);
      })
    ),
    // Segmented control
    React.createElement("div", {
      style: { display: "inline-flex", padding: 4, borderRadius: p.radii.md, background: withAlpha(p.text, 0.06), gap: 2, alignSelf: "flex-start" }
    },
      ...segLabels.map((label: string, i: number) => {
        const active = i === activeSeg;
        return React.createElement("button", {
          key: label,
          "data-showcase-segment": "true",
          onClick: () => setActiveSeg(i),
          style: {
            padding: "6px 14px",
            borderRadius: p.radii.sm,
            fontSize: 12,
            fontWeight: 500,
            background: active ? p.accent : "transparent",
            color: active ? p.onAccent : p.text,
            border: "none",
            cursor: "pointer",
            transition: "background 150ms ease, color 150ms ease"
          }
        }, label);
      })
    )
  );
}

function AvatarsBlock(p: { text: string; accent: string; border: string; bg: string; radii: KitRadii; profile: KitStyleProfile }) {
  const initials = ["AS", "RK", "MJ", "EL", "TP"];
  const palette = [p.accent, "#2ea043", "#d49a15", "#2383e2", "#9d4edd"];
  return React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 12 } },
    Subhead("People"),
    React.createElement("div", { style: { display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" } },
      // Avatar group
      React.createElement("div", { style: { display: "flex", alignItems: "center" } },
        ...initials.map((init: string, i: number) =>
          React.createElement("span", {
            key: init,
            style: { width: 32, height: 32, borderRadius: "50%", background: palette[i % palette.length], color: "#fff", fontSize: 12, fontWeight: 600, display: "inline-flex", alignItems: "center", justifyContent: "center", border: "2px solid " + p.bg, marginLeft: i === 0 ? 0 : -10 }
          }, init)
        ),
        React.createElement("span", {
          style: { width: 32, height: 32, borderRadius: "50%", background: withAlpha(p.text, 0.1), color: p.text, fontSize: 12, fontWeight: 600, display: "inline-flex", alignItems: "center", justifyContent: "center", border: "2px solid " + p.bg, marginLeft: -10 }
        }, "+12")
      ),
      // Single avatar with status dot
      React.createElement("div", { style: { position: "relative", display: "inline-block" } },
        React.createElement("span", {
          style: { width: 40, height: 40, borderRadius: "50%", background: p.accent, color: "#fff", fontSize: 14, fontWeight: 600, display: "inline-flex", alignItems: "center", justifyContent: "center" }
        }, "AS"),
        React.createElement("span", {
          style: { position: "absolute", right: -2, bottom: -2, width: 12, height: 12, borderRadius: "50%", background: "#2ea043", border: "2px solid " + p.bg }
        })
      ),
      // Mini list-item
      React.createElement("div", {
        style: { display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: p.radii.md, border: "1px solid " + p.border }
      },
        React.createElement("span", { style: { width: 28, height: 28, borderRadius: "50%", background: palette[0], color: "#fff", fontSize: 11, fontWeight: 600, display: "inline-flex", alignItems: "center", justifyContent: "center" } }, "AS"),
        React.createElement("span", { style: { display: "flex", flexDirection: "column" } },
          React.createElement("span", { style: { fontSize: 13, fontWeight: 500 } }, "Avery Sloan"),
          React.createElement("span", { style: { fontSize: 11, opacity: 0.6 } }, "Owner · 2m ago")
        )
      )
    )
  );
}

function ProgressBlock(p: { text: string; accent: string; border: string; bg: string; radii: KitRadii; profile: KitStyleProfile }) {
  return React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 12 } },
    Subhead("Progress"),
    React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 14, maxWidth: 480 } },
      // Progress bar with label
      React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 6 } },
        React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 12 } },
          React.createElement("span", null, "Migration"),
          React.createElement("span", { style: { opacity: 0.7, fontFamily: "ui-monospace, monospace" } }, "64%")
        ),
        React.createElement("div", { style: { height: 8, borderRadius: p.radii.pill, background: withAlpha(p.text, 0.1), overflow: "hidden" } },
          React.createElement("div", { style: { width: "64%", height: "100%", background: p.accent, borderRadius: p.radii.pill } })
        )
      ),
      // Skeleton lines
      React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8 } },
        React.createElement("div", { style: { height: 10, width: "70%", borderRadius: p.radii.sm, background: withAlpha(p.text, 0.08) } }),
        React.createElement("div", { style: { height: 10, width: "92%", borderRadius: p.radii.sm, background: withAlpha(p.text, 0.08) } }),
        React.createElement("div", { style: { height: 10, width: "48%", borderRadius: p.radii.sm, background: withAlpha(p.text, 0.08) } })
      )
    )
  );
}

function AlertBlock(p: { text: string; accent: string; border: string; onAccent: string; radii: KitRadii; profile: KitStyleProfile }) {
  return React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 12 } },
    Subhead("Alert"),
    React.createElement("div", {
      style: { display: "flex", gap: 12, alignItems: "flex-start", padding: "14px 16px", borderRadius: p.radii.md, background: withAlpha(p.accent, 0.1), border: "1px solid " + withAlpha(p.accent, 0.3) }
    },
      React.createElement("span", {
        style: { flexShrink: 0, width: 22, height: 22, borderRadius: "50%", background: p.accent, color: p.onAccent, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }
      }, "i"),
      React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 2, flex: 1 } },
        React.createElement("span", { style: { fontSize: 13, fontWeight: 600 } }, "Heads up"),
        React.createElement("span", { style: { fontSize: 13, opacity: 0.8, lineHeight: 1.45 } },
          "We've published your kit to the public gallery. Visitors can now import the design tokens directly into their AI coding agents."
        )
      ),
      React.createElement("button", {
        "data-showcase-btn": "true", "data-variant": "secondary",
        style: { background: "transparent", color: p.text, border: "1px solid " + withAlpha(p.accent, 0.3), padding: "6px 12px", borderRadius: p.radii.md, fontSize: 12, cursor: "pointer", flexShrink: 0 }
      }, "View")
    )
  );
}

function CardBlock(p: { bg: string; text: string; accent: string; border: string; onAccent: string; radii: KitRadii; profile: KitStyleProfile }) {
  const cr = p.profile.card.radius || p.radii.lg;
  const cp = p.profile.card.padding;
  const elev = p.profile.card.elevation;
  // soft = border, no shadow (Linear, Stripe). shadow = both. elevated = shadow only.
  const cardBorder = elev === "elevated" ? "none" : "1px solid " + p.border;
  const cardShadow = elev === "soft" ? undefined : (elev === "elevated" ? "0 8px 24px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.05)" : "0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)");
  return React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 12 } },
    Subhead("Card"),
    React.createElement("div", {
      "data-showcase-card": "true",
      style: { padding: cp, borderRadius: cr, border: cardBorder, background: p.bg, display: "flex", flexDirection: "column", gap: 12, maxWidth: 480, boxShadow: cardShadow }
    },
      React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10 } },
        React.createElement("span", { style: { width: 32, height: 32, borderRadius: p.radii.sm, background: p.accent } }),
        React.createElement("div", { style: { display: "flex", flexDirection: "column" } },
          React.createElement("span", { style: { fontSize: 15, fontWeight: 500 } }, "Q3 product roadmap"),
          React.createElement("span", { style: { fontSize: 12, opacity: 0.6 } }, "Updated 2 hours ago")
        )
      ),
      React.createElement("p", { style: { margin: 0, fontSize: 14, lineHeight: 1.5, opacity: 0.75 } },
        "Quarterly goals, feature priorities, and team assignments for the next release cycle. Each section pulls directly from the kit's tokens."
      ),
      React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } },
        React.createElement("span", {
          style: { padding: "4px 10px", borderRadius: p.profile.badge.shape === "pill" ? p.radii.pill : p.profile.badge.shape === "rounded" ? p.radii.sm : "0px", background: withAlpha(p.accent, 0.18), color: p.accent, fontSize: 12, fontWeight: p.profile.badge.weight }
        }, "In progress"),
        React.createElement("div", { style: { display: "flex", gap: 8 } },
          React.createElement("button", {
            "data-showcase-btn": "true", "data-variant": "primary",
            style: { background: p.accent, color: p.onAccent, border: "none", padding: "6px 14px", borderRadius: p.profile.button.radius, fontSize: 12, fontWeight: p.profile.button.weight, cursor: "pointer", transition: "filter 120ms ease" }
          }, "View"),
          React.createElement("button", {
            "data-showcase-btn": "true", "data-variant": "secondary",
            style: { background: "transparent", color: p.text, border: "1px solid " + p.border, padding: "6px 14px", borderRadius: p.profile.button.radius, fontSize: 12, cursor: "pointer", transition: "filter 120ms ease, background 120ms ease" }
          }, "Share")
        )
      )
    )
  );
}

function StatTilesRow(props: { bg: string; text: string; accent: string; border: string; surface: string; radii: KitRadii; profile: KitStyleProfile }) {
  const tiles = [
    { label: "Active users", value: "12,408", delta: "+8.2%", positive: true },
    { label: "Conversion", value: "4.6%", delta: "+0.4 pp", positive: true },
    { label: "Avg. response", value: "184ms", delta: "-12ms", positive: true }
  ];
  return React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 } },
    ...tiles.map((t) =>
      React.createElement("div", {
        key: t.label,
        style: { padding: 16, borderRadius: props.radii.md, border: "1px solid " + props.border, background: props.bg, display: "flex", flexDirection: "column", gap: 6 }
      },
        React.createElement("span", { style: { fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", opacity: 0.6 } }, t.label),
        React.createElement("span", { style: { fontSize: 24, fontWeight: 600, lineHeight: 1.1, letterSpacing: "-0.01em" } }, t.value),
        React.createElement("span", { style: { fontSize: 12, color: props.accent, opacity: 0.85 } }, t.delta)
      )
    )
  );
}

function DataTablePreview(props: { bg: string; text: string; accent: string; border: string; surface: string; radii: KitRadii; profile: KitStyleProfile }) {
  const rows = [
    { id: "INC-204", name: "Render pipeline", status: "Open", updated: "2h ago" },
    { id: "INC-198", name: "Auth retry loop", status: "Triaged", updated: "5h ago" },
    { id: "INC-191", name: "Webhook latency", status: "Resolved", updated: "1d ago" }
  ];
  const statusBg = (s: string) => s === "Open" ? withAlpha(props.accent, 0.18) : s === "Triaged" ? withAlpha(props.text, 0.12) : withAlpha(props.text, 0.06);
  const statusColor = (s: string) => s === "Open" ? props.accent : props.text;
  return React.createElement("div", {
    style: { borderRadius: props.radii.md, border: "1px solid " + props.border, background: props.bg, overflow: "hidden" }
  },
    React.createElement("div", {
      style: { display: "grid", gridTemplateColumns: "100px 1fr 110px 110px", gap: 12, padding: "10px 16px", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", opacity: 0.55, borderBottom: "1px solid " + props.border, fontFamily: "ui-monospace, monospace" }
    },
      React.createElement("span", null, "ID"),
      React.createElement("span", null, "Name"),
      React.createElement("span", null, "Status"),
      React.createElement("span", null, "Updated")
    ),
    ...rows.map((r, i) =>
      React.createElement("div", {
        key: r.id,
        style: { display: "grid", gridTemplateColumns: "100px 1fr 110px 110px", gap: 12, padding: "12px 16px", alignItems: "center", borderBottom: i === rows.length - 1 ? "none" : "1px solid " + props.border, fontSize: 13 }
      },
        React.createElement("span", { style: { fontFamily: "ui-monospace, monospace", opacity: 0.7 } }, r.id),
        React.createElement("span", null, r.name),
        React.createElement("span", null,
          React.createElement("span", {
            style: { padding: "2px 10px", borderRadius: props.radii.pill, background: statusBg(r.status), color: statusColor(r.status), fontSize: 11, fontWeight: 500 }
          }, r.status)
        ),
        React.createElement("span", { style: { opacity: 0.6, fontSize: 12 } }, r.updated)
      )
    )
  );
}

export default App;
`;
