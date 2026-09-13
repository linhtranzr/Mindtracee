import { describe, expect, it } from 'vitest'
import { calculateTopicStatus } from './knowledge-engine'

describe('calculateTopicStatus', () => {
  it('returns unread for empty evidence list', () => {
    expect(calculateTopicStatus([])).toBe('unread')
  })

  it('returns exposed when only read or highlighted evidence exists', () => {
    expect(calculateTopicStatus(['read'])).toBe('exposed')
    expect(calculateTopicStatus(['read', 'highlighted'])).toBe('exposed')
  })

  it('never jumps to mastered from reading alone', () => {
    expect(calculateTopicStatus(['read', 'read', 'read'])).not.toBe('mastered')
  })

  it('returns forming when free recall or explanation evidence exists', () => {
    expect(calculateTopicStatus(['read', 'free_recall'])).toBe('forming')
  })

  it('returns mastered when applied or connected evidence exists', () => {
    expect(calculateTopicStatus(['read', 'free_recall', 'applied'])).toBe('mastered')
  })

  it('returns needs_review when could_not_recall evidence exists', () => {
    expect(calculateTopicStatus(['read', 'free_recall', 'could_not_recall'])).toBe('needs_review')
  })
})
