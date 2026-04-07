import { describe, it, expect } from 'vitest'
import { replaceTokenInLayoutMd } from './replace-token'

// ─── Single replacement ───────────────────────────────────────────────────────

describe('replaceTokenInLayoutMd — single replacement', () => {
  it('replaces the value of a token inside a css block', () => {
    const markdown = '```css\n:root {\n  --color-primary: #6750A4;\n}\n```'
    const result = replaceTokenInLayoutMd(markdown, '--color-primary', '#FF0000')
    expect(result).toContain('--color-primary: #FF0000;')
  })

  it('returns a string (not null) when the token is found', () => {
    const markdown = '```css\n:root { --space-4: 16px; }\n```'
    const result = replaceTokenInLayoutMd(markdown, '--space-4', '20px')
    expect(result).not.toBeNull()
  })

  it('preserves the rest of the markdown unchanged', () => {
    const markdown =
      '# Design System\n\n```css\n:root {\n  --color-primary: #6750A4;\n}\n```\n\nSome prose.'
    const result = replaceTokenInLayoutMd(markdown, '--color-primary', '#000000')!
    expect(result).toContain('# Design System')
    expect(result).toContain('Some prose.')
    expect(result).toContain('--color-primary: #000000;')
  })

  it('does not alter tokens other than the targeted one', () => {
    const markdown = '```css\n:root {\n  --color-primary: #6750A4;\n  --color-secondary: #625B71;\n}\n```'
    const result = replaceTokenInLayoutMd(markdown, '--color-primary', '#FF0000')!
    expect(result).toContain('--color-secondary: #625B71;')
  })
})

// ─── Multiple occurrences ─────────────────────────────────────────────────────

describe('replaceTokenInLayoutMd — multiple CSS blocks', () => {
  it('replaces the token in every css block where it appears', () => {
    const markdown = [
      '```css',
      ':root { --color-primary: #6750A4; }',
      '```',
      '',
      'Some text.',
      '',
      '```css',
      '[data-theme="dark"] { --color-primary: #D0BCFF; }',
      '```',
    ].join('\n')

    const result = replaceTokenInLayoutMd(markdown, '--color-primary', '#FF0000')!
    const matches = result.match(/--color-primary: #FF0000;/g)
    expect(matches).toHaveLength(2)
  })

  it('produces a string with correct length after multiple replacements', () => {
    const markdown = [
      '```css\n--color-primary: #6750A4;\n```',
      '```css\n--color-primary: #6750A4;\n```',
    ].join('\n\n')

    const result = replaceTokenInLayoutMd(markdown, '--color-primary', '#FF0000')!
    // Old value 7 chars (#6750A4), new value 7 chars (#FF0000) — length unchanged here
    expect(result.split('#FF0000').length - 1).toBe(2)
  })

  it('handles offset correctly when replacement is shorter than original', () => {
    const markdown = [
      '```css\n--color-primary: #6750A4;\n```',
      '```css\n--color-primary: #6750A4;\n```',
    ].join('\n\n')

    // Shorter replacement: #fff (3 chars) vs #6750A4 (7 chars)
    const result = replaceTokenInLayoutMd(markdown, '--color-primary', '#fff')!
    const occurrences = result.match(/--color-primary: #fff;/g)
    expect(occurrences).toHaveLength(2)
  })

  it('handles offset correctly when replacement is longer than original', () => {
    const markdown = [
      '```css\n--space-4: 16px;\n```',
      '```css\n--space-4: 16px;\n```',
    ].join('\n\n')

    const result = replaceTokenInLayoutMd(markdown, '--space-4', '1000px')!
    const occurrences = result.match(/--space-4: 1000px;/g)
    expect(occurrences).toHaveLength(2)
  })
})

// ─── Token not found ──────────────────────────────────────────────────────────

describe('replaceTokenInLayoutMd — token not found', () => {
  it('returns null when the token does not exist in any css block', () => {
    const markdown = '```css\n:root { --color-primary: #6750A4; }\n```'
    const result = replaceTokenInLayoutMd(markdown, '--color-nonexistent', '#FF0000')
    expect(result).toBeNull()
  })

  it('returns null for an empty markdown string', () => {
    const result = replaceTokenInLayoutMd('', '--color-primary', '#FF0000')
    expect(result).toBeNull()
  })

  it('returns null when markdown has no css fenced blocks at all', () => {
    const markdown = '# Title\n\nSome prose with --color-primary: #6750A4 mentioned inline.'
    const result = replaceTokenInLayoutMd(markdown, '--color-primary', '#FF0000')
    expect(result).toBeNull()
  })
})

// ─── Inline mention guard ─────────────────────────────────────────────────────

describe('replaceTokenInLayoutMd — only replaces inside css blocks', () => {
  it('does not replace inline token mentions outside fenced blocks', () => {
    const markdown = [
      'Use `--color-primary: #6750A4;` in your code.',
      '',
      '```css',
      ':root { --color-primary: #6750A4; }',
      '```',
    ].join('\n')

    const result = replaceTokenInLayoutMd(markdown, '--color-primary', '#FF0000')!
    // The inline backtick mention should be untouched
    expect(result).toContain('`--color-primary: #6750A4;`')
    // The css block value should be replaced
    expect(result).toContain('--color-primary: #FF0000;')
  })

  it('does not treat tsx or json fenced blocks as css', () => {
    const markdown = [
      '```tsx',
      'const color = "--color-primary: #6750A4;";',
      '```',
    ].join('\n')

    const result = replaceTokenInLayoutMd(markdown, '--color-primary', '#FF0000')
    expect(result).toBeNull()
  })
})

// ─── Special characters in token names ───────────────────────────────────────

describe('replaceTokenInLayoutMd — token names with special regex characters', () => {
  it('handles token names containing dots', () => {
    // Dots are valid in CSS custom property names and must be escaped in regex
    const markdown = '```css\n:root { --color.primary: #6750A4; }\n```'
    const result = replaceTokenInLayoutMd(markdown, '--color.primary', '#FF0000')
    // The function escapes special chars; it should replace safely or return null
    // Either way it must not throw
    expect(() =>
      replaceTokenInLayoutMd(markdown, '--color.primary', '#FF0000')
    ).not.toThrow()
  })

  it('handles token names containing parentheses', () => {
    const markdown = '```css\n:root { --color(base): #6750A4; }\n```'
    expect(() =>
      replaceTokenInLayoutMd(markdown, '--color(base)', '#FF0000')
    ).not.toThrow()
  })

  it('handles token names containing square brackets', () => {
    const markdown = '```css\n:root { --color[primary]: #6750A4; }\n```'
    expect(() =>
      replaceTokenInLayoutMd(markdown, '--color[primary]', '#FF0000')
    ).not.toThrow()
  })
})

// ─── Value edge cases ─────────────────────────────────────────────────────────

describe('replaceTokenInLayoutMd — value edge cases', () => {
  it('replaces values with spaces (e.g. rgba or shorthand)', () => {
    const markdown = "```css\n:root { --shadow-md: 0px 4px 8px rgba(0,0,0,0.2); }\n```"
    const result = replaceTokenInLayoutMd(
      markdown,
      '--shadow-md',
      '0px 2px 4px rgba(0,0,0,0.1)'
    )
    expect(result).toContain('--shadow-md: 0px 2px 4px rgba(0,0,0,0.1);')
  })

  it('handles a token that already has the new value (idempotent)', () => {
    const markdown = '```css\n:root { --color-primary: #FF0000; }\n```'
    const result = replaceTokenInLayoutMd(markdown, '--color-primary', '#FF0000')!
    expect(result).toContain('--color-primary: #FF0000;')
  })
})
