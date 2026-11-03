# Data fetching and state

Read this when you write a service, a ViewModel, a query, a mutation, or a store.

## Services

- A service calls `apiCall` from `@/shared/services/api-client` (cloud API) or `window.apiDesktop` (main process), and nothing else.
- Every response is parsed with its zod schema before it is returned. A mismatch throws, and the ViewModel shows the error state.
- No React, no hooks, no formatting helpers.

```ts
// features/sync/models/team.model.ts
export const teamMemberSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  role: z.enum(['owner', 'editor', 'viewer']),
})
export const teamMembersResponseSchema = z.object({ members: z.array(teamMemberSchema) })
export type TeamMember = z.infer<typeof teamMemberSchema>

// features/sync/services/team.service.ts
import { apiCall } from '@/shared/services/api-client'
import { teamMembersResponseSchema, type TeamMember } from '@/features/sync/models/team.model'

export const teamService = {
  listMembers: async (workspaceId: string): Promise<TeamMember[]> => {
    const data = await apiCall(`/api/workspaces/${workspaceId}/members`)
    return teamMembersResponseSchema.parse(data).members
  },
}
```

## TanStack Query

- `useQuery` and `useMutation` are called only inside ViewModels.
- One key factory per feature, named `<domain>Keys`. No inline key arrays.

```ts
export const teamKeys = {
  all: ['team'] as const,
  members: (workspaceId: string) => [...teamKeys.all, workspaceId, 'members'] as const,
}
```

- Set `staleTime` on every query to the real freshness need. Turn `refetchOnWindowFocus` off unless the data must update live.
- Use `placeholderData: keepPreviousData` when the key changes, so the screen does not flash empty.
- Use `enabled` for dependent or conditional data.
- After a mutation or a sync event, invalidate only the keys that changed, never `all`.

## No redundant requests

- Never fetch in `useEffect`.
- Two ViewModels that need the same data call the same query hook with the same key.
- Queries that do not depend on each other start together (separate queries or `useQueries`). No waterfalls.
- Filtering and sorting are computed in the ViewModel from query data. Do not call the API again to filter. Write plain expressions. React Compiler memoizes them (see `performance.md`).

## Process state

The ViewModel returns ready values. Use the query's `status`. Do not rebuild it with `useState` flags.

```ts
export const useTeamViewModel = (workspaceId: string): TeamViewProps => {
  const { t } = useTranslation('sync')
  const query = useQuery({
    queryKey: teamKeys.members(workspaceId),
    queryFn: () => teamService.listMembers(workspaceId),
    staleTime: 60_000,
  })
  const removeMutation = useRemoveMemberMutation(workspaceId)

  return {
    status: query.status,
    rows: toMemberRows(query.data ?? [], t),
    errorMessage: query.error ? query.error.message : null,
    isRemoving: removeMutation.isPending,
    onRemove: (id: string) => removeMutation.mutate(id),
    onRetry: () => query.refetch(),
  }
}
```

`toMemberRows` is a pure helper in the feature's `lib/` with its own unit test.

## Client state

- Start with `useState` inside the ViewModel.
- Use a Zustand store only for UI state shared by unrelated components, such as an open panel or the active tab.
- Never copy server data into a store. Server state belongs to TanStack Query.

## Errors

Show the backend message. See `error-handling.md`.
