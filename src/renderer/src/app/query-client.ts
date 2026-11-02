import { QueryClient } from '@tanstack/react-query'

// Each query sets its own staleTime. The desktop app has no window-focus refetching to turn on by default.
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: { queries: { refetchOnWindowFocus: false, retry: false } },
  })
}
