export type JsonBodyCheck =
  | { status: 'empty' }
  | { status: 'valid'; formatted: string }
  | { status: 'invalid'; line: number; column: number; message: string }

// Parses a JSON body and returns it pretty-printed, or where the syntax error is.
// Engines word the error differently. Newer ones give "(line L column C)", older ones give "at position P".
export function checkJsonBody(text: string): JsonBodyCheck {
  if (!text.trim()) return { status: 'empty' }
  try {
    return { status: 'valid', formatted: JSON.stringify(JSON.parse(text), null, 2) }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid JSON'
    const position = errorPosition(message, text)
    const { line, column } = lineAndColumn(text, position)
    return { status: 'invalid', line, column, message }
  }
}

function errorPosition(message: string, text: string): number {
  const lineColumn = /\(line (\d+) column (\d+)\)/.exec(message)
  if (lineColumn) return offsetOf(text, Number(lineColumn[1]), Number(lineColumn[2]))
  const at = /at position (\d+)/.exec(message)
  if (at) return Number(at[1])
  return text.length
}

function offsetOf(text: string, line: number, column: number): number {
  const lines = text.split('\n')
  let offset = 0
  for (let index = 0; index < Math.min(line - 1, lines.length); index += 1) offset += lines[index].length + 1
  return offset + column - 1
}

// For pasted text. Object-style text (bare keys, single quotes, trailing commas) is rewritten to JSON and formatted.
// Returns null when the text cannot be read as one JSON value, so the paste goes through unchanged.
export function formatPastedJson(text: string): string | null {
  const check = checkJsonBody(toStrictJson(text))
  return check.status === 'valid' ? check.formatted : null
}

function toStrictJson(text: string): string {
  let out = ''
  let index = 0
  while (index < text.length) {
    const char = text[index]
    if (char === '"') {
      const end = endOfDoubleQuoted(text, index)
      out += text.slice(index, end)
      index = end
    } else if (char === "'") {
      const { value, end } = singleQuoted(text, index)
      out += value
      index = end
    } else if (/[A-Za-z_$]/.test(char)) {
      const word = /[A-Za-z_$][\w$]*/y
      word.lastIndex = index
      const name = word.exec(text)?.[0] ?? char
      const keyAt = /\s*:/y
      keyAt.lastIndex = index + name.length
      out += keyAt.test(text) ? `"${name}"` : name
      index += name.length
    } else {
      if (char === '}' || char === ']') out = out.replace(/,(\s*)$/, '$1')
      out += char
      index += 1
    }
  }
  return out
}

function endOfDoubleQuoted(text: string, start: number): number {
  let index = start + 1
  while (index < text.length) {
    if (text[index] === '\\') index += 2
    else if (text[index] === '"') return index + 1
    else index += 1
  }
  return text.length
}

// Rewrites a single-quoted string as a double-quoted one, so the quote characters inside it stay valid.
function singleQuoted(text: string, start: number): { value: string; end: number } {
  let value = '"'
  let index = start + 1
  while (index < text.length) {
    const char = text[index]
    if (char === '\\') {
      const next = text[index + 1] ?? ''
      value += next === "'" ? "'" : `\\${next}`
      index += 2
    } else if (char === "'") return { value: `${value}"`, end: index + 1 }
    else if (char === '"') {
      value += '\\"'
      index += 1
    } else {
      value += char
      index += 1
    }
  }
  return { value, end: text.length }
}

function lineAndColumn(text: string, position: number): { line: number; column: number } {
  const before = text.slice(0, position)
  const line = before.split('\n').length
  const column = position - before.lastIndexOf('\n')
  return { line, column }
}
