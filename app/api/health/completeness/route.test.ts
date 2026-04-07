import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextResponse } from 'next/server'

vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}))

vi.mock('@/lib/api/mcp-auth', () => ({
  requireMcpAuth: vi.fn(),
}))

// analyseCompleteness is NOT mocked — it is a pure function and is exercised directly

import { POST, OPTIONS } from '@/app/api/health/completeness/route'
import { auth } from '@/lib/auth'
import { requireMcpAuth } from '@/lib/api/mcp-auth'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(body?: unknown, headers?: Record<string, string>): Request {
  return new Request('http://localhost:3000/api/health/completeness', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
}

const MOCK_SESSION = { user: { id: 'user-1', email: 'test@layout.design' } }

const MOCK_AUTH_RESULT = {
  orgId: 'org-1',
  keyId: 'key-1',
  userId: 'user-1',
  scopes: ['read'] as const,
}

/** A minimal but non-empty layout.md fixture used across success-path tests. */
const MINIMAL_LAYOUT_MD = `# My Design System\n\nA sample layout.md for testing purposes.`

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('OPTIONS /api/health/completeness', () => {
  it('returns 204 with CORS headers', async () => {
    const response = await OPTIONS()

    expect(response.status).toBe(204)
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
    expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST')
    expect(response.headers.get('Access-Control-Allow-Methods')).toContain('OPTIONS')
    expect(response.headers.get('Access-Control-Allow-Headers')).toContain('Authorization')
    expect(response.headers.get('Access-Control-Allow-Headers')).toContain('Content-Type')
  })
})

describe('POST /api/health/completeness — authentication', () => {
  beforeEach(() => {
    vi.mocked(auth.api.getSession).mockReset()
    vi.mocked(requireMcpAuth).mockReset()
  })

  it('processes the request when a valid session exists', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(MOCK_SESSION as never)

    const request = makeRequest({ layoutMd: MINIMAL_LAYOUT_MD })
    const response = await POST(request)

    expect(response.status).toBe(200)
    // requireMcpAuth must NOT be called when a session is already present
    expect(requireMcpAuth).not.toHaveBeenCalled()
  })

  it('processes the request when there is no session but a valid API key is supplied', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null)
    vi.mocked(requireMcpAuth).mockResolvedValue(MOCK_AUTH_RESULT as never)

    const request = makeRequest(
      { layoutMd: MINIMAL_LAYOUT_MD },
      { Authorization: 'Bearer lyt_valid_key' },
    )
    const response = await POST(request)

    expect(response.status).toBe(200)
    expect(requireMcpAuth).toHaveBeenCalledOnce()
  })

  it('returns 401 with CORS headers when there is no session and the API key is invalid', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null)
    vi.mocked(requireMcpAuth).mockResolvedValue(
      NextResponse.json({ error: 'Invalid or revoked API key' }, { status: 401 }),
    )

    const request = makeRequest(
      { layoutMd: MINIMAL_LAYOUT_MD },
      { Authorization: 'Bearer lyt_bad_key' },
    )
    const response = await POST(request)

    expect(response.status).toBe(401)
    // CORS headers must be present even on auth failures
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')

    const body = await response.json()
    expect(body).toHaveProperty('error')
  })
})

describe('POST /api/health/completeness — request validation', () => {
  beforeEach(() => {
    // All validation tests run as an authenticated session
    vi.mocked(auth.api.getSession).mockResolvedValue(MOCK_SESSION as never)
    vi.mocked(requireMcpAuth).mockReset()
  })

  it('returns 400 when the request body is empty', async () => {
    const request = new Request('http://localhost:3000/api/health/completeness', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // no body — request.json() will throw
    })
    const response = await POST(request)

    expect(response.status).toBe(400)
  })

  it('returns 400 when the layoutMd field is missing from the body', async () => {
    const request = makeRequest({ unrelated: 'field' })
    const response = await POST(request)

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toBe('Validation failed')
    expect(body.details).toBeDefined()
  })

  it('returns 400 when layoutMd is an empty string (fails min(1))', async () => {
    const request = makeRequest({ layoutMd: '' })
    const response = await POST(request)

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toBe('Validation failed')
  })

  it('returns 400 for invalid JSON', async () => {
    const request = new Request('http://localhost:3000/api/health/completeness', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not valid json {{',
    })
    const response = await POST(request)

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toBe('Invalid JSON')
  })
})

describe('POST /api/health/completeness — success', () => {
  beforeEach(() => {
    vi.mocked(auth.api.getSession).mockResolvedValue(MOCK_SESSION as never)
    vi.mocked(requireMcpAuth).mockReset()
  })

  it('returns a completeness report for valid layoutMd', async () => {
    const request = makeRequest({ layoutMd: MINIMAL_LAYOUT_MD })
    const response = await POST(request)

    expect(response.status).toBe(200)

    const report = await response.json()
    expect(report).toHaveProperty('totalScore')
    expect(report).toHaveProperty('sections')
    expect(report).toHaveProperty('suggestions')
  })

  it('includes CORS headers on successful responses', async () => {
    const request = makeRequest({ layoutMd: MINIMAL_LAYOUT_MD })
    const response = await POST(request)

    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
    expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST')
  })

  it('returns totalScore as a number between 0 and 100', async () => {
    const request = makeRequest({ layoutMd: MINIMAL_LAYOUT_MD })
    const response = await POST(request)

    const { totalScore } = await response.json()
    expect(typeof totalScore).toBe('number')
    expect(totalScore).toBeGreaterThanOrEqual(0)
    expect(totalScore).toBeLessThanOrEqual(100)
  })

  it('returns sections as a non-empty array', async () => {
    const request = makeRequest({ layoutMd: MINIMAL_LAYOUT_MD })
    const response = await POST(request)

    const { sections } = await response.json()
    expect(Array.isArray(sections)).toBe(true)
    expect(sections.length).toBeGreaterThan(0)
  })

  it('returns suggestions as an array', async () => {
    const request = makeRequest({ layoutMd: MINIMAL_LAYOUT_MD })
    const response = await POST(request)

    const { suggestions } = await response.json()
    expect(Array.isArray(suggestions)).toBe(true)
  })

  it('scores higher for a richer layout.md that covers multiple sections', async () => {
    const richLayoutMd = `
# 0) Quick Reference

- NEVER use hardcoded hex colours — always use CSS custom properties
- NEVER use spacing values outside the 4px grid
- NEVER mix filled and tonal button variants in the same action group

\`\`\`css
:root {
  --color-primary: #0a4b19;
  --color-on-primary: #FFFFFF;
  --color-surface: #FFFBFE;
  --space-4: 16px;
  --space-8: 32px;
}
\`\`\`

\`\`\`tsx
const FilledButton = ({ label }: { label: string }) => (
  <button style={{ background: 'var(--color-primary)', color: 'var(--color-on-primary)' }}>
    {label}
  </button>
)
\`\`\`

## 1) Colours

- --color-primary: #0a4b19; /* Primary CTA backgrounds */
- --color-surface: #FFFBFE; /* App background */
- --color-error: #B3261E;

Supports dark and light mode variants.

## 2) Typography

font-family: Roboto, sans-serif;
font-size: 16px base
font-weight: 400 regular, 500 medium, 700 bold
line-height: 24px
letter-spacing: 0.5px

## 3) Spacing

4px grid base unit.
--space-4: 16px; --space-8: 32px; --space-12: 48px; --space-2: 8px;

Use padding for internal component spacing, gap for layout spacing.

## 4) Components

Button, Card, Input, Modal, Badge

variant: filled | tonal | outlined
size: sm | md | lg
States: default, hover, focus, active, disabled, loading, error

\`\`\`tsx
<Button variant="filled" size="md" style={{ background: 'var(--color-primary)' }}>
  Click me
</Button>
\`\`\`

## 5) Anti-patterns

1. NEVER hardcode hex values — use CSS variables because maintainability fails otherwise
2. DON'T mix spacing values not on the 4px grid — the result is visual inconsistency
3. AVOID overriding CSS custom properties inline — use the token system instead. Prefer the correct alternative: update the token value.

Because these patterns fail silently, they are difficult to detect in code review.
`
    const minimalRequest = makeRequest({ layoutMd: MINIMAL_LAYOUT_MD })
    const richRequest = makeRequest({ layoutMd: richLayoutMd })

    const [minimalResponse, richResponse] = await Promise.all([
      POST(minimalRequest),
      POST(richRequest),
    ])

    const { totalScore: minimalScore } = await minimalResponse.json()
    const { totalScore: richScore } = await richResponse.json()

    expect(richScore).toBeGreaterThan(minimalScore)
  })

  it('each section has the expected shape (section, score, found, missing)', async () => {
    const request = makeRequest({ layoutMd: MINIMAL_LAYOUT_MD })
    const response = await POST(request)

    const { sections } = await response.json()

    for (const section of sections) {
      expect(section).toHaveProperty('section')
      expect(typeof section.section).toBe('string')

      expect(section).toHaveProperty('score')
      expect(typeof section.score).toBe('number')
      expect(section.score).toBeGreaterThanOrEqual(0)
      expect(section.score).toBeLessThanOrEqual(100)

      expect(section).toHaveProperty('found')
      expect(Array.isArray(section.found)).toBe(true)

      expect(section).toHaveProperty('missing')
      expect(Array.isArray(section.missing)).toBe(true)
    }
  })
})
