import { cx } from '../../../lib/cx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../Select/Select'
import './MethodSelect.css'

export interface MethodSelectProps {
  value: string
  methods: readonly string[]
  /** Names the control for screen readers. */
  label: string
  disabled?: boolean
  testId?: string
  onChange: (method: string) => void
}

const color = (method: string) => `method-select__value--${method.toLowerCase()}`

// The HTTP method control in the request bar. The selected method shows in its own color.
export function MethodSelect({ value, methods, label, disabled, testId, onChange }: MethodSelectProps) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className={cx('method-select', color(value))} aria-label={label} data-testid={testId}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {methods.map((method) => (
          <SelectItem key={method} value={method} className={cx('method-select__item', color(method))}>
            {method}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
