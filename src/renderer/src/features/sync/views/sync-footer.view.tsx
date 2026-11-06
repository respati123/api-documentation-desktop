import type { ReactElement } from 'react'
import type { SyncMenuItem, useSyncFooterViewModel } from '@/features/sync/viewmodels/use-sync-footer.viewmodel'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
  TopBarSync,
} from '@/shared/ui'

type SyncMenuViewModel = ReturnType<typeof useSyncFooterViewModel>

function MenuItem({ item }: { item: SyncMenuItem }): ReactElement {
  return (
    <DropdownMenuItem data-testid={`sync-footer-item-${item.key}`} disabled={item.disabled} onSelect={item.onSelect}>
      {item.label}
      {item.detail && <DropdownMenuShortcut>{item.detail}</DropdownMenuShortcut>}
    </DropdownMenuItem>
  )
}

// The sync status in the top bar. Commit, push, pull, history, and discard exist only for cloud workspaces, so a local folder shows its status and no menu.
export function SyncMenuView(props: SyncMenuViewModel): ReactElement {
  if (!props.cloud) {
    return (
      <TopBarSync disabled aria-haspopup={false} aria-label={props.summary} data-testid="sync-footer-status">
        {props.summary}
      </TopBarSync>
    )
  }
  return (
    <DropdownMenu
      open={props.open}
      onOpenChange={(open) => {
        if (open !== props.open) props.toggle()
      }}
    >
      <DropdownMenuTrigger asChild>
        <TopBarSync aria-label={props.summary} disabled={props.trigger.disabled} data-testid="sync-footer-trigger">
          {props.summary}
        </TopBarSync>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" aria-label={props.menuLabel}>
        <DropdownMenuLabel>{props.title}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {props.localItems.map((item) => (
          <MenuItem key={item.key} item={item} />
        ))}
        <DropdownMenuSeparator />
        {props.cloudItems.map((item) => (
          <MenuItem key={item.key} item={item} />
        ))}
        {props.pushDisabledReason && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>{props.pushDisabledReason}</DropdownMenuLabel>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function SyncToastView({ message }: { message: string }): ReactElement | null {
  if (!message) return null
  return (
    <div className="sync-toast" role="status">
      {message}
    </div>
  )
}
