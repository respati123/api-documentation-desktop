import { describe, expect, it } from 'vitest'
import { parseMarkdown } from '@/shared/lib/markdown'

describe('parseMarkdown blocks', () => {
  it('reads headings by level', () => {
    expect(parseMarkdown('# Title\n\n### Part')).toEqual([
      { kind: 'heading', level: 1, children: [{ kind: 'text', text: 'Title' }] },
      { kind: 'heading', level: 3, children: [{ kind: 'text', text: 'Part' }] },
    ])
  })

  it('joins the lines of one paragraph and splits paragraphs on blank lines', () => {
    expect(parseMarkdown('first line\nsecond line\n\nnext')).toEqual([
      { kind: 'paragraph', children: [{ kind: 'text', text: 'first line second line' }] },
      { kind: 'paragraph', children: [{ kind: 'text', text: 'next' }] },
    ])
  })

  it('groups bullet items and numbered items into separate lists', () => {
    expect(parseMarkdown('- one\n- two\n\n1. first\n2. second')).toEqual([
      { kind: 'list', ordered: false, items: [[{ kind: 'text', text: 'one' }], [{ kind: 'text', text: 'two' }]] },
      { kind: 'list', ordered: true, items: [[{ kind: 'text', text: 'first' }], [{ kind: 'text', text: 'second' }]] },
    ])
  })

  it('keeps a fenced code block as written, with its language', () => {
    expect(parseMarkdown('```json\n{ "a": **1** }\n```')).toEqual([{ kind: 'code', language: 'json', text: '{ "a": **1** }' }])
  })

  it('reads block quotes and horizontal rules', () => {
    expect(parseMarkdown('> note\n> more\n\n---')).toEqual([
      { kind: 'quote', children: [{ kind: 'text', text: 'note more' }] },
      { kind: 'rule' },
    ])
  })
})

describe('parseMarkdown inline', () => {
  it('reads bold, italic, and inline code', () => {
    expect(parseMarkdown('**Purpose:** send `GET` now, *soon*')).toEqual([
      {
        kind: 'paragraph',
        children: [
          { kind: 'strong', children: [{ kind: 'text', text: 'Purpose:' }] },
          { kind: 'text', text: ' send ' },
          { kind: 'code', text: 'GET' },
          { kind: 'text', text: ' now, ' },
          { kind: 'em', children: [{ kind: 'text', text: 'soon' }] },
        ],
      },
    ])
  })

  it('does not italicize snake_case identifiers', () => {
    expect(parseMarkdown('set user_id_value first')).toEqual([
      { kind: 'paragraph', children: [{ kind: 'text', text: 'set user_id_value first' }] },
    ])
  })

  it('keeps a safe link and turns an unsafe one into plain text', () => {
    expect(parseMarkdown('[docs](https://example.com/a) and [bad](javascript:alert(1))')).toEqual([
      {
        kind: 'paragraph',
        children: [
          { kind: 'link', href: 'https://example.com/a', children: [{ kind: 'text', text: 'docs' }] },
          { kind: 'text', text: ' and ' },
          { kind: 'text', text: 'bad' },
        ],
      },
    ])
  })

  it('keeps raw HTML as text, so nothing in a document runs', () => {
    expect(parseMarkdown('<img src=x onerror=alert(1)>')).toEqual([
      { kind: 'paragraph', children: [{ kind: 'text', text: '<img src=x onerror=alert(1)>' }] },
    ])
  })
})
