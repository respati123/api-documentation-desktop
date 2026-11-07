import { Bell, CheckCircle2, Info, X } from 'lucide-react'
import type { ReactElement } from 'react'
import type { AppNotification, NotificationTone } from '@/features/notifications/models/notification.model'
import { Button, Card, CardDescription, CardTitle } from '@/shared/ui'
import { cn } from '@/shared/utils/cn'

export type NotificationStackViewProps = {
  items: AppNotification[]
  dismissLabel: string
  laterLabel: string
  onDismiss: (id: string) => void
}

const toneIcon: Record<NotificationTone, typeof Info> = { info: Info, success: CheckCircle2, action: Bell }
const toneTile: Record<NotificationTone, string> = {
  info: 'bg-muted text-muted-foreground',
  success: 'bg-ok/15 text-ok',
  action: 'bg-primary/15 text-primary',
}

// Stacked in the bottom-right corner, so the tab bar and the Send button stay clear.
export function NotificationStackView(props: NotificationStackViewProps): ReactElement | null {
  if (props.items.length === 0) return null
  return (
    <div
      data-testid="notifications-stack"
      aria-live="polite"
      className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-[min(360px,calc(100vw-32px))] flex-col items-stretch gap-2"
    >
      {props.items.map((item) => {
        const Icon = toneIcon[item.tone]
        const hasAction = Boolean(item.onAction && item.actionLabel)
        return (
          <Card
            key={item.id}
            data-testid="notifications-item"
            className="pointer-events-auto relative gap-0 bg-card p-4 pr-10 shadow-lg animate-in fade-in slide-in-from-bottom-2"
          >
            <div className="flex items-start gap-3">
              <span className={cn('grid size-8 flex-none place-items-center rounded-md', toneTile[item.tone])} aria-hidden="true">
                <Icon className="size-4" />
              </span>
              <div className="flex min-w-0 flex-col gap-1">
                <CardTitle>{item.title}</CardTitle>
                {item.body ? <CardDescription>{item.body}</CardDescription> : null}
              </div>
            </div>
            {hasAction ? (
              <div className="mt-3 flex justify-end gap-2">
                <Button
                  data-testid="notifications-dismiss-later-button"
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => props.onDismiss(item.id)}
                >
                  {props.laterLabel}
                </Button>
                <Button
                  data-testid="notifications-action-button"
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    item.onAction?.()
                    props.onDismiss(item.id)
                  }}
                >
                  {item.actionLabel}
                </Button>
              </div>
            ) : null}
            {/* The wrapper places the button: the library's button sets its own position, which would win over an absolute class. */}
            <div className="absolute top-2 right-2">
              <Button
                data-testid="notifications-dismiss-button"
                type="button"
                variant="ghost"
                size="icon"
                className="size-7"
                aria-label={props.dismissLabel}
                onClick={() => props.onDismiss(item.id)}
              >
                <X className="size-4" />
              </Button>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
