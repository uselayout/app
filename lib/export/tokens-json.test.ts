import { describe, it, expect } from 'vitest'
import { generateTokensJson } from '@/lib/export/tokens-json'
import { createMockTokens, createMockToken } from '@/test/helpers'
import type { ExtractedTokens } from '@/lib/types'

// ─── Valid JSON output ────────────────────────────────────────────────────────

describe('generateTokensJson — valid JSON', () => {
  it('returns a valid JSON string', () => {
    const json = generateTokensJson(createMockTokens())
    expect(() => JSON.parse(json)).not.toThrow()
  })

  it('is pretty-printed (2-space indentation)', () => {
    const json = generateTokensJson(createMockTokens())
    // Re-serialising at same indent should be identical
    expect(json).toBe(JSON.stringify(JSON.parse(json), null, 2))
  })
})

// ─── Color tokens ─────────────────────────────────────────────────────────────

describe('generateTokensJson — color tokens', () => {
  it('places colour tokens under a top-level "color" key', () => {
    const parsed = JSON.parse(generateTokensJson(createMockTokens()))
    expect(parsed).toHaveProperty('color')
  })

  it('assigns $type: "color" to colour tokens', () => {
    const parsed = JSON.parse(generateTokensJson(createMockTokens()))
    for (const entry of Object.values(parsed.color as Record<string, { $type: string }>)) {
      expect(entry.$type).toBe('color')
    }
  })

  it('preserves the colour value in $value', () => {
    const parsed = JSON.parse(generateTokensJson(createMockTokens()))
    const values = Object.values(parsed.color as Record<string, { $value: string }>).map((t) => t.$value)
    expect(values).toContain('#6750A4')
    expect(values).toContain('#FFFBFE')
  })
})

// ─── Spacing tokens ───────────────────────────────────────────────────────────

describe('generateTokensJson — spacing tokens', () => {
  it('places spacing tokens under a top-level "spacing" key', () => {
    const parsed = JSON.parse(generateTokensJson(createMockTokens()))
    expect(parsed).toHaveProperty('spacing')
  })

  it('assigns $type: "dimension" to spacing tokens', () => {
    const parsed = JSON.parse(generateTokensJson(createMockTokens()))
    for (const entry of Object.values(parsed.spacing as Record<string, { $type: string }>)) {
      expect(entry.$type).toBe('dimension')
    }
  })

  it('preserves the spacing value in $value', () => {
    const parsed = JSON.parse(generateTokensJson(createMockTokens()))
    const values = Object.values(parsed.spacing as Record<string, { $value: string }>).map((t) => t.$value)
    expect(values).toContain('16px')
  })
})

// ─── Radius tokens ────────────────────────────────────────────────────────────

describe('generateTokensJson — radius tokens', () => {
  it('places radius tokens under a top-level "radius" key', () => {
    const parsed = JSON.parse(generateTokensJson(createMockTokens()))
    expect(parsed).toHaveProperty('radius')
  })

  it('assigns $type: "dimension" to radius tokens', () => {
    const parsed = JSON.parse(generateTokensJson(createMockTokens()))
    for (const entry of Object.values(parsed.radius as Record<string, { $type: string }>)) {
      expect(entry.$type).toBe('dimension')
    }
  })
})

// ─── Typography tokens ────────────────────────────────────────────────────────

describe('generateTokensJson — typography tokens', () => {
  it('places typography tokens under a top-level "typography" key', () => {
    const parsed = JSON.parse(generateTokensJson(createMockTokens()))
    expect(parsed).toHaveProperty('typography')
  })

  it('assigns $type: "typography" to font tokens', () => {
    const parsed = JSON.parse(generateTokensJson(createMockTokens()))
    for (const entry of Object.values(parsed.typography as Record<string, { $type: string }>)) {
      expect(entry.$type).toBe('typography')
    }
  })
})

// ─── Effects tokens ───────────────────────────────────────────────────────────

describe('generateTokensJson — effects tokens', () => {
  it('places effect tokens under a top-level "effect" key', () => {
    const tokens = createMockTokens({
      effects: [
        createMockToken({
          name: 'shadow-md',
          value: '0 4px 8px rgba(0,0,0,.2)',
          type: 'effect',
          cssVariable: '--shadow-md',
        }),
      ],
    })
    const parsed = JSON.parse(generateTokensJson(tokens))
    expect(parsed).toHaveProperty('effect')
  })

  it('assigns $type: "shadow" to effect tokens', () => {
    const tokens = createMockTokens({
      effects: [
        createMockToken({
          name: 'shadow-md',
          value: '0 4px 8px rgba(0,0,0,.2)',
          type: 'effect',
          cssVariable: '--shadow-md',
        }),
      ],
    })
    const parsed = JSON.parse(generateTokensJson(tokens))
    for (const entry of Object.values(parsed.effect as Record<string, { $type: string }>)) {
      expect(entry.$type).toBe('shadow')
    }
  })
})

// ─── Motion tokens ───────────────────────────────────────────────────────────

describe('generateTokensJson — motion tokens', () => {
  it('places motion tokens under a top-level "motion" key', () => {
    const tokens = createMockTokens({
      motion: [createMockToken({ name: 'duration-base', value: '150ms', type: 'motion', cssVariable: '--duration-base' })],
    })
    const parsed = JSON.parse(generateTokensJson(tokens))
    expect(parsed).toHaveProperty('motion')
  })

  it('assigns $type: "duration" to ms-value motion tokens', () => {
    const tokens = createMockTokens({
      motion: [createMockToken({ name: 'duration-base', value: '150ms', type: 'motion', cssVariable: '--duration-base' })],
    })
    const parsed = JSON.parse(generateTokensJson(tokens))
    const entries = Object.values(parsed.motion as Record<string, { $type: string }>)
    expect(entries[0]!.$type).toBe('duration')
  })

  it('assigns $type: "cubicBezier" to easing motion tokens', () => {
    const tokens = createMockTokens({
      motion: [
        createMockToken({
          name: 'ease-out',
          value: 'cubic-bezier(0, 0, 0.2, 1)',
          type: 'motion',
          cssVariable: '--ease-out',
        }),
      ],
    })
    const parsed = JSON.parse(generateTokensJson(tokens))
    const entries = Object.values(parsed.motion as Record<string, { $type: string }>)
    expect(entries[0]!.$type).toBe('cubicBezier')
  })
})

// ─── Empty categories skipped ────────────────────────────────────────────────

describe('generateTokensJson — empty categories skipped', () => {
  it('omits "effect" key when effects array is empty', () => {
    const tokens = createMockTokens({ effects: [] })
    const parsed = JSON.parse(generateTokensJson(tokens))
    expect(parsed).not.toHaveProperty('effect')
  })

  it('omits "motion" key when motion array is empty', () => {
    const tokens = createMockTokens({ motion: [] })
    const parsed = JSON.parse(generateTokensJson(tokens))
    expect(parsed).not.toHaveProperty('motion')
  })

  it('returns "{}" for completely empty token set', () => {
    const empty: ExtractedTokens = {
      colors: [],
      typography: [],
      spacing: [],
      radius: [],
      effects: [],
      motion: [],
    }
    const parsed = JSON.parse(generateTokensJson(empty))
    expect(Object.keys(parsed)).toHaveLength(0)
  })
})

// ─── Grouped structure ────────────────────────────────────────────────────────

describe('generateTokensJson — grouped structure', () => {
  it('output has a grouped object structure (not a flat list)', () => {
    const parsed = JSON.parse(generateTokensJson(createMockTokens()))
    // Top-level keys should be category names, not token names
    for (const key of Object.keys(parsed)) {
      expect(['color', 'typography', 'spacing', 'radius', 'effect', 'motion']).toContain(key)
    }
  })

  it('each category group contains token entries as nested objects', () => {
    const parsed = JSON.parse(generateTokensJson(createMockTokens()))
    // Each entry under "color" should be an object with $type and $value
    for (const entry of Object.values(parsed.color as Record<string, unknown>)) {
      expect(typeof entry).toBe('object')
      expect(entry).toHaveProperty('$type')
      expect(entry).toHaveProperty('$value')
    }
  })
})
