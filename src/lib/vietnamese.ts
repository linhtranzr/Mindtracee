/**
 * Normalizes Vietnamese text strings to NFC (Normalization Form C)
 * fixing decomposed Unicode diacritics (NFD), stray accents, double combining marks,
 * and floating tone diacritics commonly produced by PDF text extraction or custom PDF fonts.
 * Preserves all inter-word spaces accurately.
 */
export function normalizeVietnameseText(text: string | null | undefined): string {
  if (!text) return ''

  // 1. Convert to NFD (Decomposed) so all diacritics & tone marks are split into individual tokens
  let normalized = text.normalize('NFD')

  // 2. Remove whitespace directly preceding a combining diacritical mark (e.g. "â \u0300")
  normalized = normalized.replace(/[\t\f\v ]+([\u0300-\u036f])/g, '$1')

  // 3. Remove stray whitespace between a combining mark and an internal syllable-ending consonant (e.g. "ê\u0302\u0301 n" -> "ê\u0302\u0301n")
  // Only target trailing consonants (c, m, n, p, t, ch, ng) if NOT followed by a letter (which would indicate the start of the next word)
  normalized = normalized.replace(
    /([\u0300-\u036f])[\t\f\v ]+([cmnptgh]{1,2})(?=[^\w\u0300-\u036f\u00C0-\u024F]|$)/gi,
    '$1$2'
  )

  // 4. Remove duplicate identical combining diacritics (e.g. \u0300\u0300)
  normalized = normalized.replace(/([\u0300-\u036f])\1+/g, '$1')

  // 5. Remove duplicate tone marks (grave \u0300, acute \u0301, tilde \u0303, hook \u0309, dot below \u0323)
  normalized = normalized.replace(/([\u0300\u0301\u0303\u0309\u0323])[\u0300\u0301\u0303\u0309\u0323]+/g, '$1')

  // 6. Compose back to NFC
  return normalized.normalize('NFC')
}

/**
 * Strips raw markdown formatting tags (###, **, *, >, `, [AI Prefix])
 * leaving clean human-readable text suitable for card titles, tables, and tooltips.
 */
export function stripMarkdown(text: string | null | undefined): string {
  if (!text) return ''
  return text
    .replace(/^\[AI Groq Analysis\]:\s*/i, '')
    .replace(/^\[AI Analysis\]:\s*/i, '')
    .replace(/###\s*/g, '')
    .replace(/##\s*/g, '')
    .replace(/#\s*/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/^>\s*/gm, '')
    .replace(/>\s*/g, ' ')
    .replace(/`{1,3}[^`]*`{1,3}/g, '')
    .replace(/💡\s*/g, '')
    .replace(/📌\s*/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Formats raw file titles or document names into clean human-readable titles.
 * E.g. "Giao_trinh_tu_hoc_Content_Mapping_3C_Content_Angle.pdf" -> "Giao trinh tu hoc Content Mapping 3C Content Angle"
 */
export function formatCleanTitle(rawTitle?: string | null): string {
  if (!rawTitle) return 'Tài liệu đọc'
  const cleaned = stripMarkdown(rawTitle)
    .replace(/\.pdf$/i, '')
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return cleaned || 'Tài liệu đọc'
}
