import type { ReactElement } from 'react'
import { changeStatusCode } from '@/features/sync/lib/change-status'
import type { WorkspaceChange } from '@/lib/workspace-changes'
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
      <button type="button" className="change-name" aria-pressed={selected} onClick={onSelect}>
        {change.name}
      </button>
      <button type="button" className="text-action" onClick={onAction}>
        {actionLabel}
      </button>
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
    <button
      type="button"
      className={cn('history-change-row', selected && 'history-change-row-selected')}
      aria-pressed={selected}
      onClick={onSelect}
    >
      <span className={`change-badge change-${change.status}`}>{changeStatusCode(change.status)}</span>
      <span>{change.name}</span>
      <small>{statusText}</small>
    </button>
  )
}
