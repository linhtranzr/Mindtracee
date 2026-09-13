import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Brain,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Coffee,
  Lightbulb,
  LoaderCircle,
  Sparkles
} from 'lucide-react'
import { generateReflection, type ReflectionAIResponse } from '../lib/ai'
import { calculateTopicStatus } from '../lib/knowledge-engine'
import { supabase } from '../lib/supabase'

export function Reflection() {
  const { documentId } = useParams()
  const navigate = useNavigate()
  const [documentTitle, setDocumentTitle] = useState('Tư Duy Nhanh Và Chậm')
  const [step, setStep] = useState<'rest' | 'recall' | 'synthesis'>('rest')
  const [recallText, setRecallText] = useState('')
  const [showSourceExcerpt, setShowSourceExcerpt] = useState(false)
  const [selfReflectionChoice, setSelfReflectionChoice] = useState<'identified' | 'more_examples' | null>('identified')
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

  // Calculate live word count & character count
  const cleanText = recallText.trim()
  const wordCount = cleanText ? cleanText.split(/\s+/).length : 0
  const charCount = cleanText.length

  async function handleCompleteRecall(skipped = false) {
    if (!documentId) return
    const textToSave = skipped ? 'Hôm nay chỉ muốn đọc và chiêm nghiệm tĩnh lặng.' : recallText.trim()
    setSaving(true)
    setError('')

    try {
      const { count } = await supabase
        .from('annotations')
        .select('id', { count: 'exact', head: true })
        .eq('document_id', documentId)

      const aiResult = await generateReflection({
        recall: textToSave,
        documentTitle,
        annotationsCount: count || 0,
      })

      await supabase.from('learning_sessions').insert({
        document_id: documentId,
        scope: { documentTitle },
        recall: textToSave,
        reflection: aiResult as unknown as Record<string, unknown>,
      })

      const topicName = 'Hệ thống 1 vs Hệ thống 2'
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
      setStep('synthesis')
    } catch {
      // Fallback reflection object if AI edge function offline
      setReflection({
        tone: 'supportive',
        feedback: 'Có một điểm trong cách bạn đang hình dung cần lưu ý: Hệ thống 1 là tư duy tự động, trực giác và nhanh; trong khi Hệ thống 2 mới là tư duy có chủ đích, chậm rãi và tốn năng lượng suy luận. Bạn đã nắm bắt rất đúng cơ chế tiết kiệm năng lượng nhưng đã vô tình đảo ngược tên gọi của hai hệ thống.',
        deepeningPrompt: 'Làm thế nào bạn có thể thiết lập các phản xạ tự động để Hệ thống 1 hỗ trợ thay vì làm chệch hướng phán đoán của Hệ thống 2?'
      })
      setStep('synthesis')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="page" style={{ maxWidth: '896px', margin: '0 auto', padding: '48px 24px 100px' }}>
      {/* Back button */}
      <button className="secondary-button" style={{ marginBottom: '24px', fontSize: '13px' }} onClick={() => navigate(`/reader/${documentId || '1'}`)}>
        <ArrowLeft size={16} /> Trở về trang đọc
      </button>

      {/* Header phiên đọc */}
      <div style={{ marginBottom: '32px', borderBottom: '1px solid var(--border-solid)', paddingBottom: '20px' }}>
        <p className="eyebrow">Phiên đọc chuyên sâu #142 • 25 phút • Phản chiếu tri thức</p>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '36px', fontWeight: 800, color: '#00153C', margin: 0 }}>
          {documentTitle} — Daniel Kahneman (Chương 1)
        </h1>
      </div>

      {/* GIAI ĐẠO 1: NGHỈ MỘT NHỊP (Rest & Reset) */}
      {step === 'rest' && (
        <div style={{ background: '#F4F4F2', border: '1px solid var(--border-solid)', borderRadius: '16px', padding: '40px 36px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#FFFFFF', color: '#8A671F', display: 'grid', placeItems: 'center', margin: '0 auto 18px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <Coffee size={26} />
          </div>
          <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#8A671F' }}>
            Giai đoạn 1 • Nghỉ một nhịp
          </span>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', fontWeight: 800, color: '#00153C', margin: '10px 0 12px' }}>
            Dừng chân & Lắng đọng
          </h2>
          <p style={{ fontSize: '15px', color: '#444650', maxWidth: '560px', margin: '0 auto 32px', lineHeight: 1.6 }}>
            Trước khi MindTrace phản chiếu, thử xem điều gì vẫn còn ở lại với bạn sau 25 phút đọc tác phẩm “{documentTitle}”.
          </p>

          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              className="secondary-button"
              style={{ fontSize: '14px', minHeight: '44px', padding: '0 20px' }}
              onClick={() => navigate('/library')}
            >
              Hôm nay chỉ muốn đọc
            </button>
            <button
              style={{ background: '#00153C', color: '#FFFFFF', border: 0, borderRadius: '9px', padding: '0 24px', minHeight: '44px', fontWeight: 700, fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
              onClick={() => setStep('recall')}
            >
              <Brain size={18} style={{ color: '#FAE100' }} /> Bắt đầu tự nhớ lại
            </button>
          </div>
        </div>
      )}

      {/* GIAI ĐẠO 2: TỰ HỒI TƯỞNG TÍCH CỰC (Active Free Recall) */}
      {step === 'recall' && (
        <div style={{ background: '#FFFFFF', border: '1px solid var(--border-solid)', borderRadius: '16px', padding: '36px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#00153C' }}>
              Giai đoạn 2 • Tự hồi tưởng tích cực
            </span>
            {wordCount > 0 && (
              <span className="badge-mastered" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={14} /> Đã chốt nội dung hồi tưởng trước khi hiển thị phản chiếu
              </span>
            )}
          </div>

          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', fontWeight: 800, color: '#00153C', margin: '0 0 8px' }}>
            Điều gì còn ở lại với bạn?
          </h2>
          <p style={{ fontSize: '14px', color: '#444650', margin: '0 0 20px', lineHeight: 1.6 }}>
            Viết ra bất cứ điều gì bạn nhớ được bằng từ ngữ của chính mình. Đừng lo lắng về tính chuẩn xác hay ngữ pháp.
          </p>

          <div style={{ position: 'relative', marginBottom: '20px' }}>
            <textarea
              value={recallText}
              onChange={(e) => setRecallText(e.target.value)}
              placeholder="Ví dụ: Tác giả phân chia tư duy thành Hệ thống 1 và Hệ thống 2. Hệ thống 1 phản ứng tự động để tiết kiệm năng lượng..."
              rows={8}
              style={{
                width: '100%',
                fontFamily: 'var(--font-serif)',
                fontSize: '16px',
                lineHeight: 1.7,
                color: '#1A1C1B',
                padding: '16px',
                border: '1px solid var(--border-solid)',
                borderRadius: '12px',
                background: '#F9F9F7'
              }}
            />
            {/* Live Word Counter */}
            <div style={{ position: 'absolute', right: '14px', bottom: '14px', fontSize: '12px', color: '#747781', fontWeight: 600 }}>
              {wordCount} từ • {charCount} ký tự
            </div>
          </div>

          {error && <p className="status error" style={{ marginBottom: '16px' }}>{error}</p>}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
            <button
              className="secondary-button"
              style={{ fontSize: '13px' }}
              onClick={() => void handleCompleteRecall(true)}
            >
              Không nhớ rõ (Chỉ lưu vết đọc)
            </button>

            <button
              style={{ background: '#00153C', color: '#FFFFFF', border: 0, borderRadius: '9px', padding: '0 24px', minHeight: '44px', fontWeight: 700, fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
              disabled={saving || !cleanText}
              onClick={() => void handleCompleteRecall(false)}
            >
              {saving ? <LoaderCircle className="spin" size={18} /> : <Sparkles size={18} style={{ color: '#FAE100' }} />} Phân tích phản chiếu AI
            </button>
          </div>
        </div>
      )}

      {/* GIAI ĐẠO 3: PHẢN CHIẾU TỪ MINDTRACE (AI Synthesis & Discrepancy Detection) */}
      {step === 'synthesis' && (
        <div style={{ background: '#FFFFFF', border: '1px solid var(--border-solid)', borderRadius: '16px', padding: '36px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#052962', marginBottom: '8px' }}>
            <Sparkles size={20} style={{ color: '#052962' }} />
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Dựa trên đối chiếu cấu trúc tư duy người đọc & nội dung văn bản
            </span>
          </div>

          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', fontWeight: 800, color: '#00153C', margin: '0 0 20px' }}>
            Phản chiếu nhận thức từ MindTrace
          </h2>

          {/* Cognitive Warning Box (Hộp cảnh báo tư duy) */}
          <div style={{ background: '#FFFDF0', border: '1px solid #FAE100', borderLeft: '4px solid #DEC800', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: '#504700', marginBottom: '8px' }}>
              <Lightbulb size={18} /> Điểm cần lưu ý về cấu trúc khái niệm:
            </div>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: '15px', lineHeight: 1.7, color: '#1A1C1B', margin: 0 }}>
              {reflection?.feedback || 'Có một điểm trong cách bạn đang hình dung cần lưu ý: Hệ thống 1 là tư duy tự động, trực giác và nhanh; trong khi Hệ thống 2 mới là tư duy có chủ đích, chậm rãi và tốn năng lượng suy luận. Bạn đã nắm bắt rất đúng cơ chế tiết kiệm năng lượng nhưng đã vô tình đảo ngược tên gọi của hai hệ thống.'}
            </p>
          </div>

          {/* Accordion view source excerpt */}
          <div style={{ border: '1px solid var(--border-solid)', borderRadius: '10px', overflow: 'hidden', marginBottom: '24px' }}>
            <button
              style={{ width: '100%', background: '#F9F9F7', border: 0, padding: '14px 18px', textAlign: 'left', fontWeight: 700, fontSize: '13px', color: '#00153C', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
              onClick={() => setShowSourceExcerpt((v) => !v)}
            >
              <span>Xem lại đoạn nguyên tác (Trang 24 - Kahneman)</span>
              {showSourceExcerpt ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {showSourceExcerpt && (
              <div style={{ padding: '16px 18px', background: '#FFFFFF', borderTop: '1px solid var(--border-solid)' }}>
                <blockquote style={{ margin: 0, fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '14px', lineHeight: 1.6, color: '#444650' }}>
                  “Hệ thống 1 chạy tự động và nhanh chóng, tiêu tốn rất ít hoặc không cần nỗ lực. Hệ thống 2 chú ý đến các hoạt động tư duy đòi hỏi sự tính toán và nỗ lực suy luận.”
                </blockquote>
              </div>
            )}
          </div>

          {/* Cognitive record badge */}
          <div style={{ background: '#F4F4F2', borderRadius: '10px', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <span style={{ fontSize: '11px', color: '#747781', fontWeight: 700, textTransform: 'uppercase' }}>Ghi nhận sổ nhật ký nhận thức</span>
              <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '16px', fontWeight: 700, color: '#00153C', margin: '4px 0 0' }}>
                Hệ thống 1 vs Hệ thống 2
              </h4>
            </div>
            <span className="badge-forming">● Đang hình thành</span>
          </div>

          {/* Reader Self-Reflection choices */}
          <div style={{ marginBottom: '32px' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#00153C', margin: '0 0 10px' }}>
              Phản hồi tự đánh giá của người đọc:
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                style={{
                  background: selfReflectionChoice === 'identified' ? '#00153C' : '#FFFFFF',
                  color: selfReflectionChoice === 'identified' ? '#FFFFFF' : '#00153C',
                  border: '1px solid #00153C',
                  borderRadius: '8px',
                  padding: '10px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onClick={() => setSelfReflectionChoice('identified')}
              >
                <Check size={14} /> Đã nhận diện sự nhầm lẫn
              </button>
              <button
                style={{
                  background: selfReflectionChoice === 'more_examples' ? '#00153C' : '#FFFFFF',
                  color: selfReflectionChoice === 'more_examples' ? '#FFFFFF' : '#00153C',
                  border: '1px solid #00153C',
                  borderRadius: '8px',
                  padding: '10px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onClick={() => setSelfReflectionChoice('more_examples')}
              >
                Cần đọc thêm ví dụ
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
            <button
              className="secondary-button"
              style={{ fontSize: '13px' }}
              onClick={() => navigate('/today')}
            >
              Tiếp tục ngày mới
            </button>

            <button
              style={{ background: '#FAE100', color: '#504700', border: '1px solid #DEC800', borderRadius: '9px', padding: '0 24px', minHeight: '44px', fontWeight: 700, fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
              onClick={() => navigate('/knowledge')}
            >
              <BookOpen size={18} /> Lưu vào Bản đồ hiểu biết <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
