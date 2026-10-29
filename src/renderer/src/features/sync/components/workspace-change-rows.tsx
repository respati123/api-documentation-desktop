import { cn } from '@/lib/utils'
import type { WorkspaceChange } from '@/lib/workspace-changes'

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
}) {
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

export function HistoryChangeRow({ change, selected, onSelect }: { change: WorkspaceChange; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      className={cn('history-change-row', selected && 'history-change-row-selected')}
      aria-pressed={selected}
      onClick={onSelect}
    >
      <span className={`change-badge change-${change.status}`}>{changeStatusCode(change.status)}</span>
      <span>{change.name}</span>
      <small>{changeStatusText(change.status)}</small>
    </button>
  )
}

export function changeStatusCode(status?: WorkspaceChange['status']): string {
  return status === 'added' ? 'U' : status === 'deleted' ? 'D' : 'M'
}

export function changeStatusText(status?: WorkspaceChange['status']): string {
  return status === 'added' ? 'Untracked' : status === 'deleted' ? 'Deleted' : 'Modified'
}
