import { describe, it, expect } from 'vitest';
import { parseTokensFromLayoutMd } from './parse-layout-md';

const wrapCss = (content: string) => `\`\`\`css\n${content}\n\`\`\``;

describe('parseTokensFromLayoutMd', () => {
  it('returns empty arrays for empty markdown', () => {
    const result = parseTokensFromLayoutMd('');
    expect(result.colors).toHaveLength(0);
    expect(result.spacing).toHaveLength(0);
    expect(result.typography).toHaveLength(0);
  });

  it('parses colour tokens by name heuristic', () => {
    const md = wrapCss('--color-primary: #6750A4;');
    const result = parseTokensFromLayoutMd(md);
    expect(result.colors).toHaveLength(1);
    expect(result.colors[0]).toMatchObject({ name: '--color-primary', value: '#6750A4', type: 'color' });
  });

  it('parses spacing tokens', () => {
    const md = wrapCss('--space-4: 16px;\n--space-8: 32px;');
    const result = parseTokensFromLayoutMd(md);
    expect(result.spacing).toHaveLength(2);
  });

  it('parses radius tokens', () => {
    const md = wrapCss('--radius-md: 12px;');
    const result = parseTokensFromLayoutMd(md);
    expect(result.radius).toHaveLength(1);
    expect(result.radius[0].type).toBe('radius');
  });

  it('classifies --border-radius as radius, not colour', () => {
    // Order regression: `border` matched before `radius` so 8px got typed as
    // colour and rendered as a white swatch in the All Tokens BORDERS group.
    const md = wrapCss('--border-radius: 8px;\n--corner-radius: 4px;');
    const result = parseTokensFromLayoutMd(md);
    expect(result.radius).toHaveLength(2);
    expect(result.colors).toHaveLength(0);
  });

  it('still classifies --border-color and --border-default as colour', () => {
    // The order swap above must not change colour classification of normal
    // border tokens.
    const md = wrapCss('--border-color: #383838;\n--border-default: #cac4d0;');
    const result = parseTokensFromLayoutMd(md);
    expect(result.colors).toHaveLength(2);
    expect(result.radius).toHaveLength(0);
  });

  it('parses typography tokens (font-family, font-size, line-height)', () => {
    const md = wrapCss(
      '--font-family-sans: "Inter", sans-serif;\n--font-size-lg: 1.125rem;\n--line-height-normal: 1.5;'
    );
    const result = parseTokensFromLayoutMd(md);
    expect(result.typography.length).toBeGreaterThanOrEqual(2);
  });

  it('parses effect tokens (shadow)', () => {
    const md = wrapCss('--shadow-md: 0 4px 8px rgba(0,0,0,0.1);');
    const result = parseTokensFromLayoutMd(md);
    expect(result.effects).toHaveLength(1);
    expect(result.effects[0].type).toBe('effect');
  });

  it('classifies --text-* as colour when value is a hex', () => {
    const md = wrapCss('--text-primary: #1C1B1F;');
    const result = parseTokensFromLayoutMd(md);
    expect(result.colors).toHaveLength(1);
  });

  it('classifies --text-* as typography when value is not a colour', () => {
    const md = wrapCss('--text-size-base: 1rem;');
    const result = parseTokensFromLayoutMd(md);
    expect(result.typography).toHaveLength(1);
  });

  it('deduplicates tokens — later declaration wins', () => {
    const md = wrapCss('--color-primary: #000000;\n--color-primary: #ffffff;');
    const result = parseTokensFromLayoutMd(md);
    expect(result.colors).toHaveLength(1);
    expect(result.colors[0].value).toBe('#ffffff');
  });

  it('tags dark-mode declarations with mode: "dark"', () => {
    const md = wrapCss(
      ':root { --color-bg: #ffffff; }\n[data-theme="dark"] { --color-bg: #0c0c0e; }'
    );
    const result = parseTokensFromLayoutMd(md);
    const darkToken = result.colors.find((t) => t.mode === 'dark');
    expect(darkToken).toBeDefined();
    expect(darkToken?.value).toBe('#0c0c0e');
  });

  it('ignores markdown outside fenced CSS blocks', () => {
    const md = `# My Design System\n--color-bg: #fff;\nSome prose text.\n${wrapCss('--color-primary: #6750A4;')}`;
    const result = parseTokensFromLayoutMd(md);
    // Only the fenced block token should be captured
    expect(result.colors).toHaveLength(1);
    expect(result.colors[0].name).toBe('--color-primary');
  });

  it('handles rgba() colour values', () => {
    const md = wrapCss('--color-overlay: rgba(0,0,0,0.5);');
    const result = parseTokensFromLayoutMd(md);
    expect(result.colors).toHaveLength(1);
  });

  it('falls back to value-based colour detection for non-descriptive names', () => {
    const md = wrapCss('--my-custom-token: #abcdef;');
    const result = parseTokensFromLayoutMd(md);
    expect(result.colors).toHaveLength(1);
  });

  it('ignores tokens it cannot classify', () => {
    const md = wrapCss('--mystery-thing: some-unknown-value;');
    const result = parseTokensFromLayoutMd(md);
    const total =
      result.colors.length + result.spacing.length + result.typography.length +
      result.radius.length + result.effects.length + result.motion.length;
    expect(total).toBe(0);
  });
});
