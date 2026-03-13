# Layout Enterprise Development Plan

> From current state to innsworth.layout.design — a phased roadmap for building an enterprise-grade, living component library platform.

---

## Current Technical State (Baseline)

| Layer | Status |
|---|---|
| **Auth** | Better Auth v1.5.3, email+password, single-user sessions |
| **Database** | Supabase PostgreSQL, 6 tables (all `layout_*` prefixed) |
| **Projects** | User-scoped, JSONB for extraction data + explorations |
| **Billing** | Stripe integration, credit-based, Free/Pro/Team tiers |
| **Explorer** | AI variant generation with responsive preview, Figma push/import |
| **MCP Server** | 9 tools, MIT, published on npm as @layoutdesign/context |
| **Multi-tenancy** | None — single user per session, no org model |
| **Component Library** | None — components exist only inside DESIGN.md as text |

---

## Phase 1: Foundation & Team Features (Weeks 1-6)

### 1.1 Organisation & Team Model

**Database migrations:**

```sql
-- layout_organization
CREATE TABLE layout_organization (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,           -- subdomain: innsworth.layout.design
  owner_id TEXT NOT NULL REFERENCES layout_user(id),
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- layout_organization_member
CREATE TABLE layout_organization_member (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES layout_organization(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES layout_user(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
  invited_by TEXT REFERENCES layout_user(id),
  invited_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  UNIQUE(org_id, user_id)
);

-- layout_invitation
CREATE TABLE layout_invitation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES layout_organization(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
  invited_by TEXT NOT NULL REFERENCES layout_user(id),
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Application changes:**
- Add `org_id` column to `layout_projects` (nullable for migration — personal projects have no org)
- Update `fetchAllProjects()` to query by org membership when in org context
- Create `lib/supabase/organization.ts` — CRUD for orgs, members, invitations
- Create `lib/store/organization.ts` — Zustand store for current org context
- Update `proxy.ts` to extract org slug from subdomain and set org context

**Files to create:**
- `lib/supabase/organization.ts`
- `lib/store/organization.ts`
- `lib/types/organization.ts`
- `migrations/005_organizations.sql`

**Files to modify:**
- `lib/supabase/db.ts` — add org-scoped project queries
- `lib/types/index.ts` — add Organization, OrgMember types
- `proxy.ts` — subdomain extraction + org context
- `lib/store/project.ts` — org-aware project loading
- `components/ProjectHydrator.tsx` — load org context on mount

### 1.2 Subdomain Routing

**Approach:** Next.js middleware in `proxy.ts`

```
innsworth.layout.design  ->  org slug = "innsworth"  ->  load org context
app.layout.design        ->  main app (personal projects + org switcher)
layout.design            ->  marketing homepage
```

**Implementation:**
- Extract subdomain from `request.headers.get('host')`
- Look up org by slug
- Set `x-org-id` header for downstream API routes
- If org not found, redirect to layout.design

**Files to modify:**
- `proxy.ts` — subdomain parsing + org lookup
- `next.config.ts` — configure allowed hosts

### 1.3 Team Billing Migration

**Changes:**
- Migrate `layout_subscription.user_id` to support `org_id` (add nullable `org_id` column)
- Personal subscriptions: `user_id` set, `org_id` null
- Team/Business subscriptions: `org_id` set, `user_id` = org owner
- Seat count becomes enforced: `layout_organization_member` count <= `subscription.seat_count`

**Files to modify:**
- `lib/billing/subscription.ts` — org-aware subscription lookup
- `lib/billing/credits.ts` — org-level credit pool
- `migrations/006_billing_org.sql`

### 1.4 Invitation Flow

**User journey:**
1. Admin goes to Settings > Team
2. Enters email + selects role (Admin/Editor/Viewer)
3. System sends invite email with magic link
4. Recipient clicks link, signs up or logs in, joins org

**Files to create:**
- `app/api/org/invite/route.ts` — send invitation
- `app/api/org/accept/route.ts` — accept invitation
- `app/settings/team/page.tsx` — team management UI
- `components/settings/TeamMembers.tsx` — member list + invite form
- `lib/email/invite.ts` — email template (or use Better Auth email)

### 1.5 Role-Based Access Control

| Permission | Admin | Editor | Viewer |
|---|---|---|---|
| View components | Yes | Yes | Yes |
| Create/edit candidates | Yes | Yes | No |
| Approve candidates | Yes | No | No |
| Manage team members | Yes | No | No |
| Manage billing | Yes | No | No |
| Delete components | Yes | No | No |
| Configure MCP endpoint | Yes | No | No |

**Implementation:**
- `lib/auth/permissions.ts` — role check utility
- Middleware-level enforcement in API routes
- UI-level conditional rendering based on role

---

## Phase 2: Component Registry (Weeks 7-12)

### 2.1 Component Data Model

**Database migration:**

```sql
-- layout_component
CREATE TABLE layout_component (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES layout_organization(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                           -- e.g. "Button", "Modal", "PricingCard"
  slug TEXT NOT NULL,                           -- URL-safe: "button", "modal", "pricing-card"
  description TEXT,
  category TEXT NOT NULL DEFAULT 'uncategorised', -- e.g. "inputs", "navigation", "feedback"
  tags TEXT[] DEFAULT '{}',                     -- searchable tags

  -- Component definition
  variants JSONB NOT NULL DEFAULT '[]',         -- [{name, description, props}]
  states JSONB NOT NULL DEFAULT '[]',           -- [{name, description, cssClass}]
  props JSONB NOT NULL DEFAULT '[]',            -- [{name, type, default, required}]

  -- Code
  code TEXT NOT NULL,                           -- TSX source
  compiled_js TEXT,                             -- Transpiled JS for preview

  -- Metadata
  status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('approved', 'deprecated')),
  version INT NOT NULL DEFAULT 1,

  -- Design tokens this component uses
  tokens_used TEXT[] DEFAULT '{}',              -- ["--color-primary", "--space-4"]

  -- Screenshots (auto-generated)
  screenshot_desktop TEXT,                      -- URL or base64
  screenshot_tablet TEXT,
  screenshot_mobile TEXT,

  -- Provenance
  created_by TEXT REFERENCES layout_user(id),
  approved_by TEXT REFERENCES layout_user(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(org_id, slug)
);

-- layout_component_version (audit trail)
CREATE TABLE layout_component_version (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component_id UUID NOT NULL REFERENCES layout_component(id) ON DELETE CASCADE,
  version INT NOT NULL,
  code TEXT NOT NULL,
  variants JSONB NOT NULL DEFAULT '[]',
  states JSONB NOT NULL DEFAULT '[]',
  changed_by TEXT REFERENCES layout_user(id),
  change_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(component_id, version)
);
```

**Files to create:**
- `lib/supabase/components.ts` — CRUD for components
- `lib/types/component.ts` — Component, ComponentVersion types
- `migrations/007_components.sql`

### 2.2 Component Library UI

**New pages:**

```
app/
  [org]/
    library/
      page.tsx                  -- Component grid (all components, filterable)
      [slug]/
        page.tsx                -- Component detail (states, variants, preview)
```

**Component grid page:**
- Card layout showing each component with thumbnail screenshot
- Filter by category, search by name/tag
- Status badges (approved, deprecated)
- Quick actions: view, duplicate, edit

**Component detail page:**
- **Hero:** Component name, description, category, tags
- **State explorer:** All states rendered side-by-side (default, hover, active, disabled, focus, loading, error)
- **Variant explorer:** All variants rendered side-by-side
- **Responsive preview:** Desktop / Tablet / Mobile toggle
- **Interactive mode:** Live component you can hover, click, interact with
- **Code tab:** TSX source with copy button
- **Version history:** Timeline of changes with diff view
- **Usage:** Where this component is used (future: scan codebase)

**Files to create:**
- `app/[org]/library/page.tsx`
- `app/[org]/library/[slug]/page.tsx`
- `components/library/ComponentGrid.tsx`
- `components/library/ComponentCard.tsx`
- `components/library/ComponentDetail.tsx`
- `components/library/StateExplorer.tsx`
- `components/library/VariantExplorer.tsx`
- `components/library/InteractivePreview.tsx`
- `components/library/VersionHistory.tsx`

### 2.3 State Explorer

**How it works:**
- Each component defines its states: `[{name: "default"}, {name: "hover"}, {name: "disabled"}, ...]`
- The state explorer renders the component N times, once per state
- For interactive states (hover, focus, active), use CSS overrides in the iframe
- Each state gets its own card with label and preview

**Technical approach:**
- Reuse existing iframe sandbox from Explorer/TestPanel
- Inject CSS overrides per state (e.g. force `:hover` styles via `*:hover` selector matching)
- For disabled: set `disabled` attribute on interactive elements
- For loading: trigger loading state prop if component supports it
- Auto-generate screenshots of each state for the component grid thumbnails

### 2.4 Interactive Component Playground

**Expand existing iframe sandbox:**
- Full-width preview with controls panel
- Prop editor: adjust component props live (text inputs, toggles, colour pickers)
- Theme toggle: switch between light/dark if org has multiple themes
- Responsive slider: drag to resize viewport continuously (not just breakpoint presets)
- Event logger: show click, hover, focus events as they happen

**Files to create:**
- `components/library/Playground.tsx`
- `components/library/PropEditor.tsx`

### 2.5 Import Components from Existing Sources

**Three import paths:**

1. **From extraction** — When a project is extracted, detected components are suggested as library entries
2. **From Explorer** — When a variant is approved, it becomes a library component
3. **From Figma** — Import specific Figma components as library entries (already have `FigmaImportModal`)
4. **Manual** — Create a new component from scratch in the editor

**Files to create:**
- `components/library/ImportFromExtraction.tsx`
- `components/library/ImportFromExplorer.tsx`
- `lib/library/import.ts` — shared import logic

---

## Phase 3: Candidate & Approval Workflow (Weeks 13-18)

### 3.1 Candidate Data Model

```sql
-- layout_candidate
CREATE TABLE layout_candidate (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES layout_organization(id) ON DELETE CASCADE,

  -- What component this is a candidate for
  component_id UUID REFERENCES layout_component(id),  -- NULL if new component
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,

  -- The proposed design
  code TEXT NOT NULL,
  compiled_js TEXT,
  variants JSONB NOT NULL DEFAULT '[]',
  states JSONB NOT NULL DEFAULT '[]',

  -- Workflow
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'rejected', 'archived')),
  created_by TEXT NOT NULL REFERENCES layout_user(id),
  reviewer_id TEXT REFERENCES layout_user(id),

  -- AI generation metadata
  prompt TEXT,                                  -- The prompt used to generate this
  ai_generated BOOLEAN DEFAULT false,
  parent_candidate_id UUID REFERENCES layout_candidate(id),  -- For refinements

  -- Feedback
  feedback JSONB DEFAULT '[]',                  -- [{user_id, comment, created_at}]

  -- Screenshots
  screenshot_desktop TEXT,
  screenshot_tablet TEXT,
  screenshot_mobile TEXT,

  -- Health
  health_score INT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 3.2 Candidate Workflow UI

**New pages:**

```
app/
  [org]/
    candidates/
      page.tsx                  -- All candidates (filterable by status)
      new/
        page.tsx                -- Create new candidate (manual or AI)
      [id]/
        page.tsx                -- Candidate detail + review interface
```

**Create candidate flow:**
1. User clicks "New Component" or "Duplicate" on existing component
2. Chooses: **Manual** (write code) or **AI Generate** (describe what you want)
3. If AI: enters prompt, selects variant count (3-5), system generates candidates
4. User reviews candidates, selects one, refines if needed
5. Saves as draft candidate

**Review flow:**
1. Creator submits candidate for review (status: draft -> review)
2. Reviewers get notification (email/in-app)
3. Reviewer sees: current component (if exists) vs candidate side-by-side
4. Reviewer can: approve, reject with feedback, or request changes
5. On approval: candidate code replaces component code (or creates new component)
6. Version history updated, old code preserved

**Files to create:**
- `lib/supabase/candidates.ts`
- `lib/types/candidate.ts`
- `app/[org]/candidates/page.tsx`
- `app/[org]/candidates/new/page.tsx`
- `app/[org]/candidates/[id]/page.tsx`
- `components/candidates/CandidateCard.tsx`
- `components/candidates/CandidateReview.tsx`
- `components/candidates/CandidateComparison.tsx`
- `components/candidates/AIGenerateForm.tsx`
- `components/candidates/FeedbackThread.tsx`

### 3.3 AI Variant Generation for Candidates

**Reuse existing Explorer system:**
- `lib/claude/explore.ts` already generates N variants from a prompt + DESIGN.md context
- Adapt `EXPLORE_SYSTEM` prompt to also consider the org's component library
- Each generated variant becomes a candidate automatically
- Health scoring runs on each candidate to validate token usage

**Key difference from current Explorer:**
- Explorer generates variants for ad-hoc experimentation
- Candidates are formal proposals that enter the approval workflow
- Candidates reference the component library (use existing buttons, fonts, colours)

### 3.4 Notifications

**In-app notifications:**
- Bell icon in top bar with unread count
- Notification types: review requested, candidate approved, candidate rejected, feedback added
- Click to navigate to candidate

**Email notifications (stretch):**
- Use Resend or similar for transactional email
- "You have a candidate awaiting review" — link to candidate page

**Files to create:**
- `lib/supabase/notifications.ts`
- `components/shared/NotificationBell.tsx`
- `app/api/notifications/route.ts`

---

## Phase 4: Hosted MCP Endpoint (Weeks 19-22)

### 4.1 HTTP MCP Server

**Endpoint:** `https://innsworth.layout.design/api/mcp`

**Authentication:**
- API key per org (generated in settings)
- Header: `Authorization: Bearer lyt_xxxxx`
- Rate limiting: 100 requests/minute per org

**Tools exposed (scoped to approved components only):**

| Tool | Description |
|---|---|
| `get_design_system` | Returns the org's DESIGN.md |
| `get_tokens` | Returns tokens in CSS, JSON, or Tailwind format |
| `get_component` | Returns a specific approved component's code + spec |
| `list_components` | Lists all approved components with categories |
| `check_compliance` | Validates code against the org's design rules |

**Implementation:**
- New API route: `app/api/mcp/route.ts`
- Reuse existing MCP tool logic from @layoutdesign/context
- Scope all responses to the org's approved component library
- Candidates and drafts are never exposed via MCP

**Files to create:**
- `app/api/mcp/route.ts` — HTTP MCP endpoint
- `lib/mcp/hosted.ts` — org-scoped MCP tool implementations
- `lib/supabase/api-keys.ts` — API key management
- `app/[org]/settings/api/page.tsx` — API key management UI
- `migrations/009_api_keys.sql`

### 4.2 Developer Setup

**One-command connection:**
```bash
claude mcp add layout https://innsworth.layout.design/api/mcp --header "Authorization: Bearer lyt_xxxxx"
```

Or for Cursor:
```json
// .cursor/mcp.json
{
  "mcpServers": {
    "layout": {
      "url": "https://innsworth.layout.design/api/mcp",
      "headers": { "Authorization": "Bearer lyt_xxxxx" }
    }
  }
}
```

### 4.3 Auto-Suggestion (AI Agent -> Library)

**When Claude Code creates a component not in the library:**
1. After code generation, Claude calls `check_compliance` with the new code
2. If the component name/type isn't in the library, the tool response includes:
   ```json
   {
     "compliance": { ... },
     "suggestion": "This component 'DataTable' is not in your library. Consider adding it as a candidate at https://innsworth.layout.design/candidates/new"
   }
   ```
3. Developer can then push the component as a candidate via the UI

**Future:** Direct MCP tool `propose_component` that creates a candidate from the AI agent.

---

## Phase 5: Design System Management (Weeks 23-28)

### 5.1 Token Management UI

**Page:** `app/[org]/tokens/page.tsx`

**Features:**
- Visual token editor: edit colours with picker, typography with dropdowns, spacing with slider
- Token categories: colour, typography, spacing, radius, effects, motion
- Semantic grouping: primitives -> semantic aliases -> component tokens
- Live preview: changes reflected in component previews instantly
- Export: download updated tokens as CSS, JSON, Tailwind config
- Import: upload tokens from Figma extraction or manual file

### 5.2 Icon Library

**Page:** `app/[org]/icons/page.tsx`

**Features:**
- Upload SVG icons individually or as a ZIP
- Auto-categorise by name pattern (arrow-*, nav-*, social-*)
- Search by name, browse by category
- Copy as React component, SVG, or icon name
- Size variants (16px, 20px, 24px, 32px)

### 5.3 Typography Specimen

**Page:** `app/[org]/typography/page.tsx`

**Features:**
- All font families used in the design system
- Weight specimens (thin through black)
- Size scale with actual rendered text
- Line-height and letter-spacing previews
- Pairing examples (heading + body combinations)

### 5.4 Colour System

**Page:** `app/[org]/colours/page.tsx`

**Features:**
- Colour swatches for all primitives
- Semantic colour mapping (primary, secondary, success, warning, error)
- Contrast checker (WCAG AA/AAA)
- Dark/light theme comparison
- Colour scale generator (from a base colour, generate 50-950 scale)

---

## Phase 6: Enterprise Features (Weeks 29-36)

### 6.1 SSO (SAML/OIDC)

- Better Auth supports SAML and OIDC via plugins
- Configure per org in settings
- Enforce SSO for all org members on Enterprise plan

### 6.2 Audit Log

```sql
CREATE TABLE layout_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES layout_organization(id),
  user_id TEXT NOT NULL REFERENCES layout_user(id),
  action TEXT NOT NULL,             -- 'component.created', 'candidate.approved', etc.
  resource_type TEXT NOT NULL,      -- 'component', 'candidate', 'token', 'member'
  resource_id UUID,
  metadata JSONB DEFAULT '{}',     -- action-specific data
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 6.3 Drift Detection

**How it works:**
1. Weekly cron job per org
2. Re-extract from the org's source URL (Figma or website)
3. Diff against current tokens and components
4. If drift detected: create a notification + optional email alert
5. Show drift report in dashboard: what changed, when, severity

**Files to create:**
- `lib/drift/detector.ts` — extraction + diff logic
- `lib/drift/report.ts` — generate drift report
- `app/api/cron/drift/route.ts` — Vercel cron handler
- `app/[org]/drift/page.tsx` — drift report UI

### 6.4 Analytics Dashboard

**Page:** `app/[org]/analytics/page.tsx`

**Metrics:**
- Component usage (which components are used most in AI generation)
- MCP endpoint calls (daily/weekly/monthly)
- Credit consumption trends
- Candidate approval rate
- Most active contributors
- Drift frequency

### 6.5 Custom Domain

- Allow orgs to map their own domain: `design.innsworth.com` -> `innsworth.layout.design`
- SSL via Let's Encrypt / Vercel
- Configure in org settings

---

## Phase 7: Marketplace (Weeks 37-48)

### 7.1 Marketplace Model

**Concept:** Designers and agencies sell complete component libraries that buyers can import into their org.

**Listing structure:**
- Name, description, preview screenshots
- Component count, token count
- Price (one-time purchase)
- Demo: interactive preview of all components
- Reviews and ratings

### 7.2 Seller Flow

1. Creator builds a component library in their org
2. Clicks "Publish to Marketplace"
3. Sets price, writes description, uploads preview screenshots
4. Layout reviews and approves (quality gate)
5. Listed on layout.design/marketplace

### 7.3 Buyer Flow

1. Browses marketplace, previews components interactively
2. Purchases (Stripe Connect — seller gets 70%, Layout gets 30%)
3. Library imported into buyer's org as a starting point
4. Buyer can customise: change tokens, modify components, add new ones
5. MCP endpoint immediately serves the imported library

### 7.4 Database

```sql
CREATE TABLE layout_marketplace_listing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_org_id UUID NOT NULL REFERENCES layout_organization(id),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price_gbp INT NOT NULL,             -- in pence
  component_count INT,
  token_count INT,
  preview_screenshots TEXT[],
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'published', 'rejected')),
  stripe_product_id TEXT,
  stripe_price_id TEXT,
  downloads INT DEFAULT 0,
  rating_avg NUMERIC(2,1),
  rating_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Pricing Tiers (Updated)

| Tier | Price | Features |
|---|---|---|
| **Open Source** | Free forever | CLI, MCP server, 3 starter kits, self-host |
| **Pro** | £29/mo | Individual. Hosted AI, premium kits, extraction, drift alerts |
| **Team** | £49/mo + £15/seat | Shared library, invites, basic approval workflow, 3 roles |
| **Business** | £149/mo + £25/seat | Subdomain (org.layout.design), full approval workflow, hosted MCP endpoint, API keys, audit log, analytics |
| **Enterprise** | Custom | SSO, self-hosted, SLA, custom domain, dedicated support |

---

## Technical Dependencies

| Dependency | Purpose | Phase |
|---|---|---|
| **Resend** (or similar) | Transactional email for invites, notifications | Phase 1 |
| **Stripe Connect** | Marketplace seller payouts | Phase 7 |
| **Vercel Cron** (or equivalent) | Drift detection scheduling | Phase 6 |
| **Let's Encrypt / Vercel SSL** | Custom domain SSL | Phase 6 |

---

## Migration Strategy

### Data Migration Path

1. **Phase 1:** Add `org_id` to `layout_projects` (nullable). Existing projects remain personal (org_id = NULL).
2. **Phase 2:** Add `layout_component` table. Components are org-scoped from day one.
3. **Phase 3:** Add `layout_candidate` table. Candidates reference components.
4. **Phase 4:** Add `layout_api_key` table. API keys are org-scoped.
5. **Phase 6:** Add `layout_audit_log` table.
6. **Phase 7:** Add `layout_marketplace_listing` table.

No breaking changes to existing single-user flows. Personal projects continue to work without an org.

---

## Verification Plan

### Per-Phase Testing

**Phase 1:**
- Create org, invite member, accept invite
- Verify role-based access (viewer can't edit, editor can't approve)
- Verify subdomain routing resolves correct org
- Verify billing migrates cleanly (personal subscriptions unaffected)

**Phase 2:**
- Create component manually, verify it appears in library grid
- Import component from extraction, verify code + screenshots generated
- State explorer renders all states correctly
- Interactive playground responds to prop changes
- Version history shows changes between versions

**Phase 3:**
- Create candidate via AI (generates 3 variants)
- Submit for review, verify reviewer gets notification
- Approve candidate, verify it becomes an approved component
- Reject with feedback, verify creator sees feedback
- Health score validates token usage in candidate

**Phase 4:**
- Connect Claude Code via `claude mcp add` with API key
- Verify `list_components` returns only approved components
- Verify `get_component` returns correct code
- Verify `check_compliance` validates against org's design rules
- Verify candidates and drafts are never exposed

**Phase 5:**
- Edit a colour token, verify all component previews update
- Upload icons, verify categorisation and search
- Export tokens in all formats (CSS, JSON, Tailwind)

**Phase 6:**
- Configure SSO, verify login flow
- Trigger drift detection, verify report accuracy
- Review audit log for completeness
- Check analytics dashboard data accuracy

**Phase 7:**
- Publish listing, verify it appears on marketplace
- Purchase listing, verify import into buyer's org
- Verify Stripe Connect payout to seller

---

## Risk Mitigations

| Risk | Mitigation |
|---|---|
| Scope creep in Phase 1 | Ship org model + invites only. RBAC can be basic (3 roles, no custom). |
| Component preview performance | Lazy-load iframes, generate static screenshots as fallback. |
| Subdomain SSL complexity | Use Vercel's wildcard SSL or Coolify's built-in Let's Encrypt. |
| MCP endpoint abuse | Rate limiting (100 req/min), API key rotation, usage monitoring. |
| Marketplace quality control | Manual review before publishing. Automated health score threshold. |
| Database migration failures | All migrations are additive (new tables/columns). No destructive changes. |

---

## Summary Timeline

| Phase | Weeks | Deliverable |
|---|---|---|
| **1. Foundation & Teams** | 1-6 | Org model, invites, RBAC, subdomain routing, team billing |
| **2. Component Registry** | 7-12 | Component library UI, state explorer, interactive preview, import flows |
| **3. Candidates & Approval** | 13-18 | Candidate workflow, AI generation, review flow, notifications |
| **4. Hosted MCP** | 19-22 | HTTP MCP endpoint, API keys, developer setup docs |
| **5. Design System Management** | 23-28 | Token editor, icon library, typography specimen, colour system |
| **6. Enterprise** | 29-36 | SSO, audit log, drift detection, analytics, custom domain |
| **7. Marketplace** | 37-48 | Seller/buyer flows, Stripe Connect, marketplace UI, quality review |
