import { describe, expect, it } from 'vitest'
import { scriptApiEntries } from '@/features/request/lib/script-api'
import { buildScriptTypings } from '@/features/request/lib/script-typings'
import en from '@/shared/i18n/locales/en/request.json'

// The last member name in a signature: `apidocs.assert(v).equals(x)` gives `equals`.
function memberName(signature: string): string {
  const members = [...signature.matchAll(/\.(\w+)(?=\(|$)/g)]
  return members.at(-1)?.[1] ?? ''
}

function lookup(path: string): unknown {
  return path
    .split('.')
    .reduce<unknown>((node, key) => (typeof node === 'object' && node !== null ? Reflect.get(node, key) : undefined), en)
}

describe('scriptApiEntries', () => {
  it('declares every entry in the editor typings', () => {
    const typings = buildScriptTypings((key) => key)
    for (const entry of scriptApiEntries) {
      expect(typings).toMatch(new RegExp(`\\b${memberName(entry.signature)}\\b`))
    }
  })

  it('has an English description for every entry', () => {
    for (const entry of scriptApiEntries) {
      expect(typeof lookup(entry.descriptionKey)).toBe('string')
    }
  })

  it('marks request members as pre-request only and response members as post-response only', () => {
    for (const entry of scriptApiEntries) {
      if (entry.signature.startsWith('apidocs.req.')) expect(entry.phase).toBe('pre')
      if (entry.signature.startsWith('apidocs.res.')) expect(entry.phase).toBe('post')
    }
  })
})
