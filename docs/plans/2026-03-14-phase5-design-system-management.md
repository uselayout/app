# Phase 5: Design System Management

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build dedicated management pages for design tokens, typography, and icons — giving orgs full CRUD control over their design system assets with visual editors.

**Architecture:** Three independent asset types (tokens, typography, icons), each with its own database table, CRUD module, API routes, and dashboard page. All org-scoped. Tokens are the foundation — typography and icons reference the same patterns. Each page follows the existing studio design system (dark theme, CSS variable tokens).

**Tech Stack:** Next.js 15 App Router, Supabase PostgreSQL, Zustand, shadcn/ui, TypeScript, Zod

---

## Important Context

- **Phases 1-4 complete:** Org model, component registry, candidate workflow, MCP endpoint, API keys all built
- **Auth:** `requireOrgAuth(orgId, permission?)` in `lib/api/auth-context.ts` — session-based
- **Existing token types:** `ExtractedToken` in `lib/types/index.ts` has `name, value, type, category, cssVariable, description`
- **Existing export generators:** `lib/export/tokens-css.ts`, `tokens-json.ts`, `tailwind-config.ts` — operate on `ExtractedTokens`
- **Dashboard pattern:** Pages in `app/(dashboard)/[org]/`, sidebar in `components/dashboard/Sidebar.tsx`
- **Component CRUD pattern:** `lib/supabase/components.ts` — row types, mappers, query functions
- **API route pattern:** Zod validation, `requireOrgAuth()`, JSON responses
- **Migrations:** NOT run yet — create new migration files only
- **Sidebar nav:** Currently has Projects, Library, Candidates, Settings
- **Route params:** Next.js 15 — `params` is `Promise<{}>`, must `await params`

---

### Task 1: Token Database Table (Migration 010)

**Files:**
- Create: `migrations/010_tokens.sql`

**Step 1: Write the migration**

```sql
-- Migration 010: Design tokens

CREATE TABLE IF NOT EXISTS layout_token (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES layout_organization(id) ON DELETE CASCADE,
  project_id UUID REFERENCES layout_projects(id) ON DELETE SET NULL,

  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  css_variable TEXT,

  type TEXT NOT NULL CHECK (type IN ('color', 'typography', 'spacing', 'radius', 'effect', 'motion')),
  category TEXT NOT NULL DEFAULT 'primitive' CHECK (category IN ('primitive', 'semantic', 'component')),
  value TEXT NOT NULL,
  resolved_value TEXT,

  group_name TEXT,
  sort_order INT DEFAULT 0,

  description TEXT,
  source TEXT CHECK (source IN ('extracted', 'manual', 'figma-variable')),

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(org_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_token_org ON layout_token (org_id);
CREATE INDEX IF NOT EXISTS idx_token_type ON layout_token (org_id, type);
```

**Step 2: Commit**

```bash
git add migrations/010_tokens.sql
git commit -m "feat: add token table (migration 010)"
```

---

### Task 2: Token Types & CRUD

**Files:**
- Create: `lib/types/token.ts`
- Create: `lib/supabase/tokens.ts`

**Types (`lib/types/token.ts`):**

```typescript
export type DesignTokenType = "color" | "typography" | "spacing" | "radius" | "effect" | "motion";

export type DesignTokenCategory = "primitive" | "semantic" | "component";

export type DesignTokenSource = "extracted" | "manual" | "figma-variable";

export interface DesignToken {
  id: string;
  orgId: string;
  projectId: string | null;
  name: string;
  slug: string;
  cssVariable: string | null;
  type: DesignTokenType;
  category: DesignTokenCategory;
  value: string;
  resolvedValue: string | null;
  groupName: string | null;
  sortOrder: number;
  description: string | null;
  source: DesignTokenSource | null;
  createdAt: string;
  updatedAt: string;
}
```

**CRUD (`lib/supabase/tokens.ts`):**

Follow the `components.ts` pattern exactly — row type, mapper function, then:

- `getTokensByOrg(orgId, filters?: { type?, category?, groupName?, search? })` — list tokens with optional filters, ordered by type → group_name → sort_order
- `getTokenById(id)` — single token
- `createToken(data: { orgId, name, type, value, category?, cssVariable?, groupName?, sortOrder?, description?, source?, projectId? })` — auto-generate slug from name, insert
- `updateToken(id, data: Partial<...>)` — update fields, set updated_at
- `deleteToken(id)` — hard delete
- `bulkCreateTokens(orgId, tokens: Array<...>)` — insert multiple tokens at once (for import)
- `getTokenGroups(orgId, type)` — get distinct group_name values for a token type

Slug generation: `name.toLowerCase().replace(/[/\s]+/g, "-").replace(/[^a-z0-9-]/g, "")`. If the slug already exists, append `-2`, `-3`, etc.

**Step 2: Commit**

```bash
git add lib/types/token.ts lib/supabase/tokens.ts
git commit -m "feat: add token types and CRUD"
```

---

### Task 3: Token API Routes

**Files:**
- Create: `app/api/organizations/[orgId]/tokens/route.ts` — GET list, POST create
- Create: `app/api/organizations/[orgId]/tokens/[tokenId]/route.ts` — GET detail, PATCH update, DELETE
- Create: `app/api/organizations/[orgId]/tokens/import/route.ts` — POST bulk import

**GET list (`/api/organizations/[orgId]/tokens`):**
- `requireOrgAuth(orgId, "viewProject")`
- Query params: `type`, `category`, `group`, `search`
- Return array of tokens

**POST create:**
- `requireOrgAuth(orgId, "editProject")`
- Zod: `{ name: string, type: DesignTokenType, value: string, category?, cssVariable?, groupName?, description?, source? }`
- Return created token

**GET detail (`/tokens/[tokenId]`):**
- `requireOrgAuth(orgId, "viewProject")`
- Return single token

**PATCH update:**
- `requireOrgAuth(orgId, "editProject")`
- Zod: partial of create fields
- Return updated token

**DELETE:**
- `requireOrgAuth(orgId, "editProject")`
- Return `{ success: true }`

**POST import (`/tokens/import`):**
- `requireOrgAuth(orgId, "editProject")`
- Zod: `{ tokens: Array<{ name, type, value, category?, cssVariable?, groupName?, description? }>, source?: string }`
- Use `bulkCreateTokens()`
- Return `{ imported: number }`

**Step 2: Commit**

```bash
git add app/api/organizations/
git commit -m "feat: add token API routes"
```

---

### Task 4: Token Editor Page

**Files:**
- Create: `app/(dashboard)/[org]/tokens/page.tsx`
- Create: `components/dashboard/TokenEditor.tsx`
- Create: `components/dashboard/TokenSwatch.tsx`

**Token page (`/[org]/tokens`):**
- Client component
- Fetches tokens from API filtered by selected type tab
- Renders `TokenEditor` with token data

**TokenEditor component:**

**Layout:**
- Type tabs across the top: Colours | Typography | Spacing | Radius | Effects | Motion
- Below tabs: group-based sections
- Each group rendered as a section with heading and token grid/list
- "Add Token" button per group + global "Add Token" button
- "Import from Project" button (pulls tokens from project's extraction_data)

**Colour tokens (type = "color"):**
- Render as swatch grid grouped by `group_name`
- Each swatch: coloured square + name + value + CSS variable
- Click swatch → inline edit: text input for hex/rgb value + name edit
- Visual: 48x48px swatch, `border border-[var(--studio-border)]`, rounded

**Spacing/Radius tokens:**
- Render as horizontal list with visual bar showing relative size
- Bar width proportional to value (cap at 100%)
- Name + value + CSS variable

**Typography tokens:**
- Render as list with specimen text at actual size/weight
- Show font-family, size, weight, line-height

**Effect tokens:**
- Render with the effect applied to a sample box
- Box with shadow/border effect visible

**TokenSwatch component:**
- Takes a `DesignToken` prop
- Renders appropriate visual for the token type
- Inline edit mode with save/cancel
- Calls PATCH API on save

**Import from Project flow:**
- Button opens modal listing org's projects
- Select project → fetch its `extraction_data`
- Map `ExtractedToken[]` to create token payloads
- POST to `/tokens/import`
- Refresh token list

**Step 2: Commit**

```bash
git add app/\(dashboard\)/\[org\]/tokens/ components/dashboard/TokenEditor.tsx components/dashboard/TokenSwatch.tsx
git commit -m "feat: add token editor page with visual swatches"
```

---

### Task 5: Typography Database Table (Migration 011) + Types + CRUD

**Files:**
- Create: `migrations/011_typography.sql`
- Create: `lib/types/typography.ts`
- Create: `lib/supabase/typography.ts`

**Migration:**

```sql
-- Migration 011: Typography

CREATE TABLE IF NOT EXISTS layout_typeface (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES layout_organization(id) ON DELETE CASCADE,

  family TEXT NOT NULL,
  source TEXT CHECK (source IN ('google', 'custom', 'system', 'extracted')),
  google_fonts_url TEXT,
  weights TEXT[] DEFAULT '{}',
  role TEXT CHECK (role IN ('heading', 'body', 'mono', 'display', 'accent')),

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(org_id, family)
);

CREATE TABLE IF NOT EXISTS layout_type_scale (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES layout_organization(id) ON DELETE CASCADE,
  typeface_id UUID NOT NULL REFERENCES layout_typeface(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  font_size TEXT NOT NULL,
  font_weight TEXT NOT NULL,
  line_height TEXT NOT NULL,
  letter_spacing TEXT DEFAULT '0',
  text_transform TEXT,

  sort_order INT DEFAULT 0,

  UNIQUE(org_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_typeface_org ON layout_typeface (org_id);
CREATE INDEX IF NOT EXISTS idx_type_scale_org ON layout_type_scale (org_id);
```

**Types (`lib/types/typography.ts`):**

```typescript
export type TypefaceSource = "google" | "custom" | "system" | "extracted";
export type TypefaceRole = "heading" | "body" | "mono" | "display" | "accent";

export interface Typeface {
  id: string;
  orgId: string;
  family: string;
  source: TypefaceSource | null;
  googleFontsUrl: string | null;
  weights: string[];
  role: TypefaceRole | null;
  createdAt: string;
  updatedAt: string;
}

export interface TypeScale {
  id: string;
  orgId: string;
  typefaceId: string;
  name: string;
  slug: string;
  fontSize: string;
  fontWeight: string;
  lineHeight: string;
  letterSpacing: string;
  textTransform: string | null;
  sortOrder: number;
}
```

**CRUD (`lib/supabase/typography.ts`):**

- `getTypefacesByOrg(orgId)` — list all typefaces
- `getTypefaceById(id)` — single typeface
- `createTypeface(data)` — insert
- `updateTypeface(id, data)` — update
- `deleteTypeface(id)` — hard delete (cascades to type_scale)
- `getTypeScaleByOrg(orgId)` — list all type scale entries with typeface family joined
- `getTypeScaleByTypeface(typefaceId)` — entries for one typeface
- `createTypeScaleEntry(data)` — insert
- `updateTypeScaleEntry(id, data)` — update
- `deleteTypeScaleEntry(id)` — hard delete

**Step 2: Commit**

```bash
git add migrations/011_typography.sql lib/types/typography.ts lib/supabase/typography.ts
git commit -m "feat: add typography tables, types, and CRUD"
```

---

### Task 6: Typography API Routes + Page

**Files:**
- Create: `app/api/organizations/[orgId]/typography/route.ts` — GET typefaces, POST create typeface
- Create: `app/api/organizations/[orgId]/typography/[typefaceId]/route.ts` — PATCH, DELETE typeface
- Create: `app/api/organizations/[orgId]/typography/scale/route.ts` — GET all scale entries, POST create
- Create: `app/api/organizations/[orgId]/typography/scale/[scaleId]/route.ts` — PATCH, DELETE scale entry
- Create: `app/(dashboard)/[org]/typography/page.tsx`
- Create: `components/dashboard/TypographyEditor.tsx`

**Typography page (`/[org]/typography`):**

**Layout:**
- Two sections: Typefaces (top) and Type Scale (bottom)
- Each typeface card shows: family name, role badge, weight specimens, edit/delete buttons
- Weight specimens: render "The quick brown fox" at each weight
- Type scale section: list of scale entries, each rendered at actual size with the real font
- "Add Typeface" button, "Add Scale Entry" button
- Google Fonts: when source is "google", inject `<link>` tag to load the font

**TypographyEditor component:**
- Manages both typefaces and scale entries
- Add typeface form: family name, source dropdown, role dropdown, weights checkboxes, Google Fonts URL
- Add scale entry form: select typeface, name, font-size, font-weight, line-height, letter-spacing
- Inline editing for all fields

**Step 2: Commit**

```bash
git add app/api/organizations/ app/\(dashboard\)/\[org\]/typography/ components/dashboard/TypographyEditor.tsx
git commit -m "feat: add typography management page"
```

---

### Task 7: Icon Database Table (Migration 012) + Types + CRUD

**Files:**
- Create: `migrations/012_icons.sql`
- Create: `lib/types/icon.ts`
- Create: `lib/supabase/icons.ts`

**Migration:**

```sql
-- Migration 012: Icons

CREATE TABLE IF NOT EXISTS layout_icon (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES layout_organization(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  tags TEXT[] DEFAULT '{}',

  svg TEXT NOT NULL,
  viewbox TEXT NOT NULL DEFAULT '0 0 24 24',

  sizes JSONB DEFAULT '[24]',
  stroke_width NUMERIC DEFAULT 2,

  source TEXT CHECK (source IN ('upload', 'figma', 'library')),
  library_name TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(org_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_icon_org ON layout_icon (org_id);
CREATE INDEX IF NOT EXISTS idx_icon_category ON layout_icon (org_id, category);
```

**Types (`lib/types/icon.ts`):**

```typescript
export type IconSource = "upload" | "figma" | "library";

export interface DesignIcon {
  id: string;
  orgId: string;
  name: string;
  slug: string;
  category: string;
  tags: string[];
  svg: string;
  viewbox: string;
  sizes: number[];
  strokeWidth: number;
  source: IconSource | null;
  libraryName: string | null;
  createdAt: string;
  updatedAt: string;
}
```

**CRUD (`lib/supabase/icons.ts`):**

- `getIconsByOrg(orgId, filters?: { category?, search?, tags? })` — list icons
- `getIconById(id)` — single icon
- `createIcon(data)` — insert, auto-generate slug
- `updateIcon(id, data)` — update
- `deleteIcon(id)` — hard delete
- `bulkCreateIcons(orgId, icons: Array<...>)` — bulk insert
- `getIconCategories(orgId)` — distinct categories

**Step 2: Commit**

```bash
git add migrations/012_icons.sql lib/types/icon.ts lib/supabase/icons.ts
git commit -m "feat: add icon table, types, and CRUD"
```

---

### Task 8: Icon API Routes + Page

**Files:**
- Create: `app/api/organizations/[orgId]/icons/route.ts` — GET list, POST create
- Create: `app/api/organizations/[orgId]/icons/[iconId]/route.ts` — GET, PATCH, DELETE
- Create: `app/(dashboard)/[org]/icons/page.tsx`
- Create: `components/dashboard/IconLibrary.tsx`
- Create: `components/dashboard/IconDetail.tsx`

**Icon page (`/[org]/icons`):**

**Layout:**
- Header: "Icons" + count + "Upload" button
- Filter bar: search input, category dropdown, size dropdown
- Grid of icon cards (6-8 per row)
- Each card: SVG preview at 24px + name below
- Click card → slide-out detail panel

**IconLibrary component:**
- Grid layout with icon cards
- Search filters by name and tags
- Category filter dropdown
- Upload: accepts `.svg` files, parses SVG content, extracts viewBox, auto-generates name from filename
- Multi-file upload support (drag-and-drop zone)

**IconDetail component (slide-out panel):**
- Large SVG preview at multiple sizes (16, 20, 24, 32)
- Name (editable), category (editable), tags (editable)
- Copy buttons: "Copy SVG", "Copy React" (`<IconName size={24} />`)
- Delete button with confirmation
- Shows SVG source code in collapsible `<details>`

**Step 2: Commit**

```bash
git add app/api/organizations/ app/\(dashboard\)/\[org\]/icons/ components/dashboard/IconLibrary.tsx components/dashboard/IconDetail.tsx
git commit -m "feat: add icon library page with upload and detail view"
```

---

### Task 9: Sidebar Navigation Update

**Files:**
- Modify: `components/dashboard/Sidebar.tsx`

Add three new nav items between Library and Candidates:
1. **Tokens** — `/${orgSlug}/tokens` — palette/swatches icon
2. **Typography** — `/${orgSlug}/typography` — type/font icon
3. **Icons** — `/${orgSlug}/icons` — shapes/grid icon

Nav order: Projects, Library, Tokens, Typography, Icons, Candidates, Settings

Use simple inline SVG icons matching the existing style (16x16, stroke-based).

**Step 2: Commit**

```bash
git add components/dashboard/Sidebar.tsx
git commit -m "feat: add tokens, typography, icons to sidebar nav"
```

---

### Task 10: Type Check & Build Verification

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

```bash
git add -A
git commit -m "fix: resolve type errors from design system management"
```

---

## Notes for Implementer

- **Follow components.ts pattern** — row types, mappers, consistent error handling
- **Route params are Promises** in Next.js 15 — `const { orgId } = await params`
- **Slug generation** — lowercase, replace spaces/slashes with hyphens, strip non-alphanumeric
- **CSS variables for styling** — use studio design system tokens in all UI
- **Import from extraction** — the `extraction_data` JSONB on projects contains `tokens` with `colors`, `typography`, `spacing`, `radius`, `effects` arrays
- **SVG sanitisation** — strip `<script>` tags and event handlers from uploaded SVGs
- **Font loading** — for Google Fonts typefaces, inject `<link>` in the page head or use `@import` in a style tag
- **Inline editing pattern** — click value → input appears, Enter/blur saves, Escape cancels
- **Token swatch colours** — render as `background-color: {value}` with a checkerboard pattern behind for alpha
