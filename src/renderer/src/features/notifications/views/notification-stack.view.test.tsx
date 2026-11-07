import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { NotificationStackView } from '@/features/notifications/views/notification-stack.view'

describe('NotificationStackView', () => {
  it('renders nothing when there are no notifications', () => {
    const { container } = render(
      <NotificationStackView
        items={[]}
        dismissLabel="Dismiss"
        laterLabel="Later"
        moreLabel={(count) => `+${count} more`}
        onDismiss={vi.fn()}
      />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('shows the title and dismisses by id', () => {
    const onDismiss = vi.fn()
    render(
      <NotificationStackView
        items={[{ id: 'a', tone: 'info', title: 'Update from your team' }]}
        dismissLabel="Dismiss"
        laterLabel="Later"
        moreLabel={(count) => `+${count} more`}
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
        laterLabel="Later"
        moreLabel={(count) => `+${count} more`}
        onDismiss={onDismiss}
      />,
    )
    fireEvent.click(screen.getByTestId('notifications-action-button'))
    expect(onAction).toHaveBeenCalledTimes(1)
    expect(onDismiss).toHaveBeenCalledWith('u')
  })

  it('shows the body under the title, and Later dismisses without running the action', () => {
    const onAction = vi.fn()
    const onDismiss = vi.fn()
    render(
      <NotificationStackView
        items={[
          { id: 'u', tone: 'action', title: 'Update v0.3.0 is available', body: 'Download it now.', actionLabel: 'Download', onAction },
        ]}
        dismissLabel="Dismiss"
        laterLabel="Later"
        moreLabel={(count) => `+${count} more`}
        onDismiss={onDismiss}
      />,
    )
    expect(screen.getByText('Download it now.')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('notifications-dismiss-later-button'))
    expect(onDismiss).toHaveBeenCalledWith('u')
    expect(onAction).not.toHaveBeenCalled()
  })

  it('has no Later or Download buttons when there is no action', () => {
    render(
      <NotificationStackView
        items={[{ id: 'j', tone: 'info', title: 'Joined' }]}
        dismissLabel="Dismiss"
        laterLabel="Later"
        moreLabel={(count) => `+${count} more`}
        onDismiss={vi.fn()}
      />,
    )
    expect(screen.queryByTestId('notifications-dismiss-later-button')).toBeNull()
    expect(screen.queryByTestId('notifications-action-button')).toBeNull()
  })

  it('lists the changed items with their method, and says how many more there are', () => {
    render(
      <NotificationStackView
        items={[
          {
            id: 'p',
            tone: 'info',
            title: 'Update from your team',
            details: [
              { label: 'POST Create invoice', kind: 'added' },
              { label: 'PATCH Update customer', kind: 'modified' },
            ],
            moreCount: 18,
          },
        ]}
        dismissLabel="Dismiss"
        laterLabel="Later"
        moreLabel={(count) => `+${count} more`}
        onDismiss={vi.fn()}
      />,
    )
    const list = screen.getByTestId('notifications-details')
    expect(list).toHaveTextContent('POST Create invoice')
    expect(list).toHaveTextContent('PATCH Update customer')
    expect(list).toHaveTextContent('+18 more')
  })
})
