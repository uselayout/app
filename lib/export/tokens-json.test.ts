import { describe, it, expect } from 'vitest';
import { generateTokensJson } from './tokens-json';
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
  return { name, value, type, category: 'primitive', ...overrides };
}

describe('generateTokensJson', () => {
  it('returns empty string when no tokens provided (blank project)', () => {
    const json = generateTokensJson(makeTokens());
    expect(json).toBe('');
  });

  it('returns valid parseable JSON when tokens are present', () => {
    const tokens = makeTokens({
      colors: [makeToken('Primary', '#6750A4', 'color')],
    });
    const json = generateTokensJson(tokens);
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it('groups colour tokens under top-level "color" key', () => {
    const tokens = makeTokens({
      colors: [makeToken('Primary', '#6750A4', 'color')],
    });
    const parsed = JSON.parse(generateTokensJson(tokens));
    expect(parsed).toHaveProperty('color');
  });

  it('assigns $type "color" to colour tokens', () => {
    const tokens = makeTokens({
      colors: [makeToken('Primary', '#6750A4', 'color')],
    });
    const parsed = JSON.parse(generateTokensJson(tokens));
    const key = Object.keys(parsed.color)[0];
    expect(parsed.color[key].$type).toBe('color');
    expect(parsed.color[key].$value).toBe('#6750A4');
  });

  it('assigns $type "dimension" to spacing tokens', () => {
    const tokens = makeTokens({
      spacing: [makeToken('space-4', '16px', 'spacing')],
    });
    const parsed = JSON.parse(generateTokensJson(tokens));
    const key = Object.keys(parsed.spacing)[0];
    expect(parsed.spacing[key].$type).toBe('dimension');
  });

  it('assigns $type "dimension" to radius tokens', () => {
    const tokens = makeTokens({
      radius: [makeToken('rounded', '8px', 'radius')],
    });
    const parsed = JSON.parse(generateTokensJson(tokens));
    const key = Object.keys(parsed.radius)[0];
    expect(parsed.radius[key].$type).toBe('dimension');
  });

  it('assigns $type "shadow" to effect tokens', () => {
    const tokens = makeTokens({
      effects: [makeToken('shadow-md', '0 4px 6px rgba(0,0,0,.1)', 'effect')],
    });
    const parsed = JSON.parse(generateTokensJson(tokens));
    const key = Object.keys(parsed.effect)[0];
    expect(parsed.effect[key].$type).toBe('shadow');
  });

  it('assigns $type "duration" to motion tokens with ms value', () => {
    const tokens = makeTokens({
      motion: [makeToken('fast', '150ms', 'motion')],
    });
    const parsed = JSON.parse(generateTokensJson(tokens));
    const key = Object.keys(parsed.motion)[0];
    expect(parsed.motion[key].$type).toBe('duration');
  });

  it('assigns $type "cubicBezier" to motion tokens with cubic-bezier value', () => {
    const tokens = makeTokens({
      motion: [makeToken('ease-out', 'cubic-bezier(0,0,0.2,1)', 'motion')],
    });
    const parsed = JSON.parse(generateTokensJson(tokens));
    const key = Object.keys(parsed.motion)[0];
    expect(parsed.motion[key].$type).toBe('cubicBezier');
  });

  it('assigns $type "cubicBezier" to motion tokens with ease keyword', () => {
    const tokens = makeTokens({
      motion: [makeToken('standard', 'ease-in-out', 'motion')],
    });
    const parsed = JSON.parse(generateTokensJson(tokens));
    const key = Object.keys(parsed.motion)[0];
    expect(parsed.motion[key].$type).toBe('cubicBezier');
  });

  it('parses typography token into structured $value', () => {
    const value = 'font-family: Roboto; font-size: 16px; font-weight: 400; line-height: 24px';
    const tokens = makeTokens({
      typography: [makeToken('body', value, 'typography')],
    });
    const parsed = JSON.parse(generateTokensJson(tokens));
    const key = Object.keys(parsed.typography)[0];
    const token = parsed.typography[key];
    expect(token.$type).toBe('typography');
    expect(token.$value.fontFamily).toBe('Roboto');
    expect(token.$value.fontSize).toBe('16px');
    expect(token.$value.fontWeight).toBe(400);
    expect(token.$value.lineHeight).toBe('24px');
  });

  it('includes $description when token has description', () => {
    const tokens = makeTokens({
      colors: [makeToken('Primary', '#fff', 'color', { description: 'Main brand colour' })],
    });
    const parsed = JSON.parse(generateTokensJson(tokens));
    const key = Object.keys(parsed.color)[0];
    expect(parsed.color[key].$description).toBe('Main brand colour');
  });

  it('omits $description when token has no description', () => {
    const tokens = makeTokens({
      colors: [makeToken('Primary', '#fff', 'color')],
    });
    const parsed = JSON.parse(generateTokensJson(tokens));
    const key = Object.keys(parsed.color)[0];
    expect(parsed.color[key]).not.toHaveProperty('$description');
  });

  it('converts token name with spaces and slashes to dot-separated key', () => {
    const tokens = makeTokens({
      colors: [makeToken('Brand / Primary', '#abc123', 'color')],
    });
    const parsed = JSON.parse(generateTokensJson(tokens));
    expect(parsed.color).toHaveProperty('brand.primary');
  });

  it('omits empty categories from output', () => {
    const tokens = makeTokens({
      colors: [makeToken('c', '#fff', 'color')],
    });
    const parsed = JSON.parse(generateTokensJson(tokens));
    expect(parsed).not.toHaveProperty('typography');
    expect(parsed).not.toHaveProperty('spacing');
    expect(parsed).not.toHaveProperty('radius');
    expect(parsed).not.toHaveProperty('effect');
    expect(parsed).not.toHaveProperty('motion');
  });
});
