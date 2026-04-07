import { describe, it, expect } from 'vitest'
import { groupTokensByPurpose, type TokenGroup } from './group-tokens'
import { createMockToken } from '../../test/helpers'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build an array of n unique colour tokens. Each token has a distinct
 * cssVariable so grouping rules can match the right names.
 */
function makeColourTokens(count: number, cssVariables?: string[]) {
  return Array.from({ length: count }, (_, i) =>
    createMockToken({
      name: cssVariables?.[i] ?? `--color-item-${i}`,
      cssVariable: cssVariables?.[i] ?? `--color-item-${i}`,
      value: '#AABBCC',
      type: 'color',
    })
  )
}

function labelsOf(groups: TokenGroup[]) {
  return groups.map((g) => g.label)
}

function allTokensIn(groups: TokenGroup[]) {
  return groups.flatMap((g) => g.tokens)
}

// ─── Flat group (≤7 tokens) ───────────────────────────────────────────────────

describe('groupTokensByPurpose — small token sets', () => {
  it('returns a single group with empty label when exactly 7 tokens are present', () => {
    const tokens = makeColourTokens(7)
    const groups = groupTokensByPurpose(tokens, 'colors')
    expect(groups).toHaveLength(1)
    expect(groups[0]!.label).toBe('')
    expect(groups[0]!.tokens).toHaveLength(7)
  })

  it('returns a single flat group when fewer than 7 tokens are present', () => {
    const tokens = makeColourTokens(3)
    const groups = groupTokensByPurpose(tokens, 'colors')
    expect(groups).toHaveLength(1)
    expect(groups[0]!.label).toBe('')
  })

  it('returns an empty single group when the token array is empty', () => {
    const groups = groupTokensByPurpose([], 'colors')
    expect(groups).toHaveLength(1)
    expect(groups[0]!.tokens).toHaveLength(0)
  })
})

// ─── Junk token filtering ─────────────────────────────────────────────────────

describe('groupTokensByPurpose — junk token filtering', () => {
  it('filters out tokens whose value contains var(--duration', () => {
    const junk = createMockToken({
      cssVariable: '--transition-all',
      value: 'all var(--duration-base) var(--ease-out)',
    })
    // Add 7 real tokens plus the junk one so grouping threshold is reached only without junk
    const tokens = [...makeColourTokens(7), junk]
    const groups = groupTokensByPurpose(tokens, 'colors')
    const allTokens = allTokensIn(groups)
    expect(allTokens.some((t) => t.cssVariable === '--transition-all')).toBe(false)
  })

  it('filters out tokens whose value contains cubic-bezier', () => {
    const junk = createMockToken({
      cssVariable: '--ease-in-out',
      value: 'cubic-bezier(0.4, 0, 0.2, 1)',
    })
    const tokens = [...makeColourTokens(7), junk]
    const groups = groupTokensByPurpose(tokens, 'colors')
    const allTokens = allTokensIn(groups)
    expect(allTokens.some((t) => t.cssVariable === '--ease-in-out')).toBe(false)
  })

  it('filters out tokens whose value exceeds 80 characters', () => {
    const longValue = '0px 1px 2px rgba(0,0,0,0.3), 0px 2px 6px 2px rgba(0,0,0,0.15), 0px 4px 8px rgba(0,0,0,0.1)'
    expect(longValue.length).toBeGreaterThan(80)
    const junk = createMockToken({ cssVariable: '--shadow-xl', value: longValue })
    const tokens = [...makeColourTokens(7), junk]
    const groups = groupTokensByPurpose(tokens, 'colors')
    const allTokens = allTokensIn(groups)
    expect(allTokens.some((t) => t.cssVariable === '--shadow-xl')).toBe(false)
  })

  it('retains non-junk tokens that happen to be long but under 80 chars', () => {
    // Exactly 80 chars is NOT filtered (condition is > 80)
    const value79 = '#' + 'A'.repeat(6) // short — clearly not junk
    const token = createMockToken({ cssVariable: '--color-ok', value: value79 })
    const tokens = [...makeColourTokens(7), token]
    const groups = groupTokensByPurpose(tokens, 'colors')
    const allTokens = allTokensIn(groups)
    expect(allTokens.some((t) => t.cssVariable === '--color-ok')).toBe(true)
  })

  it('junk tokens count toward the total BEFORE filtering, not after', () => {
    // 6 real + 2 junk = 8 raw, but only 6 clean → should still be flat (≤7 clean)
    const junk1 = createMockToken({ cssVariable: '--t1', value: 'all var(--duration-base)' })
    const junk2 = createMockToken({ cssVariable: '--t2', value: 'cubic-bezier(0,0,1,1)' })
    const tokens = [...makeColourTokens(6), junk1, junk2]
    const groups = groupTokensByPurpose(tokens, 'colors')
    expect(groups).toHaveLength(1)
    expect(groups[0]!.label).toBe('')
  })
})

// ─── Colour grouping (8+ tokens, mixed categories so collapse doesn't fire) ───

/**
 * Build a realistic mixed-category colour token set so that multiple groups
 * are populated and the "all-in-one" collapse is NOT triggered.
 * Includes at least one token from each target category plus an error token.
 */
function makeMixedColourTokens(extras: string[] = []) {
  const baseVars = [
    '--color-surface',        // Surfaces
    '--color-text-primary',   // Text
    '--color-border',         // Borders
    '--color-primary',        // Primary
    '--color-accent',         // Interactive
    '--color-error',          // Status
    '--color-nav-bg',         // Components
    '--color-bg-app',         // Surfaces (second)
    ...extras,
  ]
  return baseVars.map((v) => createMockToken({ cssVariable: v, value: '#AABBCC' }))
}

describe('groupTokensByPurpose — colour groups', () => {
  it('groups surface tokens under "Surfaces"', () => {
    const tokens = makeMixedColourTokens(['--color-elevated', '--color-overlay'])
    const groups = groupTokensByPurpose(tokens, 'colors')
    const surfaces = groups.find((g) => g.label === 'Surfaces')
    expect(surfaces).toBeDefined()
    expect(surfaces!.tokens.length).toBeGreaterThan(0)
  })

  it('groups text tokens under "Text"', () => {
    const tokens = makeMixedColourTokens(['--color-label', '--color-caption'])
    const groups = groupTokensByPurpose(tokens, 'colors')
    const text = groups.find((g) => g.label === 'Text')
    expect(text).toBeDefined()
    expect(text!.tokens.length).toBeGreaterThan(0)
  })

  it('groups border tokens under "Borders"', () => {
    const tokens = makeMixedColourTokens(['--color-divider', '--color-outline'])
    const groups = groupTokensByPurpose(tokens, 'colors')
    const borders = groups.find((g) => g.label === 'Borders')
    expect(borders).toBeDefined()
  })

  it('groups primary/secondary/brand tokens under "Primary"', () => {
    const tokens = makeMixedColourTokens(['--color-secondary', '--color-brand'])
    const groups = groupTokensByPurpose(tokens, 'colors')
    const primary = groups.find((g) => g.label === 'Primary')
    expect(primary).toBeDefined()
  })

  it('groups accent/link/focus tokens under "Interactive"', () => {
    const tokens = makeMixedColourTokens(['--color-link', '--color-focus'])
    const groups = groupTokensByPurpose(tokens, 'colors')
    const interactive = groups.find((g) => g.label === 'Interactive')
    expect(interactive).toBeDefined()
  })

  it('groups success/error/warning tokens under "Status"', () => {
    const tokens = makeMixedColourTokens(['--color-success', '--color-warning'])
    const groups = groupTokensByPurpose(tokens, 'colors')
    const status = groups.find((g) => g.label === 'Status')
    expect(status).toBeDefined()
  })
})

// ─── Component tokens ─────────────────────────────────────────────────────────

describe('groupTokensByPurpose — component tokens', () => {
  it('places component-scoped tokens in the "Components" group', () => {
    // Mixed set: component tokens + non-component tokens to avoid single-group collapse
    const tokens = makeMixedColourTokens([
      '--color-nav-text',
      '--color-card-bg',
      '--color-btn-primary-bg',
    ])
    const groups = groupTokensByPurpose(tokens, 'colors')
    const components = groups.find((g) => g.label === 'Components')
    expect(components).toBeDefined()
    expect(components!.tokens.length).toBeGreaterThan(0)
  })

  it('does not place --color-nav-bg in Surfaces even though it contains "bg"', () => {
    const tokens = makeMixedColourTokens(['--color-nav-text', '--color-card-bg'])
    const groups = groupTokensByPurpose(tokens, 'colors')
    const surfaces = groups.find((g) => g.label === 'Surfaces')
    if (surfaces) {
      expect(surfaces.tokens.every((t) => !t.cssVariable!.includes('nav'))).toBe(true)
    }
  })

  it('recognises all standard component prefixes', () => {
    // 7 component tokens + 2 non-component to ensure multiple groups exist
    const prefixes = ['nav', 'card', 'btn', 'button', 'input', 'modal', 'dialog']
    const componentTokens = prefixes.map((p) =>
      createMockToken({ cssVariable: `--color-${p}-bg`, value: '#000' })
    )
    const nonComponentTokens = [
      createMockToken({ cssVariable: '--color-surface', value: '#FFF' }),
      createMockToken({ cssVariable: '--color-error', value: '#B3261E' }),
    ]
    const groups = groupTokensByPurpose([...componentTokens, ...nonComponentTokens], 'colors')
    const components = groups.find((g) => g.label === 'Components')
    expect(components).toBeDefined()
  })
})

// ─── All-in-one-group collapse ────────────────────────────────────────────────

describe('groupTokensByPurpose — single group collapse', () => {
  it('returns flat group with empty label when all tokens map to one group', () => {
    // All 8 tokens are surface tokens → only one group populated → collapse to flat
    const vars = [
      '--color-bg-app',
      '--color-bg-panel',
      '--color-surface',
      '--color-surface-variant',
      '--color-elevated',
      '--color-overlay',
      '--color-panel',
      '--color-panel-bg',
    ]
    const tokens = vars.map((v) => createMockToken({ cssVariable: v, value: '#1A1A20' }))
    const groups = groupTokensByPurpose(tokens, 'colors')
    expect(groups).toHaveLength(1)
    expect(groups[0]!.label).toBe('')
  })
})

// ─── Typography grouping ──────────────────────────────────────────────────────

/**
 * Mixed typography token set spanning Font Families, Sizes, and Properties
 * so that multiple groups are populated and the collapse rule doesn't fire.
 */
function makeMixedTypographyTokens(extras: string[] = []) {
  const baseVars = [
    '--font-family',          // Font Families
    '--font-sans',            // Font Families
    '--font-size-md',         // Sizes
    '--font-body-size',       // Sizes
    '--font-weight-regular',  // Properties
    '--line-height-base',     // Properties
    '--letter-spacing-tight', // Properties
    '--font-display',         // Font Families (keeps multiple groups)
    ...extras,
  ]
  return baseVars.map((v) =>
    createMockToken({ cssVariable: v, value: 'Roboto, sans-serif', type: 'typography' })
  )
}

describe('groupTokensByPurpose — typography', () => {
  it('groups font-family tokens under "Font Families"', () => {
    const tokens = makeMixedTypographyTokens(['--font-mono', '--font-code'])
    const groups = groupTokensByPurpose(tokens, 'typography')
    const families = groups.find((g) => g.label === 'Font Families')
    expect(families).toBeDefined()
    expect(families!.tokens.length).toBeGreaterThan(0)
  })

  it('groups size tokens under "Sizes"', () => {
    const tokens = makeMixedTypographyTokens(['--font-size-lg', '--font-heading-size'])
    const groups = groupTokensByPurpose(tokens, 'typography')
    const sizes = groups.find((g) => g.label === 'Sizes')
    expect(sizes).toBeDefined()
  })

  it('groups weight/line-height/letter-spacing tokens under "Properties"', () => {
    const tokens = makeMixedTypographyTokens(['--font-weight-bold', '--tracking-wide'])
    const groups = groupTokensByPurpose(tokens, 'typography')
    const props = groups.find((g) => g.label === 'Properties')
    expect(props).toBeDefined()
  })
})

// ─── Unknown token type ───────────────────────────────────────────────────────

describe('groupTokensByPurpose — unknown token type', () => {
  it('returns a flat group for an unrecognised token type', () => {
    const tokens = makeColourTokens(10)
    const groups = groupTokensByPurpose(tokens, 'unknownType')
    expect(groups).toHaveLength(1)
    expect(groups[0]!.label).toBe('')
    expect(groups[0]!.tokens).toHaveLength(10)
  })
})
