import { describe, expect, it } from 'vitest'
import { placeSuggestionMenu } from '@/shared/components/variable-field'

const viewport = { width: 1200, height: 800 }
const field = (top: number, height = 30) => ({ top, bottom: top + height, left: 100, width: 400 })

describe('placeSuggestionMenu', () => {
  it('opens below the field, with the full menu height, when there is room', () => {
    expect(placeSuggestionMenu(field(100), viewport)).toMatchObject({ top: 134, maxHeight: 230 })
  })

  it('stays below the field in a short window and shrinks to the room there is', () => {
    // 102 px below the field is enough, so the menu opens below and scrolls, instead of opening above.
    expect(placeSuggestionMenu(field(560), { width: 1200, height: 700 })).toMatchObject({ top: 594, maxHeight: 102 })
  })

  it('opens above the field only when there is too little room below and more above', () => {
    expect(placeSuggestionMenu(field(700), viewport)).toMatchObject({ maxHeight: 230 })
  })

  it('anchors a menu that opens above by its bottom edge, so it touches the field whatever its height', () => {
    const position = placeSuggestionMenu(field(700), viewport)
    expect(position.bottom).toBe(800 - 700 + 4)
    expect(position.top).toBeUndefined()
  })

  it('keeps the menu inside the window width and caps its width', () => {
    expect(placeSuggestionMenu(field(100), viewport).width).toBe(360)
    const near = placeSuggestionMenu({ top: 100, bottom: 130, left: 1100, width: 200 }, viewport)
    expect(near.left + near.width).toBeLessThanOrEqual(1200 - 8)
  })
})
