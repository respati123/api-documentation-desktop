import type { HTMLAttributes } from 'react'
import { cx } from '../../../lib/cx'
import './Badge.css'

export type BadgeVariant = 'primary' | 'secondary' | 'outline' | 'success' | 'warning' | 'destructive' | 'count'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  /** "chip" is the square form used for an HTTP status. */
  shape?: 'pill' | 'chip'
}

// Badges show a status or count. Use success, warning, and destructive for HTTP and test outcomes.
export function Badge({ variant = 'secondary', shape = 'pill', className, ...rest }: BadgeProps) {
  return <span className={cx('badge', `badge--${variant}`, shape === 'chip' && 'badge--chip', className)} {...rest} />
}
