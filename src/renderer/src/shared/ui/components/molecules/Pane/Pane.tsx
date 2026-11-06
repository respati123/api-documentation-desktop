import type { HTMLAttributes } from 'react'
import { cx } from '../../../lib/cx'
import './Pane.css'

// One side of the workbench: a 42px head, a body that fills the rest and scrolls, and an optional foot.
export function Pane({ className, ...rest }: HTMLAttributes<HTMLElement>) {
  return <section className={cx('pane', className)} {...rest} />
}

export function PaneHead({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('pane__head', className)} {...rest} />
}

export function PaneBody({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('pane__body', className)} {...rest} />
}

export interface PaneBarProps extends HTMLAttributes<HTMLDivElement> {
  /** "top" sits under the head, as the body type bar does. */
  position?: 'top' | 'bottom'
}

export function PaneBar({ position = 'bottom', className, ...rest }: PaneBarProps) {
  return <div className={cx('pane__bar', position === 'top' && 'pane__bar--top', className)} {...rest} />
}

// The padded column that holds forms inside a pane body.
export function PaneSection({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('pane__section', className)} {...rest} />
}
