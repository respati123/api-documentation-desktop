import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactElement, ReactNode } from 'react'

// One client for the test run. Tests call clearTestQueries() in beforeEach, so no cached data leaks between tests.
export const testQueryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })

export function clearTestQueries(): void {
  testQueryClient.clear()
}

export function QueryWrapper({ children }: { children: ReactNode }): ReactElement {
  return <QueryClientProvider client={testQueryClient}>{children}</QueryClientProvider>
}
