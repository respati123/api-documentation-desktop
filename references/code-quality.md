# Code quality

Read this when you name something, split a file, define props, validate data, or add a helper.

Lint and format are enforced by Biome. Run `bun run lint` before you hand off a change.

## Names

- **English only.** File names, folder names, identifiers, query keys, test ids, and route paths are English, even when the UI text they render is Indonesian. Locale files are named by language code (`id.json`, `en.json`).
- File names are kebab-case with the layer suffix: `team.view.tsx`, `use-team.viewmodel.ts`, `team.service.ts`.
- Components are PascalCase: `TeamView`. Hooks start with `use`.
- Handlers in a ViewModel are named `handle<Action>`: `handleRemoveMember`. The View receives them as props named `on<Action>`: `onRemoveMember`.
- Booleans start with `is`, `has`, `can`, or `should`: `isOwner`, `canManage`, `hasError`.
- Query and mutation hooks are named by what they do: `useMembersQuery`, `useRemoveMemberMutation`.
- Constants are `SCREAMING_SNAKE_CASE` only for module-level values that never change. Otherwise camelCase.
- Do not abbreviate names except `id`, `url`, and common loop indexes.

## Constants instead of magic strings

- Route paths live in `app/routes.ts`. No path string literals in components.
- Query keys come from the key factory. No inline `['team', id]` arrays.
- Test ids follow the format in `testing.md`. Build them from one helper when they repeat.
- Enum-like values use a `const` object or a union type, never bare strings repeated across files.

## Types

- No non-null assertions (`!`). Handle `undefined` in the ViewModel and return a status the View can render.
- No `as` casts to silence the compiler. Narrow the type with a guard, or fix the model.
- Exported functions, services, and ViewModel return values have explicit return types.
- Use discriminated unions for state that has several shapes:

```ts
type InviteState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'error'; message: string }
  | { status: 'done'; token: string }
```

## Validation with zod

- Every API response is parsed with a `zod` schema in the service layer before it reaches a ViewModel. The model type is inferred from the schema with `z.infer`, so there is one source of truth.
- A response that does not match the schema is an error. The service throws, and the ViewModel shows the error state. Do not pass unvalidated data through.
- Put schemas in `models/<name>.model.ts` next to the inferred types.
- Validate form input with the same schemas where the form submits to the API.

```ts
export const teamMemberSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  role: z.enum(['owner', 'editor', 'viewer']),
  joinedAt: z.string(),
})
export type TeamMember = z.infer<typeof teamMemberSchema>
```

## Files and components

- One exported component per file. Private helpers used only by that file may live beside it.
- A View file over about 150 lines, or a ViewModel over about 200 lines, is a signal to split it. Split by section into child components inside the same feature.
- A function over about 40 lines is a signal to extract named steps.
- Use early returns instead of nested `if` blocks.
- No nested ternaries in JSX. Compute the value in the ViewModel, or extract a small component.
- Keep a file to one concern. A service file does not contain formatting helpers.

## Props

- A component takes up to about 7 props. More than that means it should receive one typed object, or be split.
- Do not pass props through more than two levels. Use composition (children or a slot) or a feature-level context.
- Do not spread untyped objects into props. Every prop has a type.
- Boolean props are named for the state they show: `isLoading`, not `loading`.

## Helpers and duplication

- Before you write a helper, search `@/shared/utils` and the feature's `utils`. Reuse what exists.
- Date and time formatting lives in one place, `@/shared/utils/format-date`. Do not copy `formatDate` or `relativeDate` into a feature. These functions exist in several files today. Move them when the feature is migrated.
- Two copies of the same logic are a bug waiting to happen. Extract on the second copy.
- Pure helpers have no React imports and get a unit test.

## Imports

- Order: React and external packages, then `@/shared`, then `@/features`, then styles. One blank line between groups. Biome sorts imports.
- Import only what you use. Biome removes unused imports.
- Use the `@/` alias for every import. See `architecture.md`.

## Lint and format (Biome)

- Biome handles linting, formatting, and import sorting. ESLint and Prettier are not used.
- `bun run lint` runs `biome check`. `bun run format` runs `biome check --write`.
- Biome rules that matter most here: `noNonNullAssertion`, `noExplicitAny`, `noUnusedImports`, `noUnusedVariables`, `useExhaustiveDependencies` (for hooks), and the accessibility rules under `a11y`.
- Do not disable a rule inline without a reason written beside it.

## TypeScript configuration

In `tsconfig.json`:

- `noUnusedLocals`: on.
- `noUnusedParameters`: on.
- `noImplicitReturns`: on.

## Logging and debugging

- No `console.log` in committed code. The error boundary's `console.error` is the only allowed log for real failures.
- No commented-out code. Delete it. Git keeps the history.

## Accessibility basics

- Every icon-only button has an `aria-label`, and the label is translated (see `i18n.md`).
- Every form field has a visible label.
- Focus must stay visible. Do not remove outlines without a replacement.
- Dialogs trap focus and close with Escape. shadcn `Dialog` already does this. Do not replace it with a custom modal.

## Changes and commits

- One migrated feature step per commit. A commit includes the test that covers it.
- Do not mix a refactor and a behavior change in one commit.
- Do not add a dependency in a commit that does not use it.
