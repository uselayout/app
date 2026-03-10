# Social Media Content Pack

## Twitter/X

### Launch Announcement
Introducing SuperDuper AI Studio — paste a Figma URL or any website, get a structured DESIGN.md that makes Claude, Cursor, and Codex generate on-brand UI every time. No plugins. No manual tokens. 2 minutes.

studio.superduperui.com

### Launch Thread (Build Story)

1/ I built a tool that turns any design system into AI-ready context. Paste a Figma URL or live website → get a DESIGN.md + tokens.css + CLAUDE.md + AGENTS.md. Here's why and how:

2/ The problem: AI coding agents generate generic UI. They don't know your colours, typography, or component patterns. You end up hand-feeding hex values into every prompt. It's tedious and it drifts.

3/ The insight: AI agents read markdown. Design systems live in Figma. Nothing connects the two. So I built a compiler that bridges the gap.

4/ How it works: Paste a Figma file URL → AI Studio calls the Figma API, extracts every colour, text style, effect, and component → Claude synthesises a structured DESIGN.md → export as a ZIP with 7 formats.

5/ The killer feature: no Figma? Paste any website URL. Playwright loads the page and scrapes computed CSS from the live DOM. Fonts, colours, spacing, shadows — all extracted from the actual rendered output. No competitor does this.

6/ The export bundle covers every AI tool: CLAUDE.md for Claude Code, AGENTS.md for Codex/Cursor/Jules, .cursorrules for Cursor, tokens.css, tokens.json, and tailwind.config.js. One extraction, every tool.

7/ Plus a live test panel: ask Claude to "build a card component" using your design system, and see it rendered live in the browser. Verify the output before exporting.

8/ Built in 3 days with Next.js 15, React 19, TypeScript, Tailwind v4, Monaco Editor, and Claude. 6,500 lines of code. 22 commits. Try it free: studio.superduperui.com

### Feature Highlight Posts

**Website Extraction**:
No Figma file? No problem. SuperDuper AI Studio extracts design tokens from any live website — fonts, colours, spacing, shadows — all from computed CSS. Paste stripe.com, get Stripe's design system as DESIGN.md. studio.superduperui.com

**Export Bundle**:
One extraction. Seven formats. DESIGN.md, CLAUDE.md, AGENTS.md, .cursorrules, tokens.css, tokens.json, tailwind.config.js. Works with Claude Code, Cursor, Copilot, Windsurf, and Codex. studio.superduperui.com

**Live Preview**:
AI Studio has a built-in test panel. Ask Claude to build a component using your extracted design system, and see it rendered live. Verify before you export. studio.superduperui.com

**Before/After**:
Left: AI output without DESIGN.md — generic colours, wrong fonts, inconsistent spacing.
Right: AI output with DESIGN.md — exact brand colours, correct typography, proper component patterns.
The difference is structured context. studio.superduperui.com

---

## LinkedIn

### Launch Post
I've been building with AI coding agents for the past year — Claude Code, Cursor, Copilot. They're incredible at writing logic, but they consistently struggle with one thing: design consistency.

The AI doesn't know your colour palette. It doesn't know your typography scale. It doesn't know your component patterns. So it generates generic UI that needs heavy rework.

The fix isn't better prompting. It's better context.

I built SuperDuper AI Studio to solve this. It's a design system compiler that:

- Extracts tokens from Figma files or live websites (yes, any URL)
- Generates a structured DESIGN.md optimised for LLM consumption
- Exports context files for Claude Code, Cursor, Copilot, Windsurf, and OpenAI Codex

Paste a URL. Get an AI kit in 2 minutes. Every prompt your AI agent runs now has full design context.

The website extraction is the part I'm most proud of — no Figma access needed. Playwright loads the page and scrapes computed CSS from the DOM. Fonts, colours, spacing, shadows. From the actual rendered output.

Try it free: studio.superduperui.com

### Founder Story Post
Three days. 6,500 lines of TypeScript. One problem I couldn't stop thinking about.

I run a digital product agency. We build MVPs in 5-day sprints. AI coding agents are central to our workflow — but they kept generating off-brand UI.

The root cause: AI agents read markdown, but design systems live in Figma. There was nothing connecting the two.

So I built the connection. SuperDuper AI Studio extracts design tokens from Figma (or any live website) and compiles them into structured DESIGN.md files. Drop it in your repo, and every AI prompt has full design context.

The hardest part wasn't the extraction — it was getting the DESIGN.md format right. Too much detail and you blow the context window. Too little and the AI still generates generic output. The Quick Reference section (50–75 lines) turned out to be the sweet spot.

Built with Next.js 15, React 19, Claude, Playwright, and the Figma API. Deployed on Coolify/Hetzner.

studio.superduperui.com

---

## Hacker News

### Show HN Title
Show HN: AI Studio — Extract any design system from Figma or a website into AI-ready context

### Show HN Description
I built a tool that compiles design systems into context files for AI coding agents.

**The problem**: Claude, Cursor, Copilot generate generic UI because they don't know your design tokens. You end up pasting hex values into prompts or maintaining CLAUDE.md files by hand.

**The solution**: Paste a Figma URL or any website URL. AI Studio extracts colours, typography, spacing, components, and synthesises a structured DESIGN.md.

**Export bundle includes**: DESIGN.md, CLAUDE.md, AGENTS.md, .cursorrules, tokens.css, tokens.json, tailwind.config.js.

**Key differentiator**: Website extraction via Playwright. No Figma file needed — it scrapes computed CSS from any live URL. No competitor does this.

Built with Next.js 15, TypeScript, Tailwind v4, Monaco Editor, Anthropic SDK, Playwright, Figma API.

Free to try (BYOK with your Anthropic API key): studio.superduperui.com

Would love feedback on the DESIGN.md format — particularly the Quick Reference section and how well it works with different AI tools.

---

## Product Hunt

### Tagline
The compiler between design systems and AI coding agents.

### Description
SuperDuper AI Studio extracts design tokens from Figma files and live websites, then compiles them into structured context bundles for AI coding agents.

Paste a URL. Get a DESIGN.md, CLAUDE.md, AGENTS.md, tokens.css, and tailwind.config.js in under 2 minutes.

Works with Claude Code, Cursor, GitHub Copilot, Windsurf, and OpenAI Codex. One extraction covers every tool.

The standout feature is website extraction — no Figma file needed. Playwright loads the page and extracts computed CSS from the DOM. Extract any public website's design system without source code access.

Includes a live test panel: ask Claude to build a component using your extracted design system and see it rendered in the browser before exporting.

### First Comment (Maker)
Hey PH! I'm Matt, I run a digital product agency and we use AI coding agents daily. The recurring frustration was always the same — beautiful design system in Figma, generic output from AI.

I built AI Studio to bridge that gap. The two things I'm most proud of:

1. Website extraction — paste any URL and get the design system. No Figma access needed. This is genuinely unique.

2. The Quick Reference format — a 50-75 line summary inside DESIGN.md that fits in any context window without blowing your token budget.

Would love feedback on what export formats would be most useful. Currently thinking about adding a CLI tool (`npx @superduperai/sync`) for zero-friction updates.

Try it free with your own Anthropic API key: studio.superduperui.com

---

## Blog Post Outlines

### "How We Built AI Studio in 3 Days"
- **Hook**: We built a design system compiler in 3 days. Here's what we learned about AI-assisted development.
- **Day 1**: Ralph (autonomous agent loop) executed 28 user stories. Architecture decisions: SSE over WebSockets, Zustand + localStorage for local-first.
- **Day 2**: The three-panel Studio. Monaco editor integration. The iframe sandbox for live component preview. The `</script>` bug that broke everything.
- **Day 3**: Better Auth + Supabase. The self-hosted SSL gotcha. Documentation and marketing.
- **Technical highlight**: How Playwright extracts computed CSS from live websites.
- **Lessons**: Let the AI handle boilerplate, focus human attention on architecture decisions and user experience.

### "Why Your AI Needs a DESIGN.md"
- **Hook**: Your AI coding agent generates ugly UI because it's missing one file.
- **The problem**: AI tools have no design context by default. They hallucinate colours, pick system fonts, use inconsistent spacing.
- **The fix**: A structured DESIGN.md with Quick Reference, colour system, typography, components, and anti-patterns.
- **Before/After**: Side-by-side comparisons of AI output.
- **How to get one**: Extract with AI Studio or write your own (template provided).
- **CTA**: Try AI Studio free.

### "Extracting Stripe's Design System with Playwright"
- **Hook**: We extracted Stripe's entire design system from their live website without any Figma access.
- **Technical deep-dive**: How `page.evaluate()` + `getComputedStyle()` captures actual rendered values.
- **What we found**: Stripe's colour palette, font stack, spacing scale, shadow values.
- **The DESIGN.md**: Publish the actual output (edited for clarity).
- **CTA**: Extract your own at studio.superduperui.com.
