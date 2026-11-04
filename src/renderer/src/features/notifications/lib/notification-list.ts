import type { AppNotification } from '@/features/notifications/models/notification.model'

export const maxVisibleNotifications = 3

// The newest notification goes first. An id that is already shown moves to the top instead of appearing twice.
export function addNotification(list: AppNotification[], next: AppNotification): AppNotification[] {
  return [next, ...list.filter((item) => item.id !== next.id)].slice(0, maxVisibleNotifications)
}

export function removeNotification(list: AppNotification[], id: string): AppNotification[] {
  return list.filter((item) => item.id !== id)
}
