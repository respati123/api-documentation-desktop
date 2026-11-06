import type { ReactNode } from 'react'
import { Icon } from '../../../icons/Icon'
import './SidePanel.css'

export interface SidePanelFilter {
  value: string
  onChange: (value: string) => void
  placeholder: string
  label: string
  /** Shown at the right edge of the field, for example "Ctrl K". */
  shortcut?: string
  /** Lets a shortcut focus the field. */
  inputId?: string
  testId?: string
}

export interface SidePanelProps {
  title: string
  /** Icon buttons at the right of the title, such as Add and More. */
  actions?: ReactNode
  filter?: SidePanelFilter
  children: ReactNode
}

export function SidePanel({ title, actions, filter, children }: SidePanelProps) {
  return (
    <aside className="side-panel" aria-label={title}>
      <div className="side-panel__head">
        <h1 className="side-panel__title">{title}</h1>
        {actions}
      </div>
      {filter && (
        <div className="side-panel__filter">
          <Icon name="search" size={14} />
          <input
            id={filter.inputId}
            data-testid={filter.testId}
            type="search"
            className="side-panel__filter-input"
            aria-label={filter.label}
            placeholder={filter.placeholder}
            value={filter.value}
            autoComplete="off"
            onChange={(event) => filter.onChange(event.target.value)}
          />
          {filter.shortcut && <kbd className="side-panel__shortcut">{filter.shortcut}</kbd>}
        </div>
      )}
      <div className="side-panel__body">{children}</div>
    </aside>
  )
}
