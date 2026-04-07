import { describe, it, expect } from 'vitest'
import { analyseCompleteness } from '@/lib/health/completeness'
import { readFileSync } from 'fs'
import path from 'path'

const fixture = readFileSync(
  path.resolve(__dirname, '../../test/fixtures/layout-md-sample.md'),
  'utf-8'
)

const ALL_SECTION_NAMES = [
  'Quick Reference',
  'Colours',
  'Typography',
  'Spacing',
  'Components',
  'Anti-patterns',
  'Motion',
  'Accessibility',
  'Icons',
  'Grid & Layout',
]

// ─── Empty input ──────────────────────────────────────────────────────────────

describe('analyseCompleteness — empty input', () => {
  it('returns totalScore of 0 for an empty string', () => {
    const report = analyseCompleteness('')
    expect(report.totalScore).toBe(0)
  })

  it('includes a "very short" suggestion for an empty string', () => {
    const report = analyseCompleteness('')
    const text = report.suggestions.join(' ').toLowerCase()
    expect(text).toMatch(/very short|short/i)
  })

  it('returns exactly 10 section entries even for empty input', () => {
    const report = analyseCompleteness('')
    expect(report.sections).toHaveLength(10)
  })

  it('all sections score 0 for empty input', () => {
    const report = analyseCompleteness('')
    for (const section of report.sections) {
      expect(section.score).toBe(0)
    }
  })
})

// ─── Fixture (well-structured) ────────────────────────────────────────────────

describe('analyseCompleteness — fixture markdown', () => {
  it('returns totalScore > 0 for the sample fixture', () => {
    const report = analyseCompleteness(fixture)
    expect(report.totalScore).toBeGreaterThan(0)
  })

  it('detects the Colours section', () => {
    const report = analyseCompleteness(fixture)
    const colours = report.sections.find((s) => s.section === 'Colours')
    expect(colours).toBeDefined()
    expect(colours!.score).toBeGreaterThan(0)
  })

  it('detects the Typography section', () => {
    const report = analyseCompleteness(fixture)
    const typo = report.sections.find((s) => s.section === 'Typography')
    expect(typo).toBeDefined()
    expect(typo!.score).toBeGreaterThan(0)
  })

  it('detects the Spacing section', () => {
    const report = analyseCompleteness(fixture)
    const spacing = report.sections.find((s) => s.section === 'Spacing')
    expect(spacing).toBeDefined()
    expect(spacing!.score).toBeGreaterThan(0)
  })

  it('detects the Components section', () => {
    const report = analyseCompleteness(fixture)
    const components = report.sections.find((s) => s.section === 'Components')
    expect(components).toBeDefined()
    expect(components!.score).toBeGreaterThan(0)
  })

  it('detects the Anti-patterns section', () => {
    const report = analyseCompleteness(fixture)
    const anti = report.sections.find((s) => s.section === 'Anti-patterns')
    expect(anti).toBeDefined()
    // The fixture has a dedicated heading + bullet NEVER rules
    expect(anti!.score).toBeGreaterThan(0)
  })
})

// ─── Sections array ───────────────────────────────────────────────────────────

describe('analyseCompleteness — sections array shape', () => {
  it('always returns an entry for all 10 sections', () => {
    const report = analyseCompleteness(fixture)
    const names = report.sections.map((s) => s.section)
    for (const expected of ALL_SECTION_NAMES) {
      expect(names).toContain(expected)
    }
  })

  it('each section score is between 0 and 100', () => {
    const report = analyseCompleteness(fixture)
    for (const section of report.sections) {
      expect(section.score).toBeGreaterThanOrEqual(0)
      expect(section.score).toBeLessThanOrEqual(100)
    }
  })

  it('each section has found and missing arrays', () => {
    const report = analyseCompleteness(fixture)
    for (const section of report.sections) {
      expect(Array.isArray(section.found)).toBe(true)
      expect(Array.isArray(section.missing)).toBe(true)
    }
  })
})

// ─── Missing sections ─────────────────────────────────────────────────────────

describe('analyseCompleteness — missing sections trigger suggestions', () => {
  it('suggests adding Motion section when absent', () => {
    // Strip any motion-related headings from a minimal doc
    const md = `## Colours\n\n\`\`\`css\n:root { --color-primary: #6750A4; }\n\`\`\``
    const report = analyseCompleteness(md)
    const motionSection = report.sections.find((s) => s.section === 'Motion')
    expect(motionSection!.score).toBe(0)
    const allText = report.suggestions.join(' ')
    expect(allText).toMatch(/Motion/)
  })

  it('suggests adding Accessibility section when absent', () => {
    const md = `## Colours\n\n\`\`\`css\n:root { --color-primary: #6750A4; }\n\`\`\``
    const report = analyseCompleteness(md)
    const a11ySection = report.sections.find((s) => s.section === 'Accessibility')
    expect(a11ySection!.score).toBe(0)
    const allText = report.suggestions.join(' ')
    expect(allText).toMatch(/Accessibility/)
  })

  it('suggests adding a code block when none are present', () => {
    const md = 'Some text without any code blocks at all.'
    const report = analyseCompleteness(md)
    const allText = report.suggestions.join(' ')
    expect(allText).toMatch(/code block/i)
  })
})

// ─── Scoring integrity ────────────────────────────────────────────────────────

describe('analyseCompleteness — scoring integrity', () => {
  it('a document with all sections scores higher than one with none', () => {
    const minimal = 'No sections here whatsoever.'
    const rich = fixture
    expect(analyseCompleteness(rich).totalScore).toBeGreaterThan(
      analyseCompleteness(minimal).totalScore
    )
  })

  it('totalScore is between 0 and 100', () => {
    const report = analyseCompleteness(fixture)
    expect(report.totalScore).toBeGreaterThanOrEqual(0)
    expect(report.totalScore).toBeLessThanOrEqual(100)
  })
})
