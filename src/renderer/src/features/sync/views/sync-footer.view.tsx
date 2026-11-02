import type { ReactElement } from 'react'
import { WorkspaceStorageIcon } from '@/features/collection'
import type { SyncMenuItem, useSyncFooterViewModel } from '@/features/sync/viewmodels/use-sync-footer.viewmodel'
import { Button } from '@/shared/components/ui/button'

type SyncFooterViewModel = ReturnType<typeof useSyncFooterViewModel>

function MenuItemButton({ item }: { item: SyncMenuItem }): ReactElement {
  return (
    <Button
      type="button"
      variant="ghost"
      role="menuitem"
      className="h-auto justify-start disabled:opacity-100"
      data-testid={`sync-footer-item-${item.key}`}
      disabled={item.disabled}
      autoFocus={item.autoFocus}
      onClick={item.onSelect}
    >
      <span aria-hidden="true">{item.icon}</span>
      {item.label}
      {item.detail && <small>{item.detail}</small>}
    </Button>
  )
}

function FooterStatus({ lines }: { lines: SyncFooterViewModel['statusLines'] }): ReactElement {
  return (
    <div className="sidebar-footer-status" role="status" aria-live="polite">
      {lines.map((line) => (
        <span key={line.key} className={line.className}>
          {line.text}
        </span>
      ))}
    </div>
  )
}

export function SyncFooterView(props: SyncFooterViewModel): ReactElement {
  const storageKind = props.cloud ? 'cloud' : 'local'
  // Commit, push, pull, history, and discard exist only for cloud workspaces. A local folder shows its status and nothing else.
  if (!props.cloud) {
    return (
      <div className="sidebar-footer">
        <FooterStatus lines={props.statusLines} />
      </div>
    )
  }
  return (
    <div className="sidebar-footer">
      {props.open && (
        <>
          <Button
            type="button"
            variant="ghost"
            className="sidebar-sync-dismiss h-auto min-h-0"
            aria-label={props.closeLabel}
            data-testid="sync-footer-dismiss"
            onMouseDown={props.close}
          />
          <div
            id="sidebar-sync-menu"
            className="sidebar-sync-menu"
            role="menu"
            aria-label={props.menuLabel}
            onKeyDown={props.onMenuKeyDown}
          >
            <div className="sidebar-sync-menu-heading">
              <WorkspaceStorageIcon kind={storageKind} className="sidebar-sync-menu-icon" />
              <div>
                <strong>{props.title}</strong>
                <small>{props.subtitle}</small>
              </div>
            </div>
            <div className="sidebar-sync-menu-divider" />
            {props.localItems.map((item) => (
              <MenuItemButton key={item.key} item={item} />
            ))}
            <div className="sidebar-sync-menu-divider" />
            {props.cloudItems.map((item) => (
              <MenuItemButton key={item.key} item={item} />
            ))}
            {props.pushDisabledReason && (
              <p className="sidebar-sync-hint" role="status">
                {props.pushDisabledReason}
              </p>
            )}
          </div>
        </>
      )}
      <Button
        type="button"
        variant="ghost"
        className="sidebar-sync-trigger min-h-0 focus-visible:ring-0"
        aria-haspopup="menu"
        aria-expanded={props.open}
        aria-controls="sidebar-sync-menu"
        data-testid="sync-footer-trigger"
        disabled={props.trigger.disabled}
        onClick={props.toggle}
      >
        <WorkspaceStorageIcon kind={storageKind} className="sidebar-sync-trigger-icon" />
        <span className="sidebar-sync-trigger-label">{props.triggerLabel}</span>
        {props.trigger.changeCount > 0 && <span className="sidebar-sync-trigger-count">{props.trigger.changeCount}</span>}
        {/* biome-ignore lint/a11y/useAriaPropsSupportedByRole: the label summarizes the children, which stay readable */}
        <span className="sidebar-sync-trigger-meta" aria-label={props.trigger.ariaLabel}>
          {props.trigger.indicators.map((indicator) => (
            <span key={indicator.key} title={indicator.title}>
              {indicator.text}
            </span>
          ))}
        </span>
        <span className="sidebar-sync-trigger-chevron" aria-hidden="true">
          {props.chevron}
        </span>
      </Button>
      <FooterStatus lines={props.statusLines} />
    </div>
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
