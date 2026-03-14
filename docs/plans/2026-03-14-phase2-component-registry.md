# Phase 2: Component Registry

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a component registry where users can save, browse, edit, and version components from their design system — fed from the Explorer, extraction, or manual creation.

**Architecture:** New `layout_component` and `layout_component_version` tables store component code, props, states, and metadata. A library grid page (`/[org]/library`) displays components with live iframe previews. Components can be promoted from Explorer variants or created manually. The existing iframe sandbox + transpilation pipeline is reused for previews.

**Tech Stack:** Next.js 15 App Router, Supabase PostgreSQL, Zustand, shadcn/ui, TypeScript, Zod

---

## Important Context

- **Org model:** Phase 1 is complete. All entities are org-scoped via `org_id`
- **Transpilation:** `POST /api/transpile` converts TSX → CommonJS JS. Used by TestPanel and VariantCard
- **Preview:** `buildSrcdoc()` in `lib/explore/preview-helpers.ts` creates iframe HTML with React/ReactDOM shims
- **Health scoring:** `calculateHealthScore()` in `lib/health/score.ts` checks for hardcoded hex, CSS var usage, font usage
- **Explorer:** `VariantCard` component renders variants in iframes with rate/copy/push-to-Figma actions
- **CSS variables:** Studio design system tokens in `globals.css`
- **Auth context:** `requireAuth()` and `requireOrgAuth()` in `lib/api/auth-context.ts`
- **Migrations:** NOT run yet — will be run at the end. Create new migration files only

---

### Task 1: Component Database Tables (Migration 007)

**Files:**
- Create: `migrations/007_component_registry.sql`

**Step 1: Write the migration**

```sql
-- Migration 007: Component registry tables

CREATE TABLE IF NOT EXISTS layout_component (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES layout_organization(id) ON DELETE CASCADE,

  -- Identity
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'uncategorised',
  tags TEXT[] DEFAULT '{}',

  -- Code
  code TEXT NOT NULL,
  compiled_js TEXT,

  -- Props & states (structured metadata)
  props JSONB NOT NULL DEFAULT '[]',
  variants JSONB NOT NULL DEFAULT '[]',
  states JSONB NOT NULL DEFAULT '[]',

  -- Design token dependencies
  tokens_used TEXT[] DEFAULT '{}',

  -- Lifecycle
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'deprecated')),
  version INT NOT NULL DEFAULT 1,

  -- Provenance
  created_by TEXT,
  source TEXT CHECK (source IN ('manual', 'explorer', 'extraction', 'figma')),

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(org_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_component_org ON layout_component (org_id);
CREATE INDEX IF NOT EXISTS idx_component_org_status ON layout_component (org_id, status);
CREATE INDEX IF NOT EXISTS idx_component_org_category ON layout_component (org_id, category);

CREATE TABLE IF NOT EXISTS layout_component_version (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component_id UUID NOT NULL REFERENCES layout_component(id) ON DELETE CASCADE,
  version INT NOT NULL,
  code TEXT NOT NULL,
  props JSONB NOT NULL DEFAULT '[]',
  variants JSONB NOT NULL DEFAULT '[]',
  states JSONB NOT NULL DEFAULT '[]',
  changed_by TEXT,
  change_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(component_id, version)
);

CREATE INDEX IF NOT EXISTS idx_component_version_component ON layout_component_version (component_id);
```

**Step 2: Commit**

```bash
git add migrations/007_component_registry.sql
git commit -m "feat: add component registry tables (migration 007)"
```

---

### Task 2: Component TypeScript Types

**Files:**
- Create: `lib/types/component.ts`

**Step 1: Create the types**

```typescript
// lib/types/component.ts

export type ComponentStatus = "draft" | "approved" | "deprecated";
export type ComponentSource = "manual" | "explorer" | "extraction" | "figma";

export interface ComponentProp {
  name: string;
  type: "string" | "number" | "boolean" | "enum";
  defaultValue?: string;
  required: boolean;
  options?: string[];  // For enum type
}

export interface ComponentVariant {
  name: string;
  description?: string;
  propOverrides: Record<string, string>;
}

export interface ComponentState {
  name: string;
  description?: string;
}

export interface Component {
  id: string;
  orgId: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  tags: string[];
  code: string;
  compiledJs: string | null;
  props: ComponentProp[];
  variants: ComponentVariant[];
  states: ComponentState[];
  tokensUsed: string[];
  status: ComponentStatus;
  version: number;
  createdBy: string | null;
  source: ComponentSource | null;
  createdAt: string;
  updatedAt: string;
}

export interface ComponentVersion {
  id: string;
  componentId: string;
  version: number;
  code: string;
  props: ComponentProp[];
  variants: ComponentVariant[];
  states: ComponentState[];
  changedBy: string | null;
  changeSummary: string | null;
  createdAt: string;
}
```

**Step 2: Commit**

```bash
git add lib/types/component.ts
git commit -m "feat: add component registry types"
```

---

### Task 3: Component CRUD Module

**Files:**
- Create: `lib/supabase/components.ts`

Full CRUD with:

**Row types:** `ComponentRow`, `ComponentVersionRow`

**Row mappers:** `rowToComponent`, `rowToVersion`

**Functions:**
- `getComponent(id)` — single component by ID
- `getComponentBySlug(orgId, slug)` — by org + slug
- `getComponentsByOrg(orgId, opts?)` — list with optional filters: `{ status?, category?, search? }`
- `createComponent(data)` — insert + create version 1 record
- `updateComponent(id, updates)` — update fields, bump version, create version record
- `updateComponentCode(id, code, compiledJs, changedBy, changeSummary)` — code update specifically, bumps version
- `deleteComponent(id)` — delete component and all versions (cascade)
- `getComponentVersions(componentId)` — list all versions ordered by version desc
- `getComponentVersion(componentId, version)` — specific version
- `getComponentCategories(orgId)` — distinct categories for filter dropdown

**Helper:** `nameToComponentSlug(name)` — same pattern as org slug

**Token extraction:** `extractTokensUsed(code)` — regex scan for `var\(--([^)]+)\)` patterns, returns unique array

When creating or updating code:
1. Call `extractTokensUsed(code)` to populate `tokens_used`
2. Store `compiled_js` if provided (caller transpiles before saving)

**Step 2: Commit**

```bash
git add lib/supabase/components.ts
git commit -m "feat: add component CRUD module"
```

---

### Task 4: Component API Routes

**Files:**
- Create: `app/api/organizations/[orgId]/components/route.ts` — GET list, POST create
- Create: `app/api/organizations/[orgId]/components/[componentId]/route.ts` — GET detail, PATCH update, DELETE
- Create: `app/api/organizations/[orgId]/components/[componentId]/versions/route.ts` — GET version history
- Create: `app/api/organizations/[orgId]/components/categories/route.ts` — GET categories

**GET list** (`/api/organizations/[orgId]/components`):
- `requireOrgAuth(orgId, "viewProject")`
- Query params: `status`, `category`, `search` (optional)
- Returns array of components

**POST create** (`/api/organizations/[orgId]/components`):
- `requireOrgAuth(orgId, "createProject")`
- Zod schema: `{ name: string, code: string, description?: string, category?: string, tags?: string[], source?: ComponentSource }`
- Auto-generate slug from name
- Transpile code via internal call or pass `compiledJs`
- Call `createComponent()`

**GET detail** (`/api/organizations/[orgId]/components/[componentId]`):
- `requireOrgAuth(orgId, "viewProject")`
- Return single component

**PATCH update** (`/api/organizations/[orgId]/components/[componentId]`):
- `requireOrgAuth(orgId, "editProject")`
- Zod schema: partial of `{ name, description, category, tags, status, code, props, variants, states }`
- If code changed: re-extract tokens, transpile, bump version

**DELETE** (`/api/organizations/[orgId]/components/[componentId]`):
- `requireOrgAuth(orgId, "deleteProject")`
- Call `deleteComponent()`

**GET versions** (`/api/organizations/[orgId]/components/[componentId]/versions`):
- `requireOrgAuth(orgId, "viewProject")`
- Return version history

**GET categories** (`/api/organizations/[orgId]/components/categories`):
- `requireOrgAuth(orgId, "viewProject")`
- Return distinct category strings

**Step 2: Commit**

```bash
git add app/api/organizations/
git commit -m "feat: add component registry API routes"
```

---

### Task 5: Component Library Page

**Files:**
- Create: `app/(dashboard)/[org]/library/page.tsx`
- Create: `components/dashboard/ComponentCard.tsx`

**Library page** (`/[org]/library`):
- Page header: "Library" with component count
- Filter bar: category dropdown + status dropdown + search input
- Grid of ComponentCard items
- Empty state: "No components yet. Promote variants from the Explorer or create one manually."
- "Add Component" button (opens creation flow — Task 7)
- Fetches from `/api/organizations/${orgId}/components` on mount
- Client component

**ComponentCard:**
- Shows component name, category badge, status dot (green=approved, amber=draft, red=deprecated)
- Shows version number, tag count
- Mini iframe preview of the component (reuse `buildSrcdoc` pattern from VariantCard)
- Links to `/[org]/library/[slug]`
- Card styling: same as dashboard project cards but with preview area

Card layout:
```
┌────────────────────────┐
│  [iframe preview]      │
│                        │
├────────────────────────┤
│  Button                │
│  Inputs · v3  ● Draft  │
└────────────────────────┘
```

**Step 2: Update Sidebar nav**

Add "Library" nav item to `components/dashboard/Sidebar.tsx`:
```typescript
{ label: "Library", href: "/library" },
```

**Step 3: Commit**

```bash
git add app/\(dashboard\)/\[org\]/library/ components/dashboard/ComponentCard.tsx components/dashboard/Sidebar.tsx
git commit -m "feat: add component library page with grid and filters"
```

---

### Task 6: Component Detail Page

**Files:**
- Create: `app/(dashboard)/[org]/library/[slug]/page.tsx`
- Create: `components/dashboard/ComponentDetail.tsx`
- Create: `components/dashboard/ComponentCodeEditor.tsx`
- Create: `components/dashboard/ComponentVersionHistory.tsx`

**Detail page** (`/[org]/library/[slug]`):
- Fetches component by slug from API
- Back link to library
- Header: component name, category badge, status, version

**ComponentDetail** sections:
1. **Preview** — full-width iframe showing the component (reuse buildSrcdoc)
2. **Props table** — name, type, default, required columns
3. **Code** — read-only code block with copy button. "Edit" button opens ComponentCodeEditor
4. **Version History** — list of versions with date, author, summary, "View" button

**ComponentCodeEditor:**
- Monaco editor (dynamic import, same as EditorPanel)
- Save button: PATCHes the component with new code
- Auto-transpiles on save (call /api/transpile first, then PATCH with code + compiledJs)
- Shows health score after save

**ComponentVersionHistory:**
- Fetches from versions API
- List of version entries: version number, date, change summary
- Click "Restore" on old version → PATCH component with that version's code

**Step 2: Commit**

```bash
git add app/\(dashboard\)/\[org\]/library/\[slug\]/ components/dashboard/Component*.tsx
git commit -m "feat: add component detail page with editor and version history"
```

---

### Task 7: Promote from Explorer ("Add to Library")

**Files:**
- Create: `components/studio/PromoteToLibraryModal.tsx`
- Modify: `components/studio/VariantCard.tsx` — add "Add to Library" button
- Modify: `components/studio/ExplorerCanvas.tsx` — wire up promote modal

**PromoteToLibraryModal:**
- Modal overlay with form fields:
  - Name (pre-filled from component function name via `extractComponentName`)
  - Category (text input with autocomplete from existing categories)
  - Description (textarea)
  - Tags (comma-separated input)
- Shows the variant code in a read-only preview
- On submit: POST to `/api/organizations/${orgId}/components` with `source: "explorer"`
- Success: close modal, show toast
- Needs orgId — get from `useOrgStore`

**VariantCard changes:**
- Add new prop: `onPromoteToLibrary?: () => void`
- Add book/library icon button in the action bar (after the Figma push button)
- Tooltip: "Add to Library"

**ExplorerCanvas changes:**
- Add state for `promoteVariant: DesignVariant | null`
- Pass `onPromoteToLibrary` to each VariantCard
- Render `PromoteToLibraryModal` when promoteVariant is set

**Step 2: Commit**

```bash
git add components/studio/PromoteToLibraryModal.tsx components/studio/VariantCard.tsx components/studio/ExplorerCanvas.tsx
git commit -m "feat: add 'Promote to Library' action on Explorer variants"
```

---

### Task 8: Create Component Flow (Manual)

**Files:**
- Create: `components/dashboard/CreateComponentModal.tsx`
- Modify: `app/(dashboard)/[org]/library/page.tsx` — wire up create button

**CreateComponentModal:**
- Full-screen or large modal
- Left side: Monaco editor for TSX code
- Right side: live iframe preview (transpile on debounced change)
- Form fields above editor: name, category, description, tags
- Save button: transpile, POST to API, redirect to detail page
- Cancel button: close modal

**Library page changes:**
- "Add Component" button opens CreateComponentModal
- After successful creation: refresh component list

**Step 2: Commit**

```bash
git add components/dashboard/CreateComponentModal.tsx app/\(dashboard\)/\[org\]/library/page.tsx
git commit -m "feat: add manual component creation with live preview"
```

---

### Task 9: Type Check & Build Verification

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
git commit -m "fix: resolve type errors from component registry"
```

---

## Notes for Implementer

- **Monaco editor** must use `dynamic(() => import('@monaco-editor/react'), { ssr: false })` — see existing `EditorPanel.tsx` for the pattern
- **Transpilation** uses `POST /api/transpile` with `{ code: string }` body — returns `{ js: string }` or error
- **buildSrcdoc** is in `lib/explore/preview-helpers.ts` — takes compiled JS and returns iframe HTML string
- **extractComponentName** is in `lib/explore/preview-helpers.ts` — regex extracts function name from TSX
- **Health score** can be computed client-side via `calculateHealthScore(code, fonts, designMd)` from `lib/health/score.ts`
- **CSS variables** for styling: `--bg-app`, `--bg-panel`, `--bg-surface`, `--bg-elevated`, `--bg-hover`, `--studio-border`, `--studio-accent`, `--text-primary`, `--text-secondary`, `--text-muted`
- **Status dots**: green = `#22C55E` (approved), amber = `#F59E0B` (draft), red = `#EF4444` (deprecated) — use inline or CSS variables
- **Next.js 15 route params** are `Promise<{ param: string }>` — must `await params`
- **Don't run migrations** — they'll be run in bulk later
- **Sidebar nav** currently has only "Projects" — add "Library" as second item
