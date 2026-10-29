import { cn } from '@/lib/utils'

export function StateMessage({ title, description, error = false }: { title: string; description: string; error?: boolean }) {
  return (
    <div className={cn('state-message', error && 'state-error')}>
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  )
}
