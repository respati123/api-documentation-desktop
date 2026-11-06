import { cx } from '../../../lib/cx'
import { Badge, type BadgeVariant } from '../../atoms/Badge/Badge'
import './CommitRow.css'

/** Where a commit lives: only on this device, on the cloud, or already pushed from this device. */
export type CommitTone = 'local' | 'cloud' | 'pushed'

const badgeVariant: Record<CommitTone, BadgeVariant> = {
  local: 'warning',
  cloud: 'outline',
  pushed: 'success',
}

export interface CommitRowProps {
  /** The commit message. A long one is cut with an ellipsis, and the full text is the tooltip. */
  message: string
  /** The date, already formatted for the user's locale. */
  date: string
  /** The state text, such as "Local". The app passes its own translated text. */
  stateLabel: string
  tone: CommitTone
  selected?: boolean
  onSelect: () => void
  testId?: string
}

// One commit in the history list. The row grows with its content, so a long message or a larger font never overlaps the next row.
export function CommitRow({ message, date, stateLabel, tone, selected = false, onSelect, testId }: CommitRowProps) {
  return (
    <button
      type="button"
      className={cx('commit-row', selected && 'commit-row--selected')}
      aria-pressed={selected}
      data-testid={testId}
      onClick={onSelect}
    >
      <span className="commit-row__message" title={message}>
        {message}
      </span>
      <span className="commit-row__meta">
        <Badge variant={badgeVariant[tone]}>{stateLabel}</Badge>
        <time className="commit-row__date">{date}</time>
      </span>
    </button>
  )
}
