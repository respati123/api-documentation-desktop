import { memo, useEffect, useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'

export const AuthDialog = memo(function AuthDialog({
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
      setError(reason instanceof Error ? reason.message : 'Could not open the browser for sign-in.')
    }
  }

  function openDialog() {
    onOpen()
    setError('')
    setOpen(true)
  }

  return (
    <>
      {showTrigger && (
        <Button variant="outline" size="sm" onClick={openDialog}>
          Sign in
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign in</DialogTitle>
            <DialogDescription>Sign in with your browser to sync and share workspaces.</DialogDescription>
          </DialogHeader>
          <div className="dialog-form">
            {(error || initialError) && (
              <p className="dialog-error" role="alert">
                {error || initialError}
              </p>
            )}
            {pending ? (
              <p className="auth-pending" role="status">
                Waiting for you to finish signing in in your browser…
              </p>
            ) : (
              <Button type="button" onClick={() => void startSignIn()}>
                Sign in with browser
              </Button>
            )}
            {pending && (
              <button className="dialog-link" type="button" onClick={() => void startSignIn()}>
                Didn't open? Try again
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
})
