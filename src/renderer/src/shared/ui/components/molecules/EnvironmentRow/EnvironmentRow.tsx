import type { ReactNode } from 'react'
import { StatusDot } from '../../atoms/StatusDot/StatusDot'
import { cx } from '../../../lib/cx'
import './EnvironmentRow.css'

export interface EnvironmentRowProps {
  name: string
  /** The environment whose variables requests use right now. */
  isActive: boolean
  /** The environment whose tab is open. */
  selected?: boolean
  onSelect: () => void
  /** Shown on the active environment. The app passes its own translated text. */
  activeLabel?: string
  testId?: string
  disabled?: boolean
  /** An action at the row's right edge, such as a menu button. */
  trailing?: ReactNode
}

export function EnvironmentRow({
  name,
  isActive,
  selected = false,
  onSelect,
  activeLabel = 'Active',
  testId,
  disabled = false,
  trailing,
}: EnvironmentRowProps) {
  return (
    <div className={cx('environment-row-wrap', selected && 'environment-row-wrap--selected')}>
      <button
        type="button"
        className="environment-row"
        aria-current={selected ? 'true' : undefined}
        data-testid={testId}
        disabled={disabled}
        onClick={onSelect}
      >
        <StatusDot tone={isActive ? 'ok' : 'neutral'} />
        <span className="environment-row__name">{name}</span>
        {isActive && <span className="environment-row__badge">{activeLabel}</span>}
      </button>
      {trailing}
    </div>
  )
}
