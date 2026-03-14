# Phase 6: Enterprise Features

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build enterprise-grade features: audit logging for compliance tracking, design system drift detection against Figma sources, and usage analytics dashboard.

**Architecture:** Three independent workstreams. (A) Audit log — records all significant actions (component changes, candidate approvals, token edits, API key operations) in a queryable table with a settings page viewer. (B) Drift detection — re-extracts from Figma/website sources and diffs against current tokens, surfacing changes in a report UI. (C) Usage analytics — tracks MCP API usage, component adoption, and token coverage with a simple dashboard.

**Tech Stack:** Next.js 15 App Router, Supabase PostgreSQL, TypeScript, Zod, Zustand

---

## Important Context

- **Phases 1-5 complete:** Org model, component registry, candidates, MCP endpoint, API keys, tokens, typography, icons all built
- **Auth:** `requireOrgAuth(orgId, permission?)` in `lib/api/auth-context.ts`
- **MCP auth:** `requireMcpAuth(request, scope?)` in `lib/api/mcp-auth.ts` — validates API keys
- **Tokens CRUD:** `lib/supabase/tokens.ts` — `getTokensByOrg()`, `createToken()`, `bulkCreateTokens()`
- **Components CRUD:** `lib/supabase/components.ts` — `getComponentsByOrg()`, etc.
- **Extraction pipeline:** `lib/figma/extractor.ts`, `lib/website/extractor.ts` — returns `ExtractionResult`
- **Projects:** `fetchAllProjects(orgId)` in `lib/supabase/db.ts`
- **Migrations:** NOT run yet — create new migration files only
- **Dashboard pattern:** Pages in `app/(dashboard)/[org]/`, sidebar in `components/dashboard/Sidebar.tsx`

---

### Task 1: Audit Log Database Table (Migration 013)

**Files:**
- Create: `migrations/013_audit_log.sql`

```sql
-- Migration 013: Audit log

CREATE TABLE IF NOT EXISTS layout_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES layout_organization(id) ON DELETE CASCADE,

  actor_id TEXT NOT NULL,
  actor_name TEXT,
  actor_type TEXT NOT NULL DEFAULT 'user' CHECK (actor_type IN ('user', 'api_key', 'system')),

  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  resource_name TEXT,

  details JSONB DEFAULT '{}',
  ip_address TEXT,

  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_org ON layout_audit_log (org_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_org_created ON layout_audit_log (org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON layout_audit_log (org_id, action);
CREATE INDEX IF NOT EXISTS idx_audit_log_resource ON layout_audit_log (org_id, resource_type, resource_id);
```

**Step 2: Commit**

---

### Task 2: Audit Log Types, CRUD & Helper

**Files:**
- Create: `lib/types/audit.ts`
- Create: `lib/supabase/audit.ts`

**Types:**

```typescript
export type AuditAction =
  | "component.created" | "component.updated" | "component.deleted" | "component.approved" | "component.deprecated"
  | "candidate.created" | "candidate.approved" | "candidate.rejected"
  | "token.created" | "token.updated" | "token.deleted" | "token.imported"
  | "typeface.created" | "typeface.updated" | "typeface.deleted"
  | "icon.created" | "icon.updated" | "icon.deleted"
  | "api_key.created" | "api_key.revoked"
  | "member.invited" | "member.joined" | "member.removed" | "member.role_changed"
  | "project.created" | "project.deleted"
  | "drift.detected" | "drift.resolved";

export type AuditResourceType =
  | "component" | "candidate" | "token" | "typeface" | "icon"
  | "api_key" | "member" | "project" | "drift_report";

export type AuditActorType = "user" | "api_key" | "system";

export interface AuditEntry {
  id: string;
  orgId: string;
  actorId: string;
  actorName: string | null;
  actorType: AuditActorType;
  action: AuditAction;
  resourceType: AuditResourceType;
  resourceId: string | null;
  resourceName: string | null;
  details: Record<string, unknown>;
  ipAddress: string | null;
  createdAt: string;
}
```

**CRUD:**

- `logAuditEvent(data: { orgId, actorId, actorName?, actorType?, action, resourceType, resourceId?, resourceName?, details?, ipAddress? })` — insert a single audit entry. Fire-and-forget (don't await in API routes unless needed).
- `getAuditLog(orgId, filters?: { action?, resourceType?, actorId?, from?: string, to?: string, limit?, offset? })` — paginated log, ordered by created_at DESC
- `getAuditLogCount(orgId, filters?)` — count for pagination

**Step 2: Commit**

---

### Task 3: Audit Log API Route & Settings Page

**Files:**
- Create: `app/api/organizations/[orgId]/audit/route.ts` — GET list
- Create: `app/(dashboard)/[org]/settings/audit/page.tsx`
- Create: `components/dashboard/AuditLogViewer.tsx`

**API Route:**
- GET: `requireOrgAuth(orgId, "manageOrg")` — owner only
- Query params: `action`, `resourceType`, `actorId`, `from`, `to`, `limit` (default 50), `offset`
- Return `{ entries: AuditEntry[], total: number }`

**Settings Page (`/[org]/settings/audit`):**
- Permission-gated: only visible to owners/admins
- Filter bar: action type dropdown, resource type dropdown, date range picker (from/to inputs), search by actor name
- Paginated table showing: timestamp, actor name, action (human-readable), resource, details preview
- Click row → expands to show full details JSON

**AuditLogViewer component:**
- Table with columns: Time, Actor, Action, Resource, Details
- Human-readable action labels (e.g. "component.created" → "Created component")
- Actor type badges (user, API key, system)
- Pagination: prev/next with page indicator
- Empty state: "No audit events recorded yet"

**Step 2: Commit**

---

### Task 4: Wire Audit Logging Into Existing Routes

**Files:**
- Modify: Key API route files to add `logAuditEvent()` calls

Add audit logging to these existing routes (add `logAuditEvent()` after the successful operation, don't await it — use `void logAuditEvent(...)` to fire-and-forget):

1. **Component routes** (`app/api/organizations/[orgId]/components/route.ts`):
   - POST create → `component.created`

2. **Candidate routes**:
   - POST create → `candidate.created`
   - POST approve → `candidate.approved`
   - POST reject → `candidate.rejected`

3. **Token routes**:
   - POST create → `token.created`
   - PATCH update → `token.updated`
   - DELETE → `token.deleted`
   - POST import → `token.imported` (details: `{ count: N }`)

4. **API key routes**:
   - POST create → `api_key.created`
   - DELETE revoke → `api_key.revoked`

Do NOT modify routes that don't exist yet or that are complex to change. Focus on the most impactful audit points.

**Step 2: Commit**

---

### Task 5: Drift Detection Database + CRUD

**Files:**
- Create: `migrations/014_drift_reports.sql`
- Create: `lib/types/drift.ts`
- Create: `lib/supabase/drift.ts`

**Migration:**

```sql
-- Migration 014: Drift reports

CREATE TABLE IF NOT EXISTS layout_drift_report (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES layout_organization(id) ON DELETE CASCADE,
  project_id UUID REFERENCES layout_projects(id) ON DELETE SET NULL,

  source_url TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('figma', 'website')),

  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
  changes JSONB NOT NULL DEFAULT '[]',
  summary TEXT,

  token_additions INT DEFAULT 0,
  token_changes INT DEFAULT 0,
  token_removals INT DEFAULT 0,

  detected_at TIMESTAMPTZ DEFAULT now(),
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_drift_org ON layout_drift_report (org_id);
CREATE INDEX IF NOT EXISTS idx_drift_status ON layout_drift_report (org_id, status);
```

**Types:**

```typescript
export type DriftStatus = "pending" | "reviewed" | "resolved";
export type DriftChangeType = "added" | "changed" | "removed";

export interface DriftChange {
  type: DriftChangeType;
  tokenType: string;
  tokenName: string;
  oldValue?: string;
  newValue?: string;
  cssVariable?: string;
}

export interface DriftReport {
  id: string;
  orgId: string;
  projectId: string | null;
  sourceUrl: string;
  sourceType: "figma" | "website";
  status: DriftStatus;
  changes: DriftChange[];
  summary: string | null;
  tokenAdditions: number;
  tokenChanges: number;
  tokenRemovals: number;
  detectedAt: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
}
```

**CRUD:**

- `createDriftReport(data)` — insert report
- `getDriftReportsByOrg(orgId, filters?: { status? })` — list reports
- `getDriftReportById(id)` — single report
- `updateDriftReportStatus(id, status, reviewedBy?)` — update status
- `deleteDriftReport(id)` — hard delete

**Step 2: Commit**

---

### Task 6: Drift Detection API + Diff Engine

**Files:**
- Create: `app/api/organizations/[orgId]/drift/route.ts` — GET list, POST trigger scan
- Create: `app/api/organizations/[orgId]/drift/[reportId]/route.ts` — GET detail, PATCH update status
- Create: `lib/drift/diff-tokens.ts` — token diffing logic

**Diff engine (`lib/drift/diff-tokens.ts`):**

```typescript
export function diffTokens(
  currentTokens: DesignToken[],
  extractedTokens: ExtractedToken[]
): DriftChange[]
```

- Map extracted tokens to comparable format (name, value, type)
- Compare against current org tokens
- Detect: additions (in extracted but not in org), changes (same name but different value), removals (in org but not in extracted)
- Return array of `DriftChange` objects

**POST trigger scan:**
- `requireOrgAuth(orgId, "editProject")`
- Body: `{ projectId: string }` — which project to re-extract from
- Fetch the project to get its `sourceUrl` and `sourceType`
- Fetch current org tokens via `getTokensByOrg(orgId)`
- Get the project's `extraction_data` tokens
- Run `diffTokens()` to compare
- Create a `DriftReport` with the changes
- Return the report

**GET list:**
- `requireOrgAuth(orgId, "viewProject")`
- Query params: `status`
- Return array of reports

**PATCH update status:**
- `requireOrgAuth(orgId, "editProject")`
- Body: `{ status: "reviewed" | "resolved" }`

**Step 2: Commit**

---

### Task 7: Drift Detection Page

**Files:**
- Create: `app/(dashboard)/[org]/drift/page.tsx`
- Create: `components/dashboard/DriftReportViewer.tsx`

**Drift page (`/[org]/drift`):**

**Layout:**
- Header: "Drift Detection" + "Check for Drift" button
- Status filter: All | Pending | Reviewed | Resolved
- List of drift reports as cards

**"Check for Drift" flow:**
- Opens modal listing org's projects (fetch from API)
- Select project → POST to trigger scan
- Show loading state during scan
- On completion, display new report at top of list

**Report card:**
- Source URL, source type badge (Figma/Website), date
- Summary: "+3 tokens, ~2 changed, -1 removed"
- Status badge (colour-coded: amber=pending, blue=reviewed, green=resolved)
- Click → expand to show full change list

**DriftReportViewer component (expanded view):**
- Table of changes: type (added/changed/removed), token name, old value, new value
- Colour-coded rows: green=added, amber=changed, red=removed
- For colour tokens: show colour swatches alongside values
- Action buttons: "Mark Reviewed", "Mark Resolved"
- "Apply Changes" button (future — just show as disabled with tooltip "Coming soon")

**Step 2: Commit**

---

### Task 8: Usage Analytics Database + CRUD

**Files:**
- Create: `migrations/015_analytics.sql`
- Create: `lib/types/analytics.ts`
- Create: `lib/supabase/analytics.ts`

**Migration:**

```sql
-- Migration 015: Usage analytics

CREATE TABLE IF NOT EXISTS layout_analytics_event (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES layout_organization(id) ON DELETE CASCADE,

  event_type TEXT NOT NULL CHECK (event_type IN (
    'mcp.tool_call', 'component.viewed', 'component.copied',
    'token.exported', 'candidate.generated', 'project.extracted'
  )),
  event_data JSONB DEFAULT '{}',

  api_key_id UUID REFERENCES layout_api_key(id) ON DELETE SET NULL,
  user_id TEXT,

  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_org ON layout_analytics_event (org_id);
CREATE INDEX IF NOT EXISTS idx_analytics_org_type ON layout_analytics_event (org_id, event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_org_created ON layout_analytics_event (org_id, created_at DESC);
```

**Types:**

```typescript
export type AnalyticsEventType =
  | "mcp.tool_call"
  | "component.viewed"
  | "component.copied"
  | "token.exported"
  | "candidate.generated"
  | "project.extracted";

export interface AnalyticsEvent {
  id: string;
  orgId: string;
  eventType: AnalyticsEventType;
  eventData: Record<string, unknown>;
  apiKeyId: string | null;
  userId: string | null;
  createdAt: string;
}

export interface AnalyticsSummary {
  totalMcpCalls: number;
  totalComponentViews: number;
  totalTokenExports: number;
  topComponents: Array<{ name: string; count: number }>;
  topMcpTools: Array<{ tool: string; count: number }>;
  dailyCounts: Array<{ date: string; count: number }>;
}
```

**CRUD:**

- `trackEvent(data: { orgId, eventType, eventData?, apiKeyId?, userId? })` — fire-and-forget insert
- `getAnalyticsSummary(orgId, days?: number)` — aggregate queries returning `AnalyticsSummary`
- `getRecentEvents(orgId, limit?)` — recent events list

**Step 2: Commit**

---

### Task 9: Analytics API + Dashboard Page

**Files:**
- Create: `app/api/organizations/[orgId]/analytics/route.ts` — GET summary
- Create: `app/(dashboard)/[org]/analytics/page.tsx`
- Create: `components/dashboard/AnalyticsDashboard.tsx`

**API Route:**
- GET: `requireOrgAuth(orgId, "viewProject")`
- Query params: `days` (default 30)
- Return `AnalyticsSummary`

**Wire analytics tracking into MCP endpoint:**
- Modify `app/api/mcp/route.ts` to call `trackEvent()` after each tool call
- Event data: `{ tool: toolName, params: toolParams }`
- Fire-and-forget (don't await)

**Analytics page (`/[org]/analytics`):**

**Layout:**
- Header: "Analytics" + time range dropdown (7d, 30d, 90d)
- Stat cards row: MCP API Calls, Component Views, Token Exports (big number + trend)
- Two columns below:
  - Left: Top Components (by view count) — simple ranked list
  - Right: Top MCP Tools (by call count) — simple ranked list
- Bottom: Activity chart (simple bar chart using CSS, no charting library) showing daily event counts

**AnalyticsDashboard component:**
- Fetches summary from API
- Renders stat cards with counts
- Renders ranked lists
- Renders simple CSS bar chart for daily activity

**Step 2: Commit**

---

### Task 10: Sidebar Navigation Update + Settings Links

**Files:**
- Modify: `components/dashboard/Sidebar.tsx` — add Analytics and Drift Detection nav items
- Modify: `app/(dashboard)/[org]/settings/page.tsx` — add Audit Log link

Nav order: Projects, Library, Tokens, Typography, Icons, Candidates, Analytics, Drift, Settings

Settings page: add card linking to "Audit Log" sub-page (alongside existing API Keys card).

**Step 2: Commit**

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

---

## Notes for Implementer

- **Audit logging is fire-and-forget** — use `void logAuditEvent(...)` in route handlers, don't block the response
- **Analytics tracking is fire-and-forget** — same pattern
- **Drift detection** compares org tokens vs project extraction data — it does NOT re-extract from the source (that would require Playwright/Figma API calls which are slow). It uses the existing `extraction_data` on the project.
- **Route params are Promises** in Next.js 15
- **CSS bar charts** — use `div` elements with `height` proportional to value, no charting library needed
- **Pagination** — audit log and analytics events support offset/limit pagination
- **Permission gates** — audit log requires `manageOrg` (owner only), analytics requires `viewProject`, drift requires `editProject` for scanning
