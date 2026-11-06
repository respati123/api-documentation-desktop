import { Button } from '../../atoms/Button/Button'
import { Checkbox } from '../../atoms/Checkbox/Checkbox'
import { Input } from '../../atoms/Input/Input'
import './KeyValueRow.css'

export interface KeyValueRowProps {
  enabled: boolean
  name: string
  value: string
  /** Names the row for screen readers, such as "Parameter" or "Header". */
  kind: string
  /** Shows the value as a password field. The stored value never appears as plain text. */
  secret?: boolean
  onChange: (patch: { enabled?: boolean; name?: string; value?: string }) => void
  onRemove: () => void
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.5h5.8l.6-8.5" />
    </svg>
  )
}

export function KeyValueRow({ enabled, name, value, kind, secret = false, onChange, onRemove }: KeyValueRowProps) {
  const label = name || 'row'
  return (
    <div className="kv-row">
      <Checkbox aria-label={`Enable ${label}`} checked={enabled} onChange={(e) => onChange({ enabled: e.target.checked })} />
      <Input
        aria-label={`${kind} name`}
        mono
        value={name}
        disabled={!enabled}
        onChange={(e) => onChange({ name: e.target.value })}
      />
      <Input
        aria-label={`${kind} value`}
        mono
        type={secret ? 'password' : 'text'}
        value={value}
        disabled={!enabled}
        onChange={(e) => onChange({ value: e.target.value })}
      />
      <Button variant="ghost" size="icon" aria-label={`Remove ${label}`} onClick={onRemove}>
        <TrashIcon />
      </Button>
    </div>
  )
}
