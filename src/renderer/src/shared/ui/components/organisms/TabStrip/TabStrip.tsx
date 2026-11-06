import type { ReactNode } from 'react'
import { Icon } from '../../../icons/Icon'
import './TabStrip.css'

export interface TabStripProps {
  /** The tab items, usually TabStripItem elements. */
  children: ReactNode
  /** Screen reader name for the strip. Defaults to addLabel. */
  label?: string
  /** When set, a button at the end adds a tab. */
  addLabel?: string
  onAdd?: () => void
  addTestId?: string
}

// The strip of open tabs above the work area. Tabs scroll sideways when there are too many.
export function TabStrip({ children, label, addLabel, onAdd, addTestId }: TabStripProps) {
  return (
    <div className="tab-strip" role="tablist" aria-label={label ?? addLabel}>
      {children}
      {onAdd && addLabel && (
        <button type="button" className="tab-strip__add" aria-label={addLabel} data-testid={addTestId} onClick={onAdd}>
          <Icon name="plus" />
        </button>
      )}
    </div>
  )
}
