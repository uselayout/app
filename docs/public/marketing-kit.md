# Layout — Marketing Kit

## Brand Messaging

### Elevator Pitch (30 seconds)
Layout is a design system compiler that extracts tokens from Figma files and live websites, then generates structured context bundles for AI coding agents. Unlike manually maintaining design documentation, AI Studio automates the entire pipeline — paste a URL, get a DESIGN.md that makes Claude, Cursor, and Codex generate on-brand UI every time.

### One-Liner
The compiler between design systems and AI coding agents.

### Tagline Options
1. Your design system, ready for AI.
2. Paste a URL. Get an AI kit.
3. Stop hand-feeding tokens to your AI.

### Value Propositions
1. **2-minute extraction**: Paste a Figma URL or website, get a complete AI context bundle. No manual token documentation.
2. **Every AI tool covered**: One export gives you CLAUDE.md, AGENTS.md, .cursorrules, tokens.css, and tailwind.config.js — works with Claude Code, Cursor, Copilot, Windsurf, and Codex.
3. **Website extraction**: No Figma file? No problem. Extract design tokens from any live website using Playwright. No competitor does this.

---

## Brand Voice

### Personality
- **Direct**: Lead with what the tool does, not what category it's in
- **Technical**: Our audience writes code — use their language, not marketing fluff
- **Confident**: We built something genuinely useful. Say so without hedging.

### Tone Guidelines
- **Do**: Use concrete numbers ("2 minutes", "7 export formats", "6,500 lines of TypeScript")
- **Do**: Reference specific tools by name (Claude Code, Cursor, not "your favourite AI tool")
- **Do**: Show the output, not just describe it
- **Don't**: Use "revolutionary", "game-changing", "powered by AI" without substance
- **Don't**: Oversell — this is a developer tool, not a startup pitch
- **Don't**: Compare to competitors by name (let the product speak)

### Key Messages
1. AI coding agents produce better UI when they have structured design context — AI Studio generates that context automatically.
2. Website extraction is the unique capability — no other tool can extract a design system from a live URL.
3. The output works with every major AI coding tool, not just one.

---

## Target Audience

### Primary Persona: The AI-First Developer
- **Role**: Frontend/full-stack developer using Claude Code, Cursor, or Copilot daily
- **Pain Points**: AI generates generic-looking UI. Manually copying hex values and font sizes into prompts. CLAUDE.md files that drift from the actual design system.
- **Goals**: Ship on-brand UI faster. Spend less time on design system documentation. Get AI to understand their design system natively.
- **How We Help**: One extraction gives them a complete, structured context file that persists across every AI session.

### Secondary Persona: The Agency Developer
- **Role**: Developer at a digital agency building for multiple clients
- **Pain Points**: Each client has a different design system. Onboarding a new client's Figma file takes hours. AI output looks generic unless heavily prompted.
- **Goals**: Quickly onboard any client's design system. Produce consistent, on-brand output across projects.
- **How We Help**: Extract a client's design system in 2 minutes. Export as CLAUDE.md. Every AI prompt now has full context.

### Tertiary Persona: The Design System Lead
- **Role**: Design system owner at a mid-size tech company
- **Pain Points**: Developers don't read design documentation. AI tools ignore the design system entirely. Token updates don't reach the engineering team.
- **Goals**: Bridge the gap between design documentation and developer tooling. Ensure AI-generated code follows the design system.
- **How We Help**: DESIGN.md lives in the repo alongside the code. AI agents read it on every prompt. Drift detection (coming soon) alerts when tokens change.

---

## Competitive Positioning

### Market Category
Design system tooling for AI-assisted development.

### Key Differentiators
| AI Studio | Alternatives |
|---|---|
| Extracts from Figma AND live websites | Figma-only or manual documentation |
| Outputs context for 5+ AI tools in one export | Single-tool integrations |
| Structured DESIGN.md with Quick Reference section | Raw token dumps or verbose docs |
| 2-minute automated pipeline | Hours of manual documentation |
| Live component preview to verify output quality | No verification before use |
| Open-source MCP server (MIT) with 9 tools | Closed-source, paid integrations |
| Code → Figma → Designer → Code closed loop | One-directional code generation |

### Objection Handling
- **"Figma MCP already does this"**: Figma MCP gives your AI raw Figma data — layer names, coordinates, nested groups. AI Studio gives it *structured design tokens* — semantic colour names, typography scales, usage guidance, and anti-patterns. The output quality is significantly better.
- **"I can just paste my tokens into CLAUDE.md myself"**: You can. But will you update it every time the design system changes? Will you format it for optimal LLM consumption? Will you generate .cursorrules, AGENTS.md, tokens.css, and tailwind.config.js too? AI Studio does all of this in one click.
- **"Is this just another documentation tool?"**: No. Documentation tools create human-readable docs. AI Studio creates machine-readable context. The DESIGN.md is structured specifically for LLM consumption — Quick Reference section under 75 lines, semantic token names, anti-pattern warnings, component usage patterns.

---

## Pitch Deck Outline

### Slide 1: Title
Layout — The compiler between design systems and AI coding agents.

### Slide 2: Problem
AI coding agents generate generic UI. They don't know your colour palette, typography, spacing, or component patterns. Developers waste time hand-feeding tokens into every prompt.

### Slide 3: The Gap
Design systems live in Figma. AI agents read markdown. Nothing connects the two — until now.

### Slide 4: Solution
Paste a Figma URL or website. AI Studio extracts the design system and compiles it into a structured DESIGN.md. Drop it in your repo. Every AI prompt now has full design context.

### Slide 5: How It Works
1. Paste URL (Figma or website)
2. AI extracts tokens (colours, typography, components)
3. Export AI kit (CLAUDE.md, AGENTS.md, tokens.css, tailwind.config.js)

### Slide 6: Demo
Before/after comparison: AI output without DESIGN.md vs with DESIGN.md.

### Slide 7: Every AI Tool Covered
Claude Code, Cursor, GitHub Copilot, Windsurf, OpenAI Codex — one export, one workflow.

### Slide 8: Website Extraction
No Figma file? Extract from any live website. No competitor does this.

### Slide 9: Revenue Model
Free BYOK tier → Pro at £29/month → Team at £29/month + £15/seat. Open-source CLI/MCP server for adoption. Premium AI Kits bundled in Pro tier.

### Slide 10: Traction / Next Steps
Built in 3 days. [X] extractions completed. Live at layout.design. Backed by layout.design traffic.

---

## Social Proof (Templates)

### Testimonial Template
"Before AI Studio, I spent [time] copying tokens from Figma into my CLAUDE.md. Now I paste the file URL and get a complete AI kit in 2 minutes. My Claude output actually matches our design system."

### Case Study Outline
1. **Client**: [Company] — [size] engineering team, [design tool] for design
2. **Challenge**: AI-generated UI didn't match the design system. Developers spent 30+ minutes per project setting up AI context.
3. **Solution**: Extracted design system with AI Studio. Distributed DESIGN.md to all developers.
4. **Result**: [X]% reduction in design review comments. [Y] hours saved per developer per week.

### Slide 10.5: Open Source + Figma Loop
@layoutdesign/context — MIT-licensed MCP server with 9 tools, 3 free starter kits, and a code-to-design closed loop. `npx @layoutdesign/context install` and your AI has design context in 60 seconds. Push generated components to Figma for designer review, then pull changes back into code.

### Stats to Highlight
- 2-minute extraction time (URL to ZIP)
- 7 export formats in one bundle
- 12 API endpoints
- 9 MCP tools + 3 free starter kits
- Works with 5+ AI coding tools
- Built in 3 days, extended with billing, Figma loop, and docs

---

## Content Calendar Starters

### Launch Week
- **Day 1**: Announcement post — "Introducing AI Studio" (Twitter thread + LinkedIn)
- **Day 2**: Feature highlight — Website extraction ("Extract any design system from a live URL")
- **Day 3**: Build story — "How we built AI Studio in 3 days with Claude Code"
- **Day 4**: Feature highlight — Export bundle ("One ZIP, every AI tool covered")
- **Day 5**: Clone Hall of Fame — publish Linear's DESIGN.md teardown

### Ongoing Content Ideas
- [ ] Weekly design system teardown (Stripe, Notion, Vercel, Spotify, etc.)
- [ ] "Before/After" posts showing AI output quality with vs without DESIGN.md
- [ ] Tutorial: "Set up DESIGN.md in your project in 5 minutes"
- [ ] Comparison: "AI Studio vs manually maintaining design documentation"
- [ ] Technical deep-dive: "How we extract CSS from live websites with Playwright"

---

## Assets Checklist

### Required
- [ ] Logo / wordmark (SVG, PNG)
- [ ] Product screenshots (homepage, Studio view, export modal)
- [ ] Feature graphics (extraction flow, export formats)
- [ ] Social media headers (Twitter/X, LinkedIn)
- [ ] OG image (1200x630)

### Nice to Have
- [ ] 2-minute demo video
- [ ] Before/after comparison GIF
- [ ] Design system teardown graphics
- [ ] AI Kit product images
