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
  }, []);

  if (!vars) return React.createElement("div", { style: { padding: 24, color: "#999" } }, "Loading…");

  const buckets: Record<Category, CssVar[]> = {
    color: [], space: [], radius: [], shadow: [], font: [], other: []
  };
  for (const v of vars) buckets[categorise(v)].push(v);

  const bg = pickBg(buckets.color);
  const text = pickText(buckets.color, bg);
  const accent = pickAccent(buckets.color);
  const surface = pickSurface(buckets.color, bg);
  const border = pickBorder(buckets.color);

  const fontFamily = buckets.font.find((v: CssVar) => /family|sans|serif/.test(v.name))?.value || "system-ui, sans-serif";

  return React.createElement("div", {
    style: {
      minHeight: "100vh",
      background: bg,
      color: text,
      fontFamily,
      padding: "32px 40px",
      display: "flex",
      flexDirection: "column",
      gap: 48,
    }
  },
    Hero({ accent, border, surface, text }),
    PaletteSection({ colours: buckets.color, bg, text, accent, border, surface }),
    TypographySection({ text, border, surface, accent }),
    SpacingSection({ spacing: sortSpacing(buckets.space), text, border, accent, surface }),
    RadiusSection({ radii: buckets.radius, text, border, surface, accent }),
    ShadowSection({ shadows: buckets.shadow, surface, text, border }),
    ComponentsSection({ bg, text, accent, border, surface })
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
  return findByPattern(colours, [/-accent$/, /-primary$/, /-brand$/]) || "#5E6AD2";
}
function pickSurface(colours: CssVar[], bg: string): string {
  const order = ["--bg-surface", "--color-bg-surface", "--color-surface", "--mkt-surface"];
  for (const name of order) {
    const c = colours.find((v: CssVar) => v.name === name);
    if (c && isColour(c.value)) return c.value;
  }
  return findByPattern(colours, [/-bg-surface$/, /-bg-elevated$/, /-surface$/]) || bg;
}
function pickBorder(colours: CssVar[]): string {
  const order = ["--studio-border", "--color-border", "--mkt-border", "--border"];
  for (const name of order) {
    const c = colours.find((v: CssVar) => v.name === name);
    if (c && isColour(c.value)) return c.value;
  }
  return findByPattern(colours, [/-border$/, /-border-/]) || "rgba(0,0,0,0.12)";
}

function SectionHeader(props: { label: string; title: string; count?: number }) {
  return React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 6 } },
    React.createElement("span", {
      style: { fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em", opacity: 0.55 }
    }, props.label + (props.count !== undefined ? " · " + props.count : "")),
    React.createElement("h2", {
      style: { fontSize: 28, lineHeight: 1.2, fontWeight: 500, margin: 0, letterSpacing: "-0.02em" }
    }, props.title)
  );
}

function Hero(props: { accent: string; border: string; surface: string; text: string }) {
  return React.createElement("div", {
    style: {
      display: "flex", flexDirection: "column", gap: 10, paddingBottom: 28,
      borderBottom: "1px solid " + props.border
    }
  },
    React.createElement("h1", {
      style: { fontSize: 44, lineHeight: 1.05, fontWeight: 500, margin: 0, letterSpacing: "-0.025em" }
    }, "Your design system, rendered live"),
    React.createElement("p", {
      style: { margin: 0, fontSize: 15, lineHeight: 1.6, opacity: 0.7, maxWidth: 560 }
    }, "Every kit in the Gallery renders through the same template so comparisons stay fair. Tokens drive the palette, type scale, spacing, shapes, and components below.")
  );
}

function PaletteSection(props: { colours: CssVar[]; bg: string; text: string; accent: string; border: string; surface: string }) {
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
    SectionHeader({ label: "Colour", title: "Palette", count: props.colours.length }),
    ...rendered
  );
}

function TypographySection(props: { text: string; border: string; surface: string; accent: string }) {
  const samples = [
    { label: "Display", size: 48, weight: 500 },
    { label: "Heading 1", size: 32, weight: 500 },
    { label: "Heading 2", size: 24, weight: 500 },
    { label: "Body", size: 16, weight: 400 },
    { label: "Caption", size: 12, weight: 400 }
  ];
  return React.createElement("section", { style: { display: "flex", flexDirection: "column", gap: 20 } },
    SectionHeader({ label: "Typography", title: "Scale" }),
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

function SpacingSection(props: { spacing: CssVar[]; text: string; border: string; accent: string; surface: string }) {
  if (props.spacing.length === 0) return null;
  return React.createElement("section", { style: { display: "flex", flexDirection: "column", gap: 20 } },
    SectionHeader({ label: "Spacing", title: "Scale", count: props.spacing.length }),
    React.createElement("div", {
      style: { display: "flex", flexDirection: "column", gap: 10, padding: 20, borderRadius: 14, border: "1px solid " + props.border, background: props.surface }
    },
      ...props.spacing.map((v: CssVar) =>
        React.createElement("div", {
          key: v.name, style: { display: "flex", alignItems: "center", gap: 14 }
        },
          React.createElement("span", { style: { fontFamily: "ui-monospace, monospace", fontSize: 11, opacity: 0.6, width: 140, flexShrink: 0 } }, v.name),
          React.createElement("div", { style: { height: 12, background: props.accent, borderRadius: 4, width: "var(" + v.name + ")", minWidth: 2 } }),
          React.createElement("span", { style: { fontFamily: "ui-monospace, monospace", fontSize: 11, opacity: 0.55 } }, v.value)
        )
      )
    )
  );
}

function RadiusSection(props: { radii: CssVar[]; text: string; border: string; surface: string; accent: string }) {
  if (props.radii.length === 0) return null;
  return React.createElement("section", { style: { display: "flex", flexDirection: "column", gap: 20 } },
    SectionHeader({ label: "Shape", title: "Radius", count: props.radii.length }),
    React.createElement("div", {
      style: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12 }
    },
      ...props.radii.map((v: CssVar) =>
        React.createElement("div", {
          key: v.name,
          style: { padding: 16, borderRadius: 10, border: "1px solid " + props.border, background: props.surface, display: "flex", flexDirection: "column", gap: 10 }
        },
          React.createElement("div", {
            style: { width: 80, height: 48, background: props.accent, borderRadius: "var(" + v.name + ")" }
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

function ShadowSection(props: { shadows: CssVar[]; surface: string; text: string; border: string }) {
  if (props.shadows.length === 0) return null;
  return React.createElement("section", { style: { display: "flex", flexDirection: "column", gap: 20 } },
    SectionHeader({ label: "Depth", title: "Elevation", count: props.shadows.length }),
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

function ComponentsSection(props: { bg: string; text: string; accent: string; border: string; surface: string }) {
  return React.createElement("section", { style: { display: "flex", flexDirection: "column", gap: 20 } },
    SectionHeader({ label: "Samples", title: "Components" }),
    React.createElement("div", {
      style: { padding: 24, borderRadius: 14, border: "1px solid " + props.border, background: props.surface, display: "flex", flexDirection: "column", gap: 20 }
    },
      React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" } },
        React.createElement("button", {
          style: { background: props.accent, color: "#08090a", border: "none", padding: "10px 18px", borderRadius: 999, fontSize: 14, fontWeight: 500, cursor: "pointer" }
        }, "Primary"),
        React.createElement("button", {
          style: { background: "transparent", color: props.text, border: "1px solid " + props.border, padding: "10px 18px", borderRadius: 999, fontSize: 14, fontWeight: 500, cursor: "pointer" }
        }, "Secondary"),
        React.createElement("button", {
          style: { background: "transparent", color: props.text, border: "none", padding: "10px 18px", borderRadius: 999, fontSize: 14, fontWeight: 500, cursor: "pointer", opacity: 0.7 }
        }, "Ghost"),
        React.createElement("button", {
          disabled: true,
          style: { background: props.accent, color: "#08090a", border: "none", padding: "10px 18px", borderRadius: 999, fontSize: 14, fontWeight: 500, opacity: 0.4 }
        }, "Disabled")
      ),
      React.createElement("div", { style: { display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" } },
        React.createElement("input", {
          placeholder: "Enter your email",
          style: { flex: "1 1 260px", padding: "10px 14px", borderRadius: 10, border: "1px solid " + props.border, background: props.bg, color: props.text, fontSize: 14, outline: "none" }
        }),
        React.createElement("span", {
          style: { padding: "4px 10px", borderRadius: 999, background: props.accent + "22", color: props.accent, fontSize: 12, fontWeight: 500 }
        }, "New"),
        React.createElement("span", {
          style: { padding: "4px 10px", borderRadius: 999, border: "1px solid " + props.border, color: props.text, fontSize: 12 }
        }, "Draft")
      ),
      React.createElement("div", {
        style: { padding: 20, borderRadius: 14, border: "1px solid " + props.border, background: props.bg, display: "flex", flexDirection: "column", gap: 12, maxWidth: 480 }
      },
        React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10 } },
          React.createElement("span", { style: { width: 32, height: 32, borderRadius: 8, background: props.accent } }),
          React.createElement("span", { style: { fontSize: 15, fontWeight: 500 } }, "Card title")
        ),
        React.createElement("p", { style: { margin: 0, fontSize: 14, lineHeight: 1.5, opacity: 0.75 } },
          "Sample card rendered against the kit's tokens. Background, surface, border, accent and text all pulled from the published CSS variables."
        ),
        React.createElement("div", { style: { display: "flex", gap: 8 } },
          React.createElement("button", {
            style: { background: props.accent, color: "#08090a", border: "none", padding: "6px 12px", borderRadius: 999, fontSize: 12, fontWeight: 500, cursor: "pointer" }
          }, "Accept"),
          React.createElement("button", {
            style: { background: "transparent", color: props.text, border: "1px solid " + props.border, padding: "6px 12px", borderRadius: 999, fontSize: 12, cursor: "pointer" }
          }, "Decline")
        )
      )
    )
  );
}

export default App;
`;
