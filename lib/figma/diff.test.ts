import { describe, it, expect } from 'vitest'
import { diffFigmaAgainstLayoutMd, applyChangesToLayoutMd } from './diff'

// ─── Inline types (avoids importing from import.ts which pulls in FigmaClient) ─

interface ExtractedColour {
  property: string
  hex: string
  opacity: number
}

interface ExtractedTypography {
  property: string
  fontFamily: string
  fontSize: number
  fontWeight: number
}

interface ExtractedSpacing {
  property: string
  value: number
}

interface ImportedNodeData {
  nodeId: string
  name: string
  screenshotUrl: string | null
  colours: ExtractedColour[]
  typography: ExtractedTypography[]
  spacing: ExtractedSpacing[]
  texts: []
  layout: null
  dimensions: null
}

function makeNode(overrides: Partial<ImportedNodeData> = {}): ImportedNodeData {
  return {
    nodeId: 'node-1',
    name: 'Test Node',
    screenshotUrl: null,
    colours: [],
    typography: [],
    spacing: [],
    texts: [],
    layout: null,
    dimensions: null,
    ...overrides,
  }
}

// ─── Colour diffing ───────────────────────────────────────────────────────────

describe('diffFigmaAgainstLayoutMd — colours', () => {
  const layoutMd = '--color-primary: #6750A4;\n--color-surface: #FFFBFE;'

  it('returns no changes when the colour is an exact hex match', () => {
    const node = makeNode({ colours: [{ property: 'fill', hex: '#6750A4', opacity: 1 }] })
    const changes = diffFigmaAgainstLayoutMd(node, layoutMd)
    expect(changes.filter((c) => c.type === 'colour')).toHaveLength(0)
  })

  it('returns no changes for case-insensitive exact hex match', () => {
    const node = makeNode({ colours: [{ property: 'fill', hex: '#6750a4', opacity: 1 }] })
    const changes = diffFigmaAgainstLayoutMd(node, layoutMd)
    expect(changes.filter((c) => c.type === 'colour')).toHaveLength(0)
  })

  it('returns a change with designTokenMatch for a close (RGB distance <50) but non-identical colour', () => {
    // #6750A4 in RGB = (103, 80, 164)
    // A nearby colour: (110, 80, 164) → distance = sqrt((7)^2) ≈ 7 — well within 50
    const nearHex = '#6E50A4'
    const node = makeNode({ colours: [{ property: 'fill', hex: nearHex, opacity: 1 }] })
    const changes = diffFigmaAgainstLayoutMd(node, layoutMd)
    const colourChanges = changes.filter((c) => c.type === 'colour')
    expect(colourChanges).toHaveLength(1)
    expect(colourChanges[0]!.designTokenMatch).toBe('--color-primary')
    expect(colourChanges[0]!.after).toBe(nearHex)
    expect(colourChanges[0]!.accepted).toBe(false)
  })

  it('sets the before value to the token hex for a close colour match', () => {
    const nearHex = '#6E50A4'
    const node = makeNode({ colours: [{ property: 'fill', hex: nearHex, opacity: 1 }] })
    const changes = diffFigmaAgainstLayoutMd(node, layoutMd)
    const colourChanges = changes.filter((c) => c.type === 'colour')
    expect(colourChanges[0]!.before.toUpperCase()).toBe('#6750A4')
  })

  it('returns no changes for a colour with RGB distance ≥50 (too distant to match)', () => {
    // #FF0000 = (255,0,0); distance from #6750A4 (103,80,164) is huge
    const node = makeNode({ colours: [{ property: 'fill', hex: '#FF0000', opacity: 1 }] })
    const changes = diffFigmaAgainstLayoutMd(node, layoutMd)
    expect(changes.filter((c) => c.type === 'colour')).toHaveLength(0)
  })

  it('reports the correct property name on a colour change', () => {
    const nearHex = '#6E50A4'
    const node = makeNode({
      colours: [{ property: 'background-color', hex: nearHex, opacity: 1 }],
    })
    const changes = diffFigmaAgainstLayoutMd(node, layoutMd)
    expect(changes[0]!.property).toBe('background-color')
  })

  it('handles multiple colours and only flags the close ones', () => {
    const node = makeNode({
      colours: [
        { property: 'fill', hex: '#6750A4', opacity: 1 },    // exact — no change
        { property: 'border', hex: '#6E50A4', opacity: 1 },   // close — change
        { property: 'text', hex: '#FF0000', opacity: 1 },     // distant — no change
      ],
    })
    const changes = diffFigmaAgainstLayoutMd(node, layoutMd)
    expect(changes.filter((c) => c.type === 'colour')).toHaveLength(1)
    expect(changes[0]!.property).toBe('border')
  })
})

// ─── Spacing diffing ──────────────────────────────────────────────────────────

describe('diffFigmaAgainstLayoutMd — spacing', () => {
  const layoutMd = '--space-4: 16px;\n--space-8: 32px;'

  it('returns a change when spacing is within 8px tolerance of a token', () => {
    // 18px is within 8px of --space-4 (16px)
    const node = makeNode({ spacing: [{ property: 'padding', value: 18 }] })
    const changes = diffFigmaAgainstLayoutMd(node, layoutMd)
    const spacingChanges = changes.filter((c) => c.type === 'spacing')
    expect(spacingChanges).toHaveLength(1)
    expect(spacingChanges[0]!.designTokenMatch).toBe('--space-4')
    expect(spacingChanges[0]!.before).toBe('16px')
    expect(spacingChanges[0]!.after).toBe('18px')
  })

  it('returns no change for exact spacing match', () => {
    const node = makeNode({ spacing: [{ property: 'padding', value: 16 }] })
    const changes = diffFigmaAgainstLayoutMd(node, layoutMd)
    expect(changes.filter((c) => c.type === 'spacing')).toHaveLength(0)
  })

  it('returns no change when spacing is beyond 8px tolerance', () => {
    // 28px is 12px away from --space-4 (16px) and 4px from --space-8 (32px)
    // Wait: 28 is within 8px of 32 → diff = 4, so it WILL match --space-8
    // Use a value clearly outside both: 0px (16px away from space-4, 32px from space-8)
    const node = makeNode({ spacing: [{ property: 'padding', value: 0 }] })
    const changes = diffFigmaAgainstLayoutMd(node, layoutMd)
    expect(changes.filter((c) => c.type === 'spacing')).toHaveLength(0)
  })

  it('reports the accepted flag as false by default', () => {
    const node = makeNode({ spacing: [{ property: 'gap', value: 18 }] })
    const changes = diffFigmaAgainstLayoutMd(node, layoutMd)
    const spacingChanges = changes.filter((c) => c.type === 'spacing')
    expect(spacingChanges[0]!.accepted).toBe(false)
  })

  it('picks the closest token when multiple are within tolerance', () => {
    // 17px is 1px from space-4 (16px) and 15px from space-8 (32px) → should pick space-4
    const node = makeNode({ spacing: [{ property: 'padding', value: 17 }] })
    const changes = diffFigmaAgainstLayoutMd(node, layoutMd)
    const spacingChanges = changes.filter((c) => c.type === 'spacing')
    expect(spacingChanges).toHaveLength(1)
    expect(spacingChanges[0]!.designTokenMatch).toBe('--space-4')
  })
})

// ─── Typography diffing ───────────────────────────────────────────────────────

describe('diffFigmaAgainstLayoutMd — typography', () => {
  const layoutMd = "font-family: 'Roboto', sans-serif;"

  it('returns a change when font family matches but size/weight differ', () => {
    const node = makeNode({
      typography: [{ property: 'body', fontFamily: 'Roboto', fontSize: 18, fontWeight: 700 }],
    })
    const changes = diffFigmaAgainstLayoutMd(node, layoutMd)
    const typoChanges = changes.filter((c) => c.type === 'typography')
    expect(typoChanges).toHaveLength(1)
    expect(typoChanges[0]!.after).toContain('Roboto')
    expect(typoChanges[0]!.after).toContain('700')
    expect(typoChanges[0]!.after).toContain('18px')
  })

  it('uses containment matching — "Roboto Condensed" matches "Roboto" token', () => {
    const node = makeNode({
      typography: [{ property: 'heading', fontFamily: 'Roboto Condensed', fontSize: 24, fontWeight: 700 }],
    })
    const changes = diffFigmaAgainstLayoutMd(node, layoutMd)
    expect(changes.filter((c) => c.type === 'typography')).toHaveLength(1)
  })

  it('returns no change when font family does not match any token', () => {
    const node = makeNode({
      typography: [{ property: 'body', fontFamily: 'Helvetica', fontSize: 16, fontWeight: 400 }],
    })
    const changes = diffFigmaAgainstLayoutMd(node, layoutMd)
    expect(changes.filter((c) => c.type === 'typography')).toHaveLength(0)
  })

  it('returns no change when font matches on family, size, and weight', () => {
    // The parser sets default size=16, weight=400 for font-family entries
    const node = makeNode({
      typography: [{ property: 'body', fontFamily: 'Roboto', fontSize: 16, fontWeight: 400 }],
    })
    const changes = diffFigmaAgainstLayoutMd(node, layoutMd)
    expect(changes.filter((c) => c.type === 'typography')).toHaveLength(0)
  })

  it('before value contains the token family name', () => {
    const node = makeNode({
      typography: [{ property: 'caption', fontFamily: 'Roboto', fontSize: 12, fontWeight: 300 }],
    })
    const changes = diffFigmaAgainstLayoutMd(node, layoutMd)
    expect(changes[0]!.before).toContain('Roboto')
  })
})

// ─── Empty / no-op input ──────────────────────────────────────────────────────

describe('diffFigmaAgainstLayoutMd — empty data', () => {
  const layoutMd = '--color-primary: #6750A4;\n--space-4: 16px;\nfont-family: Roboto;'

  it('returns an empty array when all imported arrays are empty', () => {
    const node = makeNode()
    const changes = diffFigmaAgainstLayoutMd(node, layoutMd)
    expect(changes).toHaveLength(0)
  })

  it('returns an empty array when layoutMd is an empty string', () => {
    const node = makeNode({
      colours: [{ property: 'fill', hex: '#6750A4', opacity: 1 }],
      spacing: [{ property: 'padding', value: 16 }],
    })
    const changes = diffFigmaAgainstLayoutMd(node, '')
    expect(changes).toHaveLength(0)
  })
})

// ─── applyChangesToLayoutMd ───────────────────────────────────────────────────

describe('applyChangesToLayoutMd — colour changes', () => {
  it('replaces the token value when the change is accepted and has a designTokenMatch', () => {
    const layoutMd = '--color-primary: #6750A4;'
    const changes = [
      {
        type: 'colour' as const,
        property: 'fill',
        before: '#6750A4',
        after: '#6E50A4',
        designTokenMatch: '--color-primary',
        accepted: true,
      },
    ]
    const result = applyChangesToLayoutMd(layoutMd, changes)
    expect(result).toContain('--color-primary: #6E50A4')
  })

  it('does not modify the markdown when the change is not accepted', () => {
    const layoutMd = '--color-primary: #6750A4;'
    const changes = [
      {
        type: 'colour' as const,
        property: 'fill',
        before: '#6750A4',
        after: '#6E50A4',
        designTokenMatch: '--color-primary',
        accepted: false,
      },
    ]
    const result = applyChangesToLayoutMd(layoutMd, changes)
    expect(result).toBe(layoutMd)
  })

  it('does not modify the markdown when designTokenMatch is absent', () => {
    const layoutMd = '--color-primary: #6750A4;'
    const changes = [
      {
        type: 'colour' as const,
        property: 'fill',
        before: '#6750A4',
        after: '#6E50A4',
        accepted: true,
        // no designTokenMatch
      },
    ]
    const result = applyChangesToLayoutMd(layoutMd, changes)
    expect(result).toBe(layoutMd)
  })

  it('applies multiple accepted colour changes', () => {
    const layoutMd = '--color-primary: #6750A4;\n--color-surface: #FFFBFE;'
    const changes = [
      {
        type: 'colour' as const,
        property: 'fill',
        before: '#6750A4',
        after: '#6E50A4',
        designTokenMatch: '--color-primary',
        accepted: true,
      },
      {
        type: 'colour' as const,
        property: 'background',
        before: '#FFFBFE',
        after: '#FFFFFF',
        designTokenMatch: '--color-surface',
        accepted: true,
      },
    ]
    const result = applyChangesToLayoutMd(layoutMd, changes)
    expect(result).toContain('--color-primary: #6E50A4')
    expect(result).toContain('--color-surface: #FFFFFF')
  })
})

describe('applyChangesToLayoutMd — spacing changes', () => {
  it('replaces the token value for an accepted spacing change', () => {
    const layoutMd = '--space-4: 16px;'
    const changes = [
      {
        type: 'spacing' as const,
        property: 'padding',
        before: '16px',
        after: '18px',
        designTokenMatch: '--space-4',
        accepted: true,
      },
    ]
    const result = applyChangesToLayoutMd(layoutMd, changes)
    expect(result).toContain('--space-4: 18px')
  })

  it('does not touch unaccepted spacing changes', () => {
    const layoutMd = '--space-4: 16px;'
    const changes = [
      {
        type: 'spacing' as const,
        property: 'padding',
        before: '16px',
        after: '18px',
        designTokenMatch: '--space-4',
        accepted: false,
      },
    ]
    const result = applyChangesToLayoutMd(layoutMd, changes)
    expect(result).toBe(layoutMd)
  })
})

describe('applyChangesToLayoutMd — mixed accepted / not-accepted', () => {
  it('only applies accepted changes and leaves rejected ones unchanged', () => {
    const layoutMd = '--color-primary: #6750A4;\n--space-4: 16px;'
    const changes = [
      {
        type: 'colour' as const,
        property: 'fill',
        before: '#6750A4',
        after: '#6E50A4',
        designTokenMatch: '--color-primary',
        accepted: true,
      },
      {
        type: 'spacing' as const,
        property: 'padding',
        before: '16px',
        after: '18px',
        designTokenMatch: '--space-4',
        accepted: false,
      },
    ]
    const result = applyChangesToLayoutMd(layoutMd, changes)
    expect(result).toContain('--color-primary: #6E50A4')
    expect(result).toContain('--space-4: 16px')
  })

  it('returns the original string unchanged when no changes are accepted', () => {
    const layoutMd = '--color-primary: #6750A4;'
    const result = applyChangesToLayoutMd(layoutMd, [])
    expect(result).toBe(layoutMd)
  })
})
