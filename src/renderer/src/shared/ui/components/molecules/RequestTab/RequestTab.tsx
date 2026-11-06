import { Button } from '../../atoms/Button/Button'
import { MethodTag, type HttpMethod } from '../../atoms/MethodTag/MethodTag'
import { StatusDot } from '../../atoms/StatusDot/StatusDot'
import './RequestTab.css'

export interface RequestTabProps {
  method: HttpMethod
  name: string
  active: boolean
  dirty?: boolean
  onSelect: () => void
  onClose: () => void
}

export function RequestTab({ method, name, active, dirty = false, onSelect, onClose }: RequestTabProps) {
  return (
    <div className={['request-tab', active && 'request-tab--active'].filter(Boolean).join(' ')}>
      <button type="button" role="tab" className="request-tab__select" aria-selected={active} onClick={onSelect}>
        <MethodTag method={method} />
        <span className="request-tab__name">{name}</span>
        {dirty && <StatusDot tone="warn" label="Unsaved changes" />}
      </button>
      <Button variant="ghost" size="icon" aria-label={`Close ${name}`} onClick={onClose}>
        ×
      </Button>
    </div>
  )
}
