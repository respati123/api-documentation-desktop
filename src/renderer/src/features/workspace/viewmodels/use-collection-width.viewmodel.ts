import { type KeyboardEvent, type PointerEvent, useEffect, useEffectEvent, useRef, useState } from 'react'
import {
  clampCollectionWidth,
  collectionWidthLimit,
  collectionWidthStorageKey,
  minCollectionWidth,
  readCollectionWidth,
} from '@/features/collection'

// The sidebar's width: drag or keyboard resizing, persisted for the next launch, and kept within its limits when the window resizes.
export function useCollectionWidthViewModel() {
  const [collectionWidth, setCollectionWidth] = useState(readCollectionWidth)
  const collectionWidthRef = useRef(collectionWidth)
  const pendingCollectionWidthRef = useRef(collectionWidth)
  const collectionResizeRef = useRef<{ pointerId: number; startX: number; startWidth: number } | null>(null)
  const appShellRef = useRef<HTMLDivElement>(null)

  function commitCollectionWidth(width: number) {
    const nextWidth = clampCollectionWidth(width)
    collectionWidthRef.current = nextWidth
    pendingCollectionWidthRef.current = nextWidth
    appShellRef.current?.style.setProperty('--app-sidebar-width', `${nextWidth}px`)
    setCollectionWidth(nextWidth)
    try {
      localStorage.setItem(collectionWidthStorageKey, String(nextWidth))
    } catch {
      /* The panel still resizes for this session. */
    }
  }
  function startCollectionResize(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return
    event.preventDefault()
    collectionResizeRef.current = { pointerId: event.pointerId, startX: event.clientX, startWidth: collectionWidthRef.current }
    pendingCollectionWidthRef.current = collectionWidthRef.current
    event.currentTarget.setPointerCapture(event.pointerId)
    document.body.classList.add('is-resizing-collection')
  }
  function moveCollectionResize(event: PointerEvent<HTMLDivElement>) {
    const resize = collectionResizeRef.current
    if (!resize || resize.pointerId !== event.pointerId) return
    const nextWidth = clampCollectionWidth(resize.startWidth + event.clientX - resize.startX)
    pendingCollectionWidthRef.current = nextWidth
    appShellRef.current?.style.setProperty('--app-sidebar-width', `${nextWidth}px`)
  }
  function finishCollectionResize(event: PointerEvent<HTMLDivElement>) {
    if (collectionResizeRef.current?.pointerId !== event.pointerId) return
    collectionResizeRef.current = null
    document.body.classList.remove('is-resizing-collection')
    commitCollectionWidth(pendingCollectionWidthRef.current)
  }
  function handleCollectionResizeKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const increment = event.shiftKey ? 48 : 16
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      const nextWidth =
        event.key === 'Home'
          ? minCollectionWidth
          : event.key === 'End'
            ? collectionWidthLimit()
            : collectionWidthRef.current + (event.key === 'ArrowRight' ? increment : -increment)
      commitCollectionWidth(nextWidth)
    }
  }
  const constrainCollectionWidth = useEffectEvent(() => {
    const nextWidth = clampCollectionWidth(collectionWidthRef.current)
    if (nextWidth !== collectionWidthRef.current) commitCollectionWidth(nextWidth)
  })
  useEffect(() => {
    window.addEventListener('resize', constrainCollectionWidth)
    return () => window.removeEventListener('resize', constrainCollectionWidth)
  }, [])

  return {
    collectionWidth,
    appShellRef,
    startCollectionResize,
    moveCollectionResize,
    finishCollectionResize,
    handleCollectionResizeKeyDown,
  }
}
