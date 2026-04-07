# Test Design System

> Quick reference for AI coding agents.

## Quick Reference

| Token | Value | Usage |
|-------|-------|-------|
| `--color-primary` | #6750A4 | Primary brand colour |
| `--color-surface` | #FFFBFE | App background |
| `--font-body-size` | 16px | Body text size |
| `--space-4` | 16px | Standard spacing |

## Colours

```css
:root {
  --color-primary: #6750A4;
  --color-on-primary: #FFFFFF;
  --color-surface: #FFFBFE;
  --color-on-surface: #1C1B1F;
  --color-error: #B3261E;
}
```

### Dark Mode

```css
[data-theme="dark"] {
  --color-primary: #D0BCFF;
  --color-surface: #1C1B1F;
  --color-on-surface: #E6E1E5;
}
```

## Typography

```css
:root {
  --font-family: 'Roboto', sans-serif;
  --font-display-size: 36px;
  --font-display-weight: 700;
  --font-display-line-height: 44px;
  --font-body-size: 16px;
  --font-body-weight: 400;
  --font-body-line-height: 24px;
  --font-caption-size: 12px;
}
```

## Spacing

```css
:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
}
```

## Components

### Button

Primary action button with rounded corners.

```tsx
<Button variant="filled" label="Submit" />
```

### Card

Surface container with elevation.

```tsx
<Card elevation={1}>Content here</Card>
```

## Anti-patterns

- NEVER hardcode `#6750A4` — use `var(--color-primary)`
- NEVER use `px` values not on the 4px grid
- NEVER use `Arial` or `Helvetica` — use design system font
