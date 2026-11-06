import { RadioGroup as RadioGroupPrimitive } from 'radix-ui'
import type { ComponentProps } from 'react'
import { cx } from '../../../lib/cx'
import './RadioGroup.css'

export function RadioGroup({ className, ...rest }: ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return <RadioGroupPrimitive.Root className={cx('radio-group', className)} {...rest} />
}

export function RadioGroupItem({ className, ...rest }: ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item className={cx('radio-group__item', className)} {...rest}>
      <RadioGroupPrimitive.Indicator className="radio-group__indicator" />
    </RadioGroupPrimitive.Item>
  )
}
