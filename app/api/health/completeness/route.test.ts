import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

vi.mock('@/lib/api/mcp-auth', () => ({
  requireMcpAuth: vi.fn(),
}));

// Do NOT mock analyseCompleteness — let it run for real

import { OPTIONS, POST } from './route';
import { auth } from '@/lib/auth';
import { requireMcpAuth } from '@/lib/api/mcp-auth';

const mockGetSession = vi.mocked(auth.api.getSession);
const mockRequireMcpAuth = vi.mocked(requireMcpAuth);

function makeRequest(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request('http://localhost/api/health/completeness', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

const MINIMAL_LAYOUT_MD = '# Colours\n--color-primary: #6750A4;\n--color-surface: #FFFBFE;\n--color-error: #B3261E;';

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── OPTIONS ─────────────────────────────────────────────────────────────────

describe('OPTIONS', () => {
  it('returns 204 status', async () => {
    const res = await OPTIONS();
    expect(res.status).toBe(204);
  });

  it('includes CORS headers', async () => {
    const res = await OPTIONS();
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
  });
});

// ─── POST ─────────────────────────────────────────────────────────────────────

describe('POST', () => {
  describe('authentication', () => {
    it('allows access with a valid session (no API key needed)', async () => {
      mockGetSession.mockResolvedValue({ user: { id: 'u1' }, session: {} } as never);
      const req = makeRequest({ layoutMd: MINIMAL_LAYOUT_MD });
      const res = await POST(req);
      expect(res.status).toBe(200);
    });

    it('falls through to MCP auth when session is null', async () => {
      mockGetSession.mockResolvedValue(null);
      mockRequireMcpAuth.mockResolvedValue({ orgId: 'org-1', keyId: 'key-1', userId: 'u1', scopes: ['read'] });
      const req = makeRequest({ layoutMd: MINIMAL_LAYOUT_MD });
      const res = await POST(req);
      expect(res.status).toBe(200);
      expect(mockRequireMcpAuth).toHaveBeenCalledWith(req, 'read');
    });

    it('returns 401 when both session and API key auth fail', async () => {
      mockGetSession.mockResolvedValue(null);
      const { NextResponse } = await import('next/server');
      mockRequireMcpAuth.mockResolvedValue(NextResponse.json({ error: 'Invalid or revoked API key' }, { status: 401 }));
      const req = makeRequest({ layoutMd: MINIMAL_LAYOUT_MD });
      const res = await POST(req);
      expect(res.status).toBe(401);
    });
  });

  describe('request validation', () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue({ user: { id: 'u1' }, session: {} } as never);
    });

    it('returns 400 for invalid JSON body', async () => {
      const req = new Request('http://localhost/api/health/completeness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not-json{{',
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toMatch(/invalid json/i);
    });

    it('returns 400 when layoutMd is missing', async () => {
      const req = makeRequest({});
      const res = await POST(req);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toMatch(/validation/i);
    });

    it('returns 400 when layoutMd is an empty string', async () => {
      const req = makeRequest({ layoutMd: '' });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });
  });

  describe('analysis output', () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue({ user: { id: 'u1' }, session: {} } as never);
    });

    it('returns a report with totalScore', async () => {
      const req = makeRequest({ layoutMd: MINIMAL_LAYOUT_MD });
      const res = await POST(req);
      const body = await res.json();
      expect(typeof body.totalScore).toBe('number');
      expect(body.totalScore).toBeGreaterThanOrEqual(0);
      expect(body.totalScore).toBeLessThanOrEqual(100);
    });

    it('returns a report with sections array', async () => {
      const req = makeRequest({ layoutMd: MINIMAL_LAYOUT_MD });
      const res = await POST(req);
      const body = await res.json();
      expect(Array.isArray(body.sections)).toBe(true);
      expect(body.sections.length).toBeGreaterThan(0);
    });

    it('returns a suggestions array', async () => {
      const req = makeRequest({ layoutMd: MINIMAL_LAYOUT_MD });
      const res = await POST(req);
      const body = await res.json();
      expect(Array.isArray(body.suggestions)).toBe(true);
    });

    it('gives a higher score to a more complete layout.md', async () => {
      const richMd = `
# 0) Quick Reference

NEVER use hardcoded colours. Instead use CSS variables.

- Use var(--color-primary) for CTAs
- Use var(--color-surface) for backgrounds
- All spacing must follow the 4px grid

\`\`\`tsx
const Button = () => <button style={{ background: 'var(--color-primary)' }}>Click</button>;
\`\`\`

\`\`\`css
:root {
  --color-primary: #6750A4;
}
\`\`\`

## Colours

--color-primary: #6750A4; /* Primary CTA — used on filled buttons */
--color-surface: #FFFBFE; /* App background */
--color-error: #B3261E;   /* Error states */

dark mode theme variant light

## Typography

font-family: Roboto, sans-serif;
font-size: 16px; font-weight: 400; line-height: 24px; letter-spacing: 0.5px;

## Spacing

4px grid base unit
--space-4: 16px; --space-8: 32px; --space-12: 48px; gap padding margin between

## Components

Button card modal input
variant size prop attribute
default hover focus active disabled

\`\`\`tsx
<Button variant="filled" />
\`\`\`

var(--color-primary)

## Anti-patterns

1. NEVER hardcode hex values (#fff) because it breaks theming. Instead use CSS variables.
2. AVOID magic spacing numbers. Use tokens. Result: inconsistent layouts.
3. DON'T mix button variants in the same action group. Prefer do this with single variant.
`;
      const thinReq = makeRequest({ layoutMd: MINIMAL_LAYOUT_MD });
      const richReq = makeRequest({ layoutMd: richMd });
      const [thinRes, richRes] = await Promise.all([POST(thinReq), POST(richReq)]);
      const [thinBody, richBody] = await Promise.all([thinRes.json(), richRes.json()]);
      expect(richBody.totalScore).toBeGreaterThan(thinBody.totalScore);
    });

    it('includes CORS headers on success response', async () => {
      const req = makeRequest({ layoutMd: MINIMAL_LAYOUT_MD });
      const res = await POST(req);
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });

    it('includes CORS headers on auth error response', async () => {
      mockGetSession.mockResolvedValue(null);
      const { NextResponse } = await import('next/server');
      mockRequireMcpAuth.mockResolvedValue(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
      const req = makeRequest({ layoutMd: MINIMAL_LAYOUT_MD });
      const res = await POST(req);
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });
  });
});
