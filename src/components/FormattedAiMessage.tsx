import { useMemo, useState } from 'react'
import { BookmarkPlus, Check, Copy } from 'lucide-react'
import { normalizeVietnameseText } from '../lib/vietnamese'

type Props = {
  content: string
  onSaveAsNote?: (text: string) => void
}

type InlineToken =
  | { type: 'text'; value: string }
  | { type: 'bold'; value: string }
  | { type: 'italic'; value: string }
  | { type: 'code'; value: string }

function parseInline(text: string): InlineToken[] {
  const tokens: InlineToken[] = []
  const regex = /(\*\*(.*?)\*\*|\*(.*?)\*|`(.*?)`)/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: 'text', value: normalizeVietnameseText(text.slice(lastIndex, match.index)) })
    }

    if (match[2] !== undefined) {
      tokens.push({ type: 'bold', value: normalizeVietnameseText(match[2]) })
    } else if (match[3] !== undefined) {
      tokens.push({ type: 'italic', value: normalizeVietnameseText(match[3]) })
    } else if (match[4] !== undefined) {
      tokens.push({ type: 'code', value: normalizeVietnameseText(match[4]) })
    }

    lastIndex = regex.lastIndex
  }

  if (lastIndex < text.length) {
    tokens.push({ type: 'text', value: normalizeVietnameseText(text.slice(lastIndex)) })
  }

  return tokens
}

function renderInline(text: string) {
  const tokens = parseInline(text)
  return tokens.map((token, idx) => {
    switch (token.type) {
      case 'bold':
        return (
          <strong key={idx} className="ai-highlight-bold">
            {token.value}
          </strong>
        )
      case 'italic':
        return <em key={idx}>{token.value}</em>
      case 'code':
        return <code key={idx} className="ai-inline-code">{token.value}</code>
      default:
        return <span key={idx}>{token.value}</span>
    }
  })
}

type TableBlock = {
  type: 'table'
  headers: string[]
  rows: string[][]
}

type ListBlock = {
  type: 'list'
  ordered: boolean
  items: string[]
}

type HeadingBlock = {
  type: 'heading'
  level: number
  text: string
}

type ParagraphBlock = {
  type: 'paragraph'
  text: string
}

type CalloutBlock = {
  type: 'callout'
  title: string
  text: string
}

type Block = TableBlock | ListBlock | HeadingBlock | ParagraphBlock | CalloutBlock

function parseBlocks(raw: string): Block[] {
  const normalizedRaw = normalizeVietnameseText(raw)
  const lines = normalizedRaw.split('\n')
  const blocks: Block[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i].trim()

    if (!line) {
      i++
      continue
    }

    // Markdown Table
    if (line.startsWith('|') && line.endsWith('|')) {
      const tableLines: string[] = []
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        tableLines.push(lines[i].trim())
        i++
      }

      if (tableLines.length >= 2) {
        const headers = tableLines[0]
          .split('|')
          .slice(1, -1)
          .map((cell) => normalizeVietnameseText(cell.trim()))

        const isSeparator = tableLines[1].split('|').slice(1, -1).every((cell) => /^[-:\s]+$/.test(cell))
        const dataStartIndex = isSeparator ? 2 : 1

        const rows: string[][] = []
        for (let r = dataStartIndex; r < tableLines.length; r++) {
          const rowCells = tableLines[r]
            .split('|')
            .slice(1, -1)
            .map((cell) => normalizeVietnameseText(cell.trim()))
          if (rowCells.some((c) => c.length > 0)) {
            rows.push(rowCells)
          }
        }

        blocks.push({ type: 'table', headers, rows })
        continue
      }
    }

    // Headings
    const headingMatch = /^#{1,6}\s+(.+)$/.exec(line)
    if (headingMatch) {
      const level = line.indexOf(' ')
      blocks.push({ type: 'heading', level: Math.min(level, 4), text: normalizeVietnameseText(headingMatch[1]) })
      i++
      continue
    }

    // Bullet & Numbered Lists
    const listMatch = /^([-*]|\d+\.)\s+(.+)$/.exec(line)
    if (listMatch) {
      const ordered = /^\d+\./.test(listMatch[1])
      const items: string[] = []
      while (i < lines.length) {
        const itemMatch = /^([-*]|\d+\.)\s+(.+)$/.exec(lines[i].trim())
        if (!itemMatch) break
        items.push(normalizeVietnameseText(itemMatch[2]))
        i++
      }
      blocks.push({ type: 'list', ordered, items })
      continue
    }

    // Callouts
    const calloutMatch = /^(Lưu ý|Kết luận|Ví dụ|Gợi ý|Khái niệm|Tóm lại):\s*(.*)$/i.exec(line)
    if (calloutMatch) {
      blocks.push({ type: 'callout', title: normalizeVietnameseText(calloutMatch[1]), text: normalizeVietnameseText(calloutMatch[2]) })
      i++
      continue
    }

    // Paragraph
    blocks.push({ type: 'paragraph', text: normalizeVietnameseText(line) })
    i++
  }

  return blocks
}

export function FormattedAiMessage({ content, onSaveAsNote }: Props) {
  const blocks = useMemo(() => parseBlocks(content), [content])
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback if clipboard API unavailable
    }
  }

  return (
    <div className="formatted-ai-content">
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'heading': {
            if (block.level === 1) {
              return <h2 key={index} className="ai-heading-1">{renderInline(block.text)}</h2>
            }
            if (block.level === 2) {
              return <h3 key={index} className="ai-heading-2">{renderInline(block.text)}</h3>
            }
            return <h4 key={index} className="ai-heading-3">{renderInline(block.text)}</h4>
          }

          case 'table': {
            return (
              <div key={index} className="ai-table-wrapper">
                <table className="ai-formatted-table">
                  <thead>
                    <tr>
                      {block.headers.map((header, hIdx) => (
                        <th key={hIdx}>{renderInline(header)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, rIdx) => (
                      <tr key={rIdx}>
                        {row.map((cell, cIdx) => (
                          <td key={cIdx}>{renderInline(cell)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }

          case 'list': {
            if (block.ordered) {
              return (
                <ol key={index} className="ai-formatted-list">
                  {block.items.map((item, idx) => (
                    <li key={idx}>{renderInline(item)}</li>
                  ))}
                </ol>
              )
            }
            return (
              <ul key={index} className="ai-formatted-list">
                {block.items.map((item, idx) => (
                  <li key={idx}>{renderInline(item)}</li>
                ))}
              </ul>
            )
          }

          case 'callout': {
            return (
              <div key={index} className="ai-callout-card">
                <strong>{block.title}:</strong> {renderInline(block.text)}
              </div>
            )
          }

          case 'paragraph':
          default: {
            return (
              <p key={index} className="ai-formatted-p">
                {renderInline(block.text)}
              </p>
            )
          }
        }
      })}

      <div className="ai-message-footer">
        <button className="ai-action-btn" onClick={() => void handleCopy()} title="Sao chép nội dung câu trả lời">
          {copied ? <Check size={13} style={{ color: 'var(--primary)' }} /> : <Copy size={13} />}
          {copied ? 'Đã chép' : 'Sao chép'}
        </button>
        {onSaveAsNote && (
          <button className="ai-action-btn" onClick={() => onSaveAsNote(content)} title="Lưu câu trả lời này vào Ghi chú của trang">
            <BookmarkPlus size={13} /> Lưu ghi chú
          </button>
        )}
      </div>
    </div>
  )
}

