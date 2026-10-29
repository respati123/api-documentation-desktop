# Refactor process

Read this before you migrate a feature out of `src/App.tsx` or `src/components/`.

## Ground rules

- Behavior and URLs stay the same unless the change is explicitly requested. A refactor is not a redesign.
- Do not change API contracts from the renderer side. If a feature needs a cloud API change, make it as a separate change in the cloud repository.
- Do not change the visual design. Take a screenshot of the view before you migrate it and compare after.
- Remove dead code and old files in the same step that replaces them. Do not leave a duplicate component behind.

## Steps for one feature

1. Read the current code for the feature, including the parts of `App.tsx` that handle it.
2. Create `features/<name>/` with `models/`, `services/`, `hooks/`, `views/`, `pages/`, and `index.ts`.
3. Move types into `models/`, API calls into `services/`, and effects and handlers into the ViewModel hook.
4. Convert effect-based fetching to TanStack Query. Set `staleTime` and key factories.
5. Move JSX into `views/` as pure props-in components. Replace inline `data-testid` gaps.
6. Export the page and needed types from `index.ts`. Update the route in `app/router.tsx` or `App.tsx` to use the page.
7. Delete the old component file and any code in `App.tsx` that is now unused.
8. Run `bun run typecheck` and `bun run build`. Both must pass.
9. Run the feature's unit and component tests, then check the view in the browser at 390px and desktop width.

## Packages

Install a package only when the first feature that needs it is migrated. Add it as a separate change, and say in the commit message what it is for.

Expected additions, in the order they are likely needed:
- `tailwindcss` and shadcn/ui setup (`components.json`, the global entry stylesheet, theme tokens): first step of the refactor, before any feature moves. Remove `graphite.css` and `styles.css` after the last feature that uses them is migrated.
- `@tanstack/react-query`: first feature with server data.
- `i18next`, `react-i18next`, `i18next-browser-languagedetector`: first feature with user-facing text. Add `id` and `en` files for each feature.
- `react-error-boundary`: with the app shell, before the first route is migrated.
- `vitest`, `@testing-library/react`, `jsdom`: first feature with a test.
- `@playwright/test`: first E2E flow.
- `zustand`: only if a shared UI store is needed.
- `zod`: first service that parses an API response.
- `babel-plugin-react-compiler` (exact version, no `^`): first step of the refactor. See `performance.md` for the Vite setup.
- `@tanstack/react-virtual`: when the collection tree or the commit history is migrated.
- `rollup-plugin-visualizer` (dev only): when the bundle budget in `performance.md` is exceeded.
- `@biomejs/biome`: first step of the refactor, before any feature moves. Add `biome.json` and the `lint` and `format` scripts. Run `biome check --write` once across `src/` and commit that formatting change on its own.

Set up the `@/` alias in `tsconfig.json` and `vite.config.ts` in the first step, before any file uses it. Turn on `noUnusedLocals`, `noUnusedParameters`, and `noImplicitReturns` in the same step.

Add the `bun run test`, `bun run e2e`, and `bun run i18n-check` scripts when their tools are added. `test` is already set up.

## Order

Migrate `auth` first. It is small, and it has a complete flow that covers the router, the session, and the query setup. Then migrate `workspaces`, then `team`, `workspace-settings`, `activity`, and `endpoint-docs`. Leave `desktop-login` for last, since it has the most redirect edge cases.
