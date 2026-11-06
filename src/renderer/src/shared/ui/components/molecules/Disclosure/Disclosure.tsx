import type { DetailsHTMLAttributes, ReactNode } from 'react'
import { cx } from '../../../lib/cx'
import './Disclosure.css'

export interface DisclosureProps extends DetailsHTMLAttributes<HTMLDetailsElement> {
  /** The always visible line that opens and closes the content. */
  summary: ReactNode
  children: ReactNode
}

export function Disclosure({ summary, children, className, ...rest }: DisclosureProps) {
  return (
    <details className={cx('disclosure', className)} {...rest}>
      <summary className="disclosure__summary">{summary}</summary>
      <div className="disclosure__content">{children}</div>
    </details>
  )
}
