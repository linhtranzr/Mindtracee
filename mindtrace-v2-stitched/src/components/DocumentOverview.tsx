import { useEffect, useState } from 'react'
import { BookOpenCheck, LoaderCircle, RefreshCw, Sparkles } from 'lucide-react'
import { pdfjs } from 'react-pdf'
import { normalizeVietnameseText } from '../lib/vietnamese'
import { supabase } from '../lib/supabase'

type Insight = {
  summary: string
  key_points: Array<{ text: string; page: number }>
  simple_explanations: Array<{ concept: string; explanation: string; page: number }>
  terms: Array<{ term: string; definition: string; page: number }>
  review_questions: string[]
}

export function DocumentOverview({ documentId, title, file }: { documentId: string; title: string; file: Blob }) {
  const [insight, setInsight] = useState<Insight | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

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
      const { data, error: invokeError } = await supabase.functions.invoke('analyze-document', {
        body: { documentId, title: normalizeVietnameseText(title), pages },
      })
      if (invokeError || data?.error) throw new Error(data?.error || invokeError?.message)
      setInsight(data.content)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Chưa thể phân tích tài liệu.')
    } finally {
      setBusy(false)
    }
  }

  if (!insight) {
    return (
      <div className="overview-empty">
        <Sparkles size={28} />
        <h3>Hiểu tài liệu trong vài phút</h3>
        <p>AI sẽ đọc chữ trong PDF, rút ra ý chính, giải thích khái niệm và tạo câu hỏi ôn tập.</p>
        {error && <p className="overview-error">{error}</p>}
        <button className="primary-button" onClick={() => void analyze()} disabled={busy}>
          {busy ? <LoaderCircle className="spin" /> : <BookOpenCheck />}
          {busy ? 'Đang phân tích…' : 'Phân tích tài liệu'}
        </button>
      </div>
    )
  }

  return (
    <div className="document-overview">
      <button className="overview-refresh" onClick={() => void analyze()} disabled={busy}>
        <RefreshCw className={busy ? 'spin' : ''} size={14} /> Phân tích lại
      </button>
      <section>
        <h3>Tóm tắt</h3>
        <p className="overview-summary">{normalizeVietnameseText(insight.summary)}</p>
      </section>
      <section>
        <h3>Ý chính</h3>
        <ul className="key-points">
          {insight.key_points?.map((x, i) => (
            <li key={i}>
              <strong>{normalizeVietnameseText(x.text)}</strong> <button>tr.{x.page}</button>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h3>Giải thích dễ hiểu</h3>
        {insight.simple_explanations?.map((x, i) => (
          <article key={i}>
            <strong>{normalizeVietnameseText(x.concept)}</strong>
            <p>{normalizeVietnameseText(x.explanation)}</p>
            <small>Trang {x.page}</small>
          </article>
        ))}
      </section>
      <section>
        <h3>Thuật ngữ</h3>
        {insight.terms?.map((x, i) => (
          <p className="term-row" key={i}>
            <strong>{normalizeVietnameseText(x.term)}:</strong> {normalizeVietnameseText(x.definition)}{' '}
            <small>(tr.{x.page})</small>
          </p>
        ))}
      </section>
      <section>
        <h3>Câu hỏi ôn tập</h3>
        <ol>
          {insight.review_questions?.map((x, i) => (
            <li key={i}>
              <em>{normalizeVietnameseText(x)}</em>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
