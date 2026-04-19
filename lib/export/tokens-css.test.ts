import { describe, it, expect } from 'vitest';
import { generateTokensCss } from './tokens-css';
import type { ExtractedTokens, ExtractedToken } from '@/lib/types';

function makeTokens(overrides: Partial<ExtractedTokens> = {}): ExtractedTokens {
  return {
    colors: [],
    typography: [],
    spacing: [],
    radius: [],
    effects: [],
    motion: [],
    ...overrides,
  };
}

function makeToken(
  name: string,
  value: string,
  type: ExtractedToken['type'] = 'color',
  overrides: Partial<ExtractedToken> = {}
): ExtractedToken {
  return {
    name,
    value,
    type,
    category: 'primitive',
    ...overrides,
  };
}

describe('generateTokensCss', () => {
  it('returns empty string when there are no tokens (blank project)', () => {
    const css = generateTokensCss(makeTokens());
    expect(css).toBe('');
  });

  it('wraps non-empty output in a :root block', () => {
    const tokens = makeTokens({
      colors: [makeToken('Primary', '#6750A4', 'color', { cssVariable: '--color-primary' })],
    });
    const css = generateTokensCss(tokens);
    expect(css).toMatch(/^:root \{/);
    expect(css).toMatch(/\}$/);
  });

  it('generates colour variable from cssVariable when provided', () => {
    const tokens = makeTokens({
      colors: [makeToken('Primary', '#6750A4', 'color', { cssVariable: '--color-primary' })],
    });
    const css = generateTokensCss(tokens);
    expect(css).toContain('--color-primary: #6750A4;');
  });

  it('derives variable name from token name when cssVariable is absent', () => {
    const tokens = makeTokens({
      colors: [makeToken('Brand Blue', '#0000ff', 'color')],
    });
    const css = generateTokensCss(tokens);
    expect(css).toContain('--color-brand-blue: #0000ff;');
  });

  it('normalises slashes and spaces in token name to hyphens', () => {
    const tokens = makeTokens({
      spacing: [makeToken('space/4', '16px', 'spacing')],
    });
    const css = generateTokensCss(tokens);
    expect(css).toContain('--space-space-4: 16px;');
  });

  it('emits section comment headers for each category', () => {
    const tokens = makeTokens({
      colors: [makeToken('c', '#fff', 'color')],
      spacing: [makeToken('s', '8px', 'spacing')],
    });
    const css = generateTokensCss(tokens);
    expect(css).toContain('/* === COLOURS === */');
    expect(css).toContain('/* === SPACING === */');
  });

  it('skips empty categories entirely (no comment header)', () => {
    const tokens = makeTokens({
      colors: [makeToken('c', '#fff', 'color')],
    });
    const css = generateTokensCss(tokens);
    expect(css).not.toContain('/* === TYPOGRAPHY === */');
  });

  it('filters out mode tokens from :root block', () => {
    const tokens = makeTokens({
      colors: [
        makeToken('primary', '#fff', 'color', { cssVariable: '--color-primary' }),
        makeToken('primary', '#000', 'color', { mode: 'dark', cssVariable: '--color-primary' }),
      ],
    });
    const css = generateTokensCss(tokens);
    // Extract only the :root { ... } block (everything before the first closing brace)
    const rootBlock = css.slice(0, css.indexOf('\n}') + 2);
    const declarations = rootBlock.split('\n').filter((l) => l.includes('--color-primary'));
    expect(declarations.length).toBe(1);
  });

  it('emits [data-theme="dark"] block for dark mode tokens', () => {
    const tokens = makeTokens({
      colors: [makeToken('primary', '#000', 'color', { mode: 'dark', cssVariable: '--color-primary' })],
    });
    const css = generateTokensCss(tokens);
    expect(css).toContain('[data-theme="dark"] {');
    expect(css).toContain('--color-primary: #000;');
  });

  it('emits @media (prefers-color-scheme: dark) block only for dark mode', () => {
    const tokens = makeTokens({
      colors: [makeToken('primary', '#000', 'color', { mode: 'dark', cssVariable: '--color-primary' })],
    });
    const css = generateTokensCss(tokens);
    expect(css).toContain('@media (prefers-color-scheme: dark)');
    expect(css).toContain('  :root {');
  });

  it('does NOT emit @media block for non-dark modes', () => {
    const tokens = makeTokens({
      colors: [makeToken('primary', '#fff', 'color', { mode: 'light', cssVariable: '--color-primary' })],
    });
    const css = generateTokensCss(tokens);
    expect(css).toContain('[data-theme="light"]');
    expect(css).not.toContain('@media (prefers-color-scheme:');
  });

  it('groups multiple mode tokens under the same data-theme block', () => {
    const tokens = makeTokens({
      colors: [
        makeToken('bg', '#111', 'color', { mode: 'dark', cssVariable: '--color-bg' }),
        makeToken('fg', '#eee', 'color', { mode: 'dark', cssVariable: '--color-fg' }),
      ],
    });
    const css = generateTokensCss(tokens);
    const darkBlocks = css.split('[data-theme="dark"]').length - 1;
    expect(darkBlocks).toBe(1);
    expect(css).toContain('--color-bg: #111;');
    expect(css).toContain('--color-fg: #eee;');
  });

  it('handles all token categories present without error', () => {
    const tokens = makeTokens({
      colors: [makeToken('c', '#fff', 'color')],
      typography: [makeToken('t', 'Roboto', 'typography')],
      spacing: [makeToken('s', '8px', 'spacing')],
      radius: [makeToken('r', '4px', 'radius')],
      effects: [makeToken('e', '0 1px 2px rgba(0,0,0,.2)', 'effect')],
      motion: [makeToken('m', '150ms', 'motion')],
    });
    expect(() => generateTokensCss(tokens)).not.toThrow();
    const css = generateTokensCss(tokens);
    expect(css).toContain('/* === COLOURS === */');
    expect(css).toContain('/* === MOTION === */');
  });
});
