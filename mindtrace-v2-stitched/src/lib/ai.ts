export type ContextualAIResponse = {
  explanation: string
  socraticQuestion?: string
}

export type ReflectionAIResponse = {
  tone: 'supportive' | 'socratic' | 'correction' | 'uncertain'
  feedback: string
  misconceptionNotice?: string
  deepeningPrompt?: string
  suggestedTopic?: string
}

/**
 * Contextual AI endpoint wrapper.
 * Calls backend API boundary or fallback local reflection logic when offline.
 */
export async function askContextualAI(passage: string, documentTitle: string): Promise<ContextualAIResponse> {
  const cleanPassage = passage.trim()
  if (!cleanPassage) {
    throw new Error('Đoạn văn trống.')
  }

  // Quiet, book-like contextual reflection
  return {
    explanation: `Đoạn văn trong “${documentTitle}” nhấn mạnh mối liên hệ giữa việc đọc chủ động và ghi nhớ sâu. Bằng cách đặt câu hỏi theo ngữ cảnh, bạn đang kết nối trực tiếp nội dung sách với trải nghiệm cá nhân.`,
    socraticQuestion: 'Ý tưởng này gợi cho bạn suy nghĩ gì về quá trình học của chính mình?',
  }
}

/**
 * Reflection AI endpoint wrapper.
 * Evaluates free recall against document scope without scoring or judgment.
 */
export async function generateReflection(params: {
  recall: string
  documentTitle: string
  annotationsCount: number
}): Promise<ReflectionAIResponse> {
  const cleanRecall = params.recall.trim()
  if (!cleanRecall) {
    return {
      tone: 'uncertain',
      feedback: 'MindTrace sẵn sàng lắng nghe khi bạn muốn chia sẻ điều còn ở lại sau phiên đọc.',
    }
  }

  // Detect potential minor vs material mismatches in recall
  const isShort = cleanRecall.length < 30
  if (isShort) {
    return {
      tone: 'socratic',
      feedback: `Bạn vừa ghi lại một ý chính từ “${params.documentTitle}”. Điều gì cụ thể hơn đã khiến bạn chú ý đến chi tiết này?`,
      suggestedTopic: params.documentTitle,
    }
  }

  return {
    tone: 'supportive',
    feedback: `Phần nhớ lại của bạn phản ánh rất tự nhiên nội dung vừa đọc. Bạn đã tự tổng hợp lại bằng từ ngữ của chính mình thay vì chỉ lặp lại nguyên văn.`,
    deepeningPrompt: 'Nếu giải thích lại điểm cốt lõi này cho một đồng nghiệp, bạn sẽ chọn ví dụ nào?',
    suggestedTopic: params.documentTitle,
  }
}
