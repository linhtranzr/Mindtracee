import { useState } from 'react'
import { Brain, CheckCircle2, HelpCircle, RefreshCw, Sparkles, XCircle } from 'lucide-react'
import { getStatusLabel, type KnowledgeStatus } from '../lib/knowledge-engine'
import type { QuizItem } from '../lib/ai'

type Props = {
  quizItems: QuizItem[]
  topicName?: string
  onEvaluated?: (status: KnowledgeStatus, scorePercent: number) => void
}

export function ActiveRecallQuiz({ quizItems, topicName = 'Chương hiện tại', onEvaluated }: Props) {
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({})
  const [evaluatedStatus, setEvaluatedStatus] = useState<KnowledgeStatus | null>(null)
  const [scorePercent, setScorePercent] = useState<number | null>(null)

  if (!quizItems || quizItems.length === 0) return null

  const allAnswered = quizItems.every((q) => userAnswers[q.id] !== undefined)

  function handleSelectOption(questionId: string, optionIndex: number) {
    if (userAnswers[questionId] !== undefined) return // Answered already

    const updatedAnswers = { ...userAnswers, [questionId]: optionIndex }
    setUserAnswers(updatedAnswers)

    // Check if all questions have now been answered
    const isNowAllAnswered = quizItems.every((q) => updatedAnswers[q.id] !== undefined)
    if (isNowAllAnswered) {
      let correctCount = 0
      for (const q of quizItems) {
        if (updatedAnswers[q.id] === q.correctIndex) {
          correctCount++
        }
      }

      const score = Math.round((correctCount / quizItems.length) * 100)
      setScorePercent(score)

      let status: KnowledgeStatus = 'needs_review'
      if (score >= 100) {
        status = 'mastered'
      } else if (score >= 50) {
        status = 'forming'
      }

      setEvaluatedStatus(status)
      if (onEvaluated) {
        onEvaluated(status, score)
      }
    }
  }

  function handleResetQuiz() {
    setUserAnswers({})
    setEvaluatedStatus(null)
    setScorePercent(null)
  }

  return (
    <div
      className="active-recall-quiz-container"
      style={{
        background: 'linear-gradient(135deg, #00153C 0%, #08214D 100%)',
        border: '1px solid rgba(0, 240, 255, 0.25)',
        borderRadius: '14px',
        padding: '20px',
        margin: '18px 0',
        color: '#F0F4F8',
        boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Brain size={18} style={{ color: '#00F0FF' }} />
          <span style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#00F0FF' }}>
            🧠 Active Recall Quiz — Kiểm chứng {topicName}
          </span>
        </div>
        {evaluatedStatus && (
          <button
            onClick={handleResetQuiz}
            style={{
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(255,255,255,0.1)',
              color: '#FFF',
              borderRadius: '6px',
              padding: '3px 8px',
              fontSize: '11px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <RefreshCw size={12} /> Làm lại
          </button>
        )}
      </div>

      <p style={{ fontSize: '12px', color: '#94A3B8', margin: '0 0 16px', lineHeight: 1.5 }}>
        Trả lời nhanh các câu hỏi tự kiểm tra bên dưới để AI tự động đánh giá mức độ thấu hiểu của bạn!
      </p>

      {/* Quiz Questions List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {quizItems.map((item, qIdx) => {
          const selectedOpt = userAnswers[item.id]
          const isAnswered = selectedOpt !== undefined

          return (
            <div
              key={item.id}
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
                padding: '14px',
              }}
            >
              <h5 style={{ fontSize: '13px', fontWeight: 700, color: '#FFF', margin: '0 0 10px', lineHeight: 1.45 }}>
                {qIdx + 1}. {item.question}
              </h5>

              {/* Options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {item.options.map((optText, optIdx) => {
                  let btnBg = 'rgba(255, 255, 255, 0.06)'
                  let btnBorder = 'rgba(255, 255, 255, 0.12)'
                  let btnColor = '#E2E8F0'

                  if (isAnswered) {
                    if (optIdx === item.correctIndex) {
                      btnBg = 'rgba(0, 230, 118, 0.18)'
                      btnBorder = 'rgba(0, 230, 118, 0.5)'
                      btnColor = '#00E676'
                    } else if (optIdx === selectedOpt && selectedOpt !== item.correctIndex) {
                      btnBg = 'rgba(255, 82, 82, 0.18)'
                      btnBorder = 'rgba(255, 82, 82, 0.5)'
                      btnColor = '#FF5252'
                    } else {
                      btnBg = 'rgba(255, 255, 255, 0.02)'
                      btnColor = '#64748B'
                    }
                  }

                  return (
                    <button
                      key={optIdx}
                      onClick={() => handleSelectOption(item.id, optIdx)}
                      disabled={isAnswered}
                      style={{
                        background: btnBg,
                        border: `1px solid ${btnBorder}`,
                        borderRadius: '8px',
                        padding: '8px 12px',
                        textAlign: 'left',
                        fontSize: '12px',
                        fontWeight: selectedOpt === optIdx ? 700 : 500,
                        color: btnColor,
                        cursor: isAnswered ? 'default' : 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>{optText}</span>
                      {isAnswered && optIdx === item.correctIndex && <CheckCircle2 size={14} style={{ color: '#00E676' }} />}
                      {isAnswered && optIdx === selectedOpt && selectedOpt !== item.correctIndex && <XCircle size={14} style={{ color: '#FF5252' }} />}
                    </button>
                  )
                })}
              </div>

              {/* Feedback explanation after answering */}
              {isAnswered && (
                <div
                  style={{
                    marginTop: '10px',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    background: selectedOpt === item.correctIndex ? 'rgba(0, 230, 118, 0.08)' : 'rgba(255, 184, 0, 0.08)',
                    borderLeft: `3px solid ${selectedOpt === item.correctIndex ? '#00E676' : '#FFB800'}`,
                    color: '#CBD5E1',
                    lineHeight: 1.45,
                  }}
                >
                  <strong style={{ color: selectedOpt === item.correctIndex ? '#00E676' : '#FFB800' }}>
                    {selectedOpt === item.correctIndex ? '✓ Chính xác!' : '💡 Ghi nhớ:'}
                  </strong>{' '}
                  {item.explanation}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Evaluated Status Result Box */}
      {evaluatedStatus && scorePercent !== null && (
        <div
          style={{
            marginTop: '18px',
            background: 'rgba(0, 240, 255, 0.08)',
            border: '1px solid var(--primary, #00F0FF)',
            borderRadius: '10px',
            padding: '14px 18px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            animation: 'fadeIn 0.3s ease',
          }}
        >
          <div>
            <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              🎯 Kết Quả Đánh Giá Trạng Thái Hiểu Biết:
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <span className={getStatusLabel(evaluatedStatus).className} style={{ fontSize: '13px', fontWeight: 800, padding: '4px 12px', borderRadius: '20px' }}>
                ● {getStatusLabel(evaluatedStatus).text}
              </span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#FFF' }}>
                (Đạt {scorePercent}% chính xác)
              </span>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <Sparkles size={20} style={{ color: '#FFB800', display: 'inline-block' }} />
            <p style={{ fontSize: '11px', color: '#94A3B8', margin: '2px 0 0' }}>
              Đã ghi nhận vào Nhật Ký Tri Thức
            </p>
          </div>
        </div>
      )}

      {!allAnswered && (
        <div style={{ marginTop: '12px', fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <HelpCircle size={13} /> Hãy hoàn thành tất cả các câu hỏi để nhận đánh giá năng lực từ AI.
        </div>
      )}
    </div>
  )
}
