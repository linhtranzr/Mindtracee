import { supabase } from './supabase'

export type AnnotationKind = 'note' | 'highlight'

export type AnnotationRecord = {
  id: string
  user_id: string
  document_id: string
  kind: AnnotationKind
  selected_text: string | null
  note: string
  source_location: {
    page?: number
    rects?: Array<{ x: number; y: number; w: number; h: number }>
    prefix?: string
    suffix?: string
  }
  created_at: string
  updated_at: string
}

export function validateAnnotationNote(kind: AnnotationKind, noteText: string): string | null {
  const trimmed = noteText.trim()
  if (kind === 'note' && !trimmed) {
    return 'Ghi chú không được để trống.'
  }
  if (trimmed.length > 10000) {
    return 'Ghi chú quá dài (tối đa 10,000 ký tự).'
  }
  return null
}

export async function fetchDocumentAnnotations(documentId: string) {
  return supabase
    .from('annotations')
    .select('id,user_id,document_id,kind,selected_text,note,source_location,created_at,updated_at')
    .eq('document_id', documentId)
    .order('created_at', { ascending: false })
}

export async function createAnnotation(params: {
  documentId: string
  kind: AnnotationKind
  selectedText?: string | null
  note?: string
  pageNumber: number
}) {
  const noteContent = params.note?.trim() || (params.kind === 'highlight' ? 'Trích dẫn nổi bật' : '')
  const validationError = validateAnnotationNote(params.kind, noteContent)
  if (validationError) {
    return { data: null, error: new Error(validationError) }
  }

  return supabase
    .from('annotations')
    .insert({
      document_id: params.documentId,
      kind: params.kind,
      selected_text: params.selectedText?.slice(0, 3000) || null,
      note: noteContent,
      source_location: { page: params.pageNumber },
    })
    .select()
    .single()
}

export async function deleteAnnotation(id: string) {
  return supabase.from('annotations').delete().eq('id', id)
}
