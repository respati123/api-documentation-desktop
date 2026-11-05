import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { WORKSPACE_TEXT } from '@/features/workspace/constants/workspace-text.constants'
import { maxRestoreAttempts, restoreRetryMs, sessionRestoreFailure } from '@/features/workspace/lib/session-restore'
import type { ApiUser } from '@/features/workspace/models/cloud-session.model'
import { cloudAuthService } from '@/features/workspace/services/cloud-auth.service'
import { sessionService } from '@/features/workspace/services/session.service'

export type SessionInput = {
  onStatus: (message: string) => void
  onOpenTeam: () => void
  onSignedOut: () => void
}

// Who is signed in, the sign-in flow and its errors, the invite token waiting to be used, and the account menu.
export function useWorkspaceSessionViewModel(input: SessionInput) {
  const { t } = useTranslation('workspace')
  const signInFailedMessage = useEffectEvent(() => t(WORKSPACE_TEXT.session.signInFailed))
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
      sessionService.onAuthSession((token) => {
        void (async () => {
          try {
            // The main process opened the sealed session, so the token is already the desktop's own. Its user is read with it.
            const user = await cloudAuthService.me(token)
            setSessionToken(token)
            setUser(user)
            const saved = await sessionService.save(token)
            if (!saved) reportStatus('Session will last until the app closes because secure storage is unavailable on this system.')
            if (inviteTokenDraft) openTeamAfterAuth()
          } catch (error) {
            setAuthError(error instanceof Error ? error.message : signInFailedMessage())
          }
        })()
      }),
    [inviteTokenDraft],
  )

  // The sign-in was not completed (the box could not be opened). The user can try again.
  useEffect(
    () =>
      sessionService.onAuthFailed(() => {
        setAuthError(signInFailedMessage())
      }),
    [],
  )

  // A saved session is checked with the cloud before it counts as signed in.
  useEffect(() => {
    let active = true
    let attempts = 0
    let retryTimer: number | undefined
    // The saved session is cleared only when the server rejects it. An unreachable server keeps it for the next check.
    const restore = async () => {
      const token = await sessionService.load().catch(() => null)
      if (!token || !active) return
      try {
        const me = await cloudAuthService.me(token)
        if (!active) return
        setSessionToken(token)
        setUser(me)
      } catch (error) {
        if (!active) return
        if (sessionRestoreFailure(error) === 'clear') {
          await sessionService.clear()
          return
        }
        attempts += 1
        if (attempts < maxRestoreAttempts) retryTimer = window.setTimeout(() => void restore(), restoreRetryMs)
      }
    }
    void restore()
    return () => {
      active = false
      if (retryTimer !== undefined) window.clearTimeout(retryTimer)
    }
  }, [])

  useEffect(() => {
    if (!accountMenuOpen) return
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Node) || !accountMenuRef.current?.contains(target)) setAccountMenuOpen(false)
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

  const beginBrowserSignIn = async () => {
    setAuthError('')
    const cloudUrl = (import.meta.env.VITE_CLOUD_URL || 'http://localhost:5174').replace(/\/+$/, '')
    await sessionService.beginBrowserSignIn(cloudUrl)
  }

  const clearAuthError = () => setAuthError('')

  async function signOut() {
    if (sessionToken) await cloudAuthService.logout(sessionToken).catch(() => undefined)
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
