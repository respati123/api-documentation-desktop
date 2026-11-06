export type JsonTokenKind = 'key' | 'string' | 'number' | 'literal' | 'plain'
export type JsonToken = { kind: JsonTokenKind; text: string }

const PATTERN = /("(?:[^"\\]|\\.)*")(\s*:)?|\b(true|false|null)\b|(-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b)/g

// Splits JSON text into colored pieces. It never rejects text, so half-typed JSON still gets its colors.
export function jsonTokens(text: string): JsonToken[] {
  const tokens: JsonToken[] = []
  let cursor = 0
  for (const match of text.matchAll(PATTERN)) {
    const start = match.index
    if (start > cursor) tokens.push({ kind: 'plain', text: text.slice(cursor, start) })
    if (match[1] !== undefined) {
      tokens.push({ kind: match[2] ? 'key' : 'string', text: match[1] })
      if (match[2]) tokens.push({ kind: 'plain', text: match[2] })
    } else if (match[3] !== undefined) tokens.push({ kind: 'literal', text: match[3] })
    else tokens.push({ kind: 'number', text: match[4] })
    cursor = start + match[0].length
  }
  if (cursor < text.length) tokens.push({ kind: 'plain', text: text.slice(cursor) })
  return tokens
}
