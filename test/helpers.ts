import { NextRequest } from 'next/server'
import type { ExtractionResult, ExtractedTokens, ExtractedToken, Project } from '@/lib/types'

// --- Mock IDs ---
export const MOCK_USER_ID = 'user-test-001'
export const MOCK_ORG_ID = 'org-test-001'
export const MOCK_PROJECT_ID = 'proj-test-001'

// --- Request helpers ---
export function createMockRequest(
  method: string,
  body?: Record<string, unknown>,
  headers?: Record<string, string>,
  url = 'http://localhost:3000/api/test'
): NextRequest {
  const init = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body && method !== 'GET' ? JSON.stringify(body) : undefined,
  }
  return new NextRequest(url, init)
}

// --- Session helpers ---
export function createMockSession(overrides?: Record<string, unknown>) {
  return {
    session: {
      id: 'session-test-001',
      userId: MOCK_USER_ID,
      token: 'test-token',
      expiresAt: new Date(Date.now() + 86400000),
      ...overrides,
    },
    user: {
      id: MOCK_USER_ID,
      name: 'Test User',
      email: 'test@layout.design',
      emailVerified: true,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    },
  }
}

// --- Token helpers ---
export function createMockToken(overrides?: Partial<ExtractedToken>): ExtractedToken {
  return {
    name: 'primary',
    value: '#6750A4',
    type: 'color',
    category: 'semantic',
    cssVariable: '--color-primary',
    ...overrides,
  }
}

export function createMockTokens(overrides?: Partial<ExtractedTokens>): ExtractedTokens {
  return {
    colors: [
      createMockToken({ name: 'primary', value: '#6750A4', cssVariable: '--color-primary' }),
      createMockToken({ name: 'surface', value: '#FFFBFE', cssVariable: '--color-surface' }),
    ],
    typography: [
      createMockToken({ name: 'body-size', value: '16px', type: 'typography', cssVariable: '--font-body-size' }),
    ],
    spacing: [
      createMockToken({ name: 'space-4', value: '16px', type: 'spacing', cssVariable: '--space-4' }),
    ],
    radius: [
      createMockToken({ name: 'radius-md', value: '12px', type: 'radius', cssVariable: '--radius-md' }),
    ],
    effects: [],
    motion: [],
    ...overrides,
  }
}

// --- Extraction helpers ---
export function createMockExtractionResult(overrides?: Partial<ExtractionResult>): ExtractionResult {
  return {
    sourceType: 'figma',
    sourceName: 'Test Design File',
    sourceUrl: 'https://figma.com/design/abc123/Test-File',
    tokens: createMockTokens(),
    components: [],
    screenshots: [],
    fonts: [],
    animations: [],
    librariesDetected: {},
    cssVariables: { '--color-primary': '#6750A4' },
    computedStyles: {},
    ...overrides,
  }
}

// --- Project helpers ---
export function createMockProject(overrides?: Partial<Project>): Project {
  return {
    id: MOCK_PROJECT_ID,
    orgId: MOCK_ORG_ID,
    name: 'Test Project',
    sourceType: 'figma',
    sourceUrl: 'https://figma.com/design/abc123/Test-File',
    layoutMd: '# Test Design System\n\n```css\n:root {\n  --color-primary: #6750A4;\n}\n```',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

// --- SSE helpers ---
export async function collectSSEEvents(response: Response): Promise<Array<Record<string, unknown>>> {
  const events: Array<Record<string, unknown>> = []
  const reader = response.body?.getReader()
  if (!reader) return events

  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          events.push(JSON.parse(line.slice(6)))
        } catch {
          // Non-JSON data lines are fine, skip
        }
      }
    }
  }

  return events
}
