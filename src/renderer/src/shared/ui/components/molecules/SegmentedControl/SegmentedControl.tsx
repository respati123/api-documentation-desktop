import './SegmentedControl.css'

export interface SegmentedOption {
  value: string
  label: string
}

export interface SegmentedControlProps {
  /** Names the group for screen readers, such as "Body type". */
  label: string
  options: SegmentedOption[]
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  testId?: string
  /** Builds a test id for each option from its value. */
  optionTestId?: (value: string) => string
}

export function SegmentedControl({ label, options, value, onChange, disabled = false, testId, optionTestId }: SegmentedControlProps) {
  return (
    <div className="segmented" role="group" aria-label={label} data-testid={testId}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className="segmented__item"
          aria-pressed={option.value === value}
          disabled={disabled}
          data-testid={optionTestId?.(option.value)}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
