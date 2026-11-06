import { Dialog as DialogPrimitive } from 'radix-ui'
import type { ComponentProps, HTMLAttributes } from 'react'
import { cx } from '../../../lib/cx'
import './Dialog.css'

// Radix handles focus trapping, Escape to close, and returning focus to the trigger.
export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogClose = DialogPrimitive.Close

export function DialogContent({ className, children, ...rest }: ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="dialog__overlay" />
      <DialogPrimitive.Content className={cx('dialog__content', className)} {...rest}>
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

export function DialogHeader({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('dialog__header', className)} {...rest} />
}

export function DialogFooter({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('dialog__footer', className)} {...rest} />
}

export function DialogTitle({ className, ...rest }: ComponentProps<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title className={cx('dialog__title', className)} {...rest} />
}

export function DialogDescription({ className, ...rest }: ComponentProps<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description className={cx('dialog__description', className)} {...rest} />
}
