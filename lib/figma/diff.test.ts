import { describe, it, expect } from 'vitest';
import { diffFigmaAgainstLayoutMd, applyChangesToLayoutMd } from './diff';
import type { ImportedNodeData } from './import';

function makeImportedNode(overrides: Partial<ImportedNodeData> = {}): ImportedNodeData {
  return {
    nodeId: 'node-1',
    name: 'Test Frame',
    screenshotUrl: null,
    colours: [],
    typography: [],
    spacing: [],
    texts: [],
    layout: null,
    dimensions: null,
    ...overrides,
  };
}

const LAYOUT_MD_WITH_COLOURS = `
## Colours

\`\`\`css
:root {
  --color-primary: #6750A4;
  --color-surface: #FFFBFE;
  --color-error: #B3261E;
}
\`\`\`
`;

const LAYOUT_MD_WITH_SPACING = `
## Spacing

\`\`\`css
:root {
  --space-4: 16px;
  --space-8: 32px;
}
\`\`\`
`;

describe('diffFigmaAgainstLayoutMd', () => {
  it('returns empty array when imported node has no data', () => {
    const node = makeImportedNode();
    const changes = diffFigmaAgainstLayoutMd(node, LAYOUT_MD_WITH_COLOURS);
    expect(changes).toEqual([]);
  });

  it('returns no changes when colour exactly matches a token', () => {
    const node = makeImportedNode({
      colours: [{ property: 'fill', hex: '#6750A4', opacity: 1 }],
    });
    const changes = diffFigmaAgainstLayoutMd(node, LAYOUT_MD_WITH_COLOURS);
    // Exact match — should produce no diff
    expect(changes.filter((c) => c.type === 'colour')).toHaveLength(0);
  });

  it('detects a colour diff when imported hex is close but not identical to token', () => {
    const node = makeImportedNode({
      colours: [{ property: 'fill', hex: '#6851A5', opacity: 1 }], // close to #6750A4
    });
    const changes = diffFigmaAgainstLayoutMd(node, LAYOUT_MD_WITH_COLOURS);
    const colourChanges = changes.filter((c) => c.type === 'colour');
    expect(colourChanges.length).toBeGreaterThan(0);
    expect(colourChanges[0].after).toBe('#6851A5');
    expect(colourChanges[0].accepted).toBe(false);
  });

  it('returns no changes when colour is far from all tokens (distance > 50)', () => {
    const node = makeImportedNode({
      colours: [{ property: 'fill', hex: '#00FF00', opacity: 1 }], // very far from all tokens
    });
    const changes = diffFigmaAgainstLayoutMd(node, LAYOUT_MD_WITH_COLOURS);
    expect(changes.filter((c) => c.type === 'colour')).toHaveLength(0);
  });

  it('detects spacing diff when value is close to a token but different', () => {
    const node = makeImportedNode({
      spacing: [{ property: 'gap', value: 14 }], // close to 16px token
    });
    const changes = diffFigmaAgainstLayoutMd(node, LAYOUT_MD_WITH_SPACING);
    const spacingChanges = changes.filter((c) => c.type === 'spacing');
    expect(spacingChanges.length).toBeGreaterThan(0);
    expect(spacingChanges[0].after).toBe('14px');
    expect(spacingChanges[0].before).toBe('16px');
  });

  it('returns no spacing diff when value exactly matches token', () => {
    const node = makeImportedNode({
      spacing: [{ property: 'gap', value: 16 }],
    });
    const changes = diffFigmaAgainstLayoutMd(node, LAYOUT_MD_WITH_SPACING);
    expect(changes.filter((c) => c.type === 'spacing')).toHaveLength(0);
  });

  it('returns no spacing diff when value is far from all tokens (diff >= 8)', () => {
    const node = makeImportedNode({
      spacing: [{ property: 'margin', value: 100 }],
    });
    const changes = diffFigmaAgainstLayoutMd(node, LAYOUT_MD_WITH_SPACING);
    expect(changes.filter((c) => c.type === 'spacing')).toHaveLength(0);
  });

  it('detects typography diff when font family is in the layout.md', () => {
    const layoutMd = `
## Typography

font-family: Roboto, sans-serif;
`;
    const node = makeImportedNode({
      typography: [{ property: 'text', fontFamily: 'Roboto', fontSize: 20, fontWeight: 700 }],
    });
    const changes = diffFigmaAgainstLayoutMd(node, layoutMd);
    // Roboto found in layout.md; size/weight differs from default (16/400) so there should be a diff
    const typoChanges = changes.filter((c) => c.type === 'typography');
    expect(typoChanges.length).toBeGreaterThan(0);
  });

  it('returns no typography diff when font family is not in the layout.md', () => {
    const node = makeImportedNode({
      typography: [{ property: 'text', fontFamily: 'Comic Sans', fontSize: 14, fontWeight: 400 }],
    });
    const changes = diffFigmaAgainstLayoutMd(node, LAYOUT_MD_WITH_COLOURS);
    expect(changes.filter((c) => c.type === 'typography')).toHaveLength(0);
  });

  it('sets accepted:false on all returned changes', () => {
    const node = makeImportedNode({
      colours: [{ property: 'fill', hex: '#6851A5', opacity: 1 }],
    });
    const changes = diffFigmaAgainstLayoutMd(node, LAYOUT_MD_WITH_COLOURS);
    for (const change of changes) {
      expect(change.accepted).toBe(false);
    }
  });

  it('includes designTokenMatch referencing the CSS variable name', () => {
    const node = makeImportedNode({
      spacing: [{ property: 'gap', value: 14 }],
    });
    const changes = diffFigmaAgainstLayoutMd(node, LAYOUT_MD_WITH_SPACING);
    const spacingChanges = changes.filter((c) => c.type === 'spacing');
    if (spacingChanges.length > 0) {
      expect(spacingChanges[0].designTokenMatch).toMatch(/--space/);
    }
  });
});

describe('applyChangesToLayoutMd', () => {
  it('returns unchanged layoutMd when no changes are accepted', () => {
    const md = '--color-primary: #6750A4;';
    const changes = [
      { type: 'colour' as const, property: 'fill', before: '#6750A4', after: '#6851A5', designTokenMatch: '--color-primary', accepted: false },
    ];
    expect(applyChangesToLayoutMd(md, changes)).toBe(md);
  });

  it('replaces token value in layoutMd for an accepted colour change', () => {
    const md = '--color-primary: #6750A4;';
    const changes = [
      { type: 'colour' as const, property: 'fill', before: '#6750A4', after: '#6851A5', designTokenMatch: '--color-primary', accepted: true },
    ];
    const result = applyChangesToLayoutMd(md, changes);
    expect(result).toContain('--color-primary: #6851A5');
  });

  it('replaces token value for an accepted spacing change', () => {
    const md = '--space-4: 16px;';
    const changes = [
      { type: 'spacing' as const, property: 'gap', before: '16px', after: '14px', designTokenMatch: '--space-4', accepted: true },
    ];
    const result = applyChangesToLayoutMd(md, changes);
    expect(result).toContain('--space-4: 14px');
  });

  it('does not modify typography changes (only colour and spacing are applied)', () => {
    const md = 'font-family: Roboto;';
    const changes = [
      { type: 'typography' as const, property: 'text', before: 'Roboto 400 16px', after: 'Inter 400 16px', designTokenMatch: '--font-roboto', accepted: true },
    ];
    const result = applyChangesToLayoutMd(md, changes);
    // Typography is not handled by applyChangesToLayoutMd
    expect(result).toBe(md);
  });

  it('skips changes without a designTokenMatch', () => {
    const md = '--color-primary: #6750A4;';
    const changes = [
      { type: 'colour' as const, property: 'fill', before: '#6750A4', after: '#fff', accepted: true },
    ];
    expect(applyChangesToLayoutMd(md, changes)).toBe(md);
  });

  it('applies multiple accepted changes', () => {
    const md = '--color-primary: #6750A4;\n--space-4: 16px;';
    const changes = [
      { type: 'colour' as const, property: 'fill', before: '#6750A4', after: '#aabbcc', designTokenMatch: '--color-primary', accepted: true },
      { type: 'spacing' as const, property: 'gap', before: '16px', after: '12px', designTokenMatch: '--space-4', accepted: true },
    ];
    const result = applyChangesToLayoutMd(md, changes);
    expect(result).toContain('--color-primary: #aabbcc');
    expect(result).toContain('--space-4: 12px');
  });
});
