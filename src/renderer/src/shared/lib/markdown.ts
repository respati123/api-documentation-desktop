// A small markdown reader for request docs. It returns plain data, and every text value is a string.
// The view turns that data into React elements, so nothing in a document is ever run as HTML.

export type InlineNode =
  | { kind: 'text'; text: string }
  | { kind: 'code'; text: string }
  | { kind: 'strong'; children: InlineNode[] }
  | { kind: 'em'; children: InlineNode[] }
  | { kind: 'link'; href: string; children: InlineNode[] }

export type MarkdownBlock =
  | { kind: 'heading'; level: 1 | 2 | 3 | 4 | 5 | 6; children: InlineNode[] }
  | { kind: 'paragraph'; children: InlineNode[] }
  | { kind: 'list'; ordered: boolean; items: InlineNode[][] }
  | { kind: 'code'; language: string; text: string }
  | { kind: 'quote'; children: InlineNode[] }
  | { kind: 'rule' }

const headingLine = /^(#{1,6})\s+(.*)$/
const ruleLine = /^\s{0,3}(?:-\s*){3,}$|^\s{0,3}(?:\*\s*){3,}$|^\s{0,3}(?:_\s*){3,}$/
const listLine = /^(\s*)([-*+]|\d+\.)\s+(.*)$/
const fenceLine = /^\s*(```+|~~~+)\s*([\w-]*)\s*$/
const quoteLine = /^>\s?(.*)$/

function isSafeHref(href: string): boolean {
  return /^(https?:\/\/|mailto:)/i.test(href)
}

// Rules are tried in order. The one that matches earliest in the text wins.
const inlineRules: { pattern: RegExp; build: (match: RegExpExecArray) => InlineNode }[] = [
  { pattern: /`([^`]+)`/, build: (match) => ({ kind: 'code', text: match[1] }) },
  {
    pattern: /\[([^\]]+)\]\(((?:[^()\s]|\([^()\s]*\))+)\)/,
    // An unsafe link keeps its label as plain text, and its address is dropped.
    build: (match) =>
      isSafeHref(match[2]) ? { kind: 'link', href: match[2], children: parseInline(match[1]) } : { kind: 'text', text: match[1] },
  },
  { pattern: /\*\*([^*]+)\*\*|__([^_]+)__/, build: (match) => ({ kind: 'strong', children: parseInline(match[1] ?? match[2]) }) },
  {
    // Underscores count as emphasis only at word edges, so snake_case names stay as written.
    pattern: /(?<![A-Za-z0-9*])\*([^*\s][^*]*)\*(?![A-Za-z0-9*])|(?<![A-Za-z0-9_])_([^_\s][^_]*)_(?![A-Za-z0-9_])/,
    build: (match) => ({ kind: 'em', children: parseInline(match[1] ?? match[2]) }),
  },
]

export function parseInline(text: string): InlineNode[] {
  const nodes: InlineNode[] = []
  let rest = text
  while (rest.length > 0) {
    let best: { index: number; length: number; node: InlineNode } | null = null
    for (const rule of inlineRules) {
      const match = rule.pattern.exec(rest)
      if (match && (best === null || match.index < best.index)) {
        best = { index: match.index, length: match[0].length, node: rule.build(match) }
      }
    }
    if (best === null) {
      nodes.push({ kind: 'text', text: rest })
      break
    }
    if (best.index > 0) nodes.push({ kind: 'text', text: rest.slice(0, best.index) })
    nodes.push(best.node)
    rest = rest.slice(best.index + best.length)
  }
  return nodes
}

export function parseMarkdown(source: string): MarkdownBlock[] {
  const lines = source.replace(/\r\n?/g, '\n').split('\n')
  const blocks: MarkdownBlock[] = []
  let index = 0

  while (index < lines.length) {
    const line = lines[index]

    if (line.trim() === '') {
      index += 1
      continue
    }

    const fence = fenceLine.exec(line)
    if (fence) {
      const marker = fence[1]
      const code: string[] = []
      index += 1
      while (index < lines.length && !lines[index].trim().startsWith(marker)) {
        code.push(lines[index])
        index += 1
      }
      index += 1
      blocks.push({ kind: 'code', language: fence[2], text: code.join('\n') })
      continue
    }

    const heading = headingLine.exec(line)
    if (heading) {
      blocks.push({ kind: 'heading', level: heading[1].length as 1 | 2 | 3 | 4 | 5 | 6, children: parseInline(heading[2]) })
      index += 1
      continue
    }

    if (ruleLine.test(line)) {
      blocks.push({ kind: 'rule' })
      index += 1
      continue
    }

    const list = listLine.exec(line)
    if (list) {
      const ordered = /\d/.test(list[2])
      const items: InlineNode[][] = []
      while (index < lines.length) {
        const item = listLine.exec(lines[index])
        if (!item || /\d/.test(item[2]) !== ordered) break
        items.push(parseInline(item[3]))
        index += 1
      }
      blocks.push({ kind: 'list', ordered, items })
      continue
    }

    const quote = quoteLine.exec(line)
    if (quote) {
      const parts: string[] = []
      while (index < lines.length) {
        const next = quoteLine.exec(lines[index])
        if (!next) break
        parts.push(next[1])
        index += 1
      }
      blocks.push({ kind: 'quote', children: parseInline(parts.join(' ')) })
      continue
    }

    const parts: string[] = []
    while (index < lines.length) {
      const current = lines[index]
      if (
        current.trim() === '' ||
        fenceLine.test(current) ||
        headingLine.test(current) ||
        listLine.test(current) ||
        quoteLine.test(current) ||
        ruleLine.test(current)
      ) {
        break
      }
      parts.push(current.trim())
      index += 1
    }
    blocks.push({ kind: 'paragraph', children: parseInline(parts.join(' ')) })
  }

  return blocks
}
