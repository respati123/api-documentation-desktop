import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactElement, ReactNode } from 'react'

// A fresh query client per test, so cached data never leaks between tests.
export function createQueryWrapper(): ({ children }: { children: ReactNode }) => ReactElement {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return function QueryWrapper({ children }: { children: ReactNode }): ReactElement {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
}
