import { describe, expect, it } from 'vitest'
import { canRevertTo, revertSucceeded } from '@/features/sync/lib/revert'

describe('revertSucceeded', () => {
  it('counts an applied pull or an up-to-date copy as a finished revert', () => {
    expect(revertSucceeded('applied')).toBe(true)
    expect(revertSucceeded('upToDate')).toBe(true)
  })

  it('does not count a blocked, conflicted, or failed pull, so its message stays visible', () => {
    expect(revertSucceeded('blocked')).toBe(false)
    expect(revertSucceeded('conflicts')).toBe(false)
    expect(revertSucceeded('failed')).toBe(false)
  })
})

describe('canRevertTo', () => {
  it('refuses the commit that is already the cloud head', () => {
    expect(canRevertTo('head-2', 'head-2')).toBe(false)
  })

  it('allows an older commit, and allows any commit when the head is not known', () => {
    expect(canRevertTo('head-1', 'head-2')).toBe(true)
    expect(canRevertTo('head-1', null)).toBe(true)
  })
})
