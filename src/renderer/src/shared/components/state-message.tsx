import { cn } from '@/shared/utils/cn'

export function StateMessage({ title, description, error = false }: { title: string; description: string; error?: boolean }) {
  return (
    <div className={cn('state-message', error && 'state-error')}>
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  )
}
