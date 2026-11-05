import { ApiError } from '@/lib/api'

// How many times a saved session is checked again when the server cannot be reached, and how long to wait between checks.
export const maxRestoreAttempts = 6
export const restoreRetryMs = 5000

// Only a 401 means the session expired or was ended. Any other failure says nothing about the session, so it is kept.
export function sessionRestoreFailure(error: unknown): 'clear' | 'retry' {
  return error instanceof ApiError && error.status === 401 ? 'clear' : 'retry'
}
