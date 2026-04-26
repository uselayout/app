/**
 * Kit Style Profile
 *
 * A small, structured JSON object Claude derives from a kit's layout.md +
 * tokens.css. It tells the uniform Live Preview how each block should LOOK
 * for THIS kit — radii, weights, paddings, fill styles, density.
 *
 * The intent is "uniform structure, kit-tailored skin": every kit renders
 * the same 12 blocks (so visitors can compare like-for-like), but each
 * block is rendered using the kit's actual conventions instead of a
 * one-size-fits-all default.
 *
 * Cheap to generate (small JSON output, no JSX), predictable to render
 * (no transpile risk), and easy to evolve (improve the renderer once,
 * every kit benefits).
 */

export type Density = "compact" | "comfortable" | "airy";
export type ButtonFill = "filled" | "shadowed" | "subtle";
export type FocusStyle = "ring" | "border";
export type CardElevation = "soft" | "shadow" | "elevated";
export type BadgeShape = "pill" | "rounded" | "square";
export type TabIndicator = "underline" | "pill" | "filled" | "subtle";
export type StyleMode = "light" | "dark";

export interface KitStyleProfile {
  /**
   * Schema version for forward-compatibility. Bump on breaking changes
   * to the renderer's interpretation of this object.
   */
  version: 1;

  /**
   * Default surface mode for the showcase. Linear, Vercel, Spotify etc.
   * read better in dark; Stripe, Notion, Apple in light.
   */
  mode: StyleMode;

  /** Overall vertical rhythm. Maps to gap/padding scale in the template. */
  density: Density;

  /**
   * Heading weight (h1, h2). Apple ≈ 500, Linear ≈ 600, IBM ≈ 700.
   * Allowed range: 400–800.
   */
  headingWeight: number;

  button: {
    /**
     * CSS value for button border-radius. Either a CSS variable
     * reference like `var(--radius-md)` or a px/rem literal. Falls
     * through to renderer's pickRadii.lg if absent.
     */
    radius: string;
    /** Font weight. Allowed: 400–700. */
    weight: number;
    /** CSS padding shorthand, e.g. "10px 18px". */
    padding: string;
    /**
     * Fill treatment. "filled" = flat solid accent, "shadowed" = solid
     * with a soft drop-shadow (Stripe-style), "subtle" = low-saturation
     * tinted background (Notion-style).
     */
    fillStyle: ButtonFill;
  };

  input: {
    radius: string;
    /** Border width in px. 1 (default) or 1.5 / 2 for emphasis. */
    borderWidth: number;
    /**
     * Focus treatment. "ring" = accent-coloured 3px ring (Stripe), "border"
     * = border colour shifts to accent (Linear, Apple).
     */
    focusStyle: FocusStyle;
  };

  card: {
    radius: string;
    /** Padding in px. */
    padding: number;
    /**
     * "soft" = border only (Linear, Stripe), "shadow" = border + shadow
     * (Notion, Asana), "elevated" = shadow only no border (Material).
     */
    elevation: CardElevation;
  };

  badge: {
    shape: BadgeShape;
    weight: number;
  };

  tab: {
    indicator: TabIndicator;
  };
}

/**
 * Renderer-friendly defaults. Used when the kit has no profile yet (newly
 * published, profile generation failed, or version mismatch). The shape
 * mirrors what the uniform template was doing before profiles existed.
 */
export const DEFAULT_STYLE_PROFILE: KitStyleProfile = {
  version: 1,
  mode: "light",
  density: "comfortable",
  headingWeight: 700,
  button: {
    radius: "var(--radius-lg, 999px)",
    weight: 500,
    padding: "10px 18px",
    fillStyle: "filled",
  },
  input: {
    radius: "var(--radius-md, 8px)",
    borderWidth: 1,
    focusStyle: "ring",
  },
  card: {
    radius: "var(--radius-lg, 12px)",
    padding: 20,
    elevation: "soft",
  },
  badge: {
    shape: "pill",
    weight: 500,
  },
  tab: {
    indicator: "underline",
  },
};

/**
 * Validate a candidate profile (e.g. from Claude). Returns a clean
 * profile or null on shape mismatch. Never throws — callers should
 * fall back to DEFAULT_STYLE_PROFILE on null.
 */
export function parseStyleProfile(raw: unknown): KitStyleProfile | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;

  const isOneOf = <T extends string>(v: unknown, allowed: readonly T[]): v is T =>
    typeof v === "string" && (allowed as readonly string[]).includes(v);
  const num = (v: unknown, lo: number, hi: number, fb: number): number =>
    typeof v === "number" && v >= lo && v <= hi ? v : fb;
  const str = (v: unknown, fb: string): string =>
    typeof v === "string" && v.length > 0 ? v : fb;

  const button = (o.button ?? {}) as Record<string, unknown>;
  const input = (o.input ?? {}) as Record<string, unknown>;
  const card = (o.card ?? {}) as Record<string, unknown>;
  const badge = (o.badge ?? {}) as Record<string, unknown>;
  const tab = (o.tab ?? {}) as Record<string, unknown>;

  const profile: KitStyleProfile = {
    version: 1,
    mode: isOneOf(o.mode, ["light", "dark"] as const) ? o.mode : DEFAULT_STYLE_PROFILE.mode,
    density: isOneOf(o.density, ["compact", "comfortable", "airy"] as const)
      ? o.density
      : DEFAULT_STYLE_PROFILE.density,
    headingWeight: num(o.headingWeight, 400, 800, DEFAULT_STYLE_PROFILE.headingWeight),
    button: {
      radius: str(button.radius, DEFAULT_STYLE_PROFILE.button.radius),
      weight: num(button.weight, 400, 700, DEFAULT_STYLE_PROFILE.button.weight),
      padding: str(button.padding, DEFAULT_STYLE_PROFILE.button.padding),
      fillStyle: isOneOf(button.fillStyle, ["filled", "shadowed", "subtle"] as const)
        ? button.fillStyle
        : DEFAULT_STYLE_PROFILE.button.fillStyle,
    },
    input: {
      radius: str(input.radius, DEFAULT_STYLE_PROFILE.input.radius),
      borderWidth: num(input.borderWidth, 1, 3, DEFAULT_STYLE_PROFILE.input.borderWidth),
      focusStyle: isOneOf(input.focusStyle, ["ring", "border"] as const)
        ? input.focusStyle
        : DEFAULT_STYLE_PROFILE.input.focusStyle,
    },
    card: {
      radius: str(card.radius, DEFAULT_STYLE_PROFILE.card.radius),
      padding: num(card.padding, 8, 48, DEFAULT_STYLE_PROFILE.card.padding),
      elevation: isOneOf(card.elevation, ["soft", "shadow", "elevated"] as const)
        ? card.elevation
        : DEFAULT_STYLE_PROFILE.card.elevation,
    },
    badge: {
      shape: isOneOf(badge.shape, ["pill", "rounded", "square"] as const)
        ? badge.shape
        : DEFAULT_STYLE_PROFILE.badge.shape,
      weight: num(badge.weight, 400, 700, DEFAULT_STYLE_PROFILE.badge.weight),
    },
    tab: {
      indicator: isOneOf(tab.indicator, ["underline", "pill", "filled", "subtle"] as const)
        ? tab.indicator
        : DEFAULT_STYLE_PROFILE.tab.indicator,
    },
  };

  return profile;
}
