import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const authorization = request.headers.get('Authorization')
    if (!authorization) throw new Error('AUTH_REQUIRED: Bạn cần đăng nhập lại.')
    const client = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authorization } } })
    const { data: { user }, error: authError } = await client.auth.getUser()
    if (authError || !user) throw new Error('AUTH_INVALID: Phiên đăng nhập không hợp lệ.')
    const body = await request.json()
    const documentId = String(body.documentId || '')
    const pageNumber = Number(body.pageNumber)
    const selectedText = String(body.selectedText || '').trim().slice(0, 6000)
    const question = String(body.question || '').trim().slice(0, 1000)
    if (!documentId || !pageNumber || !selectedText || !question) throw new Error('INVALID_INPUT: Thiếu đoạn trích hoặc câu hỏi.')

    const { error: saveQuestionError } = await client.from('ai_messages').insert({ document_id: documentId, page_number: pageNumber, role: 'user', selected_text: selectedText, content: question })
    if (saveQuestionError) throw new Error(`DATABASE_ERROR: ${saveQuestionError.message}`)
    const key = Deno.env.get('GROQ_API_KEY')
    if (!key) throw new Error('GROQ_KEY_MISSING: Chưa có GROQ_API_KEY trong Supabase Edge Function Secrets.')
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: Deno.env.get('GROQ_MODEL') || 'openai/gpt-oss-20b',
        messages: [
          { role: 'system', content: 'Bạn là trợ lý đọc hiểu MindTrace. Chỉ trả lời dựa trên đoạn trích người dùng cung cấp. Trả lời rõ ràng bằng tiếng Việt; nếu đoạn trích không đủ, hãy nói chính xác điều còn thiếu.' },
          { role: 'user', content: `Đoạn trích ở trang ${pageNumber}:\n${selectedText}\n\nCâu hỏi: ${question}` },
        ],
        temperature: 0.3,
        max_completion_tokens: 900,
      }),
    })
    const payload = await response.json()
    if (!response.ok) {
      const code = payload?.error?.code || payload?.error?.type || `HTTP_${response.status}`
      const detail = payload?.error?.message || 'Groq chưa thể trả lời.'
      if (response.status === 429) throw new Error('GROQ_RATE_LIMIT: Đã chạm giới hạn Groq miễn phí. Hãy đợi một lúc rồi thử lại.')
      throw new Error(`GROQ_${code}: ${detail}`)
    }
    const answer = String(payload?.choices?.[0]?.message?.content || '').trim()
    if (!answer) throw new Error('GROQ_EMPTY: AI không trả về nội dung.')
    const { error: saveAnswerError } = await client.from('ai_messages').insert({ document_id: documentId, page_number: pageNumber, role: 'assistant', selected_text: selectedText, content: answer })
    if (saveAnswerError) throw new Error(`DATABASE_ERROR: ${saveAnswerError.message}`)
    return new Response(JSON.stringify({ answer }), { headers: { ...cors, 'Content-Type': 'application/json' } })
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Đã có lỗi xảy ra.' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } })
  }
})
