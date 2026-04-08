# Design System Extraction & Implementation: Research Report

**Date:** 2026-04-07
**Goal:** Make Layout the best AI design tool on the market

---

## What We Do Well

### Extraction Pipeline
- Robust Figma API integration: rate-limited (100ms), exponential backoff, batched node fetching (max 50), 3 retries with jitter
- Graceful degradation: missing API scopes don't crash, just skip with warnings. Variables API 403 on non-Enterprise is non-fatal
- Colour extraction: SOLID + GRADIENT fills, RGBA with opacity, primitive/semantic categorisation via name heuristics, alias detection
- Spacing/radius mining: intelligent mining from auto-layout nodes, clustered into token scales
- Component inventory: variant grouping via component sets, property type extraction, description capture
- Variables extraction: multi-mode support with mode-name suffixes
- Re-extraction diffing: visual diff modal with accept/discard

### layout.md Synthesis
- 104-line system prompt enforcing three-tier token architecture (primitive > semantic > component)
- 10 structured sections + 2 appendices
- Production-ready TSX examples per component
- Preserves original CSS variable names

### Export & Distribution
- 6 export formats: tokens.css, tokens.json (W3C DTCG), tailwind.config.js, CLAUDE.md, .cursor/rules, AGENTS.md
- 7 MCP tools for AI agent access
- Broad AI agent support: Claude Code, Cursor, Copilot, Windsurf, Codex, Jules

### Explorer
- Multi-variant generation (2-6 variants) with genuine layout differences
- Strict design system compliance in prompts
- Image upload for reference
- Per-variant health scoring

---

## What Can Be Improved

### Figma Extraction Gaps

| Gap | Current State | What Designers Expect | Impact |
|-----|--------------|----------------------|--------|
| Typography textCase | Field exists but ignored | UPPERCASE, lowercase, capitalize in generated code | High |
| Line height % | Only lineHeightPx, percent discarded | Relative line heights for responsive typography | High |
| Full gradients | Only first stop as flat hex | Full CSS gradient strings with angle, all stops | High |
| Auto-layout mode | Only spacing values, direction ignored | flex-direction, alignment, distribution | High |
| Component prop defaults | Type captured, defaultValue discarded | AI knows Button size defaults to "medium" | Medium |
| Instance swap targets | Type captured, options not resolved | Know which icons/components fit in slots | Medium |
| Blur effects | Only shadows supported | filter: blur() and backdrop-filter: blur() | Medium |
| Variable aliases | A-to-B refs not followed | Semantic tokens reference primitives correctly | Medium |
| Boolean variables | Ignored | Visibility toggles in design | Low |
| Text decoration | Not in interface | Underline, strikethrough | Low |

### Silent Data Loss

- Styles capped at 500 (no prominent warning)
- Components capped at 100 (no warning at all)
- CSS variables capped at 400 in synthesis
- Computed styles capped at 30
- Screenshots capped at 3

### Output Quality Gaps

| Gap | Current State | What's Needed | Impact |
|-----|--------------|--------------|--------|
| Dark mode tokens | Not in any export | :root + [data-theme="dark"] blocks | Critical |
| Motion tokens | Extracted, not exported | All code formats need motion | High |
| Tailwind config | Only colors, spacing, borderRadius | Missing 7+ theme keys | High |
| Composite typography | tokens.json loses structure | W3C DTCG $type: "typography" | High |
| Token cross-references | Literal values only | Semantic alias expressions | Medium |
| Breakpoints | Extracted, not exported | Tailwind screens, CSS media queries | Medium |

### Compliance Gaps

Current: only 4 rules. Missing:
- Spacing scale compliance
- Font family compliance
- Border radius compliance
- Interactive state coverage
- Accessibility contrast (WCAG AA)
- Animation/motion token usage
- Responsive breakpoint validation
- Component naming conventions

Health scoring misses: icons, accessibility, animation, grid, breakpoints

---

## What's Missing Entirely

### 1. Storybook Integration
40%+ of React teams use Storybook. Could extract component props, variants, arg types. Map Storybook components to Figma components. Prevent AI from generating duplicate components.

### 2. Codebase Scanning
Scan user's project for existing React components. Match against design system inventory. AI agents told "Use existing Button from src/components/ui/Button.tsx". Builder.io's key differentiator.

### 3. CI/CD Compliance Gates
`layout check` CLI command + GitHub Action. Block PRs if compliance drops. The stickiness feature. No competitor offers this.

### 4. Figma Code Connect
Read native component-to-code mappings. Enrich layout.md with import paths.

### 5. Real-time Figma Sync
Webhook handler is stubbed (TODO at line 204). Auto re-extraction on file changes.

### 6. Style Dictionary Pipeline
Platform-specific transforms (web, iOS, Android). Industry standard for token builds.

### 7. Multi-Design-System Support
Single .layout/ per project. Enterprise teams need 2-5 systems per org.

---

## Competitive Positioning

| Capability | Layout (Today) | Layout (Goal) | SouthLeft | Figma CC | Builder.io |
|---|---|---|---|---|---|
| Figma extraction | Good | Excellent | Good | Native | None |
| Website extraction | Good | Good | None | None | Good |
| AI agent context | Excellent | Excellent | Good | None | Good |
| Token exports | Partial | Complete | None | None | Partial |
| Compliance | Basic (4) | Comprehensive (12+) | Good (8 dims) | None | None |
| CI/CD gates | None | Yes | None | None | None |
| Codebase awareness | None | Yes | None | Yes | Yes |
| Storybook | None | Yes | None | None | None |
| Multi-mode tokens | None | Yes | None | Native | None |
| Real-time sync | Stubbed | Yes | Yes | Native | None |

**Layout's unique moat:** The only tool that extracts from Figma AND websites, produces AI-optimised context for ALL major coding agents, enforces compliance in CI/CD, AND has codebase awareness.

---

## Implementation Status

- [ ] Phase 1: Extraction fidelity (typography, gradients, blur, auto-layout, props, warnings)
- [ ] Phase 2: Output quality (dark mode, Tailwind config, motion, composite tokens, aliases)
- [ ] Phase 3: Compliance (12+ rules, multi-dimensional scoring)
- [ ] Phase 4: Ecosystem (Storybook, codebase scan, real-time sync, Code Connect) -- future
