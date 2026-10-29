import type { ComponentProps, ReactElement, RefObject } from 'react'
import { AuthDialog } from '@/features/sync'
import type { useWorkspaceChromeViewModel } from '@/features/workspace/viewmodels/use-workspace-chrome.viewmodel'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'

type ChromeViewModel = ReturnType<typeof useWorkspaceChromeViewModel>

export function WorkspaceTopbarView({
  chrome,
  accountMenuRef,
  auth,
}: {
  chrome: ChromeViewModel
  accountMenuRef: RefObject<HTMLDivElement | null>
  auth: ComponentProps<typeof AuthDialog>
}): ReactElement {
  return (
    <header className="topbar">
      <div className="wordmark">{chrome.wordmark}</div>
      <div className="topbar-actions">
        {chrome.account && (
          <div className="account-menu-wrap" ref={accountMenuRef}>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="account-trigger"
              aria-haspopup="menu"
              aria-expanded={chrome.account.open}
              data-testid="workspace-topbar-account-trigger"
              onClick={chrome.account.toggle}
            >
              <span className="account-avatar-chip" aria-hidden="true">
                {chrome.account.initial}
              </span>
              <span className="signed-in-email">{chrome.account.email}</span>
            </Button>
            {chrome.account.open && (
              <div className="account-menu" role="menu" aria-label={chrome.account.label}>
                {chrome.account.items.map((item) => (
                  <Button
                    key={item.key}
                    type="button"
                    variant="ghost"
                    size="sm"
                    role="menuitem"
                    className="justify-start"
                    data-testid={`workspace-topbar-account-${item.key}`}
                    onClick={item.onSelect}
                  >
                    {item.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}
        {chrome.updateButton && (
          <Button size="sm" data-testid="workspace-topbar-update-button" onClick={chrome.updateButton.onClick}>
            {chrome.updateButton.label}
          </Button>
        )}
        <AuthDialog {...auth} />
      </div>
    </header>
  )
}

export function WorkspaceUpdateDialogView({ dialog }: { dialog: ChromeViewModel['dialog'] }): ReactElement {
  return (
    <Dialog open={dialog.open} onOpenChange={dialog.onOpenChange}>
      <DialogContent data-testid="workspace-update-dialog">
        <DialogHeader>
          <DialogTitle>{dialog.title}</DialogTitle>
          <DialogDescription>{dialog.description}</DialogDescription>
        </DialogHeader>
        {dialog.failed ? (
          <div className="dialog-form">
            <Button type="button" data-testid="workspace-update-close-button" onClick={dialog.onClose}>
              {dialog.closeLabel}
            </Button>
          </div>
        ) : (
          dialog.percent !== null && (
            <div className="dialog-form">
              <div style={{ height: 8, borderRadius: 4, background: 'var(--graphite-line-soft)', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${dialog.percent}%`,
                    height: '100%',
                    background: 'var(--graphite-blue)',
                    transition: 'width 200ms ease',
                  }}
                />
              </div>
              <p>{dialog.percent}%</p>
            </div>
          )
        )}
      </DialogContent>
    </Dialog>
  )
}
