# Testing Plan: Extraction & Export Improvements

**Date:** 2026-04-07
**Branch:** staging
**Context:** No automated test suite exists. All testing is manual via the staging environment.

---

## Phase 1: Extraction Fidelity

### 1.1 Typography — textCase, lineHeight%, textDecoration

**Setup:** Use a Figma file with text styles that have UPPERCASE, lowercase, and Title Case transforms. Also include styles with percentage line heights (not px).

**Steps:**
1. Go to staging.layout.design
2. Paste the Figma file URL and extract
3. Open Studio, go to Source Panel > Tokens tab
4. Filter to Typography tokens

**Expected:**
- [ ] Typography tokens include `text-transform: uppercase` where Figma style has UPPER case
- [ ] Typography tokens include `text-transform: lowercase` where Figma style has LOWER case
- [ ] Typography tokens include `text-transform: capitalize` where Figma style has TITLE case
- [ ] Line height shows as percentage (e.g. `line-height: 150%`) when Figma uses % not px
- [ ] Line height still shows px when Figma uses px values (no regression)
- [ ] Text decoration appears when styles have underline/strikethrough

### 1.2 Gradients — Full CSS gradient extraction

**Setup:** Use a Figma file with:
- Linear gradients (various angles)
- Radial gradients
- Angular gradients (conic)
- Multi-stop gradients (3+ colour stops)

**Steps:**
1. Extract the file
2. Check colour tokens in Source Panel

**Expected:**
- [ ] Linear gradients show as `linear-gradient(Xdeg, #color1 0%, #color2 100%)`
- [ ] Radial gradients show as `radial-gradient(circle, ...)`
- [ ] Angular gradients show as `conic-gradient(...)`
- [ ] Multi-stop gradients include ALL stops with positions, not just the first
- [ ] Solid fills still extract correctly (no regression)

### 1.3 Blur Effects

**Setup:** Figma file with layer blur and background blur effects.

**Steps:**
1. Extract the file
2. Check effect tokens

**Expected:**
- [ ] Layer blur shows as `blur(Xpx)` (for use with `filter:`)
- [ ] Background blur shows as `backdrop-blur(Xpx)` (for use with `backdrop-filter:`)
- [ ] Drop shadows and inner shadows still extract correctly (no regression)

### 1.4 Component Property Defaults

**Setup:** Figma file with components that have:
- Variant properties with multiple options (e.g. Size: small/medium/large)
- Boolean properties (e.g. showIcon: true/false)
- Text properties with defaults
- Instance swap properties

**Steps:**
1. Extract the file
2. Check components list in Source Panel
3. Generate layout.md and check Component Patterns section

**Expected:**
- [ ] Component properties show defaultValue (e.g. `size: "medium"`)
- [ ] Component properties show preferredValues (e.g. `["small", "medium", "large"]`)
- [ ] Boolean defaults show as `"true"` or `"false"` strings
- [ ] layout.md Component section references default values

### 1.5 Auto-Layout Patterns

**Setup:** Figma file with auto-layout frames using:
- Horizontal layout with various alignments
- Vertical layout with various alignments
- Nested auto-layout

**Steps:**
1. Extract the file
2. Check layout.md Section 4 (Spacing & Layout)

**Expected:**
- [ ] layout.md mentions common flex patterns found (e.g. "Vertical stack with center alignment")
- [ ] Spacing tokens still extract correctly (no regression)

### 1.6 Truncation Warnings

**Setup:** Use a large Figma file (design system with 500+ styles or 100+ components). Material 3 or similar.

**Steps:**
1. Extract the file
2. Watch the extraction progress overlay

**Expected:**
- [ ] Warning message appears when styles > 500: "X styles found but only first 500 extracted"
- [ ] Warning message appears when components > 100: "X components found but only first 100 enriched"
- [ ] Warnings are visible in the progress UI, not just console

---

## Phase 2: Export Quality

### 2.1 Multi-Mode / Dark Mode Tokens

**Setup:** Figma file using Variables with multiple modes (light/dark). Requires Enterprise plan, or use the Figma plugin to push variables.

**Steps:**
1. Extract the file
2. Export as tokens.css
3. Export as tokens.json
4. Export as tailwind.config.js

**Expected (tokens.css):**
- [ ] Default `:root { }` block contains light mode tokens (or tokens without a mode)
- [ ] `[data-theme="dark"] { }` block contains dark mode tokens
- [ ] `@media (prefers-color-scheme: dark) { :root { } }` block exists for dark tokens
- [ ] CSS variables use the base name (not suffixed with `-dark`)

**Expected (tokens.json):**
- [ ] Mode information preserved (check for `$extensions` or mode grouping)

**Expected (tailwind.config.js):**
- [ ] Config is valid JavaScript
- [ ] Dark mode tokens accessible

### 2.2 Complete Tailwind Config

**Setup:** Any extracted Figma file with colours, typography, spacing, radius, effects, and motion tokens.

**Steps:**
1. Extract and export as tailwind.config.js
2. Open the generated file

**Expected:**
- [ ] `theme.extend.colors` populated with colour tokens as `var(--name)`
- [ ] `theme.extend.spacing` populated with spacing tokens
- [ ] `theme.extend.borderRadius` populated with radius tokens
- [ ] `theme.extend.fontFamily` populated with extracted font families
- [ ] `theme.extend.fontSize` populated with extracted sizes
- [ ] `theme.extend.fontWeight` populated with extracted weights
- [ ] `theme.extend.lineHeight` populated (if line heights extracted)
- [ ] `theme.extend.letterSpacing` populated (if letter spacing extracted)
- [ ] `theme.extend.boxShadow` populated with effect tokens
- [ ] `theme.extend.transitionDuration` populated (if motion tokens exist)
- [ ] `theme.extend.transitionTimingFunction` populated (if easing tokens exist)
- [ ] No duplicate entries in any category
- [ ] File is valid JS (paste into a project and run `node -e "require('./tailwind.config')"`)

### 2.3 Motion Tokens in Exports

**Setup:** Figma file or website extraction that includes motion/animation tokens.

**Steps:**
1. Extract and export in all formats

**Expected:**
- [ ] tokens.css includes `/* === MOTION === */` section with `--motion-*` or `--duration-*` variables
- [ ] tokens.json includes `"motion"` group with `$type: "duration"` or `$type: "cubicBezier"`
- [ ] tailwind.config.js includes motion in `transitionDuration` / `transitionTimingFunction`

### 2.4 Composite Typography in tokens.json

**Steps:**
1. Extract any file with typography styles
2. Export as tokens.json

**Expected:**
- [ ] Typography tokens have `$type: "typography"` (NOT `"fontFamily"`)
- [ ] Typography `$value` is a structured object: `{ fontFamily, fontSize, fontWeight, lineHeight, letterSpacing }`
- [ ] fontWeight is numeric (e.g. `400`) not a string
- [ ] Non-typography tokens still export correctly (no regression)

### 2.5 Variable Alias Resolution

**Setup:** Figma file with variables that alias other variables (e.g. `color/primary` references `blue/500`).

**Steps:**
1. Extract the file
2. Check CSS variables output

**Expected:**
- [ ] Aliased variables resolve to the final value (not left as a reference)
- [ ] Token descriptions note the alias chain (e.g. "Aliases blue/500")
- [ ] Circular aliases don't crash extraction (cycle detection works)

---

## Phase 3: Compliance & Health Scoring

### 3.1 Expanded Health Score Checks

**Setup:** Use the Explorer to generate variants with intentional issues.

**Test: Interactive states**
1. Generate a button component variant that lacks hover/focus states
2. Check health score

**Expected:**
- [ ] Warning about missing interactive states appears
- [ ] Score penalty applied (-10)
- [ ] Variant with all states (hover, focus, disabled, active) scores higher

**Test: Accessibility**
1. Generate a variant with `<img>` tags missing `alt` attributes
2. Generate a variant using semantic HTML (`<main>`, `<nav>`, `<section>`)

**Expected:**
- [ ] Missing alt attribute flagged as warning
- [ ] Semantic HTML gives +5 bonus
- [ ] Score reflects accessibility issues

**Test: Motion compliance**
1. Extract a design system with motion tokens
2. Generate a variant with hardcoded `transition: 0.3s ease`
3. Generate a variant using `var(--duration-normal)`

**Expected:**
- [ ] Hardcoded transition flagged, -5 penalty
- [ ] Token-based transition gets +5 bonus

**Test: Typography compliance**
1. Extract a design system specifying Inter as the font
2. Generate a variant that uses Arial or sans-serif

**Expected:**
- [ ] System font flagged when design system defines custom fonts
- [ ] -5 penalty applied

**Test: Responsive patterns**
1. Generate a full page layout with no responsive classes

**Expected:**
- [ ] Warning about missing responsive patterns
- [ ] -5 penalty for complex layouts without sm:/md:/lg: classes

### 3.2 Expanded Completeness Scoring

**Steps:**
1. Extract a Figma file and generate layout.md
2. Open Quality tab in Source Panel
3. Check the section breakdown

**Expected:**
- [ ] 10 sections scored (up from 6): Quick Reference, Colours, Typography, Spacing, Components, Anti-patterns, Motion, Accessibility, Icons, Grid & Layout
- [ ] Weights sum to 100% (10 + 15 + 12 + 8 + 20 + 10 + 8 + 7 + 5 + 5)
- [ ] New sections show suggestions when content is missing
- [ ] Overall score reflects the new dimensions
- [ ] A complete layout.md with all sections scores 90+

---

## Regression Tests

These must still work correctly after all changes:

### Extraction
- [ ] Basic Figma extraction with a simple file (colours, typography, no gradients) works
- [ ] Website extraction via URL still works
- [ ] Re-extraction with diff modal still works
- [ ] Extraction with invalid/expired Figma token shows helpful error
- [ ] Extraction with non-Enterprise plan skips variables gracefully

### Exports
- [ ] ZIP bundle download works
- [ ] CLAUDE.md export contains Quick Reference section
- [ ] .cursor/rules export generates valid MDC files
- [ ] AGENTS.md export follows the standard

### Explorer
- [ ] Variant generation still works
- [ ] Health scores appear on generated variants
- [ ] Refinement (follow-up prompts) still works
- [ ] Image upload for reference still works

### Studio
- [ ] Monaco editor loads layout.md correctly
- [ ] Source Panel tabs all work (Tokens, Components, Screenshots, Quality, Saved)
- [ ] Export modal shows all format options

---

## Test Figma Files

Recommended files for testing (use your own Figma token):

1. **Simple file:** A file with 5-10 colour styles, 3-4 text styles, a few components
2. **Material 3:** Google's Material Design 3 Figma file (large, 500+ styles, 100+ components)
3. **Gradient-heavy:** A file with linear, radial, and angular gradients
4. **Variables file:** A file using Figma Variables with light/dark modes (Enterprise)
5. **Auto-layout file:** A file with complex auto-layout nesting and alignment patterns

---

## UI Visibility Tests

### Gradient swatch preview
- [ ] Colour tokens with gradient values show a small coloured swatch (not truncated text)
- [ ] Solid colour tokens still show normally (regression check)

### Component property defaults
- [ ] Components tab shows property pills (e.g. `size: VARIANT = medium`)
- [ ] Components without properties still render correctly

### Mode filter pills
- [ ] Source Panel shows All/Default/Light/Dark pills when multi-mode tokens exist
- [ ] Clicking a pill filters tokens to that mode only
- [ ] "All" shows all tokens

### Mode badges
- [ ] Tokens with a mode show a small LIGHT/DARK badge
- [ ] Re-extraction diff modal shows mode badges on changed tokens

### Health tooltip
- [ ] Hover a variant's health score badge
- [ ] Tooltip groups issues by rule name with severity markers
- [ ] Shows "Strong/Moderate/Needs work" label

### Scan Project (Connect tab)
- [ ] Open Source Panel > Connect tab
- [ ] "Scan existing components" section visible
- [ ] Enter a project path, select type, click Scan
- [ ] Results show found components with file paths
- [ ] Error state works (invalid path)

### Quality tab (10 sections)
- [ ] Open Quality tab
- [ ] 10 sections visible: Quick Reference, Colours, Typography, Spacing, Components, Anti-patterns, Motion, Accessibility, Icons, Grid & Layout
- [ ] Each section expandable with found/missing items

---

## Quick Smoke Test (5 minutes)

1. Extract a Figma file with typography and gradients
2. Check typography tokens show text-transform; gradient tokens show swatch preview
3. Check Components tab shows property defaults as pills
4. Export tailwind.config.js: verify fontFamily/fontSize/fontWeight
5. Export tokens.json: verify `$type: "typography"` with structured values
6. Open Quality tab: verify 10 sections scored
7. Generate a variant: hover health score, verify grouped issue breakdown
8. If multi-mode: check mode filter pills and badges work
