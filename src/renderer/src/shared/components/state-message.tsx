import { cn } from '@/shared/utils/cn'

export function StateMessage({
  title,
  description,
  error = false,
  testId,
}: {
  title: string
  description: string
  error?: boolean
  testId: string
}) {
  return (
    <div className={cn('state-message', error && 'state-error')} data-testid={testId}>
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  )
}
