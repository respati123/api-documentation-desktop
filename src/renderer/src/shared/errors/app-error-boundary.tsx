import { QueryErrorResetBoundary } from '@tanstack/react-query'
import type { ReactElement, ReactNode } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { ErrorFallback } from '@/shared/errors/error-fallback'

// Catches render errors only. Async and handler errors are handled in the ViewModel.
export function AppErrorBoundary({ children }: { children: ReactNode }): ReactElement {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onReset={reset}
          onError={(error) => {
            if (import.meta.env.DEV) console.error(error)
          }}
          fallbackRender={({ resetErrorBoundary }) => <ErrorFallback onRetry={resetErrorBoundary} />}
        >
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  )
}
