import type { ComponentProps, ReactElement, RefObject } from 'react'
import { WorkspaceStorageIcon } from '@/features/collection'
import { AuthDialog } from '@/features/sync'
import type { useWorkspaceChromeViewModel } from '@/features/workspace/viewmodels/use-workspace-chrome.viewmodel'
import type { useWorkspaceSidebarViewModel } from '@/features/workspace/viewmodels/use-workspace-sidebar.viewmodel'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'

type ChromeViewModel = ReturnType<typeof useWorkspaceChromeViewModel>
type WorkspacePickerViewModel = ReturnType<typeof useWorkspaceSidebarViewModel>['picker']

export function WorkspaceTopbarView({
  chrome,
  accountMenuRef,
  auth,
  picker,
}: {
  chrome: ChromeViewModel
  accountMenuRef: RefObject<HTMLDivElement | null>
  auth: ComponentProps<typeof AuthDialog>
  picker: WorkspacePickerViewModel
}): ReactElement {
  return (
    <header className="col-span-full flex min-w-0 items-center justify-between bg-chrome px-6 [-webkit-app-region:drag] max-[720px]:sticky max-[720px]:top-0 max-[720px]:z-20 max-[720px]:min-h-[58px] max-[720px]:px-4">
      <div className="flex min-w-0 items-center gap-4">
        <div className="text-[16px] font-bold tracking-[-0.02em] text-chrome-foreground">{chrome.wordmark}</div>
        <div className="min-w-0 [-webkit-app-region:no-drag]">
          <Select value={picker.value} onValueChange={picker.onChange}>
            <SelectTrigger
              aria-label={picker.ariaLabel}
              className="h-[32px] min-h-[32px] w-[220px] rounded-md border-transparent bg-chrome-field text-[13px] font-medium text-chrome-foreground hover:bg-chrome-field/80 focus-visible:ring-0 max-[720px]:w-[160px]"
              data-testid="workspace-topbar-picker"
            >
              <SelectValue placeholder={picker.placeholder}>
                {picker.selected && (
                  <span className="flex min-w-0 items-center gap-2">
                    <WorkspaceStorageIcon kind={picker.selected.kind} />
                    <span className="truncate">{picker.selected.name}</span>
                  </span>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {picker.options.map((option) => (
                <SelectItem key={option.id} value={option.id} textValue={option.textValue}>
                  <span className="flex min-w-0 items-center gap-2">
                    <WorkspaceStorageIcon kind={option.kind} />
                    <span className="truncate">{option.name}</span>
                    <small className="text-[11px] text-muted-foreground">{option.storage}</small>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex min-w-0 items-center gap-2 [-webkit-app-region:no-drag] max-[720px]:max-w-[calc(100vw-150px)] max-[720px]:overflow-x-auto max-[720px]:[scrollbar-width:thin]">
        {chrome.account && (
          <div className="relative" ref={accountMenuRef}>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-2 text-chrome-foreground hover:bg-chrome-field hover:text-chrome-foreground"
              aria-haspopup="menu"
              aria-expanded={chrome.account.open}
              data-testid="workspace-topbar-account-trigger"
              onClick={chrome.account.toggle}
            >
              <span
                className="flex size-[22px] items-center justify-center rounded-full bg-chrome-field text-[11px] font-bold"
                aria-hidden="true"
              >
                {chrome.account.initial}
              </span>
              <span className="max-w-[180px] truncate text-[12px] text-chrome-muted">{chrome.account.email}</span>
            </Button>
            {chrome.account.open && (
              <div
                className="absolute right-0 top-full z-50 mt-2 grid min-w-[200px] gap-0 rounded-md border border-border bg-popover p-2 shadow-md"
                role="menu"
                aria-label={chrome.account.label}
              >
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
              <div className="h-[8px] overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-primary transition-[width] duration-200" style={{ width: `${dialog.percent}%` }} />
              </div>
              <p>{dialog.percent}%</p>
            </div>
          )
        )}
      </DialogContent>
    </Dialog>
  )
}
