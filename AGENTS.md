# Repository Guidelines (desktop)

This folder is the Electron desktop app. The renderer is React, Vite, shadcn/ui, and Tailwind. The main process and preload run in Node and sit outside the renderer rules. Core rules are below. Detailed guides are in `references/`. Read the guide that matches your task before you start.

## Project

`src/main/` is the Electron main process, `src/preload/` is the bridge exposed to the renderer, and `src/renderer/src/` is the React UI. `src/renderer/index.html` is the renderer entry. `electron.vite.config.ts` builds all three. Folder paths in these guides, such as `features/`, `shared/`, and `app/`, start at `src/renderer/src/`.

## Commands

Run these from this folder:

- `bun run dev`: the Electron app with hot reload.
- `bun run build`: production build into `out/`.
- `bun run typecheck`: TypeScript check for the main, preload, and renderer.
- `bun run test`: Vitest.
- `bun run lint` and `bun run format`: Biome check and write.
- `bun run dist:linux`, `dist:mac`, `dist:win`: installers.

Install dependencies with `bun install` in this folder. The lockfile is `bun.lock`.

Run the typecheck and build before you hand off any change in `src/`.

## References

| Read this | When |
|---|---|
| `references/architecture.md` | creating a feature, moving code between layers, placing a file, imports |
| `references/data-and-state.md` | writing a service, query, mutation, store, or any process logic |
| `references/error-handling.md` | handling a failed request, adding an error state or error boundary |
| `references/i18n.md` | adding or changing any text the user sees |
| `references/ui-design.md` | any UI, design, styling, loading, or scrolling change |
| `references/testing.md` | adding a test, TDD workflow, adding an interactive element, `data-testid` |
| `references/code-quality.md` | naming, file size, props, lint, and other cleanliness rules |
| `references/performance.md` | lists, routes, new dependencies, heavy computation, speed reviews |
| `references/refactor.md` | migrating a feature out of `App.tsx` or `components/` |

## Core rules

- **MANDATORY: use Context7 for library docs.** Before you write or change code that calls Electron, React, Vite, Tailwind, shadcn/ui, TanStack Query, zod, i18next, or any other library, resolve the library ID with the Context7 MCP tools and query the docs for the exact API. Do not write library calls from memory. If Context7 is not available, use the official docs and say so in your reply. See `cloud/AGENTS.md`.
- **UI work uses the impeccable skill**, installed at `.agents/skills/impeccable/`. Read `references/ui-design.md` before any UI edit.
- **MANDATORY: every UI element in a view is a shadcn/ui component.** Views and pages never contain raw `button`, `input`, `select`, `textarea`, `label`, `table`, `hr`, or `a` elements. Use the **shadcn** skill (`.agents/skills/shadcn/SKILL.md`) and add missing components with `npx shadcn@latest add <name> -y`. A custom element is allowed only when no shadcn component fits. See `references/ui-design.md`.
- **Styling is Tailwind only.** No `.css` files except the single global entry `src/index.css`. Use Tailwind utilities and theme tokens.
- **MANDATORY: no text literals in views or viewmodels.** A view calls `t(CONSTANT)`, where the constant is an `as const` object in `features/<name>/constants/`. Constants hold locale keys, and the words live in `id` and `en` locale files. Literal or template keys such as `t('list.create')` are not allowed. `src/app/ui-rules.test.ts` enforces this. See `references/i18n.md`.
- **All imports are absolute, with the `@/` alias** (`@/` points to `src/`). No `../` or `./` imports.
- **Pages have no logic. Views only render.** All process logic (fetching, handlers, state, derived values) lives in the ViewModel.
- **Views contain no logic at all.** A view file has no `useState`, `useEffect`, `useMemo`, `useCallback`, `useRef`, no handler bodies, no conditionals that compute data, no data transforms, and no calls to `window.apiDesktop` or `fetch`. It receives props and renders JSX. Event handlers come in as props from the ViewModel. Anything that needs a decision is computed in the ViewModel and passed down as a plain value. The ViewModel is a hook (`use<Name>.viewmodel.ts`) in `viewmodels/` and it owns every piece of state, effect, and handler the view uses.
- **No redundant API calls.** Fetch through TanStack Query in a ViewModel. Never fetch in `useEffect`, and never fetch the same data twice.
- **Performance work uses the vercel-react-best-practices skill**, installed at `.agents/skills/vercel-react-best-practices/`, with the project overrides in `references/performance.md`. React Compiler is on: no manual `useMemo`, `useCallback`, or `React.memo` without a Profiler reason.
- **All user-facing text is translated** in `id` and `en`. Keys in both languages.
- **Show the backend's error message.** Do not write your own API error text or invent error codes.
- **Every route has an error boundary.** Async errors are handled in the ViewModel.
- **Loading uses skeletons that match the final layout.** Scroll areas hide their scrollbar when there is nothing to scroll.
- **MVVM with feature folders.** Features import from each other only through `@/features/<name>`.
- **Reusable UI is shared, never copied.** A component that is used by more than one feature, or that repeats the same markup or behavior, moves to `src/renderer/src/shared/components/` (or `shared/hooks/`, `shared/utils/`) and is imported from there. Two copies of the same component in two features is a defect to fix before the change is done. A component used once stays in its feature.
- **Every interactive element has a `data-testid`**, format `[feature]-[component]-[element]`.
- **Types have one owner.** Feature-only types live in `features/<name>/models`. A type used by two or more features lives in `shared/models`, and features import it from there. See `references/architecture.md`.
- **No `any`.** Validate every API response with a `zod` schema in the service, and infer the type from it.
- **Biome is the only linter and formatter.** Run `bun run lint` before you hand off.
- **File, folder, and identifier names are English**, even when the UI text is Indonesian. See `references/code-quality.md`.
- **Refactors keep behavior, URLs, and visuals.** Migrate one feature per step.
