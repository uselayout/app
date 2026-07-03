import type { KitStyleProfile } from "@/lib/types/kit-style-profile";

/**
 * Compiles a gallery kit's style profile into a shadcn registry:theme item,
 * installable with `npx shadcn add https://layout.design/r/<slug>/theme.json`.
 *
 * Emits BOTH variable namespaces so one theme works everywhere:
 *  - shadcn names (--background, --primary, ...) for stock shadcn projects
 *  - --layout-* extensions (success, warning, shadows) for Layout UI projects
 *
 * The same mapping rules as layout-ui/scripts/sync-kit-themes.mjs: fg falls
 * back through headingText -> text, muted text is contrast-guarded against
 * the kit background, and the base radius is capped at 16px so pill-button
 * radii reported by some kits do not wreck menus and cards.
 */

interface RegistryThemeItem {
  $schema: string;
  name: string;
  type: "registry:theme";
  title: string;
  description: string;
  cssVars: {
    theme?: Record<string, string>;
    light?: Record<string, string>;
    dark?: Record<string, string>;
  };
  docs?: string;
}

interface ParsedColour {
  r: number;
  g: number;
  b: number;
  a: number;
}

function parseColour(value: string | undefined): ParsedColour | null {
  if (typeof value !== "string") return null;
  const v = value.trim();
  let m = v.match(/^#([0-9a-f]{3})$/i);
  if (m) {
    const [r, g, b] = m[1].split("").map((c) => parseInt(c + c, 16));
    return { r, g, b, a: 1 };
  }
  m = v.match(/^#([0-9a-f]{6})([0-9a-f]{2})?$/i);
  if (m) {
    const n = parseInt(m[1], 16);
    return {
      r: (n >> 16) & 255,
      g: (n >> 8) & 255,
      b: n & 255,
      a: m[2] ? parseInt(m[2], 16) / 255 : 1,
    };
  }
  m = v.match(
    /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/i,
  );
  if (m) {
    return { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] };
  }
  return null;
}

function luminance(c: ParsedColour): number {
  const chan = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * chan(c.r) + 0.7152 * chan(c.g) + 0.0722 * chan(c.b);
}

/** White or near-black, whichever reads better on the given colour. */
function contrastFg(value: string | undefined): string {
  const c = parseColour(value);
  if (!c) return "#ffffff";
  return luminance(c) > 0.45 ? "#111111" : "#ffffff";
}

function contrastRatio(a: string | undefined, b: string | undefined): number {
  const ca = parseColour(a);
  const cb = parseColour(b);
  if (!ca || !cb) return 1;
  const la = luminance(ca);
  const lb = luminance(cb);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** Guard against kit profiles whose text colour is illegible on their bg. */
function legibleOn(
  bg: string | undefined,
  text: string | undefined,
  fallbackFg: string | undefined,
  alpha: number,
): string | undefined {
  if (text && contrastRatio(bg, text) >= 1.9) return text;
  const fg = parseColour(fallbackFg);
  if (!fg) return text;
  return `rgba(${fg.r}, ${fg.g}, ${fg.b}, ${alpha})`;
}

/** Parse a CSS length, cap at 16px, return px string. */
function normaliseRadius(value: string | undefined): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const m = value.trim().match(/^([\d.]+)(px|rem|em)$/);
  if (!m) return null;
  const px = m[2] === "px" ? parseFloat(m[1]) : parseFloat(m[1]) * 16;
  if (Number.isNaN(px)) return null;
  return `${Math.min(Math.round(px), 16)}px`;
}

export function compileKitTheme(kit: {
  slug: string;
  name: string;
  description?: string;
  styleProfile?: KitStyleProfile;
}): RegistryThemeItem | null {
  const profile = kit.styleProfile;
  const c = profile?.colours;
  if (!profile || !c?.bg || !c.accent) return null;

  const fg = c.headingText ?? c.text;
  const vars: Record<string, string> = {};
  const set = (key: string, value: string | undefined | null) => {
    if (value) vars[key] = value;
  };

  // shadcn namespace
  set("background", c.bg);
  set("foreground", fg);
  set("card", c.surface);
  set("card-foreground", fg);
  set("popover", c.surfaceElevated ?? c.surface);
  set("popover-foreground", fg);
  set("primary", c.accent);
  set("primary-foreground", c.onAccent ?? contrastFg(c.accent));
  set("secondary", c.accentSubtle ?? c.surfaceElevated);
  set("secondary-foreground", c.accentSubtle ? c.accent : fg);
  set("muted", c.surfaceElevated ?? c.surface);
  set("muted-foreground", legibleOn(c.bg, c.textMuted ?? c.text, fg, 0.65));
  set("accent", c.accentSubtle ?? c.surfaceElevated);
  set("accent-foreground", fg);
  set("destructive", c.error);
  set("destructive-foreground", c.error ? contrastFg(c.error) : null);
  set("border", c.border);
  set("input", c.border);
  set("ring", c.borderStrong ?? c.accent);
  set(
    "radius",
    normaliseRadius(profile.card?.radius) ??
      normaliseRadius(profile.button?.radius),
  );

  // --layout-* extensions (Layout UI components consume these directly)
  set("layout-bg", c.bg);
  set("layout-fg", fg);
  set("layout-surface", c.surface);
  set("layout-surface-fg", fg);
  set("layout-overlay", c.surfaceElevated ?? c.surface);
  set("layout-overlay-fg", fg);
  set("layout-primary", c.accent);
  set("layout-primary-fg", c.onAccent ?? contrastFg(c.accent));
  set("layout-secondary", c.accentSubtle ?? c.surfaceElevated);
  set("layout-secondary-fg", c.accentSubtle ? c.accent : fg);
  set("layout-muted", c.surfaceElevated ?? c.surface);
  set("layout-muted-fg", legibleOn(c.bg, c.textMuted ?? c.text, fg, 0.65));
  set("layout-accent", c.accentSubtle ?? c.surfaceElevated);
  set("layout-accent-fg", fg);
  set("layout-danger", c.error);
  set("layout-danger-fg", c.error ? contrastFg(c.error) : null);
  set("layout-success", c.success);
  set("layout-success-fg", c.success ? contrastFg(c.success) : null);
  set("layout-warning", c.warning);
  set("layout-warning-fg", c.warning ? contrastFg(c.warning) : null);
  set("layout-border", c.border);
  set("layout-input", c.border);
  set("layout-ring", c.borderStrong ?? c.accent);
  set(
    "layout-radius",
    normaliseRadius(profile.card?.radius) ??
      normaliseRadius(profile.button?.radius),
  );
  if (profile.button?.primaryShadow) {
    set("layout-shadow-xs", profile.button.primaryShadow);
  }

  const cssVars: RegistryThemeItem["cssVars"] = {
    theme: {
      "color-success": "var(--layout-success)",
      "color-success-foreground": "var(--layout-success-fg)",
      "color-warning": "var(--layout-warning)",
      "color-warning-foreground": "var(--layout-warning-fg)",
    },
    light: vars,
  };
  // Dark-native kits keep their look when the consumer toggles dark mode.
  if (profile.mode === "dark") {
    cssVars.dark = { ...vars };
  }

  return {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name: `${kit.slug}-theme`,
    type: "registry:theme",
    title: `${kit.name} theme`,
    description:
      kit.description ??
      `Design tokens extracted from ${kit.name}, compiled by layout.design.`,
    cssVars,
    docs: `Compiled from the ${kit.name} kit in the layout.design gallery. Pairs with Layout UI components (https://ui.staging.layout.design) and any shadcn project.`,
  };
}
