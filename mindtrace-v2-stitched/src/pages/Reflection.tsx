import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, BookOpen, CheckCircle, Lightbulb, LoaderCircle, Sparkles } from 'lucide-react'
import { generateReflection, type ReflectionAIResponse } from '../lib/ai'
import { calculateTopicStatus } from '../lib/knowledge-engine'
import { supabase } from '../lib/supabase'

export function Reflection() {
  const { documentId } = useParams()
  const navigate = useNavigate()
  const [documentTitle, setDocumentTitle] = useState('tài liệu')
  const [step, setStep] = useState<'transition' | 'recall' | 'reflection'>('transition')
  const [recallText, setRecallText] = useState('')
  const [saving, setSaving] = useState(false)
  const [reflection, setReflection] = useState<ReflectionAIResponse | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!documentId) return
    void (async () => {
      const { data } = await supabase.from('documents').select('title').eq('id', documentId).single()
      if (data?.title) setDocumentTitle(data.title)
    })()
  }, [documentId])

  async function handleCompleteRecall(skipped = false) {
    if (!documentId) return
    const textToSave = skipped ? 'Mình không nhớ rõ' : recallText.trim()
    setSaving(true)
    setError('')

    try {
      // 1. Fetch user's annotations count for context
      const { count } = await supabase
        .from('annotations')
        .select('id', { count: 'exact', head: true })
        .eq('document_id', documentId)

      // 2. Generate AI reflection
      const aiResult = await generateReflection({
        recall: textToSave,
        documentTitle,
        annotationsCount: count || 0,
      })

      // 3. Persist learning session
      await supabase.from('learning_sessions').insert({
        document_id: documentId,
        scope: { documentTitle },
        recall: textToSave,
        reflection: aiResult as unknown as Record<string, unknown>,
      })

      // 4. Create or update knowledge topic & evidence
      const topicName = documentTitle
      const { data: existingTopic } = await supabase
        .from('knowledge_topics')
        .select('id, status')
        .eq('topic_name', topicName)
        .maybeSingle()

      let topicId = existingTopic?.id
      if (!topicId) {
        const { data: newTopic } = await supabase
          .from('knowledge_topics')
          .insert({
            topic_name: topicName,
            status: calculateTopicStatus(['read', skipped ? 'could_not_recall' : 'free_recall']),
          })
          .select('id')
          .single()
        topicId = newTopic?.id
      } else {
        const newStatus = calculateTopicStatus(['read', skipped ? 'could_not_recall' : 'free_recall'])
        await supabase.from('knowledge_topics').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', topicId)
      }

      if (topicId) {
        await supabase.from('knowledge_evidence').insert({
          topic_id: topicId,
          kind: skipped ? 'could_not_recall' : 'free_recall',
          content: textToSave,
        })
      }

      setReflection(aiResult)
      setStep('reflection')
    } catch {
      setError('Chưa thể hoàn tất phản chiếu. Nội dung của bạn đã được ghi lại an toàn.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="reflection-container">
      <button className="secondary-button" onClick={() => navigate(`/reader/${documentId}`)}>
        <ArrowLeft size={16} /> Trở về Reader
      </button>

      {step === 'transition' && (
        <div className="transition-card">
          <p className="eyebrow">Phiên đọc dừng chân</p>
          <h2>Nghỉ một nhịp.</h2>
          <p className="page-lede">
            Trước khi MindTrace phản chiếu, thử xem điều gì vẫn còn ở lại với bạn từ “{documentTitle}”.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '24px' }}>
            <button className="primary-button" onClick={() => setStep('recall')}>
              <Sparkles size={18} /> Nhớ lại cùng MindTrace
            </button>
            <button className="secondary-button" onClick={() => navigate('/library')}>
              Hôm nay chỉ muốn đọc
            </button>
          </div>
        </div>
      )}

      {step === 'recall' && (
        <div className="transition-card">
          <p className="eyebrow">Free Recall</p>
          <h2>Điều gì còn ở lại với bạn?</h2>
          <p className="page-lede">
            Không cần nhớ chính xác. Hãy kể lại phần vừa đọc theo cách hiểu của bạn.
          </p>
          <div className="recall-form">
            <textarea
              value={recallText}
              onChange={(e) => setRecallText(e.target.value)}
              placeholder="Ví dụ: Tác giả nhấn mạnh việc nhớ lại chủ động giúp kiến thức được củng cố tốt hơn..."
              rows={6}
            />
            {error && <p className="status error">{error}</p>}
            <div className="recall-actions">
              <button className="skip-button" type="button" onClick={() => void handleCompleteRecall(true)}>
                Mình không nhớ rõ
              </button>
              <button
                className="primary-button"
                type="button"
                disabled={saving || !recallText.trim()}
                onClick={() => void handleCompleteRecall(false)}
              >
                {saving ? <LoaderCircle className="spin" size={18} /> : <CheckCircle size={18} />} Gửi phản chiếu
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 'reflection' && reflection && (
        <div className="transition-card" style={{ textAlign: 'left' }}>
          <p className="eyebrow">Phản chiếu từ MindTrace</p>
          <h2>Phản chiếu cá nhân</h2>
          <div style={{ margin: '20px 0', lineHeight: 1.6 }}>
            <p>{reflection.feedback}</p>
            {reflection.deepeningPrompt && (
              <div className="ai-quote" style={{ marginTop: '16px' }}>
                <Lightbulb size={16} style={{ display: 'inline', marginRight: '8px' }} />
                <strong>Gợi mở đào sâu:</strong> {reflection.deepeningPrompt}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '28px' }}>
            <button className="primary-button" onClick={() => navigate('/knowledge')}>
              <BookOpen size={18} /> Xem Bản đồ hiểu biết
            </button>
            <button className="secondary-button" onClick={() => navigate('/library')}>
              Trở về thư viện
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
