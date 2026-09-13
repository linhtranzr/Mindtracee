import { describe, expect, it } from 'vitest'
import { validateAnnotationNote } from './annotations'

describe('validateAnnotationNote', () => {
  it('rejects empty note content for note kind', () => {
    expect(validateAnnotationNote('note', '')).toBe('Ghi chú không được để trống.')
    expect(validateAnnotationNote('note', '   ')).toBe('Ghi chú không được để trống.')
  })

  it('allows highlight without custom note text', () => {
    expect(validateAnnotationNote('highlight', '')).toBeNull()
  })

  it('enforces maximum 10000 characters limit', () => {
    const longNote = 'a'.repeat(10001)
    expect(validateAnnotationNote('note', longNote)).toBe('Ghi chú quá dài (tối đa 10,000 ký tự).')
  })

  it('accepts valid note text', () => {
    expect(validateAnnotationNote('note', 'Đây là điểm quan trọng cần nhớ.')).toBeNull()
  })
})
