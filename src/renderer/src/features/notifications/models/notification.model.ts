export type NotificationTone = 'info' | 'success' | 'action'

// One changed item in a notification, such as "POST Create invoice".
export type NotificationDetail = { label: string; kind: 'added' | 'modified' | 'deleted' }

export type AppNotification = {
  id: string
  tone: NotificationTone
  title: string
  body?: string
  actionLabel?: string
  onAction?: () => void
  // Overrides the tone's delay. null keeps the notification until the user dismisses it.
  autoDismissMs?: number | null
  details?: NotificationDetail[]
  // Changed items not listed in details.
  moreCount?: number
}
