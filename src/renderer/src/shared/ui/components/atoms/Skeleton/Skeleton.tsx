import type { HTMLAttributes } from 'react'
import { cx } from '../../../lib/cx'
import './Skeleton.css'

// Shown while data loads. Decorative, so it is hidden from screen readers; pair it with a visible loading label.
export function Skeleton({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden="true" className={cx('skeleton', className)} {...rest} />
}
