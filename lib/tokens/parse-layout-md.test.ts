import { describe, it, expect } from 'vitest'
import { parseTokensFromLayoutMd } from '@/lib/tokens/parse-layout-md'
import { readFileSync } from 'fs'
import path from 'path'

const fixture = readFileSync(
  path.resolve(__dirname, '../../test/fixtures/layout-md-sample.md'),
  'utf-8'
)

// ─── Colours ──────────────────────────────────────────────────────────────────

describe('parseTokensFromLayoutMd — colours', () => {
  it('parses colour tokens from :root block', () => {
    const result = parseTokensFromLayoutMd(fixture)
    const names = result.colors.map((t) => t.name)
    expect(names).toContain('--color-primary')
    expect(names).toContain('--color-surface')
    expect(names).toContain('--color-on-primary')
    expect(names).toContain('--color-error')
  })

  it('assigns correct type "color" to colour tokens', () => {
    const result = parseTokensFromLayoutMd(fixture)
    for (const token of result.colors) {
      expect(token.type).toBe('color')
    }
  })

  it('preserves the raw CSS value', () => {
    const result = parseTokensFromLayoutMd(fixture)
    const primary = result.colors.find((t) => t.name === '--color-primary' && !t.mode)
    expect(primary?.value).toBe('#6750A4')
  })
})

// ─── Typography ───────────────────────────────────────────────────────────────

describe('parseTokensFromLayoutMd — typography', () => {
  it('parses font-family token', () => {
    const result = parseTokensFromLayoutMd(fixture)
    const names = result.typography.map((t) => t.name)
    expect(names).toContain('--font-family')
  })

  it('parses font-size tokens', () => {
    const result = parseTokensFromLayoutMd(fixture)
    const names = result.typography.map((t) => t.name)
    expect(names).toContain('--font-body-size')
    expect(names).toContain('--font-display-size')
  })

  it('assigns correct type "typography" to font tokens', () => {
    const result = parseTokensFromLayoutMd(fixture)
    for (const token of result.typography) {
      expect(token.type).toBe('typography')
    }
  })
})

// ─── Spacing ──────────────────────────────────────────────────────────────────

describe('parseTokensFromLayoutMd — spacing', () => {
  it('parses --space-1 through --space-8', () => {
    const result = parseTokensFromLayoutMd(fixture)
    const names = result.spacing.map((t) => t.name)
    expect(names).toContain('--space-1')
    expect(names).toContain('--space-2')
    expect(names).toContain('--space-4')
    expect(names).toContain('--space-8')
  })

  it('assigns correct type "spacing" to space tokens', () => {
    const result = parseTokensFromLayoutMd(fixture)
    for (const token of result.spacing) {
      expect(token.type).toBe('spacing')
    }
  })

  it('captures correct px values', () => {
    const result = parseTokensFromLayoutMd(fixture)
    const space4 = result.spacing.find((t) => t.name === '--space-4')
    expect(space4?.value).toBe('16px')
  })
})

// ─── Dark mode ────────────────────────────────────────────────────────────────

describe('parseTokensFromLayoutMd — dark mode', () => {
  it('tags tokens inside [data-theme="dark"] with mode: "dark"', () => {
    const result = parseTokensFromLayoutMd(fixture)
    const darkTokens = result.colors.filter((t) => t.mode === 'dark')
    expect(darkTokens.length).toBeGreaterThan(0)
  })

  it('includes the expected dark-mode colour overrides', () => {
    const result = parseTokensFromLayoutMd(fixture)
    const darkNames = result.colors.filter((t) => t.mode === 'dark').map((t) => t.name)
    expect(darkNames).toContain('--color-primary')
    expect(darkNames).toContain('--color-surface')
  })

  it('dark tokens have different values to their light counterparts', () => {
    const result = parseTokensFromLayoutMd(fixture)
    const lightPrimary = result.colors.find((t) => t.name === '--color-primary' && !t.mode)
    const darkPrimary = result.colors.find((t) => t.name === '--color-primary' && t.mode === 'dark')
    expect(lightPrimary?.value).toBeDefined()
    expect(darkPrimary?.value).toBeDefined()
    expect(lightPrimary!.value).not.toBe(darkPrimary!.value)
  })

  it('detects dark mode via @media (prefers-color-scheme: dark)', () => {
    const md = `
\`\`\`css
:root { --color-bg: #ffffff; }
@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: #000000;
  }
}
\`\`\`
`
    const result = parseTokensFromLayoutMd(md)
    const darkBg = result.colors.find((t) => t.name === '--color-bg' && t.mode === 'dark')
    expect(darkBg?.value).toBe('#000000')
  })
})

// ─── Deduplication ────────────────────────────────────────────────────────────

describe('parseTokensFromLayoutMd — deduplication', () => {
  it('later declaration wins when the same token appears twice', () => {
    const md = `
\`\`\`css
:root {
  --color-primary: #aaaaaa;
  --color-primary: #bbbbbb;
}
\`\`\`
`
    const result = parseTokensFromLayoutMd(md)
    const primaries = result.colors.filter((t) => t.name === '--color-primary' && !t.mode)
    expect(primaries).toHaveLength(1)
    expect(primaries[0]!.value).toBe('#bbbbbb')
  })

  it('deduplicates across separate CSS blocks (later block wins)', () => {
    const md = `
\`\`\`css
:root { --color-accent: #111111; }
\`\`\`

Some text.

\`\`\`css
:root { --color-accent: #222222; }
\`\`\`
`
    const result = parseTokensFromLayoutMd(md)
    const accents = result.colors.filter((t) => t.name === '--color-accent' && !t.mode)
    expect(accents).toHaveLength(1)
    expect(accents[0]!.value).toBe('#222222')
  })

  it('keeps dark and light variants as separate entries', () => {
    const result = parseTokensFromLayoutMd(fixture)
    const primaryTokens = result.colors.filter((t) => t.name === '--color-primary')
    // One light, one dark
    expect(primaryTokens.length).toBe(2)
    const modes = new Set(primaryTokens.map((t) => t.mode ?? 'light'))
    expect(modes).toContain('light')
    expect(modes).toContain('dark')
  })
})

// ─── Edge cases ───────────────────────────────────────────────────────────────

describe('parseTokensFromLayoutMd — edge cases', () => {
  it('returns empty arrays for an empty string', () => {
    const result = parseTokensFromLayoutMd('')
    expect(result.colors).toHaveLength(0)
    expect(result.typography).toHaveLength(0)
    expect(result.spacing).toHaveLength(0)
    expect(result.radius).toHaveLength(0)
    expect(result.effects).toHaveLength(0)
    expect(result.motion).toHaveLength(0)
  })

  it('returns empty arrays when markdown has no CSS fenced blocks', () => {
    const md = '# My Design System\n\nSome prose here.\n\n- bullet one\n- bullet two'
    const result = parseTokensFromLayoutMd(md)
    expect(result.colors).toHaveLength(0)
    expect(result.spacing).toHaveLength(0)
  })

  it('ignores non-CSS fenced blocks (e.g. tsx, json)', () => {
    const md = `
\`\`\`tsx
const x = <Button color="#ff0000" />;
\`\`\`
\`\`\`json
{ "--color-brand": "#123456" }
\`\`\`
`
    const result = parseTokensFromLayoutMd(md)
    expect(result.colors).toHaveLength(0)
  })
})

// ─── Token name classification ────────────────────────────────────────────────

describe('parseTokensFromLayoutMd — token name classification', () => {
  it('"bg" in name → color', () => {
    const md = '```css\n:root { --bg-app: #0c0c0e; }\n```'
    const result = parseTokensFromLayoutMd(md)
    expect(result.colors.find((t) => t.name === '--bg-app')).toBeDefined()
  })

  it('"shadow" in name → effect', () => {
    const md = '```css\n:root { --shadow-md: 0px 4px 8px rgba(0,0,0,.2); }\n```'
    const result = parseTokensFromLayoutMd(md)
    expect(result.effects.find((t) => t.name === '--shadow-md')).toBeDefined()
  })

  it('"radius" in name → radius', () => {
    const md = '```css\n:root { --radius-lg: 16px; }\n```'
    const result = parseTokensFromLayoutMd(md)
    expect(result.radius.find((t) => t.name === '--radius-lg')).toBeDefined()
  })

  it('value-based fallback: hex without a colour name → color', () => {
    const md = '```css\n:root { --brand: #abc123; }\n```'
    const result = parseTokensFromLayoutMd(md)
    expect(result.colors.find((t) => t.name === '--brand')).toBeDefined()
  })

  it('cssVariable is set to the token name', () => {
    const md = '```css\n:root { --color-primary: #6750A4; }\n```'
    const result = parseTokensFromLayoutMd(md)
    const token = result.colors.find((t) => t.name === '--color-primary')
    expect(token?.cssVariable).toBe('--color-primary')
  })
})
