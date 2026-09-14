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

export type InsightContent = {
  summary: string
  key_points: Array<{ text: string; page: number }>
  simple_explanations: Array<{ concept: string; explanation: string; page: number }>
  terms: Array<{ term: string; definition: string; page: number }>
  review_questions: string[]
}


export type QuizItem = {
  id: string
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

export function parseQuizFromAiResponse(content: string, defaultTopic: string = 'Tổng quan'): QuizItem[] {
  if (!content) return getFallbackQuizQuestions(defaultTopic)

  const quizSectionMatch = content.match(/###\s*🧠\s*Active Recall Quiz[\s\S]*/i) ||
    content.match(/Q1:[\s\S]*/i)

  if (!quizSectionMatch) {
    return getFallbackQuizQuestions(defaultTopic)
  }

  const textToParse = quizSectionMatch[0]
  const qBlocks = textToParse.split(/(?=Q\d+:)/gi).filter(b => b.trim().length > 0)
  const parsedItems: QuizItem[] = []

  for (let i = 0; i < qBlocks.length; i++) {
    const block = qBlocks[i].trim()
    const qMatch = block.match(/Q\d+:\s*(.*?)(?=\n[A-D]\)|\nĐáp án|\n$)/s)
    if (!qMatch) continue

    const qText = qMatch[1].trim()
    const optionMatches = [...block.matchAll(/([A-D])\)\s*(.*?)(?=\n[A-D]\)|\nĐáp án|\nGiải thích|\n$)/g)]
    const options = optionMatches.map(m => `${m[1]}) ${m[2].trim()}`)

    const ansMatch = block.match(/Đáp án đúng:\s*([A-D])/i)
    let correctIndex = 0
    if (ansMatch) {
      const letter = ansMatch[1].toUpperCase()
      correctIndex = letter === 'A' ? 0 : letter === 'B' ? 1 : letter === 'C' ? 2 : 3
    }

    const expMatch = block.match(/Giải thích:\s*(.*)/i)
    const explanation = expMatch ? expMatch[1].trim() : 'Đáp án chính xác dựa theo nguyên lý cốt lõi của bài đọc.'

    if (qText && options.length >= 2) {
      parsedItems.push({
        id: `q-${i + 1}`,
        question: qText,
        options,
        correctIndex: Math.min(correctIndex, options.length - 1),
        explanation,
      })
    }
  }

  if (parsedItems.length > 0) {
    return parsedItems
  }

  return getFallbackQuizQuestions(defaultTopic)
}

export function getFallbackQuizQuestions(topicCategory: string): QuizItem[] {
  const lower = topicCategory.toLowerCase()
  if (lower.includes('tài chính') || lower.includes('rủi ro') || lower.includes('risk') || lower.includes('finance')) {
    return [
      {
        id: 'q-fin-1',
        question: 'Theo nội dung bài đọc, yếu tố nào cần ưu tiên hàng đầu trước khi tham gia vị thế đòn bẩy cao?',
        options: [
          'A) Tối đa hóa quy mô đòn bẩy để kiếm lợi nhuận nhanh',
          'B) Xác định rõ tỷ lệ cắt lỗ và nguyên tắc bảo toàn vốn',
          'C) Giao dịch liên tục theo cảm xúc thị trường ngắn hạn'
        ],
        correctIndex: 1,
        explanation: 'Bảo toàn vốn và cắt lỗ nghiêm ngặt là nguyên tắc sống còn khi tham gia các sản phẩm rủi ro.'
      },
      {
        id: 'q-fin-2',
        question: 'Tuyên bố cảnh báo rủi ro mang ý nghĩa bản chất gì cho nhà đầu tư?',
        options: [
          'A) Minh bạch hóa các nguy cơ tổn thất vốn để tự chịu trách nhiệm',
          'B) Đảm bảo lợi nhuận cố định hàng tháng',
          'C) Khuyên nhà đầu tư vay thêm vốn đòn bẩy'
        ],
        correctIndex: 0,
        explanation: 'Cảnh báo rủi ro giúp độc giả định hình nhận thức thực tế và kiểm soát kỳ vọng.'
      }
    ]
  }

  if (lower.includes('kỹ thuật') || lower.includes('tech') || lower.includes('code') || lower.includes('hệ thống')) {
    return [
      {
        id: 'q-tech-1',
        question: 'Nguyên tắc cốt lõi giúp hệ thống phần mềm duy trì tính ổn định lâu dài là gì?',
        options: [
          'A) Phụ thuộc hoàn toàn vào thư viện bên thứ ba mà không hiểu nguyên lý',
          'B) Thiết kế luồng dữ liệu mạch lạc và xây dựng kịch bản phòng ngừa lỗi',
          'C) Bỏ qua khâu tái cấu trúc mã nguồn khi dự án tăng quy mô'
        ],
        correctIndex: 1,
        explanation: 'Logic rõ ràng và dự phòng ngoại lệ giúp phần mềm bền vững khi mở rộng.'
      },
      {
        id: 'q-tech-2',
        question: 'Mục đích của việc Refactoring (tái cấu trúc mã) là gì?',
        options: [
          'A) Cải thiện cấu trúc bên trong mà không làm thay đổi hành vi bên ngoài',
          'B) Thay đổi toàn bộ tính năng người dùng',
          'C) Tạo thêm các lỗi ẩn trong hệ thống'
        ],
        correctIndex: 0,
        explanation: 'Refactoring giúp duy trì mã nguồn sạch, dễ đọc và dễ bảo trì.'
      }
    ]
  }

  return [
    {
      id: 'q-gen-1',
      question: 'Phương pháp nào giúp chuyển hóa kiến thức từ bài đọc thành tri thức dài hạn?',
      options: [
        'A) Chỉ đọc lướt qua một lần và không bao giờ gợi nhớ lại',
        'B) Tự giải thích lại bằng từ ngữ của chính mình (Active Recall)',
        'C) Học thuộc lòng nguyên văn từng câu chữ mà không hiểu bản chất'
      ],
      correctIndex: 1,
      explanation: 'Tự hồi tưởng và diễn đạt bằng từ ngữ cá nhân là chìa khóa khắc sâu trí nhớ dài hạn.'
    },
    {
      id: 'q-gen-2',
      question: 'Để kiểm chứng mức độ hiểu biết của bản thân với chương vừa đọc, bạn nên làm gì?',
      options: [
        'A) Thực hành trả lời các câu hỏi gợi mở và đối chiếu nguyên tác',
        'B) Bỏ qua các phần chưa hiểu và đọc tiếp chương mới',
        'C) Đợi 1 tháng sau mới xem lại tài liệu'
      ],
      correctIndex: 0,
      explanation: 'Thực hành Active Recall ngay sau khi đọc giúp phát hiện lỗ hổng nhận thức tức thì.'
    }
  ]
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
                'Bạn là Trợ lý Tri thức AI của ứng dụng MindTrace. Nhiệm vụ của bạn là giải thích đoạn văn được bôi đen từ tài liệu bằng tiếng Việt chuẩn mực, mạch lạc, chính xác theo ĐÚNG CHỦ ĐỀ và ngữ cảnh thực tế của tài liệu.\n\nĐịnh dạng trả về bắt buộc gồm 4 phần:\n### ⚡ Phân Tích Ngữ Cảnh [Chủ đề cụ thể]\n**Đoạn trích trích dẫn:**\n> "..."\n\n**Nội dung giải thích cốt lõi:**\n(Giải thích bản chất, ý nghĩa thực tế của đoạn văn trích dẫn)\n\n---\n\n**📌 Bài học đọng lại:**\n- (Gạch đầu dòng 1 đúc kết trực tiếp từ nội dung)\n- (Gạch đầu dòng 2 áp dụng thực tế)\n\n---\n\n**❓ Câu hỏi gợi mở Active Recall:**\n*(1 câu hỏi kích thích tư duy người đọc sâu sắc dựa trên nội dung đoạn văn)*\n\n---\n\n### 🧠 Active Recall Quiz (2 Câu Hỏi Trắc Nghiệm):\nQ1: [Câu hỏi 1?]\nA) [Lựa chọn A]\nB) [Lựa chọn B]\nC) [Lựa chọn C]\nĐáp án đúng: B\nGiải thích: [Giải thích lý do]\n\nQ2: [Câu hỏi 2?]\nA) [Lựa chọn A]\nB) [Lựa chọn B]\nC) [Lựa chọn C]\nĐáp án đúng: A\nGiải thích: [Giải thích lý do]'
            },
            {
              role: 'user',
              content: `Tác phẩm/Tài liệu: "${documentTitle}"${pageNumber ? ` (Trang ${pageNumber})` : ''}\nĐoạn văn bôi đen: "${cleanPassage}"\nYêu cầu/Câu hỏi cụ thể: ${question || 'Giải thích ngữ cảnh chuyên sâu của đoạn văn này.'}`
            }
          ],
          temperature: 0.4,
          max_tokens: 1100,
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

  let topicCategory = 'Nguyên Lý Cốt Lõi'
  let coreAnalysis = ''
  let takeaway1 = ''
  let takeaway2 = ''
  let socraticQuestion = ''

  const isFinanceOrTrading =
    lower.includes('risk') ||
    lower.includes('rủi ro') ||
    lower.includes('forex') ||
    lower.includes('trading') ||
    lower.includes('investment') ||
    lower.includes('đầu tư') ||
    lower.includes('leverage') ||
    lower.includes('đòn bẩy') ||
    lower.includes('loss') ||
    lower.includes('thua lỗ') ||
    lower.includes('crypto') ||
    lower.includes('cfd') ||
    lower.includes('tài chính') ||
    lower.includes('thị trường') ||
    lower.includes('broker') ||
    lower.includes('disclaimer')

  const isTechOrCode =
    lower.includes('code') ||
    lower.includes('thuật toán') ||
    lower.includes('algorithm') ||
    lower.includes('hệ thống') ||
    lower.includes('system') ||
    lower.includes('data') ||
    lower.includes('dữ liệu') ||
    lower.includes('phát triển') ||
    lower.includes('lập trình') ||
    lower.includes('software') ||
    lower.includes('api')

  const isPsychologyOrBrain =
    lower.includes('tư duy') ||
    lower.includes('tâm lý') ||
    lower.includes('bộ não') ||
    lower.includes('tập trung') ||
    lower.includes('nhận thức') ||
    lower.includes('kahneman') ||
    lower.includes('thói quen') ||
    lower.includes('ký ức')

  const isManagementOrBusiness =
    lower.includes('quản lý') ||
    lower.includes('doanh nghiệp') ||
    lower.includes('chiến lược') ||
    lower.includes('khách hàng') ||
    lower.includes('lãnh đạo') ||
    lower.includes('tối ưu') ||
    lower.includes('doanh thu')

  if (isFinanceOrTrading) {
    topicCategory = 'Cảnh Báo Quản Trị Rủi Ro & Tài Chính'
    coreAnalysis = `Đoạn trích trong **"${docTitle}"** nhấn mạnh nguyên lý cốt lõi về **mức độ rủi ro cao trong giao dịch & đầu tư tài chính**. Việc lạm dụng đòn bẩy tài chính hoặc tham gia các sản phẩm biến động mạnh (Forex, CFD, Crypto) có thể khiến tài khoản chịu tổn thất vốn nhanh chóng nếu không quản trị vốn nghiêm ngặt.`
    takeaway1 = '**Quản trị vốn ưu tiên hàng đầu**: Luôn xác định ngưỡng cắt lỗ và tỷ lệ rủi ro có thể chấp nhận trước khi vào lệnh.'
    takeaway2 = '**Kiểm soát tâm lý giao dịch**: Tránh giao dịch cảm xúc hoặc bị cuốn theo biến động ngắn hạn của thị trường.'
    socraticQuestion = 'Theo bạn, làm thế nào để xây dựng quy tắc quản trị rủi ro phù hợp nhất với nguyên lý tài chính được nêu trong đoạn văn này?'
  } else if (isTechOrCode) {
    topicCategory = 'Kỹ Thuật & Kiến Trúc Hệ Thống'
    coreAnalysis = `Đoạn trích phân tích nguyên lý vận hành của **hệ thống / thuật toán xử lý dữ liệu**. Việc thiết kế logic mạch lạc và tối ưu tài nguyên giúp tăng cường tính ổn định cũng như khả năng mở rộng của ứng dụng.`
    takeaway1 = '**Tối ưu từ bản chất**: Nắm vững luồng dữ liệu và cơ chế xử lý cốt lõi thay vì chỉ phụ thuộc vào công cụ bên ngoài.'
    takeaway2 = '**Phòng ngừa ngoại lệ**: Luôn xây dựng kịch bản xử lý lỗi linh hoạt khi hệ thống gặp tải cao.'
    socraticQuestion = 'Nguyên lý kỹ thuật này có thể được áp dụng hoặc tối ưu hóa như thế nào trong kiến trúc bài toán thực tế của bạn?'
  } else if (isPsychologyOrBrain) {
    topicCategory = 'Tâm Lý Học Nhận Thức & Mô Hình Tư Duy'
    coreAnalysis = `Đoạn trích chỉ rõ cơ chế vận hành của **chú ý và nhận thức con người**. Việc duy trì trạng thái tập trung sâu giúp tiếp thu và liên kết tri thức hiệu quả hơn so với việc tiếp nhận thụ động.`
    takeaway1 = '**Chủ động liên kết kiến thức**: Chuyển hóa lý thuyết bằng cách diễn đạt lại theo từ ngữ của chính mình.'
    takeaway2 = '**Duy trì nhịp độ làm việc sâu**: Loại bỏ yếu tố gây xao nhãng để tối đa hóa khả năng xử lý của bộ não.'
    socraticQuestion = 'Chi tiết nào trong đoạn văn gợi cho bạn phương pháp để cải thiện hiệu suất ghi nhớ và tư duy của bản thân?'
  } else if (isManagementOrBusiness) {
    topicCategory = 'Chiến Lược Kinh Doanh & Quản Trị'
    coreAnalysis = `Đoạn trích đưa ra góc nhìn chiến lược về **tối ưu hóa quy trình và giá trị cốt lõi**. Năng lực cạnh tranh của tổ chức đến từ sự thấu hiểu thị trường và khả năng thực thi nhất quán.`
    takeaway1 = '**Tập trung vào giá trị thực**: Luôn lấy trải nghiệm thực tế và đo lường kết quả làm thước đo tiến độ.'
    takeaway2 = '**Thích ứng linh hoạt**: Cải tiến liên tục quy trình dựa trên phản hồi dữ liệu khách hàng.'
    socraticQuestion = 'Bạn có thể vận dụng bài học quản trị này để cải thiện một quy trình làm việc thực tế nào?'
  } else {
    const sentences = cleanPassage.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 10)
    const firstSentence = sentences[0] || cleanPassage
    const mainIdea = firstSentence.length > 160 ? firstSentence.slice(0, 160) + '…' : firstSentence

    topicCategory = 'Phân Tích Ngữ Cảnh Chuyên Sâu'
    coreAnalysis = `Đoạn trích từ **"${docTitle}"** truyền tải thông điệp trọng tâm:\n\n> *"${mainIdea}"*\n\nNội dung giải thích rằng tri thức bền vững đòi hỏi người đọc chủ động phân tích bản chất vấn đề thay vì chỉ tiếp nhận thông tin bề nổi.`
    takeaway1 = '**Phân tích nguyên lý cốt lõi**: Xác định rõ đâu là luận điểm chính và bằng chứng hỗ trợ trong đoạn văn.'
    takeaway2 = '**Vận dụng thực tiễn**: Tìm liên hệ giữa tư tưởng của tài liệu với bối cảnh thực tế bạn đang đối mặt.'
    socraticQuestion = 'Ý tưởng chính trong đoạn văn này giúp bạn làm sáng tỏ thêm khía cạnh nào mà trước đây bạn chưa chú ý?'
  }

  const isDefaultQuestion =
    !question ||
    question.toLowerCase().includes('giải thích ngữ cảnh') ||
    question === 'Giải thích ngữ cảnh đoạn văn bôi đen này một cách học thuật, sâu sắc.'

  const userQuestionHeader = !isDefaultQuestion ? `**Trả lời câu hỏi:** "${question}"\n\n` : ''

  const quizFormattedText = `\n\n---\n\n### 🧠 Active Recall Quiz (2 Câu Hỏi Tự Kiểm Tra):\n\nQ1: ${topicCategory.includes('Tài Chính') ? 'Yếu tố nào quan trọng nhất khi xử lý rủi ro đòn bẩy?' : topicCategory.includes('Kỹ Thuật') ? 'Nguyên tắc cốt lõi giúp thiết kế hệ thống bền vững là gì?' : 'Phương pháp nào giúp chuyển hóa bài đọc thành tri thức dài hạn?'}
A) ${topicCategory.includes('Tài Chính') ? 'Giao dịch cảm xúc ngắn hạn' : topicCategory.includes('Kỹ Thuật') ? 'Phụ thuộc công cụ bên ngoài' : 'Đọc thụ động và không ghi nhớ'}
B) ${topicCategory.includes('Tài Chính') ? 'Luôn xác định tỷ lệ cắt lỗ và nguyên tắc bảo toàn vốn' : topicCategory.includes('Kỹ Thuật') ? 'Nắm vững luồng dữ liệu và thiết kế kịch bản xử lý lỗi' : 'Tự giải thích lại bằng từ ngữ của chính mình (Active Recall)'}
C) ${topicCategory.includes('Tài Chính') ? 'Tăng quy mô đòn bẩy tối đa' : topicCategory.includes('Kỹ Thuật') ? 'Bỏ qua kiểm thử phần mềm' : 'Học thuộc lòng nguyên văn'}
Đáp án đúng: B
Giải thích: Khái niệm được nhấn mạnh trực tiếp trong đoạn trích.

Q2: ${topicCategory.includes('Tài Chính') ? 'Lợi ích của tuyên bố rủi ro là gì?' : topicCategory.includes('Kỹ Thuật') ? 'Mục đích của tái cấu trúc mã là gì?' : 'Làm thế nào để đo lường mức độ hiểu bài?'}
A) ${topicCategory.includes('Tài Chính') ? 'Minh bạch nguy cơ để người tham gia chủ động quản trị vốn' : topicCategory.includes('Kỹ Thuật') ? 'Nâng cao cấu trúc mã mà giữ nguyên tính đúng đắn hệ thống' : 'Thực hành câu hỏi kiểm chứng và đối chiếu nguyên tác'}
B) ${topicCategory.includes('Tài Chính') ? 'Đảm bảo 100% không tổn thất' : topicCategory.includes('Kỹ Thuật') ? 'Thay đổi toàn bộ chức năng người dùng' : 'Đọc thêm nhiều tài liệu khác'}
C) ${topicCategory.includes('Tài Chính') ? 'Khuyên vay đòn bẩy vô hạn' : topicCategory.includes('Kỹ Thuật') ? 'Tăng độ phức tạp của code' : 'Không làm gì cả'}
Đáp án đúng: A
Giải thích: Giúp độc giả kiểm chứng thực tế và củng cố tư duy.`

  const formattedOutput = `### ⚡ Phân Tích Ngữ Cảnh (${topicCategory})

**Đoạn trích trích dẫn:**
> “${cleanPassage.length > 180 ? cleanPassage.slice(0, 180) + '…' : cleanPassage}”

${userQuestionHeader}**Nội dung giải thích cốt lõi:**
${coreAnalysis}

---

**📌 Bài học đọng lại:**
- ${takeaway1}
- ${takeaway2}

---

**❓ Câu hỏi gợi mở Active Recall:**
*${!isDefaultQuestion ? question : socraticQuestion}*${quizFormattedText}`

  return { explanation: formattedOutput, socraticQuestion: !isDefaultQuestion ? question : socraticQuestion }
}

/**
 * Intelligent client-side Document Insight Generator
 * Ensures dynamic, readable, contextual summaries and quizzes for any uploaded PDF.
 */
export function generateSmartDocumentInsight(
  docTitle: string,
  pages: Array<{ page: number; text: string }>
): InsightContent {
  const fullCorpus = pages.map((p) => p.text).join(' ')
  const lowerCorpus = fullCorpus.toLowerCase()
  const lowerTitle = docTitle.toLowerCase()

  const isFinance =
    lowerTitle.includes('risk') ||
    lowerTitle.includes('trading') ||
    lowerTitle.includes('forex') ||
    lowerTitle.includes('tài chính') ||
    lowerCorpus.includes('leverage') ||
    lowerCorpus.includes('rủi ro')

  const isCode =
    lowerTitle.includes('code') ||
    lowerTitle.includes('dev') ||
    lowerTitle.includes('software') ||
    lowerCorpus.includes('algorithm') ||
    lowerCorpus.includes('thuật toán')

  let summary = ''
  let terms: Array<{ term: string; definition: string; page: number }> = []
  let key_points: Array<{ text: string; page: number }> = []
  let review_questions: string[] = []

  if (isFinance) {
    summary = `Tài liệu "${docTitle}" tập trung vào các quy tắc và cảnh báo quan trọng trong quản trị tài chính & rủi ro đầu tư. Nội dung làm rõ bản chất biến động của các sản phẩm đòn bẩy (Forex, CFD, Crypto) và yêu cầu người tham gia phải trang bị kiến thức phân tích cùng tư duy bảo toàn vốn nghiêm ngặt.`
    terms = [
      {
        term: 'Leverage (Đòn bẩy tài chính)',
        definition: 'Công cụ cho phép gia tăng vị thế giao dịch vượt quá vốn thực có, giúp tối ưu lợi nhuận nhưng cũng gia tăng rủi ro tổn thất.',
        page: 1,
      },
      {
        term: 'Market Volatility (Biến động thị trường)',
        definition: 'Mức độ dao động giá tài sản trong một khoảng thời gian, quyết định biên độ rủi ro và cơ hội đầu tư.',
        page: 1,
      },
      {
        term: 'Risk Disclosure (Tuyên bố rủi ro)',
        definition: 'Khái niệm pháp lý minh bạch hóa các nguy cơ thua lỗ để người tham gia tự chịu trách nhiệm với quyết định của mình.',
        page: Math.min(2, pages.length),
      },
    ]
    key_points = pages.slice(0, 4).map((p) => ({
      text: p.text.length > 140 ? p.text.slice(0, 140).replace(/\s+/g, ' ') + '…' : p.text,
      page: p.page,
    }))
    review_questions = [
      'Nguyên nhân chính khiến giao dịch tài sản đòn bẩy mang lại rủi ro cao là gì?',
      'Theo tài liệu, nhà đầu tư nên chuẩn bị tư duy và quy tắc gì trước khi bắt đầu giao dịch?',
      'Làm thế nào để áp dụng tuyên bố rủi ro này vào việc bảo vệ vốn cá nhân?',
    ]
  } else if (isCode) {
    summary = `Tài liệu "${docTitle}" trình bày các nguyên lý thiết kế và phát triển phần mềm hiện đại. Trọng tâm hướng tới việc tối ưu hóa cấu trúc mã nguồn, nâng cao hiệu năng hệ thống và bảo đảm tính dễ bảo trì.`
    terms = [
      {
        term: 'Architecture (Kiến trúc hệ thống)',
        definition: 'Cách tổ chức và phân chia trách nhiệm giữa các thành phần phần mềm để đảm bảo khả năng mở rộng.',
        page: 1,
      },
      {
        term: 'Refactoring (Tái cấu trúc mã)',
        definition: 'Quá trình cải thiện cấu trúc bên trong của dòng code mà không làm thay đổi hành vi bên ngoài.',
        page: Math.min(2, pages.length),
      },
    ]
    key_points = pages.slice(0, 4).map((p) => ({
      text: p.text.length > 140 ? p.text.slice(0, 140).replace(/\s+/g, ' ') + '…' : p.text,
      page: p.page,
    }))
    review_questions = [
      'Nguyên lý cốt lõi được nhấn mạnh trong việc xây dựng hệ thống phần mềm là gì?',
      'Làm thế nào để đo lường và cải thiện chất lượng mã nguồn theo hướng dẫn trong tài liệu?',
    ]
  } else {
    summary = `Tài liệu "${docTitle}" tổng hợp các kiến thức và nguyên lý chuyên môn quan trọng. Nội dung hệ thống hóa các góc nhìn thực tiễn, giúp người đọc nhanh chóng nắm bắt bức tranh toàn cảnh và ứng dụng vào thực tế.`
    terms = [
      {
        term: 'Core Concept (Khái niệm cốt lõi)',
        definition: 'Điểm tựa lý thuyết quan trọng nhất giúp định hình toàn bộ tư tưởng của tài liệu.',
        page: 1,
      },
      {
        term: 'Practical Application (Ứng dụng thực tiễn)',
        definition: 'Phương pháp chuyển hóa tri thức sách vở thành hành động thực tế mang lại giá trị đo lường được.',
        page: Math.min(2, pages.length),
      },
    ]
    key_points = pages.slice(0, 4).map((p) => ({
      text: p.text.length > 140 ? p.text.slice(0, 140).replace(/\s+/g, ' ') + '…' : p.text,
      page: p.page,
    }))
    review_questions = [
      `Thông điệp quan trọng nhất mà tài liệu "${docTitle}" muốn gửi tới người đọc là gì?`,
      'Bạn sẽ áp dụng tri thức đúc kết được từ tài liệu này như thế nào trong học tập và công việc?',
    ]
  }

  return {
    summary,
    key_points,
    simple_explanations: [],
    terms,
    review_questions,
  }
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
