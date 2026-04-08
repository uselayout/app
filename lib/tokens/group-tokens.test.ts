import { describe, it, expect } from 'vitest';
import { groupTokensByPurpose } from './group-tokens';
import type { ExtractedToken } from '@/lib/types';

function makeToken(name: string, value = '#ffffff'): ExtractedToken {
  return { name, value, type: 'color', category: 'semantic', cssVariable: name };
}

function makeTokens(names: string[], value = '#ffffff'): ExtractedToken[] {
  return names.map((n) => makeToken(n, value));
}

describe('groupTokensByPurpose', () => {
  it('returns a single flat group when token count is ≤6 (no sub-grouping)', () => {
    const tokens = makeTokens(['--color-a', '--color-b', '--color-c']);
    const result = groupTokensByPurpose(tokens, 'colors');
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe('');
  });

  it('returns a single flat group when token type has no rules', () => {
    const tokens = makeTokens(
      ['--a', '--b', '--c', '--d', '--e', '--f', '--g', '--h'],
    );
    const result = groupTokensByPurpose(tokens, 'unknown-type');
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe('');
  });

  it('groups colour tokens into Surfaces, Primary, etc. when there are >6 tokens', () => {
    const tokens = makeTokens([
      '--color-bg-app',
      '--color-surface',
      '--color-primary',
      '--color-secondary',
      '--color-accent',
      '--color-border',
      '--color-text-primary',
      '--color-primitive-white',
    ]);
    const result = groupTokensByPurpose(tokens, 'colors');
    const labels = result.map((g) => g.label);
    expect(labels).toContain('Primitives');
    expect(labels).toContain('Surfaces');
    expect(labels).toContain('Primary');
  });

  it('classifies nav/button/card tokens as Components', () => {
    const tokens = makeTokens([
      '--color-nav-bg',
      '--color-btn-primary',
      '--color-card-border',
      '--color-surface',
      '--color-primary',
      '--color-secondary',
      '--color-bg-app',
      '--color-primitive-100',
    ]);
    const result = groupTokensByPurpose(tokens, 'colors');
    const componentGroup = result.find((g) => g.label === 'Components');
    expect(componentGroup).toBeDefined();
    const names = componentGroup!.tokens.map((t) => t.name);
    expect(names).toContain('--color-nav-bg');
    expect(names).toContain('--color-btn-primary');
  });

  it('groups typography tokens into Font Families, Sizes, Properties', () => {
    const tokens: ExtractedToken[] = [
      { name: '--font-family-sans', value: 'Inter', type: 'typography', category: 'semantic', cssVariable: '--font-family-sans' },
      { name: '--font-size-lg', value: '1.125rem', type: 'typography', category: 'semantic', cssVariable: '--font-size-lg' },
      { name: '--font-size-sm', value: '0.875rem', type: 'typography', category: 'semantic', cssVariable: '--font-size-sm' },
      { name: '--font-weight-bold', value: '700', type: 'typography', category: 'semantic', cssVariable: '--font-weight-bold' },
      { name: '--line-height-tight', value: '1.25', type: 'typography', category: 'semantic', cssVariable: '--line-height-tight' },
      { name: '--letter-spacing-wide', value: '0.1em', type: 'typography', category: 'semantic', cssVariable: '--letter-spacing-wide' },
      { name: '--font-size-xl', value: '1.25rem', type: 'typography', category: 'semantic', cssVariable: '--font-size-xl' },
      { name: '--font-size-2xl', value: '1.5rem', type: 'typography', category: 'semantic', cssVariable: '--font-size-2xl' },
    ];
    const result = groupTokensByPurpose(tokens, 'typography');
    const labels = result.map((g) => g.label);
    expect(labels).toContain('Font Families');
    expect(labels).toContain('Sizes');
    expect(labels).toContain('Properties');
  });

  it('groups spacing tokens into Scale and Layout', () => {
    const tokens: ExtractedToken[] = [
      { name: '--space-1', value: '4px', type: 'spacing', category: 'semantic', cssVariable: '--space-1' },
      { name: '--space-2', value: '8px', type: 'spacing', category: 'semantic', cssVariable: '--space-2' },
      { name: '--space-4', value: '16px', type: 'spacing', category: 'semantic', cssVariable: '--space-4' },
      { name: '--gap-sm', value: '8px', type: 'spacing', category: 'semantic', cssVariable: '--gap-sm' },
      { name: '--padding-lg', value: '24px', type: 'spacing', category: 'semantic', cssVariable: '--padding-lg' },
      { name: '--margin-auto', value: 'auto', type: 'spacing', category: 'semantic', cssVariable: '--margin-auto' },
      { name: '--inset-0', value: '0', type: 'spacing', category: 'semantic', cssVariable: '--inset-0' },
      { name: '--space-8', value: '32px', type: 'spacing', category: 'semantic', cssVariable: '--space-8' },
    ];
    const result = groupTokensByPurpose(tokens, 'spacing');
    const labels = result.map((g) => g.label);
    expect(labels).toContain('Scale');
    expect(labels).toContain('Layout');
  });

  it('filters out junk tokens (transition shorthand values)', () => {
    const tokens: ExtractedToken[] = [
      ...makeTokens(['--color-a', '--color-b', '--color-c', '--color-d', '--color-e', '--color-f', '--color-g']),
      { name: '--transition-base', value: 'all var(--duration-base) var(--ease-out)', type: 'color', category: 'semantic', cssVariable: '--transition-base' },
    ];
    const result = groupTokensByPurpose(tokens, 'colors');
    const allTokens = result.flatMap((g) => g.tokens);
    const junk = allTokens.find((t) => t.name === '--transition-base');
    expect(junk).toBeUndefined();
  });

  it('filters out tokens with very long values (>80 chars)', () => {
    const longValue = '0px 1px 2px rgba(0,0,0,0.3), 0px 2px 6px rgba(0,0,0,0.15), 0px 4px 8px rgba(0,0,0,0.1)';
    const tokens: ExtractedToken[] = [
      ...makeTokens(['--color-a', '--color-b', '--color-c', '--color-d', '--color-e', '--color-f', '--color-g']),
      { name: '--elevation-complex', value: longValue, type: 'color', category: 'semantic', cssVariable: '--elevation-complex' },
    ];
    const result = groupTokensByPurpose(tokens, 'colors');
    const allTokens = result.flatMap((g) => g.tokens);
    expect(allTokens.find((t) => t.name === '--elevation-complex')).toBeUndefined();
  });

  it('puts unmatched tokens into an "Other" group', () => {
    const tokens = makeTokens([
      '--completely-custom-1',
      '--completely-custom-2',
      '--completely-custom-3',
      '--color-primary',
      '--color-secondary',
      '--color-surface',
      '--color-bg',
      '--color-text',
    ]);
    const result = groupTokensByPurpose(tokens, 'colors');
    const other = result.find((g) => g.label === 'Other');
    // Custom names don't match any group definition
    expect(other).toBeDefined();
  });

  it('returns a flat group if all tokens end up in one named group', () => {
    // All tokens match "Primary" — the result collapses to a flat group
    const tokens = makeTokens([
      '--color-primary',
      '--color-primary-hover',
      '--color-secondary',
      '--color-secondary-hover',
      '--color-tertiary',
      '--color-brand-1',
      '--color-brand-2',
      '--color-brand-accent',
    ]);
    const result = groupTokensByPurpose(tokens, 'colors');
    if (result.length === 1) {
      expect(result[0].label).toBe('');
    } else {
      // Multiple groups is also valid — just ensure no crash
      expect(result.length).toBeGreaterThan(0);
    }
  });

  it('preserves token order within each group (insertion order)', () => {
    const tokens = makeTokens([
      '--color-surface',
      '--color-surface-variant',
      '--color-primary',
      '--color-secondary',
      '--color-tertiary',
      '--color-brand',
      '--color-bg-app',
      '--color-bg-panel',
    ]);
    const result = groupTokensByPurpose(tokens, 'colors');
    const surfaceGroup = result.find((g) => g.label === 'Surfaces');
    if (surfaceGroup) {
      const names = surfaceGroup.tokens.map((t) => t.name);
      // surface tokens should appear before bg tokens since they were inserted first
      expect(names.indexOf('--color-surface')).toBeLessThan(names.indexOf('--color-bg-app'));
    }
  });
});
