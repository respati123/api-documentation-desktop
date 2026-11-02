# Testing

Read this when you add or change a test, or add an interactive element.

## data-testid

Format: `[feature]-[component]-[element]`, lowercase, dash-separated. Example: `sync-member-role-select`.

Required on:

- every interactive element (`Button`, `Input`, `Select`, `Textarea`, links, menu items, tabs)
- each view's main container: `[feature]-[view]-container`
- loading, error, and empty states
- dialogs, sheets, popovers, and tooltips
- dynamic list items and conditionally rendered blocks

Skip for layout wrappers, static text, and decorative icons. Build repeated ids from one helper.

## What to test

| Layer | Tool | Test |
|---|---|---|
| `lib/`, `shared/utils/`, feature `lib/` | Vitest | pure logic |
| Service | Vitest, mocked `apiCall` or `window.apiDesktop` | endpoint, method, zod parsing, thrown errors |
| ViewModel | Vitest, `renderHook`, mocked service | status, derived values, handlers |
| View | Vitest, Testing Library | renders props, calls callbacks, state branches |
| Error boundary | Vitest, Testing Library | fallback renders, "Try again" resets queries |
| i18n | `bun run i18n-check` | `id` and `en` key parity |
| Main, preload | Vitest | IPC handlers and logic |
| E2E | Playwright `_electron` | full user flows, by `data-testid` only |

Rule tests read the source with `@babel/parser` and `@babel/types` (dev dependencies) and fail with `file:line` messages:

| Test | Enforces |
|---|---|
| `app/ui-rules.test.ts` | no raw elements or text literals in views |
| `app/architecture-rules.test.ts` | `@/` imports, feature boundaries, no hooks or services in views, `window.apiDesktop` only in services |
| `app/testid-rules.test.ts` | `data-testid` on interactive shadcn elements, id format |
| `src/main/security-rules.test.ts` | `webPreferences`, navigation guards, IPC channels, input parsing, sender check, no `sendSync`, no exposed `ipcRenderer` |

Fix the code, never the rule test. If a rule is wrong, ask.

Tests sit next to their source: `viewmodels/use-team.viewmodel.test.ts`, `views/team.view.test.tsx`.

## Patterns

```ts
// viewmodels/use-team.viewmodel.test.ts
import { teamService } from '@/features/sync/services/team.service'

vi.mock('@/features/sync/services/team.service')

it('returns member rows on success', async () => {
  vi.mocked(teamService.listMembers).mockResolvedValue([member])
  const { result } = renderHook(() => useTeamViewModel('ws-1'), { wrapper })
  await waitFor(() => expect(result.current.status).toBe('success'))
  expect(result.current.rows).toHaveLength(1)
})
```

```tsx
// views/team.view.test.tsx
it('calls onInvite when the invite button is clicked', () => {
  const onInvite = vi.fn()
  render(<TeamView {...defaultProps} onInvite={onInvite} />, { wrapper: i18nWrapper })
  fireEvent.click(screen.getByTestId('sync-team-invite-button'))
  expect(onInvite).toHaveBeenCalledTimes(1)
})
```

Query by `data-testid` only. Never by class, id, or visible text.

## TDD

New logic is test first: red, green, refactor.

1. Write one failing test for one behavior. Run that file and confirm it fails for the right reason.
2. Write the smallest code that passes.
3. Refactor with the test green.

Order: services and ViewModels, then Views, then one E2E flow per feature.

- A bug fix starts with a test that reproduces it.
- Test names describe behavior: `returns members sorted by role`.
- Mock dependencies only, never the module under test.
- Tests are independent of order and leftover data.

## Definition of done

1. New tests were written first and pass.
2. The handoff checklist in `AGENTS.md` passes.
