import { describe, it, expect } from 'vitest';
import { parseVariants, parsePartialVariants, countCompleteVariants } from './parse-variants';

const makeVariantBlock = (index: number, name: string, code: string, rationale = '') =>
  `### Variant ${index}: ${name}\n${rationale ? rationale + '\n' : ''}\`\`\`tsx\n${code}\n\`\`\`\n`;

const SINGLE_VARIANT = makeVariantBlock(1, 'Bold Hero', 'export default function V1() { return <div>Hello</div>; }', 'A bold hero section.');

const TWO_VARIANTS =
  makeVariantBlock(1, 'Bold Hero', 'export default function V1() { return <div>Hero</div>; }', 'High impact.') +
  '\n' +
  makeVariantBlock(2, 'Minimal', 'export default function V2() { return <div>Minimal</div>; }', 'Clean and simple.');

describe('parseVariants', () => {
  it('parses a single variant with name, rationale, and code', () => {
    const result = parseVariants(SINGLE_VARIANT);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Bold Hero');
    expect(result[0].rationale).toBe('A bold hero section.');
    expect(result[0].code).toContain('return <div>Hello</div>');
  });

  it('parses multiple variants from a single stream', () => {
    const result = parseVariants(TWO_VARIANTS);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Bold Hero');
    expect(result[1].name).toBe('Minimal');
  });

  it('assigns sequential ids starting from variant-0 by default', () => {
    const result = parseVariants(TWO_VARIANTS);
    expect(result[0].id).toBe('variant-0');
    expect(result[1].id).toBe('variant-1');
  });

  it('respects idOffset option', () => {
    const result = parseVariants(TWO_VARIANTS, { idOffset: 5 });
    expect(result[0].id).toBe('variant-5');
    expect(result[1].id).toBe('variant-6');
  });

  it('attaches batchId and batchPrompt when provided', () => {
    const result = parseVariants(SINGLE_VARIANT, { batchId: 'batch-1', batchPrompt: 'Create a hero' });
    expect(result[0].batchId).toBe('batch-1');
    expect(result[0].batchPrompt).toBe('Create a hero');
  });

  it('omits batchId/batchPrompt when not provided', () => {
    const result = parseVariants(SINGLE_VARIANT);
    expect(result[0].batchId).toBeUndefined();
    expect(result[0].batchPrompt).toBeUndefined();
  });

  it('skips variants that have no code block', () => {
    const output = '### Variant 1: Empty\nNo code here at all.\n';
    const result = parseVariants(output);
    expect(result).toHaveLength(0);
  });

  it('returns empty array for empty string', () => {
    expect(parseVariants('')).toHaveLength(0);
  });

  it('handles typescript and jsx fence labels as well as tsx', () => {
    const output = '### Variant 1: TS\n```typescript\nexport default function V() { return null; }\n```\n';
    const result = parseVariants(output);
    expect(result).toHaveLength(1);
    expect(result[0].code).toContain('return null');
  });

  it('trims whitespace from extracted code', () => {
    const output = '### Variant 1: Trim\n```tsx\n\n  const x = 1;\n\n```\n';
    const result = parseVariants(output);
    expect(result[0].code).toBe('const x = 1;');
  });
});

describe('parsePartialVariants', () => {
  it('returns a complete variant when the code block is closed', () => {
    const result = parsePartialVariants(SINGLE_VARIANT);
    expect(result).toHaveLength(1);
    expect(result[0].isComplete).toBe(true);
    expect(result[0].codeInProgress).toContain('return <div>Hello</div>');
  });

  it('returns an incomplete variant when the code block is still open', () => {
    const partial = '### Variant 1: Streaming\nSome rationale\n```tsx\nexport default function V() {\n  return <div';
    const result = parsePartialVariants(partial);
    expect(result).toHaveLength(1);
    expect(result[0].isComplete).toBe(false);
    expect(result[0].codeInProgress).toContain('return <div');
  });

  it('returns a variant with empty codeInProgress when no code block has started', () => {
    const output = '### Variant 1: NoCode\nJust some rationale text.\n';
    const result = parsePartialVariants(output);
    expect(result).toHaveLength(1);
    expect(result[0].codeInProgress).toBe('');
    expect(result[0].isComplete).toBe(false);
  });

  it('assigns correct index values', () => {
    const result = parsePartialVariants(TWO_VARIANTS);
    expect(result[0].index).toBe(0);
    expect(result[1].index).toBe(1);
  });

  it('extracts rationale for partial variants', () => {
    const partial = '### Variant 1: Hero\nThis is the rationale.\n```tsx\nconst x = 1';
    const result = parsePartialVariants(partial);
    expect(result[0].rationale).toBe('This is the rationale.');
  });

  it('returns null rationale when there is no text before the code block', () => {
    const output = '### Variant 1: Direct\n```tsx\nexport default function V() { return null; }\n```\n';
    const result = parsePartialVariants(output);
    expect(result[0].rationale).toBeNull();
  });

  it('returns empty array for output with no variant headings', () => {
    const result = parsePartialVariants('Some preamble text with no headings.');
    expect(result).toHaveLength(0);
  });

  it('handles a mix of complete and incomplete variants', () => {
    const mixed =
      makeVariantBlock(1, 'Complete', 'export default function C() { return <div />; }', 'Done.') +
      '### Variant 2: Streaming\nIn progress\n```tsx\nexport default function S() {\n  return <div';
    const result = parsePartialVariants(mixed);
    expect(result).toHaveLength(2);
    expect(result[0].isComplete).toBe(true);
    expect(result[1].isComplete).toBe(false);
  });
});

describe('countCompleteVariants', () => {
  it('returns 0 for empty string', () => {
    expect(countCompleteVariants('')).toBe(0);
  });

  it('returns 1 for a single complete variant', () => {
    expect(countCompleteVariants(SINGLE_VARIANT)).toBe(1);
  });

  it('returns 2 for two complete variants', () => {
    expect(countCompleteVariants(TWO_VARIANTS)).toBe(2);
  });

  it('returns 1 when one variant is complete and one is still streaming', () => {
    const mixed =
      makeVariantBlock(1, 'Complete', 'export default function C() { return null; }') +
      '### Variant 2: Streaming\n```tsx\nexport default function S() {\n  return <div';
    expect(countCompleteVariants(mixed)).toBe(1);
  });

  it('returns 0 when there are headings but no closed code blocks', () => {
    const output = '### Variant 1: Streaming\n```tsx\nexport default function S() {\n  return <div';
    expect(countCompleteVariants(output)).toBe(0);
  });

  it('returns 0 when there are closed code blocks but no variant headings', () => {
    const output = '```tsx\nconst x = 1;\n```\n';
    expect(countCompleteVariants(output)).toBe(0);
  });
});
