import { Bell, CheckCircle2, Info, X } from 'lucide-react'
import type { ReactElement } from 'react'
import type { AppNotification, NotificationTone } from '@/features/notifications/models/notification.model'
import { Alert, AlertDescription, AlertTitle, Button } from '@/shared/ui'

export type NotificationStackViewProps = {
  items: AppNotification[]
  dismissLabel: string
  onDismiss: (id: string) => void
}

const toneIcon: Record<NotificationTone, typeof Info> = { info: Info, success: CheckCircle2, action: Bell }

export function NotificationStackView(props: NotificationStackViewProps): ReactElement | null {
  if (props.items.length === 0) return null
  return (
    <div
      data-testid="notifications-stack"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-3 z-50 flex flex-col items-center gap-2 px-4"
    >
      {props.items.map((item) => {
        const Icon = toneIcon[item.tone]
        return (
          <Alert
            key={item.id}
            data-testid="notifications-item"
            className="pointer-events-auto relative w-full max-w-md bg-card pr-10 shadow-lg animate-in fade-in slide-in-from-top-2"
          >
            <Icon className="size-4" />
            <AlertTitle>{item.title}</AlertTitle>
            {item.body ? <AlertDescription>{item.body}</AlertDescription> : null}
            {item.onAction && item.actionLabel ? (
              <div className="col-start-2 mt-2">
                <Button
                  data-testid="notifications-action-button"
                  type="button"
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
            <Button
              data-testid="notifications-dismiss-button"
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1 size-7"
              aria-label={props.dismissLabel}
              onClick={() => props.onDismiss(item.id)}
            >
              <X className="size-4" />
            </Button>
          </Alert>
        )
      })}
    </div>
  )
}
