import { describe, it, expect } from 'vitest'
import { calculateHealthScore } from '@/lib/health/score'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LAYOUT_WITH_VARS = `
\`\`\`css
:root {
  --color-primary: #6750A4;
  --color-surface: #FFFBFE;
  --space-4: 16px;
  --space-8: 32px;
  font-family: 'Roboto', sans-serif;
}
\`\`\`
`

// ─── Base score ───────────────────────────────────────────────────────────────

describe('calculateHealthScore — base score', () => {
  it('returns total of 60 for empty output (no bonuses or penalties)', () => {
    const result = calculateHealthScore('')
    // Empty string has no interactive elements, no images, not complex layout (< 5 divs)
    // +10 for no rogue inline colours
    expect(result.total).toBe(70)
  })

  it('total is always between 0 and 100', () => {
    // Maximally bad output
    const bad = Array.from({ length: 10 }, (_, i) => `#${i}${i}${i}${i}${i}${i}`).join(' ')
    const result = calculateHealthScore(bad)
    expect(result.total).toBeGreaterThanOrEqual(0)
    expect(result.total).toBeLessThanOrEqual(100)
  })
})

// ─── CSS variable usage ───────────────────────────────────────────────────────

describe('calculateHealthScore — CSS variable usage', () => {
  it('gives +20 bonus when output uses var(--) and layoutMd has CSS vars', () => {
    const output = `<div style={{ color: 'var(--color-primary)' }}>Hello</div>`
    const base = calculateHealthScore('', [], LAYOUT_WITH_VARS)
    const withVars = calculateHealthScore(output, [], LAYOUT_WITH_VARS)
    expect(withVars.total).toBeGreaterThan(base.total)
  })

  it('sets tokenFaithfulness to 80 when output uses var(--)', () => {
    const output = `<div className="text-[var(--color-primary)]">Hi</div>`
    const result = calculateHealthScore(output, [], LAYOUT_WITH_VARS)
    expect(result.tokenFaithfulness).toBe(80)
  })

  it('sets tokenFaithfulness to 20 when layoutMd has vars but output does not use them', () => {
    const output = `<div style={{ color: '#FF0000' }}>Hi</div>`
    const result = calculateHealthScore(output, [], LAYOUT_WITH_VARS)
    expect(result.tokenFaithfulness).toBe(20)
  })

  it('adds a warning issue when design system has vars but output does not use them', () => {
    const output = `<p>Static text</p>`
    const result = calculateHealthScore(output, [], LAYOUT_WITH_VARS)
    const varWarning = result.issues.find((i) => i.rule === 'Uses CSS variables')
    expect(varWarning).toBeDefined()
    expect(varWarning!.severity).toBe('warning')
  })
})

// ─── Hardcoded hex values ─────────────────────────────────────────────────────

describe('calculateHealthScore — hardcoded hex penalties', () => {
  it('penalises hex values not in the design system', () => {
    const output = `<div style={{ color: '#FF0000' }}>Red text</div>`
    const result = calculateHealthScore(output, [], LAYOUT_WITH_VARS)
    expect(result.total).toBeLessThan(70)
    expect(result.antiPatternViolations).toBeGreaterThan(0)
  })

  it('adds error-severity issue for rogue hex', () => {
    const output = `<div style={{ background: '#DEADBE' }}>Block</div>`
    const result = calculateHealthScore(output, [], LAYOUT_WITH_VARS)
    const err = result.issues.find((i) => i.rule === 'No hardcoded colours')
    expect(err).toBeDefined()
    expect(err!.severity).toBe('error')
  })

  it('does NOT penalise hex values that appear in the design system spec', () => {
    // #6750A4 is in LAYOUT_WITH_VARS
    const output = `<div style={{ color: '#6750A4' }}>Primary</div>`
    const result = calculateHealthScore(output, [], LAYOUT_WITH_VARS)
    expect(result.antiPatternViolations).toBe(0)
    expect(result.issues.find((i) => i.rule === 'No hardcoded colours')).toBeUndefined()
  })

  it('penalises multiple rogue hex values with a larger score reduction', () => {
    const singleRogue = calculateHealthScore(`<div style={{ color: '#FF0000' }}/>`, [], LAYOUT_WITH_VARS)
    const multiRogue = calculateHealthScore(
      `<div style={{ color: '#FF0000', background: '#00FF00' }}/>`,
      [],
      LAYOUT_WITH_VARS
    )
    expect(multiRogue.total).toBeLessThanOrEqual(singleRogue.total)
  })
})

// ─── Font detection ───────────────────────────────────────────────────────────

describe('calculateHealthScore — font detection', () => {
  it('gives +20 bonus when output uses a font from extractedFonts', () => {
    const outputWithFont = `<div style={{ fontFamily: 'Roboto' }}>Text</div>`
    const outputWithout = `<div>Text</div>`
    const withFont = calculateHealthScore(outputWithFont, ['Roboto'])
    const without = calculateHealthScore(outputWithout, ['Roboto'])
    expect(withFont.total).toBeGreaterThan(without.total)
  })

  it('adds a warning when extractedFonts provided but none used', () => {
    const output = `<p>No font here</p>`
    const result = calculateHealthScore(output, ['Inter', 'Roboto'])
    const fontIssue = result.issues.find((i) => i.rule === 'Uses design system font')
    expect(fontIssue).toBeDefined()
    expect(fontIssue!.severity).toBe('warning')
  })

  it('no font issues when no extractedFonts provided', () => {
    const output = `<p>No font here</p>`
    const result = calculateHealthScore(output, [])
    const fontIssue = result.issues.find((i) => i.rule === 'Uses design system font')
    expect(fontIssue).toBeUndefined()
  })
})

// ─── Semantic HTML bonus ──────────────────────────────────────────────────────

describe('calculateHealthScore — semantic HTML', () => {
  it('gives +5 bonus for output with <main>', () => {
    const withSemantic = calculateHealthScore('<main><p>Content</p></main>')
    const withoutSemantic = calculateHealthScore('<div><p>Content</p></div>')
    expect(withSemantic.total).toBeGreaterThan(withoutSemantic.total)
  })

  it('gives +5 bonus for output with <nav>', () => {
    const result = calculateHealthScore('<nav><a href="/">Home</a></nav>')
    // 60 base + 10 no-inline-colour bonus + 5 semantic bonus
    expect(result.total).toBeGreaterThanOrEqual(65)
  })

  it('gives semantic bonus for <section>, <article>, <header>, <footer>', () => {
    const tags = ['<section>', '<article>', '<header>', '<footer>']
    for (const tag of tags) {
      const result = calculateHealthScore(`${tag}Content</${tag.slice(1)}>`)
      expect(result.total).toBeGreaterThanOrEqual(65)
    }
  })
})

// ─── Off-grid spacing ─────────────────────────────────────────────────────────

describe('calculateHealthScore — off-grid spacing', () => {
  it('penalises Tailwind arbitrary spacing not in the design system', () => {
    const output = `<div className="p-[13px]">Content</div>`
    const clean = calculateHealthScore('<div className="p-[16px]">Content</div>', [], LAYOUT_WITH_VARS)
    const offGrid = calculateHealthScore(output, [], LAYOUT_WITH_VARS)
    expect(offGrid.total).toBeLessThan(clean.total)
  })

  it('adds a warning issue for off-grid spacing', () => {
    const output = `<div className="m-[13px]">Content</div>`
    const result = calculateHealthScore(output, [], LAYOUT_WITH_VARS)
    const spacingIssue = result.issues.find((i) => i.rule === 'Spacing matches design system grid')
    expect(spacingIssue).toBeDefined()
    expect(spacingIssue!.severity).toBe('warning')
  })

  it('does NOT warn for spacing values that are in the design system', () => {
    // 16px and 32px are both in LAYOUT_WITH_VARS as --space-4 and --space-8
    const output = `<div className="p-[16px] m-[32px]">Content</div>`
    const result = calculateHealthScore(output, [], LAYOUT_WITH_VARS)
    const spacingIssue = result.issues.find((i) => i.rule === 'Spacing matches design system grid')
    expect(spacingIssue).toBeUndefined()
  })

  it('does not check spacing when layoutMd has no spacing tokens', () => {
    const noSpacingMd = `\`\`\`css\n:root { --color-primary: #6750A4; }\n\`\`\``
    const output = `<div className="p-[13px]">Content</div>`
    const result = calculateHealthScore(output, [], noSpacingMd)
    const spacingIssue = result.issues.find((i) => i.rule === 'Spacing matches design system grid')
    expect(spacingIssue).toBeUndefined()
  })
})

// ─── componentAccuracy ────────────────────────────────────────────────────────

describe('calculateHealthScore — componentAccuracy', () => {
  it('is 80 when there are no issues', () => {
    const output = `<main><p>Clean output</p></main>`
    const result = calculateHealthScore(output)
    expect(result.componentAccuracy).toBe(80)
  })

  it('is 40 when issues are present', () => {
    const output = `<div style={{ color: '#FF0000' }}>Bad</div>`
    const result = calculateHealthScore(output, [], LAYOUT_WITH_VARS)
    expect(result.componentAccuracy).toBe(40)
  })
})
