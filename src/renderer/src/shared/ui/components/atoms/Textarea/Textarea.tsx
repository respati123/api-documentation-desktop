import type { ComponentProps } from 'react'
import { cx } from '../../../lib/cx'
import './Textarea.css'

// ComponentProps keeps the ref prop, so a ref passed to Textarea reaches the native field.
export interface TextareaProps extends ComponentProps<'textarea'> {
  /** Use for JSON, scripts, and Markdown bodies. */
  mono?: boolean
}

export function Textarea({ mono = false, className, ...rest }: TextareaProps) {
  return <textarea className={cx('textarea', mono && 'textarea--mono', className)} {...rest} />
}
