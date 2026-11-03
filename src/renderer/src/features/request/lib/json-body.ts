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

function lineAndColumn(text: string, position: number): { line: number; column: number } {
  const before = text.slice(0, position)
  const line = before.split('\n').length
  const column = position - before.lastIndexOf('\n')
  return { line, column }
}
