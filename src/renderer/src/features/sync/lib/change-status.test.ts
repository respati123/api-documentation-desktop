import { describe, expect, it } from 'vitest'
import { changeStatusCode, changeStatusKey } from '@/features/sync/lib/change-status'

describe('change status', () => {
  it('maps each status to its badge letter', () => {
    expect(changeStatusCode('added')).toBe('U')
    expect(changeStatusCode('deleted')).toBe('D')
    expect(changeStatusCode('modified')).toBe('M')
    expect(changeStatusCode(undefined)).toBe('M')
  })

  it('maps each status to its locale key, not to English text', () => {
    expect(changeStatusKey('added')).toBe('changes.untracked')
    expect(changeStatusKey('deleted')).toBe('changes.deleted')
    expect(changeStatusKey(undefined)).toBe('changes.modified')
  })
})
