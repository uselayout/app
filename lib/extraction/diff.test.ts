import { describe, it, expect } from 'vitest';
import { diffExtractions } from './diff';
import type { ExtractionResult, ExtractedToken, ExtractedComponent, FontDeclaration } from '@/lib/types';

function makeToken(
  name: string,
  value: string,
  type: ExtractedToken['type'] = 'color',
  overrides: Partial<ExtractedToken> = {}
): ExtractedToken {
  return { name, value, type, category: 'primitive', ...overrides };
}

function makeComponent(name: string, variantCount = 1, description?: string): ExtractedComponent {
  return { name, variantCount, description };
}

function makeFont(family: string): FontDeclaration {
  return { family, weight: '400', style: 'normal', display: 'swap' };
}

function makeExtractionResult(
  overrides: Partial<ExtractionResult> = {}
): ExtractionResult {
  return {
    sourceType: 'figma',
    sourceName: 'Test',
    tokens: {
      colors: [],
      typography: [],
      spacing: [],
      radius: [],
      effects: [],
      motion: [],
    },
    components: [],
    fonts: [],
    screenshots: [],
    animations: [],
    librariesDetected: {},
    cssVariables: {},
    computedStyles: {},
    ...overrides,
  };
}

describe('diffExtractions', () => {
  it('returns no changes when extractions are identical', () => {
    const token = makeToken('primary', '#fff', 'color');
    const prev = makeExtractionResult({ tokens: { colors: [token], typography: [], spacing: [], radius: [], effects: [], motion: [] } });
    const curr = makeExtractionResult({ tokens: { colors: [token], typography: [], spacing: [], radius: [], effects: [], motion: [] } });
    const diff = diffExtractions(prev, curr);
    expect(diff.tokens.added).toBe(0);
    expect(diff.tokens.removed).toBe(0);
    expect(diff.tokens.modified).toBe(0);
    expect(diff.summary).toBe('No changes detected');
  });

  it('detects added tokens', () => {
    const prev = makeExtractionResult();
    const curr = makeExtractionResult({
      tokens: {
        colors: [makeToken('new', '#123456', 'color')],
        typography: [], spacing: [], radius: [], effects: [], motion: [],
      },
    });
    const diff = diffExtractions(prev, curr);
    expect(diff.tokens.added).toBe(1);
    expect(diff.tokens.changes[0].change).toBe('added');
    expect(diff.tokens.changes[0].currentValue).toBe('#123456');
  });

  it('detects removed tokens', () => {
    const prev = makeExtractionResult({
      tokens: {
        colors: [makeToken('old', '#abcdef', 'color')],
        typography: [], spacing: [], radius: [], effects: [], motion: [],
      },
    });
    const curr = makeExtractionResult();
    const diff = diffExtractions(prev, curr);
    expect(diff.tokens.removed).toBe(1);
    expect(diff.tokens.changes[0].change).toBe('removed');
    expect(diff.tokens.changes[0].previousValue).toBe('#abcdef');
  });

  it('detects modified tokens by value change', () => {
    const prev = makeExtractionResult({
      tokens: {
        colors: [makeToken('primary', '#aaaaaa', 'color')],
        typography: [], spacing: [], radius: [], effects: [], motion: [],
      },
    });
    const curr = makeExtractionResult({
      tokens: {
        colors: [makeToken('primary', '#bbbbbb', 'color')],
        typography: [], spacing: [], radius: [], effects: [], motion: [],
      },
    });
    const diff = diffExtractions(prev, curr);
    expect(diff.tokens.modified).toBe(1);
    expect(diff.tokens.changes[0].change).toBe('modified');
    expect(diff.tokens.changes[0].previousValue).toBe('#aaaaaa');
    expect(diff.tokens.changes[0].currentValue).toBe('#bbbbbb');
  });

  it('keys tokens by cssVariable when available, not just name', () => {
    const prev = makeExtractionResult({
      tokens: {
        colors: [makeToken('primary', '#aaa', 'color', { cssVariable: '--color-primary' })],
        typography: [], spacing: [], radius: [], effects: [], motion: [],
      },
    });
    const curr = makeExtractionResult({
      tokens: {
        colors: [makeToken('primary', '#bbb', 'color', { cssVariable: '--color-primary' })],
        typography: [], spacing: [], radius: [], effects: [], motion: [],
      },
    });
    const diff = diffExtractions(prev, curr);
    expect(diff.tokens.modified).toBe(1);
  });

  it('differentiates tokens by mode suffix in key', () => {
    const prev = makeExtractionResult({
      tokens: {
        colors: [makeToken('primary', '#fff', 'color', { mode: 'light' })],
        typography: [], spacing: [], radius: [], effects: [], motion: [],
      },
    });
    const curr = makeExtractionResult({
      tokens: {
        colors: [makeToken('primary', '#000', 'color', { mode: 'dark' })],
        typography: [], spacing: [], radius: [], effects: [], motion: [],
      },
    });
    const diff = diffExtractions(prev, curr);
    // light token is removed, dark token is added
    expect(diff.tokens.added).toBe(1);
    expect(diff.tokens.removed).toBe(1);
  });

  it('detects added components', () => {
    const prev = makeExtractionResult();
    const curr = makeExtractionResult({ components: [makeComponent('Button')] });
    const diff = diffExtractions(prev, curr);
    expect(diff.components.added).toBe(1);
    expect(diff.components.changes[0].change).toBe('added');
    expect(diff.components.changes[0].name).toBe('Button');
  });

  it('detects removed components', () => {
    const prev = makeExtractionResult({ components: [makeComponent('Modal')] });
    const curr = makeExtractionResult();
    const diff = diffExtractions(prev, curr);
    expect(diff.components.removed).toBe(1);
    expect(diff.components.changes[0].change).toBe('removed');
  });

  it('detects modified component variant count', () => {
    const prev = makeExtractionResult({ components: [makeComponent('Button', 2)] });
    const curr = makeExtractionResult({ components: [makeComponent('Button', 5)] });
    const diff = diffExtractions(prev, curr);
    expect(diff.components.modified).toBe(1);
    expect(diff.components.changes[0].details).toContain('variants: 2 -> 5');
  });

  it('detects modified component description', () => {
    const prev = makeExtractionResult({ components: [makeComponent('Card', 1, 'old desc')] });
    const curr = makeExtractionResult({ components: [makeComponent('Card', 1, 'new desc')] });
    const diff = diffExtractions(prev, curr);
    expect(diff.components.modified).toBe(1);
    expect(diff.components.changes[0].details).toContain('description changed');
  });

  it('detects added and removed fonts', () => {
    const prev = makeExtractionResult({ fonts: [makeFont('Roboto')] });
    const curr = makeExtractionResult({ fonts: [makeFont('Inter')] });
    const diff = diffExtractions(prev, curr);
    expect(diff.fonts.added).toContain('Inter');
    expect(diff.fonts.removed).toContain('Roboto');
  });

  it('builds summary string describing all changes', () => {
    const prev = makeExtractionResult({ fonts: [makeFont('Old Font')] });
    const curr = makeExtractionResult({
      tokens: {
        colors: [makeToken('new-color', '#fff', 'color')],
        typography: [], spacing: [], radius: [], effects: [], motion: [],
      },
      components: [makeComponent('Button')],
      fonts: [makeFont('New Font')],
    });
    const diff = diffExtractions(prev, curr);
    expect(diff.summary).toContain('token');
    expect(diff.summary).toContain('component');
    expect(diff.summary).toContain('font');
  });

  it('uses singular vs plural correctly in summary', () => {
    const prev = makeExtractionResult();
    const curr = makeExtractionResult({
      tokens: {
        colors: [makeToken('x', '#fff', 'color')],
        typography: [], spacing: [], radius: [], effects: [], motion: [],
      },
    });
    const diff = diffExtractions(prev, curr);
    expect(diff.summary).toContain('1 token changed');
  });
});
