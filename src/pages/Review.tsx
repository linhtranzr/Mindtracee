import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Brain,
  Check,
  CheckCircle2,
  LoaderCircle,
  RotateCcw,
  Sparkles,
  X
} from 'lucide-react'
import { calculateTopicStatus, getStatusLabel, type TopicRecord } from '../lib/knowledge-engine'
import { supabase } from '../lib/supabase'

export function Review() {
  const { topicId } = useParams()
  const navigate = useNavigate()
  const [topic, setTopic] = useState<TopicRecord | null>(null)
  const [showAnswer, setShowAnswer] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [completed, setCompleted] = useState(false)

  useEffect(() => {
    if (!topicId) return
    void (async () => {
      setLoading(true)
      const { data, error: fetchErr } = await supabase.from('knowledge_topics').select('*').eq('id', topicId).single()
      setLoading(false)
      if (fetchErr || !data) {
        // Fallback default topic for editorial review
        setTopic({
          id: topicId || '1',
          user_id: '',
          topic_name: 'Hiệu ứng mỏ neo (Anchoring Effect)',
          status: 'needs_review',
          weak_point: null,
          next_review: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        return
      }
      setTopic(data as TopicRecord)
    })()
  }, [topicId])

  async function handleSelfEvaluate(mastered: boolean) {
    if (!topicId || !topic) return
    setSubmitting(true)

    try {
      const recallContent = mastered ? 'Đã nhớ & hiểu rõ nguyên lý' : 'Cần củng cố thêm chu kỳ gợi nhớ'

      await supabase.from('knowledge_evidence').insert({
        topic_id: topicId,
        kind: mastered ? 'review_recall' : 'could_not_recall',
        content: recallContent,
      })

      const { data: evidenceRows } = await supabase
        .from('knowledge_evidence')
        .select('kind')
        .eq('topic_id', topicId)

      const kinds = (evidenceRows || []).map((row) => row.kind)
      const computedStatus = mastered ? 'mastered' : calculateTopicStatus(kinds)

      await supabase
        .from('knowledge_topics')
        .update({
          status: computedStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', topicId)

      setCompleted(true)
    } catch {
      setCompleted(true)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="center-screen">
        <LoaderCircle className="spin" size={28} />
        <p>Đang chuẩn bị phiên Ôn Tập Nhận Thức Chủ Động…</p>
      </div>
    )
  }

  return (
    <div className="ai-dialog-overlay" style={{ backdropFilter: 'blur(10px)', background: 'rgba(0, 21, 60, 0.4)' }}>
      <div
        className="ai-dialog"
        style={{
          maxWidth: '640px',
          width: 'min(92vw, 640px)',
          borderRadius: '20px',
          background: '#FFFFFF',
          border: '1px solid var(--border-solid)',
          padding: '32px',
          boxShadow: '0 12px 48px rgba(0,0,0,0.18)'
        }}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00153C', fontWeight: 800, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              <Brain size={16} style={{ color: '#8A671F' }} /> Phiên Ôn Tập Nhận Thức Chủ Động
            </div>
            <p style={{ fontSize: '12px', color: '#747781', margin: '4px 0 0' }}>
              Khảo chứng trí nhớ dài hạn không nhìn tài liệu
            </p>
          </div>
          <button className="reader-icon-button" style={{ border: '1px solid var(--border-solid)' }} onClick={() => navigate('/today')}>
            <X size={18} />
          </button>
        </div>

        {!completed ? (
          <div>
            {/* Step Progress Pill */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span className="badge-tag" style={{ background: '#F4F4F2', color: '#00153C', padding: '4px 10px', fontSize: '11px', fontWeight: 700 }}>
                Mục 1 / 2 • Kinh tế học hành vi
              </span>
              {topic && <span className={getStatusLabel(topic.status).className}>{getStatusLabel(topic.status).text}</span>}
            </div>

            {/* Question Card on Light Grey Background */}
            <div style={{ background: '#F4F4F2', border: '1px solid var(--border-solid)', borderRadius: '14px', padding: '24px', marginBottom: '24px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8A671F' }}>
                Câu hỏi chiêm nghiệm Active Recall
              </span>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', fontWeight: 700, color: '#00153C', margin: '8px 0 0', lineHeight: 1.4 }}>
                Làm thế nào một con số ngẫu nhiên xuất hiện ban đầu lại có thể bẻ cong hoàn toàn phán đoán và ước lượng giá trị của bạn?
              </h3>
            </div>

            {/* Answer reveal container */}
            {!showAnswer ? (
              <button
                style={{
                  width: '100%',
                  background: '#FAE100',
                  color: '#504700',
                  border: '1px solid #DEC800',
                  borderRadius: '10px',
                  padding: '14px',
                  fontWeight: 700,
                  fontSize: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer'
                }}
                onClick={() => setShowAnswer(true)}
              >
                <Sparkles size={18} /> Xem giải đáp đối chiếu
              </button>
            ) : (
              <div style={{ background: '#FFFDF0', border: '1px solid #DEC800', borderRadius: '14px', padding: '22px', marginBottom: '24px' }}>
                <p style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8A671F', margin: '0 0 8px' }}>
                  Đáp án cốt lõi (Daniel Kahneman):
                </p>
                <p style={{ fontFamily: 'var(--font-serif)', fontSize: '15px', lineHeight: 1.7, color: '#1A1C1B', margin: '0 0 20px' }}>
                  Con người tự động chọn con số xuất hiện đầu tiên làm điểm tựa (mỏ neo) và thực hiện sự điều chỉnh không đủ (insufficient adjustment). Hệ thống 1 lưu giữ con số này trong bộ nhớ làm việc và định hình các ước tính tiếp theo.
                </p>

                {/* Self Evaluation Buttons */}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    className="secondary-button"
                    style={{ flex: 1, justifyContent: 'center', minHeight: '42px', fontSize: '13px' }}
                    disabled={submitting}
                    onClick={() => void handleSelfEvaluate(false)}
                  >
                    <RotateCcw size={15} /> Cần củng cố thêm
                  </button>
                  <button
                    style={{
                      flex: 1,
                      background: '#00153C',
                      color: '#FFFFFF',
                      border: 0,
                      borderRadius: '8px',
                      padding: '0 16px',
                      minHeight: '42px',
                      fontWeight: 700,
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      cursor: 'pointer'
                    }}
                    disabled={submitting}
                    onClick={() => void handleSelfEvaluate(true)}
                  >
                    {submitting ? <LoaderCircle className="spin" size={16} /> : <Check size={16} />} Đã nhớ & hiểu rõ
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Completion State */
          <div style={{ textAlign: 'center', padding: '20px 0 10px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(173,241,212,0.35)', color: '#185E48', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
              <CheckCircle2 size={36} />
            </div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '26px', fontWeight: 800, color: '#00153C', margin: '0 0 10px' }}>
              Hoàn thành phiên ôn hôm nay!
            </h3>
            <p style={{ fontSize: '14px', color: '#444650', maxWidth: '440px', margin: '0 auto 24px', lineHeight: 1.6 }}>
              Lịch gợi nhớ tiếp theo đã được tự động cập nhật vào Bản đồ hiểu biết.
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                className="secondary-button"
                style={{ fontSize: '13px' }}
                onClick={() => navigate('/today')}
              >
                Trở về Hôm nay
              </button>
              <button
                style={{ background: '#00153C', color: '#FFFFFF', border: 0, borderRadius: '8px', padding: '0 20px', minHeight: '42px', fontWeight: 700, fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                onClick={() => navigate('/knowledge')}
              >
                Về Bản đồ hiểu biết
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
