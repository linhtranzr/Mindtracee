import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react'
import { BookOpen, FileText, FileUp, LoaderCircle, RefreshCw, Trash2, UploadCloud } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { Status } from '../components/Status'
import { fetchDocuments, safeStorageName, validatePdf, type DocumentRecord } from '../lib/documents'
import { supabase } from '../lib/supabase'

const formatBytes = (bytes: number) => bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`
const formatDate = (value: string) => new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value))

export function Library() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [documents, setDocuments] = useState<DocumentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadDocuments = useCallback(async () => {
    setLoading(true); setError('')
    const { data, error: loadError } = await fetchDocuments()
    setLoading(false)
    if (loadError) return setError(loadError.code === '42P01' || loadError.code === '42501' ? 'Thư viện Supabase chưa được khởi tạo. Hãy chạy migration Phase 2 trong SQL Editor.' : 'Chưa thể tải thư viện. Hãy kiểm tra kết nối rồi thử lại.')
    setDocuments((data || []) as DocumentRecord[])
  }, [])

  useEffect(() => { void loadDocuments() }, [loadDocuments])

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !user) return
    setError(''); setSuccess('')
    const validationError = validatePdf(file)
    if (validationError) return setError(validationError)
    setUploading(true)
    const path = `${user.id}/${crypto.randomUUID()}-${safeStorageName(file.name)}`
    const { error: storageError } = await supabase.storage.from('documents').upload(path, file, { contentType: 'application/pdf', upsert: false })
    if (storageError) { setUploading(false); return setError(storageError.message.includes('Bucket not found') || storageError.message.includes('row-level security') ? 'Private Storage chưa được khởi tạo hoặc policy chưa đúng. Hãy chạy migration Phase 2.' : 'Không thể tải PDF lên. Hãy thử lại với tệp khác.') }
    const { error: rowError } = await supabase.from('documents').insert({ title: file.name.replace(/\.pdf$/i, ''), storage_path: path, file_size: file.size, mime_type: 'application/pdf', status: 'ready' })
    if (rowError) {
      await supabase.storage.from('documents').remove([path])
      setUploading(false)
      return setError('PDF chưa được ghi vào thư viện. File tạm đã được dọn dẹp an toàn.')
    }
    setUploading(false); setSuccess(`Đã thêm “${file.name}” vào thư viện.`); await loadDocuments()
  }

  function openDocument(document: DocumentRecord) { navigate(`/reader/${document.id}`) }

  async function removeDocument(document: DocumentRecord) {
    if (!window.confirm(`Xóa “${document.title}” khỏi thư viện? Hành động này không thể hoàn tác.`)) return
    setDeletingId(document.id); setError(''); setSuccess('')
    const { error: storageError } = await supabase.storage.from('documents').remove([document.storage_path])
    if (storageError) { setDeletingId(''); return setError('Không thể xóa file. Dữ liệu thư viện vẫn được giữ nguyên.') }
    const { error: rowError } = await supabase.from('documents').delete().eq('id', document.id)
    setDeletingId('')
    if (rowError) return setError('File đã xóa nhưng chưa thể cập nhật danh sách. Hãy tải lại trang.')
    setDocuments((items) => items.filter((item) => item.id !== document.id)); setSuccess('Đã xóa tài liệu.')
  }

  return <section className="page">
    <div className="page-heading-row"><div><p className="eyebrow">Không gian đọc riêng</p><h1>Thư viện</h1><p className="page-lede">PDF của bạn được lưu riêng tư và đồng bộ theo tài khoản.</p></div>{documents.length > 0 && <button className="primary-button" onClick={() => inputRef.current?.click()} disabled={uploading}><UploadCloud size={18} />{uploading ? 'Đang tải…' : 'Tải PDF lên'}</button>}</div>
    <input ref={inputRef} className="visually-hidden" type="file" accept="application/pdf,.pdf" onChange={upload} />
    {error && <Status>{error}</Status>}{success && <Status tone="success">{success}</Status>}
    {loading ? <div className="library-loading"><LoaderCircle className="spin" /><p>Đang tải thư viện…</p></div> : documents.length === 0 ? <div className="empty-card large"><FileUp size={30} /><h2>Thêm tài liệu đầu tiên</h2><p>Chọn một tệp PDF tối đa 50 MB. Tài liệu chỉ có thể được truy cập bởi tài khoản của bạn.</p><button className="primary-button" onClick={() => inputRef.current?.click()} disabled={uploading}>{uploading ? <><LoaderCircle className="spin" size={18} />Đang tải PDF…</> : 'Chọn PDF từ máy'}</button></div> : <div className="document-grid">{documents.map((document) => <article className="document-card" key={document.id}><div className="document-icon"><FileText size={26} /></div><div className="document-info"><h2>{document.title}</h2><p>{formatBytes(document.file_size)} · {formatDate(document.created_at)}</p><span className="document-status"><span /> Sẵn sàng đọc</span></div><div className="document-actions"><button className="secondary-button" onClick={() => openDocument(document)}><BookOpen size={17} /> Đọc & ghi chú</button><button className="icon-danger" onClick={() => removeDocument(document)} disabled={deletingId === document.id} aria-label={`Xóa ${document.title}`}>{deletingId === document.id ? <RefreshCw className="spin" size={18} /> : <Trash2 size={18} />}</button></div></article>)}</div>}
  </section>
}
