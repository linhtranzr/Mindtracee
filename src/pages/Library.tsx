import { useCallback, useEffect, useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { BookOpen, FileText, FileUp, LoaderCircle, RefreshCw, Trash2, UploadCloud } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { Status } from '../components/Status'
import { fetchDocuments, safeStorageName, validatePdf, type DocumentRecord } from '../lib/documents'
import { savePdfBlobToCache } from '../lib/offline-storage'
import { supabase } from '../lib/supabase'

const formatBytes = (bytes: number) =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`
const formatDate = (value: string) =>
  new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value))

export function Library() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const inputRef = useRef<HTMLInputElement>(null)
  const [documents, setDocuments] = useState<DocumentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [dragActive, setDragActive] = useState(false)

  const loadDocuments = useCallback(async () => {
    setLoading(true)
    setError('')
    const { data, error: loadError } = await fetchDocuments()
    setLoading(false)
    if (loadError) {
      if (loadError.code === '42P01' || loadError.code === '42501') {
        const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('mindtrace_demo_docs') : null
        if (stored) {
          try {
            setDocuments(JSON.parse(stored))
            return
          } catch {
            // ignore
          }
        }
        return setError(
          'Thư viện Supabase chưa được khởi tạo. Hãy chạy file init_all_tables.sql trong Supabase SQL Editor.'
        )
      }
      return setError('Chưa thể tải thư viện. Hãy kiểm tra kết nối rồi thử lại.')
    }
    setDocuments((data || []) as DocumentRecord[])
  }, [])

  useEffect(() => {
    void loadDocuments()
  }, [loadDocuments])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('upload') === 'true') {
      inputRef.current?.click()
    }
  }, [location.search])

  async function processFile(file: File) {
    if (!file || !user) return
    setError('')
    setSuccess('')
    const validationError = validatePdf(file)
    if (validationError) return setError(validationError)
    setUploading(true)
    const docId = `doc-${Date.now()}`
    const path = `${user.id}/${crypto.randomUUID()}-${safeStorageName(file.name)}`

    // Always cache the local PDF blob for seamless offline & demo reader opening
    await savePdfBlobToCache(docId, file).catch(() => {})

    const { error: storageError } = await supabase.storage
      .from('documents')
      .upload(path, file, { contentType: 'application/pdf', upsert: false })
    if (storageError) {
      if (storageError.message.includes('Bucket not found') || storageError.message.includes('row-level security') || storageError.message.includes('42P01')) {
        const newDoc: DocumentRecord = {
          id: docId,
          title: file.name.replace(/\.pdf$/i, ''),
          storage_path: path,
          file_size: file.size,
          status: 'ready',
          progress: 15,
          created_at: new Date().toISOString()
        }
        const updated = [newDoc, ...documents]
        setDocuments(updated)
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('mindtrace_demo_docs', JSON.stringify(updated))
        }
        setUploading(false)
        setSuccess(`Đã thêm “${file.name}” vào Thư viện.`)
        return
      }
      setUploading(false)
      return setError(
        storageError.message.includes('Bucket not found') || storageError.message.includes('row-level security')
          ? 'Private Storage chưa được khởi tạo hoặc policy chưa đúng. Hãy chạy migration Phase 2.'
          : 'Không thể tải PDF lên. Hãy thử lại với tệp khác.'
      )
    }
    const { error: rowError } = await supabase.from('documents').insert({
      id: docId,
      title: file.name.replace(/\.pdf$/i, ''),
      storage_path: path,
      file_size: file.size,
      mime_type: 'application/pdf',
      status: 'ready',
    })
    if (rowError) {
      await supabase.storage.from('documents').remove([path])
      setUploading(false)
      return setError('PDF chưa được ghi vào thư viện. File tạm đã được dọn dẹp an toàn.')
    }
    setUploading(false)
    setSuccess(`Đã thêm “${file.name}” vào thư viện.`)
    await loadDocuments()
  }

  function handleFileInput(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file) void processFile(file)
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file) void processFile(file)
  }

  function openDocument(document: DocumentRecord) {
    navigate(`/reader/${document.id}`)
  }

  async function removeDocument(document: DocumentRecord) {
    if (!window.confirm(`Xóa “${document.title}” khỏi thư viện? Hành động này không thể hoàn tác.`)) return
    setDeletingId(document.id)
    setError('')
    setSuccess('')
    const { error: storageError } = await supabase.storage.from('documents').remove([document.storage_path])
    if (storageError) {
      setDeletingId('')
      return setError('Không thể xóa file. Dữ liệu thư viện vẫn được giữ nguyên.')
    }
    const { error: rowError } = await supabase.from('documents').delete().eq('id', document.id)
    setDeletingId('')
    if (rowError) return setError('File đã xóa nhưng chưa thể cập nhật danh sách. Hãy tải lại trang.')
    setDocuments((items) => items.filter((item) => item.id !== document.id))
    setSuccess('Đã xóa tài liệu.')
  }

  return (
    <section className="page">
      <div className="page-heading-row">
        <div>
          <p className="eyebrow">Không gian học tập AI</p>
          <h1>Thư viện tài liệu</h1>
          <p className="page-lede">PDF của bạn được lưu riêng tư, tự động trích xuất ý chính và hỏi đáp AI.</p>
        </div>
      </div>

      <input ref={inputRef} className="visually-hidden" type="file" accept="application/pdf,.pdf" onChange={handleFileInput} />

      {/* Drag & Drop PDF Dropzone */}
      <div
        className={`studio-upload-dropzone ${dragActive ? 'drag-active' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <div className="studio-upload-icon">
          {uploading ? <LoaderCircle className="spin" size={26} /> : <UploadCloud size={26} />}
        </div>
        <h3 className="studio-upload-title">
          {uploading ? 'Đang tải và xử lý PDF…' : 'Kéo thả file PDF vào đây hoặc bấm để tải lên'}
        </h3>
        <p className="studio-upload-desc">Hỗ trợ các tệp PDF tài liệu, giáo trình, báo cáo tối đa 50 MB.</p>
      </div>

      {error && <Status>{error}</Status>}
      {success && <Status tone="success">{success}</Status>}

      {loading ? (
        <div className="library-loading">
          <LoaderCircle className="spin" />
          <p>Đang tải danh sách tài liệu…</p>
        </div>
      ) : documents.length === 0 ? (
        <div className="empty-card large">
          <FileUp size={30} />
          <h2>Chưa có tài liệu nào</h2>
          <p>Kéo thả tệp PDF ở trên hoặc bấm tải lên để bắt đầu đọc và tương tác với AI.</p>
        </div>
      ) : (
        <div className="document-grid">
          {documents.map((document) => (
            <article className="document-card" key={document.id}>
              <div className="document-icon">
                <FileText size={26} />
              </div>
              <div className="document-info">
                <h2>{document.title}</h2>
                <p>
                  {formatBytes(document.file_size)} · {formatDate(document.created_at)}
                </p>
                <span className="document-status">
                  <span /> Sẵn sàng đọc & AI
                </span>
              </div>
              <div className="document-actions">
                <button className="secondary-button" onClick={() => openDocument(document)}>
                  <BookOpen size={17} /> Đọc & Hỏi AI
                </button>
                <button
                  className="icon-danger"
                  onClick={() => void removeDocument(document)}
                  disabled={deletingId === document.id}
                  aria-label={`Xóa ${document.title}`}
                >
                  {deletingId === document.id ? <RefreshCw className="spin" size={18} /> : <Trash2 size={18} />}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

