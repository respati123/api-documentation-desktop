export type NotificationTone = 'info' | 'success' | 'action'

export type AppNotification = {
  id: string
  tone: NotificationTone
  title: string
  body?: string
  actionLabel?: string
  onAction?: () => void
}
