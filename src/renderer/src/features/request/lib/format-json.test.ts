import { describe, expect, it } from 'vitest'
import { formatJsonText } from '@/features/request/lib/format-json'

describe('formatJsonText', () => {
  it('pretty-prints valid JSON with two-space indentation', () => {
    expect(formatJsonText('{"a":1,"b":[true]}')).toBe('{\n  "a": 1,\n  "b": [\n    true\n  ]\n}')
  })

  it('returns null for text that is not JSON, so the editor is left alone', () => {
    expect(formatJsonText('{ a: 1 }')).toBeNull()
  })

  it('returns null for an empty example', () => {
    expect(formatJsonText('   ')).toBeNull()
  })
})
