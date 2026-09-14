import { describe, expect, it } from 'vitest'
import { askContextualAI, generateReflection, parseQuizFromAiResponse, getFallbackQuizQuestions } from './ai'

describe('askContextualAI', () => {
  it('returns valid contextual explanation for selected passage', async () => {
    const res = await askContextualAI('Việc học sâu đòi hỏi gợi nhớ chủ động.', 'Tư duy nhanh và chậm')
    expect(res.explanation).toContain('Tư duy nhanh và chậm')
    expect(res.explanation).toContain('Active Recall Quiz')
    expect(res.socraticQuestion).toBeDefined()
  })

  it('throws error for empty passage', async () => {
    await expect(askContextualAI('', 'Doc')).rejects.toThrow('Đoạn văn trống.')
  })
})

describe('parseQuizFromAiResponse', () => {
  it('parses structured quiz questions from raw AI content string', () => {
    const mockContent = `### ⚡ Phân Tích Ngữ Cảnh (Tài Chính)
Đoạn trích: Risk warning...

---

### 🧠 Active Recall Quiz (2 Câu Hỏi Trắc Nghiệm):

Q1: Yếu tố nào cần ưu tiên hàng đầu?
A) Đòn bẩy tối đa
B) Bảo toàn vốn và cắt lỗ
C) Giao dịch liên tục
Đáp án đúng: B
Giải thích: Bảo toàn vốn quan trọng nhất.

Q2: Ý nghĩa tuyên bố rủi ro?
A) Minh bạch hóa các nguy cơ
B) Đảm bảo lời 100%
Đáp án đúng: A
Giải thích: Giúp độc giả hiểu rủi ro.`

    const quizzes = parseQuizFromAiResponse(mockContent, 'Tài Chính')
    expect(quizzes.length).toBe(2)
    expect(quizzes[0].question).toContain('Yếu tố nào cần ưu tiên hàng đầu?')
    expect(quizzes[0].correctIndex).toBe(1)
    expect(quizzes[1].correctIndex).toBe(0)
  })

  it('returns domain-specific fallback quiz if content has no quiz block', () => {
    const quizzes = parseQuizFromAiResponse('Nội dung giải thích không chứa quiz.', 'Kỹ Thuật & Kiến Trúc')
    expect(quizzes.length).toBe(2)
    expect(quizzes[0].question).toContain('phần mềm')
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

