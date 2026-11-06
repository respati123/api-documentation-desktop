import { DropdownMenu as DropdownMenuPrimitive } from 'radix-ui'
import type { ComponentProps, HTMLAttributes } from 'react'
import { cx } from '../../../lib/cx'
import './DropdownMenu.css'

export const DropdownMenu = DropdownMenuPrimitive.Root
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger

export function DropdownMenuContent({ className, sideOffset = 6, ...rest }: ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        sideOffset={sideOffset}
        collisionPadding={8}
        className={cx('dropdown-menu', className)}
        {...rest}
      />
    </DropdownMenuPrimitive.Portal>
  )
}

export function DropdownMenuItem({
  className,
  variant = 'default',
  ...rest
}: ComponentProps<typeof DropdownMenuPrimitive.Item> & { variant?: 'default' | 'destructive' }) {
  return (
    <DropdownMenuPrimitive.Item
      className={cx('dropdown-menu__item', variant === 'destructive' && 'dropdown-menu__item--destructive', className)}
      {...rest}
    />
  )
}

// An item that toggles a setting. The check mark shows when it is on.
export function DropdownMenuCheckboxItem({ className, children, ...rest }: ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>) {
  return (
    <DropdownMenuPrimitive.CheckboxItem className={cx('dropdown-menu__item', 'dropdown-menu__item--checkbox', className)} {...rest}>
      <span className="dropdown-menu__check" aria-hidden="true">
        <DropdownMenuPrimitive.ItemIndicator>✓</DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  )
}

export function DropdownMenuLabel({ className, ...rest }: ComponentProps<typeof DropdownMenuPrimitive.Label>) {
  return <DropdownMenuPrimitive.Label className={cx('dropdown-menu__label', className)} {...rest} />
}

export function DropdownMenuSeparator({ className, ...rest }: ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  return <DropdownMenuPrimitive.Separator className={cx('dropdown-menu__separator', className)} {...rest} />
}

export function DropdownMenuShortcut({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cx('dropdown-menu__shortcut', className)} {...rest} />
}
