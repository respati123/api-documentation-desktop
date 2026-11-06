import type { ComponentProps } from 'react'
import './Input.css'

// ComponentProps keeps the ref prop, so a ref passed to Input reaches the native field.
export interface InputProps extends ComponentProps<'input'> {
  /** Use for values such as URLs, header values, and variable values. */
  mono?: boolean
  /** "title" reads as text until it is hovered or focused, such as the request name. */
  appearance?: 'field' | 'title'
}

export function Input({ mono = false, appearance = 'field', className, ...rest }: InputProps) {
  const classes = ['input', mono && 'input--mono', appearance === 'title' && 'input--title', className].filter(Boolean).join(' ')
  return <input className={classes} {...rest} />
}
