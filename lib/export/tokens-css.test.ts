import { describe, it, expect } from 'vitest'
import { generateTokensCss } from '@/lib/export/tokens-css'
import { createMockTokens, createMockToken } from '@/test/helpers'
import type { ExtractedTokens } from '@/lib/types'

// ─── :root block ─────────────────────────────────────────────────────────────

describe('generateTokensCss — :root block', () => {
  it('wraps output in a :root block', () => {
    const css = generateTokensCss(createMockTokens())
    expect(css).toContain(':root {')
    expect(css).toContain('}')
  })

  it('emits CSS custom properties for colour tokens', () => {
    const css = generateTokensCss(createMockTokens())
    expect(css).toContain('--color-primary: #6750A4;')
    expect(css).toContain('--color-surface: #FFFBFE;')
  })

  it('emits CSS custom property for spacing tokens', () => {
    const css = generateTokensCss(createMockTokens())
    expect(css).toContain('--space-4: 16px;')
  })

  it('emits CSS custom property for radius tokens', () => {
    const css = generateTokensCss(createMockTokens())
    expect(css).toContain('--radius-md: 12px;')
  })
})

// ─── Section comments ─────────────────────────────────────────────────────────

describe('generateTokensCss — section comments', () => {
  it('includes COLOURS section comment', () => {
    const css = generateTokensCss(createMockTokens())
    expect(css).toContain('/* === COLOURS ===')
  })

  it('includes TYPOGRAPHY section comment when typography tokens present', () => {
    const css = generateTokensCss(createMockTokens())
    expect(css).toContain('/* === TYPOGRAPHY ===')
  })

  it('includes SPACING section comment when spacing tokens present', () => {
    const css = generateTokensCss(createMockTokens())
    expect(css).toContain('/* === SPACING ===')
  })

  it('includes BORDER RADIUS section comment when radius tokens present', () => {
    const css = generateTokensCss(createMockTokens())
    expect(css).toContain('/* === BORDER RADIUS ===')
  })

  it('includes EFFECTS section comment when effects tokens present', () => {
    const tokens = createMockTokens({
      effects: [createMockToken({ name: 'shadow-md', value: '0 4px 8px rgba(0,0,0,.2)', type: 'effect', cssVariable: '--shadow-md' })],
    })
    const css = generateTokensCss(tokens)
    expect(css).toContain('/* === EFFECTS ===')
  })

  it('includes MOTION section comment when motion tokens present', () => {
    const tokens = createMockTokens({
      motion: [createMockToken({ name: 'duration-base', value: '150ms', type: 'motion', cssVariable: '--duration-base' })],
    })
    const css = generateTokensCss(tokens)
    expect(css).toContain('/* === MOTION ===')
  })
})

// ─── Dark mode tokens ─────────────────────────────────────────────────────────

describe('generateTokensCss — dark mode tokens', () => {
  const darkTokens = createMockTokens({
    colors: [
      createMockToken({ name: '--color-primary', value: '#6750A4', cssVariable: '--color-primary' }),
      createMockToken({ name: '--color-primary', value: '#D0BCFF', cssVariable: '--color-primary', mode: 'dark' }),
    ],
  })

  it('emits a [data-theme="dark"] block for dark-mode tokens', () => {
    const css = generateTokensCss(darkTokens)
    expect(css).toContain('[data-theme="dark"] {')
  })

  it('dark-mode token value appears inside the [data-theme] block', () => {
    const css = generateTokensCss(darkTokens)
    const darkBlock = css.slice(css.indexOf('[data-theme="dark"]'))
    expect(darkBlock).toContain('--color-primary: #D0BCFF;')
  })

  it('emits @media (prefers-color-scheme: dark) block for dark tokens', () => {
    const css = generateTokensCss(darkTokens)
    expect(css).toContain('@media (prefers-color-scheme: dark)')
  })

  it('@media block contains the dark-mode token value', () => {
    const css = generateTokensCss(darkTokens)
    const mediaBlock = css.slice(css.indexOf('@media (prefers-color-scheme: dark)'))
    expect(mediaBlock).toContain('--color-primary: #D0BCFF;')
  })

  it('light-mode token is NOT duplicated inside the dark blocks', () => {
    const css = generateTokensCss(darkTokens)
    const darkBlock = css.slice(css.indexOf('[data-theme="dark"]'))
    expect(darkBlock).not.toContain('#6750A4')
  })
})

// ─── Empty categories are skipped ────────────────────────────────────────────

describe('generateTokensCss — empty categories skipped', () => {
  it('omits EFFECTS comment when effects array is empty', () => {
    const tokens = createMockTokens({ effects: [] })
    const css = generateTokensCss(tokens)
    expect(css).not.toContain('EFFECTS')
  })

  it('omits MOTION comment when motion array is empty', () => {
    const tokens = createMockTokens({ motion: [] })
    const css = generateTokensCss(tokens)
    expect(css).not.toContain('MOTION')
  })

  it('produces minimal valid output when all categories are empty', () => {
    const empty: ExtractedTokens = {
      colors: [],
      typography: [],
      spacing: [],
      radius: [],
      effects: [],
      motion: [],
    }
    const css = generateTokensCss(empty)
    expect(css).toContain(':root {')
    expect(css).toContain('}')
    // No section comments should appear
    expect(css).not.toContain('===')
  })
})
