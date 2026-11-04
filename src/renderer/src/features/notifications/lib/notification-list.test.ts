import { describe, expect, it } from 'vitest'
import { addNotification, maxVisibleNotifications, removeNotification } from '@/features/notifications/lib/notification-list'
import type { AppNotification } from '@/features/notifications/models/notification.model'

const note = (id: string): AppNotification => ({ id, tone: 'info', title: id })

describe('addNotification', () => {
  it('puts the newest notification first', () => {
    expect(addNotification([note('a')], note('b')).map((item) => item.id)).toEqual(['b', 'a'])
  })

  it('keeps at most the visible limit, dropping the oldest', () => {
    const full = ['a', 'b', 'c'].map(note)
    const result = addNotification(full, note('d'))
    expect(result).toHaveLength(maxVisibleNotifications)
    expect(result.map((item) => item.id)).toEqual(['d', 'a', 'b'])
  })

  it('moves a repeated id to the top instead of showing it twice', () => {
    const result = addNotification([note('a'), note('b')], { ...note('b'), title: 'again' })
    expect(result.map((item) => item.id)).toEqual(['b', 'a'])
    expect(result[0].title).toBe('again')
  })
})

describe('removeNotification', () => {
  it('removes only the given id', () => {
    expect(removeNotification([note('a'), note('b')], 'a').map((item) => item.id)).toEqual(['b'])
  })
})
