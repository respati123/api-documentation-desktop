import { describe, expect, it } from 'vitest'
import { buildScriptTypings } from '@/features/request/lib/script-typings'

const typings = buildScriptTypings((key) => `text of ${key}`)

describe('buildScriptTypings', () => {
  it('declares the apidocs object with the members the sandbox prelude defines', () => {
    expect(typings).toContain('declare const apidocs: ApiDocs;')
    for (const name of ['vars', 'req', 'res', 'check', 'assert', 'log']) expect(typings).toMatch(new RegExp(`\\b${name}[:(]`))
    for (const name of ['get', 'set', 'has', 'remove']) expect(typings).toMatch(new RegExp(`\\b${name}\\(`))
    for (const name of ['url', 'method', 'setHeader', 'dropHeader']) expect(typings).toMatch(new RegExp(`\\b${name}[:(]`))
    for (const name of ['status', 'elapsed', 'header', 'text', 'data']) expect(typings).toMatch(new RegExp(`\\b${name}[:(]`))
    for (const name of ['equals', 'isTrue', 'isFalse', 'includes', 'below', 'above', 'hasKey'])
      expect(typings).toMatch(new RegExp(`\\b${name}\\(`))
  })

  it('translates every description through the given function', () => {
    expect(typings).toContain('text of completion.varsSet')
    expect(typings).toContain('text of completion.apidocs')
  })

  it('does not declare the send method, which the sandbox does not support', () => {
    expect(typings).not.toMatch(/\bsend\(/)
  })

  it('types the scope option the prelude reads', () => {
    expect(typings).toContain("scope?: 'environment' | 'global'")
  })
})
