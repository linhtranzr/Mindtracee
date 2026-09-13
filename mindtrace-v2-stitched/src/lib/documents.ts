import { supabase } from './supabase'

export const MAX_PDF_SIZE = 50 * 1024 * 1024

export type DocumentRecord = {
  id: string
  title: string
  storage_path: string
  file_size: number
  status: 'uploading' | 'processing' | 'ready' | 'error'
  progress: number
  created_at: string
}

export function validatePdf(file: File): string | null {
  const hasPdfExtension = file.name.toLowerCase().endsWith('.pdf')
  const hasPdfType = file.type === 'application/pdf' || file.type === ''
  if (!hasPdfExtension || !hasPdfType) return 'MindTrace hiện chỉ hỗ trợ tài liệu PDF.'
  if (file.size <= 0) return 'Tệp PDF đang trống.'
  if (file.size > MAX_PDF_SIZE) return 'Tệp PDF cần nhỏ hơn 50 MB.'
  return null
}

export function safeStorageName(fileName: string) {
  const base = fileName.replace(/\.pdf$/i, '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'document'
  return `${base}.pdf`
}

export async function fetchDocuments() {
  return supabase.from('documents').select('id,title,storage_path,file_size,status,progress,created_at').order('created_at', { ascending: false })
}
