import { describe, it, expect } from 'vitest'
import { diffExtractions } from '@/lib/extraction/diff'
import {
  createMockExtractionResult,
  createMockToken,
} from '@/test/helpers'

describe('diffExtractions', () => {
  it('returns no changes and "No changes detected" summary for identical extractions', () => {
    const base = createMockExtractionResult()
    const diff = diffExtractions(base, base)

    expect(diff.tokens.added).toBe(0)
    expect(diff.tokens.removed).toBe(0)
    expect(diff.tokens.modified).toBe(0)
    expect(diff.tokens.changes).toHaveLength(0)
    expect(diff.components.added).toBe(0)
    expect(diff.components.removed).toBe(0)
    expect(diff.components.modified).toBe(0)
    expect(diff.fonts.added).toHaveLength(0)
    expect(diff.fonts.removed).toHaveLength(0)
    expect(diff.summary).toBe('No changes detected')
  })

  // ─── Token diffs ───────────────────────────────────────────────────────────

  it('detects an added colour token', () => {
    const previous = createMockExtractionResult()
    const current = createMockExtractionResult({
      tokens: {
        ...previous.tokens,
        colors: [
          ...previous.tokens.colors,
          createMockToken({ name: 'secondary', value: '#625B71', cssVariable: '--color-secondary' }),
        ],
      },
    })

    const diff = diffExtractions(previous, current)

    expect(diff.tokens.added).toBe(1)
    const added = diff.tokens.changes.find(c => c.change === 'added')
    expect(added).toMatchObject({ name: 'secondary', change: 'added', currentValue: '#625B71' })
  })

  it('detects a removed colour token', () => {
    const previous = createMockExtractionResult({
      tokens: {
        ...createMockExtractionResult().tokens,
        colors: [
          createMockToken({ name: 'primary', value: '#6750A4', cssVariable: '--color-primary' }),
          createMockToken({ name: 'error', value: '#B3261E', cssVariable: '--color-error' }),
        ],
      },
    })
    const current = createMockExtractionResult({
      tokens: {
        ...previous.tokens,
        colors: [
          createMockToken({ name: 'primary', value: '#6750A4', cssVariable: '--color-primary' }),
        ],
      },
    })

    const diff = diffExtractions(previous, current)

    expect(diff.tokens.removed).toBe(1)
    const removed = diff.tokens.changes.find(c => c.change === 'removed')
    expect(removed).toMatchObject({ name: 'error', change: 'removed', previousValue: '#B3261E' })
  })

  it('detects a modified token when its value changes', () => {
    const previous = createMockExtractionResult()
    const current = createMockExtractionResult({
      tokens: {
        ...previous.tokens,
        colors: [
          createMockToken({ name: 'primary', value: '#NEW000', cssVariable: '--color-primary' }),
          createMockToken({ name: 'surface', value: '#FFFBFE', cssVariable: '--color-surface' }),
        ],
      },
    })

    const diff = diffExtractions(previous, current)

    expect(diff.tokens.modified).toBe(1)
    const modified = diff.tokens.changes.find(c => c.change === 'modified')
    expect(modified).toMatchObject({
      name: 'primary',
      change: 'modified',
      previousValue: '#6750A4',
      currentValue: '#NEW000',
    })
  })

  it('includes the cssVariable on token changes', () => {
    const previous = createMockExtractionResult()
    const current = createMockExtractionResult({
      tokens: {
        ...previous.tokens,
        colors: [
          createMockToken({ name: 'primary', value: '#CHANGED', cssVariable: '--color-primary' }),
          createMockToken({ name: 'surface', value: '#FFFBFE', cssVariable: '--color-surface' }),
        ],
      },
    })

    const diff = diffExtractions(previous, current)
    const modified = diff.tokens.changes.find(c => c.change === 'modified')

    expect(modified?.cssVariable).toBe('--color-primary')
  })

  // ─── Component diffs ───────────────────────────────────────────────────────

  it('detects an added component', () => {
    const previous = createMockExtractionResult({ components: [] })
    const current = createMockExtractionResult({
      components: [{ name: 'Button', variantCount: 3 }],
    })

    const diff = diffExtractions(previous, current)

    expect(diff.components.added).toBe(1)
    expect(diff.components.changes[0]).toMatchObject({ name: 'Button', change: 'added' })
  })

  it('detects a removed component', () => {
    const previous = createMockExtractionResult({
      components: [{ name: 'Button', variantCount: 3 }],
    })
    const current = createMockExtractionResult({ components: [] })

    const diff = diffExtractions(previous, current)

    expect(diff.components.removed).toBe(1)
    expect(diff.components.changes[0]).toMatchObject({ name: 'Button', change: 'removed' })
  })

  it('detects a modified component when variantCount changes', () => {
    const previous = createMockExtractionResult({
      components: [{ name: 'Button', variantCount: 2 }],
    })
    const current = createMockExtractionResult({
      components: [{ name: 'Button', variantCount: 5 }],
    })

    const diff = diffExtractions(previous, current)

    expect(diff.components.modified).toBe(1)
    expect(diff.components.changes[0]).toMatchObject({
      name: 'Button',
      change: 'modified',
    })
  })

  // ─── Font diffs ────────────────────────────────────────────────────────────

  it('detects a removed font family', () => {
    const previous = createMockExtractionResult({
      fonts: [
        { family: 'Inter', weight: '400', style: 'normal', display: 'swap' },
        { family: 'Roboto', weight: '400', style: 'normal', display: 'swap' },
      ],
    })
    const current = createMockExtractionResult({
      fonts: [
        { family: 'Inter', weight: '400', style: 'normal', display: 'swap' },
      ],
    })

    const diff = diffExtractions(previous, current)

    expect(diff.fonts.removed).toContain('Roboto')
    expect(diff.fonts.added).toHaveLength(0)
  })

  it('detects an added font family', () => {
    const previous = createMockExtractionResult({ fonts: [] })
    const current = createMockExtractionResult({
      fonts: [{ family: 'Geist', weight: '400', style: 'normal', display: 'swap' }],
    })

    const diff = diffExtractions(previous, current)

    expect(diff.fonts.added).toContain('Geist')
  })

  // ─── Summary string ────────────────────────────────────────────────────────

  it('includes token change count in summary', () => {
    const previous = createMockExtractionResult()
    const current = createMockExtractionResult({
      tokens: {
        ...previous.tokens,
        colors: [
          createMockToken({ name: 'primary', value: '#CHANGED', cssVariable: '--color-primary' }),
          createMockToken({ name: 'surface', value: '#FFFBFE', cssVariable: '--color-surface' }),
        ],
      },
    })

    const diff = diffExtractions(previous, current)

    expect(diff.summary).toContain('token')
    expect(diff.summary).toMatch(/\d+ token/)
  })

  it('includes component added count in summary', () => {
    const previous = createMockExtractionResult({ components: [] })
    const current = createMockExtractionResult({
      components: [
        { name: 'Button', variantCount: 1 },
        { name: 'Card', variantCount: 2 },
      ],
    })

    const diff = diffExtractions(previous, current)

    expect(diff.summary).toContain('2 components added')
  })

  it('uses singular "component" for a single change', () => {
    const previous = createMockExtractionResult({ components: [] })
    const current = createMockExtractionResult({
      components: [{ name: 'Button', variantCount: 1 }],
    })

    const diff = diffExtractions(previous, current)

    expect(diff.summary).toContain('1 component added')
  })

  it('summarises multiple change types joined by commas', () => {
    const previous = createMockExtractionResult({
      components: [{ name: 'Button', variantCount: 1 }],
    })
    const current = createMockExtractionResult({
      tokens: {
        ...previous.tokens,
        colors: [
          createMockToken({ name: 'primary', value: '#CHANGED', cssVariable: '--color-primary' }),
          createMockToken({ name: 'surface', value: '#FFFBFE', cssVariable: '--color-surface' }),
        ],
      },
      components: [
        { name: 'Button', variantCount: 1 },
        { name: 'Card', variantCount: 3 },
      ],
    })

    const diff = diffExtractions(previous, current)

    expect(diff.summary).toContain('token')
    expect(diff.summary).toContain('component')
    expect(diff.summary).toContain(',')
  })
})
