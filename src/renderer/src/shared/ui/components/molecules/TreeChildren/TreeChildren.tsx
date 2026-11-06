import type { HTMLAttributes } from 'react'
import { cx } from '../../../lib/cx'
import './TreeChildren.css'

// The rows inside an open folder, indented with a guide line on the left.
export function TreeChildren({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('tree-children', className)} {...rest} />
}
