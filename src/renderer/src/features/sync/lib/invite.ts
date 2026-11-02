// An invite can be pasted as a link (api-docs://invite?token=...) or as the bare token.
export function inviteTokenFrom(input: string): string | null {
  const value = input.trim()
  if (!value) return null
  if (!value.includes('token=')) return value
  try {
    return new URL(value).searchParams.get('token') || null
  } catch {
    return null
  }
}

export function normalizeEmail(input: string): string {
  return input.trim().toLowerCase()
}

export function isValidEmail(email: string): boolean {
  return /^\S+@\S+\.\S+$/.test(email)
}
