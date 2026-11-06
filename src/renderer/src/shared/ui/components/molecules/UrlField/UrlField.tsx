import type { ReactNode } from 'react'
import './UrlField.css'

export interface UrlFieldProps {
  value: string
  onChange: (value: string) => void
  /** Names the field for screen readers, such as "Request URL". */
  label: string
  placeholder?: string
}

const VARIABLE = /(\{\{[^{}]*\}\})/g

// Splits the text so each {{variable}} gets its own highlighted span. The mirror is text only, never HTML.
function highlight(text: string): ReactNode[] {
  return text.split(VARIABLE).map((part, index) =>
    VARIABLE.test(part) ? (
      <span key={index} className="url-field__variable">{part}</span>
    ) : (
      <span key={index}>{part}</span>
    ),
  )
}

export function UrlField({ value, onChange, label, placeholder }: UrlFieldProps) {
  return (
    <div className="url-field">
      <div className="url-field__mirror" aria-hidden="true">
        {value ? highlight(value) : <span className="url-field__placeholder">{placeholder}</span>}
      </div>
      <input
        className="url-field__input"
        aria-label={label}
        spellCheck={false}
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
