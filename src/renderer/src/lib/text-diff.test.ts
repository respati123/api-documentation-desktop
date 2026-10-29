import { describe, expect, test } from 'vitest'
import { diffText } from './text-diff'

describe('diffText', () => {
  test('returns no rows when both sides are empty', () => {
    expect(diffText('', '')).toEqual([])
  })

  test('marks unchanged lines as same on both sides', () => {
    expect(diffText('a\nb', 'a\nb')).toEqual([
      { leftText: 'a', rightText: 'a', leftLine: 1, rightLine: 1, kind: 'same' },
      { leftText: 'b', rightText: 'b', leftLine: 2, rightLine: 2, kind: 'same' },
    ])
  })

  test('reports a changed line as removed then added', () => {
    expect(diffText('a\nold\nc', 'a\nnew\nc').map((row) => row.kind)).toEqual(['same', 'removed', 'added', 'same'])
  })

  test('reports lines that only exist on one side', () => {
    expect(diffText('', 'x')).toEqual([{ leftText: '', rightText: 'x', leftLine: null, rightLine: 1, kind: 'added' }])
    expect(diffText('x', '')).toEqual([{ leftText: 'x', rightText: '', leftLine: 1, rightLine: null, kind: 'removed' }])
  })
})
