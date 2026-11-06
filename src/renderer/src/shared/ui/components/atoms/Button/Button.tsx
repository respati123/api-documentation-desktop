import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react'
import { cx } from '../../../lib/cx'
import './Button.css'

// Variants describe how important an action is. Size is separate, so an icon button is size="icon", not a variant.
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'link' | 'send'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Shows a spinner in place of the content. The label stays in the layout, so the button keeps its width. */
  loading?: boolean
  children?: ReactNode
}

// Joins buttons into one control, such as Send and its options. The second button is the narrow one.
export function ButtonGroup({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('btn-group', className)} {...rest} />
}

export function Button({
  variant = 'secondary',
  size = 'md',
  loading = false,
  disabled,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  const classes = cx('btn', `btn--${variant}`, `btn--${size}`, loading && 'btn--loading', className)
  return (
    <button type={type} className={classes} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {loading && <span className="btn__spinner" aria-hidden="true" />}
      <span className="btn__label">{children}</span>
    </button>
  )
}
