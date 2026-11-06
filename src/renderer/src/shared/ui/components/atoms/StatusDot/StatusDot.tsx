import './StatusDot.css'

export type DotTone = 'ok' | 'error' | 'warn' | 'active' | 'accent' | 'neutral'

export interface StatusDotProps {
  tone?: DotTone
  /** Set when the dot carries meaning on its own, such as "Unsaved changes". Otherwise it is hidden from screen readers. */
  label?: string
}

export function StatusDot({ tone = 'neutral', label }: StatusDotProps) {
  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true }
  return <span className={`status-dot status-dot--${tone}`} {...a11y} />
}
