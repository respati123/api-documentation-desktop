import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { NotificationStackView } from '@/features/notifications/views/notification-stack.view'

describe('NotificationStackView', () => {
  it('renders nothing when there are no notifications', () => {
    const { container } = render(<NotificationStackView items={[]} dismissLabel="Dismiss" onDismiss={vi.fn()} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows the title and dismisses by id', () => {
    const onDismiss = vi.fn()
    render(
      <NotificationStackView
        items={[{ id: 'a', tone: 'info', title: 'Update from your team' }]}
        dismissLabel="Dismiss"
        onDismiss={onDismiss}
      />,
    )
    expect(screen.getByText('Update from your team')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('notifications-dismiss-button'))
    expect(onDismiss).toHaveBeenCalledWith('a')
  })

  it('runs the action, then dismisses the notification', () => {
    const onAction = vi.fn()
    const onDismiss = vi.fn()
    render(
      <NotificationStackView
        items={[{ id: 'u', tone: 'action', title: 'Update ready', actionLabel: 'Download', onAction }]}
        dismissLabel="Dismiss"
        onDismiss={onDismiss}
      />,
    )
    fireEvent.click(screen.getByTestId('notifications-action-button'))
    expect(onAction).toHaveBeenCalledTimes(1)
    expect(onDismiss).toHaveBeenCalledWith('u')
  })
})
