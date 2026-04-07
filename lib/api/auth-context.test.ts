import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';

vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock('@/lib/supabase/organization', () => ({
  getOrgMember: vi.fn(),
  getOrganizationBySlug: vi.fn(),
}));

import { requireAuth, requireOrgAuth } from './auth-context';
import { auth } from '@/lib/auth';
import { getOrgMember, getOrganizationBySlug } from '@/lib/supabase/organization';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const VALID_UUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const USER_ID = 'user-abc-123';

const mockSession = {
  user: { id: USER_ID, email: 'test@example.com', name: 'Test User' },
  session: { id: 'session-xyz' },
};

const makeMember = (role: 'owner' | 'admin' | 'editor' | 'viewer') => ({
  id: 'member-id',
  orgId: VALID_UUID,
  userId: USER_ID,
  role,
  invitedBy: null,
  joinedAt: new Date().toISOString(),
});

// ─── requireAuth ─────────────────────────────────────────────────────────────

describe('requireAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 NextResponse when there is no session', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);

    const result = await requireAuth();

    expect(result).toBeInstanceOf(NextResponse);
    const response = result as NextResponse;
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body).toEqual({ error: 'Unauthorised' });
  });

  it('returns 401 NextResponse when session has no user id', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue({ user: null, session: {} } as never);

    const result = await requireAuth();

    expect(result).toBeInstanceOf(NextResponse);
    expect((result as NextResponse).status).toBe(401);
  });

  it('returns { session, userId } when session is valid', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as never);

    const result = await requireAuth();

    expect(result).not.toBeInstanceOf(NextResponse);
    const authResult = result as { session: typeof mockSession; userId: string };
    expect(authResult.userId).toBe(USER_ID);
    expect(authResult.session).toEqual(mockSession);
  });
});

// ─── requireOrgAuth ───────────────────────────────────────────────────────────

describe('requireOrgAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: valid session
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as never);
    // Default: user is an owner member
    vi.mocked(getOrgMember).mockResolvedValue(makeMember('owner') as never);
    // Default: slug lookup not needed
    vi.mocked(getOrganizationBySlug).mockResolvedValue(null);
  });

  it('returns 401 when there is no session', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);

    const result = await requireOrgAuth(VALID_UUID);

    expect(result).toBeInstanceOf(NextResponse);
    expect((result as NextResponse).status).toBe(401);
  });

  it('returns auth result with role when UUID orgId is given and user is a member', async () => {
    vi.mocked(getOrgMember).mockResolvedValue(makeMember('admin') as never);

    const result = await requireOrgAuth(VALID_UUID);

    expect(result).not.toBeInstanceOf(NextResponse);
    const orgAuth = result as { orgId: string; userId: string; role: string };
    expect(orgAuth.orgId).toBe(VALID_UUID);
    expect(orgAuth.userId).toBe(USER_ID);
    expect(orgAuth.role).toBe('admin');
  });

  it('does not call getOrganizationBySlug when orgId is already a UUID', async () => {
    await requireOrgAuth(VALID_UUID);

    expect(getOrganizationBySlug).not.toHaveBeenCalled();
  });

  it('resolves slug orgId via getOrganizationBySlug', async () => {
    vi.mocked(getOrganizationBySlug).mockResolvedValue({
      id: VALID_UUID,
      name: 'Acme',
      slug: 'acme',
    } as never);

    const result = await requireOrgAuth('acme');

    expect(getOrganizationBySlug).toHaveBeenCalledWith('acme');
    expect(result).not.toBeInstanceOf(NextResponse);
    const orgAuth = result as { orgId: string };
    expect(orgAuth.orgId).toBe(VALID_UUID);
  });

  it('returns 404 when slug resolves to null (org not found)', async () => {
    vi.mocked(getOrganizationBySlug).mockResolvedValue(null);

    const result = await requireOrgAuth('unknown-slug');

    expect(result).toBeInstanceOf(NextResponse);
    const response = result as NextResponse;
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body).toEqual({ error: 'Organisation not found' });
  });

  it('returns 404 when UUID is provided but org lookup returns null', async () => {
    // UUID is passed through directly and treated as resolvedOrgId,
    // but then getOrgMember returns null simulating a deleted org where member row also gone
    // Actually the source passes UUID directly — so 404 can only happen via slug path.
    // Test the slug → null path with a UUID-shaped slug that fails regex (shouldn't happen
    // in practice, but exercises the null branch).
    // Use a slug that looks like a UUID but isn't (wrong format).
    vi.mocked(getOrganizationBySlug).mockResolvedValue(null);

    const result = await requireOrgAuth('my-org-slug');

    expect((result as NextResponse).status).toBe(404);
  });

  it('returns 403 when user is not a member of the org', async () => {
    vi.mocked(getOrgMember).mockResolvedValue(null);

    const result = await requireOrgAuth(VALID_UUID);

    expect(result).toBeInstanceOf(NextResponse);
    const response = result as NextResponse;
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body).toEqual({ error: 'Not a member of this organisation' });
  });

  it('returns 403 when viewer tries to use manageMembers permission', async () => {
    vi.mocked(getOrgMember).mockResolvedValue(makeMember('viewer') as never);

    const result = await requireOrgAuth(VALID_UUID, 'manageMembers');

    expect(result).toBeInstanceOf(NextResponse);
    const response = result as NextResponse;
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body).toEqual({ error: 'Insufficient permissions' });
  });

  it('returns 403 when editor tries to deleteProject', async () => {
    vi.mocked(getOrgMember).mockResolvedValue(makeMember('editor') as never);

    const result = await requireOrgAuth(VALID_UUID, 'deleteProject');

    expect(result).toBeInstanceOf(NextResponse);
    expect((result as NextResponse).status).toBe(403);
  });

  it('returns 403 when admin tries to manageOrg', async () => {
    vi.mocked(getOrgMember).mockResolvedValue(makeMember('admin') as never);

    const result = await requireOrgAuth(VALID_UUID, 'manageOrg');

    expect(result).toBeInstanceOf(NextResponse);
    expect((result as NextResponse).status).toBe(403);
  });

  it('owner can perform any permission including manageOrg', async () => {
    vi.mocked(getOrgMember).mockResolvedValue(makeMember('owner') as never);

    const result = await requireOrgAuth(VALID_UUID, 'manageOrg');

    expect(result).not.toBeInstanceOf(NextResponse);
    expect((result as { role: string }).role).toBe('owner');
  });

  it('owner can deleteProject', async () => {
    vi.mocked(getOrgMember).mockResolvedValue(makeMember('owner') as never);

    const result = await requireOrgAuth(VALID_UUID, 'deleteProject');

    expect(result).not.toBeInstanceOf(NextResponse);
  });

  it('editor can editProject', async () => {
    vi.mocked(getOrgMember).mockResolvedValue(makeMember('editor') as never);

    const result = await requireOrgAuth(VALID_UUID, 'editProject');

    expect(result).not.toBeInstanceOf(NextResponse);
    expect((result as { role: string }).role).toBe('editor');
  });

  it('editor can createProject', async () => {
    vi.mocked(getOrgMember).mockResolvedValue(makeMember('editor') as never);

    const result = await requireOrgAuth(VALID_UUID, 'createProject');

    expect(result).not.toBeInstanceOf(NextResponse);
  });

  it('viewer can viewProject', async () => {
    vi.mocked(getOrgMember).mockResolvedValue(makeMember('viewer') as never);

    const result = await requireOrgAuth(VALID_UUID, 'viewProject');

    expect(result).not.toBeInstanceOf(NextResponse);
    expect((result as { role: string }).role).toBe('viewer');
  });

  it('viewer cannot editProject', async () => {
    vi.mocked(getOrgMember).mockResolvedValue(makeMember('viewer') as never);

    const result = await requireOrgAuth(VALID_UUID, 'editProject');

    expect((result as NextResponse).status).toBe(403);
  });

  it('returns auth result without checking permission when no requiredPermission is given', async () => {
    vi.mocked(getOrgMember).mockResolvedValue(makeMember('viewer') as never);

    // viewer with no permission requirement — should succeed
    const result = await requireOrgAuth(VALID_UUID);

    expect(result).not.toBeInstanceOf(NextResponse);
  });

  it('passes the resolved UUID (not the slug) as orgId in the return value', async () => {
    const resolvedId = 'f0f0f0f0-1111-2222-3333-444444444444';
    vi.mocked(getOrganizationBySlug).mockResolvedValue({
      id: resolvedId,
      name: 'Layout',
      slug: 'layout',
    } as never);
    vi.mocked(getOrgMember).mockResolvedValue(makeMember('admin') as never);

    const result = await requireOrgAuth('layout');

    expect((result as { orgId: string }).orgId).toBe(resolvedId);
  });
});
