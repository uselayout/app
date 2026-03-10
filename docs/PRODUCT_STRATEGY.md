# SuperDuper AI Studio — Product Strategy

## What We Have Today

A working browser-based tool that:
- Extracts design systems from Figma files (via API) and live websites (via Playwright)
- Synthesises a structured DESIGN.md using Claude
- Exports AI context bundles (CLAUDE.md, AGENTS.md, .cursorrules, tokens.css, tokens.json, tailwind.config.js)
- Has auth (Better Auth), project persistence (Supabase), and a test panel with live component preview
- Staging marketing page at superduperui.com/ai-studio

---

## Competitive Landscape

### Direct Threats
| Competitor | What They Do | Our Edge |
|---|---|---|
| **Figma MCP Server** (free, Feb 2026) | Connects Claude directly to Figma — AI reads components live | We extract from *websites* too. Figma MCP gives raw Figma data, not structured design tokens |
| **Anima / Locofy** | Figma-to-code plugins | They generate code, we generate *context*. Different job entirely |
| **Style Dictionary** | Token pipeline tool | Manual setup, no extraction. We automate the whole flow |
| **Zeroheight / Supernova** | Design system documentation | Enterprise, expensive, no AI agent integration |

### Key Differentiators
1. **Website extraction** — no competitor does this. Massive unlock for teams without Figma
2. **AI-native output** — CLAUDE.md, AGENTS.md, .cursorrules are formats competitors don't generate
3. **Speed** — paste a URL, get a complete AI kit in under 2 minutes
4. **Works with every AI tool** — not locked to one editor or agent

---

## Revenue Model

### Tier Structure

| Tier | Price | What You Get |
|---|---|---|
| **Free (BYOK)** | £0 | Bring your own Anthropic API key. Unlimited extractions. All export formats. |
| **Pro** | £19/month | Hosted Claude (no API key needed). Drift monitoring (re-extract weekly, diff changes). Priority extraction queue. |
| **Team** | £49/month | Everything in Pro. Shared project library. Team member seats. Centralised API key management. |

### COGS Per Extraction
- Claude Sonnet call for synthesis: ~£0.05–0.15
- Playwright execution (website): ~£0.02–0.05
- Figma API calls: free (user's PAT)
- **Total: ~£0.10–0.25 per extraction**

At Pro tier (£19/month), break-even is ~75–190 extractions/month — most users will do 5–20.

### Pre-built AI Kits (One-Time Revenue)

Sell ready-made DESIGN.md bundles for popular design systems:

| Kit | Price | Contents |
|---|---|---|
| Linear Kit | £79 | Full DESIGN.md, tokens, tailwind config, component inventory |
| Stripe Kit | £99 | Dashboard + Checkout design system, complete token set |
| Apple iOS Kit | £129 | HIG-based tokens, SF Pro typography, full component map |
| Vercel Kit | £79 | Geist design system, dark/light tokens, component patterns |
| Notion Kit | £79 | Typography-heavy system, block-based component patterns |

These are high-margin (extract once, sell many times) and serve as proof of capability.

---

## Missing Features (Priority Order)

### 1. CLI Sync Tool (Highest Impact)
**What:** `npx @superduperai/sync` — pulls latest DESIGN.md into your project from the cloud
**Why:** Removes friction entirely. Developer runs one command, gets fresh context. No manual download/unzip.
**Scope:** ~2–3 days of work. Read project config from `.superduperrc`, fetch from API, write files.

### 2. Drift Detection
**What:** Weekly automated re-extraction. Diff against previous version. Email/Slack alert if tokens changed.
**Why:** Design systems drift. This is the "why you stay subscribed" feature for Pro tier.
**Scope:** Cron job + diff engine + notification. ~1 week.

### 3. Design System Versioning
**What:** Store every extraction as a version. Compare v1 vs v2. Roll back.
**Why:** Enterprises need audit trails. Also enables the drift detection feature above.
**Scope:** Database schema change + UI for version history. ~1 week.

### 4. AI Kit Marketplace
**What:** Browse and purchase pre-built kits for popular apps (Linear, Stripe, Apple, etc.)
**Why:** Immediate revenue without requiring users to extract anything. Great for SEO ("Linear design system for AI").
**Scope:** Product pages on superduperui.com + Stripe checkout + delivery. ~1–2 weeks.

### 5. Team Features
**What:** Shared project library, team seats, centralised billing.
**Why:** Unlocks Team tier revenue. Companies have 3–10 developers sharing one design system.
**Scope:** Database multi-tenancy, invite flow, permissions. ~2 weeks.

---

## Go-To-Market Strategy

### Launch Sequence

**Week 1: Show HN + Reddit**
- Post "Show HN: I built a compiler that turns Figma files into AI coding context"
- Cross-post to r/cursor, r/ClaudeAI, r/webdev
- Include a live demo link and 2-minute video

**Week 2: Product Hunt**
- Launch on Product Hunt with the "Clone Hall of Fame" angle (see below)
- Target: top 5 of the day

**Week 3: AI Kit Launch**
- Release first 3 kits (Linear, Stripe, Vercel)
- Announce on Twitter/X with screenshots of AI output quality with vs without DESIGN.md
- "Before/After" content performs well

**Ongoing: Content Flywheel**
- Publish a new "design system teardown" blog post weekly
- Each post is a DESIGN.md for a famous product (Notion, Spotify, etc.)
- SEO captures "[app name] design system" searches
- Each post has a CTA: "Extract your own with AI Studio"

### Clone Hall of Fame
Publicly publish DESIGN.md teardowns for 10 famous products. This serves as:
1. **Proof of capability** — "look what the tool produces"
2. **SEO magnet** — ranks for "[product] design system" queries
3. **Free samples** — developers try a kit, then want to extract their own
4. **Social proof** — "used to analyse Stripe, Linear, Vercel design systems"

### Distribution via superduperui.com
- superduperui.com already gets traffic from developers browsing UI clones
- The `/ai-studio` page is live (staging) — ready to link from nav on launch day
- `studio.superduperui.com` subdomain for the app itself
- Cross-promote: "Built a clone in Figma? Extract the design system with AI Studio"

---

## Biggest Risk

**Figma MCP gets good enough.** If Figma improves their MCP server to output structured tokens (not raw Figma data), the Figma extraction half of our tool becomes less valuable.

**Mitigation:**
1. Double down on website extraction — Figma MCP will never do this
2. Position as "the compiler" not "the extractor" — we synthesise structured DESIGN.md, not raw data
3. Build the CLI sync + drift detection moat — these are workflow features, not extraction features
4. AI Kits are extraction-source-agnostic — they're valuable regardless of how the data was captured

---

## Next Steps (Recommended Order)

1. Set up `studio.superduperui.com` subdomain in Coolify (DNS + domain config)
2. Build the CLI sync tool (`npx @superduperai/sync`)
3. Create 3 AI Kits (Linear, Stripe, Vercel) and list on superduperui.com
4. Write 3 "design system teardown" blog posts for SEO
5. Prepare Show HN post + 2-minute demo video
6. Launch sequence: HN → Reddit → Product Hunt → Kits
7. Add Stripe billing for Pro tier
8. Build drift detection for subscriber retention
