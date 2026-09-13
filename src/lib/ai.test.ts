import { describe, expect, it } from 'vitest'
import { askContextualAI, generateReflection } from './ai'

describe('askContextualAI', () => {
  it('returns valid contextual explanation for selected passage', async () => {
    const res = await askContextualAI('Việc học sâu đòi hỏi gợi nhớ chủ động.', 'Tư duy nhanh và chậm')
    expect(res.explanation).toContain('Tư duy nhanh và chậm')
    expect(res.socraticQuestion).toBeDefined()
  })

  it('throws error for empty passage', async () => {
    await expect(askContextualAI('', 'Doc')).rejects.toThrow('Đoạn văn trống.')
  })
})

describe('generateReflection', () => {
  it('handles empty recall with uncertain state', async () => {
    const res = await generateReflection({ recall: '', documentTitle: 'Sách', annotationsCount: 2 })
    expect(res.tone).toBe('uncertain')
  })

  it('handles short recall with socratic state', async () => {
    const res = await generateReflection({ recall: 'Nhớ về tư duy', documentTitle: 'Sách', annotationsCount: 2 })
    expect(res.tone).toBe('socratic')
  })

  it('returns supportive reflection with deepening prompt for full recall', async () => {
    const res = await generateReflection({
      recall: 'Tác giả phân tích hệ thống 1 và hệ thống 2, trong đó hệ thống 1 tự động còn hệ thống 2 đòi hỏi nỗ lực.',
      documentTitle: 'Tư duy nhanh và chậm',
      annotationsCount: 5,
    })
    expect(res.tone).toBe('supportive')
    expect(res.deepeningPrompt).toBeDefined()
  })
})
