import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react'
import { sessionService } from '@/features/workspace/services/session.service'
import { type ApiUser, apiCall } from '@/lib/api'

export type SessionInput = {
  onStatus: (message: string) => void
  onOpenTeam: () => void
  onSignedOut: () => void
}

// Who is signed in, the sign-in flow and its errors, the invite token waiting to be used, and the account menu.
export function useWorkspaceSessionViewModel(input: SessionInput) {
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const sessionTokenRef = useRef<string | null>(null)
  const [user, setUser] = useState<ApiUser | null>(null)
  const [authOpenRequest, setAuthOpenRequest] = useState(0)
  const [authError, setAuthError] = useState('')
  const [inviteTokenDraft, setInviteTokenDraft] = useState('')
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const accountMenuRef = useRef<HTMLDivElement>(null)

  // Effects read the latest callbacks through these, so they do not need to re-subscribe when the callers change.
  const reportStatus = useEffectEvent((message: string) => input.onStatus(message))
  const openTeamAfterAuth = useEffectEvent(() => input.onOpenTeam())

  useEffect(() => {
    sessionTokenRef.current = sessionToken
  }, [sessionToken])

  useEffect(
    () =>
      sessionService.onInviteToken((token) => {
        setInviteTokenDraft(token)
        if (sessionTokenRef.current) openTeamAfterAuth()
        else setAuthOpenRequest((current) => current + 1)
      }),
    [],
  )

  useEffect(
    () =>
      sessionService.onAuthCode((code) => {
        void (async () => {
          try {
            const result = await apiCall<{ token: string; user: ApiUser }>('/api/desktop-login/exchange', {
              method: 'POST',
              body: { code },
            })
            setSessionToken(result.token)
            setUser(result.user)
            const saved = await sessionService.save(result.token)
            if (!saved) reportStatus('Session will last until the app closes because secure storage is unavailable on this system.')
            if (inviteTokenDraft) openTeamAfterAuth()
          } catch (error) {
            setAuthError(error instanceof Error ? error.message : 'Could not complete sign-in.')
          }
        })()
      }),
    [inviteTokenDraft],
  )

  // A saved session is checked with the cloud before it counts as signed in.
  useEffect(() => {
    let active = true
    void sessionService
      .load()
      .then(async (token) => {
        if (!token || !active) return
        try {
          const result = await apiCall<{ user: ApiUser }>('/api/me', { token })
          if (!active) return
          setSessionToken(token)
          setUser(result.user)
        } catch {
          await sessionService.clear()
        }
      })
      .catch(() => undefined)
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!accountMenuOpen) return
    const onPointerDown = (event: MouseEvent) => {
      if (!accountMenuRef.current?.contains(event.target as Node)) setAccountMenuOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setAccountMenuOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [accountMenuOpen])

  const beginBrowserSignIn = useCallback(async () => {
    setAuthError('')
    const cloudUrl = (import.meta.env.VITE_CLOUD_URL || 'http://localhost:5174').replace(/\/+$/, '')
    await sessionService.beginBrowserSignIn(cloudUrl)
  }, [])

  const clearAuthError = useCallback(() => setAuthError(''), [])

  async function signOut() {
    if (sessionToken) await apiCall('/api/auth/logout', { token: sessionToken, method: 'POST' }).catch(() => undefined)
    await sessionService.clear()
    setSessionToken(null)
    setUser(null)
    input.onSignedOut()
    input.onStatus('Signed out. Local workspace data remains on this device.')
  }

  return {
    sessionToken,
    user,
    authOpenRequest,
    authError,
    setAuthError,
    inviteTokenDraft,
    setInviteTokenDraft,
    accountMenuOpen,
    setAccountMenuOpen,
    accountMenuRef,
    beginBrowserSignIn,
    clearAuthError,
    signOut,
  }
}
