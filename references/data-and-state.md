# Data fetching, state, and types

Read this when you write a service, a ViewModel, a query, a mutation, a store, or any process logic.

## Services

- Service functions wrap `@/shared/services/api-client` and return typed data.
- No `any`. Type every response with a model interface.
- No React imports and no hooks in services.

```ts
export const teamService = {
  listMembers: async (workspaceId: string): Promise<TeamMember[]> => {
    const { data } = await apiClient.get(`/api/workspaces/${workspaceId}/members`)
    return data.members
  }
}
```

## TanStack Query

- Every `useQuery` and `useMutation` lives in a ViewModel hook.
- Define a key factory per feature:

```ts
export const teamKeys = {
  all: ['team'] as const,
  members: (workspaceId: string) => [...teamKeys.all, workspaceId, 'members'] as const,
}
```

- Set `staleTime` explicitly on every query. Do not rely on the default of 0.
- After a successful mutation, invalidate only the keys it affects.
- Use `placeholderData: keepPreviousData` when the key changes, so the screen does not flash empty.

## No redundant API calls

Each piece of server data is fetched once per cache key. Follow these rules:

- **Never fetch in `useEffect`.** Use a query. TanStack Query dedupes identical in-flight requests and shares the cache across components.
- **Never fetch the same data in two places.** If two ViewModels need the same data, both call the same query hook with the same key. Do not write a second fetch.
- **Do not refetch on mount or focus by default.** Set `staleTime` to the real freshness need. Turn `refetchOnWindowFocus` off unless the data must update live.
- **Do not chain requests that can run in parallel.** Use separate queries, or `useQueries`, so they start together.
- **Enable queries only when needed.** Use `enabled` for dependent or conditional data, for example the invitations list only for owners.
- **Invalidate narrowly.** After a mutation, invalidate the one key that changed, not `all`.
- **Keep derived data out of queries.** Compute filters and sorting with `useMemo` in the ViewModel. Do not call the API again to filter.
- **Build query keys from the key factory only.** React Compiler keeps ViewModel callbacks and returned objects stable, so do not wrap them in `useCallback` or `useMemo` by hand. See `performance.md`.

## Process state

Loading, error, empty, and submitting flags belong to the ViewModel. Return them as values the View renders directly:

```ts
return {
  members: rows,
  status: query.status, // 'pending' | 'error' | 'success'
  errorMessage: query.error ? getApiErrorMessage(query.error) : null,
  isSubmitting: mutation.isPending,
  onRemove: (id: string) => mutation.mutate(id),
}
```

Use the `status` values from the query. Do not rebuild them with extra `useState` flags.

## Client state

Start with local `useState` inside the ViewModel. Use a store only for UI state that several unrelated components share, such as the mobile nav flag or a toast. Add Zustand only when local state and props are not enough.

Never copy server data into a store. Server state belongs to TanStack Query.

## API errors

Do not write your own error messages for API failures. Show the `error` field that the backend returns. See `error-handling.md`.

## Types

Where a type lives is decided in `architecture.md` ("Where types go"). In short: one owner per type, shared domain in `shared/models`, feature-only types in the feature's `models`, and zod schemas next to the types they infer.
