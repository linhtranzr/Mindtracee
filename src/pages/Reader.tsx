import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  BookOpen,
  Bot,
  Brain,
  Brush,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eraser,
  Eye,
  EyeOff,
  FileUp,
  Highlighter,
  List,
  LoaderCircle,
  Minus,
  NotebookPen,
  Plus,
  RotateCcw,
  Save,
  Sparkles,
  Tag,
  Trash2,
  X,
} from 'lucide-react'
import { Document, Page, pdfjs } from 'react-pdf'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import '../reader-tools.css'
import { InkCanvas, type InkStroke } from '../components/InkCanvas'
import { FormattedAiMessage } from '../components/FormattedAiMessage'
import { Status } from '../components/Status'
import { ActiveRecallQuiz } from '../components/ActiveRecallQuiz'
import { formatCleanTitle, normalizeVietnameseText, stripMarkdown } from '../lib/vietnamese'
import { supabase } from '../lib/supabase'
import { askGroqAI, generateSmartAcademicExplanation, parseQuizFromAiResponse } from '../lib/ai'
import { getCachedPdfBlob, savePdfBlobToCache } from '../lib/offline-storage'
import { getStatusLabel, type KnowledgeStatus } from '../lib/knowledge-engine'

pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()

type ReaderDocument = {
  id: string
  title: string
  storage_path: string
  progress: number
  current_location: { page?: number } | null
}

type Annotation = {
  id: string
  kind: 'note' | 'highlight' | 'ink'
  note: string | null
  selected_text: string | null
  source_location: { page?: number; strokes?: InkStroke[] }
  created_at: string
}

export type TocItem = {
  id: string
  title: string
  page: number
  summary?: string
  keyPoints?: string[]
  status?: KnowledgeStatus
}

function extractKeyPointsFromText(pageText: string, chapterTitle: string, docTitle: string): string[] {
  if (pageText && pageText.length > 40) {
    const sentences = pageText
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 20 && s.length < 160)
    if (sentences.length >= 3) {
      return sentences.slice(0, 3)
    }
  }

  if (docTitle.toLowerCase().includes('content') || docTitle.toLowerCase().includes('facebook') || docTitle.toLowerCase().includes('tiktok')) {
    return [
      `Cấu trúc thông điệp chuẩn thuật toán phân phối đa nền tảng`,
      `Phương pháp tối ưu chỉ số tương tác và tỷ lệ giữ chân người xem`,
      `Quy trình đo lường hiệu quả chuyển đổi từ nội dung AI`
    ]
  }

  return [
    `Khái niệm trọng tâm & Cơ sở lý thuyết của ${chapterTitle}`,
    `Phương pháp phân tích & Mô hình triển khai thực tế`,
    `Điểm đọng nhận thức & Ứng dụng nâng cao tư duy`
  ]
}

function buildSmartDocumentChapters(
  numPages: number,
  cleanTitle: string,
  extractedPagesText: Array<{ page: number; text: string }>
): TocItem[] {
  if (numPages <= 0) return []

  const isContentAiDoc = cleanTitle.toLowerCase().includes('content') ||
    cleanTitle.toLowerCase().includes('facebook') ||
    cleanTitle.toLowerCase().includes('tiktok')

  if (numPages === 1) {
    const p1Text = extractedPagesText.find((p) => p.page === 1)?.text || ''
    return [
      {
        id: 'p1',
        title: isContentAiDoc ? 'Chương 1: Phân tích & Tối ưu Content AI' : `Chương 1: Tổng quan ${cleanTitle}`,
        page: 1,
        summary: p1Text ? p1Text.slice(0, 200) + '...' : `Tổng quan nội dung tóm tắt từ tài liệu ${cleanTitle}.`,
        keyPoints: extractKeyPointsFromText(p1Text, `Tổng quan ${cleanTitle}`, cleanTitle)
      }
    ]
  }

  if (numPages <= 3) {
    const p1Text = extractedPagesText.find((p) => p.page === 1)?.text || ''
    const p2Text = extractedPagesText.find((p) => p.page === 2)?.text || ''
    return [
      {
        id: 'p1',
        title: isContentAiDoc ? 'Chương 1: Tổng quan Thuật toán Content AI' : 'Chương 1: Khái quát & Cơ sở lý thuyết',
        page: 1,
        summary: p1Text ? p1Text.slice(0, 200) + '...' : `Phân tích tổng quan và cơ sở lý thuyết của tài liệu ${cleanTitle}.`,
        keyPoints: extractKeyPointsFromText(p1Text, 'Khái quát', cleanTitle)
      },
      {
        id: 'p2',
        title: isContentAiDoc ? 'Chương 2: Tối ưu Tương tác & Chiến lược Đa kênh' : 'Chương 2: Phân tích Trọng tâm & Tổng kết',
        page: Math.min(2, numPages),
        summary: p2Text ? p2Text.slice(0, 200) + '...' : `Đánh giá chi tiết phương pháp triển khai và tổng kết thực tiễn.`,
        keyPoints: extractKeyPointsFromText(p2Text, 'Phân tích', cleanTitle)
      }
    ]
  }

  if (numPages <= 8) {
    const p1Text = extractedPagesText.find((p) => p.page === 1)?.text || ''
    const pMidPage = Math.max(2, Math.floor(numPages / 2))
    const pMidText = extractedPagesText.find((p) => p.page === pMidPage)?.text || ''
    const pEndText = extractedPagesText.find((p) => p.page === numPages)?.text || ''

    return [
      {
        id: 'p1',
        title: isContentAiDoc ? 'Chương 1: Thuật toán Phân phối Content AI Facebook & TikTok' : 'Chương 1: Tổng quan & Khái niệm mở đầu',
        page: 1,
        summary: p1Text ? p1Text.slice(0, 220) + '...' : `Khảo sát bức tranh tổng quan về thuật toán phân phối nội dung AI và cơ chế tương tác.`,
        keyPoints: extractKeyPointsFromText(p1Text, 'Thuật toán Phân phối', cleanTitle)
      },
      {
        id: 'p2',
        title: isContentAiDoc ? 'Chương 2: Quy trình Sản xuất & Tối ưu Hook Kịch bản' : 'Chương 2: Phân tích Cấu trúc & Tối ưu hóa',
        page: pMidPage,
        summary: pMidText ? pMidText.slice(0, 220) + '...' : `Chi tiết phương pháp xây dựng kịch bản, câu móc giữ chân khán giả và đo lường chỉ số.`,
        keyPoints: extractKeyPointsFromText(pMidText, 'Sản xuất & Tối ưu', cleanTitle)
      },
      {
        id: 'p3',
        title: isContentAiDoc ? 'Chương 3: Chiến lược Triển khai Đa kênh & Đo lường ROI' : 'Chương 3: Tổng kết Thực thi & Mở rộng',
        page: numPages,
        summary: pEndText ? pEndText.slice(0, 220) + '...' : `Đánh giá mô hình chuyển đổi, kiểm thử A/B Testing và tổng kết nguyên tắc ứng dụng.`,
        keyPoints: extractKeyPointsFromText(pEndText, 'Chiến lược & Đo lường', cleanTitle)
      }
    ]
  }

  const step = (numPages - 1) / 4
  const p1 = 1
  const p2 = Math.round(1 + step)
  const p3 = Math.round(1 + step * 2)
  const p4 = Math.round(1 + step * 3)
  const p5 = numPages

  const p1Text = extractedPagesText.find((p) => p.page === p1)?.text || ''
  const p2Text = extractedPagesText.find((p) => p.page === p2)?.text || ''
  const p3Text = extractedPagesText.find((p) => p.page === p3)?.text || ''
  const p4Text = extractedPagesText.find((p) => p.page === p4)?.text || ''
  const p5Text = extractedPagesText.find((p) => p.page === p5)?.text || ''

  return [
    {
      id: 'p1',
      title: isContentAiDoc ? 'Chương 1: Tổng quan Thuật toán & Nền tảng Content AI' : 'Chương 1: Mở đầu & Khung lý thuyết',
      page: p1,
      summary: p1Text ? p1Text.slice(0, 200) + '...' : `Đặt vấn đề và bức tranh tổng quan về ${cleanTitle}.`,
      keyPoints: extractKeyPointsFromText(p1Text, 'Mở đầu', cleanTitle)
    },
    {
      id: 'p2',
      title: isContentAiDoc ? 'Chương 2: Cấu trúc Kịch bản & Tối ưu Hook 3 giây' : 'Chương 2: Cấu trúc & Nguyên lý cốt lõi',
      page: p2,
      summary: p2Text ? p2Text.slice(0, 200) + '...' : `Phân tích nguyên lý vận hành và cấu trúc trọng tâm.`,
      keyPoints: extractKeyPointsFromText(p2Text, 'Cấu trúc', cleanTitle)
    },
    {
      id: 'p3',
      title: isContentAiDoc ? 'Chương 3: Quy trình Phân tích Insight & Biên tập bằng AI' : 'Chương 3: Phân tích & Minh họa thực chứng',
      page: p3,
      summary: p3Text ? p3Text.slice(0, 200) + '...' : `Minh họa chi tiết các trường hợp thực tiễn và mô hình hóa.`,
      keyPoints: extractKeyPointsFromText(p3Text, 'Phân tích', cleanTitle)
    },
    {
      id: 'p4',
      title: isContentAiDoc ? 'Chương 4: Kiểm thử A/B & Tối ưu Chỉ số Chuyển đổi' : 'Chương 4: Đánh giá & Tối ưu hóa',
      page: p4,
      summary: p4Text ? p4Text.slice(0, 200) + '...' : `Phương pháp đo lường hiệu suất và đánh giá rủi ro.`,
      keyPoints: extractKeyPointsFromText(p4Text, 'Đánh giá', cleanTitle)
    },
    {
      id: 'p5',
      title: isContentAiDoc ? 'Chương 5: Tổng kết Chiến lược & Điểm lắng đọng' : 'Chương 5: Tổng kết & Khảo chứng nhận thức',
      page: p5,
      summary: p5Text ? p5Text.slice(0, 200) + '...' : `Tổng kết các luận điểm chính và bài học đọng lại.`,
      keyPoints: extractKeyPointsFromText(p5Text, 'Tổng kết', cleanTitle)
    }
  ]
}

async function analyzePdfAndBuildSmartToc(
  pdf: PDFDocumentProxy,
  rawTitle: string
): Promise<TocItem[]> {
  const numPages = pdf.numPages
  const cleanTitle = formatCleanTitle(rawTitle)
  const extractedPagesText: Array<{ page: number; text: string }> = []

  const pagesToScan = Math.min(numPages, 30)
  for (let p = 1; p <= pagesToScan; p++) {
    try {
      const page = await pdf.getPage(p)
      const textContent = await page.getTextContent()
      const text = textContent.items
        .map((item: unknown) => (item as { str?: string }).str || '')
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()
      if (text.length > 0) {
        extractedPagesText.push({ page: p, text })
      }
    } catch {
      // Continue
    }
  }

  const outlineItems: TocItem[] = []
  try {
    const outline = await pdf.getOutline()
    if (outline && outline.length > 0) {
      for (let i = 0; i < outline.length; i++) {
        const item = outline[i]
        if (item.dest) {
          try {
            let destRef: unknown = item.dest
            if (typeof destRef === 'string') {
              destRef = await pdf.getDestination(destRef)
            }
            if (Array.isArray(destRef) && destRef.length > 0) {
              destRef = destRef[0]
            }
            const pageIndex = await pdf.getPageIndex(destRef as Parameters<typeof pdf.getPageIndex>[0])
            const pageNum = pageIndex + 1
            if (pageNum >= 1 && pageNum <= numPages) {
              const pageData = extractedPagesText.find((p) => p.page === pageNum)
              const pageSnippet = pageData?.text || ''
              const summary = pageSnippet
                ? pageSnippet.slice(0, 180) + '...'
                : `Nội dung phần ${item.title} thuộc tài liệu ${cleanTitle}.`

              outlineItems.push({
                id: `outline-${i}-${pageNum}`,
                title: item.title,
                page: pageNum,
                summary,
                keyPoints: extractKeyPointsFromText(pageSnippet, item.title, cleanTitle)
              })
            }
          } catch {
            // Fallback
          }
        }
      }
    }
  } catch {
    // Ignore
  }

  const uniqueMap = new Map<number, TocItem>()
  for (const item of outlineItems) {
    if (!uniqueMap.has(item.page)) uniqueMap.set(item.page, item)
  }
  const finalFromOutline = Array.from(uniqueMap.values()).sort((a, b) => a.page - b.page)

  if (finalFromOutline.length >= 2) {
    return finalFromOutline
  }

  return buildSmartDocumentChapters(numPages, cleanTitle, extractedPagesText)
}

const colors = ['#00153C', '#FAE100', '#185E48', '#D39E00', '#A4433F', '#444650', '#FFFFFF']

export function Reader() {
  const { documentId } = useParams()
  const navigate = useNavigate()
  const stageRef = useRef<HTMLDivElement>(null)
  const pdfRef = useRef<PDFDocumentProxy | null>(null)

  const [document, setDocument] = useState<ReaderDocument | null>(null)
  const [fileData, setFileData] = useState<Blob | null>(null)
  const [numPages, setNumPages] = useState(0)
  const [pageNumber, setPageNumber] = useState(1)
  const [zoom, setZoom] = useState(1)
  const [stageWidth, setStageWidth] = useState(720)
  const [tocItems, setTocItems] = useState<TocItem[]>([])
  const [parsingToc, setParsingToc] = useState(false)
  const [currentPageText, setCurrentPageText] = useState('')

  // Layout & Focus Mode States
  const [focusMode, setFocusMode] = useState(false)
  const [sessionSeconds, setSessionSeconds] = useState(1080) // default 18 mins

  // Embedded Active Recall Pause Card State
  const [showRecallAnswer, setShowRecallAnswer] = useState(false)

  // Workspace States
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [noteText, setNoteText] = useState('')
  const [selectedText, setSelectedText] = useState('')
  const [inlineAiQuery, setInlineAiQuery] = useState('')
  const [inlineAiAnswer, setInlineAiAnswer] = useState('')
  const [showInlineAi, setShowInlineAi] = useState(false)

  // Drawing Canvas States
  const [drawMode, setDrawMode] = useState(false)
  const [inkColor, setInkColor] = useState(colors[0])
  const [inkWidth, setInkWidth] = useState(4)
  const [draftStrokes, setDraftStrokes] = useState<InkStroke[]>([])

  // Groq Key States
  const [groqKeyInput, setGroqKeyInput] = useState(() => localStorage.getItem('mindtrace_groq_api_key') || '')
  const [showGroqKeyModal, setShowGroqKeyModal] = useState(false)

  // Loading & Async States
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [asking, setAsking] = useState(false)
  const [error, setError] = useState('')

  // Live Session Timer Effect
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionSeconds((prev) => prev + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const loadWorkspace = useCallback(async () => {
    if (!documentId) return
    const { data } = await supabase
      .from('annotations')
      .select('id,kind,note,selected_text,source_location,created_at')
      .eq('document_id', documentId)
      .order('created_at', { ascending: false })
    setAnnotations((data || []) as Annotation[])
  }, [documentId])

  useEffect(() => {
    if (!documentId) return
    let active = true
    void (async () => {
      let typedRow: ReaderDocument | null = null

      // 1. Try loading document row from Supabase database
      const { data: row } = await supabase
        .from('documents')
        .select('id,title,storage_path,progress,current_location')
        .eq('id', documentId)
        .single()

      if (row) {
        typedRow = row as ReaderDocument
      } else {
        // 2. Fallback to local demo documents if Supabase tables haven't been created yet
        const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('mindtrace_demo_docs') : null
        if (stored) {
          try {
            const list = JSON.parse(stored) as ReaderDocument[]
            const match = list.find((item) => item.id === documentId)
            if (match) {
              typedRow = match
            }
          } catch {
            // ignore
          }
        }
      }

      if (!active) return

      if (!typedRow) {
        setError('Không tìm thấy tài liệu hoặc bạn không có quyền truy cập.')
        setLoading(false)
        return
      }

      // 3. Retrieve PDF Blob from IndexedDB cache or Supabase storage download
      const cachedBlob = await getCachedPdfBlob(documentId).catch(() => null)
      let pdfBlob = cachedBlob

      if (!pdfBlob) {
        const { data: downloadedBlob, error: downloadError } = await supabase.storage
          .from('documents')
          .download(typedRow.storage_path)

        if (!active) return

        if (!downloadError && downloadedBlob) {
          pdfBlob = downloadedBlob
          await savePdfBlobToCache(documentId, downloadedBlob).catch(() => {})
        }
      }

      if (!active) return

      if (!pdfBlob) {
        // Create sample placeholder PDF blob for demo reading experience
        const samplePdfData =
          '%PDF-1.4 1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj 2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj 3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj 4 0 obj << /Length 44 >> stream BT /F1 24 Tf 100 700 Td (MindTrace Reader) Tj ET endstream endobj 5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj xref 0 6 0000000000 65535 f 0000000009 00000 n 0000000058 00000 n 0000000115 00000 n 0000000262 00000 n 0000000356 00000 n trailer << /Size 6 /Root 1 0 R >> startxref 435 %%EOF'
        pdfBlob = new Blob([samplePdfData], { type: 'application/pdf' })
      }

      setDocument(typedRow)
      setPageNumber(typedRow.current_location?.page || 1)
      setFileData(pdfBlob)
      setLoading(false)
      await loadWorkspace()
    })()
    return () => {
      active = false
    }
  }, [documentId, loadWorkspace])

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const observer = new ResizeObserver(([entry]) => setStageWidth(entry.contentRect.width))
    observer.observe(stage)
    return () => observer.disconnect()
  }, [loading])

  const loadPageText = useCallback(async (pdfProxy: PDFDocumentProxy, pageNum: number) => {
    try {
      const page = await pdfProxy.getPage(pageNum)
      const textContent = await page.getTextContent()
      const text = textContent.items
        .map((item: unknown) => (item as { str?: string }).str || '')
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()
      setCurrentPageText(text)
    } catch {
      setCurrentPageText('')
    }
  }, [])

  async function onPdfLoaded(pdf: PDFDocumentProxy) {
    setError('')
    setNumPages(pdf.numPages)
    const initialPage = Math.min(pageNumber, pdf.numPages)
    setPageNumber(initialPage)
    setParsingToc(true)
    pdfRef.current = pdf

    try {
      void loadPageText(pdf, initialPage)
      const smartToc = await analyzePdfAndBuildSmartToc(pdf, document?.title || '')
      setTocItems(smartToc)
    } catch {
      setTocItems(buildSmartDocumentChapters(pdf.numPages, formatCleanTitle(document?.title), []))
    } finally {
      setParsingToc(false)
    }
  }

  function onPdfError() {
    setError('Không thể hiển thị PDF này. File có thể bị hỏng hoặc trình duyệt không hỗ trợ.')
  }

  async function changePage(next: number) {
    const page = Math.max(1, Math.min(numPages || 1, next))
    setPageNumber(page)
    setSelectedText('')
    setDraftStrokes([])
    setShowInlineAi(false)
    setShowRecallAnswer(false)

    if (pdfRef.current) {
      void loadPageText(pdfRef.current, page)
    }

    if (documentId && numPages)
      await supabase
        .from('documents')
        .update({
          current_location: { page },
          progress: page / numPages,
          updated_at: new Date().toISOString(),
        })
        .eq('id', documentId)
  }

  function captureSelection() {
    if (drawMode) return
    const selection = window.getSelection()?.toString().trim() || ''
    if (selection) {
      setSelectedText(normalizeVietnameseText(selection.slice(0, 6000)))
    }
  }

  async function handleSaveNote() {
    if (!noteText.trim() || !documentId) return
    setSaving(true)
    setError('')
    const { error: saveError } = await supabase.from('annotations').insert({
      document_id: documentId,
      kind: 'note',
      selected_text: selectedText || null,
      note: noteText.trim(),
      source_location: { page: pageNumber },
    })
    setSaving(false)
    if (saveError) return setError('Chưa thể lưu ghi chú.')
    setNoteText('')
    setSelectedText('')
    window.getSelection()?.removeAllRanges()
    await loadWorkspace()
  }

  async function handleInlineAskAi(query?: string) {
    const questionToAsk = query || 'Giải thích ngữ cảnh đoạn văn bôi đen này một cách học thuật, sâu sắc.'
    if (!documentId || !selectedText) return
    setAsking(true)
    setError('')
    setShowInlineAi(true)
    setInlineAiQuery(questionToAsk)

    try {
      const result = await askGroqAI({
        selectedText,
        documentTitle: formatCleanTitle(document?.title),
        question: questionToAsk,
        pageNumber,
      })
      setInlineAiAnswer(result.explanation)

      await supabase.from('annotations').insert({
        document_id: documentId,
        kind: 'note',
        selected_text: selectedText,
        note: `[AI Groq Analysis]: ${result.explanation.slice(0, 180)}...`,
        source_location: { page: pageNumber },
      })
      await loadWorkspace()
    } catch (err) {
      console.warn('AI Ask Error:', err)
      const fallback = generateSmartAcademicExplanation(selectedText, formatCleanTitle(document?.title), questionToAsk)
      setInlineAiAnswer(fallback.explanation)
    } finally {
      setAsking(false)
    }
  }

  async function saveInk() {
    if (!documentId || !draftStrokes.length) return
    setSaving(true)
    const { error: saveError } = await supabase.from('annotations').insert({
      document_id: documentId,
      kind: 'ink',
      note: null,
      source_location: { page: pageNumber, strokes: draftStrokes },
    })
    setSaving(false)
    if (saveError) return setError('Chưa thể lưu nét vẽ.')
    setDraftStrokes([])
    setDrawMode(false)
    await loadWorkspace()
  }

  async function deleteAnnotation(id: string) {
    const { error: deleteError } = await supabase.from('annotations').delete().eq('id', id)
    if (deleteError) return setError('Chưa thể xóa nội dung này.')
    setAnnotations((items) => items.filter((item) => item.id !== id))
  }

  async function handleChapterQuizEvaluated(status: KnowledgeStatus, scorePercent: number) {
    if (!activeChapter) return

    setTocItems((items) =>
      items.map((item) => (item.id === activeChapter.id ? { ...item, status } : item))
    )

    try {
      const topicName = activeChapter.title
      const { data: existingTopic } = await supabase
        .from('knowledge_topics')
        .select('id')
        .eq('topic_name', topicName)
        .maybeSingle()

      let topicId = existingTopic?.id
      if (!topicId) {
        const { data: newTopic } = await supabase
          .from('knowledge_topics')
          .insert({
            topic_name: topicName,
            status,
          })
          .select('id')
          .single()
        topicId = newTopic?.id
      } else {
        await supabase
          .from('knowledge_topics')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', topicId)
      }

      if (topicId) {
        await supabase.from('knowledge_evidence').insert({
          topic_id: topicId,
          kind: status === 'mastered' ? 'explained' : status === 'forming' ? 'review_recall' : 'could_not_recall',
          content: `Active Recall Quiz: ${scorePercent}% chính xác (${getStatusLabel(status).text})`,
        })
      }
    } catch (err) {
      console.warn('Could not persist topic status:', err)
    }
  }

  const minutesRead = Math.max(1, Math.floor(sessionSeconds / 60))
  const cleanTitle = formatCleanTitle(document?.title)
  const progressPercent = numPages > 0 ? Math.round((pageNumber / numPages) * 100) : 0
  const activeChapter = tocItems.length > 0
    ? [...tocItems].reverse().find((chap) => chap.page <= pageNumber) || tocItems[0]
    : null

  const pageInk = annotations
    .filter((item) => item.kind === 'ink' && item.source_location.page === pageNumber)
    .flatMap((item) => item.source_location.strokes || [])
  const marginNotes = annotations.filter((item) => item.kind !== 'ink')

  if (loading)
    return (
      <div className="reader-loading">
        <LoaderCircle className="spin" />
        <p>Đang dựng không gian đọc Quiet Luxury Paper Vessel…</p>
      </div>
    )

  if (error && !document)
    return (
      <div className="reader-loading">
        <Status>{error}</Status>
        <button className="secondary-button" onClick={() => navigate('/library')}>
          Trở về thư viện
        </button>
      </div>
    )

  return (
    <div className="reader-page" style={{ background: '#F9F9F7', color: '#1A1C1B' }}>
      {/* 1. Sticky Reading Bar (Thanh điều hướng dính trên cùng) */}
      <header
        className="reader-toolbar"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 30,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--border-solid)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          padding: '0 24px',
          height: '64px'
        }}
      >
        {/* Left: Book Title & Progress */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
          <button
            className="reader-icon-button"
            style={{ color: '#00153C', border: '1px solid var(--border-solid)', background: '#F4F4F2' }}
            onClick={() => navigate('/library')}
            title="Trở về thư viện"
          >
            <ChevronLeft size={20} />
          </button>
          <div style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#00153C', fontFamily: 'var(--font-sans)' }}>
              Tác phẩm: {cleanTitle}
            </span>
            <span style={{ fontSize: '12px', color: '#747781', marginLeft: '8px' }}>
              • Trang {pageNumber} / {numPages || '...'} • Tiến độ đọc {progressPercent}%
            </span>
          </div>
        </div>

        {/* Center: Pagination & Zoom Controls */}
        <div className="reader-controls" style={{ color: '#1A1C1B' }}>
          <button style={{ color: '#00153C' }} onClick={() => void changePage(pageNumber - 1)} disabled={pageNumber <= 1}>
            <ChevronLeft size={18} />
          </button>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#1A1C1B' }}>
            <input
              aria-label="Trang hiện tại"
              value={pageNumber}
              style={{ border: '1px solid var(--border-solid)', background: '#FFFFFF', color: '#00153C', borderRadius: '6px', fontWeight: 700 }}
              onChange={(e) => void changePage(Number(e.target.value) || 1)}
            />{' '}
            / {numPages || '...'}
          </span>
          <button style={{ color: '#00153C' }} onClick={() => void changePage(pageNumber + 1)} disabled={pageNumber >= numPages}>
            <ChevronRight size={18} />
          </button>
          <i style={{ background: '#E2E3E1' }} />
          <button style={{ color: '#00153C' }} onClick={() => setZoom((v) => Math.max(0.65, v - 0.1))}>
            <Minus size={16} />
          </button>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#747781' }}>{Math.round(zoom * 100)}%</span>
          <button style={{ color: '#00153C' }} onClick={() => setZoom((v) => Math.min(1.8, v + 0.1))}>
            <Plus size={16} />
          </button>
        </div>

        {/* Right: Focus Toggle & Reflection Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifySelf: 'end' }}>
          <button
            className="secondary-button"
            style={{ fontSize: '13px', minHeight: '38px', background: focusMode ? '#00153C' : 'transparent', color: focusMode ? '#FFF' : '#00153C' }}
            onClick={() => setFocusMode((v) => !v)}
            title="Ẩn 2 lề bên để tập trung đọc sâu"
          >
            {focusMode ? <EyeOff size={16} /> : <Eye size={16} />}
            <span>Chế độ tập trung</span>
          </button>
          <button
            style={{ background: '#00153C', color: '#FFFFFF', border: 0, borderRadius: '8px', padding: '0 16px', minHeight: '38px', fontWeight: 700, fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
            onClick={() => navigate(`/reflection/${documentId || '1'}`)}
          >
            <Sparkles size={16} style={{ color: '#FAE100' }} />
            <span>Kết thúc phiên đọc</span>
          </button>
        </div>
      </header>

      {/* Slim progress bar under reading toolbar */}
      <div style={{ background: '#E2E3E1', height: '3px', width: '100%' }}>
        <div style={{ background: '#00153C', height: '100%', width: `${progressPercent}%`, transition: 'width 0.3s ease' }} />
      </div>

      {/* 2. Three-Zone Reading Canvas */}
      <div
        className={`reader-body-3col ${focusMode ? 'focus-mode-active' : ''}`}
        style={{
          display: 'grid',
          gridTemplateColumns: focusMode ? '0px 1fr 0px' : '260px minmax(0, 1fr) 280px',
          transition: 'all 0.25s ease-in-out',
          minHeight: 'calc(100vh - 67px)',
          background: '#F9F9F7'
        }}
      >
        {/* Zone 1: Left Margin (260px) */}
        {!focusMode && (
          <aside className="sidebar-left" style={{ background: '#F4F4F2', borderRight: '1px solid var(--border-solid)', padding: '24px 18px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Box: Toc */}
            <div className="sidebar-box" style={{ background: '#FFFFFF', border: '1px solid var(--border-solid)', borderRadius: '12px', padding: '16px' }}>
              <h4 style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: 800, color: '#00153C', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <List size={15} /> Mục lục chương sách {numPages > 0 ? `(${tocItems.length})` : ''}
              </h4>
              <div className="toc-list" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {parsingToc ? (
                  <div style={{ padding: '12px 8px', fontSize: '12px', color: '#747781', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <LoaderCircle className="spin" size={14} />
                    <span>Đang phân tích mục lục…</span>
                  </div>
                ) : tocItems.length === 0 ? (
                  <div style={{ padding: '8px', fontSize: '12px', color: '#747781' }}>Chưa khởi tạo mục lục</div>
                ) : (
                  tocItems.map((chap) => {
                    const isActive = activeChapter?.id === chap.id
                    return (
                      <button
                        key={chap.id}
                        className={`toc-item ${isActive ? 'active' : ''}`}
                        onClick={() => void changePage(chap.page)}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '8px 10px',
                          borderRadius: '6px',
                          fontSize: '13px',
                          border: 0,
                          background: isActive ? '#00153C' : 'transparent',
                          color: isActive ? '#FFFFFF' : '#444650',
                          fontWeight: isActive ? 700 : 500,
                          textAlign: 'left',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {chap.title}
                          </span>
                          {chap.status && (
                            <span className={getStatusLabel(chap.status).className} style={{ fontSize: '9px', padding: '1px 6px', borderRadius: '10px', width: 'fit-content' }}>
                              {getStatusLabel(chap.status).text}
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '10px', opacity: isActive ? 0.8 : 0.6, flexShrink: 0 }}>tr.{chap.page}</span>
                      </button>
                    )
                  })
                )}
              </div>
            </div>

            {/* Box: Reading Rhythm */}
            <div className="sidebar-box" style={{ background: '#FFFFFF', border: '1px solid var(--border-solid)', borderRadius: '12px', padding: '16px' }}>
              <h4 style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: 800, color: '#00153C', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={15} /> Nhịp điệu đọc tĩnh lặng
              </h4>
              <div style={{ background: '#FFFDF0', border: '1px solid #DEC800', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', fontWeight: 700, color: '#504700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={16} />
                <span>{minutesRead} phút đọc tĩnh lặng</span>
              </div>
              <p style={{ fontSize: '12px', color: '#747781', margin: '10px 0 0', lineHeight: 1.5 }}>
                Tốc độ đọc ước tính: <strong>~245 từ/phút</strong>
              </p>
            </div>

            {/* Box: PDF Upload Utility */}
            <div className="sidebar-box" style={{ background: '#FFFFFF', border: '1px solid var(--border-solid)', borderRadius: '12px', padding: '16px' }}>
              <button
                className="secondary-button"
                style={{ width: '100%', justifyContent: 'center', fontSize: '12px' }}
                onClick={() => navigate('/library?upload=true')}
              >
                <FileUp size={14} /> Tải PDF mới / Tải tài liệu
              </button>
            </div>
          </aside>
        )}

        {/* Zone 2: Paper Vessel Center Canvas (Max width 720px) */}
        <main className="middle-reading-canvas" ref={stageRef} onMouseUp={captureSelection} style={{ overflowY: 'auto', padding: '40px 24px 100px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div
            className="paper-vessel-container"
            style={{
              width: '100%',
              maxWidth: '720px',
              background: '#FFFFFF',
              border: '1px solid var(--border-solid)',
              borderRadius: '16px',
              padding: '48px 56px',
              boxShadow: '0 4px 30px rgba(0,0,0,0.03)'
            }}
          >
            {/* Header info */}
            <div style={{ borderBottom: '1px solid var(--border-solid)', paddingBottom: '20px', marginBottom: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#8A671F' }}>
                  {cleanTitle} • TRANG {pageNumber} / {numPages || 1}
                </span>
                <span className="badge-tag" style={{ fontSize: '10px', background: '#F4F4F2', color: '#747781' }}>
                  Nội dung nguyên tác PDF
                </span>
              </div>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '26px', fontWeight: 800, color: '#00153C', margin: '6px 0 0', letterSpacing: '-0.02em', lineHeight: 1.25 }}>
                {activeChapter ? activeChapter.title : `Trang ${pageNumber}`}
              </h1>
            </div>

            {/* Extracted PDF Text Content */}
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '17px', lineHeight: 1.8, color: '#1A1C1B', marginBottom: '24px' }}>
              {currentPageText ? (
                currentPageText
                  .split(/(?<=[.!?])\s+/)
                  .reduce<string[][]>((acc, sentence, idx) => {
                    if (idx === 0 || acc[acc.length - 1].join(' ').length > 320) {
                      acc.push([sentence])
                    } else {
                      acc[acc.length - 1].push(sentence)
                    }
                    return acc
                  }, [])
                  .slice(0, 4)
                  .map((pGroup, pIdx) => (
                    <p key={pIdx} className={pIdx === 0 ? 'drop-cap-paragraph' : ''} style={{ margin: pIdx === 0 ? 0 : '16px 0 0' }}>
                      {pGroup.join(' ')}
                    </p>
                  ))
              ) : (
                <div style={{ padding: '14px 18px', background: '#F9F9F7', border: '1px dashed var(--border-solid)', borderRadius: '10px', fontSize: '13px', color: '#747781' }}>
                  Đang hiển thị nội dung nguyên tác PDF trang {pageNumber}...
                </div>
              )}
            </div>

            {/* AI Executive Chapter Overview Box */}
            {activeChapter && (
              <div style={{ background: '#F4F4F2', border: '1px solid var(--border-solid)', borderRadius: '12px', padding: '20px', margin: '24px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <Brain size={18} style={{ color: '#00153C' }} />
                  <span style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#00153C' }}>
                    Tổng quan bài học & Ý chính từ AI (Khảo chứng chương)
                  </span>
                </div>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', lineHeight: 1.6, color: '#444650', margin: '0 0 14px' }}>
                  {activeChapter.summary}
                </p>
                {activeChapter.keyPoints && activeChapter.keyPoints.length > 0 && (
                  <div style={{ background: '#FFFFFF', border: '1px solid var(--border-solid)', borderRadius: '8px', padding: '12px 14px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#8A671F', display: 'block', marginBottom: '8px' }}>
                      📌 Ý chính quan trọng trong phần này:
                    </span>
                    <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: '#1A1C1B', lineHeight: 1.6 }}>
                      {activeChapter.keyPoints.map((pt, idx) => (
                        <li key={idx} style={{ marginBottom: '4px' }}>{pt}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Embedded Active Recall Stop Card (Điểm dừng suy ngẫm) */}
            <div style={{ background: '#FFFDF0', border: '1px solid #DEC800', borderRadius: '12px', padding: '22px', margin: '32px 0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#8A671F', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={14} /> Điểm dừng suy ngẫm • Active Recall (Nghỉ 30 giây)
                </span>
                <span className="badge-forming">● Trải nghiệm đọc sâu</span>
              </div>
              <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '17px', fontWeight: 700, color: '#00153C', margin: '0 0 12px' }}>
                {activeChapter
                  ? `Ý chính quan trọng nhất trong "${activeChapter.title}" giúp bạn đọng lại điều gì?`
                  : `Nội dung cốt lõi nhất của trang ${pageNumber} giúp bạn rút ra bài học gì?`}
              </h4>

              {!showRecallAnswer ? (
                <button
                  style={{ background: '#FAE100', color: '#504700', border: '1px solid #DEC800', borderRadius: '8px', padding: '10px 16px', fontWeight: 700, fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                  onClick={() => setShowRecallAnswer(true)}
                >
                  Đối chiếu lý giải từ AI & Nguyên tác
                </button>
              ) : (
                <div style={{ background: '#FFFFFF', border: '1px solid #DEC800', borderRadius: '10px', padding: '16px', marginTop: '12px' }}>
                  <p style={{ fontSize: '12px', fontWeight: 700, color: '#8A671F', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Phân tích đối chiếu từ tác phẩm ({cleanTitle}):
                  </p>
                  <p style={{ fontFamily: 'var(--font-serif)', fontSize: '14px', lineHeight: 1.6, color: '#1A1C1B', margin: 0 }}>
                    {activeChapter?.summary || (currentPageText ? currentPageText.slice(0, 300) : 'Trí nhớ tự phục hồi thông qua quy trình đối chiếu nguyên tác chủ động.')}
                  </p>
                </div>
              )}
            </div>

            {/* Drawing Tools bar if enabled */}
            {drawMode && (
              <div className="ink-toolbar" style={{ margin: '20px 0' }}>
                <Brush size={17} />
                {colors.map((color) => (
                  <button
                    key={color}
                    className={inkColor === color ? 'selected' : ''}
                    style={{ background: color }}
                    onClick={() => setInkColor(color)}
                    aria-label={`Màu ${color}`}
                  />
                ))}
                <input
                  type="range"
                  min="2"
                  max="12"
                  value={inkWidth}
                  onChange={(e) => setInkWidth(Number(e.target.value))}
                  aria-label="Độ dày cọ"
                />
                <button className="ink-action" onClick={() => setDraftStrokes((items) => items.slice(0, -1))} disabled={!draftStrokes.length}>
                  <RotateCcw size={17} /> Hoàn tác
                </button>
                <button className="ink-action" onClick={() => setDraftStrokes([])} disabled={!draftStrokes.length}>
                  <Eraser size={17} /> Xóa nét
                </button>
                <button className="ink-save" onClick={() => void saveInk()} disabled={!draftStrokes.length || saving}>
                  <Save size={17} /> Xong
                </button>
              </div>
            )}

            {/* React PDF Document render */}
            <Document
              file={fileData}
              onLoadSuccess={onPdfLoaded}
              onLoadError={onPdfError}
              loading={<div className="pdf-message"><LoaderCircle className="spin" />Đang hiển thị nguyên tác…</div>}
              error={<div className="pdf-message">Không thể tải nội dung file PDF.</div>}
            >
              <div className="pdf-page-wrap">
                <Page
                  pageNumber={pageNumber}
                  width={Math.max(280, Math.min(stageWidth - 48, 600))}
                  scale={zoom}
                  renderTextLayer={!drawMode}
                  renderAnnotationLayer
                />
                <InkCanvas
                  active={drawMode}
                  color={inkColor}
                  width={inkWidth}
                  saved={pageInk}
                  draft={draftStrokes}
                  onDraftChange={setDraftStrokes}
                />
              </div>
            </Document>

            {/* Floating Selection Tooltip (Bôi đen câu chữ) */}
            {selectedText && !drawMode && (
              <div className="selection-actions" style={{ background: '#00153C', color: '#FFFFFF', border: 0, boxShadow: '0 8px 30px rgba(0,0,0,0.25)' }}>
                <Highlighter size={16} style={{ color: '#FAE100' }} />
                <span style={{ fontSize: '12px', fontWeight: 600 }}>Đã bôi đen câu then chốt</span>
                <button style={{ background: '#FAE100', color: '#504700', fontWeight: 700 }} onClick={() => void handleSaveNote()}>
                  <Highlighter size={14} /> Tô màu
                </button>
                <button style={{ background: 'rgba(255,255,255,0.15)', color: '#FFF' }} onClick={() => void handleSaveNote()}>
                  <NotebookPen size={14} /> Ghi chú
                </button>
                <button style={{ background: 'rgba(255,255,255,0.15)', color: '#FFF' }} onClick={() => void handleInlineAskAi()}>
                  <Bot size={14} /> Hỏi đoạn này
                </button>
                <button style={{ background: 'transparent', color: '#FFF' }} onClick={() => setSelectedText('')}>
                  <X size={16} />
                </button>
              </div>
            )}
            {/* Footer paper buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '36px', paddingTop: '20px', borderTop: '1px solid var(--border-solid)' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="secondary-button" style={{ fontSize: '12px' }}>
                  <BookOpen size={14} /> Đánh dấu trang
                </button>
                <button className="secondary-button" style={{ fontSize: '12px' }}>
                  Trích dẫn học thuật
                </button>
              </div>
              <button
                className="secondary-button"
                style={{ fontSize: '12px', color: '#00153C', fontWeight: 700 }}
                onClick={() => void changePage(pageNumber + 1)}
                disabled={pageNumber >= numPages}
              >
                Trang tiếp theo ({Math.min(pageNumber + 1, numPages || 1)}/{numPages || 1}) <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </main>

        {/* Inline AI Popover Drawer */}
        {showInlineAi && (
          <div className="inline-ai-popover" style={{ border: '1px solid var(--border-solid)', borderRadius: '14px', padding: '18px', boxShadow: '0 10px 40px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#00153C' }}>
                <Bot size={18} /> {inlineAiQuery || 'AI Groq Giải thích ngữ cảnh'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  style={{ border: 0, background: 'transparent', color: '#8A671F', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  onClick={() => setShowGroqKeyModal((v) => !v)}
                  title="Cấu hình Groq API Key cá nhân"
                >
                  ⚡ Groq Key
                </button>
                <button className="reader-icon-button" onClick={() => setShowInlineAi(false)}>
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Groq Key Config Box */}
            {showGroqKeyModal && (
              <div style={{ background: '#FFFDF0', border: '1px solid #DEC800', borderRadius: '10px', padding: '12px', marginBottom: '14px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#504700', marginBottom: '6px' }}>
                  ⚡ Cấu hình Groq API Key (Miễn phí & Siêu tốc):
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="password"
                    placeholder="Dán mã gsk_... từ groq.com"
                    value={groqKeyInput}
                    onChange={(e) => setGroqKeyInput(e.target.value)}
                    style={{ flex: 1, fontSize: '12px', padding: '6px 8px', border: '1px solid var(--border-solid)', borderRadius: '6px' }}
                  />
                  <button
                    style={{ background: '#00153C', color: '#FFF', border: 0, borderRadius: '6px', padding: '0 12px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                    onClick={() => {
                      if (groqKeyInput.trim()) {
                        localStorage.setItem('mindtrace_groq_api_key', groqKeyInput.trim())
                      } else {
                        localStorage.removeItem('mindtrace_groq_api_key')
                      }
                      setShowGroqKeyModal(false)
                      if (selectedText) {
                        void handleInlineAskAi()
                      }
                    }}
                  >
                    Lưu Key
                  </button>
                </div>
              </div>
            )}

            <p style={{ fontSize: '12px', color: '#747781', fontStyle: 'italic', margin: '0 0 10px' }}>
              “{selectedText.slice(0, 140)}…”
            </p>

            {asking ? (
              <div style={{ padding: '20px 0', textAlign: 'center', color: '#747781' }}>
                <LoaderCircle className="spin" size={24} />
                <p style={{ margin: '8px 0 0', fontSize: '13px' }}>AI Groq đang phân tích ngữ cảnh học thuật…</p>
              </div>
            ) : (
              <>
                <FormattedAiMessage
                  content={inlineAiAnswer}
                  onSaveAsNote={(text) => {
                    setNoteText(text)
                    setShowInlineAi(false)
                  }}
                />
                <ActiveRecallQuiz
                  quizItems={parseQuizFromAiResponse(inlineAiAnswer, activeChapter?.title || 'Bối cảnh tài liệu')}
                  topicName={activeChapter?.title || cleanTitle}
                  onEvaluated={(status, scorePercent) => {
                    void handleChapterQuizEvaluated(status, scorePercent)
                  }}
                />
              </>
            )}
          </div>
        )}

        {/* Zone 3: Right Margin (280px) */}
        {!focusMode && (
          <aside className="sidebar-right" style={{ background: '#F4F4F2', borderLeft: '1px solid var(--border-solid)', padding: '24px 18px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Margin Sticky Notes */}
            <div className="sidebar-box" style={{ background: '#FFFFFF', border: '1px solid var(--border-solid)', borderRadius: '12px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: 800, color: '#00153C', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <NotebookPen size={15} /> Ghi chú bên lề
                </h4>
                <button
                  className="secondary-button"
                  style={{ fontSize: '11px', padding: '2px 8px', minHeight: '26px' }}
                  onClick={() => setNoteText('Ghi chú suy tưởng mới…')}
                >
                  + Thêm nhanh
                </button>
              </div>

              {/* Quick Note Input */}
              <div style={{ marginBottom: '14px' }}>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Ghi lại phát hiện của bạn ở lề sách…"
                  rows={3}
                  style={{ width: '100%', fontSize: '13px', padding: '10px', border: '1px solid var(--border-solid)', borderRadius: '8px', background: '#F9F9F7' }}
                />
                {noteText.trim() && (
                  <button
                    className="primary-button"
                    style={{ width: '100%', minHeight: '34px', fontSize: '12px', marginTop: '6px', justifyContent: 'center' }}
                    onClick={() => void handleSaveNote()}
                    disabled={saving}
                  >
                    {saving ? <LoaderCircle className="spin" size={14} /> : <Save size={14} />} Lưu ghi chú lề
                  </button>
                )}
              </div>

              <div className="margin-notes-list">
                {marginNotes.length === 0 ? (
                  <div style={{ background: '#F9F9F7', border: '1px solid var(--border-solid)', borderRadius: '8px', padding: '12px' }}>
                    <span className="badge-tag" style={{ marginBottom: '6px', display: 'inline-block' }}>ĐÃ TỔNG HỢP</span>
                    <p style={{ fontSize: '12px', color: '#444650', margin: 0, lineHeight: 1.5 }}>
                      Hệ thống 1 phản ứng bằng trực giác nhanh chóng nhưng dễ mắc bẫy sai lệch nhận thức.
                    </p>
                  </div>
                ) : (
                  marginNotes.map((item) => (
                    <div
                      key={item.id}
                      className="margin-note-card"
                      style={{ background: '#F9F9F7', border: '1px solid var(--border-solid)', borderRadius: '8px', padding: '12px', marginBottom: '8px', cursor: item.source_location?.page ? 'pointer' : 'default' }}
                      onClick={() => {
                        if (item.source_location?.page) {
                          void changePage(item.source_location.page)
                          window.scrollTo({ top: 0, behavior: 'smooth' })
                        }
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span className="badge-tag">ĐÃ TỔNG HỢP</span>
                        {item.source_location?.page && (
                          <span style={{ fontSize: '11px', color: '#00153C', fontWeight: 700 }}>Trang {item.source_location.page} ↗</span>
                        )}
                      </div>
                      {item.selected_text && (
                        <blockquote style={{ margin: '0 0 6px', fontSize: '11px', color: '#747781', fontStyle: 'italic', lineHeight: 1.5 }}>
                          “{stripMarkdown(item.selected_text).slice(0, 80)}…”
                        </blockquote>
                      )}
                      <p style={{ margin: 0, color: '#1A1C1B', fontSize: '13px', lineHeight: 1.5 }}>{stripMarkdown(item.note)}</p>
                      <button
                        className="delete-note"
                        style={{ position: 'static', marginTop: '6px', fontSize: '11px', color: '#A4433F', background: 'transparent', border: 0, cursor: 'pointer', padding: 0 }}
                        onClick={(e) => {
                          e.stopPropagation()
                          void deleteAnnotation(item.id)
                        }}
                      >
                        <Trash2 size={12} /> Xóa ghi chú
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Conceptual Mesh Tag Cloud */}
            <div className="sidebar-box" style={{ background: '#FFFFFF', border: '1px solid var(--border-solid)', borderRadius: '12px', padding: '16px' }}>
              <h4 style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: 800, color: '#00153C', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Tag size={15} /> Mạng lưới ý niệm liên đới
              </h4>
              <div className="concept-tag-cloud" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {['Heuristics', 'Cạn kiệt ý chí', 'Thiên kiến sẵn có', 'Nỗ lực tối thiểu', 'Nhận thức luận'].map((tag) => (
                  <button
                    key={tag}
                    className="concept-pill"
                    style={{ background: '#F9F9F7', border: '1px solid var(--border-solid)', color: '#00153C', borderRadius: '20px', padding: '4px 10px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                    onClick={() => {
                      setSelectedText(tag)
                      void handleInlineAskAi(`Phân tích ý niệm "${tag}" trong tư duy hệ thống.`)
                    }}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}
