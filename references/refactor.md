# Refactor process

Read this before you migrate code out of `App.tsx` or legacy `components/`.

## Ground rules

- Behavior, routes, and visuals stay the same unless a change is requested. A refactor is not a redesign.
- Do not change the cloud API or the IPC contract from the renderer. Make that a separate change.
- Take a screenshot before migrating a view and compare after.
- Delete the old code in the same step. No duplicate left behind.

## Steps for one feature

1. Read the current code, including the parts of `App.tsx` that handle it.
2. Create only the folders it needs under `features/<name>/` (see `architecture.md`).
3. Move types to `models/` as zod schemas, API and IPC calls to `services/`, state and handlers to `viewmodels/`.
4. Replace effect-based fetching with TanStack Query: key factory and `staleTime`.
5. Move JSX to `views/` as props-in components with library components, `t(CONSTANT)`, and `data-testid`.
6. Move repeated components, helpers, and types to `shared/` or `lib/`.
7. Export the page from `index.ts`. Point `App.tsx` or `app/` routing at it.
8. Delete the old files and unused code in `App.tsx`.
9. Run the handoff checklist in `AGENTS.md`, then compare the screenshot.

## Order

Small and self-contained first:

1. `ai-connect`
2. `variables`
3. `response`
4. `request`
5. `collection`
6. `docs`
7. `sync`
8. `workspace` last, since it composes the others.

## Dependencies

Add a package in the step that first needs it, as its own commit, with the reason in the message.

| Package | When |
|---|---|
| `tailwindcss`, `@tailwindcss/vite`, UI library setup | before any feature moves |
| `@biomejs/biome` | before any feature moves. Run `bun run format` once and commit it alone. |
| `babel-plugin-react-compiler` (exact) | before any feature moves |
| `react-error-boundary` | with the app shell |
| `@tanstack/react-query` | first feature with server data |
| `zod` | first service |
| `i18next`, `react-i18next`, `i18next-browser-languagedetector` | first feature with text |
| `vitest`, `@testing-library/react`, `jsdom` | first test |
| `@playwright/test` | first E2E flow |
| `@tanstack/react-virtual` | collection or sync migration |
| `zustand` | only if a shared UI store is needed |
| `rollup-plugin-visualizer` (dev) | only when the startup chunk grows |

Also in the first step: the `@/` alias in `tsconfig.json` and `electron.vite.config.ts`, and the strict `tsconfig` flags from `code-quality.md`.

Remove legacy stylesheets after the last feature that uses them is migrated.
