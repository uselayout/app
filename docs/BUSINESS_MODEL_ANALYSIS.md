# SuperDuper AI Studio — Business Model Analysis

**Date:** March 2026
**Status:** Recommendation ready — Model C (Hybrid Open Core)

---

## Executive Summary

SuperDuper AI Studio extracts design systems from Figma files and live websites, then packages them as LLM-optimised context bundles for AI coding agents. No other tool extracts from both Figma and live websites into portable, agent-ready formats — the closest are Pencil.dev (IDE canvas with MCP), Anima (Figma API for agents), Paper.design (AI agent bridge), and Zeroheight (design system docs for humans).

This document evaluates five business models and recommends **Hybrid Open Core**: a free BYOK tier with zero AI cost exposure, a £29/mo Pro tier with hosted AI at 89–96% gross margin (typical usage), and a seat-based Team tier for organisations.

---

## Unit Economics

### AI Costs (Claude Sonnet 4.6)

| Operation | Input Tokens | Output Tokens | Cost per Call |
|-----------|:-------------|:--------------|:--------------|
| DESIGN.md generation | 6,400–13,400 | 8,000–16,384 | **£0.15–0.30** |
| Test panel query (with context) | 9,300–16,700 | 2,000–8,000 | **£0.06–0.17** |
| Test panel query (no context) | 800–1,200 | 2,000–8,000 | **£0.03–0.12** |

> **Typical session:** 1 extraction + 1 DESIGN.md + 5 test queries = **£0.50–£1.50**

### Infrastructure (per user/month)

| Item | Cost |
|------|-----:|
| Playwright server (shared) | £0.02 |
| Supabase (self-hosted) | £0.01 |
| Bandwidth / CDN | £0.01 |
| **Total (excl. AI)** | **£0.04** |

**Key insight:** AI calls dominate costs. Everything else is negligible. The business model must be designed around AI cost management.

---

## Competitor Landscape

### Direct Competitors

| Tool | Model | Free Tier | Paid Tier | Notes |
|------|-------|-----------|-----------|-------|
| **Paper.design** | Freemium + usage | 100 MCP calls/wk | $20/user/mo | Closest competitor; design tool + AI bridge |
| **Anima** | Tiered SaaS | Limited | $24–$500/mo | 1.5M users; API powers Bolt.new & Replit; Figma-only, proprietary format |
| **Locofy** | Credit-based | 600 tokens | $399–$1,199/yr | Pay-per-conversion at $0.20–0.40/token |
| **Builder.io** | Freemium | Basic | $30+/mo | Component mapping focus |
| **Pencil.dev** | Freemium | IDE canvas + MCP | Free (early access) | IDE-native design canvas with MCP server; .pen format, no website extraction |

### Adjacent Tools

| Tool | Model | Price | Why It's Different |
|------|-------|-------|--------------------|
| **Figma Dev Mode** | Per-seat | $12–35/seat/mo | Has MCP now, but doesn't generate AI context |
| **Zeroheight** | Tiered | Free–$59+/mo | Design docs for humans, not AI agents |
| **Tokens Studio** | Freemium | Free–$15+/mo | Token management only, no AI synthesis |
| **Specify** | Freemium | Free–custom | Token distribution, no AI context generation |
| **Style Dictionary** | Free OSS | £0 | Amazon-backed; token transforms only |
| **Storybook** | OSS + SaaS | Free / Chromatic $0–399/mo | Component docs + snapshot testing |

### Market Context

- **No tool** extracts design systems from both Figma files AND live websites, then compiles them into portable, LLM-optimised context bundles — Pencil.dev and Anima offer partial AI-agent context but are Figma/IDE-only and use proprietary formats
- Developer tools convert free → paid at ~5% (half the ~10% rate of general SaaS)
- 85% of SaaS now uses some form of usage-based pricing
- Hybrid models (base subscription + usage overage) are the 2025–2026 standard for AI tools
- The "open core" playbook (Supabase, PostHog, GitLab) is proven for developer tools

---

## Five Business Models Evaluated

### Model A — Open Source + Paid Kits

Core tool is free and open source. Revenue from pre-built AI Kits and a kit library subscription.

| Item | Price |
|------|------:|
| Studio (self-hosted or hosted, BYOK) | Free |
| Starter Kits (Linear, Stripe, Notion) | Free |
| Premium Kits (Apple iOS, Revolut, Vercel) | £79–£129 each |
| Kit Library Pass | £299/year |
| Custom Kit Creation | £500–£2,000 |

**Strengths:** Maximum adoption, zero AI cost risk, high-margin digital products, community contributions.

**Weaknesses:** Low revenue ceiling (£5K–£30K/yr at 1,000 users), one-time purchases don't compound, users who can extract won't buy kits.

**Best for:** Reputation building and eventual pivot to SaaS.

---

### Model B — Freemium SaaS (AI Credits)

Free tier with limited generations. Paid tiers include hosted AI credits and team features.

| Tier | Price | AI Credits/mo |
|------|------:|:--------------|
| Free | £0 | 5 DESIGN.md (BYOK) |
| Pro | £19/mo | 30 DESIGN.md + 100 test queries |
| Team | £49/seat/mo | 100 DESIGN.md + 300 test queries |
| Enterprise | Custom | Unlimited |

**Strengths:** Recurring revenue, clear upgrade path, matches market norms.

**Weaknesses:** Heavy users can be unprofitable (margin: -£21 to +£7 at full Pro usage). Must build billing, usage tracking, credit management. 95% of users never pay.

**Revenue estimate:** £14,340/yr at 1,000 users (5% conversion).

---

### Model C — Hybrid Open Core ★ Recommended

Open-source CLI/MCP server for adoption. Free hosted Studio with BYOK. Paid tiers add hosted AI, premium features, and team collaboration.

| Tier | Price | What's Included |
|------|------:|:----------------|
| **Open Source** | Free forever | CLI, MCP server, 3 starter kits, self-host Studio |
| **Studio Free** | £0 (BYOK) | Hosted Studio, all extraction, all exports, unlimited projects |
| **Studio Pro** | £29/mo | Hosted AI (50 DESIGN.md + 100 test queries), drift monitoring, all premium kits, version history, priority queue |
| **Studio Team** | £29/mo + £15/seat | Shared library, team management, centralised billing, SSO |
| **Enterprise** | Custom | Self-hosted, unlimited, custom integrations, SLA |
| **Credit Top-up** | £15/pack | 30 DESIGN.md + 80 test queries |

**Why this wins — see [Recommendation](#recommendation) below.**

---

### Model D — Platform / API-First

SuperDuper as infrastructure. Other tools integrate via API. Pay-per-call pricing.

| Endpoint | Price |
|----------|------:|
| Website extraction | £0.05/call |
| Figma extraction | £0.03/call |
| DESIGN.md synthesis | £0.50/call |
| Test query | £0.10/call |
| Monthly minimum | £50/mo |

**Strengths:** B2B revenue is sticky, scales independently, excellent margins at volume.

**Weaknesses:** Long sales cycles, heavy DevRel investment, someone else owns the customer.

**Best for:** Phase 2/3 bolt-on once product-market fit is proven.

---

### Model E — Marketplace (Community Kits)

Anyone can create and sell kits. Platform takes 20–30% commission.

| Item | Price Range | Platform Cut |
|------|:------------|:-------------|
| Community kits | £5–£50 | 25% |
| Verified kits | £79–£199 | 15% |
| Custom commissions | £200–£2,000 | 10% |

**Strengths:** Network effects, low marginal cost, community scales supply.

**Weaknesses:** Chicken-and-egg bootstrap problem, quality control, small creator pool.

**Best for:** Phase 3 bolt-on to the Hybrid model.

---

## Comparison Matrix

| Criteria | A: OSS + Kits | B: SaaS | C: Hybrid ★ | D: API | E: Marketplace |
|----------|:---:|:---:|:---:|:---:|:---:|
| Time to revenue | Slow | Medium | Medium | Slow | Very slow |
| Revenue ceiling | Low | High | High | Very high | High (at scale) |
| AI cost risk | None | High | **Low** | Medium | None |
| Adoption speed | Fast | Medium | **Fast** | Slow | Slow |
| Dev complexity | Low | High | **Medium** | High | High |
| Defensibility | Low | Medium | **High** | High | Very high |
| Solo/small team fit | ✓✓✓ | ✓ | **✓✓** | ✗ | ✗ |

---

## Recommendation

### Model C — Hybrid Open Core

**Six reasons this is the right model:**

1. **Zero AI cost risk on free tier.** BYOK means free users cost ~£0.04/month in infrastructure. No Anthropic bill surprise.

2. **Open source drives adoption.** The CLI and MCP server are already MIT-licensed. GitHub stars → credibility → enterprise inbound.

3. **Natural upgrade path.** "Tired of managing API keys? Upgrade to Pro." Convenience over configuration is the easiest developer tool upsell.

4. **Premium kits bundled in Pro.** Not sold separately — increases perceived value and avoids the "I can just extract it myself" objection.

5. **Positive unit economics from day one.** At typical 40% credit utilisation, Pro tier runs at 89–96% gross margin. Even at 100% utilisation, it's 72–90% margin.

6. **Team tier scales with orgs.** Seat-based pricing is where the real revenue grows.

### Conversion Funnel

```
GitHub / CLI users (free, unlimited)
  └─ 20% → Studio Free (BYOK, all features)
       └─ 8–10% → Studio Pro (hosted AI, £29/mo)
            └─ 15–20% → Studio Team (£29 + £15/seat)
```

### Pro Tier Economics

| Scenario | AI Cost | Revenue | Gross Margin |
|----------|--------:|--------:|:-------------|
| Typical usage (40%) | £1.20–£3.20 | £29 | **89–96%** |
| Heavy usage (70%) | £2.10–£5.60 | £29 | **81–93%** |
| Max usage (100%) | £3.00–£8.00 | £29 | **72–90%** |

### Revenue Projections

| Milestone | Total Users | Paying | Monthly Revenue | Annual Revenue |
|-----------|:------------|:-------|:----------------|:---------------|
| **Year 1** | 2,000 | 80 Pro + 10 Team (15 seats) | £2,545 | **£30,540** |
| **Year 2** | 10,000 | 500 Pro + 60 Team (180 seats) | £17,200 | **£206,400** |
| **Year 3** | 50,000 | 2,500 Pro + 300 Team (900 seats) | £86,000 | **£1,032,000** |

### Pricing Page Positioning

> **Free forever with your own API key.**
> Or let us handle everything for £29/month.

This disarms the "why would I pay?" objection by making BYOK the free tier, then selling convenience and extras.

---

## Implementation Roadmap

### Phase 1 — Monetisation Foundation (4 weeks)

- Token counting middleware on all AI endpoints
- Usage tracking persisted to Supabase
- Credit/quota system (check before each AI call)
- Stripe billing integration (Pro + Team subscriptions, credit top-ups)
- `/pricing` page
- Ensure BYOK path is frictionless

### Phase 2 — Team & Value-Add (Month 2–3)

- Team management (invites, shared library, centralised billing)
- Drift monitoring (re-extract + diff against previous DESIGN.md)
- 3–5 more premium kits (Apple iOS, Vercel, Revolut, Shopify, GitHub)
- Usage dashboard for subscribers

### Phase 3 — Platform Expansion (Month 4–6)

- Community kit marketplace (Model E bolt-on)
- API access tier (Model D bolt-on)
- Enterprise self-hosted offering
- SSO / SAML

---

## Risk Matrix

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|------------|
| Claude API price increase | High | Low | Multi-model support (GPT-4o fallback), adjust credit packs |
| Paper.design feature parity | Medium | Medium | They're a design tool, not an extractor — different positioning. Ship faster on extraction quality |
| Free tier abuse (Playwright) | Medium | Medium | Rate limit extractions (10/day), require account |
| Low conversion rate (<3%) | High | Medium | Invest in onboarding, demonstrate BYOK vs hosted value gap clearly |
| Team adoption slower than projected | Medium | Medium | Target agencies first (they can bill clients for the tool) |

---

## Key Metrics

| Metric | Target | Why It Matters |
|--------|:-------|:---------------|
| Free → Pro conversion | >5% | Revenue growth driver |
| Monthly churn (Pro) | <5% | Retention = compounding |
| AI cost as % of Pro revenue | <35% | Margin health |
| DESIGN.md generations/user/mo | 3–8 | Engagement signal |
| Test queries/user/mo | 10–30 | Stickiness indicator |
| Time to first DESIGN.md | <5 min | Onboarding quality |
| NPS | >50 | Word-of-mouth growth |

---

## Appendix: Sources

- [Paper.design Pricing](https://paper.design/pricing)
- [Anima](https://www.animaapp.com)
- [Locofy Pricing](https://www.locofy.ai/pricing)
- [Builder.io Pricing](https://www.builder.io/pricing)
- [Figma Pricing](https://www.figma.com/pricing/)
- [Chromatic Pricing](https://www.chromatic.com/pricing)
- [Zeroheight Pricing](https://zeroheight.com/pricing/)
- [Tokens Studio Pricing](https://tokens.studio/pricing)
- [Specify Pricing](https://specifyapp.com/pricing)
- [PostHog: Open Source Business Models](https://posthog.com/blog/open-source-business-models)
- [GitLab Pricing Handbook](https://about.gitlab.com/company/pricing/)
- [Supabase Pricing](https://supabase.com/pricing)
- [First Page Sage: Freemium Conversion Rates](https://firstpagesage.com/seo-blog/saas-freemium-conversion-rates/)
- [Flexprice: AI Usage-Based Pricing](https://flexprice.io/blog/why-ai-companies-have-adopted-usage-based-pricing)
- [Pencil.dev](https://www.pencil.dev)
- [Figma MCP Server](https://www.figma.com/blog/introducing-figma-mcp-server/)

---

*Generated March 2026 — SuperDuper AI Studio*
