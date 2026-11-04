# Repository Guidelines (desktop)

Electron desktop app. Renderer: React, Vite, shadcn/ui, Tailwind v4, TanStack Query, zod, i18next.
Read the matching guide in `references/` before you start a task.

## Project

- `src/main/`: Electron main process (Node).
- `src/preload/`: bridge exposed to the renderer as `window.apiDesktop`.
- `src/renderer/src/`: React UI. Entry: `src/renderer/index.html`.
- `electron.vite.config.ts` builds all three.

Renderer paths in these guides start at `src/renderer/src/`. The `@/` alias points there.

```
App.tsx           composition root only
main.tsx          React entry
index.css         the only stylesheet
app/              providers, routes, error boundary wiring, ui-rules.test.ts
features/<name>/  one folder per product area
shared/           code used by two or more features
lib/              pure domain logic shared by features (merge, diff, variables, OpenAPI)
```

Feature areas: workspace, collection, request, response, variables, docs, sync, ai-connect.

## Commands

Run from this folder. Install with `bun install` (lockfile `bun.lock`).

- `bun run dev`: app with hot reload
- `bun run build`: production build into `out/`
- `bun run typecheck`: main, preload, renderer
- `bun run test`: Vitest
- `bun run i18n-check`: locale key parity
- `bun run lint` / `bun run format`: Biome check / write
- `bun run dist:linux` | `dist:mac` | `dist:win`: installers

## Core rules

1. **Library docs.** Before using a library API you have not verified in this session, look it up with Context7. If Context7 is unavailable, use the official docs and say so.
2. **MVVM.** Pages call one ViewModel and render one View. Views only render props. All state, effects, handlers, fetching, and derived values live in the ViewModel. → `architecture.md`
3. **Data.** Services validate every response with zod. Queries and mutations live only in ViewModels. Never fetch in `useEffect`. Never fetch the same data twice. → `data-and-state.md`
4. **UI.** Views use shadcn/ui components only, never raw `button`, `input`, `select`, `textarea`, `label`, `table`, `hr`, `a`. Tailwind only, theme tokens only. Use the impeccable and shadcn skills. → `ui-design.md`
5. **Text.** No literals in views or viewmodels. Call `t(CONSTANT)`. Every key exists in `id` and `en`. → `i18n.md`
6. **Errors.** Show the backend `error` message. Never invent error text or codes. Every page has an error boundary. → `error-handling.md`
7. **Imports.** Absolute `@/` only. Features import each other only through `@/features/<name>`.
8. **One owner.** A component, helper, or type used by two or more features lives in `shared/`. Duplicates are defects.
9. **Types.** No `any`, no `!`, no `as` casts.
10. **Test ids.** Every interactive element has `data-testid="[feature]-[component]-[element]"`. → `testing.md`
11. **Performance.** React Compiler is on. No manual `useMemo`, `useCallback`, or `React.memo` without a Profiler reason. → `performance.md`
12. **Names.** Files, folders, and identifiers are English, even when the UI is Indonesian. → `code-quality.md`
13. **Refactors** keep behavior, URLs, and visuals. One feature per step. → `refactor.md`
14. **Security.** The renderer is untrusted. Never weaken `webPreferences`. Secrets only through `safeStorage` in main, never in renderer storage or logs. → `security.md`
15. **IPC.** Channels and zod contracts live in `src/shared/ipc/`. Every handler validates input, checks the sender, and returns `IpcResult`. Only renderer services call `window.apiDesktop`. → `main-process.md`

Main process and preload follow rules 1, 9, 12, 14, 15, and the handoff checklist.

## Ask first

Stop and ask before you:

- add, remove, or upgrade a dependency
- change an IPC contract, the cloud API contract, or a stored data format
- change `webPreferences`, CSP, permissions, or anything in `security.md`
- delete files outside the change you were asked to make
- change behavior during a refactor

## Before handoff

1. `bun run typecheck`, `bun run build`, `bun run test`, `bun run i18n-check`, `bun run lint` all pass. Use the `finish-change` skill.
2. UI changes: checked at the minimum window width and at a wide window. No horizontal page scroll.

Rule tests run with `bun run test` and enforce these rules: `app/ui-rules.test.ts`, `app/architecture-rules.test.ts`, `app/testid-rules.test.ts`, `src/main/security-rules.test.ts`. Never edit a rule test to make a change pass. Ask instead.

## Project skills

In `.agents/skills/`. Read the `SKILL.md` before you use one.

| Skill | Use for |
|---|---|
| `new-feature` | a new feature folder or a new screen (scaffold script) |
| `new-ipc-channel` | anything the renderer needs from the main process |
| `finish-change` | the handoff checks and report |
| `impeccable`, `shadcn` | all UI work (`ui-design.md`) |
| `vercel-react-best-practices` | performance work (`performance.md`) |
| `karpathy-guidelines` | writing, reviewing, or refactoring code: state assumptions, keep it simple, change only what the task needs, define success criteria |

## Git

- Start every change from an up-to-date `main`, on a branch: `feat/<scope>-<short-desc>`, `fix/...`, `test/...`, `refactor/...`, `chore/...`.
- Never commit directly to `main`. Never force-push `main`, and never move or delete a pushed tag.
- Commits follow Conventional Commits: `feat(request): add body raw editor`. Scope is a feature area, `main`, `preload`, or `release`.
- One logical change per commit, with its tests. Never mix a refactor and a behavior change.
- Stage explicit paths, then read `git diff --cached --name-status` before committing. A file staged earlier goes into the next commit.
- Read `git log` before any `git reset`. Rewrite only your own unpushed commits.
- Never drop a stash you did not create.
- Never commit secrets, `.env`, build output (`out/`, `dist/`), or `.agents/skills/impeccable/scripts/bin/`.

## Pull requests

- Base is `main`. One topic per pull request.
- PR description: what changed, why, how it was tested, screenshots for UI changes, and any "Ask first" item that was approved. List only checks that actually ran.
- Before pushing, run the checks in "Before handoff". Merge only when CI is green, using a merge commit (`gh pr merge --merge`).

## Changes across repos

When a change needs something new from the cloud API, it goes in this order:

1. Server first, with the old behavior still working, so apps already installed do not break.
2. Merge, tag, and deploy the server. A merge to the cloud repo's `main` does not reach production.
3. Check it in production.
4. Merge the desktop change.

Say this order in both pull request descriptions.

## Release

A merge to `main` releases nothing.

1. Tag a commit on `main`: `git tag vX.Y.Z <sha> && git push origin vX.Y.Z`. Use patch for fixes and minor for features. The version must be higher than the last published release, or the app does not offer it as an update.
2. `release.yml` refuses a tag that is not on `main`, runs the checks, builds all platforms, and creates a draft release. The tag is the version: it is set for the build and not committed, so `package.json` on `main` can be behind.
3. Read the draft's assets, then publish the draft in GitHub Releases. Publishing is what makes it available to users, and what the auto-updater sees.
4. Check the published build: sign in, and open a cloud workspace.

Release builds take `VITE_API_URL` and `VITE_CLOUD_URL` from repo variables, so they talk to production. Local builds use `.env`. A release build is not a local test build.

Re-running a failed release job is safe while the release is a draft. The workflow refuses to replace the files of a published release.

## Actions that need an explicit request

An agent does these only when asked for that action, in that conversation:

- push, open a pull request, merge
- create or push a tag
- publish a release
- delete data in the local workspace database
- change repo settings, secrets, or variables

A request for one does not cover the next. "Merge" does not mean "release". If a permission check refuses an action, stop and report it. Do not reach the same result another way.

## When something fails

- CI red: fix the cause. Do not skip the check.
- GitHub `5xx` during a workflow: read what already happened, then re-run the failed job once. A partly finished run may have already changed something.

## References

| Read | When |
|---|---|
| `references/architecture.md` | creating a feature, placing a file, moving code between layers, types |
| `references/data-and-state.md` | services, queries, mutations, stores, process logic |
| `references/error-handling.md` | failed requests, error states, error boundaries |
| `references/i18n.md` | any user-facing text |
| `references/ui-design.md` | any UI, styling, loading, or scrolling change |
| `references/testing.md` | tests, TDD, interactive elements, `data-testid` |
| `references/code-quality.md` | naming, file size, props, lint |
| `references/performance.md` | lists, pages, dependencies, heavy computation |
| `references/refactor.md` | migrating code out of `App.tsx` or legacy `components/` |
| `references/main-process.md` | `src/main/`, `src/preload/`, IPC, storage, windows, app lifecycle |
| `references/security.md` | windows, preload, IPC input, file paths, external links, secrets, untrusted content |
| `references/shortcuts.md` | keyboard shortcuts and menu accelerators |
| `references/release.md` | versions, changelog, installers, signing, auto-update |
