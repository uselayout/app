# Layout — Marketing Playbook

**Date:** March 2026 | **Status:** Pre-Alpha | **Goal:** First 50 early adopters

---

## Table of Contents

1. [Product Summary](#1-product-summary)
2. [Mission Statements](#2-mission-statements)
3. [Elevator Pitches](#3-elevator-pitches)
4. [Competitive Positioning: Why Layout over Paper.design / Pencil.dev](#4-competitive-positioning)
5. [Why Figma (Not a New Canvas)](#5-why-figma-not-a-new-canvas)
6. [The Figma Closed Loop — Our Killer Feature](#6-the-figma-closed-loop)
7. [Why This is the Future of Design](#7-why-this-is-the-future-of-design)
8. [Why We Open-Sourced This](#8-why-we-open-sourced-this)
9. [Pre-Alpha Early Adopter Strategy](#9-pre-alpha-early-adopter-strategy)
10. [90-Day Marketing Plan](#10-90-day-marketing-plan)
11. [Content Strategy](#11-content-strategy)
12. [Community Building](#12-community-building)
13. [SEO & Keyword Strategy](#13-seo--keyword-strategy)
14. [Developer Relations](#14-developer-relations)
15. [Outreach & Distribution](#15-outreach--distribution)
16. [Metrics & KPIs](#16-metrics--kpis)

---

## 1. Product Summary

Layout extracts design systems from Figma files and live websites, then compiles them into structured, LLM-optimised context bundles (DESIGN.md) that enable AI coding agents to produce on-brand UI code consistently.

**Two products:**
- **Studio (Web App)** — Paste URL → extract design system → edit DESIGN.md → test with AI → export ZIP bundle
- **CLI/MCP Server (`@layoutdesign/context`)** — MIT open source, 10 MCP tools, serves design context to AI agents

**Key differentiators:**
- Only tool that extracts from both Figma AND live websites
- 9-section DESIGN.md format (not a token dump — semantic, structured, LLM-optimised)
- Full Figma closed loop (code → preview → push to Figma → design in Figma → pull back)
- 10 MCP tools including compliance checking, preview, push-to-figma, design-in-figma
- 6 export formats (DESIGN.md, CLAUDE.md, AGENTS.md, .cursorrules, tokens.css, tokens.json, tailwind.config.js)
- MIT open source CLI, free BYOK tier, Pro at £29/month

---

## 2. Mission Statements

### Punchy one-liners (pick one as primary)

1. **Make AI build on-brand, by default.**
2. **Design systems, compiled for AI.**
3. **Your design system shouldn't be invisible to your AI.**
4. **Close the gap between how your product looks and how your AI builds it.**
5. **The missing context layer between designers and AI agents.**

### Longer form

6. AI coding agents are powerful. They just don't know what your brand looks like. Layout fixes that.
7. We extract your design system, compile it into structured context, and give your AI agent the one thing it's been missing: taste.
8. Every team with a design system deserves AI that builds like they designed it. Layout makes that the default, not the exception.

### Bold / provocative

9. Vibe coding is fine for prototypes. For products, your AI needs to know your design system.
10. Your AI agent is brilliant and completely colour-blind to your brand. We fix the second part.

---

## 3. Elevator Pitches

### 10-second (one sentence)

Layout extracts your design system from Figma or any website and compiles it into structured context that your AI coding agent reads automatically — so everything it builds looks on-brand.

### 30-second

When you ask Claude Code or Cursor to build a UI component, it produces working code with completely the wrong design. It doesn't know your colours, your type scale, your spacing system, or your component conventions. Layout extracts all of that from your Figma file or live website and compiles it into a structured context bundle that your AI agent reads on every prompt. The result is on-brand UI, by default.

### 60-second

AI coding agents are changing how products get built. The problem is they produce generic-looking UI because they have no idea what your design system looks like. Layout fixes the context gap. Paste a Figma URL or website URL into the Studio, and it extracts your entire design system — colours, typography, spacing, components, design philosophy — and compiles it into a structured DESIGN.md file optimised for LLM consumption. Export as a ZIP bundle, install the open-source CLI, and from that point on every AI agent on your project reads your design context automatically via the MCP server. It checks compliance, previews components, and can even push generated code back to Figma for designer review. One extraction. Every AI build, on-brand.

### Technical pitch (for developers)

The MCP protocol lets AI agents call tools to fetch context at inference time. Layout's CLI ships as an MCP server with 10 tools: `get_design_system`, `get_tokens`, `get_component`, `list_components`, `check_compliance`, `preview`, `push_to_figma`, `url_to_figma`, `design_in_figma`, and `update_tokens`. Two commands — `npx @layoutdesign/context import` and `npx @layoutdesign/context install` — extract your design system into a `.layout/` directory and wire the MCP server into Claude Code, Cursor, or Windsurf automatically. Extraction sources: Figma (full REST API, batched node resolution) or live websites (DOM + computed CSS via Playwright). Output: DESIGN.md, CLAUDE.md, AGENTS.md, `.cursorrules`, `tokens.css`, `tokens.json` (W3C DTCG), `tailwind.config.js`. MIT licensed, self-hostable, no telemetry.

### Business pitch (for CTOs / design leads)

Your team is increasingly using AI coding agents to ship faster. The invisible cost is design drift — AI-generated components that are slightly off-brand, require design review cycles, and accumulate visual debt. Layout solves this at the infrastructure level. We extract your design system once, compile it into a format every AI agent can consume, and serve it automatically through the Model Context Protocol. Your designers don't change their tools. Your developers don't change their workflow. The AI agents just start building correctly. Fewer design review rounds, faster component development, higher consistency. 60 seconds to install on an existing project.

---

## 4. Competitive Positioning

### Why Layout over Paper.design / Pencil.dev

**1. We meet your team where it already lives**

Figma has ~5 million active users. Your designers, components, variables, and styles already live there. Paper.design ($4.2M seed from Accel) asks every designer to adopt a new canvas, learn a new tool, and migrate existing work. Layout reads from Figma — no migration, no retraining, no political fight about tooling. Start tomorrow with the files you have today.

**2. We are a compiler, not a replacement**

Paper.design and Pencil.dev are building new design surfaces. Layout is infrastructure. A compiler sits between two things that already exist and translates between them. We sit between your Figma file (or live website) and your AI agent. No one changes how they design. No one changes how they code. The handoff becomes lossless.

**3. Figma is where design decisions are made and approved**

Design is a social process. Stakeholders annotate in Figma. Developers inspect in Dev Mode. QA compares against Figma screens. If your source of truth lives in Pencil's `.pen` file or Paper's proprietary canvas, you've forked your design system. Layout keeps Figma as the single source of truth and adds AI-readability on top.

**4. We also extract from live websites — no one else does this**

Figma files don't always exist. Third-party component libraries, products where the design system lives in CSS, brownfield projects — Layout extracts design tokens directly from any live URL via DOM and computed styles. Paper and Pencil cannot do this. This matters for agency work and legacy products.

**5. Fully open source means no lock-in**

Both the CLI (`@layoutdesign/context`) and the Studio web app are MIT licensed. Fork it, self-host it, extend it, contribute to it. Paper.design is a VC-backed SaaS. Pencil.dev is a closed VS Code extension. If Layout disappeared tomorrow, your DESIGN.md files still work with any AI agent and the source code is yours to run.

**6. DESIGN.md is portable plain text — not a proprietary format**

Pencil.dev uses `.pen` files — proprietary binary format tied to their renderer. Layout outputs structured markdown. Any AI agent reads it. Any developer edits it by hand. Works in Claude Code, Cursor, Copilot, Windsurf, and Codex without plugins. Portability is a first-class design decision.

**7. The Figma closed loop is unique**

Layout is not read-only. Push generated components back into Figma for designer review. Create Figma designs directly from tokens using `design_in_figma`. Pull changes back. Code → Figma → code, in a single loop. Paper's canvas can export code (one direction). Layout is genuinely bidirectional.

**8. Six output formats, not one**

DESIGN.md, CLAUDE.md, AGENTS.md, `.cursorrules`, `tokens.css`, `tokens.json` (W3C DTCG), `tailwind.config.js` — from a single extraction. Your AI agent, your design system, and your CSS build each get what they need. Paper and Pencil have one output format optimised for their own toolchain.

**9. Pre-alpha with direct founder access vs funded startups on a roadmap**

Paper has raised $4.2M and will build what its investors want. Join Layout now and your workflow, edge cases, and needs shape the product. That window closes as teams grow and roadmaps harden.

**10. No new tool for anyone — only better output for AI agents**

Paper and Pencil require someone on your team to use a new tool daily. Layout requires no behavioural change from designers or developers. Purely additive infrastructure that makes the AI smarter. The people who benefit (developers prompting Claude Code or Cursor) are the only people who need to know it exists.

### Quick Comparison Table

| Factor | Layout | Paper.design | Pencil.dev |
|--------|-----------|-------------|-----------|
| Approach | Compiler (extract from existing tools) | New design canvas | IDE-embedded canvas |
| Figma required? | Works with, not dependent on | Replaces Figma | Works alongside |
| Website extraction | Yes (Playwright) | No | No |
| Output format | 6 portable formats (MD, CSS, JSON) | Proprietary → React export | .pen files (proprietary) |
| Open source | MIT (CLI + Studio + MCP server) | No | No (OpenPencil fork exists) |
| Figma closed loop | Full bidirectional | N/A (not Figma-based) | No |
| Designer adoption needed | None | Full team migration | Developer-only |
| MCP tools | 10 tools | 24 tools | MCP integration |
| Pricing | Free BYOK / £29 Pro | Free / ~$20 Pro | Free (early access) |
| Funding | Bootstrapped | $4.2M (Accel) | Unknown |

---

## 5. Why Figma (Not a New Canvas)

### The Compiler Argument

There's a seductive idea in developer tooling: if you're unhappy with the current landscape, build something from scratch. It's bold. It's fundable. And for the problem Layout is solving, it's entirely the wrong approach.

**Figma is not just a tool — it's a coordination layer**

Figma has ~5 million active users. More importantly, it has become the lingua franca of product design. Design reviews happen in Figma. Stakeholders comment in Figma. Developers inspect in Dev Mode. Design systems are versioned in Figma libraries. That coordination function took years and billions of dollars to establish. No new canvas can replicate those network effects overnight.

The moment you ask a team to move their design work out of Figma, you're asking them to rebuild every coordination pattern in a new tool. Most teams won't do it.

**Switching costs are asymmetric**

Designers think in Figma. They know its shortcuts, its auto-layout behaviour, its component structure. Their design systems are built around Figma's mental model. Asking them to adopt a new canvas isn't a feature request — it's a career disruption. Even if the new tool is objectively better, the switching cost is borne entirely by the designer.

Layout asks designers to change nothing. The extraction happens in the background. The designer never opens our product. That's not a compromise — it's a deliberate design principle. A compiler doesn't ask the source language to change itself.

**The TypeScript precedent**

TypeScript didn't replace JavaScript. It added a type layer on top of an existing, widely-adopted language and let every JavaScript developer use it without abandoning their ecosystem. TypeScript was additive.

Layout takes the same approach. Figma is the runtime. We're the type checker — a layer that makes existing output more structured, more explicit, and more readable by machines.

**Designer buy-in is not optional**

Every design-to-code tool that tried to replace Figma has had to answer: will designers actually use this? The graveyard is long — InVision, Sketch (marginalised), Zeplin, Avocode. All promised to fix the handoff by asking one side to adopt a new tool.

Layout sidesteps this entirely. Designers don't need buy-in because we're not asking them for anything. The value flows to the AI-era developer who can extract context from Figma without involving the designer at all.

**Figma's ecosystem is a structural advantage**

Variables, Design Mode, Dev Mode, plugins, libraries, version history, branching, prototyping — capabilities that took years to build and are embedded in workflows. When you extract from Figma, you get access to all of it: colour styles with semantic names, component variants with documented states, typography scales with actual font weights. That richness is exactly what produces a useful DESIGN.md.

A new canvas starts with nothing.

**The closed loop closes in Figma**

Because we integrate with the Figma API bidirectionally, we can push generated components back for designer review and allow AI agents to create Figma mockups from design tokens. Code → Figma → code is only possible because Figma is the shared canvas both designers and AI agents can read and write.

**The conclusion is structural, not sentimental**

We didn't choose Figma because we like Figma. We chose it because it's where your design system already lives, where your team already works, and where design coordination is already concentrated. Replacing Figma would mean rebuilding half the internet. Integrating with it means we ship something useful today.

---

## 6. The Figma Closed Loop — Our Killer Feature

This is the single most defensible feature in the product. No competitor — open source or funded — has a fully bidirectional code ↔ Figma loop powered by design system context. This section exists to arm every conversation, demo, and piece of content with the detail needed to sell it.

### The Loop, Explained

```
┌─────────────────────────────────────────────────────────────┐
│                    THE FIGMA CLOSED LOOP                     │
│                                                              │
│   1. EXTRACT          2. BUILD            3. PREVIEW         │
│   ┌──────────┐       ┌──────────┐       ┌──────────┐        │
│   │ Figma or │──────▶│ AI agent │──────▶│ Live at  │        │
│   │ Website  │       │ builds   │       │ :4321    │        │
│   │ URL      │       │ on-brand │       │          │        │
│   └──────────┘       │ TSX      │       └────┬─────┘        │
│        ▲             └──────────┘            │               │
│        │                                      │               │
│   6. PULL BACK       5. DESIGNER             4. PUSH TO      │
│   ┌──────────┐       REVIEWS IN       ┌──────┴─────┐        │
│   │ AI reads │◀──────Figma────────────│ Editable   │        │
│   │ changes, │       (comments,       │ frames in  │        │
│   │ updates  │       tweaks,          │ Figma      │        │
│   │ code     │       approves)        │            │        │
│   └──────────┘                        └────────────┘        │
│                                                              │
│   + DESIGN IN FIGMA: AI creates new Figma designs from      │
│     scratch using your extracted tokens — no code needed     │
└─────────────────────────────────────────────────────────────┘
```

### The Four Capabilities

#### Capability 1: Preview Locally

**What happens:** Developer prompts their AI agent → Claude generates TSX → code renders live at `localhost:4321` in the Studio's Test Panel or in a browser.

**Why it matters:** Developers see exactly what the AI built before it enters the codebase. No blind merging. No "it looked different in my head." Live preview with responsive viewports (mobile, tablet, desktop).

**Technical edge:** Server-side TypeScript transpilation (not Babel) means reliable handling of complex TSX patterns. Live WebSocket bridge means instant updates.

**Talking point:** "See what your AI builds before it ships. Live preview at localhost:4321, with responsive viewports built in."

---

#### Capability 2: Push to Figma

**What happens:** Developer clicks "Push to Figma" in the Studio → component renders at a capture URL → Figma MCP captures it → editable auto-layout frame appears in the designer's Figma file.

**Why it matters:** This is the moment code becomes design. The AI-generated component lands in Figma not as a screenshot or a flat image, but as an **editable frame with auto-layout** — the designer can modify spacing, change colours, adjust text, and the changes persist as real Figma objects.

**The workflow in practice:**
1. AI builds a pricing card component using your design tokens
2. Developer reviews it in the preview panel
3. One click → "Push to Figma"
4. Three frames appear in Figma: desktop (1440px), tablet (768px), mobile (375px)
5. Designer opens Figma, sees the component, and can now:
   - Adjust spacing directly
   - Comment on colour choices
   - Share with stakeholders for approval
   - Iterate without touching code

**Technical edge:** Multi-viewport capture (desktop, tablet, mobile) happens automatically. CSS flexbox/grid converts to Figma auto-layout. No Figma plugin required — works via Figma MCP's native capture API.

**Talking point:** "Your AI builds a component. One click pushes it to Figma as editable frames — desktop, tablet, and mobile. Your designer reviews it in the tool they already use."

**Competitor comparison:**
- Paper.design: Can "Copy as React" (design → code). Cannot push code → design.
- Pencil.dev: Renders in IDE only. No Figma integration.
- Layout: Code → Figma as editable auto-layout frames. The only tool that does this.

---

#### Capability 3: Design in Figma

**What happens:** Developer tells their AI agent "Design a settings page using our design tokens" → `design_in_figma` MCP tool compiles a design brief from extracted tokens, typography, spacing, components, and rules → AI calls Figma MCP to create the design directly in Figma.

**Why it matters:** This is design **without a designer having to start from scratch**. The AI creates Figma frames using your actual tokens — real hex values, real font weights, real spacing scales. The designer then refines, not creates. It inverts the traditional workflow: instead of designer → developer, it's developer → AI → Figma → designer review.

**What the design brief includes:**
- Complete colour palette (extracted token names + hex values)
- Typography rules (font family, sizes, weights, line heights)
- Spacing scale (margins, padding, gaps, border radii)
- Available component patterns from the design system
- Design philosophy and anti-patterns (what NOT to do)
- Frame dimensions for each viewport

**The workflow in practice:**
1. Developer: "Design a user profile page with avatar, bio, and activity feed"
2. AI reads design tokens via `design_in_figma` tool
3. AI calls Figma MCP's `generate_figma_design` with a detailed, token-informed brief
4. Figma frames appear — correctly branded, properly spaced, using real tokens
5. Designer reviews and refines in Figma
6. Developer pulls the refined design back into code

**Talking point:** "Your AI doesn't just build code — it designs in Figma. Using your actual tokens. Your designer refines instead of starting from scratch."

**Why this is revolutionary:**
- Traditional: Designer creates mockup (hours) → developer implements (hours) → designer reviews (hours)
- With Layout: Developer prompts AI (seconds) → AI creates Figma design from tokens (seconds) → designer refines (minutes) → code already matches because it used the same tokens

---

#### Capability 4: Pull Back to Code

**What happens:** Designer modifies the Figma frames (adjusts colours, tweaks spacing, repositions elements) → developer tells AI "Read the Figma changes and update the code" → AI reads updated Figma frame via Figma MCP → AI updates the code to match.

**Why it matters:** This closes the loop. Without this step, you have a one-way pipeline. With it, you have a cycle: code → Figma → designer review → code. Design feedback becomes a prompt, not a ticket.

**The workflow in practice:**
1. Designer reviews the pushed component in Figma
2. Designer changes the card padding from 16px to 24px, swaps the accent colour
3. Designer comments: "Approved with these changes"
4. Developer: "Read the updated Figma frame and apply the designer's changes"
5. AI reads the frame via Figma MCP, diffs against original, updates TSX
6. Done. No Jira ticket. No design spec. No back-and-forth.

**Talking point:** "Designer tweaks the Figma frame. Developer tells the AI to read the changes. Code updates automatically. The loop closes in seconds, not days."

---

### Why No Competitor Can Replicate This

The closed loop works because of three things that intersect uniquely in Layout:

1. **Design system extraction** — We have your tokens, components, and rules in structured, machine-readable format. Without this, an AI agent designing in Figma would hallucinate your brand.

2. **MCP as the orchestration layer** — Every step (preview, push, design, pull) is an MCP tool call. The AI agent orchestrates the loop — no manual imports/exports, no plugin installations, no switching between apps.

3. **Figma as the shared canvas** — Both the AI agent and the human designer read and write to the same Figma file. That's only possible because we chose to integrate with Figma rather than replace it.

**Paper.design** can't do this because they replaced Figma — they have their own canvas, and there's no reason to push code back to it when the code already came from it.

**Pencil.dev** can't do this because they're IDE-only — there's no Figma integration, so the designer has no role in the loop.

**Layout** is the only tool where the AI, the developer, AND the designer all participate in the same workflow, each using their own native tool (AI agent, IDE, Figma).

### Figma Loop Marketing Copy

**Hero tagline:**
> Code → Figma → Code. The loop that actually closes.

**Subheading:**
> Push AI-generated components to Figma as editable frames. Design new screens using your tokens. Pull designer changes back into code. No new tools. No exports. No friction.

**Feature bullets for landing page:**
- **Preview locally** — See what your AI builds before it ships. Live at localhost:4321.
- **Push to Figma** — One click. Three responsive frames. Editable auto-layout. Ready for designer review.
- **Design in Figma** — AI creates Figma mockups using your actual tokens. Your designer refines, not creates.
- **Pull back to code** — Designer tweaks the frame. AI reads the changes. Code updates in seconds.

**For the comparison page:**
> Paper.design exports code from its canvas. That's one direction. Pencil.dev renders in the IDE. That's one tool. Layout connects your AI agent, your IDE, and your Figma file in a bidirectional loop where everyone uses their native tool. That's the difference between a feature and a workflow.

**For the technical blog post:**
> The `push_to_figma` MCP tool renders your component at a capture URL, then instructs Figma MCP to capture it as editable auto-layout frames at three viewports. The `design_in_figma` tool compiles your extracted tokens, typography, spacing, components, and anti-patterns into a structured design brief that any AI agent can pass to Figma MCP. Together, they create a workflow where code and design stay permanently synchronised through the tools your team already uses.

**Elevator pitch addition (for the Figma-aware audience):**
> "We don't replace Figma. We make it the shared canvas between your AI agent and your designer. Push code to Figma. Design in Figma with your tokens. Pull changes back. The loop that Paper and Pencil can't close because they built their own canvases instead."

### Demo Script for the Figma Loop

This is the most powerful demo you can give. It takes ~3 minutes and is visually striking.

**Setup:** Have a Figma file open. Have Claude Code with Layout MCP installed. Have a design system already extracted.

1. **[30 sec]** "Let me ask Claude to build a pricing card." → Prompt Claude, it calls `get_design_system`, generates TSX on-brand.
2. **[15 sec]** "Here it is, live at localhost:4321." → Show the preview panel with the rendered component.
3. **[15 sec]** "Now watch — one click, it's in Figma." → Click Push to Figma. Switch to Figma. Three frames appear (desktop, tablet, mobile).
4. **[30 sec]** "My designer changes the padding and swaps the accent colour." → Make quick edits in Figma.
5. **[30 sec]** "Now I tell Claude to read the changes." → Prompt Claude: "Read the Figma frame and update the code."
6. **[15 sec]** "Code is updated. Designer approved. No ticket. No spec. No meeting." → Show updated code.
7. **[15 sec]** "That's the loop. Code to Figma to code. No one changed their tools."

**Total: ~2.5 minutes. This is the hero demo.**

---

## 7. Why This is the Future of Design

### The Context Gap: A Manifesto

Something strange is happening in software development. AI coding agents can write entire features from a one-line prompt. They understand component architecture, accessibility, API design, and testing. They are extraordinarily capable.

And yet, every developer who has used Claude Code or Cursor to build UI has had the same experience: the component works, but it looks wrong. The blue is slightly off. The font weight is too heavy. The border radius doesn't match. The spacing feels inconsistent. The AI built a button — but it built *its* button, not *yours*.

This is the context gap. Closing it is the next essential layer of the AI coding stack.

**Why vibe coding works for prototypes and fails for products**

"Vibe coding" is genuinely useful for getting ideas onto a screen. For prototypes, hackathons, or one-off landing pages, visual inconsistencies don't matter.

For a product, the calculus changes. A product has established typographic scales, a semantic colour palette, motion principles, component conventions, and anti-patterns the team deliberately avoided. Every new screen needs to feel like it was built by the same designer.

When you ask an AI agent to build a screen, it has no access to any of that. It hallucinates a design system from first principles. That hallucination will look subtly but undeniably wrong. The inconsistency accumulates. The technical debt mounts. Designers spend increasing time filing bug reports about spacing and colour values instead of designing.

This is not a prompting problem. You fix it by giving the AI agent the context it needs.

**Design systems as machine-readable APIs**

Every mature product has a design system. Until recently, that system existed for one audience: human designers. Token names like `brand-primary-500` are meaningful to a designer who knows the context. An AI agent reading them cold has no idea whether that's the main CTA colour, a background tint, or a border colour.

The shift: design systems need a second audience. They need to be legible to AI coding agents. That means structured, explicit, semantic context — not just hex values, but how those values are used, what they mean, and when not to use them.

That's what DESIGN.md is. Nine sections of structured context for LLM consumption.

**The shift from pixel specs to semantic context**

The design-to-developer handoff has evolved through eras:
1. **Screenshot-and-annotation** — images with measurements drawn on
2. **Inspection tools** — Zeplin, Figma Dev Mode (hover and read CSS)
3. **Semantic context** — structured, machine-readable context for AI agents (we are here)

A human developer infers context from visual inspection. An AI agent needs relationships to be explicit: not just that the background is `#6366F1`, but that this is the primary action colour, used on filled CTAs only, never on secondary actions, always paired with white text.

**Why every team will need this in 12 months**

The adoption curve for AI coding agents is steep. As AI-generated code becomes a larger proportion of the codebase, the cleanup cost scales with it. The manual design review acceptable for 20% AI-generated code becomes untenable at 60%.

Teams will need a systematic solution. Not a better prompt. A structured, maintained, machine-readable representation of their design system that every AI agent automatically receives.

The teams that solve this first ship faster, with fewer design review cycles, and higher consistency. Design context is about to become a competitive advantage — then, quickly, a table stake.

**Market validation (March 2026)**
- Anthropic published a 2026 Agentic Coding Trends Report emphasising context engineering
- ArXiv paper on "Codified Context" — structured context files outperform ad-hoc prompting
- Figma published "Design Systems And AI: Why MCP Servers Are The Unlock"
- InfoQ research shows developer-written context files outperform LLM-generated ones
- AI Design Systems Conference (March 19-20, 2026) — entire event dedicated to this intersection
- 1,864+ MCP servers in ecosystem — fastest-adopted standard ever per RedMonk
- OpenAI/Figma Codex partnership announced February 2026

---

## 8. Why We Open-Sourced This

### Everything is MIT Open Source (and Will Stay That Way)

The CLI, MCP server, and Studio are all MIT licensed. Not source-available. Not business-source. Not open-core with the interesting bits behind a paywall. MIT — the most permissive licence we could pick.

**Developer trust cannot be purchased, only earned**

The MCP server sits inside your development environment. It has access to your design system, component names, and codebase structure. Open source is the only way to make that trust auditable. Read the code. Fork it, remove anything you don't want, run your own version.

**The PostHog and Supabase playbook is proven**

PostHog ships its entire analytics platform open source. Supabase ships its entire backend stack open source. Both built significant businesses because the open-source version builds trust, drives adoption, and creates a community that improves the product faster than any internal team. The paid tier exists for convenience and scale, not to lock away functionality.

We follow the same model. Everything is MIT licensed — CLI, MCP server, and Studio. The paid tier sells hosted AI and convenience, not access to closed code.

**Open source is the best distribution for developer tools**

Developer tools spread through GitHub, npm, blog posts, Slack messages, Discord servers. None of those channels respond well to "sign up for a trial first." Open source lets a developer try the full CLI in 60 seconds with `npx @layoutdesign/context`, no account, no payment. If it works, they tell other developers.

**No vendor lock-in is itself a selling point**

DESIGN.md is documented, plain-text markdown. Even the output format isn't locked to our tools. If Layout disappeared, your files still work with any AI agent. Teams making infrastructure decisions weight exit risk heavily. Eliminating that risk removes the biggest objection.

**Community contributions make the product better faster**

We're a small team. We can't support every framework, every Figma edge case, every way teams structure component libraries. An open-source community can. Contributors find bugs we haven't seen, build integrations we haven't imagined, and extend tools in genuinely useful directions.

**What's open vs. what's managed**

Both the CLI (`@layoutdesign/context`) and the Studio web app are MIT licensed. You can self-host everything. The paid tier sells convenience and hosted AI — not access to closed-source software.

| | Self-Host (Free, MIT) | Managed (Pro £29/mo) |
|---|---|---|
| CLI + 10 MCP tools | ✓ | ✓ |
| Studio web app | ✓ (self-host) | ✓ (hosted) |
| Website extraction (Playwright) | ✓ (your server) | ✓ (our server) |
| Figma extraction | ✓ (BYOK) | ✓ (hosted) |
| DESIGN.md synthesis | ✓ (BYOK Claude key) | ✓ (hosted AI, no key needed) |
| All export formats | ✓ | ✓ |
| 3 starter kits | ✓ | ✓ |
| Premium AI Kits | ✗ | ✓ |
| Drift monitoring | ✗ | ✓ |
| Priority queue + support | ✗ | ✓ |

---

## 9. Pre-Alpha Early Adopter Strategy

### Who We're Looking For

You're building something real with AI coding agents. You already use Claude Code, Cursor, Windsurf, or similar tools as part of your daily workflow — not as a novelty, but as a genuine multiplier. You've hit the wall where the AI produces working code that just looks wrong, and you've noticed the cost of fixing it.

You're not looking for another demo. You're looking for infrastructure that solves a real problem, and you're willing to help shape it.

### Why Join Now (Not in Six Months)

In six months, Layout will have a hardened roadmap and a growing user base shaped by the first cohort. The tradeoff: those first users decided what got built next. If the MCP tool you need doesn't exist yet, you can tell us and we'll build it. If extraction output is missing something specific to your Figma structure, we want to know.

This is a pre-alpha. Some things will break. We'll fix them quickly because we're paying close attention to every user — in a way that won't be possible at scale.

### What Early Adopters Get

- Direct access to the founding team via private Discord channel
- First look at every new feature before public release
- Permanent founding member discount on Pro tier
- Your use case and workflow genuinely shaping the product
- Credit in changelog and docs as a contributor (optional)
- Priority support and bug fixes

### Call to Action Copy (4 variations)

1. "We're looking for 50 developers who hate inconsistent AI-generated UI. Apply for early access."
2. "Layout is pre-alpha. We need developers building real products with AI agents who are willing to break things and tell us about it. Join the waitlist."
3. "Get early access. Shape the product. Lock in founding member pricing. Apply now — we're onboarding manually."
4. "The context gap between your design system and your AI agent is a solved problem. We need 50 developers to help us prove it."

### Discord Community Invitation

Join the Layout Discord. It's not a support forum — it's where the product gets built. Post your Figma extraction results. Share the MCP tools you wish existed. Break things in ways we haven't predicted. The founders are in there every day and will answer your messages personally. That won't always be true. Come in now.

### Email Signup Copy

> **Subject:** You're on the Layout early access list
>
> You're one of the first people to sign up for Layout. That means two things: you'll get access before anyone else, and your feedback will directly shape what we build next.
>
> We're onboarding manually. When your spot opens, we'll send everything — Studio link, CLI install command, and a direct line to us in Discord.
>
> While you wait: if you have a specific AI coding workflow or Figma edge case you're worried about, reply to this email. We read every response.
>
> — Matt and the Layout team
>
> *P.S. We're a small UK-based digital product agency. We built Layout because we kept hitting the same wall on our own client projects. We're not building this to flip it — we're building it because we need it.*

---

## 10. 90-Day Marketing Plan

**Period:** March – June 2026
**Goal:** 500 CLI installs, 200 Studio signups, 100 Discord members, 50 active early adopters

### Phase 1: Foundation & Seeding (Weeks 1–4)

#### Week 1 — Infrastructure & Messaging

**Focus:** Set up marketing infrastructure, nail positioning.

| Action | Owner | Time |
|--------|-------|------|
| Write positioning doc. Test with 5 developer friends via DM | Founder | 2 hrs |
| Set up Discord server (structure below) | Founder | 3 hrs |
| Polish GitHub README with animated GIF, badges, quick start | Founder | 4 hrs |
| Set up email capture (Buttondown or Resend) | Founder | 1 hr |
| Create Twitter/X account, bio, pinned tweet | Founder | 1 hr |
| Write CONTRIBUTING.md for the open source repo | Founder | 2 hrs |

**Discord structure:**
- `#announcements` — product updates (locked)
- `#general` — open chat
- `#show-and-tell` — members share what they built
- `#feature-requests` — structured template (Problem / Solution / Workaround)
- `#bug-reports` — structured template
- `#design-systems` — general discussion (attracts people even without using the product)
- `#ai-coding-agents` — general AI coding chat
- `#mcp-tools` — MCP ecosystem discussion
- `#feedback` — direct product feedback
- Roles: `@early-adopter`, `@contributor`, `@team`

#### Week 2 — First Content & Seed Outreach

**Focus:** Create anchor content, start personal outreach.

| Action | Owner | Time |
|--------|-------|------|
| Publish blog post #1: "Why Your AI Agent Builds Off-Brand UI (And How to Fix It)" | Founder | 4 hrs |
| Record 3-minute demo video: Figma URL → DESIGN.md → Claude Code builds on-brand | Founder | 3 hrs |
| DM 20 developers you know personally — ask them to try the CLI | Founder | 2 hrs |
| Post in Claude Code Discord `#showcase` | Founder | 30 min |
| Post in Cursor Discord `#projects` | Founder | 30 min |
| Create GitHub issue templates for feature requests and bug reports | Founder | 1 hr |

**Expected outcome:** 10-20 CLI installs, 5-10 Discord members, first feedback.

#### Week 3 — Reddit & Community Seeding

**Focus:** Engage developer communities authentically.

| Action | Owner | Time |
|--------|-------|------|
| r/ClaudeAI post: "I built an MCP server that gives Claude Code your design system" | Founder | 1 hr |
| r/cursor post: share the .cursorrules export feature | Founder | 1 hr |
| r/webdev post: "How we automated design system extraction for AI agents" | Founder | 1 hr |
| r/reactjs comment on relevant threads about design-to-code | Founder | 30 min |
| Publish blog post #2: "The DESIGN.md Specification: How to Structure Design Context for AI" | Founder | 4 hrs |
| Respond to every Discord message and GitHub issue within 2 hours | Founder | Ongoing |

**Reddit rules:**
- Be genuinely helpful first, product second
- Share the open-source CLI, not the paid Studio
- Include the demo video in posts
- Reply to every comment

#### Week 4 — Hacker News & First Newsletter Pitches

**Focus:** HN Show HN launch, start outreach to newsletters.

| Action | Owner | Time |
|--------|-------|------|
| Prepare Show HN post (title: "Show HN: Open-source MCP server that gives AI agents your design system") | Founder | 2 hrs |
| Submit Show HN on Tuesday or Wednesday, 9am ET | Founder | 15 min |
| Prepare concise replies to likely HN comments (open source?, why not X?) | Founder | 1 hr |
| Email pitch to Bytes newsletter | Founder | 30 min |
| Email pitch to JavaScript Weekly | Founder | 30 min |
| Email pitch to Frontend Focus | Founder | 30 min |
| Publish blog post #3: "Extracting Stripe's Design System in 60 Seconds" (tutorial) | Founder | 4 hrs |

**HN strategy:**
- Lead with open source + technical value
- Don't mention pricing
- Have the demo GIF in the GitHub README (HN readers will click through)
- Be available for 6 hours after posting to reply to every comment

**Expected Phase 1 outcome:** 50-100 CLI installs, 30-50 Discord members, 20-30 Studio signups.

---

### Phase 2: Acceleration (Weeks 5–8)

#### Week 5 — DEV.to & Tutorial Content

| Action | Owner | Time |
|--------|-------|------|
| Publish DEV.to tutorial: "How to Give Claude Code Your Design System in 60 Seconds" | Founder | 3 hrs |
| Cross-post to Hashnode with canonical URL | Founder | 30 min |
| Start Twitter/X thread series: "Design System Context Engineering" (1 thread/day for 5 days) | Founder | 2 hrs |
| Record video: "Website extraction → DESIGN.md → Cursor builds a dashboard" | Founder | 3 hrs |
| DM 10 AI coding tool influencers/YouTubers with demo access | Founder | 2 hrs |

#### Week 6 — Podcast & Influencer Outreach

| Action | Owner | Time |
|--------|-------|------|
| Pitch devtools.fm podcast (perfect fit — interviews devtool creators) | Founder | 1 hr |
| Pitch Latent Space podcast (AI + developer tools intersection) | Founder | 1 hr |
| Pitch Syntax.fm (frontend development audience) | Founder | 1 hr |
| Publish blog post #4: "Why We Chose Figma Over Building a New Canvas" | Founder | 3 hrs |
| Guest post pitch to Smashing Magazine: "Design Systems in the Age of AI Coding Agents" | Founder | 2 hrs |
| Create comparison page: Layout vs Paper.design vs Pencil.dev | Founder | 3 hrs |

#### Week 7 — Case Studies & Social Proof

| Action | Owner | Time |
|--------|-------|------|
| Write case study #1 from earliest active user (even if small) | Founder + user | 3 hrs |
| Publish blog post #5: "From Vibe Coding to On-Brand Coding: A Workflow Guide" | Founder | 3 hrs |
| Create "Wall of Love" page from Discord testimonials | Founder | 2 hrs |
| r/nextjs post: "How I use DESIGN.md to keep AI-generated components on-brand" | Founder | 1 hr |
| Start weekly "Show & Tell" in Discord (screenshot Friday) | Founder | 30 min |

#### Week 8 — Integration Guides Sprint

| Action | Owner | Time |
|--------|-------|------|
| Publish integration guide: "Layout + Claude Code" | Founder | 2 hrs |
| Publish integration guide: "Layout + Cursor" | Founder | 2 hrs |
| Publish integration guide: "Layout + GitHub Copilot" | Founder | 2 hrs |
| Publish integration guide: "Layout + Windsurf" | Founder | 2 hrs |
| Publish integration guide: "Layout + OpenAI Codex" | Founder | 2 hrs |
| Submit to MCP server directories/awesome lists | Founder | 1 hr |

**Expected Phase 2 outcome:** 200-300 CLI installs, 80-100 Discord members, 100 Studio signups.

---

### Phase 3: Momentum (Weeks 9–12)

#### Week 9 — Launch Week (Supabase-style)

| Day | Announcement |
|-----|-------------|
| Monday | New MCP tool: `update_tokens` — AI agents can now modify your design system |
| Tuesday | Website extraction v2: framework detection, animation extraction |
| Wednesday | AGENTS.md export (OpenAI Codex, Jules, Factory, Amp support) |
| Thursday | 3 new premium AI Kits (Apple iOS, Vercel, Revolut) |
| Friday | Community spotlight: best extractions, contributor shoutouts |

- Blog post for each day
- Twitter thread for each announcement
- Discord live thread for each announcement

#### Week 10 — Conference & Meetup Push

| Action | Owner | Time |
|--------|-------|------|
| Attend/sponsor SmashingConf Amsterdam (April 13-16) if budget allows | Founder | TBD |
| Pitch lightning talk at local meetups (React London, JS London) | Founder | 2 hrs |
| Create shareable slide deck: "The Context Gap" (10 slides) | Founder | 3 hrs |
| Publish blog post #7: "Open Source Design System Infrastructure: Our MIT Approach" | Founder | 3 hrs |

#### Week 11 — Partnerships & Ecosystem

| Action | Owner | Time |
|--------|-------|------|
| Reach out to Figma DevRel about being listed as a community integration | Founder | 1 hr |
| Reach out to Anthropic DevRel about being listed as MCP example | Founder | 1 hr |
| Submit PR to awesome-mcp-servers list | Founder | 30 min |
| Pitch Builder.io blog for guest post on design tokens + AI | Founder | 1 hr |
| Publish blog post #8: "Design System Compliance Checking with AI" | Founder | 3 hrs |

#### Week 12 — Retrospective & Phase 2 Planning

| Action | Owner | Time |
|--------|-------|------|
| Analyse all metrics against targets | Founder | 2 hrs |
| Survey early adopters (NPS + feature priority) | Founder | 1 hr |
| Write 90-day retrospective blog post | Founder | 3 hrs |
| Plan next 90 days based on data | Founder | 4 hrs |
| Prepare ProductHunt launch plan (for next quarter) | Founder | 3 hrs |

**Expected Phase 3 outcome:** 500+ CLI installs, 100+ Discord members, 200+ Studio signups, 30-50 active weekly users.

---

## 11. Content Strategy

### Blog Posts (10 specific titles)

| # | Title | Type | Target Channel |
|---|-------|------|----------------|
| 1 | "Why Your AI Agent Builds Off-Brand UI (And How to Fix It)" | Problem/solution | Blog, HN, Reddit |
| 2 | "The DESIGN.md Specification: Structuring Design Context for AI" | Technical deep-dive | Blog, DEV.to |
| 3 | "Extracting Stripe's Design System in 60 Seconds" | Tutorial | Blog, YouTube |
| 4 | "Why We Chose Figma Over Building a New Canvas" | Strategy/opinion | Blog, HN |
| 5 | "From Vibe Coding to On-Brand Coding: A Workflow Guide" | How-to | Blog, Reddit |
| 6 | "Layout vs Paper.design vs Pencil.dev: Honest Comparison" | Comparison (SEO) | Blog |
| 7 | "Open Source Design System Infrastructure: Our MIT Approach" | Philosophy | Blog, HN |
| 8 | "Design System Compliance Checking with AI" | Technical | Blog, DEV.to |
| 9 | "How Context Engineering is Changing Frontend Development" | Thought leadership | Blog, newsletters |
| 10 | "Building an MCP Server for Design Systems" | Technical tutorial | Blog, DEV.to, HN |

### Video Concepts (5)

1. **60-second demo:** Figma URL → extract → DESIGN.md → Claude Code builds component (hero video)
2. **5-minute tutorial:** "Give Claude Code your design system in 60 seconds" (CLI walkthrough)
3. **3-minute comparison:** AI builds a component WITH vs WITHOUT design context (side-by-side)
4. **10-minute deep dive:** "How DESIGN.md works under the hood" (technical audience)
5. **2-minute case study:** Real user showing before/after of AI-generated UI quality

### Case Study Ideas (3)

1. **Agency use case:** "How [agency name] cut design review time by 60% on AI-built components"
2. **Startup use case:** "How [startup] maintained design consistency while shipping 3x faster with AI"
3. **Open source project:** "How [OSS project] created a community design system that AI agents can read"

### Twitter/X Content Calendar

| Day | Theme | Format |
|-----|-------|--------|
| Monday | Product update / feature | Screenshot + 2-3 sentences |
| Tuesday | Design system tip | Thread (3-5 tweets) |
| Wednesday | User showcase / retweet | RT with commentary |
| Thursday | Technical deep-dive | Thread (5-8 tweets) |
| Friday | Community / personal | Behind-the-scenes, lessons learned |

---

## 12. Community Building

### Discord: Recruiting First 100 Members

1. **Personal DMs** (weeks 1-2): Message 30-40 developers you know personally
2. **AI coding Discord servers** (weeks 2-3): Share in Claude Code, Cursor, Windsurf Discords
3. **Reddit posts** (weeks 3-4): Include Discord link in all Reddit posts
4. **GitHub README** (ongoing): Discord badge in repo header
5. **Blog posts** (ongoing): CTA at bottom of every post
6. **Twitter bio** (ongoing): Discord link in bio

### Engagement Tactics

- **Weekly "Show & Tell"** — members share what they built (Friday)
- **Monthly AMA** — founder answers all questions live
- **Bug bounty** — free Pro month for first person to find critical bugs
- **Feature voting** — structured polls for roadmap priorities
- **Contributor recognition** — changelog credits, Discord role upgrades
- **Design system of the week** — extract a famous product's design system and share results

### Feedback Loop

1. Every Discord conversation tagged with feedback → GitHub issue
2. Weekly synthesis of all feedback → internal priorities doc
3. Monthly "What We Built Because You Asked" post in `#announcements`
4. Public roadmap (GitHub Projects or Linear) linked from Discord

---

## 13. SEO & Keyword Strategy

### Primary Target Keywords

| Keyword Cluster | Search Intent | Content Strategy |
|-----------------|---------------|------------------|
| "CLAUDE.md" / "how to write CLAUDE.md" | Setup guide | Blog: "The definitive CLAUDE.md guide" + tool generates it |
| "cursorrules" / ".cursorrules guide" | Setup guide | Blog: "Cursor rules for design systems" + tool generates it |
| "AGENTS.md" | Setup guide | Blog: "AGENTS.md for design context" + tool generates it |
| "design system MCP server" | Tool discovery | GitHub README + blog post |
| "Figma to code AI" | Solution search | Comparison page + tutorial |
| "vibe coding design system" | Problem awareness | Manifesto blog post |
| "design tokens AI agent" | Technical search | DESIGN.md spec page |
| "context engineering frontend" | Trend research | Thought leadership posts |

### SEO Quick Wins

- Every export format Layout generates (CLAUDE.md, .cursorrules, AGENTS.md) is something developers are actively searching for
- Publish definitive guides for each format — Layout is the tool that auto-generates them
- Target "how to" + format name keywords

---

## 14. Developer Relations

### GitHub Strategy

- **README:** Hero GIF, 4-line quickstart, tool table, "Why?" section, badges
- **CONTRIBUTING.md:** Clear contribution guide, issue templates, PR template
- **Issues:** Use labels (`good-first-issue`, `help-wanted`, `enhancement`)
- **Discussions:** Enable GitHub Discussions for community Q&A
- **Releases:** Semantic versioning, detailed changelogs
- **Stars:** Include "Star this repo" CTA in README and blog posts

### npm Package Promotion

- Clear package description and keywords in `package.json`
- README on npm mirrors GitHub README
- Link to documentation site from npm page
- Track weekly downloads as key metric

### MCP Ecosystem Positioning

- Submit to awesome-mcp-servers
- Submit to MCP server directories
- Write "Building an MCP Server for Design Systems" tutorial (positions Layout as MCP expert)
- Engage with MCP community on GitHub and Discord

### Integration Guides to Write

1. Claude Code + Layout (auto-install via `npx @layoutdesign/context install`)
2. Cursor + Layout (.cursorrules + MCP setup)
3. GitHub Copilot + Layout (CLAUDE.md context file)
4. Windsurf + Layout (MCP configuration)
5. OpenAI Codex + Layout (AGENTS.md)
6. Self-hosting guide (Docker/Coolify)

---

## 15. Outreach & Distribution

### Newsletter Pitching

| Newsletter | Audience | Pitch Angle |
|------------|----------|-------------|
| Bytes | Frontend devs (500K+) | "Open source MCP server for design systems" |
| JavaScript Weekly | JS developers | "npm package: design system → AI agent context" |
| Frontend Focus | Frontend devs | "Figma extraction → structured design tokens" |
| React Status | React devs | "Design system context for AI coding agents" |
| Smashing Newsletter | Design engineers (178K) | "The compiler between design systems and AI" |
| TLDR AI | AI practitioners (1.25M) | "MCP server that gives AI agents design taste" |
| Latent Space | AI engineers (200K) | "Context engineering for design systems" |
| CSS Weekly | CSS developers (73K) | "Extract and compile design tokens from any website" |
| Product for Engineers (PostHog) | Product engineers (75K) | "Solving the design drift problem in AI coding" |

### Podcast Guest Pitching

| Podcast | Why | Pitch Topic |
|---------|-----|-------------|
| devtools.fm | Interviews devtool creators — perfect fit | "Building open source infrastructure for AI design context" |
| Latent Space | AI + developer tools intersection | "Context engineering: the missing layer between design and AI" |
| Syntax.fm | Massive frontend audience | "Why AI agents can't build on-brand UI (and how to fix it)" |
| The Changelog | Open source focus | "MIT-licensing your developer tool: the Supabase/PostHog playbook" |
| JS Party | JavaScript community | "Design tokens as machine-readable APIs" |
| The AI Native Dev | AI-first development | "The compiler between Figma and Claude Code" |

### Influencer/Creator Types to Contact

1. **AI coding YouTubers** — anyone making "Claude Code tutorial" or "Cursor tips" content
2. **Design system advocates** — Brad Frost, Nathan Curtis, design system Twitter
3. **Frontend thought leaders** — people writing about design engineering
4. **Open source maintainers** — people building MCP servers, design tools
5. **Agency founders** — people building products with AI for clients

### Conference & Meetup Strategy

| Event | Date | Action |
|-------|------|--------|
| AI Design Systems Conference | March 19-20, 2026 | Attend virtually, engage in chat, post about it |
| SmashingConf Amsterdam | April 13-16, 2026 | Attend if budget allows, network |
| React London Meetup | Monthly | Pitch 5-min lightning talk |
| JS London Meetup | Monthly | Pitch 5-min lightning talk |
| Next.js Conf | TBD | Submit talk proposal |

---

## 16. Metrics & KPIs

### 30/60/90 Day Targets

| Metric | 30 days | 60 days | 90 days |
|--------|---------|---------|---------|
| npm installs (CLI) | 50 | 200 | 500 |
| GitHub stars | 50 | 150 | 400 |
| Studio signups | 20 | 80 | 200 |
| Discord members | 30 | 70 | 100 |
| Active weekly users | 10 | 25 | 50 |
| Blog post views | 1,000 | 5,000 | 15,000 |
| Newsletter subscribers | 50 | 150 | 300 |
| Design.md files generated | 30 | 150 | 500 |

### Weekly Tracking

- npm downloads (weekly)
- GitHub stars (cumulative)
- Discord messages (weekly activity)
- Studio extractions (weekly)
- Blog traffic (weekly)
- Twitter impressions (weekly)
- Email subscribers (cumulative)

### Leading vs Lagging Indicators

| Leading (action) | Lagging (outcome) |
|---|---|
| Blog posts published | Organic search traffic |
| Reddit posts made | CLI installs |
| Discord messages answered | Weekly active users |
| Demo videos shared | Studio signups |
| Outreach emails sent | Podcast appearances |
| GitHub issues resolved | Contributor PRs |

### Risk Mitigation

| Risk | Backup Tactic |
|------|---------------|
| HN post flops | Double down on Reddit + Discord community building |
| Low Reddit engagement | Focus on Twitter threads + DEV.to tutorials |
| Newsletter pitches ignored | Write guest posts directly for target publications |
| Slow Discord growth | Host weekly "design system extraction" live sessions |
| Low conversion to Studio | Focus on CLI adoption, build conversion later |
| Content not ranking for SEO | Increase technical depth, target longer-tail keywords |

---

## Appendix A: Deep Competitive Analysis

### Paper.design — The Designer's AI Canvas

**What they are:** A new design tool — a full Figma replacement with AI capabilities and code export. $4.2M seed led by Accel and Basecase. Founded by Stephen Haney, Vlad Moroz, and Ksenia Kondrashova. Angels include Guillermo Rauch (Vercel), Adam Wathan (Tailwind CSS), Des Traynor (Intercom), Adrián Mato (GitHub Design Director).

**Their thesis (from seed announcement):**
> "Established tools are maturing into big business and are losing steam for new ideas."

They believe Figma is becoming bloated and slow to innovate. Paper is the next-generation design tool — designer-centric, AI-assisted, with native code export.

**Key capabilities:**
- Full design tool: multiplayer, branching, comments, offline support
- P3 colour gamut, uniform colour spaces, pixel editing, filters
- Nestable component slots, simpler token systems
- AI "pencil tool" — art-direct AI with voice or text, draws in your styles
- Design system-aware AI upscaling (low-effort sketches → styled components)
- Import code components from GitHub/npm directly onto canvas
- "Copy as React" with full fidelity
- Real flex/CSS rendering — no coding required
- 24 MCP tools (bidirectional read/write)

**Their philosophical position:**
- "Keep the designer in the driver's seat" — AI assists, doesn't replace
- "All designers will become design engineers? We don't think so."
- The 90% of design work before handoff still needs dedicated tools
- "Hand-off is wasteful" but adding code constraints kills creative exploration
- Solution: design freely, then export pixel-perfect code

**Pricing:** Free tier (100 MCP calls/week), Pro ~$20/user/month

**Their strengths:**
- Incredibly strong angel investor roster (Tailwind creator, Vercel CEO)
- Genuinely innovative AI design features (art-direct with voice)
- Native code export eliminates traditional handoff
- Designer-centric positioning resonates emotionally
- 24 MCP tools is a large surface area

**Their weaknesses (our attack vectors):**

1. **They require a full tool migration.** Paper asks every designer on a team to abandon Figma. That's not a feature adoption — it's an organisational change management project. Design reviews, stakeholder comments, developer inspect workflows, component libraries, version history — all of it needs to move. Most teams won't do this, especially when Figma works fine for the 90% Paper themselves acknowledge.

2. **They're solving the designer's problem, not the developer's.** Paper's entire pitch is "better tools for designers." Layout's pitch is "better context for AI agents." These are adjacent but different markets. The developer using Claude Code at 11pm doesn't need a better design tool — they need the existing design system served to their AI agent.

3. **Code export is one-directional.** Paper can "Copy as React." That's design → code. Layout has a full closed loop: code → preview → push to Figma → design in Figma → pull back to code. Bidirectional beats unidirectional.

4. **No website extraction.** Paper only works with designs created in Paper. Layout extracts from any live website — critical for brownfield projects, third-party integrations, and agency work on existing products.

5. **Proprietary format lock-in.** Designs live in Paper's platform. If Paper pivots, raises prices, or shuts down, your design system is trapped. Layout outputs plain-text markdown (DESIGN.md) and standard formats (W3C DTCG tokens, CSS variables, Tailwind config). Maximum portability.

6. **The VC trajectory problem.** $4.2M seed from Accel means Paper must grow into a $100M+ business. That means aggressive monetisation, feature gating, or pivots. Layout is bootstrapped with an MIT open-source core. Our incentives align with users, not investors.

**How to position against Paper in conversations:**

> "Paper is building a beautiful new design tool. We're building infrastructure that makes your existing design tool work with AI agents. If your team is ready to migrate away from Figma, Paper is worth looking at. If you want your Figma files to work with Claude Code tomorrow, that's us."

> "Paper asks designers to change tools. We ask no one to change anything. Layout is purely additive — your designers stay in Figma, your developers stay in their IDE, and the AI agents just get smarter."

---

### Pencil.dev — The IDE-Embedded Design Canvas

**What they are:** An AI-native design canvas embedded directly in VS Code and Cursor. .pen files live in Git alongside code. MCP integration lets AI agents draw and edit on the canvas. Currently free during early access.

**Their thesis (from analysis):**
Design handoffs consume 15-20% of project timelines. The solution is to eliminate the gap entirely by putting a design canvas inside the code editor.

**Key capabilities:**
- "Infinite Canvas" inside VS Code/Cursor
- .pen files stored in Git (version-controlled alongside code)
- Figma copy-paste compatibility (preserves styles within 1px tolerance)
- MCP server integration — AI agents can generate layouts via natural language
- Bidirectional: visual changes sync back to codebase
- Natural language commands: "Build a login page using Lunarus components"
- Multiple UI package support

**Their philosophical position:**
- Not a design tool, not an IDE — a "connector layer"
- Design assets should live in the codebase, not a separate platform
- AI agents should be able to read AND write design specs
- Bridges the gap between Figma (design) and code (implementation)

**Pricing:** Free (early access). Requires Claude Code subscription for full MCP features.

**Their strengths:**
- Git-native design files is genuinely novel
- Zero context-switching for developers (stays in IDE)
- MCP integration lets agents interact with visual designs
- Free tier removes adoption friction
- Figma copy-paste preserves existing work

**Their weaknesses (our attack vectors):**

1. **Proprietary .pen format.** Even though .pen files live in Git, they're a proprietary binary format tied to Pencil's renderer. You can't read them without Pencil. DESIGN.md is plain markdown — readable by any AI agent, any developer, any tool, forever.

2. **4-8px alignment discrepancies in complex layouts.** The article itself acknowledges this. For pixel-perfect brand consistency, approximate isn't good enough. Layout extracts actual computed values from Figma/CSS — no approximation.

3. **No design system extraction.** Pencil is a canvas for creating or pasting designs. It doesn't extract and compile an existing design system into structured AI context. You still need to manually define your tokens, components, and rules. Layout automates the entire extraction.

4. **IDE-only, Claude Code-dependent.** Pencil requires VS Code or Cursor. It's optimised for Claude Code specifically. Layout works with Claude Code, Cursor, GitHub Copilot, Windsurf, Codex — any agent that reads MCP or context files. Agent-agnostic by design.

5. **No website extraction.** Same gap as Paper. Can't extract from live URLs. Agency developers working on existing products need this.

6. **Frontend-only.** The article explicitly states Pencil doesn't handle backend logic, state management, or API integrations. Layout's DESIGN.md provides context that helps AI agents build full components with proper state handling and accessibility.

7. **Commercialisation uncertainty.** Free during early access, but the article notes "free models typically precede commercialisation shifts." Layout's CLI is MIT open source with a permanent commitment. The paid tier (Studio) is clearly defined and separate.

**How to position against Pencil in conversations:**

> "Pencil gives you a canvas to design in your IDE. Layout gives your AI agent the complete context of your existing design system. Different tools, different problems. If you want to sketch UI in VS Code, use Pencil. If you want Claude Code to already know your design system when it starts building, use Layout."

> "Pencil's .pen files are proprietary binaries tied to their tool. Our DESIGN.md is plain markdown that works with every AI agent, every IDE, every tool — today and in 10 years."

---

### The Three-Way Positioning Map

```
                    WHO CHANGES THEIR TOOLS?

         Nobody              Developers          Designers
           |                    |                    |
    ┌──────┴──────┐    ┌───────┴───────┐    ┌───────┴───────┐
    │  LAYOUT  │    │   PENCIL.DEV  │    │ PAPER.DESIGN  │
    │              │    │               │    │               │
    │ Compiler     │    │ IDE canvas    │    │ New design    │
    │ (invisible   │    │ (.pen files   │    │ tool (replace │
    │ infrastructure)│   │ in Git)       │    │ Figma)        │
    │              │    │               │    │               │
    │ Extracts from│    │ Accepts paste │    │ Creates from  │
    │ Figma + URLs │    │ from Figma    │    │ scratch       │
    │              │    │               │    │               │
    │ Plain-text   │    │ Proprietary   │    │ Proprietary   │
    │ output       │    │ .pen format   │    │ platform      │
    │              │    │               │    │               │
    │ All AI agents│    │ Claude Code + │    │ 24 MCP tools  │
    │ via MCP      │    │ Cursor only   │    │               │
    │              │    │               │    │               │
    │ MIT open src │    │ Closed source │    │ VC-backed SaaS│
    │ Bootstrapped │    │ Free (for now)│    │ $4.2M seed    │
    └──────────────┘    └───────────────┘    └───────────────┘
```

### The Strategic Narrative

**Paper** says: "Designers need a better tool. Let's replace Figma."
**Pencil** says: "Developers need a design surface in their IDE. Let's add a canvas."
**Layout** says: "AI agents need design context. Let's compile it from what already exists."

Paper and Pencil are building new surfaces. Layout is building infrastructure. They create new places to design. We make existing designs readable by machines.

The analogy: Paper is building a new programming language. Pencil is building a new IDE. Layout is building a compiler. Compilers don't compete with languages or IDEs — they make the ecosystem work.

**The key talking point:** Layout is the only tool in this space that requires zero behavioural change from anyone on the team. Designers stay in Figma. Developers stay in their IDE. The AI agents get smarter. That's it.

### Market White Space

Nobody is automating the pipeline from "design source of truth" (Figma, live sites) → "agent-readable context" (DESIGN.md, tokens, MCP tools). Paper and Pencil are building new design surfaces. Layout is the compiler that works with what teams already have. That is the white space.

---

*This playbook was compiled March 2026 for Layout pre-alpha launch.*
