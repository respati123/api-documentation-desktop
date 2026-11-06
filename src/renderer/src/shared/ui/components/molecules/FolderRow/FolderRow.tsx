import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react'
import { cx } from '../../../lib/cx'
import './FolderRow.css'

export interface FolderRowProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  name: string
  count: number
  expanded: boolean
  /** True when a request inside this folder is open. Colors the folder icon. */
  containsActive?: boolean
  /** Nesting level. Each level indents the row by 16px. */
  depth?: number
  onToggle: () => void
  /** Actions at the row's right edge, such as Add and More. They sit outside the toggle button. */
  trailing?: ReactNode
  /** Shown after the trailing actions, such as a change marker. */
  badge?: ReactNode
}

function Chevron() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m4 6 4 4 4-4" />
    </svg>
  )
}

function FolderIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 4.5c0-.6.4-1 1-1h3l1.5 1.7H13c.6 0 1 .4 1 1v6.3c0 .6-.4 1-1 1H3c-.6 0-1-.4-1-1z" />
    </svg>
  )
}

export function FolderRow({
  name,
  count,
  expanded,
  containsActive = false,
  depth = 0,
  onToggle,
  trailing,
  badge,
  className,
  style,
  ...rest
}: FolderRowProps) {
  return (
    <div className="folder-row-wrap" style={{ '--tree-depth': depth, ...style } as CSSProperties}>
      <button
        type="button"
        className={cx('folder-row', containsActive && 'folder-row--active', className)}
        aria-expanded={expanded}
        {...rest}
        onClick={onToggle}
      >
        <span className={cx('folder-row__chevron', !expanded && 'folder-row__chevron--closed')}>
          <Chevron />
        </span>
        <span className="folder-row__icon">
          <FolderIcon />
        </span>
        <span className="folder-row__name">{name}</span>
        <span className="folder-row__count">{count}</span>
      </button>
      {trailing}
      {badge}
    </div>
  )
}
