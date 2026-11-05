// Positions for the collection context menu. The menu stays inside the window, so a click near an edge still shows every item.

export const menuWidth = 188
const margin = 8
const anchorGap = 4
const keyboardInset = 12
const edgeAllowance = 196

export type Viewport = { width: number; height: number }
export type Point = { x: number; y: number }

export function contextMenuHeight(targetKind: 'folder' | 'request' | null): number {
  if (targetKind === null) return 92
  // A folder and a request both list four items and a divider.
  return 168
}

export function menuPositionAtPointer(pointer: Point, height: number, viewport: Viewport): Point {
  return {
    x: Math.max(margin, Math.min(pointer.x, viewport.width - menuWidth - margin)),
    y: Math.max(margin, Math.min(pointer.y, viewport.height - height - margin)),
  }
}

export function menuPositionAtAnchor(anchor: { right: number; bottom: number }, height: number, viewport: Viewport): Point {
  return {
    x: Math.max(margin, Math.min(anchor.right - menuWidth, viewport.width - edgeAllowance)),
    y: Math.max(margin, Math.min(anchor.bottom + anchorGap, viewport.height - height - margin)),
  }
}

export function menuPositionAtKeyboard(anchor: { left: number; bottom: number }, height: number, viewport: Viewport): Point {
  return {
    x: Math.max(margin, Math.min(anchor.left + keyboardInset, viewport.width - edgeAllowance)),
    y: Math.max(margin, Math.min(anchor.bottom, viewport.height - height - margin)),
  }
}
