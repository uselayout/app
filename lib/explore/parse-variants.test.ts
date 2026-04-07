import { describe, it, expect } from 'vitest'
import {
  parseVariants,
  parsePartialVariants,
  countCompleteVariants,
} from '@/lib/explore/parse-variants'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildVariantSection(
  index: number,
  name: string,
  rationale: string,
  code: string,
  lang = 'tsx'
): string {
  return `### Variant ${index}: ${name}\n${rationale}\n\`\`\`${lang}\n${code}\n\`\`\``
}

const VARIANT_1_CODE = `export default function Variant1() {
  return <div>Hero</div>
}`

const VARIANT_2_CODE = `export default function Variant2() {
  return <div>Minimal</div>
}`

// ─── parseVariants ────────────────────────────────────────────────────────────

describe('parseVariants', () => {
  it('parses two complete variants with names, rationale, and code', () => {
    const output = [
      buildVariantSection(1, 'Bold Hero', 'A bold, full-width hero.', VARIANT_1_CODE),
      buildVariantSection(2, 'Minimal', 'Clean and minimal.', VARIANT_2_CODE),
    ].join('\n\n')

    const variants = parseVariants(output)

    expect(variants).toHaveLength(2)

    expect(variants[0]).toMatchObject({
      id: 'variant-0',
      name: 'Bold Hero',
      rationale: 'A bold, full-width hero.',
      code: VARIANT_1_CODE,
    })

    expect(variants[1]).toMatchObject({
      id: 'variant-1',
      name: 'Minimal',
      rationale: 'Clean and minimal.',
      code: VARIANT_2_CODE,
    })
  })

  it('skips sections without a code block', () => {
    const output = `### Variant 1: No Code\nJust some text, no fenced block.\n\n### Variant 2: Has Code\nWith code.\n\`\`\`tsx\n${VARIANT_1_CODE}\n\`\`\``

    const variants = parseVariants(output)

    expect(variants).toHaveLength(1)
    expect(variants[0].name).toBe('Has Code')
  })

  it('passes batchId and batchPrompt through to each variant', () => {
    const output = buildVariantSection(1, 'Card', 'A card.', VARIANT_1_CODE)

    const variants = parseVariants(output, {
      batchId: 'batch-abc',
      batchPrompt: 'Create a card',
    })

    expect(variants[0]).toMatchObject({
      batchId: 'batch-abc',
      batchPrompt: 'Create a card',
    })
  })

  it('omits batchId and batchPrompt when not provided', () => {
    const output = buildVariantSection(1, 'Card', '', VARIANT_1_CODE)

    const variants = parseVariants(output)

    expect(variants[0]).not.toHaveProperty('batchId')
    expect(variants[0]).not.toHaveProperty('batchPrompt')
  })

  it('shifts variant IDs by idOffset', () => {
    const output = [
      buildVariantSection(1, 'First', '', VARIANT_1_CODE),
      buildVariantSection(2, 'Second', '', VARIANT_2_CODE),
    ].join('\n\n')

    const variants = parseVariants(output, { idOffset: 5 })

    expect(variants[0].id).toBe('variant-5')
    expect(variants[1].id).toBe('variant-6')
  })

  it('returns empty array for empty string', () => {
    expect(parseVariants('')).toEqual([])
  })

  it('returns empty array when output has no variant headings', () => {
    expect(parseVariants('Some preamble text with no headings.')).toEqual([])
  })

  it('accepts typescript and jsx fence languages', () => {
    const tsOutput = buildVariantSection(1, 'TS Variant', '', VARIANT_1_CODE, 'typescript')
    const jsxOutput = buildVariantSection(1, 'JSX Variant', '', VARIANT_1_CODE, 'jsx')

    expect(parseVariants(tsOutput)).toHaveLength(1)
    expect(parseVariants(jsxOutput)).toHaveLength(1)
  })
})

// ─── parsePartialVariants ─────────────────────────────────────────────────────

describe('parsePartialVariants', () => {
  it('marks a fully closed code block as isComplete: true', () => {
    const output = buildVariantSection(1, 'Complete', 'Some rationale.', VARIANT_1_CODE)

    const partials = parsePartialVariants(output)

    expect(partials).toHaveLength(1)
    expect(partials[0]).toMatchObject({
      index: 0,
      name: 'Complete',
      rationale: 'Some rationale.',
      codeInProgress: VARIANT_1_CODE,
      isComplete: true,
    })
  })

  it('marks an unclosed code block as isComplete: false', () => {
    const output = `### Variant 1: In Progress\nStreaming rationale.\n\`\`\`tsx\nexport default function V1() {\n  return <div>partial`

    const partials = parsePartialVariants(output)

    expect(partials).toHaveLength(1)
    expect(partials[0].isComplete).toBe(false)
    expect(partials[0].codeInProgress).toContain('partial')
  })

  it('returns empty codeInProgress when heading exists but no code block has started', () => {
    const output = `### Variant 1: Heading Only\nJust the rationale so far.`

    const partials = parsePartialVariants(output)

    expect(partials).toHaveLength(1)
    expect(partials[0].codeInProgress).toBe('')
    expect(partials[0].isComplete).toBe(false)
  })

  it('handles mixed complete and incomplete variants', () => {
    const complete = buildVariantSection(1, 'Done', '', VARIANT_1_CODE)
    const inProgress = `### Variant 2: WIP\n\`\`\`tsx\nexport default function V2() {`

    const partials = parsePartialVariants(`${complete}\n\n${inProgress}`)

    expect(partials).toHaveLength(2)
    expect(partials[0].isComplete).toBe(true)
    expect(partials[1].isComplete).toBe(false)
  })

  it('returns empty array when the heading has no name text (blank section is skipped)', () => {
    // The split produces a section that is just whitespace; the parser skips it
    const output = `### Variant 1: \n`

    const partials = parsePartialVariants(output)

    expect(partials).toHaveLength(0)
  })
})

// ─── countCompleteVariants ────────────────────────────────────────────────────

describe('countCompleteVariants', () => {
  it('returns 0 for empty string', () => {
    expect(countCompleteVariants('')).toBe(0)
  })

  it('returns 2 when two variants have closed code blocks', () => {
    const output = [
      buildVariantSection(1, 'First', '', VARIANT_1_CODE),
      buildVariantSection(2, 'Second', '', VARIANT_2_CODE),
    ].join('\n\n')

    expect(countCompleteVariants(output)).toBe(2)
  })

  it('returns 2 with 2 complete and 1 incomplete (unclosed block)', () => {
    const complete1 = buildVariantSection(1, 'First', '', VARIANT_1_CODE)
    const complete2 = buildVariantSection(2, 'Second', '', VARIANT_2_CODE)
    const incomplete = `### Variant 3: Third\n\`\`\`tsx\nexport default function V3() {`

    const output = [complete1, complete2, incomplete].join('\n\n')

    expect(countCompleteVariants(output)).toBe(2)
  })

  it('returns 0 when there are headings but no closed code blocks', () => {
    const output = `### Variant 1: No Code\nJust text.\n\n### Variant 2: Also No Code\nMore text.`

    expect(countCompleteVariants(output)).toBe(0)
  })
})
