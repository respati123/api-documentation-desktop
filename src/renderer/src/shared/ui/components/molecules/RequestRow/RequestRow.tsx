import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react'
import { cx } from '../../../lib/cx'
import { MethodTag, type HttpMethod } from '../../atoms/MethodTag/MethodTag'
import { StatusDot } from '../../atoms/StatusDot/StatusDot'
import './RequestRow.css'

export interface RequestRowProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  method: HttpMethod
  name: string
  active?: boolean
  /** Status of the last send. Hidden when the request has not been sent. */
  lastStatus?: 'ok' | 'error'
  /** Labels for the status dots. The app passes its own translated text. */
  statusLabels?: { ok: string; error: string; unsaved: string }
  dirty?: boolean
  /** A second line under the name, such as the path or the last status. */
  detail?: string
  /** Nesting level. Each level indents the row by 16px. */
  depth?: number
  onSelect: () => void
  /** Actions at the row's right edge, such as a menu button. They sit outside the select button. */
  trailing?: ReactNode
  /** Shown after the trailing actions, such as a change marker. */
  badge?: ReactNode
}

export function RequestRow({
  method,
  name,
  active = false,
  lastStatus,
  statusLabels = { ok: 'Last send succeeded', error: 'Last send failed', unsaved: 'Unsaved changes' },
  dirty = false,
  detail,
  depth = 0,
  onSelect,
  trailing,
  badge,
  className,
  style,
  ...rest
}: RequestRowProps) {
  return (
    <div className="request-row-wrap" style={{ '--tree-depth': depth, ...style } as CSSProperties}>
      <button
        type="button"
        className={cx('request-row', active && 'request-row--active', detail !== undefined && 'request-row--detail', className)}
        aria-current={active ? 'true' : undefined}
        {...rest}
        onClick={onSelect}
      >
        <MethodTag method={method} />
        {detail !== undefined ? (
          <span className="request-row__text">
            <span className="request-row__name">{name}</span>
            <span className="request-row__detail">{detail}</span>
          </span>
        ) : (
          <span className="request-row__name">{name}</span>
        )}
        {dirty ? (
          <StatusDot tone="warn" label={statusLabels.unsaved} />
        ) : lastStatus ? (
          <StatusDot tone={lastStatus} label={lastStatus === 'ok' ? statusLabels.ok : statusLabels.error} />
        ) : null}
      </button>
      {trailing}
      {badge}
    </div>
  )
}
