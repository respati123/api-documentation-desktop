import { describe, expect, it } from 'vitest'
import { applyCompletion, completionAt } from '@/features/request/lib/script-completions'

// The caret goes at the end of the text in each case.
function at(text: string, phase: 'pre' | 'post' = 'pre') {
  return completionAt(text, text.length, phase)
}

function labels(text: string, phase: 'pre' | 'post' = 'pre'): string[] {
  return (at(text, phase)?.items ?? []).map((item) => item.label)
}

describe('completionAt', () => {
  it('lists the apidocs members after the dot, and req only before the request', () => {
    expect(labels('apidocs.')).toEqual(['vars', 'req', 'check', 'assert', 'log'])
    expect(labels('apidocs.', 'post')).toEqual(['vars', 'res', 'check', 'assert', 'log'])
  })

  it('filters members by the letters after the dot', () => {
    expect(labels('apidocs.ch')).toEqual(['check'])
    expect(at('apidocs.ch')).toMatchObject({ start: 'apidocs.'.length, end: 'apidocs.ch'.length })
  })

  it('lists the vars methods after apidocs.vars.', () => {
    expect(labels('apidocs.vars.')).toEqual(['get', 'set', 'has', 'remove'])
    expect(labels('apidocs.vars.se')).toEqual(['set'])
  })

  it('lists the request members only in the pre-request phase, and the response members only after', () => {
    expect(labels('apidocs.req.')).toEqual(['url', 'method', 'setHeader', 'dropHeader'])
    expect(labels('apidocs.res.', 'post')).toEqual(['status', 'elapsed', 'header', 'text', 'data'])
    expect(labels('apidocs.req.', 'post')).toEqual([])
    expect(labels('apidocs.res.', 'pre')).toEqual([])
  })

  it('lists the assertion methods after a chained assert call', () => {
    expect(labels('apidocs.assert(res.status).')).toEqual(['equals', 'isTrue', 'isFalse', 'includes', 'below', 'above', 'hasKey'])
    expect(labels('apidocs.assert(res.status).eq', 'post')).toEqual(['equals'])
  })

  it('offers apidocs when the user has typed at least two letters of it', () => {
    expect(labels('ap')).toEqual(['apidocs'])
    expect(labels('x = apid')).toEqual(['apidocs'])
    expect(at('a')).toBeNull()
  })

  it('does not open when the caret is not on a completable name', () => {
    expect(at('apidocs.vars.get("token").')).toBeNull()
    expect(at('console.lo')).toBeNull()
    expect(at('foo.ap')).toBeNull()
    expect(at('apidocs.unknown.')).toBeNull()
    expect(at('apidocs.vars.zz')).toBeNull()
  })

  it('uses the caret position, not the end of the text', () => {
    const text = 'apidocs.vars.get("a")\n'
    expect(completionAt(text, 'apidocs.v'.length, 'pre')?.items.map((item) => item.label)).toEqual(['vars'])
  })
})

describe('applyCompletion', () => {
  it('replaces the typed letters with the chosen name and puts the caret after it', () => {
    const text = 'apidocs.vars.se'
    const match = at(text)
    if (!match) throw new Error('expected a match')
    expect(applyCompletion(text, match, match.items[0])).toEqual({ value: 'apidocs.vars.set', cursor: 'apidocs.vars.set'.length })
  })

  it('keeps the text after the caret', () => {
    const text = 'const x = apidocs.vars.g;\n'
    const cursor = 'const x = apidocs.vars.g'.length
    const match = completionAt(text, cursor, 'pre')
    if (!match) throw new Error('expected a match')
    const next = applyCompletion(text, match, match.items[0])
    expect(next.value).toBe('const x = apidocs.vars.get;\n')
    expect(next.cursor).toBe('const x = apidocs.vars.get'.length)
  })
})
