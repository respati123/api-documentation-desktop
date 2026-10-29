# Testing

Read this when you add or change a test, or when you add an interactive element.

## data-testid (required)

Every interactive element and every meaningful state needs a `data-testid`.

- Format: `[feature]-[component]-[element]`, lowercase, dash-separated. Example: `team-member-role-select`.
- Required on:
  - all `<button>`, `<a>`, `<input>`, `<select>`, `<textarea>`
  - the main container of each view: `[feature]-[view]-container`
  - loading, error, and empty states
  - dialogs, drawers, and tooltips
  - dynamic list items
  - any conditionally rendered block
- May be skipped: pure layout wrappers, static text that never changes, decorative icons.

```tsx
<button data-testid="team-invite-button">Invite teammate</button>
<p data-testid="team-error-message">{error}</p>
```

## Strategy

| Layer | Tool | What to test |
|---|---|---|
| Lib | Vitest | pure logic in `src/renderer/src/lib`: merge, diff, workspace variables, OpenAPI |
| ViewModel | Vitest + `renderHook` + mocked service | queries, mutations, derived state |
| Service | Vitest + mocked API client | endpoint, method, returned type |
| View | Vitest + Testing Library | rendering props, callbacks, state branches |
| i18n | Vitest | `id` and `en` files have the same keys (`bun run i18n-check`) |
| Error boundary | Vitest + Testing Library | fallback renders, "Try again" resets the query |
| Loading | Vitest + Testing Library | skeleton shows for pending, content for success, no layout jump |
| E2E | Playwright | full flows, selected by `data-testid` only |

## Layout of test files

Co-locate each test with its source file:

```
features/team/
├── hooks/use-team.viewmodel.ts
├── hooks/use-team.viewmodel.test.ts
├── services/team.service.ts
├── services/team.service.test.ts
├── views/team.view.tsx
└── views/team.view.test.tsx
```

## Patterns

ViewModel test with `renderHook` and a mocked service:

```ts
vi.mock('../services/team.service')

it('returns members on success', async () => {
  vi.mocked(teamService.listMembers).mockResolvedValue([member])
  const { result } = renderHook(() => useTeamViewModel('ws-1'), { wrapper })
  await waitFor(() => expect(result.current.isLoading).toBe(false))
  expect(result.current.members).toHaveLength(1)
})
```

View test that queries by `data-testid`:

```tsx
it('calls onInvite when the button is clicked', () => {
  const onInvite = vi.fn()
  render(<TeamView {...defaultProps} onInvite={onInvite} />)
  fireEvent.click(screen.getByTestId('team-invite-button'))
  expect(onInvite).toHaveBeenCalledTimes(1)
})
```

Never query by class, id, or visible text in tests. Those break when styling or copy changes.

E2E test:

```ts
test('owner changes a member role', async ({ page }) => {
  await page.getByTestId('team-member-role-select').selectOption('viewer')
  await expect(page.getByTestId('team-success-toast')).toBeVisible()
})
```

## TDD workflow

New logic is written test first. The cycle for each behavior is red, green, refactor:

1. Write one test that describes one behavior and fails for the right reason. Run only that file and confirm the failure message is the expected one.
2. Write the smallest code that makes it pass.
3. Refactor with the test green. Run the feature's test files.

Order by layer:

- **Services and ViewModels first.** Write the test for the endpoint, the mapping, the status, and the handler before the code.
- **Views second.** Write the render and callback tests once the ViewModel shape is settled. The View test must not need a service.
- **E2E last, per user flow.** Write the Playwright flow when a feature's unit tests pass, so the flow is covered before the feature is called done.

Rules:

- A bug fix starts with a failing test that reproduces the bug. Fix the code only after the test fails.
- Test names describe behavior: `returns members sorted by role`, not `test 1` or `works`.
- Do not test implementation details such as internal state names or call counts that are not part of the contract.
- Do not mock the module under test. Mock its dependencies only.
- Keep tests independent. No test depends on another test's order or leftover data.

Definition of done for a feature change:

1. The new tests were written first and pass.
2. `bun run typecheck`, `bun run build`, `bun run test`, and `bun run i18n-check` pass.
3. `bun run lint` (Biome) passes.
4. The browser check at 390px and desktop width passes.

Main process and preload changes follow the same cycle with `bun run test`.

## Browser check

Any UI change also needs a check in the browser at 390px wide and at desktop width. The page must not scroll horizontally.
