import { describe, it, expect } from 'vitest';
import { parseFigmaUrl } from './parse-url';

describe('parseFigmaUrl', () => {
  it('parses a standard design URL with node-id', () => {
    const result = parseFigmaUrl('https://www.figma.com/design/AbCdEf1234/My-Design-File?node-id=1-2');
    expect(result).toEqual({ fileKey: 'AbCdEf1234', nodeId: '1:2' });
  });

  it('converts hyphenated node-id to colon format', () => {
    const result = parseFigmaUrl('https://www.figma.com/design/KEY123/File?node-id=42-7');
    expect(result).toEqual({ fileKey: 'KEY123', nodeId: '42:7' });
  });

  it('converts multi-segment node-id (e.g. 1-2-3) using replaceAll', () => {
    const result = parseFigmaUrl('https://www.figma.com/design/KEY123/File?node-id=1-2-3');
    expect(result).toEqual({ fileKey: 'KEY123', nodeId: '1:2:3' });
  });

  it('returns null for an empty string', () => {
    expect(parseFigmaUrl('')).toBeNull();
  });

  it('returns null when the URL has no node-id param', () => {
    const result = parseFigmaUrl('https://www.figma.com/design/KEY123/My-File');
    expect(result).toBeNull();
  });

  it('returns null when the URL is not a /design/ path', () => {
    const result = parseFigmaUrl('https://www.figma.com/file/KEY123/My-File?node-id=1-2');
    expect(result).toBeNull();
  });

  it('returns null for a completely invalid URL', () => {
    expect(parseFigmaUrl('not-a-url-at-all')).toBeNull();
  });

  it('returns null when the node-id param is an empty string', () => {
    const result = parseFigmaUrl('https://www.figma.com/design/KEY123/File?node-id=');
    expect(result).toBeNull();
  });

  it('extracts the file key from a URL with extra query params', () => {
    const result = parseFigmaUrl(
      'https://www.figma.com/design/xYz9AbC/Design-System?node-id=10-20&mode=dev&t=abc'
    );
    expect(result).toEqual({ fileKey: 'xYz9AbC', nodeId: '10:20' });
  });

  it('handles file keys with mixed case and numbers', () => {
    const result = parseFigmaUrl('https://www.figma.com/design/aB1cD2eF3g/Name?node-id=0-1');
    expect(result?.fileKey).toBe('aB1cD2eF3g');
  });

  it('returns null for a figma proto URL (not /design/)', () => {
    const result = parseFigmaUrl('https://www.figma.com/proto/KEY123/File?node-id=1-2');
    expect(result).toBeNull();
  });

  it('handles URLs without www prefix', () => {
    const result = parseFigmaUrl('https://figma.com/design/KEY999/File?node-id=5-10');
    expect(result).toEqual({ fileKey: 'KEY999', nodeId: '5:10' });
  });
});
