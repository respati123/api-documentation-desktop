import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NOTIFICATION_TEXT } from '@/features/notifications/constants/notification-text.constants'
import { addNotification, removeNotification } from '@/features/notifications/lib/notification-list'
import type { AppNotification, NotificationTone } from '@/features/notifications/models/notification.model'

export type NotifyInput = Omit<AppNotification, 'id'> & { id?: string }

// Action notifications wait for the user. The rest leave on their own.
const autoDismissMs: Record<NotificationTone, number | null> = { info: 6000, success: 5000, action: null }

// The stack shows the newest notifications at the top of the window. Callers pass an id when the same event can arrive twice.
export function useNotificationsViewModel() {
  const { t } = useTranslation('notifications')
  const [items, setItems] = useState<AppNotification[]>([])
  const timers = useRef(new Map<string, number>())

  function dismiss(id: string) {
    const timer = timers.current.get(id)
    if (timer !== undefined) window.clearTimeout(timer)
    timers.current.delete(id)
    setItems((list) => removeNotification(list, id))
  }

  function notify(input: NotifyInput) {
    const id = input.id ?? crypto.randomUUID()
    const item: AppNotification = { ...input, id }
    const previous = timers.current.get(id)
    if (previous !== undefined) window.clearTimeout(previous)
    setItems((list) => addNotification(list, item))
    const delay = autoDismissMs[item.tone]
    if (delay !== null)
      timers.current.set(
        id,
        window.setTimeout(() => dismiss(id), delay),
      )
  }

  useEffect(() => {
    const active = timers.current
    return () => {
      for (const timer of active.values()) window.clearTimeout(timer)
      active.clear()
    }
  }, [])

  return {
    notify,
    stack: {
      items,
      dismissLabel: t(NOTIFICATION_TEXT.dismiss),
      onDismiss: dismiss,
    },
  }
}
