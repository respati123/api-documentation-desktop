export const collectionWidthStorageKey = 'api-docs-collection-width'

export const minCollectionWidth = 220

export const maxCollectionWidth = 520

export function collectionWidthLimit(): number {
  return Math.max(minCollectionWidth, Math.min(maxCollectionWidth, window.innerWidth * 0.38))
}

export function clampCollectionWidth(width: number): number {
  return Math.max(minCollectionWidth, Math.min(collectionWidthLimit(), width))
}

export function readCollectionWidth(): number {
  try {
    const stored = Number(localStorage.getItem(collectionWidthStorageKey))
    return clampCollectionWidth(Number.isFinite(stored) && stored > 0 ? stored : 280)
  } catch {
    return 280
  }
}
