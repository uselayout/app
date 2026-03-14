# Phase 3: Candidate Approval Workflow

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a candidate submission and approval workflow where team members propose component changes or new components, generate AI variants, collect feedback, and approve/reject — with approved candidates promoting to the component library.

**Architecture:** New `layout_candidate` and `layout_candidate_comment` tables store proposed components with status lifecycle (pending → in_review → approved/rejected). A candidates list page (`/[org]/candidates`) displays submissions. A review page shows side-by-side variant comparison with a comment thread. Approved candidates automatically create or update a `layout_component` record. The existing explore stream is reused for AI variant generation.

**Tech Stack:** Next.js 15 App Router, Supabase PostgreSQL, Zustand, shadcn/ui, TypeScript, Zod

---

## Important Context

- **Org model:** Phase 1 complete. All entities org-scoped via `org_id`
- **Component registry:** Phase 2 complete. `layout_component` + `layout_component_version` tables with full CRUD
- **Auth:** `requireAuth()` and `requireOrgAuth(orgId, permission?)` in `lib/api/auth-context.ts`
- **Permissions:** `ROLE_PERMISSIONS` in `lib/types/organization.ts` — owner/admin/editor/viewer with typed permissions
- **AI generation:** `createExploreStream()` in `lib/claude/explore.ts` — streams multiple TSX variants from a prompt + design system context
- **Transpilation:** `POST /api/transpile` converts TSX → CommonJS JS
- **Preview:** `buildSrcdoc()` in `lib/explore/preview-helpers.ts` creates iframe HTML
- **CSS variables:** Studio design tokens in `globals.css`
- **Sidebar nav:** `components/dashboard/Sidebar.tsx` — currently has Projects and Library
- **Migrations:** NOT run yet — create new migration files only
- **Component creation:** `createComponent()` in `lib/supabase/components.ts` — used by approval flow to promote candidates
- **No toast system exists yet** — will add sonner in this phase

---

### Task 1: Add Candidate Permission to RBAC

**Files:**
- Modify: `lib/types/organization.ts`

**Step 1: Add `reviewCandidate` permission**

Add `reviewCandidate` to the `ROLE_PERMISSIONS` object. Only `owner` and `admin` can approve/reject. All roles that can `editProject` can create candidates.

```typescript
export const ROLE_PERMISSIONS = {
  owner: {
    manageOrg: true,
    manageMembers: true,
    manageBilling: true,
    createProject: true,
    editProject: true,
    viewProject: true,
    deleteProject: true,
    reviewCandidate: true,
  },
  admin: {
    manageOrg: false,
    manageMembers: true,
    manageBilling: true,
    createProject: true,
    editProject: true,
    viewProject: true,
    deleteProject: true,
    reviewCandidate: true,
  },
  editor: {
    manageOrg: false,
    manageMembers: false,
    manageBilling: false,
    createProject: true,
    editProject: true,
    viewProject: true,
    deleteProject: false,
    reviewCandidate: false,
  },
  viewer: {
    manageOrg: false,
    manageMembers: false,
    manageBilling: false,
    createProject: false,
    editProject: false,
    viewProject: true,
    deleteProject: false,
    reviewCandidate: false,
  },
} as const;
```

**Step 2: Commit**

```bash
git add lib/types/organization.ts
git commit -m "feat: add reviewCandidate permission to RBAC"
```

---

### Task 2: Candidate Database Tables (Migration 008)

**Files:**
- Create: `migrations/008_candidates.sql`

**Step 1: Write the migration**

```sql
-- Migration 008: Candidate approval workflow

CREATE TABLE IF NOT EXISTS layout_candidate (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES layout_organization(id) ON DELETE CASCADE,

  -- Identity
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'uncategorised',

  -- Link to existing component (null = new component proposal)
  component_id UUID REFERENCES layout_component(id) ON DELETE SET NULL,

  -- AI generation context
  prompt TEXT NOT NULL,
  design_md_snapshot TEXT,

  -- Variants (each is a code option)
  variants JSONB NOT NULL DEFAULT '[]',

  -- Selected variant (index into variants array, set on approval)
  selected_variant_index INT,

  -- Lifecycle
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'approved', 'rejected')),

  -- People
  created_by TEXT NOT NULL,
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_candidate_org ON layout_candidate (org_id);
CREATE INDEX IF NOT EXISTS idx_candidate_org_status ON layout_candidate (org_id, status);
CREATE INDEX IF NOT EXISTS idx_candidate_component ON layout_candidate (component_id);

CREATE TABLE IF NOT EXISTS layout_candidate_comment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES layout_candidate(id) ON DELETE CASCADE,
  author_id TEXT NOT NULL,
  author_name TEXT,
  body TEXT NOT NULL,
  variant_index INT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_candidate_comment_candidate ON layout_candidate_comment (candidate_id);
```

**Step 2: Commit**

```bash
git add migrations/008_candidates.sql
git commit -m "feat: add candidate workflow tables (migration 008)"
```

---

### Task 3: Candidate TypeScript Types

**Files:**
- Create: `lib/types/candidate.ts`

**Step 1: Create the types**

```typescript
// lib/types/candidate.ts

export type CandidateStatus = "pending" | "in_review" | "approved" | "rejected";

export interface CandidateVariant {
  name: string;
  code: string;
  rationale?: string;
}

export interface CandidateComment {
  id: string;
  candidateId: string;
  authorId: string;
  authorName: string | null;
  body: string;
  variantIndex: number | null;
  createdAt: string;
}

export interface Candidate {
  id: string;
  orgId: string;
  name: string;
  description: string | null;
  category: string;
  componentId: string | null;
  prompt: string;
  designMdSnapshot: string | null;
  variants: CandidateVariant[];
  selectedVariantIndex: number | null;
  status: CandidateStatus;
  createdBy: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
```

**Step 2: Commit**

```bash
git add lib/types/candidate.ts
git commit -m "feat: add candidate workflow types"
```

---

### Task 4: Candidate CRUD Module

**Files:**
- Create: `lib/supabase/candidates.ts`

Full CRUD following the same pattern as `lib/supabase/components.ts`:

**Row types:** `CandidateRow`, `CandidateCommentRow`

**Row mappers:** `rowToCandidate`, `rowToComment`

**Functions:**
- `getCandidate(id)` — single candidate by ID
- `getCandidatesByOrg(orgId, opts?)` — list with optional filters: `{ status?, search? }`
- `createCandidate(data)` — insert new candidate
- `updateCandidateStatus(id, status, reviewedBy?)` — transition status, set reviewed_by/reviewed_at
- `selectCandidateVariant(id, variantIndex)` — set the selected variant index
- `deleteCandidate(id)` — delete candidate and all comments (cascade)
- `getCandidateComments(candidateId)` — list all comments ordered by created_at asc
- `addCandidateComment(data)` — insert comment

**When approving a candidate** (done at API layer, not CRUD layer):
1. Call `updateCandidateStatus(id, "approved", reviewedBy)`
2. Get the selected variant's code
3. If `component_id` exists: call `updateComponentCode()` to update existing component
4. If `component_id` is null: call `createComponent()` to create a new library component with `source: "candidate"`

**Step 2: Commit**

```bash
git add lib/supabase/candidates.ts
git commit -m "feat: add candidate CRUD module"
```

---

### Task 5: Candidate API Routes

**Files:**
- Create: `app/api/organizations/[orgId]/candidates/route.ts` — GET list, POST create
- Create: `app/api/organizations/[orgId]/candidates/[candidateId]/route.ts` — GET detail, PATCH update, DELETE
- Create: `app/api/organizations/[orgId]/candidates/[candidateId]/comments/route.ts` — GET list, POST add
- Create: `app/api/organizations/[orgId]/candidates/[candidateId]/approve/route.ts` — POST approve
- Create: `app/api/organizations/[orgId]/candidates/[candidateId]/reject/route.ts` — POST reject

**GET list** (`/api/organizations/[orgId]/candidates`):
- `requireOrgAuth(orgId, "viewProject")`
- Query params: `status`, `search` (optional)
- Returns array of candidates

**POST create** (`/api/organizations/[orgId]/candidates`):
- `requireOrgAuth(orgId, "editProject")`
- Zod schema: `{ name: string, prompt: string, description?: string, category?: string, componentId?: string, variants: CandidateVariant[] }`
- Sets `created_by` from auth
- Sets `design_md_snapshot` if provided

**GET detail** (`/api/organizations/[orgId]/candidates/[candidateId]`):
- `requireOrgAuth(orgId, "viewProject")`
- Return single candidate

**PATCH update** (`/api/organizations/[orgId]/candidates/[candidateId]`):
- `requireOrgAuth(orgId, "editProject")`
- Can update: `name`, `description`, `category`, `status` (to `in_review` only — approval/rejection have dedicated routes)
- Only the creator or an admin can edit

**DELETE** (`/api/organizations/[orgId]/candidates/[candidateId]`):
- `requireOrgAuth(orgId, "editProject")`
- Only creator or admin can delete

**POST approve** (`/api/organizations/[orgId]/candidates/[candidateId]/approve`):
- `requireOrgAuth(orgId, "reviewCandidate")`
- Zod schema: `{ selectedVariantIndex: number, changeSummary?: string }`
- Validate variant index is in range
- Transpile the selected variant's code via internal fetch to `/api/transpile`
- Create or update component in library (depending on `component_id`)
- Set candidate status to `approved`
- Return the new/updated component

**POST reject** (`/api/organizations/[orgId]/candidates/[candidateId]/reject`):
- `requireOrgAuth(orgId, "reviewCandidate")`
- Zod schema: `{ reason?: string }`
- Set status to `rejected`
- Optionally add a comment with the rejection reason

**GET comments** (`/api/organizations/[orgId]/candidates/[candidateId]/comments`):
- `requireOrgAuth(orgId, "viewProject")`
- Return comments array

**POST comment** (`/api/organizations/[orgId]/candidates/[candidateId]/comments`):
- `requireOrgAuth(orgId, "viewProject")`
- Zod schema: `{ body: string, variantIndex?: number }`
- Sets `author_id` from auth, looks up user name

**Step 2: Commit**

```bash
git add app/api/organizations/
git commit -m "feat: add candidate workflow API routes"
```

---

### Task 6: Install Sonner Toast + Toast Provider

**Files:**
- Modify: `app/layout.tsx` — add `<Toaster />` from sonner
- No new files needed — sonner is a single component

**Step 1: Install sonner**

```bash
npm install sonner
```

**Step 2: Add Toaster to root layout**

In `app/layout.tsx`, import `Toaster` from `sonner` and add it inside the body:

```typescript
import { Toaster } from "sonner";

// In the JSX, after children:
<Toaster
  position="bottom-right"
  toastOptions={{
    style: {
      background: "var(--bg-elevated)",
      border: "1px solid var(--studio-border)",
      color: "var(--text-primary)",
    },
  }}
/>
```

**Step 3: Commit**

```bash
git add package.json package-lock.json app/layout.tsx
git commit -m "feat: add sonner toast notifications"
```

---

### Task 7: Candidate List Page

**Files:**
- Create: `app/(dashboard)/[org]/candidates/page.tsx`
- Modify: `components/dashboard/Sidebar.tsx` — add "Candidates" nav item

**Candidates page** (`/[org]/candidates`):
- Page header: "Candidates" with count and status badges showing pending/in_review counts
- Filter bar: status dropdown + search input
- List of candidate cards (not a grid — cards are wider, showing prompt and variant count)
- Each card shows: name, prompt excerpt, variant count, status badge, creator, date
- Status badges: amber=pending, blue=in_review, green=approved, red=rejected
- Empty state: "No candidates yet. Create one from the Explorer or Library."
- "New Candidate" button (opens creation flow — Task 9)
- Client component, fetches from `/api/organizations/${orgId}/candidates`

**Card layout:**
```
┌──────────────────────────────────────────────────────────┐
│  Hero Section Redesign                    ● In Review    │
│  "Create a modern hero with gradient bg..."              │
│  3 variants · Inputs · by matt@     12 Mar 2026         │
└──────────────────────────────────────────────────────────┘
```

**Sidebar update:**
Add "Candidates" nav item between Library and Settings:
```typescript
{
  label: "Candidates",
  href: `/${orgSlug}/candidates`,
  icon: <CandidatesIcon />,
}
```

CandidatesIcon: a simple clipboard/check SVG icon, 16x16.

**Step 2: Commit**

```bash
git add app/\(dashboard\)/\[org\]/candidates/ components/dashboard/Sidebar.tsx
git commit -m "feat: add candidate list page with filters"
```

---

### Task 8: Candidate Review Page

**Files:**
- Create: `app/(dashboard)/[org]/candidates/[candidateId]/page.tsx`
- Create: `components/dashboard/CandidateReview.tsx`
- Create: `components/dashboard/CandidateCommentThread.tsx`

**Review page** (`/[org]/candidates/[candidateId]`):
- Fetches candidate by ID from API
- Back link to candidates list
- Header: candidate name, status badge, prompt, creator, date

**CandidateReview** sections:
1. **Variant comparison** — side-by-side iframe previews of all variants (2-3 columns depending on count)
   - Each variant: iframe preview (reuse `buildSrcdoc`), name, rationale text
   - Selectable — click to highlight/select a variant
   - Selected variant gets a ring/border highlight
   - Code toggle: show/hide code for the selected variant

2. **Actions** (visible to reviewers only, i.e. `reviewCandidate` permission):
   - "Approve" button (green) — requires a variant to be selected. POSTs to approve endpoint.
   - "Reject" button (red outline) — opens a small reason textarea, POSTs to reject endpoint.
   - "Request Changes" — sets status to `in_review` with a comment

3. **Comment thread** — at the bottom

**CandidateCommentThread:**
- Fetches comments from API
- List of comment bubbles: author name, body, timestamp
- If comment has `variantIndex`, show "Re: Variant {n}" label
- New comment form at bottom: textarea + submit button
- Optional: variant selector dropdown to attach comment to a specific variant

**Step 2: Commit**

```bash
git add app/\(dashboard\)/\[org\]/candidates/\[candidateId\]/ components/dashboard/Candidate*.tsx
git commit -m "feat: add candidate review page with comparison and comments"
```

---

### Task 9: Create Candidate Flow

**Files:**
- Create: `components/dashboard/CreateCandidateModal.tsx`
- Modify: `app/(dashboard)/[org]/candidates/page.tsx` — wire up "New Candidate" button

**CreateCandidateModal:**
- Large modal with form fields:
  - Name (required)
  - Prompt (required textarea — what should the component do/look like)
  - Category (text input)
  - Description (optional textarea)
  - Component link (optional — dropdown of existing components, for "update proposal")
  - Variant count (number input, default 3, max 6)
- "Generate Variants" button → calls `/api/generate/explore` with the prompt and org's design system
- After generation: shows the variants in a preview grid within the modal
- "Submit for Review" button → POSTs to candidates API with the generated variants
- Success: close modal, show toast, refresh list

**Key implementation notes:**
- The generate step reuses the existing explore streaming endpoint
- Parse variants using `parseVariants` from `lib/explore/parse-variants`
- Each variant becomes a `CandidateVariant` with `{ name, code, rationale }`
- The modal needs to fetch the project's `designMd` — use the org's most recent project or accept it as optional context

**Candidates page changes:**
- "New Candidate" button opens CreateCandidateModal
- After successful creation: refresh candidate list

**Step 2: Commit**

```bash
git add components/dashboard/CreateCandidateModal.tsx app/\(dashboard\)/\[org\]/candidates/page.tsx
git commit -m "feat: add candidate creation with AI variant generation"
```

---

### Task 10: Promote from Explorer to Candidate

**Files:**
- Modify: `components/studio/ExplorerCanvas.tsx` — add "Submit as Candidate" option
- Modify: `components/studio/PromoteToLibraryModal.tsx` — add "Submit for Review" alternative to direct promotion

**ExplorerCanvas changes:**
- When multiple variants are generated, add a toolbar button: "Submit as Candidate"
- This takes ALL current variants and creates a candidate with them
- Opens a simple modal: name, description, category → POSTs to candidates API

**PromoteToLibraryModal changes:**
- Add a toggle or secondary button: "Submit for Review Instead"
- When toggled: instead of directly creating a component, creates a candidate with a single variant
- This is for teams where editors can't directly approve — they submit for admin review

**Step 2: Commit**

```bash
git add components/studio/ExplorerCanvas.tsx components/studio/PromoteToLibraryModal.tsx
git commit -m "feat: add candidate submission from Explorer"
```

---

### Task 11: Type Check & Build Verification

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
git commit -m "fix: resolve type errors from candidate workflow"
```

---

## Notes for Implementer

- **Transpilation** for approval: call `POST /api/transpile` with the selected variant's code before creating the component
- **buildSrcdoc** is in `lib/explore/preview-helpers.ts` — takes compiled JS and returns iframe HTML string
- **extractComponentName** is in `lib/explore/preview-helpers.ts` — regex extracts function name from TSX
- **parseVariants** is in `lib/explore/parse-variants.ts` — parses Claude's streamed markdown output into variant objects
- **createExploreStream** is in `lib/claude/explore.ts` — generates multiple TSX variants from a prompt
- **CSS variables** for styling: use the studio design system tokens
- **Status colours**: amber=pending (#F59E0B), blue=in_review (#3B82F6), green=approved (#22C55E), red=rejected (#EF4444)
- **Next.js 15 route params** are `Promise<{ param: string }>` — must `await params`
- **Don't run migrations** — they'll be run in bulk later
- **Sidebar nav** currently has Projects and Library — add Candidates between them
- **Sonner toast**: `import { toast } from "sonner"` then `toast.success("Message")` or `toast.error("Message")`
- **Component source**: when approving a candidate, create the component with `source: "candidate"`
- **User lookup for comments**: the `layout_user` table has `name` and `email` — query it for `author_name`
