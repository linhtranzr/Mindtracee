export type KnowledgeStatus = 'unread' | 'exposed' | 'forming' | 'mastered' | 'needs_review'

export type EvidenceKind =
  | 'read'
  | 'highlighted'
  | 'asked_for_help'
  | 'free_recall'
  | 'explained'
  | 'connected'
  | 'applied'
  | 'could_not_recall'
  | 'self_reported_unclear'
  | 'review_recall'
  | 'misconception_corrected'

export type EvidenceRecord = {
  id: string
  user_id: string
  topic_id?: string | null
  kind: EvidenceKind
  content: string | null
  metadata?: Record<string, unknown>
  created_at: string
}

export type TopicRecord = {
  id: string
  user_id: string
  topic_name: string
  status: KnowledgeStatus
  weak_point: string | null
  next_review: string | null
  created_at: string
  updated_at: string
  doc_title?: string
  doc_id?: string
}

/**
 * Calculates deterministic knowledge status from append-only evidence history.
 */
export function calculateTopicStatus(evidences: EvidenceKind[]): KnowledgeStatus {
  if (!evidences || evidences.length === 0) return 'unread'

  const hasApplied = evidences.includes('applied') || evidences.includes('connected')
  const hasRecall = evidences.includes('free_recall') || evidences.includes('explained')
  const hasFailedRecall = evidences.includes('could_not_recall')

  if (hasFailedRecall) return 'needs_review'
  if (hasApplied) return 'mastered'
  if (hasRecall) return 'forming'
  if (evidences.includes('read') || evidences.includes('highlighted') || evidences.includes('asked_for_help')) {
    return 'exposed'
  }

  return 'unread'
}

export function getStatusLabel(status: KnowledgeStatus): { text: string; className: string } {
  switch (status) {
    case 'unread':
      return { text: 'Chưa đọc', className: 'badge-unread' }
    case 'exposed':
      return { text: 'Đã tiếp xúc', className: 'badge-exposed' }
    case 'forming':
      return { text: 'Đang hình thành', className: 'badge-forming' }
    case 'mastered':
      return { text: 'Nắm chắc', className: 'badge-mastered' }
    case 'needs_review':
      return { text: 'Cần gợi nhớ', className: 'badge-needs_review' }
  }
}
