import { describe, expect, it } from 'vitest'
import { inviteTokenFrom, isValidEmail, normalizeEmail } from '@/features/sync/lib/invite'

describe('inviteTokenFrom', () => {
  it('reads the token from an invite link', () => {
    expect(inviteTokenFrom('api-docs://invite?token=abc123')).toBe('abc123')
  })

  it('accepts a bare token', () => {
    expect(inviteTokenFrom('  abc123  ')).toBe('abc123')
  })

  it('returns null for an empty input or a link without a token', () => {
    expect(inviteTokenFrom('   ')).toBeNull()
    expect(inviteTokenFrom('api-docs://invite?other=1&token=')).toBeNull()
  })
})

describe('email helpers', () => {
  it('trims and lowercases an email before it is sent', () => {
    expect(normalizeEmail('  Ada@Example.COM ')).toBe('ada@example.com')
  })

  it('needs an @ and a dot after it', () => {
    expect(isValidEmail('ada@example.com')).toBe(true)
    expect(isValidEmail('ada@example')).toBe(false)
    expect(isValidEmail('ada example@x.io')).toBe(false)
  })
})
