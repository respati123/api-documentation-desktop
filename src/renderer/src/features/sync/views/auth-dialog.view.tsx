import type { ReactElement } from 'react'
import type { useAuthDialogViewModel } from '@/features/sync/viewmodels/use-auth-dialog.viewmodel'
import { AppDialog } from '@/shared/components/app-dialog'
import { plainButtonClass } from '@/shared/components/plain-button'
import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/utils/cn'

export type AuthDialogViewProps = ReturnType<typeof useAuthDialogViewModel>

export function AuthDialogView({
  showTrigger,
  triggerLabel,
  onOpenTrigger,
  open,
  onOpenChange,
  title,
  description,
  signInLabel,
  waitingText,
  retryLabel,
  pending,
  errorText,
  onSignIn,
}: AuthDialogViewProps): ReactElement {
  return (
    <>
      {showTrigger && (
        <Button variant="outline" size="sm" onClick={onOpenTrigger}>
          {triggerLabel}
        </Button>
      )}
      <AppDialog testId="sync-auth-dialog-container" open={open} onOpenChange={onOpenChange} title={title} description={description}>
        <div className="dialog-form">
          {errorText && (
            <p className="dialog-error" role="alert">
              {errorText}
            </p>
          )}
          {pending ? (
            <p className="auth-pending" role="status">
              {waitingText}
            </p>
          ) : (
            <Button type="button" onClick={onSignIn}>
              {signInLabel}
            </Button>
          )}
          {pending && (
            <Button
              variant="ghost"
              className={cn(plainButtonClass, 'dialog-link')}
              type="button"
              data-testid="auth-dialog-retry"
              onClick={onSignIn}
            >
              {retryLabel}
            </Button>
          )}
        </div>
      </AppDialog>
    </>
  )
}
