# Phase 7: Design System Marketplace

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a marketplace where orgs can discover, preview, and fork pre-built design system templates — tokens, typography, icons, and components — as starting points for their own design system. Templates are curated starter kits that orgs can customise after forking.

**Architecture:** A `layout_template` table references a source org whose assets (tokens, typefaces, icons, components) serve as the template content. A fork operation copies all assets from the template org into the user's org. A public browse page lets users discover templates. An admin publish flow lets orgs share their design system as a template.

**Tech Stack:** Next.js 15 App Router, Supabase PostgreSQL, TypeScript, Zod

---

## Important Context

- **Phases 1-6 complete:** Org model, component registry, candidates, MCP, API keys, tokens, typography, icons, audit, drift, analytics all built
- **Token CRUD:** `lib/supabase/tokens.ts` — `getTokensByOrg()`, `bulkCreateTokens()`
- **Typography CRUD:** `lib/supabase/typography.ts` — `getTypefacesByOrg()`, `createTypeface()`, etc.
- **Icon CRUD:** `lib/supabase/icons.ts` — `getIconsByOrg()`, `bulkCreateIcons()`
- **Component CRUD:** `lib/supabase/components.ts` — `getComponentsByOrg()`, `createComponent()`
- **Migrations:** NOT run yet — create new migration files only
- **Dashboard pattern:** `app/(dashboard)/[org]/` pages with sidebar

---

### Task 1: Template Database Table (Migration 016)

**Files:**
- Create: `migrations/016_templates.sql`

```sql
-- Migration 016: Design system templates

CREATE TABLE IF NOT EXISTS layout_template (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  long_description TEXT,

  -- Source
  source_org_id UUID NOT NULL REFERENCES layout_organization(id) ON DELETE CASCADE,

  -- Metadata
  preview_image TEXT,
  category TEXT DEFAULT 'general',
  tags TEXT[] DEFAULT '{}',

  -- Stats (cached)
  token_count INT DEFAULT 0,
  component_count INT DEFAULT 0,
  typeface_count INT DEFAULT 0,
  icon_count INT DEFAULT 0,
  fork_count INT DEFAULT 0,

  -- Pricing
  is_free BOOLEAN DEFAULT true,
  price_cents INT DEFAULT 0,

  -- Visibility
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  featured BOOLEAN DEFAULT false,

  -- Author
  author_name TEXT,
  author_url TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_template_published ON layout_template (is_published, featured);
CREATE INDEX IF NOT EXISTS idx_template_category ON layout_template (category) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_template_source ON layout_template (source_org_id);
```

**Step 2: Commit**

---

### Task 2: Template Types & CRUD

**Files:**
- Create: `lib/types/template.ts`
- Create: `lib/supabase/templates.ts`

**Types:**

```typescript
export interface Template {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  longDescription: string | null;
  sourceOrgId: string;
  previewImage: string | null;
  category: string;
  tags: string[];
  tokenCount: number;
  componentCount: number;
  typefaceCount: number;
  iconCount: number;
  forkCount: number;
  isFree: boolean;
  priceCents: number;
  isPublished: boolean;
  publishedAt: string | null;
  featured: boolean;
  authorName: string | null;
  authorUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TemplatePreview extends Template {
  tokens: { colors: number; spacing: number; typography: number; radius: number; effects: number };
  componentNames: string[];
  typefaceNames: string[];
}
```

**CRUD:**

- `getPublishedTemplates(filters?: { category?, search?, featured? })` — public browse, published only
- `getTemplateBySlug(slug)` — single template by slug (published only)
- `getTemplateById(id)` — single template (any status, for admin)
- `getTemplatesByOrg(orgId)` — templates owned by an org
- `createTemplate(data)` — insert template
- `updateTemplate(id, data)` — update fields
- `deleteTemplate(id)` — hard delete
- `publishTemplate(id)` — set is_published=true, published_at=now()
- `unpublishTemplate(id)` — set is_published=false
- `incrementForkCount(id)` — increment fork_count by 1
- `updateTemplateCounts(id, sourceOrgId)` — recalculate token/component/typeface/icon counts from the source org's actual data

**Step 2: Commit**

---

### Task 3: Fork Engine

**Files:**
- Create: `lib/marketplace/fork.ts`

The fork engine copies all assets from a template's source org into a target org:

```typescript
export async function forkTemplate(templateId: string, targetOrgId: string, userId: string): Promise<{
  tokensForked: number;
  componentsForked: number;
  typefacesForked: number;
  iconsForked: number;
}>
```

Steps:
1. Fetch the template to get `sourceOrgId`
2. Fetch all tokens from source org via `getTokensByOrg(sourceOrgId)`
3. Map tokens to create payloads (new org_id = targetOrgId, reset IDs)
4. Bulk create tokens in target org via `bulkCreateTokens(targetOrgId, ...)`
5. Fetch all typefaces from source org
6. For each typeface: create in target org, then fetch and create its type scale entries
7. Fetch all icons from source org
8. Bulk create icons in target org
9. Fetch all approved components from source org
10. For each component: create in target org with `source: "manual"` (since it's a fork)
11. Increment fork count on the template
12. Return counts

Handle slug conflicts gracefully — if target org already has a token/component/icon with the same slug, append a suffix.

**Step 2: Commit**

---

### Task 4: Template API Routes

**Files:**
- Create: `app/api/templates/route.ts` — GET browse (public), POST create (authenticated)
- Create: `app/api/templates/[slug]/route.ts` — GET detail (public)
- Create: `app/api/templates/[slug]/fork/route.ts` — POST fork (authenticated)
- Create: `app/api/organizations/[orgId]/templates/route.ts` — GET org's templates, POST publish

**GET browse (`/api/templates`):**
- Public (no auth required)
- Query params: `category`, `search`, `featured`
- Return published templates array

**GET detail (`/api/templates/[slug]`):**
- Public
- Return template with preview data (token counts by type, component names, typeface names)
- To build preview: query source org's tokens/components/typefaces and aggregate

**POST fork (`/api/templates/[slug]/fork`):**
- Requires session auth (any logged-in user)
- Body: `{ orgId: string }` — target org to fork into
- Verify user has `editProject` permission on target org
- Call `forkTemplate()`
- Return fork results

**GET org templates (`/api/organizations/[orgId]/templates`):**
- `requireOrgAuth(orgId, "manageOrg")`
- Return templates owned by this org

**POST publish (`/api/organizations/[orgId]/templates`):**
- `requireOrgAuth(orgId, "manageOrg")`
- Body: `{ name, slug, description, longDescription?, category?, tags?, authorName?, authorUrl? }`
- Create template with sourceOrgId = orgId
- Update counts from org's actual data
- Return created template (unpublished by default — need separate publish call)

**Step 2: Commit**

---

### Task 5: Template Browse Page (Public)

**Files:**
- Create: `app/(marketing)/templates/page.tsx`
- Create: `app/(marketing)/templates/[slug]/page.tsx`
- Create: `components/marketing/TemplateCard.tsx`
- Create: `components/marketing/TemplateDetail.tsx`

**Browse page (`/templates`):**
- Public page (no auth needed), light marketing theme
- Header: "Design System Templates" + "Start with a professionally crafted design system"
- Category filter: All | General | Corporate | Bold | Minimal | shadcn
- Search input
- Grid of template cards (3 per row)

**TemplateCard:**
- Preview image (or placeholder gradient)
- Template name, description (2-line truncate)
- Stats row: "12 tokens · 8 components · 2 fonts"
- Fork count badge
- "Free" or price badge
- Category badge

**Template detail page (`/templates/[slug]`):**
- Full-width header with name, description, author
- Long description (markdown-rendered or plain text)
- Stats grid: token count, component count, typeface count, icon count, fork count
- Token preview: colour swatches (first 12 colours from source org)
- Component list: names with descriptions
- Typeface list: font families with roles
- CTA button: "Use This Template" → if logged in, opens fork modal (select org), if not logged in, links to /login

**Fork modal:**
- Select target org from user's orgs
- "Fork" button
- Loading state during fork
- Success: redirect to target org's dashboard

**Styling:**
- Use the MARKETING theme (light mode, white bg) — NOT studio dark theme
- Similar to the existing marketing homepage and docs pages
- Primary CTA: indigo-600, rounded-xl
- Cards: white bg, subtle border, rounded-xl, shadow-sm
- Text: slate-900 headings, slate-600 body

**Step 2: Commit**

---

### Task 6: Template Publishing Flow

**Files:**
- Create: `app/(dashboard)/[org]/settings/templates/page.tsx`
- Create: `components/dashboard/TemplatePublisher.tsx`

**Settings sub-page (`/[org]/settings/templates`):**
- Permission-gated: owner only
- List of org's templates (published and unpublished)
- "Create Template" button

**TemplatePublisher component:**

**Create flow:**
1. Form: name, slug (auto-generated from name), description, long description, category dropdown, tags, author name/URL
2. Preview section showing current org's asset counts
3. Submit → creates template (unpublished)
4. Publish button → sets published=true

**Template list:**
- Card per template: name, status (published/draft), fork count, asset counts
- Actions: Edit, Publish/Unpublish, Delete

**Update settings page** (`app/(dashboard)/[org]/settings/page.tsx`):
- Add "Templates" link card alongside API Keys and Audit Log

**Step 2: Commit**

---

### Task 7: Type Check & Build Verification

**Step 1: Run typecheck**
```bash
npm run typecheck
```

**Step 2: Run lint**
```bash
npm run lint
```

**Step 3: Run build**
```bash
npm run build
```

**Step 4: Fix any issues, commit**

---

## Notes for Implementer

- **Template = snapshot reference, not a copy.** The template points to a source org. Forking copies assets at fork time. If the source org changes tokens later, existing forks are NOT affected (they already have their own copies).
- **Marketing pages use LIGHT theme** — white backgrounds, slate text, NOT the dark studio theme. Look at `app/(marketing)/` or `app/page.tsx` for styling patterns.
- **Slug generation** — same pattern as components/tokens: lowercase, hyphenate, strip special chars
- **Fork is idempotent-ish** — forking twice adds duplicate assets. Consider checking if target org already has assets with matching slugs and skipping them (or appending suffix).
- **Preview image** — for V1, use a placeholder gradient or the template's first colour token. Real screenshots can come later.
- **No Stripe integration yet** — `price_cents` and `is_free` are stored but not enforced. All templates are free for V1.
- **Route params are Promises** in Next.js 15
- **proxy.ts** — `/templates` routes are public (marketing), no auth needed. The fork endpoint needs session auth but NOT org auth on the template itself.
