import { describe, it, expect } from 'vitest';
import { replaceTokenInLayoutMd } from './replace-token';

const md = (cssBody: string) => `# Colours\n\n\`\`\`css\n${cssBody}\n\`\`\`\n`;

describe('replaceTokenInLayoutMd', () => {
  it('replaces a token value and returns updated markdown', () => {
    const input = md('--color-primary: #6750A4;');
    const result = replaceTokenInLayoutMd(input, '--color-primary', '#000000');
    expect(result).toContain('--color-primary: #000000;');
  });

  it('returns null when the token name is not found', () => {
    const input = md('--color-primary: #6750A4;');
    const result = replaceTokenInLayoutMd(input, '--color-missing', '#000000');
    expect(result).toBeNull();
  });

  it('does not modify anything outside the CSS block', () => {
    const input = `# Header\n\`\`\`css\n--space-4: 16px;\n\`\`\`\n\nSome prose about --space-4.`;
    const result = replaceTokenInLayoutMd(input, '--space-4', '20px');
    expect(result).toContain('Some prose about --space-4.');
    expect(result).toContain('--space-4: 20px;');
  });

  it('preserves surrounding tokens when replacing one', () => {
    const input = md('--color-a: #111;\n--color-b: #222;\n--color-c: #333;');
    const result = replaceTokenInLayoutMd(input, '--color-b', '#999');
    expect(result).toContain('--color-a: #111;');
    expect(result).toContain('--color-b: #999;');
    expect(result).toContain('--color-c: #333;');
  });

  it('handles replacement with a longer new value (offset tracking)', () => {
    const input = md('--space-xs: 4px;\n--space-sm: 8px;');
    const result = replaceTokenInLayoutMd(input, '--space-xs', '400000px');
    expect(result).toContain('--space-xs: 400000px;');
    expect(result).toContain('--space-sm: 8px;');
  });

  it('handles replacement with a shorter new value (offset tracking)', () => {
    const input = md('--space-xs: 400000px;\n--space-sm: 8px;');
    const result = replaceTokenInLayoutMd(input, '--space-xs', '4px');
    expect(result).toContain('--space-xs: 4px;');
    expect(result).toContain('--space-sm: 8px;');
  });

  it('replaces the same token across multiple CSS blocks', () => {
    const input =
      '```css\n--color-primary: #aaa;\n```\n\nSome text.\n\n```css\n--color-primary: #bbb;\n```\n';
    const result = replaceTokenInLayoutMd(input, '--color-primary', '#fff');
    const matches = result?.match(/--color-primary: #fff;/g) ?? [];
    expect(matches).toHaveLength(2);
  });

  it('returns the original markdown structure intact (only value changed)', () => {
    const input = md('--radius-md: 12px;');
    const result = replaceTokenInLayoutMd(input, '--radius-md', '8px');
    expect(result).not.toBeNull();
    expect(result).toContain('# Colours');
    expect(result).toContain('```css');
    expect(result).toContain('--radius-md: 8px;');
  });

  it('handles token names with special-regex characters correctly', () => {
    // Dots in names should be escaped, not treated as regex wildcards
    const input = md('--my.token: #abc;\n--myXtoken: #def;');
    // '--my.token' as-is — the function escapes it so it must match literally
    const result = replaceTokenInLayoutMd(input, '--my.token', '#fff');
    // If dot is NOT escaped, '--myXtoken' would also match — verify it doesn't change
    expect(result).toContain('--myXtoken: #def;');
  });

  it('does not match a token that is a prefix of another token name', () => {
    const input = md('--color: #111;\n--color-primary: #222;');
    const result = replaceTokenInLayoutMd(input, '--color', '#999');
    // Only the exact '--color' token should change, not '--color-primary'
    expect(result).toContain('--color-primary: #222;');
    expect(result).toContain('--color: #999;');
  });

  it('handles whitespace variations around the colon', () => {
    const input = md('--space-4  :   16px;');
    const result = replaceTokenInLayoutMd(input, '--space-4', '20px');
    expect(result).not.toBeNull();
    expect(result).toContain('20px');
  });
});
