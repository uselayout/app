import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';

// ─── Mocks ────────────────────────────────────────────────────────────────────

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

// Import after mocks are registered
import { requireAuth, requireOrgAuth } from './auth-context';
import { auth } from '@/lib/auth';
import { getOrgMember, getOrganizationBySlug } from '@/lib/supabase/organization';

const mockGetSession = vi.mocked(auth.api.getSession);
const mockGetOrgMember = vi.mocked(getOrgMember);
const mockGetOrganizationBySlug = vi.mocked(getOrganizationBySlug);

const VALID_UUID = '00000000-0000-0000-0000-000000000001';
const ORG_UUID = '00000000-0000-0000-0000-000000000002';

function mockSession(userId = 'user-123') {
  mockGetSession.mockResolvedValue({
    user: { id: userId, email: 'test@example.com', name: 'Test User', emailVerified: true, createdAt: new Date(), updatedAt: new Date() },
    session: { id: 'sess-1', userId, expiresAt: new Date(), createdAt: new Date(), updatedAt: new Date(), token: 'tok' },
  } as never);
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── requireAuth ─────────────────────────────────────────────────────────────

describe('requireAuth', () => {
  it('returns session and userId when session is valid', async () => {
    mockSession();
    const result = await requireAuth();
    expect(result).not.toBeInstanceOf(NextResponse);
    if (!(result instanceof NextResponse)) {
      expect(result.userId).toBe('user-123');
      expect(result.session).toBeDefined();
    }
  });

  it('returns 401 NextResponse when session is null', async () => {
    mockGetSession.mockResolvedValue(null);
    const result = await requireAuth();
    expect(result).toBeInstanceOf(NextResponse);
    if (result instanceof NextResponse) {
      expect(result.status).toBe(401);
      const body = await result.json();
      expect(body.error).toMatch(/unauthorised/i);
    }
  });

  it('returns 401 when session exists but user id is missing', async () => {
    mockGetSession.mockResolvedValue({ user: null, session: null } as never);
    const result = await requireAuth();
    expect(result).toBeInstanceOf(NextResponse);
    if (result instanceof NextResponse) {
      expect(result.status).toBe(401);
    }
  });
});

// ─── requireOrgAuth ───────────────────────────────────────────────────────────

describe('requireOrgAuth', () => {
  it('returns orgId, role and session when member exists with UUID orgId', async () => {
    mockSession('user-abc');
    mockGetOrgMember.mockResolvedValue({ id: 'm1', orgId: ORG_UUID, userId: 'user-abc', role: 'owner', invitedBy: null, joinedAt: '' });

    const result = await requireOrgAuth(ORG_UUID);
    expect(result).not.toBeInstanceOf(NextResponse);
    if (!(result instanceof NextResponse)) {
      expect(result.orgId).toBe(ORG_UUID);
      expect(result.role).toBe('owner');
    }
  });

  it('resolves slug orgId via getOrganizationBySlug', async () => {
    mockSession();
    mockGetOrganizationBySlug.mockResolvedValue({
      id: ORG_UUID,
      name: 'Acme',
      slug: 'acme',
      logoUrl: null,
      ownerId: 'user-123',
      createdAt: '',
      updatedAt: '',
    });
    mockGetOrgMember.mockResolvedValue({ id: 'm2', orgId: ORG_UUID, userId: 'user-123', role: 'admin', invitedBy: null, joinedAt: '' });

    const result = await requireOrgAuth('acme');
    expect(result).not.toBeInstanceOf(NextResponse);
    if (!(result instanceof NextResponse)) {
      expect(result.orgId).toBe(ORG_UUID);
    }
  });

  it('returns 404 when slug resolves to nothing', async () => {
    mockSession();
    mockGetOrganizationBySlug.mockResolvedValue(null);

    const result = await requireOrgAuth('unknown-slug');
    expect(result).toBeInstanceOf(NextResponse);
    if (result instanceof NextResponse) {
      expect(result.status).toBe(404);
      const body = await result.json();
      expect(body.error).toMatch(/not found/i);
    }
  });

  it('returns 403 when user is not a member of the org', async () => {
    mockSession();
    mockGetOrgMember.mockResolvedValue(null);

    const result = await requireOrgAuth(ORG_UUID);
    expect(result).toBeInstanceOf(NextResponse);
    if (result instanceof NextResponse) {
      expect(result.status).toBe(403);
      const body = await result.json();
      expect(body.error).toMatch(/member/i);
    }
  });

  it('returns 403 when member lacks the required permission', async () => {
    mockSession();
    mockGetOrgMember.mockResolvedValue({ id: 'm3', orgId: ORG_UUID, userId: 'user-123', role: 'viewer', invitedBy: null, joinedAt: '' });

    const result = await requireOrgAuth(ORG_UUID, 'deleteProject');
    expect(result).toBeInstanceOf(NextResponse);
    if (result instanceof NextResponse) {
      expect(result.status).toBe(403);
      const body = await result.json();
      expect(body.error).toMatch(/permission/i);
    }
  });

  it('succeeds when member has the required permission', async () => {
    mockSession();
    mockGetOrgMember.mockResolvedValue({ id: 'm4', orgId: ORG_UUID, userId: 'user-123', role: 'editor', invitedBy: null, joinedAt: '' });

    const result = await requireOrgAuth(ORG_UUID, 'editProject');
    expect(result).not.toBeInstanceOf(NextResponse);
    if (!(result instanceof NextResponse)) {
      expect(result.role).toBe('editor');
    }
  });

  it('returns 401 when unauthenticated (propagates from requireAuth)', async () => {
    mockGetSession.mockResolvedValue(null);
    const result = await requireOrgAuth(ORG_UUID);
    expect(result).toBeInstanceOf(NextResponse);
    if (result instanceof NextResponse) {
      expect(result.status).toBe(401);
    }
  });

  it('does not call getOrgMember when auth fails', async () => {
    mockGetSession.mockResolvedValue(null);
    await requireOrgAuth(ORG_UUID);
    expect(mockGetOrgMember).not.toHaveBeenCalled();
  });
});
