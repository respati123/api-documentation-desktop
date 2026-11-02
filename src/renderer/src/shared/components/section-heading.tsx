import type { ReactNode } from 'react'

// A heading with a bold title, a short description, and an optional action on the right.
export function SectionHeading({
  className,
  title,
  description,
  action,
}: {
  className: string
  title: ReactNode
  description: ReactNode
  action?: ReactNode
}) {
  return (
    <div className={className}>
      <div>
        <strong>{title}</strong>
        <span>{description}</span>
      </div>
      {action}
    </div>
  )
}
