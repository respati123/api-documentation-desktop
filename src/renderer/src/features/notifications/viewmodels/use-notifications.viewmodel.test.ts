import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useNotificationsViewModel } from '@/features/notifications/viewmodels/use-notifications.viewmodel'

describe('useNotificationsViewModel', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('removes an info notification after its delay', () => {
    const { result } = renderHook(() => useNotificationsViewModel())
    act(() => result.current.notify({ id: 'a', tone: 'info', title: 'Joined' }))
    expect(result.current.stack.items).toHaveLength(1)
    act(() => vi.advanceTimersByTime(6000))
    expect(result.current.stack.items).toHaveLength(0)
  })

  it('keeps an action notification until the user dismisses it', () => {
    const { result } = renderHook(() => useNotificationsViewModel())
    act(() => result.current.notify({ id: 'u', tone: 'action', title: 'Update from your team' }))
    act(() => vi.advanceTimersByTime(60_000))
    expect(result.current.stack.items.map((item) => item.id)).toEqual(['u'])
    act(() => result.current.stack.onDismiss('u'))
    expect(result.current.stack.items).toHaveLength(0)
  })
})
