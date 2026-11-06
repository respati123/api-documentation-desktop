# Code quality

Read this when you name something, split a file, define props, or add a helper.
Biome enforces lint, format, and import order. This file covers what Biome cannot.

## Names

- English for files, folders, identifiers, query keys, test ids, and route paths, even when the UI is Indonesian.
- Files are kebab-case with the layer suffix: `team.view.tsx`, `use-team.viewmodel.ts`, `team.service.ts`.
- Components are PascalCase. Hooks start with `use`.
- ViewModel handlers are `handle<Action>`. View props are `on<Action>`.
- Booleans start with `is`, `has`, `can`, or `should`.
- Query hooks: `use<Thing>Query`, `use<Action>Mutation`.
- `SCREAMING_SNAKE_CASE` only for module-level constants. Otherwise camelCase.
- No abbreviations except `id`, `url`, and loop indexes.
- Rename legacy PascalCase files (`ActivityView.tsx`) when the feature is migrated.

## No magic strings

- Route paths live in `app/routes.ts`.
- Query keys come from the key factory.
- Enum-like values are a `const` object or a union type.

## Types

- No `any`, no non-null `!`, no `as` casts. Narrow with a guard or fix the model.
- Exported functions, services, and ViewModels have explicit return types.
- State with several shapes is a discriminated union:

```ts
type InviteState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'error'; message: string }
  | { status: 'done'; token: string }
```

- Forms validate with the same zod schema the service sends.

## Size and shape

- One exported component per file.
- Split a View over about 150 lines or a ViewModel over about 200 lines.
- Extract named steps from a function over about 40 lines.
- Early returns, no nested `if` blocks.
- No nested ternaries. Compute in the ViewModel or extract a component.
- One concern per file.

## Props

- About 7 props at most. More means one typed object or a split.
- Do not drill props more than two levels. Use children, slots, or a feature context.
- Never spread an untyped object.

## Helpers

- Search `shared/utils/`, `lib/`, and the feature's `lib/` before writing a helper.
- Date and number formatting lives only in `@/shared/utils/format-date`.
- Extract on the second copy.
- Pure helpers have no React imports and a unit test.

## Biome and TypeScript

- `bun run lint` runs `biome check`. `bun run format` runs `biome check --write`. No ESLint or Prettier.
- Never disable a rule inline without a reason beside it.
- `tsconfig.json` has `noUnusedLocals`, `noUnusedParameters`, and `noImplicitReturns` on.

## Hygiene

- No `console.log` in committed code. `console.error` only in the error boundary and main process failure paths.
- No commented-out code.

## Accessibility

- Icon-only buttons have a translated `aria-label`.
- Every form field has a visible `Label`.
- Focus stays visible.
- Dialogs use the library `Dialog`, which traps focus and closes on Escape.

## Commits

- One feature step per commit, with its tests.
- Never mix a refactor and a behavior change.
- Add a dependency in the commit that first uses it.
