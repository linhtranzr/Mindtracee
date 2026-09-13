import { describe, expect, it } from 'vitest'
import { normalizeVietnameseText } from './vietnamese'

describe('normalizeVietnameseText', () => {
  it('converts NFD decomposed characters to NFC composed Vietnamese', () => {
    const nfdText = 'chuyê\u0309n một phâ\u0300n audience'
    const result = normalizeVietnameseText(nfdText)
    expect(result).toBe('chuyển một phần audience')
  })

  it('preserves spaces between words accurately without collapsing words starting with c, g, h, m, n, p, t', () => {
    const textWithSpaces = 'Phân biệt “content AI thực sự có kiến thức” với “content chỉ giật hook”'
    const result = normalizeVietnameseText(textWithSpaces)
    expect(result).toBe('Phân biệt “content AI thực sự có kiến thức” với “content chỉ giật hook”')
  })

  it('correctly fixes broken trailing consonants from PDF extraction while preserving spaces', () => {
    const brokenPdfText = 'thư\u0323c sư\u0323 co\u0301 kiê\u0302\u0301 n thư\u031b\u0301c'
    const result = normalizeVietnameseText(brokenPdfText)
    expect(result).toBe('thực sự có kiến thức')
  })

  it('handles duplicate combining marks from PDF fonts', () => {
    const doubleAccent = 'phâ\u0300\u0300 n'
    const result = normalizeVietnameseText(doubleAccent)
    expect(result).toBe('phần')
  })

  it('handles null, undefined, or empty string safely', () => {
    expect(normalizeVietnameseText(null)).toBe('')
    expect(normalizeVietnameseText(undefined)).toBe('')
    expect(normalizeVietnameseText('')).toBe('')
  })
})
