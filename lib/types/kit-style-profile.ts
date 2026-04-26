/**
 * Kit Style Profile (v2)
 *
 * A structured object Claude derives from a kit's layout.md + tokens.css.
 * It tells the uniform Live Preview EXACTLY which colours, weights,
 * paddings, and treatments to use per kit, so every kit looks like its
 * actual brand while preserving the uniform 12-block structure.
 *
 * v2 added the `colours` block (16 fields) so brand colours never fall
 * back to a generic indigo. v1 profiles still load — `parseStyleProfile`
 * fills missing v2 fields with DEFAULT_STYLE_PROFILE values.
 *
 * Renderer order:
 *   1. profile field if present and valid → use it
 *   2. otherwise fall back to extracted CSS variables via the pickers
 *   3. last resort: DEFAULT_STYLE_PROFILE values
 */

export type Density = "compact" | "comfortable" | "airy";
export type ButtonFill = "filled" | "shadowed" | "subtle" | "outlined-emphasis";
export type ButtonHoverEffect = "brightness" | "shadow-lift" | "bg-shift" | "border-fill";
export type SecondaryButtonStyle = "outline" | "filled-light" | "ghost";
export type FocusStyle = "ring" | "border" | "shadow";
export type CardElevation = "soft" | "shadow" | "elevated";
export type BadgeShape = "pill" | "rounded" | "square";
export type TabIndicator = "underline" | "pill" | "filled" | "subtle";
export type StyleMode = "light" | "dark";

export interface KitStyleColours {
  /** App background. */
  bg: string;
  /** Card / panel surface — slightly different from bg. */
  surface: string;
  /** Hover / popover surface. */
  surfaceElevated: string;
  /** Body text. */
  text: string;
  /** Higher-contrast h1/h2. */
  headingText: string;
  /** Muted captions, labels, secondary copy. */
  textMuted: string;
  /** Brand primary CTA / accent. */
  accent: string;
  /** Hover state for primary buttons (slightly shifted accent). */
  accentHover: string;
  /** Tinted accent for badges, alert backgrounds. */
  accentSubtle: string;
  /** Text/icon colour painted ON accent (NOT auto-derived — brand may want off-white or warm-grey). */
  onAccent: string;
  /** Neutral border / divider. */
  border: string;
  /** Emphasised border (focus, selected, strong dividers). */
  borderStrong: string;
  /** Status colours — use brand's actual palette where defined, else sensible defaults. */
  success: string;
  warning: string;
  error: string;
  info: string;
}

export interface KitStyleType {
  /** h1/h2 weight (400–800). Apple ≈ 500, Linear ≈ 600, IBM ≈ 700. */
  headingWeight: number;
  /** Body weight, usually 400. */
  bodyWeight: number;
  /** Heading letter-spacing (e.g. "-0.02em"). */
  headingTracking: string;
}

export interface KitStyleButton {
  /** Border-radius for buttons (CSS value or var(...)). */
  radius: string;
  /** Font weight 400–700. */
  weight: number;
  /** CSS padding shorthand, e.g. "10px 18px". */
  padding: string;
  /** Visual fill style for primary. */
  fillStyle: ButtonFill;
  /** Drop-shadow CSS for primary. null = no shadow. */
  primaryShadow: string | null;
  /** How the button reacts to hover. */
  hoverEffect: ButtonHoverEffect;
  /** Secondary button treatment. */
  secondaryStyle: SecondaryButtonStyle;
}

export interface KitStyleInput {
  radius: string;
  borderWidth: number;
  focusStyle: FocusStyle;
  /** Input bg — "surface" / "bg" follow the colours block; or a literal CSS value. */
  bg: "surface" | "bg" | string;
}

export interface KitStyleCard {
  radius: string;
  padding: number;
  elevation: CardElevation;
  bg: "surface" | "bg" | string;
}

export interface KitStyleBadge {
  shape: BadgeShape;
  weight: number;
}

export interface KitStyleTab {
  indicator: TabIndicator;
  /** Indicator weight in px (1, 2, 3). Most kits use 2. */
  indicatorWeight: number;
}

export interface KitStyleProfile {
  version: 2;
  mode: StyleMode;
  density: Density;
  colours: KitStyleColours;
  type: KitStyleType;
  button: KitStyleButton;
  input: KitStyleInput;
  card: KitStyleCard;
  badge: KitStyleBadge;
  tab: KitStyleTab;
}

/**
 * Renderer-friendly defaults. Used when no profile exists or fields are
 * invalid. Light-mode neutral palette with safe Stripe-ish accent — tame
 * enough that an unprofiled kit still renders coherently, but never the
 * Linear-indigo we used to hardcode.
 */
export const DEFAULT_STYLE_PROFILE: KitStyleProfile = {
  version: 2,
  mode: "light",
  density: "comfortable",
  colours: {
    bg: "#ffffff",
    surface: "#fafafa",
    surfaceElevated: "#ffffff",
    text: "#1f2228",
    headingText: "#08090a",
    textMuted: "#6b7280",
    accent: "#1f2228",
    accentHover: "#000000",
    accentSubtle: "rgba(31, 34, 40, 0.10)",
    onAccent: "#ffffff",
    border: "rgba(0, 0, 0, 0.10)",
    borderStrong: "rgba(0, 0, 0, 0.20)",
    success: "#2ea043",
    warning: "#d49a15",
    error: "#e54d2e",
    info: "#2383e2",
  },
  type: {
    headingWeight: 700,
    bodyWeight: 400,
    headingTracking: "-0.025em",
  },
  button: {
    radius: "var(--radius-lg, 10px)",
    weight: 500,
    padding: "10px 18px",
    fillStyle: "filled",
    primaryShadow: null,
    hoverEffect: "brightness",
    secondaryStyle: "outline",
  },
  input: {
    radius: "var(--radius-md, 8px)",
    borderWidth: 1,
    focusStyle: "ring",
    bg: "bg",
  },
  card: {
    radius: "var(--radius-lg, 12px)",
    padding: 20,
    elevation: "soft",
    bg: "surface",
  },
  badge: {
    shape: "pill",
    weight: 500,
  },
  tab: {
    indicator: "underline",
    indicatorWeight: 2,
  },
};

// ─── Parser / validator ─────────────────────────────────────────────────────

const COLOUR_RE = /^(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\)|var\(--[^)]+\)|oklch\([^)]+\))$/;

function isValidColour(v: unknown): v is string {
  return typeof v === "string" && COLOUR_RE.test(v.trim());
}
function num(v: unknown, lo: number, hi: number, fb: number): number {
  return typeof v === "number" && v >= lo && v <= hi ? v : fb;
}
function str(v: unknown, fb: string): string {
  return typeof v === "string" && v.length > 0 ? v : fb;
}
function colourOr(v: unknown, fb: string): string {
  return isValidColour(v) ? v : fb;
}
function oneOf<T extends string>(v: unknown, allowed: readonly T[], fb: T): T {
  return typeof v === "string" && (allowed as readonly string[]).includes(v) ? (v as T) : fb;
}

function parseColours(raw: unknown): KitStyleColours {
  const o = (raw ?? {}) as Record<string, unknown>;
  const d = DEFAULT_STYLE_PROFILE.colours;
  return {
    bg: colourOr(o.bg, d.bg),
    surface: colourOr(o.surface, d.surface),
    surfaceElevated: colourOr(o.surfaceElevated, d.surfaceElevated),
    text: colourOr(o.text, d.text),
    headingText: colourOr(o.headingText, d.headingText),
    textMuted: colourOr(o.textMuted, d.textMuted),
    accent: colourOr(o.accent, d.accent),
    accentHover: colourOr(o.accentHover, d.accentHover),
    accentSubtle: colourOr(o.accentSubtle, d.accentSubtle),
    onAccent: colourOr(o.onAccent, d.onAccent),
    border: colourOr(o.border, d.border),
    borderStrong: colourOr(o.borderStrong, d.borderStrong),
    success: colourOr(o.success, d.success),
    warning: colourOr(o.warning, d.warning),
    error: colourOr(o.error, d.error),
    info: colourOr(o.info, d.info),
  };
}

function parseType(raw: unknown): KitStyleType {
  const o = (raw ?? {}) as Record<string, unknown>;
  const d = DEFAULT_STYLE_PROFILE.type;
  return {
    headingWeight: num(o.headingWeight, 400, 800, d.headingWeight),
    bodyWeight: num(o.bodyWeight, 400, 700, d.bodyWeight),
    headingTracking: str(o.headingTracking, d.headingTracking),
  };
}

function parseButton(raw: unknown): KitStyleButton {
  const o = (raw ?? {}) as Record<string, unknown>;
  const d = DEFAULT_STYLE_PROFILE.button;
  const primaryShadow =
    o.primaryShadow === null ? null : typeof o.primaryShadow === "string" && o.primaryShadow.length > 0 ? o.primaryShadow : d.primaryShadow;
  return {
    radius: str(o.radius, d.radius),
    weight: num(o.weight, 400, 700, d.weight),
    padding: str(o.padding, d.padding),
    fillStyle: oneOf(o.fillStyle, ["filled", "shadowed", "subtle", "outlined-emphasis"] as const, d.fillStyle),
    primaryShadow,
    hoverEffect: oneOf(o.hoverEffect, ["brightness", "shadow-lift", "bg-shift", "border-fill"] as const, d.hoverEffect),
    secondaryStyle: oneOf(o.secondaryStyle, ["outline", "filled-light", "ghost"] as const, d.secondaryStyle),
  };
}

function parseInput(raw: unknown): KitStyleInput {
  const o = (raw ?? {}) as Record<string, unknown>;
  const d = DEFAULT_STYLE_PROFILE.input;
  return {
    radius: str(o.radius, d.radius),
    borderWidth: num(o.borderWidth, 1, 3, d.borderWidth),
    focusStyle: oneOf(o.focusStyle, ["ring", "border", "shadow"] as const, d.focusStyle),
    bg: typeof o.bg === "string" && o.bg.length > 0 ? o.bg : d.bg,
  };
}

function parseCard(raw: unknown): KitStyleCard {
  const o = (raw ?? {}) as Record<string, unknown>;
  const d = DEFAULT_STYLE_PROFILE.card;
  return {
    radius: str(o.radius, d.radius),
    padding: num(o.padding, 8, 48, d.padding),
    elevation: oneOf(o.elevation, ["soft", "shadow", "elevated"] as const, d.elevation),
    bg: typeof o.bg === "string" && o.bg.length > 0 ? o.bg : d.bg,
  };
}

function parseBadge(raw: unknown): KitStyleBadge {
  const o = (raw ?? {}) as Record<string, unknown>;
  const d = DEFAULT_STYLE_PROFILE.badge;
  return {
    shape: oneOf(o.shape, ["pill", "rounded", "square"] as const, d.shape),
    weight: num(o.weight, 400, 700, d.weight),
  };
}

function parseTab(raw: unknown): KitStyleTab {
  const o = (raw ?? {}) as Record<string, unknown>;
  const d = DEFAULT_STYLE_PROFILE.tab;
  return {
    indicator: oneOf(o.indicator, ["underline", "pill", "filled", "subtle"] as const, d.indicator),
    indicatorWeight: num(o.indicatorWeight, 1, 4, d.indicatorWeight),
  };
}

/**
 * Validate any candidate profile object — v1 or v2 — and return a clean v2.
 * Never throws. Returns null only if input is not an object at all.
 *
 * v1 profiles (no `colours` block) get v2 colours from DEFAULT_STYLE_PROFILE.
 * The renderer will then fall back to extracted CSS variables for v1 kits,
 * matching pre-v2 behaviour.
 */
export function parseStyleProfile(raw: unknown): KitStyleProfile | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  return {
    version: 2,
    mode: oneOf(o.mode, ["light", "dark"] as const, DEFAULT_STYLE_PROFILE.mode),
    density: oneOf(o.density, ["compact", "comfortable", "airy"] as const, DEFAULT_STYLE_PROFILE.density),
    colours: parseColours(o.colours),
    type: parseType(o.type ?? { headingWeight: o.headingWeight }),
    button: parseButton(o.button),
    input: parseInput(o.input),
    card: parseCard(o.card),
    badge: parseBadge(o.badge),
    tab: parseTab(o.tab),
  };
}
