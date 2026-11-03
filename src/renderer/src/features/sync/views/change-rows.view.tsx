import type { ReactElement } from 'react'
import { changeStatusCode } from '@/features/sync/lib/change-status'
import type { WorkspaceChange } from '@/lib/workspace-changes'
import { plainButtonClass } from '@/shared/components/plain-button'
import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/utils/cn'

export function ChangeRow({
  change,
  selected,
  onSelect,
  actionLabel,
  onAction,
}: {
  change: WorkspaceChange
  selected: boolean
  onSelect: () => void
  actionLabel: string
  onAction: () => void
}): ReactElement {
  return (
    <div className={cn('change-row', selected && 'change-row-selected')}>
      <span className={`change-badge change-${change.status}`}>{changeStatusCode(change.status)}</span>
      <Button
        type="button"
        variant="ghost"
        className={cn(plainButtonClass, 'change-name')}
        aria-pressed={selected}
        data-testid="commit-dialog-change-select"
        onClick={onSelect}
      >
        {change.name}
      </Button>
      <Button
        type="button"
        variant="ghost"
        className={cn(plainButtonClass, 'text-action')}
        data-testid="commit-dialog-change-action"
        onClick={onAction}
      >
        {actionLabel}
      </Button>
    </div>
  )
}

export function HistoryChangeRow({
  change,
  selected,
  onSelect,
  statusText,
}: {
  change: WorkspaceChange
  selected: boolean
  onSelect: () => void
  statusText: string
}): ReactElement {
  return (
    <Button
      type="button"
      variant="ghost"
      className={cn(plainButtonClass, 'history-change-row', selected && 'history-change-row-selected')}
      data-testid="commit-dialog-history-change"
      aria-pressed={selected}
      onClick={onSelect}
    >
      <span className={`change-badge change-${change.status}`}>{changeStatusCode(change.status)}</span>
      <span>{change.name}</span>
      <small>{statusText}</small>
    </Button>
  )
}
