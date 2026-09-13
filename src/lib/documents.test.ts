import { describe, expect, it } from 'vitest'
import { MAX_PDF_SIZE, safeStorageName, validatePdf } from './documents'

describe('PDF validation', () => {
  it('accepts a PDF under the size limit', () => {
    expect(validatePdf(new File(['pdf'], 'Sách hay.pdf', { type: 'application/pdf' }))).toBeNull()
  })
  it('rejects other file types', () => {
    expect(validatePdf(new File(['text'], 'notes.txt', { type: 'text/plain' }))).toContain('PDF')
  })
  it('rejects oversized PDFs', () => {
    const file = new File(['x'], 'large.pdf', { type: 'application/pdf' })
    Object.defineProperty(file, 'size', { value: MAX_PDF_SIZE + 1 })
    expect(validatePdf(file)).toContain('50 MB')
  })
  it('creates storage-safe names', () => {
    expect(safeStorageName('Tư duy & Học tập.pdf')).toBe('Tu-duy-Hoc-tap.pdf')
  })
})
