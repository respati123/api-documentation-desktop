import type { CSSProperties, ReactNode, RefObject } from 'react'
import { cx } from '../../../lib/cx'
import './AppShell.css'

export interface AppShellProps {
  rail: ReactNode
  topBar: ReactNode
  sidebar: ReactNode
  children: ReactNode
  /** Lets the app measure the shell, for example to resize the side panel. */
  shellRef?: RefObject<HTMLDivElement | null> | ((node: HTMLDivElement | null) => void)
  /** Sets custom properties such as --app-sidebar-width. */
  style?: CSSProperties
  /** On narrow windows the sidebar is a panel over the work area. Pass false to hide it there. */
  sidebarOpen?: boolean
  /** Called when the scrim over the work area is pressed while the sidebar is open on a narrow window. */
  onSidebarClose?: () => void
  /** Accessible name for the scrim button. Only used when onSidebarClose is set. */
  closeSidebarLabel?: string
  className?: string
}

// Four regions: icon rail, side panel, top bar, and the main work area. Only the lists, editors, and
// response scroll. On windows narrower than 1100px the side panel becomes an overlay that opens from the rail.
export function AppShell({
  rail,
  topBar,
  sidebar,
  children,
  shellRef,
  style,
  sidebarOpen = true,
  onSidebarClose,
  closeSidebarLabel = 'Close panel',
  className,
}: AppShellProps) {
  return (
    <div ref={shellRef} style={style} className={cx('app-shell', className)} data-sidebar={sidebarOpen ? 'open' : 'closed'}>
      <div className="app-shell__rail">{rail}</div>
      <div className="app-shell__topbar">{topBar}</div>
      <div className="app-shell__sidebar">{sidebar}</div>
      {onSidebarClose && (
        <button type="button" className="app-shell__scrim" aria-label={closeSidebarLabel} onClick={onSidebarClose} />
      )}
      <main className="app-shell__main">{children}</main>
    </div>
  )
}
