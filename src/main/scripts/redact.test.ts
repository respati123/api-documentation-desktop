import { describe, expect, it } from 'vitest'
import { redactSecrets } from './redact'

describe('redactSecrets', () => {
  it('replaces every occurrence of a secret value', () => {
    expect(redactSecrets('token abc123 and again abc123', ['abc123'])).toBe('token <secret> and again <secret>')
  })

  it('replaces the longer value first, so a shorter value inside it does not leave a fragment', () => {
    expect(redactSecrets('key abc123456', ['abc', 'abc123456'])).toBe('key <secret>')
  })

  it('ignores an empty secret value, which would otherwise match everywhere', () => {
    expect(redactSecrets('hello', [''])).toBe('hello')
  })
})
