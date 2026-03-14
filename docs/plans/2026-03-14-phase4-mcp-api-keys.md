# Phase 4: HTTP MCP Endpoint & API Key Management

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a hosted HTTP MCP endpoint that serves org design system data (components, tokens, DESIGN.md) to external AI agents, plus an API key management system for secure access.

**Architecture:** Two independent workstreams. (A) A REST API at `/api/mcp` that implements MCP tool calls — authenticated via org-scoped API keys, returning design system data from existing tables. (B) An API key management system with hashed key storage, settings UI for creating/revoking keys, and middleware for key-based auth.

**Tech Stack:** Next.js 15 App Router, Supabase PostgreSQL, crypto (node:crypto for hashing), Zustand, shadcn/ui, TypeScript, Zod

---

## Important Context

- **Phases 1-3 complete:** Org model, component registry, candidate workflow all built
- **Auth:** `requireOrgAuth(orgId, permission?)` in `lib/api/auth-context.ts` — session-based
- **MCP key auth** is different — API key in header, no session. Need a separate auth path
- **Components:** `getComponentsByOrg()`, `getComponentBySlug()` in `lib/supabase/components.ts` — status filtering supported
- **Projects:** `fetchAllProjects(orgId)` in `lib/supabase/db.ts` — returns projects with `design_md` field
- **Permissions:** `ROLE_PERMISSIONS` in `lib/types/organization.ts`
- **Sidebar nav:** Already has Projects, Library, Candidates
- **Migrations:** NOT run yet — create new migration files only
- **Existing BYOK pattern:** `X-Api-Key` header checked in generate routes for personal Anthropic keys — this is DIFFERENT from org API keys

---

### Task 1: API Key Database Table (Migration 009)

**Files:**
- Create: `migrations/009_api_keys.sql`

**Step 1: Write the migration**

```sql
-- Migration 009: API key management

CREATE TABLE IF NOT EXISTS layout_api_key (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES layout_organization(id) ON DELETE CASCADE,

  -- Identity
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  key_preview TEXT NOT NULL,

  -- Scoping
  scopes TEXT[] NOT NULL DEFAULT '{read}',

  -- Tracking
  created_by TEXT NOT NULL,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,

  -- Lifecycle
  revoked_at TIMESTAMPTZ,
  revoked_by TEXT,

  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_key_org ON layout_api_key (org_id);
CREATE INDEX IF NOT EXISTS idx_api_key_hash ON layout_api_key (key_hash);
```

**Step 2: Commit**

```bash
git add migrations/009_api_keys.sql
git commit -m "feat: add API key table (migration 009)"
```

---

### Task 2: API Key Types & CRUD

**Files:**
- Create: `lib/types/api-key.ts`
- Create: `lib/supabase/api-keys.ts`
- Modify: `lib/types/organization.ts` — add `manageApiKeys` permission

**Types:**

```typescript
// lib/types/api-key.ts

export type ApiKeyScope = "read" | "write";

export interface ApiKey {
  id: string;
  orgId: string;
  name: string;
  keyPreview: string;
  scopes: ApiKeyScope[];
  createdBy: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  revokedAt: string | null;
  revokedBy: string | null;
  createdAt: string;
}

export interface ApiKeyWithSecret extends ApiKey {
  /** Only available at creation time — never stored */
  secretKey: string;
}
```

**Permission update:**
Add `manageApiKeys: true` to owner and admin, `false` to editor and viewer in `ROLE_PERMISSIONS`.

**CRUD module** (`lib/supabase/api-keys.ts`):

Row type, mapper, and functions:

- `generateApiKey()` — returns `{ key: string, hash: string, preview: string }`. Key format: `lyt_` + 40 random hex chars. Hash: SHA-256. Preview: `lyt_...{last4}`.
- `createApiKey(data: { orgId, name, scopes, createdBy, expiresAt? })` — generate key, insert row with hash, return `ApiKeyWithSecret` (includes the plaintext key — ONLY time it's available)
- `getApiKeysByOrg(orgId)` — list all non-revoked keys for org, ordered by created_at desc
- `getApiKeyById(id)` — single key by ID
- `validateApiKey(rawKey: string)` — hash the key, look up by hash, check not revoked, check not expired, update `last_used_at`, return `{ apiKey: ApiKey, orgId: string } | null`
- `revokeApiKey(id, revokedBy)` — set `revoked_at` and `revoked_by`
- `deleteApiKey(id)` — hard delete (for cleanup)

Use `crypto.createHash("sha256").update(key).digest("hex")` for hashing (from `node:crypto`).

**Step 2: Commit**

```bash
git add lib/types/api-key.ts lib/supabase/api-keys.ts lib/types/organization.ts
git commit -m "feat: add API key types, CRUD, and permission"
```

---

### Task 3: API Key Management Routes

**Files:**
- Create: `app/api/organizations/[orgId]/api-keys/route.ts` — GET list, POST create
- Create: `app/api/organizations/[orgId]/api-keys/[keyId]/route.ts` — DELETE revoke

**GET list:**
- `requireOrgAuth(orgId, "manageApiKeys")`
- Return all non-revoked keys (no secrets — just metadata)

**POST create:**
- `requireOrgAuth(orgId, "manageApiKeys")`
- Zod schema: `{ name: z.string().min(1), scopes: z.array(z.enum(["read", "write"])).optional() }`
- Default scopes: `["read"]`
- Call `createApiKey()` — returns key with secret
- Return the full `ApiKeyWithSecret` (including plaintext key — user must copy it now)

**DELETE revoke** (`/api/organizations/[orgId]/api-keys/[keyId]`):
- `requireOrgAuth(orgId, "manageApiKeys")`
- Verify key belongs to org
- Call `revokeApiKey(id, userId)`
- Return `{ success: true }`

**Step 2: Commit**

```bash
git add app/api/organizations/
git commit -m "feat: add API key management routes"
```

---

### Task 4: MCP Auth Middleware

**Files:**
- Create: `lib/api/mcp-auth.ts`

This middleware validates API keys for MCP endpoint requests.

```typescript
// lib/api/mcp-auth.ts

import { validateApiKey } from "@/lib/supabase/api-keys";
import { NextResponse } from "next/server";

export interface McpAuthResult {
  orgId: string;
  keyId: string;
  scopes: string[];
}

export async function requireMcpAuth(
  request: Request,
  requiredScope?: string
): Promise<McpAuthResult | NextResponse> {
  const authHeader = request.headers.get("Authorization");
  const rawKey = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!rawKey) {
    return NextResponse.json(
      { error: "Missing Authorization header. Use: Bearer lyt_..." },
      { status: 401 }
    );
  }

  const result = await validateApiKey(rawKey);
  if (!result) {
    return NextResponse.json(
      { error: "Invalid or revoked API key" },
      { status: 401 }
    );
  }

  if (requiredScope && !result.apiKey.scopes.includes(requiredScope)) {
    return NextResponse.json(
      { error: `API key missing required scope: ${requiredScope}` },
      { status: 403 }
    );
  }

  return {
    orgId: result.orgId,
    keyId: result.apiKey.id,
    scopes: result.apiKey.scopes,
  };
}
```

**Step 2: Commit**

```bash
git add lib/api/mcp-auth.ts
git commit -m "feat: add MCP API key authentication middleware"
```

---

### Task 5: HTTP MCP Endpoint

**Files:**
- Create: `app/api/mcp/route.ts`

This is the main MCP endpoint. It implements a simple tool-call API (not full MCP protocol — that's complex). Instead, use a clean REST-like interface that AI agents can call.

**Route:** `POST /api/mcp`

**Request format:**
```json
{
  "tool": "get_design_system" | "get_tokens" | "get_component" | "list_components" | "check_compliance",
  "params": { ... }
}
```

**Auth:** `requireMcpAuth(request, "read")`

**Tool implementations:**

1. **`get_design_system`** — params: `{ projectId?: string }`
   - If projectId: fetch specific project's design_md
   - If no projectId: fetch the most recently updated project's design_md for the org
   - Return: `{ designMd: string, projectName: string }`

2. **`get_tokens`** — params: `{ format?: "css" | "json" | "tailwind" }`
   - Fetch the most recent project's extraction_data for the org
   - Extract tokens from it
   - Format as CSS variables, W3C JSON, or Tailwind config
   - Return: `{ tokens: string, format: string }`

3. **`get_component`** — params: `{ slug: string }`
   - Fetch component by slug from org's library (`status = "approved"` only)
   - Return: `{ name, description, code, props, variants, states }`

4. **`list_components`** — params: `{ category?: string }`
   - Fetch approved components for the org
   - Return: `{ components: Array<{ name, slug, description, category, propCount, variantCount }> }`

5. **`check_compliance`** — params: `{ code: string }`
   - Check code against org's approved tokens and components
   - Scan for hardcoded hex values not in token list
   - Scan for unknown CSS variables
   - Scan for components that duplicate library names
   - Return: `{ compliant: boolean, issues: Array<{ rule, message, severity }> }`

**Error handling:**
- Unknown tool: `{ error: "Unknown tool: {name}" }`, 400
- Missing params: `{ error: "Missing required param: {name}" }`, 400
- Tool execution error: `{ error: "..." }`, 500

**Response format:**
```json
{
  "tool": "get_component",
  "result": { ... }
}
```

For token extraction helpers, reuse `extractTokensUsed()` from `lib/supabase/components.ts` pattern. For token formatting, reuse generators from `lib/export/` — read `tokens-css.ts`, `tokens-json.ts`, and `tailwind-config.ts` to understand how they format extraction data.

**Step 2: Commit**

```bash
git add app/api/mcp/route.ts
git commit -m "feat: add HTTP MCP endpoint with design system tools"
```

---

### Task 6: API Key Settings Page

**Files:**
- Create: `app/(dashboard)/[org]/settings/page.tsx` — settings overview (redirects to first sub-page)
- Create: `app/(dashboard)/[org]/settings/api-keys/page.tsx`
- Create: `components/dashboard/ApiKeyManager.tsx`

**Settings page** (`/[org]/settings`):
- Simple page with a link to API Keys sub-section
- Can be expanded later with other settings (members, billing, etc.)

**API Keys page** (`/[org]/settings/api-keys`):
- Header: "API Keys" with description "Manage API keys for programmatic access to your design system"
- "Create Key" button
- List of existing keys showing: name, preview (`lyt_...xxxx`), scopes, created date, last used date, revoke button
- Permission-gated: only show to users with `manageApiKeys` permission

**ApiKeyManager component:**

**Create flow:**
1. Click "Create Key" → inline form appears: name input + scope checkboxes (read, write)
2. Submit → POST to API
3. Show the full key in a copyable field with warning: "Copy this key now. You won't be able to see it again."
4. After dismissing: key shows as preview only

**Key list:**
```
┌──────────────────────────────────────────────────────────┐
│  CLI Key                    lyt_...a1b2   read          │
│  Created 12 Mar 2026 · Last used 14 Mar 2026  [Revoke]  │
├──────────────────────────────────────────────────────────┤
│  GitHub Actions             lyt_...c3d4   read, write   │
│  Created 10 Mar 2026 · Never used             [Revoke]  │
└──────────────────────────────────────────────────────────┘
```

**Revoke confirmation:** Click "Revoke" → confirm dialog → DELETE to API → remove from list

**Step 2: Commit**

```bash
git add app/\(dashboard\)/\[org\]/settings/ components/dashboard/ApiKeyManager.tsx
git commit -m "feat: add API key settings page with create and revoke"
```

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

```bash
git add -A
git commit -m "fix: resolve type errors from MCP endpoint and API keys"
```

---

## Notes for Implementer

- **API key format:** `lyt_` prefix + 40 hex chars = 44 chars total. Use `crypto.randomBytes(20).toString("hex")` for the random part
- **Hashing:** `crypto.createHash("sha256").update(key).digest("hex")` — import from `node:crypto`
- **Key preview:** `lyt_...` + last 4 chars of the random part
- **Never log or return the full key** after creation — only `keyPreview` from that point
- **MCP endpoint is NOT the full MCP protocol** — it's a simplified REST API. Full MCP (with stdio/SSE transport) would be the `@layoutdesign/context` npm package
- **Token extraction from projects:** The `extraction_data` JSONB column contains `tokens` with `colors`, `typography`, `spacing`, etc. Parse it as `ExtractionResult`
- **CSS variables for styling:** Use studio design system tokens as in all other pages
- **Permission `manageApiKeys`:** Only owner and admin
- **fetchAllProjects** in `lib/supabase/db.ts` takes `orgId` and returns all projects for the org
- **Approved components only** for MCP responses — filter with `status: "approved"`
- **Export generators** in `lib/export/` can be adapted for token formatting, but they may expect `ExtractionResult` — read them before using
