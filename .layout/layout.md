# layout.md — Linear.app Design System

---

## 0. Quick Reference

> Copy-paste into `CLAUDE.md` or `.cursorrules` for immediate effect.

**Stack:** Dark-mode-only web app · CSS custom properties · Inter Variable as primary typeface · 8px spatial grid · No Tailwind

```css
/* === CORE TOKENS — Linear.app === */
:root {
  /* Colour */
  --color-bg-base: #0f1011;           /* Page background */
  --color-bg-elevated: #161718;       /* Card / panel surface */
  --color-bg-subtle: #1c1d1f;         /* Hover / secondary surface */
  --color-border-default: rgba(255,255,255,0.05); /* Card/panel border */
  --color-border-subtle: rgba(255,255,255,0.08);  /* Dividers */
  --color-text-primary: #f7f8f8;      /* Headings, high-emphasis */
  --color-text-secondary: #8a8f98;    /* Body copy, subheadings */
  --color-text-tertiary: #5a5f6a;     /* Captions, disabled labels */
  --color-action-primary: #5e6ad2;    /* Primary CTA (indigo) */
  --color-action-primary-hover: #6e7ae2; /* CTA hover */
  --color-focus-ring: #5e6ad2;        /* Focus outline colour */
  --color-status-success: #27a644;
  --color-status-error: #eb5757;
  --color-status-warning: #f0bf00;
  --color-status-info: #4ea7fc;

  /* Typography */
  --font-regular: "Inter Variable","SF Pro Display",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
  --font-serif-display: "Tiempos Headline",ui-serif,Georgia,serif;
  --font-monospace: "Berkeley Mono",ui-monospace,"SF Mono","Menlo",monospace;
  --font-weight-normal: 400;
  --font-weight-medium: 510;
  --font-weight-semibold: 590;
  --font-weight-bold: 680;

  /* Spacing */
  --space-1: 4px;   --space-2: 8px;  --space-3: 12px; --space-4: 16px;
  --space-5: 20px;  --space-6: 24px; --space-8: 32px; --space-10: 40px;
  --space-12: 48px; --space-16: 64px;

  /* Radius */
  --radius-sm: 4px; --radius-md: 8px; --radius-lg: 12px; --radius-xl: 16px;
  --radius-pill: 9999px;

  /* Motion */
  --speed-quick: 0.1s;   --speed-regular: 0.25s;
  --ease-out: cubic-bezier(0.25,0.46,0.45,0.94);
  --ease-out-expo: cubic-bezier(0.19,1,0.22,1);
}
```

```tsx
// Primary Button — correct token usage
<button className="btn-primary">Get started</button>

// CSS:
// .btn-primary { background: var(--color-action-primary); color: var(--color-text-primary);
//   border-radius: var(--radius-sm); padding: var(--space-2) var(--space-4);
//   font: var(--font-weight-medium) 13px/1.5 var(--font-regular);
//   transition: background var(--speed-quick) var(--ease-out); }
// .btn-primary:hover  { background: var(--color-action-primary-hover); }
// .btn-primary:focus-visible { outline: 2px solid var(--color-focus-ring); outline-offset: 2px; }
// .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
```

**NEVER rules:**
1. NEVER hardcode `#5e6ad2` — always `var(--color-action-primary)`
2. NEVER use font-family `"Inter"` (not Variable) — always `var(--font-regular)`
3. NEVER use `border-radius > 16px` on rectangular UI chrome (cards, panels, inputs)
4. NEVER use light-mode colours — this system is dark-mode only
5. NEVER use spacing values not on the 4px grid (e.g., 7px, 11px, 18px)
6. NEVER use `font-weight` integers not in the defined scale (300/400/510/590/680)
7. NEVER construct z-index values manually — use `var(--layer-*)` tokens

**Full design system → see layout.md**

---

## 1. Design Direction & Philosophy

### Character
Linear is a **precision productivity tool** — the design communicates speed, focus, and engineering rigour. Every pixel earns its place. The aesthetic is **dark, dense, and deliberate**: tight typography, near-invisible borders, and a restrained accent palette that treats colour as signal rather than decoration.

### Mood & Feeling
- **Professional intensity** — the product communicates that it is made by and for people who care about craft
- **Calm confidence** — no aggressive gradients, no bouncy animations, no noisy decoration
- **Tool-first** — UI recedes so work can come forward; surfaces are dark and non-distracting

### What this design explicitly rejects
- **No warm tones** in structural UI — backgrounds are cool-neutral near-blacks (#0f1011, #161718)
- **No rounded-corner excess** — `border-radius` stays ≤ 16px on chrome; pill radius (`9999px`) is reserved for tags/badges only
- **No heavy shadows** — all shadow tokens resolve to `0px 0px 0px transparent`; depth is achieved through colour layering, not drop shadows
- **No loud colours** — the indigo `#5e6ad2` is the single structural accent; status colours (red, green, amber) appear only in data contexts
- **No decorative serifs in body copy** — `Tiempos Headline` is used exclusively for large display headings on the marketing site
- **No light mode** — the design system is dark-only; there is no light-mode variant
- **No arbitrary spacing** — every gap is a multiple of 4px
- **No transitions longer than 0.25s** on interactive elements

---

## 2. Colour System

### Tier 1 — Primitive Values

```css
:root {
  /* Primitive palette — extracted: high confidence */
  --primitive-white:   #ffffff;
  --primitive-black:   #000000;
  --primitive-indigo:  #5e6ad2;    /* Brand accent */
  --primitive-blue:    #4ea7fc;    /* Info / highlight */
  --primitive-red:     #eb5757;    /* Destructive / error */
  --primitive-green:   #27a644;    /* Success */
  --primitive-orange:  #fc7840;    /* Warning accent */
  --primitive-yellow:  #f0bf00;    /* Warning */
  --primitive-teal:    #00b8cc;    /* Tertiary accent */

  /* Dark surface primitives — reconstructed: high confidence, clustered from computed bg values */
  --primitive-surface-0: #0f1011;  /* rgb(15,16,17) — deepest bg, card bg */
  --primitive-surface-1: #161718;  /* Elevated surface — +1 stop */
  --primitive-surface-2: #1c1d1f;  /* Hover / active surface — +2 stop */
  --primitive-surface-3: #232529;  /* Tooltip / popover surface — +3 stop */

  /* Text primitives — extracted from computed styles: high confidence */
  --primitive-text-0:  #f7f8f8;    /* rgb(247,248,248) — maximum brightness */
  --primitive-text-1:  #d0d6e0;    /* rgb(208,214,224) — h3 level */
  --primitive-text-2:  #8a8f98;    /* rgb(138,143,152) — secondary */
  --primitive-text-3:  #5a5f6a;    /* Tertiary / disabled */

  /* Border primitives — reconstructed: high confidence, from card computed border */
  --primitive-border-0: rgba(255,255,255,0.05);
  --primitive-border-1: rgba(255,255,255,0.08);
  --primitive-border-2: rgba(255,255,255,0.12);
  --primitive-border-3: rgba(255,255,255,0.20);
}
```

### Tier 2 — Semantic Aliases

```css
:root {
  /* ── Backgrounds ── */
  --color-bg-base:          var(--primitive-surface-0);  /* Root page background */
  --color-bg-elevated:      var(--primitive-surface-1);  /* Cards, panels, modals */
  --color-bg-subtle:        var(--primitive-surface-2);  /* Hover states, secondary inputs */
  --color-bg-overlay:       var(--primitive-surface-3);  /* Tooltips, popovers */
  --color-bg-invert:        var(--primitive-white);      /* Rare — light surface on dark bg */

  /* ── Text ── */
  --color-text-primary:     var(--primitive-text-0);     /* Headings, high-emphasis labels */
  --color-text-heading:     var(--primitive-text-1);     /* H3-level subheadings */
  --color-text-secondary:   var(--primitive-text-2);     /* Body copy, meta, captions */
  --color-text-tertiary:    var(--primitive-text-3);     /* Disabled, placeholder, muted */
  --color-text-invert:      var(--primitive-white);      /* Text on action-primary bg */
  --color-text-on-action:   var(--primitive-white);      /* Text on buttons */

  /* ── Actions ── */
  --color-action-primary:        var(--primitive-indigo); /* Primary CTA background */
  --color-action-primary-hover:  #6e7ae2;                 /* +10% lightness — reconstructed: moderate */
  --color-action-primary-active: #4d58c8;                 /* -10% lightness — reconstructed: moderate */
  --color-action-primary-text:   var(--primitive-white);  /* Label on primary button */

  /* ── Borders ── */
  --color-border-default:   var(--primitive-border-0);   /* Card/panel outline */
  --color-border-subtle:    var(--primitive-border-1);   /* Internal dividers */
  --color-border-strong:    var(--primitive-border-2);   /* Focus-adjacent rings */
  --color-border-emphasis:  var(--primitive-border-3);   /* High-contrast separator */

  /* ── Status / Semantic signal ── */
  --color-status-success:   var(--primitive-green);      /* Positive states, completed */
  --color-status-error:     var(--primitive-red);        /* Destructive, validation error */
  --color-status-warning:   var(--primitive-yellow);     /* Caution state */
  --color-status-info:      var(--primitive-blue);       /* Informational highlights */

  /* ── Focus ── */
  --color-focus-ring:       var(--primitive-indigo);     /* Universal focus outline */

  /* ── Scrollbar ── */
  --color-scrollbar:        rgba(255,255,255,0.10);
  --color-scrollbar-hover:  rgba(255,255,255,0.20);
  --color-scrollbar-active: rgba(255,255,255,0.40);
}
```

### Tier 3 — Component Tokens

```css
:root {
  /* Button */
  --btn-primary-bg:            var(--color-action-primary);
  --btn-primary-bg-hover:      var(--color-action-primary-hover);
  --btn-primary-bg-active:     var(--color-action-primary-active);
  --btn-primary-text:          var(--color-action-primary-text);
  --btn-secondary-bg:          var(--color-bg-subtle);
  --btn-secondary-bg-hover:    var(--color-bg-overlay);
  --btn-secondary-text:        var(--color-text-secondary);
  --btn-ghost-bg:              transparent;
  --btn-ghost-bg-hover:        var(--color-bg-subtle);
  --btn-ghost-text:            var(--color-text-secondary);

  /* Card */
  --card-bg:                   var(--color-bg-base);
  --card-border:               var(--color-border-default);
  --card-radius:               var(--radius-md);

  /* Input */
  --input-bg:                  var(--color-bg-subtle);
  --input-text:                var(--color-text-primary);
  --input-placeholder:         var(--color-text-tertiary);
  --input-border:              var(--color-border-subtle);
  --input-border-focus:        var(--color-focus-ring);

  /* Badge / Tag */
  --badge-bg:                  var(--color-bg-subtle);
  --badge-text:                var(--color-text-secondary);
  --badge-radius:              var(--radius-pill);
}
```

### Colour Usage Table

| Token | Value | Use |
|---|---|---|
| `--color-bg-base` | `#0f1011` | Page root background |
| `--color-bg-elevated` | `#161718` | Cards, drawers, dialogs |
| `--color-bg-subtle` | `#1c1d1f` | Hover surfaces, secondary inputs |
| `--color-text-primary` | `#f7f8f8` | H1, H2, emphasis copy |
| `--color-text-secondary` | `#8a8f98` | Body text, meta labels |
| `--color-action-primary` | `#5e6ad2` | All primary CTAs |
| `--color-status-error` | `#eb5757` | Errors, destructive actions |
| `--color-focus-ring` | `#5e6ad2` | `:focus-visible` outlines |

---

## 3. Typography System

> NEVER document font properties in isolation. Every type style is a composite group.

### Font Stacks

```css
:root {
  --font-regular: "Inter Variable","SF Pro Display",-apple-system,BlinkMacSystemFont,
    "Segoe UI","Roboto","Oxygen","Ubuntu","Cantarell","Open Sans","Helvetica Neue",sans-serif;
  --font-serif-display: "Tiempos Headline",ui-serif,Georgia,Cambria,"Times New Roman",Times,serif;
  --font-monospace: "Berkeley Mono",ui-monospace,"SF Mono","Menlo",monospace;
  --font-emoji: "Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Twemoji Mozilla",
    "Noto Color Emoji","Android Emoji";

  /* Weight scale — extracted: high confidence */
  --font-weight-light:    300;
  --font-weight-normal:   400;
  --font-weight-medium:   510;   /* Non-standard: Inter Variable supports optical weights */
  --font-weight-semibold: 590;   /* Non-standard: optical semibold */
  --font-weight-bold:     680;   /* Non-standard: optical bold */
}
```

> **Critical:** `510`, `590`, and `680` are valid because the font is `Inter Variable` (a variable font). NEVER substitute these with `500`, `600`, `700` — the optical rendering differs.

### Type Scale — Composite Groups

```css
:root {
  /* ── Display (marketing/hero — uses Inter Variable, NOT Tiempos) ── */
  /* extracted: high confidence from computed h1 styles */
  --type-display-hero: {
    font-family: var(--font-regular);
    font-size: 64px;
    font-weight: var(--font-weight-medium);   /* 510 */
    line-height: 1;                            /* 64/64 */
    letter-spacing: -1.408px;                 /* -0.022em */
    color: var(--color-text-primary);
  }

  /* ── Heading 2 ── */
  /* extracted: high confidence from computed h2 styles */
  --type-heading-2: {
    font-family: var(--font-regular);
    font-size: 40px;
    font-weight: var(--font-weight-medium);   /* 510 */
    line-height: 1.1;                          /* 44/40 */
    letter-spacing: -0.88px;                  /* -0.022em */
    color: var(--color-text-secondary);       /* Note: h2 uses muted colour on homepage */
  }

  /* ── Heading 3 ── */
  /* extracted: high confidence from computed h3 styles */
  --type-heading-3: {
    font-family: var(--font-regular);
    font-size: 20px;
    font-weight: var(--font-weight-semibold); /* 590 */
    line-height: 1.33;                         /* 26.6/20 */
    letter-spacing: -0.24px;                  /* -0.012em */
    color: var(--color-text-heading);
  }

  /* ── Title sizes (app UI, not marketing) ── */
  /* reconstructed: moderate confidence, from --title-N-size token set */
  --type-title-1: {
    font-size: var(--title-1-size);            /* 17px */
    font-weight: var(--font-weight-medium);
    line-height: 1.4;
    letter-spacing: -0.013em;
    font-family: var(--font-regular);
  }
  --type-title-2: {
    font-size: var(--title-2-size);            /* 20px */
    font-weight: var(--font-weight-medium);
    line-height: 1.3;
    letter-spacing: -0.015em;
    font-family: var(--font-regular);
  }
}
```

### UI Text Scale — Composite Groups

```css
:root {
  /* ── Large body ── extracted: high confidence */
  --text-style-large: {
    font-family: var(--font-regular);
    font-size: 1.0625rem;   /* 17px */
    font-weight: var(--font-weight-normal);
    line-height: 1.6;
    letter-spacing: 0;
  }

  /* ── Regular body ── extracted: high confidence */
  --text-style-regular: {
    font-family: var(--font-regular);
    font-size: 0.9375rem;   /* 15px */
    font-weight: var(--font-weight-normal);
    line-height: 1.6;
    letter-spacing: -0.011em;
  }

  /* ── Small ── extracted: high confidence */
  --text-style-small: {
    font-family: var(--font-regular);
    font-size: 0.875rem;    /* 14px */
    font-weight: var(--font-weight-normal);
    line-height: 1.5;       /* 21/14 */
    letter-spacing: -0.013em;
  }

  /* ── Mini (nav labels, tags) ── extracted: high confidence */
  --text-style-mini: {
    font-family: var(--font-regular);
    font-size: 0.8125rem;   /* 13px */
    font-weight: var(--font-weight-normal);
    line-height: 1.5;
    letter-spacing: -0.01em;
  }

  /* ── Micro (captions, timestamps) ── extracted: high confidence */
  --text-style-micro: {
    font-family: var(--font-regular);
    font-size: 0.75rem;     /* 12px */
    font-weight: var(--font-weight-normal);
    line-height: 1.4;
    letter-spacing: 0;
  }

  /* ── Tiny (badges, overlines) ── extracted: high confidence */
  --text-style-tiny: {
    font-family: var(--font-regular);
    font-size: 0.625rem;    /* 10px */
    font-weight: var(--font-weight-normal);
    line-height: 1.5;
    letter-spacing: -0.015em;
  }
}
```

### Typography Pairing Rules
- **Hero sections:** H1 (64px / weight 510) + body large (17px / weight 400)
- **Feature sections:** H2 (40px) in muted `--color-text-secondary` + H3 (20px) in `--color-text-heading`
- **App UI:** Title-1 (17px) for panel headings; Mini (13px) for metadata and labels
- **Code blocks / monospace:** Always `var(--font-monospace)` — never Inter for code
- **Display serif:** `Tiempos Headline` is for editorial pull-quotes and marketing only — NEVER in app UI

---

## 4. Spacing & Layout

```css
:root {
  /* ── Base unit: 4px ── */
  --space-0:  0px;
  --space-px: 1px;   /* hairline */
  --space-1:  4px;   /* Tight internal gaps: icon margins */
  --space-2:  8px;   /* Component internal padding (compact) */
  --space-3:  12px;  /* Input padding, list item gaps */
  --space-4:  16px;  /* Default horizontal padding, button padding */
  --space-5:  20px;  /* Section internal rhythm */
  --space-6:  24px;  /* Card padding, column gaps */
  --space-7:  28px;  /* Card padding-bottom (computed) */
  --space-8:  32px;  /* Page inset, section spacing */
  --space-10: 40px;  /* Large section internal gap */
  --space-12: 48px;  /* Section separators */
  --space-14: 56px;  /* Tall component height */
  --space-16: 64px;  /* Page block padding, section breaks */
  --space-20: 80px;  /* Large vertical rhythm */
  --space-24: 96px;  /* Extra-large section spacing */

  /* ── Border radius ── extracted: high confidence */
  --radius-4:   4px;    /* Buttons, inputs, chips */
  --radius-6:   6px;    /* Small modals, dropdowns */
  --radius-8:   8px;    /* Cards, panels */
  --radius-12:  12px;   /* Large cards */
  --radius-16:  16px;   /* Modal corners (max for chrome) */
  --radius-24:  24px;   /* Feature highlight containers */
  --radius-32:  32px;   /* Decorative containers (rare) */
  --radius-pill: 9999px; /* Tags, badges, pill buttons */
  --radius-circle: 50%; /* Avatar / icon roundels */
  /* Aliases for semantic use */
  --radius-sm:  var(--radius-4);
  --radius-md:  var(--radius-8);
  --radius-lg:  var(--radius-12);
  --radius-xl:  var(--radius-16);

  /* ── Page Layout ── extracted: high confidence */
  --header-height:          72px;
  --page-padding-inline:    24px;
  --page-padding-block:     64px;
  --page-max-width:         1024px;    /* App / docs content max-width */
  --prose-max-width:        624px;     /* Long-form reading column */
  --page-inset:             32px;      /* Interior panel inset */

  /* ── Homepage / Marketing Layout ── extracted: high confidence */
  --homepage-outer-padding: 46px;
  --homepage-max-width:     calc(1344px + var(--homepage-outer-padding) * 2);
  --homepage-padding-inset: 32px;

  /* ── Grid ── extracted: high confidence */
  --grid-columns: 12;
  --1fr: minmax(0, 1fr);  /* Standard CSS grid column definition */

  /* ── Tap targets ── extracted: high confidence */
  --min-tap-size: 44px;   /* Minimum interactive element size (WCAG) */
}
```

### Breakpoints
> *Breakpoints reconstructed from layout conventions. Moderate confidence.*

| Name | Min-width | Use |
|---|---|---|
| `sm` | `640px` | Mobile landscape + |
| `md` | `768px` | Tablet + |
| `lg` | `1024px` | Desktop (page-max-width threshold) |
| `xl` | `1280px` | Wide layout |
| `2xl` | `1440px` | Homepage max-width region |

### Layout Decision Rules
- **12-column CSS grid** at `--page-max-width` (1024px); below that, single column with `--page-padding-inline` gutters
- **Flexbox** for single-axis component layouts (nav, button groups, card rows)
- **CSS Grid** for two-dimensional page layouts and feature grids
- Safe-area insets respected on page edges: `max(env(safe-area-inset-left), var(--page-padding-inline))`

---

## 5. Component Patterns

### 5.1 Primary Button

**Anatomy:** `[icon?] [label]` — single surface, no borders

| State | Background | Text | Border | Extra |
|---|---|---|---|---|
| Default | `--color-action-primary` (#5e6ad2) | `--color-text-invert` | none | — |
| Hover | `--color-action-primary-hover` (#6e7ae2) | same | none | cursor: pointer |
| Active | `--color-action-primary-active` (#4d58c8) | same | none | scale(0.98) |
| Focus-visible | `--color-action-primary` | same | 2px `--color-focus-ring` | outline-offset: 2px |
| Disabled | `--color-action-primary` at 0.4 opacity | same | none | cursor: not-allowed |
| Loading | `--color-action-primary` | hidden | none | spinner overlay |

```tsx
// components/Button.tsx
import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`btn btn--${variant}`}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <span className="btn__spinner" aria-hidden="true" />
      ) : null}
      <span className={loading ? 'btn__label btn__label--hidden' : 'btn__label'}>
        {children}
      </span>
    </button>
  );
}

/*
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  min-height: var(--min-tap-size);            /* 44px — WCAG tap target */
  padding: var(--space-2) var(--space-4);
  border: none;
  border-radius: var(--radius-sm);            /* 4px */
  font-family: var(--font-regular);
  font-size: 0.8125rem;                        /* 13px — mini scale */
  font-weight: var(--font-weight-medium);      /* 510 */
  line-height: 1.5;
  letter-spacing: -0.01em;
  cursor: pointer;
  text-decoration: none;
  transition:
    background var(--speed-quick) var(--ease-out),
    color var(--speed-quick) var(--ease-out),
    transform var(--speed-quick) var(--ease-out),
    opacity var(--speed-quick) var(--ease-out);
  position: relative;
  white-space: nowrap;
}

/* Primary */
.btn--primary {
  background: var(--btn-primary-bg);
  color: var(--btn-primary-text);
}
.btn--primary:hover:not(:disabled) { background: var(--btn-primary-bg-hover); }
.btn--primary:active:not(:disabled) {
  background: var(--btn-primary-bg-active);
  transform: scale(0.98);
}

/* Secondary */
.btn--secondary {
  background: var(--btn-secondary-bg);
  color: var(--btn-secondary-text);
}
.btn--secondary:hover:not(:disabled) { background: var(--btn-secondary-bg-hover); }

/* Ghost */
.btn--ghost {
  background: var(--btn-ghost-bg);
  color: var(--btn-ghost-text);
}
.btn--ghost:hover:not(:disabled) { background: var(--btn-ghost-bg-hover); }

/* Shared states */
.btn:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 2px;
}
.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Loading */
.btn__label--hidden { visibility: hidden; }
.btn__spinner {
  position: absolute;
  width: 14px;
  height: 14px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: var(--radius-circle);
  animation: spin 0.6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
*/
```

---

### 5.2 Card

**Anatomy:** `[surface] → [header?] + [body] + [footer?]`

| State | Background | Border | Shadow |
|---|---|---|---|
| Default | `--card-bg` (#0f1011) | `1px solid --color-border-default` | none |
| Hover | `--color-bg-elevated` (#161718) | `1px solid --color-border-subtle` | none |
| Selected | `--color-bg-elevated` | `1px solid --color-action-primary` | none |

```tsx
// components/Card.tsx
interface CardProps {
  children: React.ReactNode;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

export function Card({ children, selected, onClick, className }: CardProps) {
  return (
    <div
      className={[
        'card',
        selected ? 'card--selected' : '',
        onClick ? 'card--interactive' : '',
        className,
      ].filter(Boolean).join(' ')}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
}

/*
.card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--card-radius);          /* 8px */
  padding: 0 var(--space-6) var(--space-7);   /* 0 24px 28px — from computed */
  