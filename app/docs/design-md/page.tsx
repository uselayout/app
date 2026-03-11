import type { Metadata } from "next";
import Link from "next/link";
import { CopyBlock } from "@/components/shared/CopyBlock";
import { Callout } from "@/components/docs/Callout";
import { getAdjacentPages } from "@/lib/docs/navigation";

export const metadata: Metadata = {
  title: "DESIGN.md Specification — Layout Docs",
  description:
    "Complete reference for the DESIGN.md format: the structured, LLM-optimised context file that Layout generates from your design system.",
};

const quickReferenceExample = `## Quick Reference

**Design language:** Dark, precise, developer-focused. No gradients. No decorative elements.

### Core colour tokens
\`\`\`css
--color-bg-app: #0C0C0E;
--color-bg-surface: #17171C;
--color-bg-elevated: #1E1E24;
--color-primary: #6366F1;
--color-primary-hover: #7577F3;
--text-primary: #E8E8F0;
--text-secondary: rgba(232,232,240,0.55);
--border: rgba(255,255,255,0.07);
\`\`\`

### Core typography
- **UI text:** Geist, 14px/1.5, weight 400
- **Headings:** Geist, 24–32px, weight 700
- **Code/mono:** Geist Mono, 13px/1.6

### Button — primary variant
\`\`\`tsx
<button className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg
  hover:bg-[var(--color-primary-hover)] transition-all duration-150
  focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:outline-none
  disabled:opacity-40 disabled:cursor-not-allowed">
  Get started
</button>
\`\`\`

### NEVER rules
1. NEVER use raw hex values — always CSS variables
2. NEVER use box-shadow for elevation — use background colour difference
3. NEVER use font-size below 12px
4. NEVER use opacity for disabled — use the disabled token`;

const colourSystemExample = `## Colour System

### Tier 1 — Primitives
Raw colour values. Never use directly in components.
\`\`\`css
--primitive-indigo-500: #6366F1;
--primitive-indigo-400: #7577F3;
--primitive-gray-950: #0C0C0E;
--primitive-gray-900: #111115;
\`\`\`

### Tier 2 — Semantic aliases
Intent-based names that map to primitives.
\`\`\`css
--color-primary: var(--primitive-indigo-500);
--color-bg-app: var(--primitive-gray-950);
--color-bg-surface: var(--primitive-gray-900);
\`\`\`

### Tier 3 — Component tokens
State-specific tokens for individual components.
\`\`\`css
--button-primary-bg: var(--color-primary);
--button-primary-bg-hover: var(--color-primary-hover);
--button-primary-text: var(--color-text-on-primary);
\`\`\``;

const typographyExample = `## Typography System

### Token format — always composites
\`\`\`
body-md:
  font-family: "Geist", system-ui, sans-serif
  font-size: 14px
  font-weight: 400
  line-height: 1.5
  letter-spacing: 0

heading-lg:
  font-family: "Geist", system-ui, sans-serif
  font-size: 32px
  font-weight: 700
  line-height: 1.25
  letter-spacing: -0.02em
\`\`\`

### Pairing rules
- Use heading-sm through heading-xl for page headings — never raw font-size values
- Pair heading tokens with body-md or body-sm for supporting text
- Mono tokens (code-sm, code-md) for all code, terminal output, and token names`;

const componentExample = `## Component Patterns

### Button

**Anatomy:** [container] > [icon?] [label] [icon?]

**Token mappings**
| State    | Background                    | Text               | Border          |
|----------|-------------------------------|-------------------|-----------------|
| default  | --button-primary-bg           | --text-on-primary  | none            |
| hover    | --button-primary-bg-hover     | --text-on-primary  | none            |
| focus    | --button-primary-bg           | --text-on-primary  | --border-focus  |
| active   | --button-primary-bg-active    | --text-on-primary  | none            |
| disabled | --button-primary-bg (40% opacity) | --text-on-primary  | none        |
| loading  | --button-primary-bg           | transparent        | none            |

**TSX example**
\`\`\`tsx
interface ButtonProps {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

export function Button({ variant = "primary", size = "md", loading, disabled, children, onClick }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        variant === "primary" && "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]",
        variant === "secondary" && "bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border)]",
        size === "sm" && "text-sm px-3 py-1.5 h-8",
        size === "md" && "text-sm px-4 py-2 h-9",
        size === "lg" && "text-base px-5 py-2.5 h-11",
      )}
    >
      {loading ? <Spinner size={14} /> : children}
    </button>
  );
}
\`\`\``;

const antiPatternsExample = `## Anti-Patterns & Constraints

### Rule 1 — No hardcoded colour values
❌ NEVER: \`color: #6366F1\`, \`className="text-indigo-500"\`
✅ DO: \`color: var(--color-primary)\`, \`className="text-[var(--color-primary)]"\`
**Why it fails:** Hardcoded values break when the design system updates. Tokens are the single source of truth.

### Rule 2 — No box-shadow for elevation
❌ NEVER: \`box-shadow: 0 4px 12px rgba(0,0,0,0.3)\`
✅ DO: Use a darker/lighter background token from the elevation scale
**Why it fails:** Shadows look broken on dark backgrounds and are impossible to theme.

### Rule 3 — No arbitrary spacing
❌ NEVER: \`padding: 13px\`, \`margin-top: 7px\`
✅ DO: Use spacing tokens from the defined scale (4, 8, 12, 16, 20, 24, 32, 40, 48, 64px)
**Why it fails:** Off-scale values create visual inconsistency that accumulates across components.`;

const tokenTypesRows = [
  {
    type: "Colour",
    examples: "--color-primary: #6366F1, --color-bg-surface: #17171C",
    format: "Hex, RGB, or HSL",
  },
  {
    type: "Typography",
    examples: "body-md: { font-family, size, weight, line-height, letter-spacing }",
    format: "Composite object — never individual properties",
  },
  {
    type: "Spacing",
    examples: "--space-4: 16px, --space-8: 32px",
    format: "px values on a 4px base unit",
  },
  {
    type: "Radius",
    examples: "--radius-md: 8px, --radius-full: 9999px",
    format: "px values",
  },
  {
    type: "Effect",
    examples: "--shadow-lg: 0 10px 15px rgba(0,0,0,0.1)",
    format: "CSS shadow shorthand",
  },
];

const sections = [
  {
    number: "0",
    title: "Quick Reference",
    badge: "50–75 lines",
    description:
      "A dense, copy-pasteable summary of the entire design system. Structured so an agent can drop it directly into CLAUDE.md or .cursorrules without including the full file. Contains: the top 8–12 colour tokens, the primary typography group, one complete component example with all states, and the critical NEVER rules.",
    callout: {
      type: "tip" as const,
      text: "This section is what the agent uses most. Keep it under 75 lines so it fits comfortably within a system prompt without eating too much of the context window.",
    },
    example: quickReferenceExample,
  },
  {
    number: "1",
    title: "Design Direction & Philosophy",
    badge: "Prose",
    description:
      "Personality and aesthetic intent in plain language. Describes what the design system is trying to feel like, what it explicitly rejects, and what category of product it belongs to. This section tells the agent whether to reach for rounded corners or sharp edges, saturated or muted colours, dense or airy layouts — without giving explicit rules.",
    callout: {
      type: "info" as const,
      text: 'Example entry: "Dark, precise, developer-focused. Influenced by Linear and Vercel. Rejects: decorative gradients, rounded-pill buttons, bright accent colours. Accepts: monochrome palettes, tight spacing, clear hierarchy."',
    },
    example: null,
  },
  {
    number: "2",
    title: "Colour System",
    badge: "Three tiers",
    description:
      "Colour tokens are structured across three tiers to enforce correct usage. Agents should only ever reference Tier 2 (semantic) or Tier 3 (component) tokens in generated code — never Tier 1 primitives directly. This mirrors how professional design systems work and prevents hardcoded values from creeping into components.",
    callout: {
      type: "warning" as const,
      text: "Tier 1 primitive tokens (raw hex values) are listed for reference only. They should never appear in component code. Always use the semantic alias.",
    },
    example: colourSystemExample,
  },
  {
    number: "3",
    title: "Typography System",
    badge: "Composite groups",
    description:
      "Typography tokens are always defined as composite groups — a single named token that bundles font-family, size, weight, line-height, and letter-spacing together. Individual properties (font-size: 14px) are not valid tokens. This prevents the common mistake of agents mixing and matching properties from different type scales, which destroys typographic hierarchy.",
    callout: {
      type: "warning" as const,
      text: "Typography tokens are always composites. Never list font-size, font-weight, or line-height as standalone tokens — they must always appear as part of a named composite group like body-md or heading-lg.",
    },
    example: typographyExample,
  },
  {
    number: "4",
    title: "Spacing & Layout",
    badge: "Scale + grid",
    description:
      "Defines the base unit (typically 4px), the full spacing scale, the grid system (column count, gutter, margin), responsive breakpoints, and explicit rules for when to use flexbox vs CSS grid. Agents use this section to ensure spacing is always on-scale and layouts are predictably responsive.",
    callout: {
      type: "info" as const,
      text: "Spacing scale values are always multiples of the base unit. Any spacing value that does not appear in the scale is a violation of the design system and will be flagged by check_compliance.",
    },
    example: null,
  },
  {
    number: "5",
    title: "Page Structure & Layout Patterns",
    badge: "From screenshots",
    description:
      "Derived from the full-page and viewport screenshots captured during extraction. Documents recurring layout patterns — nav placement, sidebar widths, hero sections, card grids — with annotated measurements. This gives agents a reference for how full pages are assembled from the available components, not just how individual components look in isolation.",
    callout: {
      type: "tip" as const,
      text: "This section is only populated when screenshots were captured during extraction (website extraction always includes them; Figma extraction requires explicit screenshot capture in the source file).",
    },
    example: null,
  },
  {
    number: "6",
    title: "Component Patterns",
    badge: "5–10 components",
    description:
      "The most detailed section. Each component entry includes: anatomy (the DOM structure), token mappings for every state (default, hover, focus, active, disabled, loading, error), and one complete TSX example using the design system tokens. Agents should always call get_component before building a component that exists here — this section defines the canonical implementation.",
    callout: {
      type: "info" as const,
      text: "Every state must be mapped. Components with unmapped states (e.g. no disabled token defined) are considered incomplete and will be flagged in the compliance check.",
    },
    example: componentExample,
  },
  {
    number: "7",
    title: "Elevation & Depth",
    badge: "Shadow + z-index",
    description:
      "Defines how depth is expressed without box-shadow. In dark design systems, elevation is almost always achieved through background colour — darker = lower, lighter = higher. This section documents the elevation scale, the corresponding background tokens, border behaviour at each level, and the z-index scale for layered UI elements like modals, tooltips, and drawers.",
    callout: {
      type: "warning" as const,
      text: "Do not use box-shadow to create elevation unless the design system explicitly defines shadow tokens at each elevation level. Most dark design systems do not.",
    },
    example: null,
  },
  {
    number: "8",
    title: "Motion",
    badge: "Timing + easing",
    description:
      "Timing functions, duration values, and easing tokens for transitions and animations. Includes: the base duration (typically 150ms), the full duration scale for complex animations, named easing curves (ease-out, spring, etc.), and rules for which interaction types use which duration. Agents use this section to write consistent transition CSS.",
    callout: null,
    example: null,
  },
  {
    number: "9",
    title: "Anti-Patterns & Constraints",
    badge: "NEVER rules",
    description:
      "Numbered rules that define what must never appear in generated code. Each rule has three parts: what is forbidden, why it fails (the actual reason, not just 'it looks bad'), and what to do instead. This is the section the check_compliance tool validates against. Well-written anti-pattern rules dramatically reduce the correction loop between agent output and production-ready code.",
    callout: {
      type: "tip" as const,
      text: "Write anti-patterns as precise, machine-checkable rules. Vague rules like 'avoid harsh colours' cannot be validated. Precise rules like 'NEVER use a colour value not present in the colour token system' can.",
    },
    example: antiPatternsExample,
  },
];

export default function DesignMdPage() {
  const { prev, next } = getAdjacentPages("/docs/design-md");

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-[#0a0a0a]">
          DESIGN.md Specification
        </h1>
        <p className="text-base text-gray-600 leading-relaxed">
          The DESIGN.md file is the core output of Layout. It follows a
          strict structure optimised for LLM consumption — not for humans to
          read, but for AI agents to parse reliably and reference consistently
          when generating UI code.
        </p>
        <p className="text-base text-gray-600 leading-relaxed">
          Every DESIGN.md produced by Layout Studio follows the same
          9-section + 2-appendix format. This predictability means agents
          always know where to find what they need, and the MCP tools can
          return specific sections on demand without the agent having to search
          for them.
        </p>
        <Callout type="info">
          DESIGN.md is always included in every export bundle from AI Studio,
          regardless of which other formats you select. It is the canonical
          source of truth that all other export formats (CLAUDE.md,
          .cursorrules, tokens.css) are derived from.
        </Callout>
      </div>

      {/* Token Types Table */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Token Types</h2>
        <p className="text-base text-gray-600 leading-relaxed">
          DESIGN.md works with five categories of design token. Understanding
          the format for each type prevents the most common agent errors.
        </p>
        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left font-medium text-[#0a0a0a] py-3 px-4">
                  Type
                </th>
                <th className="text-left font-medium text-[#0a0a0a] py-3 px-4">
                  Examples
                </th>
                <th className="text-left font-medium text-[#0a0a0a] py-3 px-4">
                  Format notes
                </th>
              </tr>
            </thead>
            <tbody>
              {tokenTypesRows.map((row, i) => (
                <tr
                  key={row.type}
                  className={
                    i < tokenTypesRows.length - 1
                      ? "border-b border-gray-200"
                      : ""
                  }
                >
                  <td className="py-3 px-4 font-medium text-[#0a0a0a] align-top whitespace-nowrap">
                    {row.type}
                  </td>
                  <td className="py-3 px-4 text-gray-600 font-mono text-xs align-top">
                    {row.examples}
                  </td>
                  <td className="py-3 px-4 text-gray-600 align-top">
                    {row.format}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Section breakdown */}
      <section className="space-y-8">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-[#0a0a0a]">
            Section Breakdown
          </h2>
          <p className="text-base text-gray-600 leading-relaxed">
            Each section serves a specific role in giving an AI agent complete
            and unambiguous design context. The sections are ordered from
            broadest (philosophy) to most specific (anti-patterns), mirroring
            how a developer would naturally consume a design system.
          </p>
        </div>

        {sections.map((section) => (
          <div key={section.number} className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-sm font-bold flex items-center justify-center">
                {section.number}
              </span>
              <h3 className="text-lg font-semibold text-[#0a0a0a]">
                {section.title}
              </h3>
              <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {section.badge}
              </span>
            </div>

            <div className="ml-11 space-y-4">
              <p className="text-base text-gray-600 leading-relaxed">
                {section.description}
              </p>

              {section.callout && (
                <Callout type={section.callout.type}>
                  {section.callout.text}
                </Callout>
              )}

              {section.example && (
                <CopyBlock code={section.example} language="markdown" />
              )}
            </div>
          </div>
        ))}

        {/* Appendices */}
        <div className="space-y-6 pt-4">
          <h3 className="text-lg font-semibold text-[#0a0a0a]">
            Appendix A — Complete Token Reference
          </h3>
          <p className="text-base text-gray-600 leading-relaxed">
            A flat table of every token extracted from the source (Figma file
            or website), with its name, resolved value, type, and the section
            it belongs to. This is the exhaustive reference — the main sections
            only document tokens that appear in components, but Appendix A
            includes everything. Useful for agents doing token lookup when the
            section content does not cover an edge case.
          </p>

          <h3 className="text-lg font-semibold text-[#0a0a0a]">
            Appendix B — Token Source Metadata
          </h3>
          <p className="text-base text-gray-600 leading-relaxed">
            Records where each token came from and how confident the extraction
            was. Each token has a source field (CSS variable, Figma style,
            computed DOM style, etc.), an extraction method, and a confidence
            level (high / medium / low). Tokens with low confidence were
            inferred rather than directly extracted and should be treated as
            approximate. This appendix is primarily useful for debugging
            extraction output and understanding which parts of the design system
            are well-defined versus inferred.
          </p>
          <Callout type="warning">
            Low-confidence tokens are included in Appendix B but excluded from
            the main sections. They will not appear in component token mappings
            or in the Quick Reference. If you see a token in Appendix B that
            you expect to be in the main content, the extraction may need to be
            re-run against the Figma source rather than the website.
          </Callout>
        </div>
      </section>

      {/* Prev / Next */}
      <nav className="flex items-center justify-between pt-8 border-t border-gray-200">
        {prev ? (
          <Link
            href={prev.href}
            className="flex flex-col gap-1 text-indigo-600 hover:underline"
          >
            <span className="text-xs text-gray-400 uppercase tracking-wide">
              Previous
            </span>
            <span className="text-sm font-medium">{prev.title}</span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={next.href}
            className="flex flex-col gap-1 text-right text-indigo-600 hover:underline"
          >
            <span className="text-xs text-gray-400 uppercase tracking-wide">
              Next
            </span>
            <span className="text-sm font-medium">{next.title}</span>
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </div>
  );
}
