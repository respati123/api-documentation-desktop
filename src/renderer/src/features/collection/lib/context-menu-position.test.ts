import { describe, expect, it } from 'vitest'
import { contextMenuHeight, menuPositionAtAnchor, menuPositionAtPointer, menuWidth } from '@/features/collection/lib/context-menu-position'

const viewport = { width: 1000, height: 700 }

describe('contextMenuHeight', () => {
  it('is shortest for the root, and the same for a request and a folder, which both list four items', () => {
    expect(contextMenuHeight(null)).toBe(92)
    expect(contextMenuHeight('request')).toBe(168)
    expect(contextMenuHeight('folder')).toBe(168)
  })
})

describe('menuPositionAtPointer', () => {
  it('opens at the pointer when there is room', () => {
    expect(menuPositionAtPointer({ x: 300, y: 200 }, 132, viewport)).toEqual({ x: 300, y: 200 })
  })

  it('keeps the menu inside the right and bottom edges', () => {
    expect(menuPositionAtPointer({ x: 990, y: 690 }, 132, viewport)).toEqual({ x: 1000 - menuWidth - 8, y: 700 - 132 - 8 })
  })

  it('keeps the menu inside the top and left edges', () => {
    expect(menuPositionAtPointer({ x: 0, y: 0 }, 132, viewport)).toEqual({ x: 8, y: 8 })
  })
})

describe('menuPositionAtAnchor', () => {
  it('opens under an anchor button, aligned to its right edge', () => {
    expect(menuPositionAtAnchor({ right: 400, bottom: 120 }, 132, viewport)).toEqual({ x: 400 - menuWidth, y: 124 })
  })

  it('clamps an anchor near the right edge of the window', () => {
    expect(menuPositionAtAnchor({ right: 1000, bottom: 120 }, 132, viewport).x).toBe(1000 - 196)
  })
})
