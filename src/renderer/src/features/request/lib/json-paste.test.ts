import { describe, expect, it } from 'vitest'
import { formatPastedJson } from '@/features/request/lib/json-body'

describe('formatPastedJson', () => {
  it('turns a JavaScript-style object into formatted JSON', () => {
    const pasted = "{\n    title: 'foo',\n    body: 'bar',\n    userId: 1\n  }"
    expect(formatPastedJson(pasted)).toBe('{\n  "title": "foo",\n  "body": "bar",\n  "userId": 1\n}')
  })

  it('accepts trailing commas', () => {
    expect(formatPastedJson('{a: 1, b: [1, 2,],}')).toBe('{\n  "a": 1,\n  "b": [\n    1,\n    2\n  ]\n}')
  })

  it('keeps an apostrophe inside a double-quoted string', () => {
    expect(formatPastedJson('{"note": "it\'s fine"}')).toBe('{\n  "note": "it\'s fine"\n}')
  })

  it('escapes double quotes inside a single-quoted string', () => {
    expect(formatPastedJson(`{a: 'say "hi"'}`)).toBe('{\n  "a": "say \\"hi\\""\n}')
  })

  it('keeps true, false and null as values', () => {
    expect(formatPastedJson('{a: true, b: null, c: false}')).toBe('{\n  "a": true,\n  "b": null,\n  "c": false\n}')
  })

  it('returns null when the text cannot become JSON', () => {
    expect(formatPastedJson('{a: foo}')).toBeNull()
    expect(formatPastedJson('{"a": ')).toBeNull()
  })

  it('returns null for a fragment that is not a complete value', () => {
    expect(formatPastedJson('title: 1')).toBeNull()
  })
})
