import type { ReactNode } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'

// The standard dialog frame: optional eyebrow, a title, an optional description, and the body.
export function AppDialog({
  open,
  onOpenChange,
  eyebrow,
  title,
  description,
  className,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  eyebrow?: ReactNode
  title: ReactNode
  description?: ReactNode
  className?: string
  children: ReactNode
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={className}>
        <DialogHeader>
          {eyebrow}
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  )
}
