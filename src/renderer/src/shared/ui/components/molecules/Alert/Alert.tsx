import type { HTMLAttributes, ReactNode } from 'react'
import { cx } from '../../../lib/cx'
import './Alert.css'

export type AlertVariant = 'default' | 'success' | 'warning' | 'destructive'

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant
  icon?: ReactNode
}

export function Alert({ variant = 'default', icon, className, children, ...rest }: AlertProps) {
  return (
    <div role="alert" className={cx('alert', `alert--${variant}`, className)} {...rest}>
      {icon && (
        <span className="alert__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <div className="alert__body">{children}</div>
    </div>
  )
}

export function AlertTitle({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('alert__title', className)} {...rest} />
}

export function AlertDescription({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('alert__description', className)} {...rest} />
}
