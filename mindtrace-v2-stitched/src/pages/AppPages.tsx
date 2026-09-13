import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, BookOpen, Clock3, History, Info, LoaderCircle, Map, RefreshCw, Settings as SettingsIcon, Trash2, X } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { getStatusLabel, type EvidenceRecord, type KnowledgeStatus, type TopicRecord } from '../lib/knowledge-engine'
import { supabase } from '../lib/supabase'

export function Today() {
  const navigate = useNavigate()
  const [documents, setDocuments] = useState<Array<{ id: string; title: string; progress: number }>>([])
  const [reviewTopics, setReviewTopics] = useState<TopicRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void (async () => {
      setLoading(true)
      const { data: docs } = await supabase.from('documents').select('id,title,progress').order('updated_at', { ascending: false }).limit(3)
      const { data: topics } = await supabase.from('knowledge_topics').select('*').in('status', ['needs_review', 'forming']).order('updated_at', { ascending: false })
      setDocuments(docs || [])
      setReviewTopics((topics || []) as TopicRecord[])
      setLoading(false)
    })()
  }, [])

  return (
    <section className="page">
      <p className="eyebrow">Thứ sáu, 11 tháng 9</p>
      <h1>Hôm nay</h1>
      <p className="page-lede">Một nhịp đọc chậm cũng đủ để giữ lại điều đáng nhớ.</p>

      {documents.length > 0 ? (
        <div className="hero-card">
          <div>
            <span className="quiet-label"><BookOpen size={16} /> Tiếp tục đọc</span>
            <h2>{documents[0].title}</h2>
            <p>Tiến độ: {Math.round((documents[0].progress || 0) * 100)}%</p>
          </div>
          <button className="primary-button" onClick={() => navigate(`/reader/${documents[0].id}`)}>
            Đọc tiếp <ArrowRight size={17} />
          </button>
        </div>
      ) : (
        <div className="hero-card">
          <div>
            <span className="quiet-label"><BookOpen size={16} /> Bắt đầu đọc</span>
            <h2>Thư viện đang chờ cuốn sách đầu tiên</h2>
            <p>Tải lên một tài liệu PDF để bắt đầu phiên đọc của bạn.</p>
          </div>
          <button className="primary-button" onClick={() => navigate('/library')}>
            Đến thư viện <ArrowRight size={17} />
          </button>
        </div>
      )}

      <h2 className="section-title">Cần gợi nhớ ({reviewTopics.length})</h2>
      {loading ? (
        <div className="library-loading"><LoaderCircle className="spin" /><p>Đang tải danh sách ôn tập…</p></div>
      ) : reviewTopics.length === 0 ? (
        <div className="empty-card">
          <Clock3 size={25} />
          <h3>Chưa có nội dung cần gợi nhớ</h3>
          <p>Sau các phiên suy ngẫm, những chủ đề đến hạn ôn tập sẽ tự động xuất hiện ở đây.</p>
        </div>
      ) : (
        <div>
          {reviewTopics.map((topic) => {
            const badge = getStatusLabel(topic.status)
            return (
              <div key={topic.id} className="topic-card">
                <div>
                  <span className={badge.className}>{badge.text}</span>
                  <h3 style={{ margin: '8px 0 4px', font: '700 18px var(--font-sans)' }}>{topic.topic_name}</h3>
                </div>
                <button className="secondary-button" onClick={() => navigate(`/review/${topic.id}`)}>
                  <RefreshCw size={15} /> Ôn tập ngay
                </button>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

export function Knowledge() {
  const [topics, setTopics] = useState<TopicRecord[]>([])
  const [filter, setFilter] = useState<KnowledgeStatus | 'all'>('all')
  const [selectedTopic, setSelectedTopic] = useState<TopicRecord | null>(null)
  const [evidenceList, setEvidenceList] = useState<EvidenceRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void (async () => {
      setLoading(true)
      const { data } = await supabase.from('knowledge_topics').select('*').order('updated_at', { ascending: false })
      setTopics((data || []) as TopicRecord[])
      setLoading(false)
    })()
  }, [])

  async function openTopicDetail(topic: TopicRecord) {
    setSelectedTopic(topic)
    const { data } = await supabase.from('knowledge_evidence').select('*').eq('topic_id', topic.id).order('created_at', { ascending: false })
    setEvidenceList((data || []) as EvidenceRecord[])
  }

  const filteredTopics = filter === 'all' ? topics : topics.filter((t) => t.status === filter)

  return (
    <section className="page">
      <p className="eyebrow">Dấu vết học tập</p>
      <h1>Bản đồ hiểu biết</h1>
      <p className="page-lede">Không có điểm số. Chỉ có những chủ đề và bằng chứng giúp bạn hiểu vì sao trạng thái thay đổi.</p>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <button className={filter === 'all' ? 'primary-button' : 'secondary-button'} onClick={() => setFilter('all')}>Tất cả ({topics.length})</button>
        <button className={filter === 'exposed' ? 'primary-button' : 'secondary-button'} onClick={() => setFilter('exposed')}>Đã tiếp xúc</button>
        <button className={filter === 'forming' ? 'primary-button' : 'secondary-button'} onClick={() => setFilter('forming')}>Đang hình thành</button>
        <button className={filter === 'mastered' ? 'primary-button' : 'secondary-button'} onClick={() => setFilter('mastered')}>Nắm chắc</button>
        <button className={filter === 'needs_review' ? 'primary-button' : 'secondary-button'} onClick={() => setFilter('needs_review')}>Cần gợi nhớ</button>
      </div>

      {loading ? (
        <div className="library-loading"><LoaderCircle className="spin" /><p>Đang tải Bản đồ hiểu biết…</p></div>
      ) : filteredTopics.length === 0 ? (
        <div className="empty-card large">
          <Map size={30} />
          <h2>Chưa có dấu vết nào trong mục này</h2>
          <p>Kết thúc một phiên đọc và tự nhớ lại để tạo bằng chứng đầu tiên.</p>
        </div>
      ) : (
        <div>
          {filteredTopics.map((topic) => {
            const badge = getStatusLabel(topic.status)
            return (
              <div key={topic.id} className="topic-card">
                <div>
                  <span className={badge.className}>{badge.text}</span>
                  <h3 style={{ margin: '8px 0 4px', font: '700 20px var(--font-sans)' }}>{topic.topic_name}</h3>
                </div>
                <button className="secondary-button" onClick={() => void openTopicDetail(topic)}>
                  <Info size={16} /> Lịch sử bằng chứng
                </button>
              </div>
            )
          })}
        </div>
      )}

      {selectedTopic && (
        <div className="ai-dialog-overlay" onClick={() => setSelectedTopic(null)}>
          <div className="ai-dialog" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span className={getStatusLabel(selectedTopic.status).className}>{getStatusLabel(selectedTopic.status).text}</span>
                <h3>{selectedTopic.topic_name}</h3>
              </div>
              <button className="reader-icon-button" onClick={() => setSelectedTopic(null)}><X size={20} /></button>
            </div>
            <p className="eyebrow" style={{ marginTop: '16px' }}>Lịch sử bằng chứng (Append-Only)</p>
            <div className="evidence-list">
              {evidenceList.length === 0 ? (
                <p className="notes-empty">Chưa có bằng chứng chi tiết.</p>
              ) : (
                evidenceList.map((ev) => (
                  <div key={ev.id} className="evidence-item">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 650, color: 'var(--primary)' }}>
                      <History size={14} /> {ev.kind}
                    </div>
                    {ev.content && <p style={{ margin: '6px 0 0', color: 'var(--text)' }}>{ev.content}</p>}
                    <small style={{ color: 'var(--muted)' }}>{new Date(ev.created_at).toLocaleDateString('vi-VN')}</small>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
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
      // 1. Fetch user's documents storage paths
      const { data: userDocs } = await supabase.from('documents').select('storage_path').eq('user_id', user.id)
      if (userDocs && userDocs.length > 0) {
        const paths = userDocs.map((d) => d.storage_path)
        await supabase.storage.from('documents').remove(paths)
      }

      // 2. Delete user's records from user-owned tables
      await supabase.from('annotations').delete().eq('user_id', user.id)
      await supabase.from('learning_sessions').delete().eq('user_id', user.id)
      await supabase.from('knowledge_evidence').delete().eq('user_id', user.id)
      await supabase.from('reviews').delete().eq('user_id', user.id)
      await supabase.from('knowledge_topics').delete().eq('user_id', user.id)
      await supabase.from('documents').delete().eq('user_id', user.id)

      // 3. Sign out session safely
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
      <h1>Cài đặt</h1>

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
              style={{ width: '100%', minHeight: '44px', padding: '0 12px', border: '1px solid var(--border)', borderRadius: '8px', marginBottom: '16px' }}
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
