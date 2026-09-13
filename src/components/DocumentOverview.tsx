import { useEffect, useState } from 'react'
import { BookOpenCheck, HelpCircle, Key, Layers, LoaderCircle, MapPin, RefreshCw, Sparkles, TextQuote } from 'lucide-react'
import { pdfjs } from 'react-pdf'
import { normalizeVietnameseText } from '../lib/vietnamese'
import { supabase } from '../lib/supabase'
import { generateSmartDocumentInsight } from '../lib/ai'

type Insight = {
  summary: string
  key_points: Array<{ text: string; page: number }>
  simple_explanations: Array<{ concept: string; explanation: string; page: number }>
  terms: Array<{ term: string; definition: string; page: number }>
  review_questions: string[]
}

export function DocumentOverview({
  documentId,
  title,
  file,
  onJumpToPage,
}: {
  documentId: string
  title: string
  file: Blob
  onJumpToPage?: (page: number) => void
}) {
  const [insight, setInsight] = useState<Insight | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [revealedQuiz, setRevealedQuiz] = useState<Record<number, boolean>>({})

  useEffect(() => {
    void supabase
      .from('document_insights')
      .select('content')
      .eq('document_id', documentId)
      .maybeSingle()
      .then(({ data }) => setInsight((data?.content as Insight) || null))
  }, [documentId])

  async function analyze() {
    setBusy(true)
    setError('')
    try {
      const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise
      const pages = []
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const text = await page.getTextContent()
        const rawText = text.items.map((x) => ('str' in x ? x.str : '')).join(' ')
        pages.push({ page: i, text: normalizeVietnameseText(rawText) })
      }

      let insightResult: Insight | null = null

      try {
        const { data, error: invokeError } = await supabase.functions.invoke('analyze-document', {
          body: { documentId, title: normalizeVietnameseText(title), pages },
        })
        if (!invokeError && data?.content) {
          insightResult = data.content as Insight
        }
      } catch {
        // Fallback to local intelligent analysis
      }

      if (!insightResult) {
        insightResult = generateSmartDocumentInsight(normalizeVietnameseText(title), pages)
      }

      setInsight(insightResult)

      // Store in DB for future loads if possible
      void supabase.from('document_insights').upsert(
        {
          document_id: documentId,
          content: insightResult,
          source_pages: pages.length,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,document_id' }
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Chưa thể phân tích tài liệu.')
    } finally {
      setBusy(false)
    }
  }

  function toggleQuizReveal(index: number) {
    setRevealedQuiz((prev) => ({ ...prev, [index]: !prev[index] }))

  }

  if (!insight) {
    return (
      <div className="overview-empty">
        <Sparkles size={28} />
        <h3>Hiểu tài liệu trong vài phút</h3>
        <p>AI sẽ đọc nội dung PDF, rút ra ý chính, tổng hợp thuật ngữ và tạo câu hỏi tự kiểm tra.</p>
        {error && <p className="overview-error">{error}</p>}
        <button className="primary-button" onClick={() => void analyze()} disabled={busy}>
          {busy ? <LoaderCircle className="spin" /> : <BookOpenCheck />}
          {busy ? 'Đang phân tích…' : 'Phân tích tổng quan'}
        </button>
      </div>
    )
  }

  return (
    <div className="document-overview">
      <button className="overview-refresh" onClick={() => void analyze()} disabled={busy}>
        <RefreshCw className={busy ? 'spin' : ''} size={14} /> Cập nhật AI
      </button>

      {/* Section 1: Core Summary */}
      <section style={{ marginTop: '12px' }}>
        <h3>
          <TextQuote size={18} style={{ color: 'var(--primary)' }} /> Tóm tắt cốt lõi
        </h3>
        <div className="overview-summary-card">
          <p className="overview-summary">{normalizeVietnameseText(insight.summary)}</p>
        </div>
      </section>

      {/* Section 2: Key Points with Page Citations */}
      {insight.key_points && insight.key_points.length > 0 && (
        <section>
          <h3>
            <Layers size={18} style={{ color: 'var(--primary)' }} /> Ý chính & Dấu vết trang
          </h3>
          {insight.key_points.map((x, i) => (
            <div key={i} className="key-point-item">
              <div className="key-point-header">
                <strong>{normalizeVietnameseText(x.text)}</strong>
                {x.page && (
                  <button
                    className="page-citation-pill"
                    onClick={() => onJumpToPage?.(x.page)}
                    title={`Chuyển đến trang ${x.page}`}
                  >
                    <MapPin size={11} /> Trang {x.page}
                  </button>
                )}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Section 3: Terms & Concepts */}
      {((insight.terms && insight.terms.length > 0) || (insight.simple_explanations && insight.simple_explanations.length > 0)) && (
        <section>
          <h3>
            <Key size={18} style={{ color: 'var(--primary)' }} /> Thuật ngữ & Khái niệm
          </h3>
          <div className="term-grid">
            {insight.terms?.map((x, i) => (
              <div key={i} className="term-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong>{normalizeVietnameseText(x.term)}</strong>
                  {x.page && (
                    <button
                      className="page-citation-pill"
                      onClick={() => onJumpToPage?.(x.page)}
                      style={{ fontSize: '10px', padding: '2px 7px' }}
                    >
                      tr.{x.page}
                    </button>
                  )}
                </div>
                <p>{normalizeVietnameseText(x.definition)}</p>
              </div>
            ))}
            {insight.simple_explanations?.map((x, i) => (
              <div key={`exp-${i}`} className="term-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong>{normalizeVietnameseText(x.concept)}</strong>
                  {x.page && (
                    <button
                      className="page-citation-pill"
                      onClick={() => onJumpToPage?.(x.page)}
                      style={{ fontSize: '10px', padding: '2px 7px' }}
                    >
                      tr.{x.page}
                    </button>
                  )}
                </div>
                <p>{normalizeVietnameseText(x.explanation)}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Section 4: Self-Check Quiz */}
      {insight.review_questions && insight.review_questions.length > 0 && (
        <section>
          <h3>
            <HelpCircle size={18} style={{ color: 'var(--primary)' }} /> Tự kiểm tra ghi nhớ
          </h3>
          {insight.review_questions.map((q, i) => (
            <div key={i} className="quiz-card">
              <div className="quiz-question">
                <span>{i + 1}.</span>
                <span>{normalizeVietnameseText(q)}</span>
              </div>
              <button className="quiz-toggle-btn" onClick={() => toggleQuizReveal(i)}>
                {revealedQuiz[i] ? 'Ẩn đáp án gợi ý' : 'Hiện gợi ý trả lời'}
              </button>
              {revealedQuiz[i] && (
                <div className="quiz-answer">
                  <strong>Gợi ý ôn tập:</strong> Hãy sử dụng tính năng <em>Tự nhớ lại (Free Recall)</em> hoặc tra cứu trang liên quan để củng cố bền vững.
                </div>
              )}
            </div>
          ))}
        </section>
      )}
    </div>
  )
}

