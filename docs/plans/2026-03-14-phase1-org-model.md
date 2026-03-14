# Phase 1: Organisation Model & Team Features

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add multi-tenant organisation support so projects, billing, and credits are org-scoped instead of user-scoped. Every user gets a personal org on signup. Teams can invite members with role-based access.

**Architecture:** Add `layout_organization` and `layout_organization_member` tables. Every existing entity (projects, subscriptions, credits) gets an `org_id` column. A personal org is auto-created for each user. The proxy middleware gains org-aware routing and RBAC. Dashboard pages move under `/[org]/` path segments with a sidebar layout.

**Tech Stack:** Next.js 15 App Router, Better Auth v1.5.3, Supabase PostgreSQL (self-hosted, no SSL), Zustand, Zod, shadcn/ui

---

## Important Context

- **Database:** Self-hosted Supabase at `supabase.unified.studio`, port 5432, no SSL
- **Auth:** Better Auth with `layout_user`, `layout_session`, `layout_account`, `layout_verification` tables. User ID is `text` type, not UUID
- **Current billing:** `layout_subscription`, `layout_credit_balance`, `layout_usage_log` all keyed on `user_id` (text)
- **Current projects:** `layout_projects` table with `user_id` column, JSONB columns for extraction_data, test_results, explorations
- **Existing migrations:** 001-004 in `migrations/` directory
- **Studio:** Lives at `/studio/[id]` — full-screen workspace, no sidebar. Keep as-is
- **CSS variables:** All UI uses `--bg-app`, `--bg-panel`, `--bg-surface`, `--studio-accent`, etc. from `globals.css`

---

### Task 1: Organisation & Member Tables (Migration 005)

**Files:**
- Create: `migrations/005_organizations.sql`

**Step 1: Write the migration**

```sql
-- Migration 005: Organisation model
-- Every user gets a personal org. All entities become org-scoped.

-- Organisations
CREATE TABLE IF NOT EXISTS layout_organization (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  owner_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_org_slug ON layout_organization (slug);
CREATE INDEX IF NOT EXISTS idx_org_owner ON layout_organization (owner_id);

-- Organisation members (join table with roles)
CREATE TABLE IF NOT EXISTS layout_organization_member (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES layout_organization(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
  invited_by TEXT,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_member_user ON layout_organization_member (user_id);
CREATE INDEX IF NOT EXISTS idx_org_member_org ON layout_organization_member (org_id);

-- Pending invitations
CREATE TABLE IF NOT EXISTS layout_invitation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES layout_organization(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('admin', 'editor', 'viewer')),
  invited_by TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, email)
);

-- Add org_id to projects (nullable initially for migration, then NOT NULL)
ALTER TABLE layout_projects ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES layout_organization(id) ON DELETE CASCADE;

-- Add org_id to billing tables
ALTER TABLE layout_subscription ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES layout_organization(id) ON DELETE CASCADE;
ALTER TABLE layout_credit_balance ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES layout_organization(id) ON DELETE CASCADE;
ALTER TABLE layout_usage_log ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES layout_organization(id) ON DELETE CASCADE;
```

**Step 2: Run the migration manually against the database**

This migration adds columns as nullable first. Task 2 will create personal orgs and backfill.

**Step 3: Commit**

```bash
git add migrations/005_organizations.sql
git commit -m "feat: add organisation tables and org_id columns (migration 005)"
```

---

### Task 2: Personal Org Migration (Migration 006)

**Files:**
- Create: `migrations/006_personal_orgs.sql`

**Step 1: Write the backfill migration**

```sql
-- Migration 006: Create personal orgs for existing users, backfill org_id

-- Create a personal org for every existing user
INSERT INTO layout_organization (name, slug, owner_id)
SELECT
  'Personal',
  'personal-' || u.id,
  u.id
FROM layout_user u
WHERE NOT EXISTS (
  SELECT 1 FROM layout_organization o WHERE o.owner_id = u.id
)
ON CONFLICT DO NOTHING;

-- Add owner as member of their personal org
INSERT INTO layout_organization_member (org_id, user_id, role)
SELECT o.id, o.owner_id, 'owner'
FROM layout_organization o
WHERE NOT EXISTS (
  SELECT 1 FROM layout_organization_member m
  WHERE m.org_id = o.id AND m.user_id = o.owner_id
)
ON CONFLICT DO NOTHING;

-- Backfill org_id on projects
UPDATE layout_projects p
SET org_id = o.id
FROM layout_organization o
WHERE o.owner_id = p.user_id
  AND o.slug LIKE 'personal-%'
  AND p.org_id IS NULL;

-- Backfill org_id on subscriptions
UPDATE layout_subscription s
SET org_id = o.id
FROM layout_organization o
WHERE o.owner_id = s.user_id
  AND o.slug LIKE 'personal-%'
  AND s.org_id IS NULL;

-- Backfill org_id on credit balances
UPDATE layout_credit_balance cb
SET org_id = o.id
FROM layout_organization o
WHERE o.owner_id = cb.user_id
  AND o.slug LIKE 'personal-%'
  AND cb.org_id IS NULL;

-- Backfill org_id on usage logs
UPDATE layout_usage_log ul
SET org_id = o.id
FROM layout_organization o
WHERE o.owner_id = ul.user_id
  AND o.slug LIKE 'personal-%'
  AND ul.org_id IS NULL;

-- Now make org_id NOT NULL on projects
ALTER TABLE layout_projects ALTER COLUMN org_id SET NOT NULL;

-- Create org-scoped credit deduction function
CREATE OR REPLACE FUNCTION layout_deduct_credit_org(
  p_org_id UUID,
  p_type TEXT
) RETURNS boolean AS $$
BEGIN
  IF p_type = 'design_md' THEN
    UPDATE layout_credit_balance
    SET design_md_remaining = design_md_remaining - 1
    WHERE org_id = p_org_id AND design_md_remaining > 0;
  ELSIF p_type = 'test_query' THEN
    UPDATE layout_credit_balance
    SET test_query_remaining = test_query_remaining - 1
    WHERE org_id = p_org_id AND test_query_remaining > 0;
  ELSE
    RETURN false;
  END IF;

  IF FOUND THEN RETURN true; END IF;

  -- Fall back to top-up credits
  IF p_type = 'design_md' THEN
    UPDATE layout_credit_balance
    SET topup_design_md = topup_design_md - 1
    WHERE org_id = p_org_id AND topup_design_md > 0;
  ELSE
    UPDATE layout_credit_balance
    SET topup_test_query = topup_test_query - 1
    WHERE org_id = p_org_id AND topup_test_query > 0;
  END IF;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Add index for org-scoped queries
CREATE INDEX IF NOT EXISTS idx_projects_org ON layout_projects (org_id);
CREATE INDEX IF NOT EXISTS idx_subscription_org ON layout_subscription (org_id);
CREATE INDEX IF NOT EXISTS idx_credit_balance_org ON layout_credit_balance (org_id);
CREATE INDEX IF NOT EXISTS idx_usage_log_org ON layout_usage_log (org_id);
```

**Step 2: Run the migration**

**Step 3: Commit**

```bash
git add migrations/006_personal_orgs.sql
git commit -m "feat: create personal orgs for existing users, backfill org_id (migration 006)"
```

---

### Task 3: Organisation TypeScript Types & CRUD

**Files:**
- Create: `lib/types/organization.ts`
- Create: `lib/supabase/organization.ts`

**Step 1: Create the types**

```typescript
// lib/types/organization.ts
export type OrgRole = "owner" | "admin" | "editor" | "viewer";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrgMember {
  id: string;
  orgId: string;
  userId: string;
  role: OrgRole;
  invitedBy: string | null;
  joinedAt: string;
  // Joined from layout_user
  userName?: string;
  userEmail?: string;
  userImage?: string;
}

export interface OrgInvitation {
  id: string;
  orgId: string;
  email: string;
  role: Exclude<OrgRole, "owner">;
  invitedBy: string;
  token: string;
  expiresAt: string;
  createdAt: string;
}

/** Permissions per role */
export const ROLE_PERMISSIONS = {
  owner:  { manageOrg: true,  manageMembers: true,  manageBilling: true,  createProject: true,  editProject: true,  viewProject: true,  deleteProject: true  },
  admin:  { manageOrg: false, manageMembers: true,  manageBilling: true,  createProject: true,  editProject: true,  viewProject: true,  deleteProject: true  },
  editor: { manageOrg: false, manageMembers: false, manageBilling: false, createProject: true,  editProject: true,  viewProject: true,  deleteProject: false },
  viewer: { manageOrg: false, manageMembers: false, manageBilling: false, createProject: false, editProject: false, viewProject: true,  deleteProject: false },
} as const;

export type Permission = keyof typeof ROLE_PERMISSIONS.owner;
```

**Step 2: Create the CRUD module**

```typescript
// lib/supabase/organization.ts
import { supabase } from "./client";
import type { Organization, OrgMember, OrgInvitation, OrgRole } from "@/lib/types/organization";

// ─── Row Types ────────────────────────────────────────────────────────────────

interface OrgRow {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

interface MemberRow {
  id: string;
  org_id: string;
  user_id: string;
  role: string;
  invited_by: string | null;
  joined_at: string;
}

interface InvitationRow {
  id: string;
  org_id: string;
  email: string;
  role: string;
  invited_by: string;
  token: string;
  expires_at: string;
  created_at: string;
}

// ─── Row Mappers ──────────────────────────────────────────────────────────────

function rowToOrg(row: OrgRow): Organization {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    logoUrl: row.logo_url,
    ownerId: row.owner_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToMember(row: MemberRow): OrgMember {
  return {
    id: row.id,
    orgId: row.org_id,
    userId: row.user_id,
    role: row.role as OrgRole,
    invitedBy: row.invited_by,
    joinedAt: row.joined_at,
  };
}

function rowToInvitation(row: InvitationRow): OrgInvitation {
  return {
    id: row.id,
    orgId: row.org_id,
    email: row.email,
    role: row.role as Exclude<OrgRole, "owner">,
    invitedBy: row.invited_by,
    token: row.token,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
}

// ─── Organisation CRUD ────────────────────────────────────────────────────────

export async function getOrganization(id: string): Promise<Organization | null> {
  const { data, error } = await supabase
    .from("layout_organization")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return rowToOrg(data as OrgRow);
}

export async function getOrganizationBySlug(slug: string): Promise<Organization | null> {
  const { data, error } = await supabase
    .from("layout_organization")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !data) return null;
  return rowToOrg(data as OrgRow);
}

export async function getUserOrganizations(userId: string): Promise<Organization[]> {
  // Get all orgs where user is a member
  const { data: memberRows, error: memberError } = await supabase
    .from("layout_organization_member")
    .select("org_id")
    .eq("user_id", userId);

  if (memberError || !memberRows?.length) return [];

  const orgIds = (memberRows as { org_id: string }[]).map((r) => r.org_id);
  const { data, error } = await supabase
    .from("layout_organization")
    .select("*")
    .in("id", orgIds)
    .order("created_at", { ascending: true });

  if (error || !data) return [];
  return (data as OrgRow[]).map(rowToOrg);
}

export async function getPersonalOrg(userId: string): Promise<Organization | null> {
  const { data, error } = await supabase
    .from("layout_organization")
    .select("*")
    .eq("owner_id", userId)
    .like("slug", "personal-%")
    .single();

  if (error || !data) return null;
  return rowToOrg(data as OrgRow);
}

export async function createOrganization(
  name: string,
  slug: string,
  ownerId: string
): Promise<Organization | null> {
  const { data, error } = await supabase
    .from("layout_organization")
    .insert({ name, slug, owner_id: ownerId })
    .select()
    .single();

  if (error || !data) {
    console.error("Failed to create organization:", error?.message);
    return null;
  }

  const org = rowToOrg(data as OrgRow);

  // Add owner as member
  await supabase.from("layout_organization_member").insert({
    org_id: org.id,
    user_id: ownerId,
    role: "owner",
  });

  return org;
}

/**
 * Create a personal org for a new user.
 * Called during signup / first login.
 */
export async function ensurePersonalOrg(userId: string): Promise<Organization> {
  const existing = await getPersonalOrg(userId);
  if (existing) return existing;

  const org = await createOrganization("Personal", `personal-${userId}`, userId);
  if (!org) throw new Error("Failed to create personal organization");
  return org;
}

export async function updateOrganization(
  id: string,
  updates: { name?: string; slug?: string; logoUrl?: string | null }
): Promise<void> {
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.name !== undefined) row.name = updates.name;
  if (updates.slug !== undefined) row.slug = updates.slug;
  if (updates.logoUrl !== undefined) row.logo_url = updates.logoUrl;

  const { error } = await supabase
    .from("layout_organization")
    .update(row)
    .eq("id", id);

  if (error) console.error("Failed to update organization:", error.message);
}

// ─── Member CRUD ──────────────────────────────────────────────────────────────

export async function getOrgMembers(orgId: string): Promise<OrgMember[]> {
  const { data, error } = await supabase
    .from("layout_organization_member")
    .select("*")
    .eq("org_id", orgId)
    .order("joined_at", { ascending: true });

  if (error || !data) return [];
  return (data as MemberRow[]).map(rowToMember);
}

export async function getOrgMember(
  orgId: string,
  userId: string
): Promise<OrgMember | null> {
  const { data, error } = await supabase
    .from("layout_organization_member")
    .select("*")
    .eq("org_id", orgId)
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;
  return rowToMember(data as MemberRow);
}

export async function updateMemberRole(
  orgId: string,
  userId: string,
  role: OrgRole
): Promise<void> {
  const { error } = await supabase
    .from("layout_organization_member")
    .update({ role })
    .eq("org_id", orgId)
    .eq("user_id", userId);

  if (error) console.error("Failed to update member role:", error.message);
}

export async function removeMember(orgId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from("layout_organization_member")
    .delete()
    .eq("org_id", orgId)
    .eq("user_id", userId);

  if (error) console.error("Failed to remove member:", error.message);
}

// ─── Invitation CRUD ──────────────────────────────────────────────────────────

export async function createInvitation(
  orgId: string,
  email: string,
  role: Exclude<OrgRole, "owner">,
  invitedBy: string
): Promise<OrgInvitation | null> {
  const { data, error } = await supabase
    .from("layout_invitation")
    .upsert(
      { org_id: orgId, email, role, invited_by: invitedBy },
      { onConflict: "org_id,email" }
    )
    .select()
    .single();

  if (error || !data) {
    console.error("Failed to create invitation:", error?.message);
    return null;
  }
  return rowToInvitation(data as InvitationRow);
}

export async function getInvitationByToken(token: string): Promise<OrgInvitation | null> {
  const { data, error } = await supabase
    .from("layout_invitation")
    .select("*")
    .eq("token", token)
    .single();

  if (error || !data) return null;
  return rowToInvitation(data as InvitationRow);
}

export async function getOrgInvitations(orgId: string): Promise<OrgInvitation[]> {
  const { data, error } = await supabase
    .from("layout_invitation")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as InvitationRow[]).map(rowToInvitation);
}

export async function acceptInvitation(
  token: string,
  userId: string
): Promise<{ orgId: string; role: OrgRole } | null> {
  const invitation = await getInvitationByToken(token);
  if (!invitation) return null;

  // Check expiry
  if (new Date(invitation.expiresAt) < new Date()) {
    console.error("Invitation expired");
    return null;
  }

  // Add user as member
  const { error } = await supabase
    .from("layout_organization_member")
    .insert({
      org_id: invitation.orgId,
      user_id: userId,
      role: invitation.role,
      invited_by: invitation.invitedBy,
    });

  if (error) {
    console.error("Failed to accept invitation:", error.message);
    return null;
  }

  // Delete the invitation
  await supabase.from("layout_invitation").delete().eq("id", invitation.id);

  return { orgId: invitation.orgId, role: invitation.role };
}

export async function deleteInvitation(id: string): Promise<void> {
  const { error } = await supabase
    .from("layout_invitation")
    .delete()
    .eq("id", id);

  if (error) console.error("Failed to delete invitation:", error.message);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Validate a slug: lowercase alphanumeric + hyphens, 3-48 chars.
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9][a-z0-9-]{1,46}[a-z0-9]$/.test(slug);
}

/**
 * Generate a slug from a name.
 */
export function nameToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}
```

**Step 3: Commit**

```bash
git add lib/types/organization.ts lib/supabase/organization.ts
git commit -m "feat: add organisation types and Supabase CRUD module"
```

---

### Task 4: Organisation Zustand Store

**Files:**
- Create: `lib/store/organization.ts`

**Step 1: Create the store**

```typescript
// lib/store/organization.ts
"use client";

import { create } from "zustand";
import type { Organization, OrgMember, OrgRole, Permission } from "@/lib/types/organization";
import { ROLE_PERMISSIONS } from "@/lib/types/organization";

interface OrgState {
  organizations: Organization[];
  currentOrgId: string | null;
  currentMembership: OrgMember | null;
  members: OrgMember[];

  // Computed
  currentOrg: () => Organization | undefined;
  personalOrg: () => Organization | undefined;
  hasPermission: (permission: Permission) => boolean;
  currentRole: () => OrgRole | null;

  // Actions
  loadOrganizations: (orgs: Organization[]) => void;
  setCurrentOrg: (orgId: string) => void;
  setCurrentMembership: (member: OrgMember | null) => void;
  setMembers: (members: OrgMember[]) => void;
  addOrganization: (org: Organization) => void;
  updateOrganization: (orgId: string, updates: Partial<Organization>) => void;
  clear: () => void;
}

export const useOrgStore = create<OrgState>()((set, get) => ({
  organizations: [],
  currentOrgId: null,
  currentMembership: null,
  members: [],

  currentOrg: () => {
    const { organizations, currentOrgId } = get();
    return organizations.find((o) => o.id === currentOrgId);
  },

  personalOrg: () => {
    const { organizations } = get();
    return organizations.find((o) => o.slug.startsWith("personal-"));
  },

  hasPermission: (permission) => {
    const { currentMembership } = get();
    if (!currentMembership) return false;
    return ROLE_PERMISSIONS[currentMembership.role][permission];
  },

  currentRole: () => {
    const { currentMembership } = get();
    return currentMembership?.role ?? null;
  },

  loadOrganizations: (orgs) => set({ organizations: orgs }),

  setCurrentOrg: (orgId) => set({ currentOrgId: orgId }),

  setCurrentMembership: (member) => set({ currentMembership: member }),

  setMembers: (members) => set({ members }),

  addOrganization: (org) =>
    set((state) => ({ organizations: [...state.organizations, org] })),

  updateOrganization: (orgId, updates) =>
    set((state) => ({
      organizations: state.organizations.map((o) =>
        o.id === orgId ? { ...o, ...updates } : o
      ),
    })),

  clear: () =>
    set({
      organizations: [],
      currentOrgId: null,
      currentMembership: null,
      members: [],
    }),
}));
```

**Step 2: Commit**

```bash
git add lib/store/organization.ts
git commit -m "feat: add organisation Zustand store"
```

---

### Task 5: OrgProvider Component

**Files:**
- Create: `components/OrgProvider.tsx`

This component hydrates the org store from the database on mount, auto-creates a personal org for new users, and resolves the current org from the URL.

```typescript
// components/OrgProvider.tsx
"use client";

import { useEffect, type ReactNode } from "react";
import { useSession } from "@/lib/auth-client";
import { useOrgStore } from "@/lib/store/organization";
import { useParams } from "next/navigation";

interface OrgProviderProps {
  children: ReactNode;
}

export function OrgProvider({ children }: OrgProviderProps) {
  const { data: session } = useSession();
  const params = useParams();
  const orgSlug = params?.org as string | undefined;

  const loadOrganizations = useOrgStore((s) => s.loadOrganizations);
  const setCurrentOrg = useOrgStore((s) => s.setCurrentOrg);
  const setCurrentMembership = useOrgStore((s) => s.setCurrentMembership);
  const setMembers = useOrgStore((s) => s.setMembers);
  const clear = useOrgStore((s) => s.clear);
  const organizations = useOrgStore((s) => s.organizations);

  // Hydrate orgs on session change
  useEffect(() => {
    if (!session?.user?.id) {
      clear();
      return;
    }

    async function hydrate() {
      try {
        const res = await fetch("/api/organizations");
        if (!res.ok) return;
        const orgs = await res.json();
        loadOrganizations(orgs);
      } catch (err) {
        console.error("Failed to hydrate organizations:", err);
      }
    }

    void hydrate();
  }, [session?.user?.id, loadOrganizations, clear]);

  // Resolve current org from URL slug
  useEffect(() => {
    if (!orgSlug || organizations.length === 0) return;

    const org = organizations.find((o) => o.slug === orgSlug);
    if (org) {
      setCurrentOrg(org.id);

      // Fetch membership + members for this org
      async function loadMembership() {
        try {
          const [memberRes, membersRes] = await Promise.all([
            fetch(`/api/organizations/${org!.id}/membership`),
            fetch(`/api/organizations/${org!.id}/members`),
          ]);
          if (memberRes.ok) {
            const member = await memberRes.json();
            setCurrentMembership(member);
          }
          if (membersRes.ok) {
            const members = await membersRes.json();
            setMembers(members);
          }
        } catch (err) {
          console.error("Failed to load org membership:", err);
        }
      }

      void loadMembership();
    }
  }, [orgSlug, organizations, setCurrentOrg, setCurrentMembership, setMembers]);

  return <>{children}</>;
}
```

**Step 2: Commit**

```bash
git add components/OrgProvider.tsx
git commit -m "feat: add OrgProvider component for org hydration"
```

---

### Task 6: Organisation API Routes

**Files:**
- Create: `app/api/organizations/route.ts` — list user's orgs
- Create: `app/api/organizations/create/route.ts` — create new org
- Create: `app/api/organizations/[orgId]/membership/route.ts` — get current user's membership
- Create: `app/api/organizations/[orgId]/members/route.ts` — list members
- Create: `app/api/organizations/[orgId]/invite/route.ts` — send invitation
- Create: `lib/api/auth-context.ts` — shared auth helper for API routes

**Step 1: Create the auth context helper**

```typescript
// lib/api/auth-context.ts
import { auth, type Session } from "@/lib/auth";
import { headers } from "next/headers";
import { getOrgMember } from "@/lib/supabase/organization";
import type { OrgRole, Permission } from "@/lib/types/organization";
import { ROLE_PERMISSIONS } from "@/lib/types/organization";

export interface AuthContext {
  session: Session;
  userId: string;
}

export interface OrgAuthContext extends AuthContext {
  orgId: string;
  role: OrgRole;
}

/**
 * Get authenticated session or return 401 response.
 */
export async function requireAuth(): Promise<AuthContext | Response> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return { session, userId: session.user.id };
}

/**
 * Get authenticated session with org membership, or return error response.
 * Optionally checks for a specific permission.
 */
export async function requireOrgAuth(
  orgId: string,
  requiredPermission?: Permission
): Promise<OrgAuthContext | Response> {
  const authResult = await requireAuth();
  if (authResult instanceof Response) return authResult;

  const member = await getOrgMember(orgId, authResult.userId);
  if (!member) {
    return Response.json({ error: "Not a member of this organisation" }, { status: 403 });
  }

  if (requiredPermission && !ROLE_PERMISSIONS[member.role][requiredPermission]) {
    return Response.json(
      { error: `Insufficient permissions: requires ${requiredPermission}` },
      { status: 403 }
    );
  }

  return { ...authResult, orgId, role: member.role };
}
```

**Step 2: Create the list orgs route**

```typescript
// app/api/organizations/route.ts
import { requireAuth } from "@/lib/api/auth-context";
import { getUserOrganizations, ensurePersonalOrg } from "@/lib/supabase/organization";

export async function GET() {
  const authResult = await requireAuth();
  if (authResult instanceof Response) return authResult;

  // Ensure personal org exists (handles new users)
  await ensurePersonalOrg(authResult.userId);

  const orgs = await getUserOrganizations(authResult.userId);
  return Response.json(orgs);
}
```

**Step 3: Create the create org route**

```typescript
// app/api/organizations/create/route.ts
import { z } from "zod";
import { requireAuth } from "@/lib/api/auth-context";
import {
  createOrganization,
  getOrganizationBySlug,
  nameToSlug,
  isValidSlug,
} from "@/lib/supabase/organization";

const CreateOrgSchema = z.object({
  name: z.string().min(2).max(50),
  slug: z.string().min(3).max(48).optional(),
});

export async function POST(request: Request) {
  const authResult = await requireAuth();
  if (authResult instanceof Response) return authResult;

  const body = await request.json();
  const parsed = CreateOrgSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const slug = parsed.data.slug ?? nameToSlug(parsed.data.name);
  if (!isValidSlug(slug)) {
    return Response.json(
      { error: "Invalid slug: use lowercase letters, numbers, and hyphens" },
      { status: 400 }
    );
  }

  // Check uniqueness
  const existing = await getOrganizationBySlug(slug);
  if (existing) {
    return Response.json({ error: "Organisation slug already taken" }, { status: 409 });
  }

  const org = await createOrganization(parsed.data.name, slug, authResult.userId);
  if (!org) {
    return Response.json({ error: "Failed to create organisation" }, { status: 500 });
  }

  return Response.json(org, { status: 201 });
}
```

**Step 4: Create the membership route**

```typescript
// app/api/organizations/[orgId]/membership/route.ts
import { requireAuth } from "@/lib/api/auth-context";
import { getOrgMember } from "@/lib/supabase/organization";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const authResult = await requireAuth();
  if (authResult instanceof Response) return authResult;

  const { orgId } = await params;
  const member = await getOrgMember(orgId, authResult.userId);
  if (!member) {
    return Response.json({ error: "Not a member" }, { status: 403 });
  }

  return Response.json(member);
}
```

**Step 5: Create the members route**

```typescript
// app/api/organizations/[orgId]/members/route.ts
import { requireOrgAuth } from "@/lib/api/auth-context";
import { getOrgMembers } from "@/lib/supabase/organization";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;
  const authResult = await requireOrgAuth(orgId, "viewProject");
  if (authResult instanceof Response) return authResult;

  const members = await getOrgMembers(orgId);
  return Response.json(members);
}
```

**Step 6: Create the invite route**

```typescript
// app/api/organizations/[orgId]/invite/route.ts
import { z } from "zod";
import { requireOrgAuth } from "@/lib/api/auth-context";
import { createInvitation } from "@/lib/supabase/organization";

const InviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "editor", "viewer"]),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;
  const authResult = await requireOrgAuth(orgId, "manageMembers");
  if (authResult instanceof Response) return authResult;

  const body = await request.json();
  const parsed = InviteSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const invitation = await createInvitation(
    orgId,
    parsed.data.email,
    parsed.data.role,
    authResult.userId
  );

  if (!invitation) {
    return Response.json({ error: "Failed to create invitation" }, { status: 500 });
  }

  // TODO: Send invitation email via Resend (Phase 3)

  return Response.json(invitation, { status: 201 });
}
```

**Step 7: Commit**

```bash
git add lib/api/auth-context.ts app/api/organizations/
git commit -m "feat: add organisation API routes with RBAC"
```

---

### Task 7: Update Project CRUD for Org Scope

**Files:**
- Modify: `lib/supabase/db.ts` — add `orgId` parameter, query by `org_id`
- Modify: `lib/store/project.ts` — pass `orgId` through
- Modify: `components/ProjectHydrator.tsx` — use org context
- Modify: `lib/types/index.ts` — add `orgId` to Project type

**Step 1: Update types**

In `lib/types/index.ts`, add `orgId` to the `Project` interface:

```typescript
export interface Project {
  id: string;
  orgId: string;  // NEW
  name: string;
  sourceType: SourceType;
  // ... rest unchanged
}
```

**Step 2: Update db.ts**

Change `fetchAllProjects` to accept `orgId` instead of `userId`:

```typescript
export async function fetchAllProjects(orgId: string): Promise<Project[]> {
  const { data, error } = await supabase
    .from("layout_projects")
    .select("*")
    .eq("org_id", orgId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch projects:", error.message);
    return [];
  }

  return (data as ProjectRow[]).map(rowToProject);
}
```

Update `upsertProject` to use `orgId`:

```typescript
export async function upsertProject(
  project: Project,
  userId: string,
  orgId: string
): Promise<void> {
  const row = projectToRow(project, userId, orgId);
  // ...
}
```

Update `projectToRow` to include `org_id`:

```typescript
function projectToRow(
  project: Project,
  userId: string,
  orgId: string
): Omit<ProjectRow, "created_at"> & { updated_at: string } {
  return {
    // ... existing fields ...
    org_id: orgId,
    user_id: userId,
    updated_at: new Date().toISOString(),
  };
}
```

Update `removeProject` to check `org_id`:

```typescript
export async function removeProject(id: string, orgId: string): Promise<void> {
  await deleteScreenshots(id);
  const { error } = await supabase
    .from("layout_projects")
    .delete()
    .eq("id", id)
    .eq("org_id", orgId);
  // ...
}
```

Add `org_id` to `ProjectRow` and `rowToProject`:

```typescript
interface ProjectRow {
  // ... existing fields ...
  org_id: string;
}

function rowToProject(row: ProjectRow): Project {
  return {
    // ... existing fields ...
    orgId: row.org_id,
  };
}
```

**Step 3: Update store**

In `lib/store/project.ts`:
- Add `orgId: string | null` to state
- Change `loadProjects` to `(projects, userId, orgId)`
- Pass `orgId` to all `upsertProject` calls
- Pass `orgId` to `removeProject`

**Step 4: Update ProjectHydrator**

In `components/ProjectHydrator.tsx`:
- Import `useOrgStore`
- Get `currentOrgId` from org store
- Call `fetchAllProjects(orgId)` instead of `fetchAllProjects(userId)`
- Pass `orgId` to `loadProjects`

```typescript
export function ProjectHydrator() {
  const { data: session } = useSession();
  const currentOrgId = useOrgStore((s) => s.currentOrgId);
  const loadProjects = useProjectStore((s) => s.loadProjects);
  // ...

  useEffect(() => {
    if (!session?.user?.id || !currentOrgId) {
      clearProjects();
      return;
    }

    const userId = session.user.id;
    fetchAllProjects(currentOrgId)
      .then((projects) => loadProjects(projects, userId, currentOrgId))
      .catch(/* ... */);
  }, [session?.user?.id, currentOrgId, /* ... */]);
  // ...
}
```

**Step 5: Commit**

```bash
git add lib/types/index.ts lib/supabase/db.ts lib/store/project.ts components/ProjectHydrator.tsx
git commit -m "feat: scope projects to org_id instead of user_id"
```

---

### Task 8: Update Billing for Org Scope

**Files:**
- Modify: `lib/billing/credits.ts` — add org-scoped variants
- Modify: `lib/billing/subscription.ts` — add org-scoped queries
- Modify: `app/api/webhooks/stripe/route.ts` — resolve org from user
- Modify: `lib/types/billing.ts` — add `orgId` to types

**Step 1: Update billing types**

Add `orgId` to `Subscription`, `CreditBalance`:

```typescript
export interface Subscription {
  id: string;
  userId: string;
  orgId: string;  // NEW
  // ... rest unchanged
}

export interface CreditBalance {
  userId: string;
  orgId: string;  // NEW
  // ... rest unchanged
}
```

**Step 2: Update credits.ts**

Add org-scoped functions alongside existing ones:

- `getCreditBalanceByOrg(orgId)` — query by `org_id`
- `checkQuotaByOrg(orgId, endpoint)` — use org credit balance
- `deductCreditByOrg(orgId, endpoint)` — call `layout_deduct_credit_org` RPC
- `resetMonthlyCreditsByOrg(orgId, tier, seatCount, periodStart, periodEnd)`

Keep the old `userId`-based functions during transition but mark as deprecated.

**Step 3: Update subscription.ts**

Add `orgId` to `rowToSubscription`, update `upsertSubscription` to handle `org_id`.

**Step 4: Update Stripe webhook**

In `handleCheckoutCompleted`, after resolving `userId`, also resolve the user's personal org and set `org_id`:

```typescript
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  if (!userId) return;

  // Resolve org — use metadata.orgId if present, else personal org
  const orgId = session.metadata?.orgId;
  let resolvedOrgId = orgId;
  if (!resolvedOrgId) {
    const personalOrg = await getPersonalOrg(userId);
    resolvedOrgId = personalOrg?.id;
  }

  // ... pass resolvedOrgId to upsertSubscription and resetMonthlyCredits
}
```

**Step 5: Commit**

```bash
git add lib/billing/ lib/types/billing.ts app/api/webhooks/stripe/route.ts
git commit -m "feat: scope billing and credits to org_id"
```

---

### Task 9: Update Proxy for Org-Aware Routing

**Files:**
- Modify: `proxy.ts` — no RBAC needed here (that's in API routes), but add org slug paths to public routing

**Step 1: Update proxy**

The proxy handles authentication only. RBAC is checked in API routes via `requireOrgAuth`. The proxy needs to know about the new `[org]` paths:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const PUBLIC_PATHS = ["/login", "/api/auth", "/api/webhooks", "/docs", "/pricing", "/changelog", "/terms", "/privacy"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public pages
  if (pathname === "/") return NextResponse.next();
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Invitation accept page is public (user may not be logged in yet)
  if (pathname.startsWith("/invite/")) {
    return NextResponse.next();
  }

  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

**Step 2: Commit**

```bash
git add proxy.ts
git commit -m "feat: update proxy for org-aware routing"
```

---

### Task 10: Dashboard Layout with Sidebar

**Files:**
- Create: `app/(dashboard)/layout.tsx` — sidebar + content layout
- Create: `app/(dashboard)/[org]/page.tsx` — projects list (replaces current `/studio`)
- Create: `components/dashboard/Sidebar.tsx` — navigation sidebar
- Create: `components/dashboard/OrgSwitcher.tsx` — org dropdown

**Step 1: Create Sidebar component**

```typescript
// components/dashboard/Sidebar.tsx
"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { OrgSwitcher } from "./OrgSwitcher";

const NAV_ITEMS = [
  { label: "Projects", href: "", icon: "folder" },
  // Phase 2: { label: "Library", href: "/library", icon: "layers" },
  // Phase 3: { label: "Candidates", href: "/candidates", icon: "sparkles" },
] as const;

export function Sidebar() {
  const params = useParams();
  const pathname = usePathname();
  const orgSlug = params?.org as string;

  return (
    <aside className="flex h-full w-60 flex-col border-r border-[var(--studio-border)] bg-[var(--bg-panel)]">
      <div className="border-b border-[var(--studio-border)] p-3">
        <OrgSwitcher />
      </div>

      <nav className="flex-1 space-y-0.5 p-2">
        {NAV_ITEMS.map((item) => {
          const href = `/${orgSlug}${item.href}`;
          const isActive = item.href === ""
            ? pathname === `/${orgSlug}`
            : pathname.startsWith(href);

          return (
            <Link
              key={item.label}
              href={href}
              className={`flex items-center gap-2 rounded-[var(--studio-radius-md)] px-3 py-2 text-sm transition-all duration-[var(--duration-base)] ${
                isActive
                  ? "bg-[var(--studio-accent-subtle)] text-[var(--studio-accent)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[var(--studio-border)] p-2">
        <Link
          href={`/${orgSlug}/settings`}
          className="flex items-center gap-2 rounded-[var(--studio-radius-md)] px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-all duration-[var(--duration-base)]"
        >
          Settings
        </Link>
      </div>
    </aside>
  );
}
```

**Step 2: Create OrgSwitcher**

```typescript
// components/dashboard/OrgSwitcher.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useOrgStore } from "@/lib/store/organization";

export function OrgSwitcher() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const organizations = useOrgStore((s) => s.organizations);
  const currentOrg = useOrgStore((s) => s.currentOrg);
  const org = currentOrg();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-[var(--studio-radius-md)] px-3 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all duration-[var(--duration-base)]"
      >
        <span className="truncate">
          {org?.slug.startsWith("personal-") ? "Personal" : org?.name ?? "Select org"}
        </span>
        <svg className="h-4 w-4 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-[var(--studio-radius-lg)] border border-[var(--studio-border)] bg-[var(--bg-elevated)] py-1 shadow-lg">
          {organizations.map((o) => (
            <button
              key={o.id}
              onClick={() => {
                router.push(`/${o.slug}`);
                setOpen(false);
              }}
              className={`flex w-full items-center px-3 py-2 text-sm transition-all duration-[var(--duration-base)] ${
                o.id === org?.id
                  ? "text-[var(--studio-accent)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
              }`}
            >
              {o.slug.startsWith("personal-") ? "Personal" : o.name}
            </button>
          ))}
          <div className="my-1 border-t border-[var(--studio-border)]" />
          <button
            onClick={() => {
              router.push("/new-org");
              setOpen(false);
            }}
            className="flex w-full items-center px-3 py-2 text-sm text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-all duration-[var(--duration-base)]"
          >
            + Create organisation
          </button>
        </div>
      )}
    </div>
  );
}
```

**Step 3: Create dashboard layout**

```typescript
// app/(dashboard)/layout.tsx
import { Sidebar } from "@/components/dashboard/Sidebar";
import { OrgProvider } from "@/components/OrgProvider";
import { ProjectHydrator } from "@/components/ProjectHydrator";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <OrgProvider>
      <ProjectHydrator />
      <div className="flex h-screen bg-[var(--bg-app)]">
        <Sidebar />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </OrgProvider>
  );
}
```

**Step 4: Create dashboard page**

```typescript
// app/(dashboard)/[org]/page.tsx
"use client";

import { useProjectStore } from "@/lib/store/project";
import { useOrgStore } from "@/lib/store/organization";
import Link from "next/link";

export default function DashboardPage() {
  const projects = useProjectStore((s) => s.projects);
  const currentOrg = useOrgStore((s) => s.currentOrg);
  const org = currentOrg();

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">
          Projects
        </h1>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-sm text-[var(--text-muted)]">
            No projects yet. Extract a design system to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/studio/${project.id}`}
              className="group rounded-[var(--studio-radius-lg)] border border-[var(--studio-border)] bg-[var(--bg-surface)] p-4 transition-all duration-[var(--duration-base)] hover:border-[var(--studio-border-strong)] hover:bg-[var(--bg-hover)]"
            >
              <h3 className="text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--studio-accent)]">
                {project.name}
              </h3>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {project.sourceType} · {project.tokenCount ?? 0} tokens
              </p>
              <p className="mt-2 text-xs text-[var(--text-muted)]">
                Updated {new Date(project.updatedAt).toLocaleDateString("en-GB")}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
```

**Step 5: Commit**

```bash
git add app/\(dashboard\)/ components/dashboard/
git commit -m "feat: add dashboard layout with sidebar and org switcher"
```

---

### Task 11: Invitation Accept Flow

**Files:**
- Create: `app/invite/[token]/page.tsx` — public page to accept invitations
- Create: `app/api/invitations/accept/route.ts` — API route to accept

**Step 1: Create the accept API route**

```typescript
// app/api/invitations/accept/route.ts
import { z } from "zod";
import { requireAuth } from "@/lib/api/auth-context";
import { acceptInvitation } from "@/lib/supabase/organization";

const AcceptSchema = z.object({
  token: z.string().min(1),
});

export async function POST(request: Request) {
  const authResult = await requireAuth();
  if (authResult instanceof Response) return authResult;

  const body = await request.json();
  const parsed = AcceptSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await acceptInvitation(parsed.data.token, authResult.userId);
  if (!result) {
    return Response.json(
      { error: "Invalid or expired invitation" },
      { status: 400 }
    );
  }

  return Response.json(result);
}
```

**Step 2: Create the invite page (simple — redirects after accept)**

```typescript
// app/invite/[token]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";

export default function InvitePage() {
  const { token } = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [status, setStatus] = useState<"loading" | "error" | "needsLogin">("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session?.user) {
      setStatus("needsLogin");
      return;
    }

    async function accept() {
      try {
        const res = await fetch("/api/invitations/accept", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Failed to accept invitation");
          setStatus("error");
          return;
        }

        const data = await res.json();
        // Redirect to the org dashboard
        // Need to fetch org slug — for now redirect to root
        router.push("/");
      } catch {
        setError("Something went wrong");
        setStatus("error");
      }
    }

    void accept();
  }, [session?.user, token, router]);

  if (status === "needsLogin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-app)]">
        <div className="text-center">
          <p className="text-sm text-[var(--text-primary)]">
            Please log in to accept this invitation.
          </p>
          <a
            href={`/login?next=/invite/${token}`}
            className="mt-4 inline-block rounded-[var(--studio-radius-md)] bg-[var(--studio-accent)] px-4 py-2 text-sm font-medium text-white"
          >
            Log in
          </a>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-app)]">
        <p className="text-sm text-[var(--status-error)]">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-app)]">
      <p className="text-sm text-[var(--text-muted)]">Accepting invitation...</p>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add app/invite/ app/api/invitations/
git commit -m "feat: add invitation accept flow"
```

---

### Task 12: Update Existing Studio & API Routes for Org Context

**Files:**
- Modify: `app/api/generate/design-md/route.ts` — check org quota instead of user quota
- Modify: `app/api/generate/test/route.ts` — same
- Modify: `app/api/extract/website/route.ts` — same
- Modify: `app/api/extract/figma/route.ts` — same
- Modify: `app/studio/[id]/page.tsx` — ensure project belongs to user's org

**Step 1: Update API routes to use org-scoped billing**

For each AI endpoint route, change:
```typescript
// Before
const quotaCheck = await checkQuota(userId, "design-md");
// After
const quotaCheck = await checkQuotaByOrg(orgId, "design-md");
```

The `orgId` comes from the project's `org_id` (look up the project, get its org_id, then check quota).

Add a helper:

```typescript
// lib/api/project-context.ts
import { supabase } from "@/lib/supabase/client";
import { requireAuth } from "@/lib/api/auth-context";
import { getOrgMember } from "@/lib/supabase/organization";

export async function requireProjectAccess(projectId: string) {
  const authResult = await requireAuth();
  if (authResult instanceof Response) return authResult;

  // Get project's org_id
  const { data, error } = await supabase
    .from("layout_projects")
    .select("org_id")
    .eq("id", projectId)
    .single();

  if (error || !data) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  const orgId = data.org_id as string;
  const member = await getOrgMember(orgId, authResult.userId);
  if (!member) {
    return Response.json({ error: "Not authorised" }, { status: 403 });
  }

  return { ...authResult, orgId, role: member.role };
}
```

**Step 2: Commit**

```bash
git add lib/api/project-context.ts app/api/generate/ app/api/extract/
git commit -m "feat: update API routes for org-scoped billing and access"
```

---

### Task 13: Redirect Logic — `/studio` → Dashboard

**Files:**
- Modify: `app/studio/page.tsx` — redirect to user's personal org dashboard

The current `/studio` page lists projects. Replace it with a redirect to the user's personal org dashboard (`/personal-{userId}`).

```typescript
// app/studio/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";

export default function StudioRedirect() {
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.user?.id) {
      router.replace(`/personal-${session.user.id}`);
    }
  }, [session?.user?.id, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-app)]">
      <p className="text-sm text-[var(--text-muted)]">Redirecting...</p>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add app/studio/page.tsx
git commit -m "feat: redirect /studio to personal org dashboard"
```

---

### Task 14: Type Check & Build Verification

**Step 1: Run typecheck**

```bash
npm run typecheck
```

Expected: PASS (fix any type errors from the org_id additions)

**Step 2: Run lint**

```bash
npm run lint
```

Expected: PASS

**Step 3: Run build**

```bash
npm run build
```

Expected: PASS

**Step 4: Fix any issues, then commit**

```bash
git add -A
git commit -m "fix: resolve type errors from org model integration"
```

---

## Post-Implementation Verification

After all tasks are complete:

1. **Run migrations** 005 and 006 against the dev database
2. **Verify personal org creation**: Log in → check that `/api/organizations` returns a personal org
3. **Verify project listing**: Navigate to `/{personal-slug}` → see existing projects
4. **Verify studio still works**: Click a project → `/studio/[id]` loads correctly
5. **Create a new org**: POST to `/api/organizations/create` → verify it appears in org switcher
6. **Invite a member**: POST to `/api/organizations/{id}/invite` → verify invitation created
7. **Accept invitation**: Navigate to `/invite/{token}` → verify membership created
8. **Check billing**: Verify credit deduction uses org-scoped function

---

## Notes for Implementer

- **Better Auth user IDs are `text`, not UUID** — all foreign keys referencing users use `text` type
- **Self-hosted Supabase has no SSL** — don't add `ssl: true` to any connection config
- **Existing migrations 001-004** are already applied — only run 005 and 006
- **The `layout_deduct_credit` function (user-scoped) should remain** for backward compatibility during rollout — the new `layout_deduct_credit_org` function handles org-scoped deduction
- **Studio at `/studio/[id]`** stays exactly as-is — it's a full-screen workspace, no sidebar, no org nesting
- **Don't modify the marketing pages** (/, /pricing, /docs, etc.) — they remain public and unchanged
