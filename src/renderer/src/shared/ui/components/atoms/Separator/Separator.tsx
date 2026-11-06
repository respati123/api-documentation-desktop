import { Separator as SeparatorPrimitive } from 'radix-ui'
import type { ComponentProps } from 'react'
import { cx } from '../../../lib/cx'
import './Separator.css'

export type SeparatorProps = ComponentProps<typeof SeparatorPrimitive.Root>

export function Separator({ className, orientation = 'horizontal', decorative = true, ...rest }: SeparatorProps) {
  return (
    <SeparatorPrimitive.Root
      orientation={orientation}
      decorative={decorative}
      className={cx('separator', `separator--${orientation}`, className)}
      {...rest}
    />
  )
}
