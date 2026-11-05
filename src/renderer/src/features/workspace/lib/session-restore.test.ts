import { describe, expect, it } from 'vitest'
import { sessionRestoreFailure } from '@/features/workspace/lib/session-restore'
import { ApiError } from '@/lib/api'

describe('sessionRestoreFailure', () => {
  it('clears the saved session only when the server rejects it', () => {
    expect(sessionRestoreFailure(new ApiError('Sign in is required.', 401, null))).toBe('clear')
  })

  it('keeps the saved session and retries when the server is down, errors, or cannot be reached', () => {
    expect(sessionRestoreFailure(new ApiError('Server error.', 500, null))).toBe('retry')
    expect(sessionRestoreFailure(new TypeError('Failed to fetch'))).toBe('retry')
  })
})
