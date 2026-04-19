/**
 * Layout Standard Design System Schema
 *
 * Defines the canonical token roles that every design system should have.
 * Cross-referenced from: Linear, Stripe, Notion kits + Material 3, Radix,
 * shadcn/ui, Carbon (IBM), Spectrum (Adobe), Salesforce Lightning, W3C DTCG.
 *
 * Used by the standardisation engine to classify extracted tokens into
 * consistent roles that AI agents can reliably consume via layout.md.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type StandardRoleCategory =
  | "backgrounds"
  | "text"
  | "borders"
  | "accent"
  | "status"
  | "typography"
  | "spacing"
  | "radius"
  | "shadows"
  | "motion";

export interface StandardRole {
  /** Unique role key, e.g. "bg-app" */
  key: string;
  /** Human-readable label shown in the UI */
  label: string;
  /** Which schema category this belongs to */
  category: StandardRoleCategory;
  /** Token suffix appended to the kit prefix: --{kit}-{suffix} */
  suffix: string;
  /** Whether this role must be filled for a complete design system */
  required: boolean;
  /** Description shown as tooltip / helper text */
  description: string;
  /** Keywords in extracted token names that suggest this role (for auto-matching) */
  matchKeywords: string[];
  /** Value-based matching hints */
  matchHints?: {
    /** For colours: "lightest" | "darkest" | "mid" | "accent" */
    lightness?: "lightest" | "darkest" | "mid" | "accent";
    /** Prefer tokens with opacity / alpha */
    preferAlpha?: boolean;
  };
}

export interface StandardSchema {
  /** Schema version for backward compat */
  version: number;
  /** All standard roles grouped by category */
  roles: StandardRole[];
}

export interface StandardisedTokenMap {
  /** Kit prefix derived from source (e.g. "ada", "stripe", "linear") */
  kitPrefix: string;
  /** Role assignments: role key → token index in extraction data + confidence */
  assignments: Map<string, TokenAssignment>;
  /** Tokens not assigned to any standard role */
  unassigned: UnassignedToken[];
  /** Auto-generated anti-patterns from extraction noise */
  antiPatterns: AntiPattern[];
}

export interface TokenAssignment {
  /** The standard role key */
  roleKey: string;
  /** Original extracted token name */
  originalName: string;
  /** Original CSS variable (if any) */
  originalCssVariable?: string;
  /** The resolved value */
  value: string;
  /** Standard name: --{kit}-{suffix} */
  standardName: string;
  /** How confident the auto-match is */
  confidence: "high" | "medium" | "low";
  /** Whether user manually confirmed or changed this assignment */
  userConfirmed: boolean;
}

export interface UnassignedToken {
  name: string;
  cssVariable?: string;
  value: string;
  type: string;
  /** If true, this token is hidden from layout.md synthesis */
  hidden: boolean;
}

export interface AntiPattern {
  /** Short rule statement */
  rule: string;
  /** Why violating this rule causes problems */
  reason: string;
  /** What to do instead */
  fix: string;
}

// ---------------------------------------------------------------------------
// Schema Definition (v1)
// ---------------------------------------------------------------------------

const COLOUR_ROLES: StandardRole[] = [
  // ── Backgrounds ──
  {
    key: "bg-app",
    label: "App Background",
    category: "backgrounds",
    suffix: "bg-app",
    required: true,
    description: "Root application background. The outermost canvas colour.",
    matchKeywords: ["bg-app", "background", "bg-base", "bg-default", "bg-body", "surface-dim", "app-bg", "body-bg", "canvas"],
    matchHints: { lightness: "lightest" },
  },
  {
    key: "bg-surface",
    label: "Surface",
    category: "backgrounds",
    suffix: "bg-surface",
    required: true,
    description: "Cards, panels, sidebars. One step above app background.",
    matchKeywords: ["bg-surface", "surface", "bg-card", "bg-panel", "card-bg", "panel-bg", "bg-secondary"],
  },
  {
    key: "bg-elevated",
    label: "Elevated",
    category: "backgrounds",
    suffix: "bg-elevated",
    required: true,
    description: "Modals, dropdowns, popovers. Highest surface elevation.",
    matchKeywords: ["bg-elevated", "elevated", "bg-popover", "bg-dropdown", "bg-modal", "bg-overlay-content", "popover"],
  },
  {
    key: "bg-hover",
    label: "Hover",
    category: "backgrounds",
    suffix: "bg-hover",
    required: true,
    description: "Background colour for interactive hover states.",
    matchKeywords: ["bg-hover", "hover", "hover-bg", "bg-interactive", "bg-muted"],
  },
  {
    key: "bg-selected",
    label: "Selected / Active",
    category: "backgrounds",
    suffix: "bg-selected",
    required: false,
    description: "Background for selected or active items (toggles, active nav).",
    matchKeywords: ["bg-selected", "selected", "active", "bg-active", "bg-pressed", "bg-toggled"],
  },
  {
    key: "bg-overlay",
    label: "Overlay / Scrim",
    category: "backgrounds",
    suffix: "bg-overlay",
    required: false,
    description: "Semi-transparent backdrop behind modals and drawers.",
    matchKeywords: ["overlay", "scrim", "backdrop", "bg-overlay", "modal-backdrop"],
    matchHints: { preferAlpha: true },
  },

  // ── Text ──
  {
    key: "text-primary",
    label: "Primary Text",
    category: "text",
    suffix: "text-primary",
    required: true,
    description: "Main body text, headings. Highest contrast against background.",
    matchKeywords: ["text-primary", "text-default", "text-base", "foreground", "text-heading", "on-surface", "text-body"],
  },
  {
    key: "text-secondary",
    label: "Secondary Text",
    category: "text",
    suffix: "text-secondary",
    required: true,
    description: "Supporting text, descriptions, labels. Reduced emphasis.",
    matchKeywords: ["text-secondary", "text-subtle", "text-sub", "text-description", "on-surface-variant", "text-label", "text-hushed", "text-subdued"],
  },
  {
    key: "text-muted",
    label: "Muted Text",
    category: "text",
    suffix: "text-muted",
    required: true,
    description: "Lowest emphasis text: captions, timestamps, disabled labels.",
    matchKeywords: ["text-muted", "text-disabled", "text-tertiary", "text-caption", "text-faint", "text-hint", "text-hushed", "text-dim", "text-quiet"],
  },
  {
    key: "text-placeholder",
    label: "Placeholder",
    category: "text",
    suffix: "text-placeholder",
    required: false,
    description: "Input placeholder text colour.",
    matchKeywords: ["placeholder", "text-placeholder", "input-placeholder", "text-reverse", "text-inverse", "hushedReverse"],
  },

  // ── Borders ──
  {
    key: "border",
    label: "Default Border",
    category: "borders",
    suffix: "border",
    required: true,
    description: "Standard border for cards, inputs, dividers.",
    matchKeywords: ["border", "border-default", "border-base", "divider", "outline", "separator", "border-primary"],
  },
  {
    key: "border-strong",
    label: "Strong Border",
    category: "borders",
    suffix: "border-strong",
    required: true,
    description: "Higher contrast border for emphasis or input focus.",
    matchKeywords: ["border-strong", "border-emphasis", "border-hover", "border-prominent", "outline-variant"],
  },
  {
    key: "border-focus",
    label: "Focus Ring",
    category: "borders",
    suffix: "border-focus",
    required: true,
    description: "Visible focus indicator for keyboard navigation / accessibility.",
    matchKeywords: ["border-focus", "focus", "ring", "focus-ring", "outline-focus", "focus-visible"],
  },

  // ── Accent / Brand ──
  {
    key: "accent",
    label: "Accent",
    category: "accent",
    suffix: "accent",
    required: true,
    description: "Primary brand / action colour. CTAs, links, active indicators.",
    matchKeywords: ["accent", "primary", "brand", "action", "cta", "link", "interactive"],
    matchHints: { lightness: "accent" },
  },
  {
    key: "accent-hover",
    label: "Accent Hover",
    category: "accent",
    suffix: "accent-hover",
    required: true,
    description: "Hover state of the accent colour (slightly darker or lighter).",
    matchKeywords: ["accent-hover", "primary-hover", "brand-hover", "action-hover", "primary-dark"],
    matchHints: { lightness: "accent" },
  },
  {
    key: "accent-subtle",
    label: "Accent Subtle",
    category: "accent",
    suffix: "accent-subtle",
    required: true,
    description: "Low-opacity accent for tinted backgrounds (selected rows, badges).",
    matchKeywords: ["accent-subtle", "accent-bg", "primary-subtle", "primary-light", "tint", "accent-muted"],
    matchHints: { preferAlpha: true },
  },
  {
    key: "accent-foreground",
    label: "On Accent",
    category: "accent",
    suffix: "accent-foreground",
    required: true,
    description: "Text / icon colour placed on the accent background.",
    matchKeywords: ["accent-foreground", "on-primary", "primary-foreground", "on-accent", "text-on-accent", "text-on-primary"],
  },
  {
    key: "surface-foreground",
    label: "On Surface",
    category: "accent",
    suffix: "surface-foreground",
    required: false,
    description: "Text colour on surface / card backgrounds (if different from text-primary).",
    matchKeywords: ["surface-foreground", "card-foreground", "on-surface", "on-card"],
  },

  // ── Status / Feedback ──
  {
    key: "success",
    label: "Success",
    category: "status",
    suffix: "success",
    required: true,
    description: "Positive feedback: confirmations, completion, valid states.",
    matchKeywords: ["success", "positive", "valid", "green", "complete", "done"],
  },
  {
    key: "success-bg",
    label: "Success Background",
    category: "status",
    suffix: "success-bg",
    required: true,
    description: "Light background tint for success alerts and badges.",
    matchKeywords: ["success-bg", "success-light", "success-subtle", "success-surface", "positive-bg"],
  },
  {
    key: "warning",
    label: "Warning",
    category: "status",
    suffix: "warning",
    required: true,
    description: "Caution feedback: pending actions, non-critical issues.",
    matchKeywords: ["warning", "caution", "notice", "amber", "orange", "attention"],
  },
  {
    key: "warning-bg",
    label: "Warning Background",
    category: "status",
    suffix: "warning-bg",
    required: true,
    description: "Light background tint for warning alerts and badges.",
    matchKeywords: ["warning-bg", "warning-light", "warning-subtle", "warning-surface", "caution-bg"],
  },
  {
    key: "error",
    label: "Error / Destructive",
    category: "status",
    suffix: "error",
    required: true,
    description: "Negative feedback: errors, destructive actions, invalid states.",
    matchKeywords: ["error", "destructive", "danger", "negative", "red", "invalid", "critical"],
  },
  {
    key: "error-bg",
    label: "Error Background",
    category: "status",
    suffix: "error-bg",
    required: true,
    description: "Light background tint for error alerts and badges.",
    matchKeywords: ["error-bg", "error-light", "error-subtle", "error-surface", "destructive-bg", "danger-bg"],
  },
  {
    key: "info",
    label: "Info",
    category: "status",
    suffix: "info",
    required: true,
    description: "Neutral informational feedback: tips, notes, help text.",
    matchKeywords: ["info", "information", "blue", "note", "help"],
  },
  {
    key: "info-bg",
    label: "Info Background",
    category: "status",
    suffix: "info-bg",
    required: true,
    description: "Light background tint for info alerts and badges.",
    matchKeywords: ["info-bg", "info-light", "info-subtle", "info-surface"],
  },
];

const TYPOGRAPHY_ROLES: StandardRole[] = [
  // Families
  {
    key: "font-sans",
    label: "Sans-serif Font",
    category: "typography",
    suffix: "font-sans",
    required: true,
    description: "Primary sans-serif font stack for UI text.",
    matchKeywords: ["font-sans", "font-family", "font-base", "font-body", "font-primary", "font-ui"],
  },
  {
    key: "font-mono",
    label: "Monospace Font",
    category: "typography",
    suffix: "font-mono",
    required: true,
    description: "Monospace font stack for code, data, and technical content.",
    matchKeywords: ["font-mono", "font-code", "monospace"],
  },
  {
    key: "font-serif",
    label: "Serif Font",
    category: "typography",
    suffix: "font-serif",
    required: false,
    description: "Serif font stack for editorial or content-heavy contexts.",
    matchKeywords: ["font-serif", "serif", "font-editorial", "font-display"],
  },
  // Size scale
  { key: "font-size-xs", label: "Size XS", category: "typography", suffix: "font-size-xs", required: false, description: "12px. Supporting metadata, tiny labels.", matchKeywords: ["font-size-xs", "text-xs", "type-xs", "size-xs", "font-size-12", "text-12"] },
  { key: "font-size-sm", label: "Size SM", category: "typography", suffix: "font-size-sm", required: true, description: "14px. Secondary text, captions, dense UI.", matchKeywords: ["font-size-sm", "text-sm", "type-sm", "size-sm", "font-size-14", "text-14", "caption"] },
  { key: "font-size-md", label: "Size MD (Body)", category: "typography", suffix: "font-size-md", required: true, description: "16px. Default body text size.", matchKeywords: ["font-size-md", "font-size-base", "text-base", "text-md", "body-size", "font-body-size", "type-body", "size-md", "font-size-16"] },
  { key: "font-size-lg", label: "Size LG", category: "typography", suffix: "font-size-lg", required: false, description: "18-20px. Lead paragraphs, subheadings.", matchKeywords: ["font-size-lg", "text-lg", "type-lg", "size-lg", "lead", "subhead"] },
  { key: "font-size-xl", label: "Size XL", category: "typography", suffix: "font-size-xl", required: false, description: "22-26px. Section headings.", matchKeywords: ["font-size-xl", "text-xl", "type-xl", "size-xl", "heading-sm", "h3-size"] },
  { key: "font-size-2xl", label: "Size 2XL", category: "typography", suffix: "font-size-2xl", required: false, description: "30-36px. Page headings.", matchKeywords: ["font-size-2xl", "text-2xl", "type-2xl", "size-2xl", "heading-md", "h2-size"] },
  { key: "font-size-3xl", label: "Size 3XL", category: "typography", suffix: "font-size-3xl", required: false, description: "40-56px. Hero and display headings.", matchKeywords: ["font-size-3xl", "text-3xl", "type-3xl", "size-3xl", "display", "heading-xl", "h1-size", "hero-size"] },
  // Weight scale
  { key: "font-weight-regular", label: "Weight Regular", category: "typography", suffix: "font-weight-regular", required: false, description: "400. Default body weight.", matchKeywords: ["font-weight-regular", "font-weight-normal", "font-weight-400", "weight-regular", "weight-normal"] },
  { key: "font-weight-medium", label: "Weight Medium", category: "typography", suffix: "font-weight-medium", required: false, description: "500. Emphasised UI labels.", matchKeywords: ["font-weight-medium", "font-weight-500", "weight-medium"] },
  { key: "font-weight-semibold", label: "Weight Semibold", category: "typography", suffix: "font-weight-semibold", required: false, description: "600. Subheadings and strong labels.", matchKeywords: ["font-weight-semibold", "font-weight-600", "weight-semibold"] },
  { key: "font-weight-bold", label: "Weight Bold", category: "typography", suffix: "font-weight-bold", required: false, description: "700. Headings and high-emphasis text.", matchKeywords: ["font-weight-bold", "font-weight-700", "weight-bold"] },
  // Line-height scale
  { key: "line-height-tight", label: "Line-height Tight", category: "typography", suffix: "line-height-tight", required: false, description: "1.1-1.25. Headings and display text.", matchKeywords: ["line-height-tight", "leading-tight", "line-height-1", "lh-tight", "heading-leading"] },
  { key: "line-height-normal", label: "Line-height Normal", category: "typography", suffix: "line-height-normal", required: false, description: "1.4-1.5. Default body reading.", matchKeywords: ["line-height-normal", "line-height-base", "leading-normal", "leading-base", "lh-normal", "body-leading"] },
  { key: "line-height-loose", label: "Line-height Loose", category: "typography", suffix: "line-height-loose", required: false, description: "1.65-1.8. Long-form editorial reading.", matchKeywords: ["line-height-loose", "leading-loose", "lh-loose", "editorial-leading"] },
];

const SPACING_ROLES: StandardRole[] = [
  { key: "space-xs", label: "Extra Small", category: "spacing", suffix: "space-xs", required: true, description: "4px. Micro gaps, icon padding.", matchKeywords: ["space-xs", "space-1", "spacing-1", "gap-xs"] },
  { key: "space-sm", label: "Small", category: "spacing", suffix: "space-sm", required: true, description: "8px. Button padding, inline gaps.", matchKeywords: ["space-sm", "space-2", "spacing-2", "gap-sm"] },
  { key: "space-md", label: "Medium", category: "spacing", suffix: "space-md", required: true, description: "12px. Component internal spacing.", matchKeywords: ["space-md", "space-3", "spacing-3", "gap-md"] },
  { key: "space-lg", label: "Large", category: "spacing", suffix: "space-lg", required: true, description: "16px. Section padding, card padding.", matchKeywords: ["space-lg", "space-4", "spacing-4", "gap-lg"] },
  { key: "space-xl", label: "Extra Large", category: "spacing", suffix: "space-xl", required: true, description: "24px. Group separation.", matchKeywords: ["space-xl", "space-6", "spacing-6", "gap-xl"] },
  { key: "space-2xl", label: "2XL", category: "spacing", suffix: "space-2xl", required: true, description: "32px. Section gaps.", matchKeywords: ["space-2xl", "space-8", "spacing-8", "gap-2xl"] },
  { key: "space-3xl", label: "3XL", category: "spacing", suffix: "space-3xl", required: true, description: "48px. Large section separation.", matchKeywords: ["space-3xl", "space-12", "spacing-12", "gap-3xl"] },
];

const RADIUS_ROLES: StandardRole[] = [
  { key: "radius-sm", label: "Small Radius", category: "radius", suffix: "radius-sm", required: true, description: "Subtle rounding for badges, chips, small elements.", matchKeywords: ["radius-sm", "radius-small", "rounded-sm"] },
  { key: "radius-md", label: "Medium Radius", category: "radius", suffix: "radius-md", required: true, description: "Default rounding for inputs, buttons, cards.", matchKeywords: ["radius-md", "radius-default", "radius-base", "rounded-md", "rounded"] },
  { key: "radius-lg", label: "Large Radius", category: "radius", suffix: "radius-lg", required: true, description: "Prominent rounding for panels, modals, hero cards.", matchKeywords: ["radius-lg", "radius-large", "rounded-lg"] },
  { key: "radius-full", label: "Full / Pill", category: "radius", suffix: "radius-full", required: true, description: "Fully rounded (pill shape) for avatars, pill buttons, tags.", matchKeywords: ["radius-full", "radius-pill", "rounded-full", "pill"] },
];

const SHADOW_ROLES: StandardRole[] = [
  { key: "shadow-sm", label: "Small Shadow", category: "shadows", suffix: "shadow-sm", required: false, description: "Subtle elevation for cards and buttons.", matchKeywords: ["shadow-sm", "shadow-small", "elevation-1", "shadow-xs"] },
  { key: "shadow-md", label: "Medium Shadow", category: "shadows", suffix: "shadow-md", required: false, description: "Standard elevation for dropdowns and popovers.", matchKeywords: ["shadow-md", "shadow-default", "shadow-base", "elevation-2", "shadow"] },
  { key: "shadow-lg", label: "Large Shadow", category: "shadows", suffix: "shadow-lg", required: false, description: "Prominent elevation for modals and dialogs.", matchKeywords: ["shadow-lg", "shadow-large", "elevation-3"] },
];

const MOTION_ROLES: StandardRole[] = [
  { key: "duration-fast", label: "Fast Duration", category: "motion", suffix: "duration-fast", required: false, description: "Quick transitions: hover states, toggles. ~100-150ms.", matchKeywords: ["duration-fast", "duration-quick", "speed-fast", "transition-fast"] },
  { key: "duration-base", label: "Base Duration", category: "motion", suffix: "duration-base", required: false, description: "Standard transitions: expand/collapse, slide. ~200-300ms.", matchKeywords: ["duration-base", "duration-normal", "duration-default", "speed-normal"] },
  { key: "duration-slow", label: "Slow Duration", category: "motion", suffix: "duration-slow", required: false, description: "Deliberate transitions: page transitions, complex animations. ~400-500ms.", matchKeywords: ["duration-slow", "speed-slow", "duration-long"] },
  { key: "ease-default", label: "Default Easing", category: "motion", suffix: "ease-default", required: false, description: "Standard easing curve for interactive transitions.", matchKeywords: ["ease", "easing", "ease-default", "ease-standard", "ease-out"] },
];

// ---------------------------------------------------------------------------
// Exported Schema
// ---------------------------------------------------------------------------

export const STANDARD_SCHEMA: StandardSchema = {
  version: 1,
  roles: [
    ...COLOUR_ROLES,
    ...TYPOGRAPHY_ROLES,
    ...SPACING_ROLES,
    ...RADIUS_ROLES,
    ...SHADOW_ROLES,
    ...MOTION_ROLES,
  ],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Get all roles for a given category */
export function getRolesByCategory(category: StandardRoleCategory): StandardRole[] {
  return STANDARD_SCHEMA.roles.filter((r) => r.category === category);
}

/** Get only required roles */
export function getRequiredRoles(): StandardRole[] {
  return STANDARD_SCHEMA.roles.filter((r) => r.required);
}

/** Get a role by its key */
export function getRoleByKey(key: string): StandardRole | undefined {
  return STANDARD_SCHEMA.roles.find((r) => r.key === key);
}

/** All category labels in display order */
export const SCHEMA_CATEGORIES: { key: StandardRoleCategory; label: string }[] = [
  { key: "backgrounds", label: "Backgrounds" },
  { key: "text", label: "Text" },
  { key: "borders", label: "Borders" },
  { key: "accent", label: "Accent / Brand" },
  { key: "status", label: "Status / Feedback" },
  { key: "typography", label: "Typography" },
  { key: "spacing", label: "Spacing" },
  { key: "radius", label: "Border Radius" },
  { key: "shadows", label: "Shadows" },
  { key: "motion", label: "Motion" },
];

/** Total count of roles in the schema */
export const TOTAL_ROLES = STANDARD_SCHEMA.roles.length;

/** Count of required roles */
export const REQUIRED_ROLES = getRequiredRoles().length;

/**
 * Derive a kit prefix from a URL or file name.
 * - Website: "ada" from "https://ada.cx", "stripe" from "https://stripe.com/docs"
 * - Figma: slugified file name
 */
export function deriveKitPrefix(source: string): string {
  // Try URL first
  try {
    const url = new URL(source);
    const hostname = url.hostname.replace(/^www\./, "");
    // Take the first part of the domain (before first dot)
    const parts = hostname.split(".");
    // Use second-level domain if TLD is short (co.uk, com.au, etc.)
    const name = parts.length > 2 && parts[parts.length - 2].length <= 3
      ? parts[parts.length - 3]
      : parts[0];
    return slugify(name);
  } catch {
    // Not a URL, treat as file name
    return slugify(source.replace(/\.[^.]+$/, ""));
  }
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 20);
}

/**
 * Build the standard CSS variable name for a role.
 * e.g. buildStandardName("ada", "bg-app") → "--ada-bg-app"
 */
export function buildStandardName(kitPrefix: string, roleSuffix: string): string {
  return `--${kitPrefix}-${roleSuffix}`;
}
