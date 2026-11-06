import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Icon } from '../../../icons/Icon'
import { cx } from '../../../lib/cx'
import './TopBar.css'

// A picker in the top bar, such as the workspace or the environment. It is a button, so a menu can use it as its trigger.
export interface TopBarPickerProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Shows a status dot before the label. */
  dot?: 'on' | 'off'
}

export function TopBarPicker({ dot, className, children, type = 'button', ...rest }: TopBarPickerProps) {
  return (
    <button type={type} className={cx('top-bar__picker', className)} aria-haspopup="menu" {...rest}>
      {dot && <span className={cx('top-bar__dot', dot === 'on' && 'top-bar__dot--on')} aria-hidden="true" />}
      <span className="top-bar__picker-text">{children}</span>
      <Icon name="chevron" size={14} />
    </button>
  )
}

// The sync status button, such as "main, 2 changes". Usually the trigger of a sync menu.
export function TopBarSync({ className, children, type = 'button', ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type={type} className={cx('top-bar__sync', className)} aria-haspopup="menu" {...rest}>
      <Icon name="branch" size={15} />
      <span className="top-bar__sync-text">{children}</span>
    </button>
  )
}

// The round account button. Usually the trigger of an account menu.
export function TopBarAvatar({ className, children, type = 'button', ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type={type} className={cx('top-bar__avatar', className)} aria-haspopup="menu" {...rest}>
      {children}
    </button>
  )
}

export interface TopBarProps {
  /** Shows a menu button that opens the side panel. Only visible on narrow windows. */
  sidebarToggle?: { label: string; expanded: boolean; onToggle: () => void }
  /** The pickers at the left, such as the workspace and the environment. */
  children: ReactNode
  /** The actions at the right, such as sync and the account. */
  actions?: ReactNode
  className?: string
}

// The top bar: pickers at the left, actions at the right. It only lays out its slots.
export function TopBar({ sidebarToggle, children, actions, className }: TopBarProps) {
  return (
    <header className={cx('top-bar', className)}>
      <div className="top-bar__left">
        {sidebarToggle && (
          <button
            type="button"
            className="top-bar__toggle"
            aria-label={sidebarToggle.label}
            aria-expanded={sidebarToggle.expanded}
            onClick={sidebarToggle.onToggle}
          >
            <Icon name="menu" size={16} />
          </button>
        )}
        {children}
      </div>
      <div className="top-bar__right">{actions}</div>
    </header>
  )
}
