import { describe, expect, it } from 'vitest'

// Helper testing inline parsing logic
function parseInlineTest(text: string) {
  const regex = /(\*\*(.*?)\*\*|\*(.*?)\*|`(.*?)`)/g
  const tokens = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: 'text', value: text.slice(lastIndex, match.index) })
    }
    if (match[2] !== undefined) {
      tokens.push({ type: 'bold', value: match[2] })
    } else if (match[3] !== undefined) {
      tokens.push({ type: 'italic', value: match[3] })
    } else if (match[4] !== undefined) {
      tokens.push({ type: 'code', value: match[4] })
    }
    lastIndex = regex.lastIndex
  }
  if (lastIndex < text.length) {
    tokens.push({ type: 'text', value: text.slice(lastIndex) })
  }
  return tokens
}

describe('FormattedAiMessage parsing logic', () => {
  it('extracts bold tokens cleanly for key concept highlights', () => {
    const tokens = parseInlineTest('Bài viết về **tác động của AI trong y tế** rất chi tiết.')
    expect(tokens).toHaveLength(3)
    expect(tokens[1]).toEqual({ type: 'bold', value: 'tác động của AI trong y tế' })
  })

  it('handles multiple highlights in a single line', () => {
    const tokens = parseInlineTest('Phân biệt **Content AI** với **Content giặt hook**')
    const boldTokens = tokens.filter((t) => t.type === 'bold')
    expect(boldTokens).toHaveLength(2)
    expect(boldTokens[0].value).toBe('Content AI')
    expect(boldTokens[1].value).toBe('Content giặt hook')
  })
})
