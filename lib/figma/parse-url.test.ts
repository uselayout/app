import { describe, it, expect } from 'vitest'
import { parseFigmaUrl } from '@/lib/figma/parse-url'

describe('parseFigmaUrl', () => {
  it('extracts fileKey and converts node-id dashes to colons', () => {
    const result = parseFigmaUrl(
      'https://www.figma.com/design/AbC123XyZ/My-Design-File?node-id=12-34'
    )
    expect(result).toEqual({ fileKey: 'AbC123XyZ', nodeId: '12:34' })
  })

  it('handles multi-segment node-id with multiple dashes', () => {
    const result = parseFigmaUrl(
      'https://www.figma.com/design/abc123/File?node-id=1-2-3'
    )
    expect(result).toEqual({ fileKey: 'abc123', nodeId: '1:2:3' })
  })

  it('returns null when node-id query param is missing', () => {
    const result = parseFigmaUrl(
      'https://www.figma.com/design/abc123/My-File'
    )
    expect(result).toBeNull()
  })

  it('returns null for /file/ path (not /design/)', () => {
    const result = parseFigmaUrl(
      'https://www.figma.com/file/abc123/My-File?node-id=1-2'
    )
    expect(result).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(parseFigmaUrl('')).toBeNull()
  })

  it('returns null for an invalid URL', () => {
    expect(parseFigmaUrl('not-a-url')).toBeNull()
  })

  it('returns null for a plain domain with no path', () => {
    expect(parseFigmaUrl('https://figma.com')).toBeNull()
  })

  it('extracts fileKey when it contains hyphens and underscores', () => {
    const result = parseFigmaUrl(
      'https://www.figma.com/design/my_file-KEY_99/Title?node-id=0-1'
    )
    expect(result).toEqual({ fileKey: 'my_file-KEY_99', nodeId: '0:1' })
  })

  it('ignores extra query params and returns correct values', () => {
    const result = parseFigmaUrl(
      'https://www.figma.com/design/abc123/File?t=abcdef&node-id=5-10&m=dev'
    )
    expect(result).toEqual({ fileKey: 'abc123', nodeId: '5:10' })
  })
})
