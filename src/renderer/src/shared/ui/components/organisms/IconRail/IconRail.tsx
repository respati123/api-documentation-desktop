import { Icon, type IconName } from '../../../icons/Icon'
import './IconRail.css'

export interface IconRailItem {
  key: string
  label: string
  icon: IconName
  /** Panels stay pressed while open. Actions such as Sync and AI Connect never stay pressed. */
  pressed?: boolean
  disabled?: boolean
  testId?: string
  onSelect: () => void
}

export interface IconRailProps {
  /** Accessible name for the app, shown on the logo. */
  appName: string
  items: IconRailItem[]
}

export function IconRail({ appName, items }: IconRailProps) {
  return (
    <nav className="icon-rail" aria-label={appName}>
      <div className="icon-rail__logo" role="img" aria-label={appName}>
        <Icon name="mark" size={22} />
      </div>
      <div className="icon-rail__separator" aria-hidden="true" />
      <div className="icon-rail__items">
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            className="icon-rail__button"
            title={item.label}
            aria-label={item.label}
            aria-pressed={item.pressed ?? undefined}
            disabled={item.disabled}
            data-testid={item.testId}
            onClick={item.onSelect}
          >
            <Icon name={item.icon} size={20} />
          </button>
        ))}
      </div>
    </nav>
  )
}
