import type { MouseEvent, ReactNode } from 'react'
import { Icon } from '../../../icons/Icon'
import { cx } from '../../../lib/cx'
import './TabStripItem.css'

export interface TabStripItemProps {
  /** Shown before the label, such as a MethodTag or an icon. */
  leading?: ReactNode
  label: string
  /** Shown after the label, such as the dot on the active environment. */
  trailing?: ReactNode
  active: boolean
  /** Shows a warn dot while the item has changes that are not saved. */
  dirty?: boolean
  /** Screen reader text for the warn dot. The app passes its own translated text. */
  dirtyLabel?: string
  /** Screen reader text for the close button. Defaults to "Close <label>". */
  closeLabel?: string
  testIds?: { tab?: string; close?: string }
  onSelect: () => void
  onClose: () => void
  onContextMenu?: (event: MouseEvent<HTMLDivElement>) => void
}

export function TabStripItem({
  leading,
  label,
  trailing,
  active,
  dirty = false,
  dirtyLabel = 'Unsaved changes',
  closeLabel,
  testIds,
  onSelect,
  onClose,
  onContextMenu,
}: TabStripItemProps) {
  return (
    <div className={cx('tab-strip-item', active && 'tab-strip-item--active')} onContextMenu={onContextMenu}>
      <button
        type="button"
        role="tab"
        aria-selected={active}
        className="tab-strip-item__select"
        data-testid={testIds?.tab}
        onClick={onSelect}
      >
        {leading}
        <span className="tab-strip-item__label">{label}</span>
        {trailing}
        {dirty && <span className="tab-strip-item__dirty" role="img" aria-label={dirtyLabel} />}
      </button>
      <button
        type="button"
        className="tab-strip-item__close"
        aria-label={closeLabel ?? `Close ${label}`}
        data-testid={testIds?.close}
        onClick={onClose}
      >
        <Icon name="x" size={13} />
      </button>
    </div>
  )
}
