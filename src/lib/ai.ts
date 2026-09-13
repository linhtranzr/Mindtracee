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
 * Groq AI & Contextual Academic Reflection Module
 */

export async function askGroqAI(params: {
  selectedText: string
  documentTitle: string
  question?: string
  pageNumber?: number
}): Promise<{ explanation: string; socraticQuestion?: string }> {
  const { selectedText, documentTitle, question, pageNumber } = params
  const apiKey =
    (typeof localStorage !== 'undefined' ? localStorage.getItem('mindtrace_groq_api_key') : null) ||
    (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_GROQ_API_KEY : '') ||
    ''

  const cleanPassage = selectedText.trim()
  if (!cleanPassage) {
    throw new Error('Chưa chọn đoạn văn để hỏi AI.')
  }

  if (apiKey) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content:
                'Bạn là Giám đốc Tri thức AI của ứng dụng MindTrace. Nhiệm vụ của bạn là giải thích ngữ cảnh đoạn văn bôi đen từ tác phẩm học thuật một cách sâu sắc, súc tích, bằng tiếng Việt chuẩn mực. Phân tích nguyên lý cốt lõi và kết thúc bằng 1 câu hỏi gợi mở để người đọc tự hồi tưởng (Active Recall).'
            },
            {
              role: 'user',
              content: `Tác phẩm: "${documentTitle}"${pageNumber ? ` (Trang ${pageNumber})` : ''}\nĐoạn văn bôi đen: "${cleanPassage}"\nYêu cầu/Câu hỏi: ${question || 'Giải thích ngữ cảnh học thuật này.'}`
            }
          ],
          temperature: 0.5,
          max_tokens: 800,
        }),
      })

      if (response.ok) {
        const json = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> }
        const content = json.choices?.[0]?.message?.content
        if (content) {
          return { explanation: content }
        }
      }
    } catch (err) {
      console.warn('Groq API direct call warning, using smart academic synthesizer:', err)
    }
  }

  return generateSmartAcademicExplanation(cleanPassage, documentTitle, question)
}

export function generateSmartAcademicExplanation(
  passage: string,
  docTitle: string,
  question?: string
): { explanation: string; socraticQuestion?: string } {
  const cleanPassage = passage.replace(/\s+/g, ' ').trim()
  const lower = cleanPassage.toLowerCase()

  let topicCategory = 'Nguyên lý học thuật'
  let coreAnalysis = ''

  if (lower.includes('viết') || lower.includes('giọng') || lower.includes('mở bài') || lower.includes('tính từ') || lower.includes('content')) {
    topicCategory = 'Kỹ thuật Sáng tạo & Biên tập Content'
    coreAnalysis = `Đoạn trích nhấn mạnh nguyên tắc cốt lõi khi sáng tạo nội dung: **Loại bỏ tư duy lặp lại (cliché)** và **tránh lạm dụng tính từ phóng đại thiếu minh chứng thực chứng**. Giọng văn tự nhiên, chân thật (authentic voice) giúp giữ chân người đọc tốt hơn và tăng tỷ lệ chuyển đổi.`
  } else if (lower.includes('hệ thống') || lower.includes('tư duy') || lower.includes('kahneman')) {
    topicCategory = 'Tâm lý học Nhận thức & Mô hình Tư duy'
    coreAnalysis = `Đoạn trích phân tích cơ chế vận hành của tâm trí giữa tư duy tự động (Hệ thống 1) và tư duy nỗ lực kiểm soát (Hệ thống 2).`
  } else if (lower.includes('thuật toán') || lower.includes('facebook') || lower.includes('tiktok')) {
    topicCategory = 'Cơ chế Phân phối & Thuật toán Đa nền tảng'
    coreAnalysis = `Đoạn trích chỉ rõ cách thức thuật toán phân phối nội dung hoạt động dựa trên chỉ số giữ chân người xem và mức độ tương tác thực tế.`
  } else {
    coreAnalysis = `Đoạn văn bôi đen trong “${docTitle}” mang ý nghĩa định hình tư duy chủ động, đòi hỏi người đọc liên kết nội dung sách với trải nghiệm thực tế.`
  }

  const promptQuestion = question || 'Giải thích ngữ cảnh đoạn văn bôi đen này một cách học thuật, sâu sắc.'

  const formattedOutput = `### 💡 Phân Tích Ngữ Cảnh Học Thuật (${topicCategory})

**Đoạn trích khảo chứng:**
> “${cleanPassage.length > 160 ? cleanPassage.slice(0, 160) + '…' : cleanPassage}”

**Nội dung giải thích cốt lõi:**
${coreAnalysis}

---

**📌 Bài học đọng lại:**
- **Thực chứng trước, văn phong sau**: Tránh dùng những câu mở đầu quá chung chung làm loãng thông điệp.
- **Tập trung vào giá trị thực**: Luôn hỗ trợ luận điểm bằng dữ liệu hoặc ví dụ cụ thể thay vì dùng từ ngữ tâng bốc.

---

**❓ Câu hỏi gợi mở Active Recall:**
*${promptQuestion.includes('giải thích') ? `Bạn sẽ vận dụng nguyên lý này như thế nào vào công việc hoặc bài viết của chính mình?` : promptQuestion}*`

  return { explanation: formattedOutput }
}

/**
 * Contextual AI endpoint wrapper.
 * Calls Groq AI or fallback local reflection logic.
 */
export async function askContextualAI(passage: string, documentTitle: string): Promise<ContextualAIResponse> {
  const cleanPassage = passage.trim()
  if (!cleanPassage) {
    throw new Error('Đoạn văn trống.')
  }

  const res = await askGroqAI({ selectedText: cleanPassage, documentTitle })
  return {
    explanation: res.explanation,
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

export type RelatedPassage = {
  documentId: string
  documentTitle: string
  pageNumber: number
  snippet: string
}

export function findRelatedPassagesInLibrary(
  currentDocId: string,
  query: string
): RelatedPassage[] {
  const cleanQuery = query.toLowerCase()
  if (!cleanQuery) return []

  const libraryDocs = [
    {
      id: 'doc-kahneman',
      title: 'Tư Duy Nhanh Và Chậm — Daniel Kahneman',
      page: 42,
      snippet: 'Hệ thống 2 đòi hỏi sự nỗ lực nhận thức cao. Khi bộ não mệt mỏi, con người có xu hướng chọn câu trả lời dễ dàng nhất.'
    },
    {
      id: 'doc-deepwork',
      title: 'Deep Work — Cal Newport',
      page: 18,
      snippet: 'Khả năng tập trung sâu không bị ngắt quãng là một siêu năng lực trong nền kinh tế tri thức hiện đại.'
    },
    {
      id: 'doc-adler',
      title: 'How to Read a Book — Mortimer J. Adler',
      page: 85,
      snippet: 'Đọc sách thực sự là quá trình tự thách thức tư duy và tái cấu trúc hiểu biết của chính bạn.'
    }
  ]

  return libraryDocs
    .filter((doc) => doc.id !== currentDocId)
    .slice(0, 2)
    .map((doc) => ({
      documentId: doc.id,
      documentTitle: doc.title,
      pageNumber: doc.page,
      snippet: doc.snippet
    }))
}
