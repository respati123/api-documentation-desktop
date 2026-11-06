import { Select as SelectPrimitive } from 'radix-ui'
import type { ComponentProps } from 'react'
import { cx } from '../../../lib/cx'
import './Select.css'

export const Select = SelectPrimitive.Root
export const SelectValue = SelectPrimitive.Value

export function SelectTrigger({ className, children, ...rest }: ComponentProps<typeof SelectPrimitive.Trigger>) {
  return (
    <SelectPrimitive.Trigger className={cx('select__trigger', className)} {...rest}>
      {children}
      <SelectPrimitive.Icon className="select__chevron" aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="m4 6 4 4 4-4" />
        </svg>
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

export function SelectContent({ className, children, position = 'popper', ...rest }: ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        position={position}
        sideOffset={6}
        collisionPadding={8}
        className={cx('select__content', className)}
        {...rest}
      >
        <SelectPrimitive.Viewport className="select__viewport">{children}</SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

export function SelectItem({ className, children, ...rest }: ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item className={cx('select__item', className)} {...rest}>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="select__indicator" aria-hidden="true">
        ✓
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  )
}

// Radix requires a label to sit inside a group, so wrap the label and the items it names in SelectGroup.
export const SelectGroup = SelectPrimitive.Group

export function SelectLabel({ className, ...rest }: ComponentProps<typeof SelectPrimitive.Label>) {
  return <SelectPrimitive.Label className={cx('select__label', className)} {...rest} />
}

export function SelectSeparator({ className, ...rest }: ComponentProps<typeof SelectPrimitive.Separator>) {
  return <SelectPrimitive.Separator className={cx('select__separator', className)} {...rest} />
}
