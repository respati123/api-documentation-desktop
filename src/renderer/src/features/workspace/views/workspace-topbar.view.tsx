import type { ComponentProps, ReactElement } from 'react'
import { WorkspaceStorageIcon } from '@/features/collection'
import { AuthDialog, SyncMenuView } from '@/features/sync'
import type { useWorkspaceChromeViewModel } from '@/features/workspace/viewmodels/use-workspace-chrome.viewmodel'
import type { useWorkspaceSidebarViewModel } from '@/features/workspace/viewmodels/use-workspace-sidebar.viewmodel'
import { NO_ENVIRONMENT, type useWorkspaceTabbarViewModel } from '@/features/workspace/viewmodels/use-workspace-tabbar.viewmodel'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  TopBar,
  TopBarAvatar,
  TopBarPicker,
} from '@/shared/ui'

type ChromeViewModel = ReturnType<typeof useWorkspaceChromeViewModel>
type WorkspacePickerViewModel = ReturnType<typeof useWorkspaceSidebarViewModel>['picker']
type EnvironmentViewModel = ReturnType<typeof useWorkspaceTabbarViewModel>['environment']

// The top bar: the workspace and environment pickers at the left, the update button, the account menu, and sign-in at the right.
export function WorkspaceTopbarView({
  chrome,
  syncMenu,
  auth,
  picker,
  environment,
  sidebarToggle,
}: {
  chrome: ChromeViewModel
  syncMenu: ComponentProps<typeof SyncMenuView>
  auth: ComponentProps<typeof AuthDialog>
  picker: WorkspacePickerViewModel
  environment: EnvironmentViewModel
  sidebarToggle: { label: string; expanded: boolean; onToggle: () => void }
}): ReactElement {
  const selectedEnvironment = environment.options.find((option) => option.value === environment.value)
  const selectedWorkspace = picker.selected

  return (
    <TopBar
      sidebarToggle={sidebarToggle}
      actions={
        <>
          <SyncMenuView {...syncMenu} />
          {chrome.updateButton && (
            <Button variant="primary" size="sm" data-testid="workspace-topbar-update-button" onClick={chrome.updateButton.onClick}>
              {chrome.updateButton.label}
            </Button>
          )}
          {chrome.account && (
            <DropdownMenu
              open={chrome.account.open}
              onOpenChange={(open) => {
                if (open !== chrome.account?.open) chrome.account?.toggle()
              }}
            >
              <DropdownMenuTrigger asChild>
                <TopBarAvatar aria-label={chrome.account.label} data-testid="workspace-topbar-account-trigger" title={chrome.account.email}>
                  {chrome.account.initial}
                </TopBarAvatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" aria-label={chrome.account.label}>
                {chrome.account.items.map((item) => (
                  <DropdownMenuItem key={item.key} data-testid={`workspace-topbar-account-${item.key}`} onSelect={item.onSelect}>
                    {item.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <AuthDialog {...auth} />
        </>
      }
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <TopBarPicker aria-label={picker.ariaLabel} data-testid="workspace-topbar-picker">
            {selectedWorkspace ? (
              <span className="flex min-w-0 items-center gap-2">
                <WorkspaceStorageIcon kind={selectedWorkspace.kind} />
                <span className="truncate">{selectedWorkspace.name}</span>
              </span>
            ) : (
              picker.placeholder
            )}
          </TopBarPicker>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {picker.options.map((option) => (
            <DropdownMenuItem
              key={option.id}
              data-testid={`workspace-topbar-picker-option-${option.id}`}
              onSelect={() => picker.onChange(option.id)}
            >
              <span className="flex min-w-0 items-center gap-2">
                <WorkspaceStorageIcon kind={option.kind} />
                <span className="truncate">{option.name}</span>
                <small className="text-[11px] text-muted-foreground">{option.storage}</small>
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <TopBarPicker
            aria-label={environment.ariaLabel}
            dot={environment.value !== NO_ENVIRONMENT ? 'on' : 'off'}
            data-testid="workspace-tabbar-environment-select"
            disabled={environment.disabled}
          >
            {selectedEnvironment?.label ?? environment.placeholder}
          </TopBarPicker>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {environment.options.map((option) => (
            <DropdownMenuItem
              key={option.value}
              data-testid={`workspace-tabbar-environment-option-${option.value}`}
              onSelect={() => environment.onChange(option.value)}
            >
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </TopBar>
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
          <div>
            <Button type="button" data-testid="workspace-update-close-button" onClick={dialog.onClose}>
              {dialog.closeLabel}
            </Button>
          </div>
        ) : (
          dialog.percent !== null && (
            <div className="grid gap-2">
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
