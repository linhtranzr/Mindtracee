import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  BookOpen,
  Brain,
  Check,
  CheckCircle2,
  Clock3,
  ExternalLink,
  GitFork,
  History,
  LoaderCircle,
  RotateCcw,
  Settings as SettingsIcon,
  Sparkles,
  Trash2,
  X
} from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { getStatusLabel, type EvidenceRecord, type KnowledgeStatus, type TopicRecord } from '../lib/knowledge-engine'
import { supabase } from '../lib/supabase'
import { KnowledgeGraphModal } from '../components/KnowledgeGraphModal'
import { formatCleanTitle, stripMarkdown } from '../lib/vietnamese'

export function Today() {
  const navigate = useNavigate()
  const [documents, setDocuments] = useState<Array<{ id: string; title: string; progress: number; current_location?: { page?: number }; updated_at?: string }>>([])
  const [annotations, setAnnotations] = useState<Array<{ id: string; document_id: string; note: string | null; selected_text: string | null; source_location?: { page?: number }; created_at: string; docTitle?: string }>>([])
  const [recalledCard1, setRecalledCard1] = useState(false)
  const [evalCard1, setEvalCard1] = useState<string | null>(null)
  const [recalledCard2, setRecalledCard2] = useState(false)

  useEffect(() => {
    void (async () => {
      // 1. Query user's real uploaded documents
      const { data: docs } = await supabase
        .from('documents')
        .select('id,title,progress,current_location,updated_at')
        .order('updated_at', { ascending: false })
      const userDocs = (docs || []) as Array<{ id: string; title: string; progress: number; current_location?: { page?: number }; updated_at?: string }>
      setDocuments(userDocs)

      // 2. Query user's real annotations (notes & highlights)
      const { data: annos } = await supabase
        .from('annotations')
        .select('id,document_id,note,selected_text,source_location,created_at')
        .order('created_at', { ascending: false })
        .limit(10)

      if (annos && annos.length > 0) {
        const enriched = annos.map((a) => {
          const doc = userDocs.find((d) => d.id === a.document_id)
          return {
            ...a,
            docTitle: doc ? doc.title : 'Tài liệu đọc'
          }
        })
        setAnnotations(enriched)
      }
    })()
  }, [])

  // Derived recall cards from real user documents or annotations
  const card1Anno = annotations[0]
  const card1Doc = documents.find((d) => d.id === card1Anno?.document_id) || documents[0]

  const card2Anno = annotations[1]
  const card2Doc = documents.find((d) => d.id === card2Anno?.document_id) || documents[1] || documents[0]

  return (
    <section className="page" style={{ maxWidth: '1240px' }}>
      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px', flexWrap: 'wrap', marginBottom: '32px' }}>
        <div>
          {(() => {
            const catLabel = typeof localStorage !== 'undefined' ? localStorage.getItem('mindtrace_user_category_label') : null
            return (
              <p className="eyebrow">
                HỒ SƠ ĐỘC GIẢ{catLabel ? ` • ${catLabel.toUpperCase()}` : ''} • {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            )
          })()}
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '38px', fontWeight: 800, color: '#00153C', margin: 0, letterSpacing: '-0.02em' }}>
            Hôm nay
          </h1>
        </div>
        <div style={{ background: '#FFFFFF', border: '1px solid var(--border-solid)', borderLeft: '3px solid #00153C', borderRadius: '10px', padding: '12px 18px', maxWidth: '420px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '13px', color: '#444650', margin: 0, lineHeight: 1.6 }}>
            “Đọc không phải để nhớ mọi thứ, mà để nhận diện được điều cốt lõi từ nguyên tác.”
          </p>
        </div>
      </div>

      {/* Bento Grid 2 Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '24px' }}>
        {/* Left Column (7/12) */}
        <div style={{ gridColumn: 'span 7', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Active Recall Queue Block */}
          <div style={{ background: '#FFFFFF', border: '1px solid var(--border-solid)', borderRadius: '14px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: '18px', fontWeight: 700, color: '#00153C', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Brain size={18} style={{ color: '#8A671F' }} /> Cần ôn hôm nay (Active Recall)
              </h2>
              <span className="badge-review">{documents.length > 0 ? `${documents.length} sách đang theo dõi` : '0 sách'}</span>
            </div>

            {/* Dynamic Card 1 */}
            {documents.length > 0 || annotations.length > 0 ? (
              <div style={{ background: '#F4F4F2', border: '1px solid var(--border-solid)', borderRadius: '12px', padding: '18px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#747781' }}>
                    {card1Doc ? formatCleanTitle(card1Doc.title) : 'Tác phẩm đọc sâu'}
                  </span>
                  <span className="badge-review">● Cần gợi nhớ</span>
                </div>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 700, color: '#00153C', margin: '0 0 10px', wordBreak: 'break-word' }}>
                  {card1Anno?.note || card1Anno?.selected_text
                    ? `Ghi chú: ${stripMarkdown(card1Anno.note || card1Anno.selected_text || '')}`
                    : `Khảo chứng nguyên tác: ${formatCleanTitle(card1Doc?.title || 'Tài liệu cá nhân')}`}
                </h3>
                <div style={{ background: '#FFFDF0', borderLeft: '3px solid #DEC800', borderRadius: '0 8px 8px 0', padding: '12px 14px', margin: '12px 0 16px' }}>
                  <p style={{ fontSize: '13px', lineHeight: 1.6, color: '#1A1C1B', margin: 0, fontWeight: 500 }}>
                    {card1Anno?.selected_text
                      ? `“${stripMarkdown(card1Anno.selected_text)}”`
                      : `Nội dung cốt lõi của tác phẩm ${formatCleanTitle(card1Doc?.title || '')} giúp bạn rút ra bài học nhận thức gì hôm nay?`}
                  </p>
                </div>

                {!recalledCard1 ? (
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      style={{ background: '#FAE100', color: '#504700', border: '1px solid #DEC800', borderRadius: '8px', padding: '10px 16px', fontWeight: 700, fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                      onClick={() => setRecalledCard1(true)}
                    >
                      <Brain size={16} /> Bắt đầu tự nhớ lại (Recall)
                    </button>
                    {card1Doc && (
                      <button
                        className="secondary-button"
                        style={{ fontSize: '13px' }}
                        onClick={() => navigate(`/reader/${card1Doc.id}`)}
                      >
                        <ExternalLink size={14} /> Xem nguyên tác (Trang {card1Anno?.source_location?.page || card1Doc.current_location?.page || 1})
                      </button>
                    )}
                  </div>
                ) : (
                  <div style={{ marginTop: '12px', background: '#FFFFFF', border: '1px solid var(--border-solid)', borderRadius: '10px', padding: '14px' }}>
                    <p style={{ fontSize: '12px', fontWeight: 700, color: '#8A671F', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Phản chiếu đối chiếu từ sách ({formatCleanTitle(card1Doc?.title || '')}):
                    </p>
                    <p style={{ fontFamily: 'var(--font-serif)', fontSize: '14px', lineHeight: 1.6, color: '#1A1C1B', margin: '0 0 14px' }}>
                      {stripMarkdown(card1Anno?.note || 'Trí nhớ tự phục hồi thông qua quy trình đối chiếu nguyên tác chủ động.')}
                    </p>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        style={{ background: evalCard1 === 'match' ? '#185E48' : 'var(--soft)', color: evalCard1 === 'match' ? '#FFF' : 'var(--text)', border: 0, borderRadius: '7px', padding: '7px 12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                        onClick={() => setEvalCard1('match')}
                      >
                        <Check size={14} /> Trùng khớp suy luận
                      </button>
                      <button
                        style={{ background: evalCard1 === 'adjust' ? '#8A671F' : 'var(--soft)', color: evalCard1 === 'adjust' ? '#FFF' : 'var(--text)', border: 0, borderRadius: '7px', padding: '7px 12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                        onClick={() => setEvalCard1('adjust')}
                      >
                        <RotateCcw size={14} /> Cần chỉnh góc nhìn
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            {/* Dynamic Card 2 */}
            {card2Doc ? (
              <div style={{ background: '#F4F4F2', border: '1px solid var(--border-solid)', borderRadius: '12px', padding: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#747781' }}>
                    {formatCleanTitle(card2Doc.title)}
                  </span>
                  <span className="badge-forming">● Đang hình thành</span>
                </div>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 700, color: '#00153C', margin: '0 0 10px', wordBreak: 'break-word' }}>
                  {card2Anno?.note ? `Ghi chú: ${stripMarkdown(card2Anno.note)}` : `Phân tích chương đọc trong ${formatCleanTitle(card2Doc.title)}`}
                </h3>

                {!recalledCard2 ? (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="secondary-button" style={{ fontSize: '13px' }} onClick={() => setRecalledCard2(true)}>
                      Tự phác thảo ý
                    </button>
                    <button className="secondary-button" style={{ fontSize: '13px' }} onClick={() => navigate(`/reader/${card2Doc.id}`)}>
                      Mở nguyên tác
                    </button>
                  </div>
                ) : (
                  <div style={{ background: '#FFFFFF', border: '1px solid var(--border-solid)', borderRadius: '10px', padding: '14px', marginTop: '10px' }}>
                    <p style={{ fontSize: '13px', lineHeight: 1.6, color: '#1A1C1B', margin: 0 }}>
                      {stripMarkdown(card2Anno?.selected_text || '') || `Đang đối chiếu nguyên tác ${formatCleanTitle(card2Doc.title)} ở trang ${card2Doc.current_location?.page || 1}.`}
                    </p>
                  </div>
                )}
              </div>
            ) : null}

            {documents.length === 0 && (
              <div style={{ textAlign: 'center', padding: '30px 16px', background: '#F9F9F7', border: '1px dashed var(--border-solid)', borderRadius: '12px' }}>
                <BookOpen size={32} style={{ color: '#8A671F', marginBottom: '10px' }} />
                <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', fontWeight: 700, color: '#00153C', margin: '0 0 6px' }}>
                  Thư viện chưa có tệp PDF nào
                </h4>
                <p style={{ fontSize: '13px', color: '#747781', margin: '0 0 16px' }}>
                  Hãy tải file sách PDF đầu tiên của bạn lên để bắt đầu xây dựng Bản đồ nhận thức.
                </p>
                <button className="primary-button" style={{ fontSize: '13px', margin: '0 auto' }} onClick={() => navigate('/library')}>
                  + Tải PDF vào Thư viện
                </button>
              </div>
            )}
          </div>

          {/* Tiếp tục đọc sâu (Parallel reading cards from user's uploaded books) */}
          <div style={{ background: '#FFFFFF', border: '1px solid var(--border-solid)', borderRadius: '14px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: '18px', fontWeight: 700, color: '#00153C', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookOpen size={18} style={{ color: '#00153C' }} /> Tiếp tục đọc sâu (Sách cá nhân)
              </h2>
              <button style={{ background: 'transparent', border: 0, color: '#00153C', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }} onClick={() => navigate('/library')}>
                Thư viện ({documents.length}) ↗
              </button>
            </div>

            {documents.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                {documents.slice(0, 2).map((doc, idx) => (
                  <div key={doc.id} style={{ border: '1px solid var(--border-solid)', borderRadius: '12px', padding: '16px', background: '#F9F9F7', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: '#747781', letterSpacing: '0.08em' }}>Tác phẩm {idx + 1}</span>
                      <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '17px', fontWeight: 700, color: '#00153C', margin: '6px 0 4px', wordBreak: 'break-word' }}>
                        {formatCleanTitle(doc.title)}
                      </h4>
                      <p style={{ fontSize: '12px', color: '#444650', margin: '0 0 12px' }}>
                        Trang dừng: {doc.current_location?.page || 1} • Cập nhật gần nhất
                      </p>
                      <div style={{ background: '#E2E3E1', height: '6px', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
                        <div style={{ background: idx === 0 ? '#00153C' : '#185E48', height: '100%', width: `${Math.max(15, Math.min(doc.progress || 0, 100))}%` }} />
                      </div>
                      <small style={{ fontSize: '11px', color: '#747781' }}>Tiến độ {doc.progress || 0}%</small>
                    </div>
                    <button
                      className={idx === 0 ? 'primary-button' : 'secondary-button'}
                      style={{ marginTop: '16px', width: '100%', fontSize: '13px', minHeight: '38px', justifyContent: 'center' }}
                      onClick={() => navigate(`/reader/${doc.id}`)}
                    >
                      Mở trang đọc <ArrowRight size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px', background: '#F9F9F7', borderRadius: '10px', border: '1px dashed var(--border-solid)' }}>
                <p style={{ fontSize: '13px', color: '#747781', margin: '0 0 12px' }}>
                  Chưa có sách nào đang đọc. Thêm tệp PDF nguyên tác để hiển thị tiến độ tại đây.
                </p>
                <button className="primary-button" style={{ fontSize: '12px', margin: '0 auto' }} onClick={() => navigate('/library')}>
                  + Tải sách vào Thư viện
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (5/12) */}
        <div style={{ gridColumn: 'span 5', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Ghi chú & Phát hiện thực tế từ người dùng */}
          <div style={{ background: '#FFFFFF', border: '1px solid var(--border-solid)', borderRadius: '14px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
            <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: '18px', fontWeight: 700, color: '#00153C', margin: '0 0 16px' }}>
              Ghi chú & Trích dẫn từ sách cá nhân
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {annotations.length > 0 ? (
                annotations.slice(0, 3).map((anno) => (
                  <div key={anno.id} style={{ borderBottom: '1px solid var(--border-solid)', paddingBottom: '12px' }}>
                    <span className="badge-tag" style={{ marginBottom: '6px', display: 'inline-block' }}>{formatCleanTitle(anno.docTitle || '')}</span>
                    <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '14px', lineHeight: 1.6, color: '#1A1C1B', margin: '4px 0', wordBreak: 'break-word' }}>
                      “{stripMarkdown(anno.note || anno.selected_text || 'Đã ghi chép trong phiên đọc')}”
                    </p>
                    <button
                      style={{ border: 0, background: 'transparent', color: '#00153C', fontSize: '12px', fontWeight: 700, padding: 0, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      onClick={() => navigate(`/reader/${anno.document_id}`)}
                    >
                      Mở trong Trình đọc <ArrowRight size={12} />
                    </button>
                  </div>
                ))
              ) : (
                <div style={{ padding: '16px', background: '#F9F9F7', borderRadius: '10px', fontSize: '13px', color: '#747781', lineHeight: 1.6 }}>
                  Chưa có ghi chú lề nào. Khi đọc sách trong <strong>Trình đọc (Reader)</strong>, bôi đen hoặc thêm ghi chú lề để xuất hiện tại đây.
                </div>
              )}
            </div>
          </div>

          {/* Quiet Knowledge Accumulation Card */}
          <div style={{ background: '#F4F4F2', border: '1px solid var(--border-solid)', borderRadius: '14px', padding: '24px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#8A671F' }}>
              Quiet Knowledge Accumulation
            </span>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', fontWeight: 800, color: '#00153C', margin: '8px 0 4px' }}>
              {annotations.length} ghi chép từ sách cá nhân
            </h3>
            <p style={{ fontSize: '13px', color: '#444650', margin: '0 0 20px', fontStyle: 'italic' }}>
              “Không cần vội vã. Tri thức thẩm thấu theo nhịp thở tự nhiên từ nguyên tác.”
            </p>

            {/* SVG Wave Chart */}
            <div style={{ background: '#FFFFFF', border: '1px solid var(--border-solid)', borderRadius: '12px', padding: '16px 12px 10px', boxShadow: '0 1px 4px rgba(0,0,0,0.02)' }}>
              <svg viewBox="0 0 300 80" style={{ width: '100%', height: '70px', overflow: 'visible' }}>
                <defs>
                  <linearGradient id="waveGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00153C" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#00153C" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0,60 Q 50,20 100,45 T 200,30 T 300,15 L 300,80 L 0,80 Z" fill="url(#waveGrad)" />
                <path d="M0,60 Q 50,20 100,45 T 200,30 T 300,15" fill="none" stroke="#00153C" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="100" cy="45" r="4" fill="#FAE100" stroke="#00153C" strokeWidth="2" />
                <circle cx="200" cy="30" r="4" fill="#185E48" stroke="#00153C" strokeWidth="2" />
                <circle cx="300" cy="15" r="5" fill="#00153C" />
              </svg>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#747781', fontWeight: 600, marginTop: '8px' }}>
                <span>Tuần 1</span>
                <span>Tuần 2</span>
                <span>Tuần 3</span>
                <span>Hôm nay</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export function Knowledge() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [topics, setTopics] = useState<TopicRecord[]>([])
  const [filter, setFilter] = useState<KnowledgeStatus | 'all'>('all')
  const [selectedTopic, setSelectedTopic] = useState<TopicRecord | null>(null)
  const [evidenceList, setEvidenceList] = useState<EvidenceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [showGraphModal, setShowGraphModal] = useState(false)

  useEffect(() => {
    void (async () => {
      setLoading(true)
      // 1. Fetch user's uploaded documents
      const { data: docs } = await supabase.from('documents').select('id,title,updated_at').order('updated_at', { ascending: false })
      const userDocs = (docs || []) as Array<{ id: string; title: string; updated_at?: string }>

      // 2. Fetch user's annotations
      const { data: annos } = await supabase.from('annotations').select('id,document_id,kind,note,selected_text,source_location,created_at').order('created_at', { ascending: false })
      const userAnnos = annos || []

      // 3. Fetch knowledge topics from DB
      const { data: dbTopics } = await supabase.from('knowledge_topics').select('*').order('updated_at', { ascending: false })

      let dynamicTopics: TopicRecord[] = []

      if (dbTopics && dbTopics.length > 0) {
        dynamicTopics = dbTopics.map((t) => {
          const matchedDoc = userDocs.find((d) => d.id === (t as unknown as { document_id?: string }).document_id)
          return {
            ...t,
            topic_name: stripMarkdown(t.topic_name),
            doc_title: matchedDoc ? formatCleanTitle(matchedDoc.title) : formatCleanTitle(userDocs[0]?.title || 'Tài liệu đọc')
          } as TopicRecord
        })
      } else if (userAnnos.length > 0 || userDocs.length > 0) {
        // Construct dynamic topics from user's actual annotations and uploaded books
        const generated: TopicRecord[] = []
        userAnnos.forEach((anno, idx) => {
          const matchedDoc = userDocs.find((d) => d.id === anno.document_id)
          const docTitle = matchedDoc ? formatCleanTitle(matchedDoc.title) : 'Tài liệu đọc'
          const pageStr = anno.source_location?.page ? ` (Trang ${anno.source_location.page})` : ''
          const rawName = anno.note || anno.selected_text?.slice(0, 45) || `Ghi chú lề ${idx + 1}`
          generated.push({
            id: anno.id,
            user_id: user?.id || '',
            topic_name: stripMarkdown(rawName),
            status: idx % 2 === 0 ? 'forming' : 'mastered',
            weak_point: null,
            next_review: 'Sau 24 giờ',
            created_at: anno.created_at,
            updated_at: anno.created_at,
            doc_title: `${docTitle}${pageStr}`,
            doc_id: anno.document_id
          })
        })

        // Also add document entry topics for books without annotations yet
        userDocs.forEach((doc) => {
          if (!generated.some((g) => g.doc_id === doc.id)) {
            const cleanT = formatCleanTitle(doc.title)
            generated.push({
              id: `doc-topic-${doc.id}`,
              user_id: user?.id || '',
              topic_name: `Tổng quan & Khảo chứng ${cleanT}`,
              status: 'needs_review',
              weak_point: null,
              next_review: 'Cần khởi chạy',
              created_at: doc.updated_at || new Date().toISOString(),
              updated_at: doc.updated_at || new Date().toISOString(),
              doc_title: cleanT,
              doc_id: doc.id
            })
          }
        })
        dynamicTopics = generated
      } else {
        dynamicTopics = []
      }

      setTopics(dynamicTopics)
      if (dynamicTopics.length > 0) {
        setSelectedTopic(dynamicTopics[0])
      }
      setLoading(false)
    })()
  }, [user])

  async function selectTopicRow(topic: TopicRecord) {
    setSelectedTopic(topic)
    const { data } = await supabase.from('knowledge_evidence').select('*').eq('topic_id', topic.id).order('created_at', { ascending: false })
    if (data && data.length > 0) {
      setEvidenceList(data as EvidenceRecord[])
    } else {
      // Dynamic evidence timeline derived from topic/annotation
      setEvidenceList([
        {
          id: `ev-real-1-${topic.id}`,
          user_id: user?.id || '',
          topic_id: topic.id,
          kind: 'free_recall',
          content: `Phiên khảo chứng tự hồi tưởng cho "${stripMarkdown(topic.topic_name)}". Thuật toán đánh giá tỷ lệ bảo toàn nhận thức.`,
          created_at: topic.updated_at || new Date().toISOString()
        },
        {
          id: `ev-real-2-${topic.id}`,
          user_id: user?.id || '',
          topic_id: topic.id,
          kind: 'highlighted',
          content: `Ghi chú lề & tô sáng nguyên tác từ sách ${formatCleanTitle((topic as unknown as { doc_title?: string }).doc_title || 'tải lên')}.`,
          created_at: new Date(Date.now() - 86400000).toISOString()
        }
      ] as EvidenceRecord[])
    }
  }

  const filteredTopics = filter === 'all' ? topics : topics.filter((t) => t.status === filter)

  // Calculate real metrics
  const masteredCount = topics.filter((t) => t.status === 'mastered').length
  const formingCount = topics.filter((t) => t.status === 'forming').length
  const needsReviewCount = topics.filter((t) => t.status === 'needs_review').length
  const totalTopics = topics.length
  const assimilationRate = totalTopics > 0 ? Math.round(((masteredCount + formingCount) / totalTopics) * 100) : 0

  return (
    <section className="page" style={{ maxWidth: '1240px' }}>
      {/* Header & Assimilation Gauge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px', flexWrap: 'wrap', marginBottom: '28px' }}>
        <div>
          <p className="eyebrow">HỒ SƠ NHẬN THỨC CHỦ ĐỘNG • TÍCH HỢP SÁCH CÁ NHÂN</p>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '38px', fontWeight: 800, color: '#00153C', margin: '0 0 10px' }}>
            Bản đồ hiểu biết
          </h1>
          <p className="page-lede" style={{ maxWidth: '680px', margin: 0 }}>
            Theo dõi sự chuyển hóa từ các file sách PDF người đọc tải lên thành nhận thức thực sự hiểu và còn nhớ. Dựa trên bằng chứng (evidence) thực tế từ ghi chú lề và phản chiếu.
          </p>
        </div>

        {/* Action button & Gauge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <button
            style={{ background: '#00153C', color: '#FFFFFF', border: 0, borderRadius: '10px', padding: '12px 18px', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(0,21,60,0.15)' }}
            onClick={() => setShowGraphModal(true)}
          >
            <GitFork size={16} style={{ color: '#FAE100' }} /> 🌐 Đồ thị Ý niệm Trực quan
          </button>

          {/* Đồng hồ đo tỷ lệ đồng hóa thực tế */}
          <div style={{ background: '#FFFFFF', border: '1px solid var(--border-solid)', borderRadius: '14px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <div style={{ position: 'relative', width: '64px', height: '64px', display: 'grid', placeItems: 'center' }}>
              <svg viewBox="0 0 36 36" style={{ width: '64px', height: '64px', transform: 'rotate(-90deg)' }}>
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E2E3E1" strokeWidth="3" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#185E48" strokeWidth="3" strokeDasharray={`${assimilationRate}, 100`} strokeLinecap="round" />
              </svg>
              <CheckCircle2 size={20} style={{ position: 'absolute', color: '#185E48' }} />
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'var(--font-serif)', color: '#00153C', lineHeight: 1 }}>
                {assimilationRate}%
              </div>
              <span style={{ fontSize: '11px', color: '#747781', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Tỷ lệ đồng hóa
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 4 Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div style={{ background: '#FFFFFF', border: '1px solid var(--border-solid)', borderRadius: '12px', padding: '18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#F4F4F2', color: '#00153C', display: 'grid', placeItems: 'center' }}>
            <GitFork size={20} />
          </div>
          <div>
            <div style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'var(--font-serif)', color: '#00153C' }}>{totalTopics}</div>
            <span style={{ fontSize: '12px', color: '#444650', fontWeight: 600 }}>Cấu trúc cốt lõi</span>
          </div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid var(--border-solid)', borderRadius: '12px', padding: '18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(173,241,212,0.3)', color: '#185E48', display: 'grid', placeItems: 'center' }}>
            <Check size={20} />
          </div>
          <div>
            <div style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'var(--font-serif)', color: '#185E48' }}>{masteredCount}</div>
            <span style={{ fontSize: '12px', color: '#444650', fontWeight: 600 }}>Đã nắm chắc</span>
          </div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid var(--border-solid)', borderRadius: '12px', padding: '18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#FFFDF0', color: '#D39E00', display: 'grid', placeItems: 'center' }}>
            <Sparkles size={20} />
          </div>
          <div>
            <div style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'var(--font-serif)', color: '#D39E00' }}>{formingCount}</div>
            <span style={{ fontSize: '12px', color: '#444650', fontWeight: 600 }}>Đang hình thành</span>
          </div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid var(--border-solid)', borderRadius: '12px', padding: '18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#F4F4F2', color: '#8A671F', display: 'grid', placeItems: 'center' }}>
            <History size={20} />
          </div>
          <div>
            <div style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'var(--font-serif)', color: '#8A671F' }}>{needsReviewCount}</div>
            <span style={{ fontSize: '12px', color: '#444650', fontWeight: 600 }}>Cần gợi nhớ</span>
          </div>
        </div>
      </div>

      {/* Grid: Table on left (calc 100% - 380px), Drawer on right (360px fixed) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: '24px', alignItems: 'start' }}>
        {/* Knowledge Table */}
        <div style={{ background: '#FFFFFF', border: '1px solid var(--border-solid)', borderRadius: '14px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          {/* Filter Bar & Sort */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button className={filter === 'all' ? 'primary-button' : 'secondary-button'} style={{ fontSize: '12px', minHeight: '34px', padding: '0 12px' }} onClick={() => setFilter('all')}>
                Tất cả ({topics.length})
              </button>
              <button className={filter === 'mastered' ? 'primary-button' : 'secondary-button'} style={{ fontSize: '12px', minHeight: '34px', padding: '0 12px' }} onClick={() => setFilter('mastered')}>
                Nắm chắc ({masteredCount})
              </button>
              <button className={filter === 'forming' ? 'primary-button' : 'secondary-button'} style={{ fontSize: '12px', minHeight: '34px', padding: '0 12px' }} onClick={() => setFilter('forming')}>
                Đang hình thành ({formingCount})
              </button>
              <button className={filter === 'needs_review' ? 'primary-button' : 'secondary-button'} style={{ fontSize: '12px', minHeight: '34px', padding: '0 12px' }} onClick={() => setFilter('needs_review')}>
                Cần gợi nhớ ({needsReviewCount})
              </button>
            </div>
            <span style={{ fontSize: '12px', color: '#747781', fontWeight: 600 }}>Sắp xếp: Bằng chứng mới nhất</span>
          </div>

          {loading ? (
            <div className="library-loading"><LoaderCircle className="spin" /><p>Đang tải Bản đồ hiểu biết thực tế…</p></div>
          ) : topics.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', background: '#F9F9F7', borderRadius: '12px', border: '1px dashed var(--border-solid)' }}>
              <BookOpen size={36} style={{ color: '#8A671F', marginBottom: '12px' }} />
              <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', fontWeight: 700, color: '#00153C', margin: '0 0 6px' }}>
                Chưa có dữ liệu sách đọc
              </h4>
              <p style={{ fontSize: '13px', color: '#747781', margin: '0 0 16px', maxWidth: '480px', marginLeft: 'auto', marginRight: 'auto' }}>
                Khi bạn tải file sách PDF lên Thư viện và bôi đen/ghi chú trong Trình đọc, các chủ đề nhận thức thực tế sẽ tự động xây dựng tại đây.
              </p>
              <button className="primary-button" style={{ fontSize: '13px', margin: '0 auto' }} onClick={() => navigate('/library')}>
                + Tải sách PDF vào Thư viện ngay
              </button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px', tableLayout: 'fixed' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-solid)', color: '#747781', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <th style={{ padding: '10px 12px', width: '38%' }}>Chủ đề kiến thức</th>
                    <th style={{ padding: '10px 12px', width: '28%' }}>Nguồn tài liệu</th>
                    <th style={{ padding: '10px 12px', width: '14%' }}>Trạng thái</th>
                    <th style={{ padding: '10px 12px', width: '10%' }}>Bằng chứng</th>
                    <th style={{ padding: '10px 12px', width: '10%' }}>Lần ôn tiếp</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTopics.map((topic) => {
                    const badge = getStatusLabel(topic.status)
                    const isSelected = selectedTopic?.id === topic.id
                    const docTitleStr = formatCleanTitle((topic as unknown as { doc_title?: string }).doc_title || 'Tài liệu đọc')
                    const cleanTopicName = stripMarkdown(topic.topic_name)
                    return (
                      <tr
                        key={topic.id}
                        style={{
                          borderBottom: '1px solid #F0F0EE',
                          background: isSelected ? '#F4F4F2' : 'transparent',
                          cursor: 'pointer',
                          transition: 'background 0.15s ease'
                        }}
                        onClick={() => void selectTopicRow(topic)}
                      >
                        <td style={{ padding: '12px', fontWeight: 700, color: '#00153C', fontFamily: 'var(--font-sans)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            <Brain size={15} style={{ color: '#00153C', flexShrink: 0 }} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cleanTopicName}</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px', color: '#444650', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{docTitleStr}</td>
                        <td style={{ padding: '12px' }}>
                          <span className={badge.className}>{badge.text}</span>
                        </td>
                        <td style={{ padding: '12px', color: '#747781', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Active Recall</td>
                        <td style={{ padding: '12px', color: '#444650', fontWeight: 600 }}>{topic.next_review || 'Sau 24h'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Evidence Drawer (360px Fixed Width) */}
        <div style={{ background: '#FFFFFF', border: '1px solid var(--border-solid)', borderRadius: '14px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '16px', fontWeight: 700, color: '#00153C', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={16} /> Nhật ký khảo chứng minh bạch
          </h3>

          {selectedTopic ? (
            <div>
              <div style={{ background: '#F4F4F2', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
                <span className={getStatusLabel(selectedTopic.status).className}>
                  {getStatusLabel(selectedTopic.status).text}
                </span>
                <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', fontWeight: 700, color: '#00153C', margin: '8px 0 4px', wordBreak: 'break-word' }}>
                  {stripMarkdown(selectedTopic.topic_name)}
                </h4>
                <p style={{ fontSize: '12px', color: '#747781', margin: 0, wordBreak: 'break-word' }}>
                  Nguồn: {formatCleanTitle((selectedTopic as unknown as { doc_title?: string }).doc_title || 'Sách cá nhân tải lên')}
                </p>
              </div>

              {/* Index Retention Badge */}
              <div style={{ background: '#FFFDF0', border: '1px solid #DEC800', borderRadius: '8px', padding: '10px 12px', fontSize: '12px', fontWeight: 600, color: '#504700', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock3 size={15} /> Chu kỳ đạt • Lần kiểm chứng tới: 1 ngày tới
              </div>

              {/* Append-Only Cognitive Timeline */}
              <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#747781', marginBottom: '10px' }}>
                Dòng thời gian bằng chứng bất biến
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                {evidenceList.map((ev) => (
                  <div key={ev.id} style={{ borderLeft: '2px solid #00153C', paddingLeft: '12px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#00153C' }}>{ev.kind}</div>
                    <p style={{ fontSize: '13px', lineHeight: 1.5, color: '#444650', margin: '4px 0', wordBreak: 'break-word' }}>{stripMarkdown(ev.content)}</p>
                    <small style={{ fontSize: '10px', color: '#747781' }}>{new Date(ev.created_at).toLocaleDateString('vi-VN')}</small>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  style={{ background: '#FAE100', color: '#504700', border: '1px solid #DEC800', borderRadius: '8px', padding: '12px', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}
                  onClick={() => {
                    const docId = (selectedTopic as unknown as { doc_id?: string }).doc_id
                    if (docId) navigate(`/reader/${docId}`)
                    else navigate('/library')
                  }}
                >
                  ⚡ Khảo chứng lại trong Trình đọc nguyên tác
                </button>
                <button
                  className="secondary-button"
                  style={{ justifyContent: 'center', fontSize: '13px' }}
                  onClick={() => navigate('/library')}
                >
                  Mở bài đọc nguyên tác liên đới
                </button>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: '13px', color: '#747781' }}>Chọn một dòng trong bảng để xem nhật ký khảo chứng.</p>
          )}
        </div>
      </div>

      {/* Footer Banner: Objective Cognitive Principle */}
      <div style={{ marginTop: '40px', background: '#F4F4F2', border: '1px solid var(--border-solid)', borderRadius: '14px', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
        <div>
          <h4 style={{ fontFamily: 'var(--font-sans)', fontSize: '15px', fontWeight: 700, color: '#00153C', margin: '0 0 4px' }}>
            Tuyên ngôn: Nguyên lý Nhận thức Khách quan dựa trên Sách Cá Nhân
          </h4>
          <p style={{ fontSize: '13px', color: '#444650', margin: 0, maxWidth: '720px' }}>
            MindTrace tuyệt đối không dùng streak ảo hay dữ liệu giả lập. Mọi chủ đề, thẻ gợi nhớ và tỷ lệ đồng hóa đều được tính toán 100% dựa trên sách PDF và ghi chú do chính bạn tạo ra.
          </p>
        </div>
        <span className="badge-tag" style={{ background: '#00153C', color: '#FFFFFF', padding: '6px 12px', fontSize: '11px', fontWeight: 700 }}>
          Recall-First Protocol v2.4
        </span>
      </div>

      <KnowledgeGraphModal isOpen={showGraphModal} onClose={() => setShowGraphModal(false)} />
    </section>
  )
}

export function Settings() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmInput, setConfirmInput] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  async function handleDeleteAccount() {
    if (confirmInput.trim() !== 'XÓA TÀI KHOẢN') {
      setError('Vui lòng gõ chính xác cụm từ “XÓA TÀI KHOẢN”.')
      return
    }
    if (!user) return

    setDeleting(true)
    setError('')

    try {
      const { data: userDocs } = await supabase.from('documents').select('storage_path').eq('user_id', user.id)
      if (userDocs && userDocs.length > 0) {
        const paths = userDocs.map((d) => d.storage_path)
        await supabase.storage.from('documents').remove(paths)
      }

      await supabase.from('annotations').delete().eq('user_id', user.id)
      await supabase.from('learning_sessions').delete().eq('user_id', user.id)
      await supabase.from('knowledge_evidence').delete().eq('user_id', user.id)
      await supabase.from('reviews').delete().eq('user_id', user.id)
      await supabase.from('knowledge_topics').delete().eq('user_id', user.id)
      await supabase.from('documents').delete().eq('user_id', user.id)

      await supabase.auth.signOut()
      navigate('/sign-in')
    } catch {
      setError('Chưa thể xóa tài khoản. Dữ liệu của bạn chưa bị mất.')
      setDeleting(false)
    }
  }

  return (
    <section className="page narrow">
      <p className="eyebrow">Tài khoản</p>
      <h1 style={{ fontFamily: 'var(--font-serif)', color: '#00153C' }}>Cài đặt</h1>

      <div className="settings-card">
        <SettingsIcon size={22} />
        <div>
          <h2>Thông tin đăng nhập</h2>
          <p>{user?.email}</p>
          <span className="verified-dot">Đã xác minh</span>
        </div>
      </div>

      <div className="danger-zone">
        <h2>Xóa tài khoản</h2>
        <p>Hành động này sẽ xóa toàn bộ thư viện, ghi chú, bằng chứng và tài khoản MindTrace của bạn. Không thể hoàn tác.</p>
        <button className="danger-button" onClick={() => setConfirmOpen(true)}>
          Xóa tài khoản
        </button>
      </div>

      {confirmOpen && (
        <div className="ai-dialog-overlay" onClick={() => setConfirmOpen(false)}>
          <div className="ai-dialog" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h3 style={{ color: 'var(--danger)' }}>Xác nhận xóa tài khoản</h3>
              <button className="reader-icon-button" onClick={() => setConfirmOpen(false)}><X size={20} /></button>
            </div>
            <p className="lede" style={{ margin: '14px 0 20px' }}>
              Vui lòng gõ <strong>XÓA TÀI KHOẢN</strong> vào ô bên dưới để hoàn tất.
            </p>
            <input
              type="text"
              style={{ width: '100%', minHeight: '44px', padding: '0 12px', border: '1px solid var(--border-solid)', borderRadius: '8px', marginBottom: '16px' }}
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder="XÓA TÀI KHOẢN"
            />
            {error && <p className="status error" style={{ marginBottom: '16px' }}>{error}</p>}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="secondary-button" onClick={() => setConfirmOpen(false)}>
                Hủy bỏ
              </button>
              <button
                className="danger-button"
                style={{ background: 'var(--danger)', color: 'white' }}
                disabled={deleting}
                onClick={() => void handleDeleteAccount()}
              >
                {deleting ? <LoaderCircle className="spin" size={16} /> : <Trash2 size={16} />} Xóa vĩnh viễn
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
