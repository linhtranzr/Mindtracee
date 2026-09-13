import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle, HelpCircle, LoaderCircle } from 'lucide-react'
import { calculateTopicStatus, getStatusLabel, type KnowledgeStatus, type TopicRecord } from '../lib/knowledge-engine'
import { supabase } from '../lib/supabase'

export function Review() {
  const { topicId } = useParams()
  const navigate = useNavigate()
  const [topic, setTopic] = useState<TopicRecord | null>(null)
  const [recallInput, setRecallInput] = useState('')
  const [showHint, setShowHint] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [newStatus, setNewStatus] = useState<KnowledgeStatus | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!topicId) return
    void (async () => {
      setLoading(true)
      const { data, error: fetchErr } = await supabase.from('knowledge_topics').select('*').eq('id', topicId).single()
      setLoading(false)
      if (fetchErr || !data) {
        setError('Không tìm thấy chủ đề cần ôn tập.')
        return
      }
      setTopic(data as TopicRecord)
    })()
  }, [topicId])

  async function handleCompleteReview(failed = false) {
    if (!topicId || !topic) return
    setSubmitting(true)
    setError('')

    try {
      const recallContent = failed ? 'Cần gợi nhớ nguồn' : recallInput.trim()

      // 1. Insert append-only evidence
      await supabase.from('knowledge_evidence').insert({
        topic_id: topicId,
        kind: failed ? 'could_not_recall' : 'review_recall',
        content: recallContent,
      })

      // 2. Fetch all evidence for topic to re-calculate status deterministically
      const { data: evidenceRows } = await supabase
        .from('knowledge_evidence')
        .select('kind')
        .eq('topic_id', topicId)

      const kinds = (evidenceRows || []).map((row) => row.kind)
      const computedStatus = calculateTopicStatus(kinds)

      // 3. Update topic status
      await supabase
        .from('knowledge_topics')
        .update({
          status: computedStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', topicId)

      setNewStatus(computedStatus)
      setCompleted(true)
    } catch {
      setError('Chưa thể hoàn tất phiên ôn tập. Dữ liệu của bạn vẫn an toàn.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="center-screen">
        <LoaderCircle className="spin" />
        <p>Đang chuẩn bị phiên ôn tập…</p>
      </div>
    )
  }

  if (error || !topic) {
    return (
      <div className="page narrow">
        <p className="status error">{error || 'Không tìm thấy thông tin chủ đề.'}</p>
        <button className="secondary-button" onClick={() => navigate('/today')}>
          <ArrowLeft size={16} /> Trở về Hôm nay
        </button>
      </div>
    )
  }

  const currentBadge = getStatusLabel(topic.status)

  return (
    <div className="reflection-container">
      <button className="secondary-button" onClick={() => navigate('/today')}>
        <ArrowLeft size={16} /> Trở về Hôm nay
      </button>

      {!completed ? (
        <div className="transition-card">
          <p className="eyebrow">Phiên ôn tập</p>
          <span className={currentBadge.className}>{currentBadge.text}</span>
          <h2>{topic.topic_name}</h2>
          <p className="page-lede">
            Hãy thử diễn đạt lại điểm cốt lõi của chủ đề này theo cách riêng của bạn.
          </p>

          {showHint && (
            <div className="ai-quote" style={{ textAlign: 'left', marginBottom: '20px' }}>
              <HelpCircle size={16} style={{ display: 'inline', marginRight: '6px' }} />
              <strong>Gợi nhớ:</strong> Chủ đề này xuất phát từ tài liệu “{topic.topic_name}”. Thử gợi lại bối cảnh chính khi bạn ghi chú.
            </div>
          )}

          <div className="recall-form">
            <textarea
              value={recallInput}
              onChange={(e) => setRecallInput(e.target.value)}
              placeholder="Nhập phần diễn đạt lại của bạn..."
              rows={5}
            />
            {error && <p className="status error">{error}</p>}
            <div className="recall-actions">
              {!showHint ? (
                <button className="skip-button" type="button" onClick={() => setShowHint(true)}>
                  Xem gợi nhớ
                </button>
              ) : (
                <button className="skip-button" type="button" onClick={() => void handleCompleteReview(true)}>
                  Chưa nhớ rõ
                </button>
              )}
              <button
                className="primary-button"
                type="button"
                disabled={submitting || !recallInput.trim()}
                onClick={() => void handleCompleteReview(false)}
              >
                {submitting ? <LoaderCircle className="spin" size={18} /> : <CheckCircle size={18} />} Hoàn thành ôn tập
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="transition-card">
          <p className="eyebrow">Hoàn tất ôn tập</p>
          <h2>Cập nhật trạng thái</h2>
          {newStatus && (
            <div style={{ margin: '20px 0' }}>
              <p>
                Trạng thái mới:{' '}
                <span className={getStatusLabel(newStatus).className}>{getStatusLabel(newStatus).text}</span>
              </p>
            </div>
          )}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '24px' }}>
            <button className="primary-button" onClick={() => navigate('/today')}>
              Trở về Hôm nay
            </button>
            <button className="secondary-button" onClick={() => navigate('/knowledge')}>
              Xem Bản đồ hiểu biết
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
