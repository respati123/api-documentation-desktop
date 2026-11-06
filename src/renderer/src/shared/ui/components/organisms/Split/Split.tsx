import { type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode, useRef, useState } from 'react'
import './Split.css'

export interface SplitProps {
  first: ReactNode
  second: ReactNode
  /** Screen reader name of the divider. */
  separatorLabel: string
  testId?: string
}

const clamp = (value: number) => Math.min(75, Math.max(25, value))

// Two panes side by side. The divider drags between 25% and 75%, moves with the arrow keys, and resets on double click.
export function Split({ first, second, separatorLabel, testId }: SplitProps) {
  const [percent, setPercent] = useState(50)
  const [dragging, setDragging] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId) || !rootRef.current) return
    const box = rootRef.current.getBoundingClientRect()
    setPercent(clamp(((event.clientX - box.left) / box.width) * 100))
  }
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft') setPercent((current) => clamp(current - 3))
    if (event.key === 'ArrowRight') setPercent((current) => clamp(current + 3))
  }

  return (
    <div ref={rootRef} className="split" style={{ '--split': `${percent}%` } as CSSProperties} data-testid={testId}>
      {first}
      {/* biome-ignore lint/a11y/useSemanticElements: a resizer needs a separator with value controls, which hr does not offer */}
      <div
        className={dragging ? 'split__divider split__divider--dragging' : 'split__divider'}
        role="separator"
        tabIndex={0}
        aria-orientation="vertical"
        aria-label={separatorLabel}
        aria-valuemin={25}
        aria-valuemax={75}
        aria-valuenow={Math.round(percent)}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId)
          setDragging(true)
        }}
        onPointerMove={onPointerMove}
        onPointerUp={() => setDragging(false)}
        onDoubleClick={() => setPercent(50)}
        onKeyDown={onKeyDown}
      />
      {second}
    </div>
  )
}
