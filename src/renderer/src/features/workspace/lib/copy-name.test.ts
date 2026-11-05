import { describe, expect, it } from 'vitest'
import { copyName } from '@/features/workspace/lib/copy-name'

describe('copyName', () => {
  it('adds -Copy when no sibling has that name', () => {
    expect(copyName('Get Users', ['Get Users', 'Create User'])).toBe('Get Users-Copy')
  })

  it('numbers later copies from -Copy-1', () => {
    expect(copyName('Get Users', ['Get Users', 'Get Users-Copy'])).toBe('Get Users-Copy-1')
    expect(copyName('Get Users', ['Get Users', 'Get Users-Copy', 'Get Users-Copy-1'])).toBe('Get Users-Copy-2')
  })

  it('fills a gap instead of skipping past it', () => {
    expect(copyName('Get Users', ['Get Users-Copy', 'Get Users-Copy-2'])).toBe('Get Users-Copy-1')
  })

  it('only looks at the given siblings, so the same name elsewhere does not count', () => {
    expect(copyName('Get Users', [])).toBe('Get Users-Copy')
  })
})
