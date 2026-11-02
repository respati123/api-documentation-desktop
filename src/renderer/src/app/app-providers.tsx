import { QueryClientProvider } from '@tanstack/react-query'
import { type ReactElement, type ReactNode, useState } from 'react'
import { createQueryClient } from '@/app/query-client'
import { AppErrorBoundary } from '@/shared/errors/app-error-boundary'

// Providers every page needs: server-state cache and the error boundary.
export function AppProviders({ children }: { children: ReactNode }): ReactElement {
  const [queryClient] = useState(createQueryClient)

  return (
    <QueryClientProvider client={queryClient}>
      <AppErrorBoundary>{children}</AppErrorBoundary>
    </QueryClientProvider>
  )
}
