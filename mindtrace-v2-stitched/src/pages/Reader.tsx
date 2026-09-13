import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Bot, Brush, Check, ChevronLeft, ChevronRight, Eraser, Highlighter, LoaderCircle, Minus, MoreVertical, NotebookPen, PanelRightClose, PanelRightOpen, Pencil, Plus, RotateCcw, Save, Send, Sparkles, Trash2, X } from 'lucide-react'
import { Document, Page, pdfjs } from 'react-pdf'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import '../reader-tools.css'
import { InkCanvas, type InkStroke } from '../components/InkCanvas'
import { DocumentOverview } from '../components/DocumentOverview'
import { FormattedAiMessage } from '../components/FormattedAiMessage'
import { Status } from '../components/Status'
import { normalizeVietnameseText } from '../lib/vietnamese'
import { supabase } from '../lib/supabase'

pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()

type ReaderDocument = { id: string; title: string; storage_path: string; progress: number; current_location: { page?: number } | null }
type Annotation = { id: string; kind: 'note' | 'highlight' | 'ink'; note: string | null; selected_text: string | null; source_location: { page?: number; strokes?: InkStroke[] }; created_at: string }
type AiMessage = { id: string; role: 'user' | 'assistant'; page_number: number; selected_text: string | null; content: string; created_at: string }
type Panel = 'overview' | 'notes' | 'ai'

const colors = ['#e63946', '#f4bd25', '#7acd38', '#16b9d4', '#8b32c9', '#248c75', '#ffffff']

export function Reader() {
  const { documentId } = useParams()
  const navigate = useNavigate()
  const stageRef = useRef<HTMLDivElement>(null)
  const [document, setDocument] = useState<ReaderDocument | null>(null)
  const [fileData, setFileData] = useState<Blob | null>(null)
  const [numPages, setNumPages] = useState(0)
  const [pageNumber, setPageNumber] = useState(1)
  const [zoom, setZoom] = useState(1)
  const [stageWidth, setStageWidth] = useState(900)
  const [panelOpen, setPanelOpen] = useState(true)
  const [panel, setPanel] = useState<Panel>('notes')
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [messages, setMessages] = useState<AiMessage[]>([])
  const [messageMenu, setMessageMenu] = useState('')
  const [editingMessage, setEditingMessage] = useState('')
  const [editedMessage, setEditedMessage] = useState('')
  const [note, setNote] = useState('')
  const [question, setQuestion] = useState('')
  const [selectedText, setSelectedText] = useState('')
  const [drawMode, setDrawMode] = useState(false)
  const [inkColor, setInkColor] = useState(colors[0])
  const [inkWidth, setInkWidth] = useState(4)
  const [draftStrokes, setDraftStrokes] = useState<InkStroke[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [asking, setAsking] = useState(false)
  const [aiNeedsCredit, setAiNeedsCredit] = useState(false)
  const [error, setError] = useState('')

  const loadWorkspace = useCallback(async () => {
    if (!documentId) return
    const [annotationResult, messageResult] = await Promise.all([
      supabase.from('annotations').select('id,kind,note,selected_text,source_location,created_at').eq('document_id', documentId).order('created_at', { ascending: false }),
      supabase.from('ai_messages').select('id,role,page_number,selected_text,content,created_at').eq('document_id', documentId).order('created_at'),
    ])
    setAnnotations((annotationResult.data || []) as Annotation[])
    setMessages((messageResult.data || []) as AiMessage[])
  }, [documentId])

  useEffect(() => {
    if (!documentId) return
    let active = true
    void (async () => {
      const { data: row, error: rowError } = await supabase.from('documents').select('id,title,storage_path,progress,current_location').eq('id', documentId).single()
      if (!active) return
      if (rowError || !row) { setError('Không tìm thấy tài liệu hoặc bạn không có quyền truy cập.'); setLoading(false); return }
      const typedRow = row as ReaderDocument
      const { data: pdfBlob, error: downloadError } = await supabase.storage.from('documents').download(typedRow.storage_path)
      if (!active) return
      if (downloadError || !pdfBlob) { setError('Không thể tải PDF từ thư viện riêng tư. Hãy đăng nhập lại rồi thử lần nữa.'); setLoading(false); return }
      setDocument(typedRow); setPageNumber(typedRow.current_location?.page || 1); setFileData(pdfBlob); setLoading(false); await loadWorkspace()
    })()
    return () => { active = false }
  }, [documentId, loadWorkspace])

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const observer = new ResizeObserver(([entry]) => setStageWidth(entry.contentRect.width))
    observer.observe(stage)
    return () => observer.disconnect()
  }, [loading])

  function onPdfLoaded(pdf: PDFDocumentProxy) { setError(''); setNumPages(pdf.numPages); setPageNumber((page) => Math.min(page, pdf.numPages)) }
  function onPdfError() { setError('Không thể hiển thị PDF này. File có thể bị hỏng, được đặt mật khẩu hoặc trình duyệt không hỗ trợ.') }

  async function changePage(next: number) {
    const page = Math.max(1, Math.min(numPages || 1, next))
    setPageNumber(page); setSelectedText(''); setDraftStrokes([])
    if (documentId && numPages) await supabase.from('documents').update({ current_location: { page }, progress: page / numPages, updated_at: new Date().toISOString() }).eq('id', documentId)
  }

  function captureSelection() {
    if (drawMode) return
    const selection = window.getSelection()?.toString().trim() || ''
    if (selection) { setSelectedText(normalizeVietnameseText(selection.slice(0, 6000))); setPanelOpen(true) }
  }

  async function saveNote(event: FormEvent) {
    event.preventDefault()
    if (!note.trim() || !documentId) return
    setSaving(true); setError('')
    const { error: saveError } = await supabase.from('annotations').insert({ document_id: documentId, kind: 'note', selected_text: selectedText || null, note: note.trim(), source_location: { page: pageNumber } })
    setSaving(false)
    if (saveError) return setError('Chưa thể lưu ghi chú. Nội dung của bạn vẫn được giữ lại.')
    setNote(''); clearSelection(); await loadWorkspace()
  }

  async function saveInk() {
    if (!documentId || !draftStrokes.length) return
    setSaving(true)
    const { error: saveError } = await supabase.from('annotations').insert({ document_id: documentId, kind: 'ink', note: null, source_location: { page: pageNumber, strokes: draftStrokes } })
    setSaving(false)
    if (saveError) return setError('Chưa thể lưu nét vẽ. Các nét vẫn còn trên trang.')
    setDraftStrokes([]); setDrawMode(false); await loadWorkspace()
  }

  async function askAi(event: FormEvent) {
    event.preventDefault()
    if (!documentId || !selectedText || !question.trim()) return
    setAsking(true); setError(''); setAiNeedsCredit(false)
    const asked = question.trim()
    const { data, error: invokeError } = await supabase.functions.invoke('ask-document', { body: { documentId, pageNumber, selectedText, question: asked } })
    setAsking(false)
    if (invokeError || data?.error) {
      let message = data?.error || ''
      const context = (invokeError as { context?: Response } | null)?.context
      if (!message && context) {
        try { message = (await context.clone().json())?.error || '' } catch { /* response không phải JSON */ }
      }
      await loadWorkspace()
      if (message.includes('OPENAI_NO_CREDIT') || message.includes('credit_balance_exhausted') || message.includes('insufficient_quota')) {
        setAiNeedsCredit(true)
        return setError('')
      }
      if (message.includes('GROQ_RATE_LIMIT')) return setError('Đã chạm giới hạn Groq miễn phí. Hãy đợi một lúc rồi thử lại; câu hỏi của bạn vẫn được giữ lại.')
      return setError(message || invokeError?.message || 'AI chưa thể trả lời. Câu hỏi của bạn vẫn được giữ lại.')
    }
    setQuestion(''); await loadWorkspace()
  }

  function clearSelection() { setSelectedText(''); window.getSelection()?.removeAllRanges() }

  async function askFromNote(item: Annotation) {
    await changePage(item.source_location.page || 1)
    setSelectedText(item.selected_text || '')
    setQuestion(item.note || '')
    setPanel('ai')
    setPanelOpen(true)
  }

  async function deleteAnnotation(id: string) {
    const { error: deleteError } = await supabase.from('annotations').delete().eq('id', id)
    if (deleteError) return setError('Chưa thể xóa nội dung này.')
    setAnnotations((items) => items.filter((item) => item.id !== id))
  }

  async function updateAiMessage(id: string) {
    const content = editedMessage.trim()
    if (!content) return
    const { error: updateError } = await supabase.from('ai_messages').update({ content }).eq('id', id).eq('role', 'user')
    if (updateError) return setError('Chưa thể chỉnh sửa câu hỏi.')
    setMessages((items) => items.map((item) => item.id === id ? { ...item, content } : item))
    setEditingMessage(''); setMessageMenu('')
  }

  async function deleteAiMessage(id: string) {
    const { error: deleteError } = await supabase.from('ai_messages').delete().eq('id', id).eq('role', 'user')
    if (deleteError) return setError('Chưa thể xóa câu hỏi.')
    setMessages((items) => items.filter((item) => item.id !== id)); setMessageMenu('')
  }

  const pageInk = annotations.filter((item) => item.kind === 'ink' && item.source_location.page === pageNumber).flatMap((item) => item.source_location.strokes || [])
  const notes = annotations.filter((item) => item.kind !== 'ink')

  if (loading) return <div className="reader-loading"><LoaderCircle className="spin" /><p>Đang mở tài liệu…</p></div>
  if (error && !document) return <div className="reader-loading"><Status>{error}</Status><button className="secondary-button" onClick={() => navigate('/library')}>Trở về thư viện</button></div>

  return <div className={`reader-page ${panelOpen ? 'notes-visible' : ''}`}>
    <header className="reader-toolbar">
      <div className="reader-title"><button className="reader-icon-button" onClick={() => navigate('/library')} aria-label="Trở về thư viện"><X size={21} /></button><strong>{document?.title}</strong></div>
      <div className="reader-controls"><button onClick={() => changePage(pageNumber - 1)} disabled={pageNumber <= 1}><ChevronLeft /></button><span><input aria-label="Trang hiện tại" value={pageNumber} onChange={(event) => changePage(Number(event.target.value) || 1)} /> / {numPages || '—'}</span><button onClick={() => changePage(pageNumber + 1)} disabled={pageNumber >= numPages}><ChevronRight /></button><i /><button onClick={() => setZoom((v) => Math.max(.65, v - .1))}><Minus /></button><span>{Math.round(zoom * 100)}%</span><button onClick={() => setZoom((v) => Math.min(1.8, v + .1))}><Plus /></button></div>
      <div className="reader-actions"><button className={drawMode ? 'tool-active' : ''} onClick={() => setDrawMode((v) => !v)}><Brush size={18} /><span>Vẽ</span></button><button onClick={() => navigate(`/reflection/${documentId}`)}><Sparkles size={17} /><span>Kết thúc phiên đọc</span></button><button onClick={() => setPanelOpen((v) => !v)}>{panelOpen ? <PanelRightClose size={19} /> : <PanelRightOpen size={19} />}<span>Trợ lý</span></button></div>
    </header>
    <div className="reader-body">
      <main className="pdf-stage" ref={stageRef} onMouseUp={captureSelection}>
        {error && <Status>{error}</Status>}
        {drawMode && <div className="ink-toolbar"><Brush size={17} />{colors.map((color) => <button key={color} className={inkColor === color ? 'selected' : ''} style={{ background: color }} onClick={() => setInkColor(color)} aria-label={`Màu ${color}`} />)}<input type="range" min="2" max="12" value={inkWidth} onChange={(e) => setInkWidth(Number(e.target.value))} aria-label="Độ dày cọ" /><button className="ink-action" onClick={() => setDraftStrokes((items) => items.slice(0, -1))} disabled={!draftStrokes.length}><RotateCcw size={17} /> Hoàn tác</button><button className="ink-action" onClick={() => setDraftStrokes([])} disabled={!draftStrokes.length}><Eraser size={17} /> Xóa nét mới</button><button className="ink-save" onClick={saveInk} disabled={!draftStrokes.length || saving}><Save size={17} /> Xong</button></div>}
        <Document file={fileData} onLoadSuccess={onPdfLoaded} onLoadError={onPdfError} loading={<div className="pdf-message"><LoaderCircle className="spin" />Đang dựng trang PDF…</div>} error={<div className="pdf-message">Không thể hiển thị PDF này.</div>}>
          <div className="pdf-page-wrap"><Page pageNumber={pageNumber} width={Math.max(280, Math.min(stageWidth - 64, 880))} scale={zoom} renderTextLayer={!drawMode} renderAnnotationLayer /><InkCanvas active={drawMode} color={inkColor} width={inkWidth} saved={pageInk} draft={draftStrokes} onDraftChange={setDraftStrokes} /></div>
        </Document>
        {selectedText && !drawMode && <div className="selection-actions"><Highlighter size={16} /><span>Đã chọn {selectedText.length} ký tự</span><button onClick={() => { setPanel('notes'); setPanelOpen(true) }}><NotebookPen size={16} /> Ghi chú</button><button onClick={() => { setPanel('ai'); setPanelOpen(true) }}><Bot size={16} /> Hỏi AI</button><button onClick={clearSelection}><X size={16} /></button></div>}
      </main>
      <aside className="notes-panel" aria-label="Không gian đọc hiểu">
        <div className="panel-tabs"><button className={panel === 'overview' ? 'active' : ''} onClick={() => setPanel('overview')}><Sparkles size={17} /> Tổng quan</button><button className={panel === 'notes' ? 'active' : ''} onClick={() => setPanel('notes')}><NotebookPen size={17} /> Ghi chú</button><button className={panel === 'ai' ? 'active' : ''} onClick={() => setPanel('ai')}><Bot size={17} /> Hỏi AI</button><button className="reader-icon-button mobile-close" onClick={() => setPanelOpen(false)}><X size={20} /></button></div>
        <div className="notes-heading"><div><p className="eyebrow">Trang {pageNumber}</p><h2>{panel === 'overview' ? 'Tổng quan tài liệu' : panel === 'notes' ? 'Ghi chú' : 'Trợ lý AI'}</h2></div></div>
        {panel === 'overview' && documentId && document && fileData ? <DocumentOverview documentId={documentId} title={document.title} file={fileData}/> : panel === 'notes' ? <>
          <form className="note-composer" onSubmit={saveNote}>{selectedText && <SelectedQuote text={selectedText} onClear={clearSelection} />}<label htmlFor="reader-note">Ý của bạn</label><textarea id="reader-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ghi lại suy nghĩ, câu hỏi hoặc điều muốn nhớ…" rows={5} maxLength={10000} /><button className="primary-button" disabled={saving || !note.trim()}>{saving ? <LoaderCircle className="spin" size={17} /> : <Save size={17} />}Lưu ghi chú</button></form>
          <div className="notes-list"><h3><NotebookPen size={17} /> Ghi chú đã lưu</h3>{notes.length === 0 ? <p className="notes-empty">Chọn một đoạn văn hoặc viết suy nghĩ của bạn.</p> : notes.map((item) => <article className={item.source_location.page === pageNumber ? 'current-note' : ''} key={item.id}><button className="note-page" onClick={() => changePage(item.source_location.page || 1)}>Trang {item.source_location.page || 1}</button>{item.selected_text && <blockquote>“{item.selected_text}”</blockquote>}<p>{item.note}</p>{item.selected_text && item.note && <button className="ask-note" onClick={() => void askFromNote(item)}><Bot size={14} /> Hỏi AI</button>}<button className="delete-note" onClick={() => deleteAnnotation(item.id)}><Trash2 size={15} /></button></article>)}</div>
        </> : <>
          <form className="ai-composer" onSubmit={askAi}>{aiNeedsCredit && <div className="ai-billing-card"><Bot size={20} /><div><strong>AI đang tạm dừng vì hết credit</strong><p>Kết nối đã hoạt động, nhưng tài khoản OpenAI API cần được bổ sung ngân sách. Câu hỏi của bạn vẫn được giữ nguyên.</p><a href="https://platform.openai.com/settings/organization/billing/overview" target="_blank" rel="noreferrer">Mở trang OpenAI Billing</a></div></div>}{selectedText ? <SelectedQuote text={selectedText} onClear={clearSelection} /> : <div className="ai-hint"><Highlighter size={18} /><p>Highlight một đoạn trên PDF để AI giải thích, tóm tắt hoặc trả lời theo đúng ngữ cảnh.</p></div>}<label htmlFor="ai-question">Bạn muốn hỏi gì?</label><textarea id="ai-question" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Ví dụ: Giải thích đoạn này bằng ngôn ngữ đơn giản…" rows={4} maxLength={1000} /><button className="primary-button" disabled={asking || !selectedText || !question.trim()}>{asking ? <LoaderCircle className="spin" size={17} /> : <Send size={17} />}{aiNeedsCredit ? 'Thử lại sau khi nạp credit' : 'Hỏi theo đoạn đã chọn'}</button></form>
          <div className="ai-thread">{messages.length === 0 ? <p className="notes-empty">Các câu hỏi và câu trả lời sẽ được lưu tại đây.</p> : messages.map((message) => <article className={message.role} key={message.id}><small>Trang {message.page_number} · {message.role === 'user' ? 'Bạn' : 'MindTrace AI'}</small>{message.role === 'user' && <div className="message-menu-wrap"><button className="message-menu-button" onClick={() => setMessageMenu((id) => id === message.id ? '' : message.id)} aria-label="Tùy chọn câu hỏi"><MoreVertical size={17}/></button>{messageMenu === message.id && <div className="message-menu"><button onClick={() => { setEditingMessage(message.id); setEditedMessage(message.content); setMessageMenu('') }}><Pencil size={14}/> Chỉnh sửa</button><button className="danger" onClick={() => void deleteAiMessage(message.id)}><Trash2 size={14}/> Xóa</button></div>}</div>}{editingMessage === message.id ? <div className="message-editor"><textarea value={editedMessage} onChange={(event) => setEditedMessage(event.target.value)} maxLength={12000}/><div><button onClick={() => setEditingMessage('')}><X size={14}/> Hủy</button><button onClick={() => void updateAiMessage(message.id)}><Check size={14}/> Lưu</button></div></div> : message.role === 'assistant' ? <FormattedAiMessage content={message.content} /> : <p>{message.content}</p>}</article>)}</div>
        </>}
      </aside>
    </div>
  </div>
}

function SelectedQuote({ text, onClear }: { text: string; onClear: () => void }) {
  return <div className="selected-quote"><Highlighter size={15} /><blockquote>{text}</blockquote><button type="button" onClick={onClear}><X size={15} /></button></div>
}
