import { Label as LabelPrimitive } from 'radix-ui'
import type { ComponentProps } from 'react'
import { cx } from '../../../lib/cx'
import './Label.css'

export type LabelProps = ComponentProps<typeof LabelPrimitive.Root>

// Radix Label links the text to its control, so clicking the label focuses the field.
export function Label({ className, ...rest }: LabelProps) {
  return <LabelPrimitive.Root className={cx('label', className)} {...rest} />
}
