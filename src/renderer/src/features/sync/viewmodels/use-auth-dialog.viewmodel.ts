import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SYNC_TEXT } from '@/features/sync/constants/sync-text.constants'

// Owns the sign-in dialog: whether it is open, the browser sign-in state, and the error to show.
export function useAuthDialogViewModel({
  showTrigger,
  onBeginSignIn,
  openRequest,
  initialError,
  onOpen,
}: {
  showTrigger: boolean
  onBeginSignIn: () => Promise<void>
  openRequest: number
  initialError: string
  onOpen: () => void
}) {
  const { t } = useTranslation('sync')
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (openRequest > 0) setOpen(true)
  }, [openRequest])
  useEffect(() => {
    if (!open) setPending(false)
  }, [open])
  useEffect(() => {
    if (!showTrigger && open) setOpen(false)
  }, [showTrigger, open])

  async function startSignIn() {
    setError('')
    setPending(true)
    try {
      await onBeginSignIn()
    } catch (reason) {
      setPending(false)
      setError(reason instanceof Error ? reason.message : t(SYNC_TEXT.auth.openFailed))
    }
  }

  function openDialog() {
    onOpen()
    setError('')
    setOpen(true)
  }

  return {
    showTrigger,
    triggerLabel: t(SYNC_TEXT.auth.trigger),
    onOpenTrigger: openDialog,
    open,
    onOpenChange: setOpen,
    title: t(SYNC_TEXT.auth.title),
    description: t(SYNC_TEXT.auth.description),
    signInLabel: t(SYNC_TEXT.auth.signInBrowser),
    waitingText: t(SYNC_TEXT.auth.waiting),
    retryLabel: t(SYNC_TEXT.auth.retry),
    pending,
    errorText: error || initialError || null,
    onSignIn: () => void startSignIn(),
  }
}
