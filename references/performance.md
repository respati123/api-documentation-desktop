# Performance

Read this when you build a list, add a route, add a dependency, write a heavy computation, or review a change for speed.

## Required skill

Use the **vercel-react-best-practices** skill, installed in this folder at `.agents/skills/vercel-react-best-practices/`.

1. Read its `SKILL.md`. The quick reference lists all rules by category and priority.
2. Open only the rule files you need, from `rules/<rule-name>.md`. Each has an incorrect and a correct example.
3. Do not load the compiled `AGENTS.md` inside the skill folder unless you are doing a full performance audit. It is large.

The skill is written for React and Next.js. This app is a Vite single-page app, so some rules do not apply and some are replaced. The table below wins over the skill.

| Skill rule | In this project |
|---|---|
| `server-*` | Does not apply. There is no SSR or React Server Components. |
| `rendering-hydration-*` | Does not apply. There is no hydration. |
| `async-api-routes`, `server-after-nonblocking` | Next.js API routes do not exist here. The parallel-work principle still applies to `src/main/index.ts`. |
| `client-swr-dedup` | Use TanStack Query, not SWR. See `data-and-state.md`. |
| `bundle-dynamic-imports` (`next/dynamic`) | Use `React.lazy` and `Suspense`. |
| `bundle-barrel-imports` | Applies to large third-party packages. A feature's `index.ts` is allowed: it exports only its page and a few types, with named exports, never `export *`. Do not create any other barrel file, such as `shared/components/index.ts`. |
| `rerender-memo`, `rerender-simple-expression-in-memo`, `advanced-use-latest`, `advanced-event-handler-refs` | React Compiler handles memoization. Apply these by hand only after the Profiler shows a problem the compiler did not fix. |
| `rendering-conditional-render` | In Views, use `condition ? <X /> : null` instead of `&&` when the left side can be a number. One level only. No nested ternaries (see `code-quality.md`). |

## React Compiler

React Compiler is on for the whole renderer. It memoizes components and hooks automatically.

Setup, done once in the first refactor step:

- Install `babel-plugin-react-compiler` with an exact version (no `^`).
- Enable it in `vite.config.ts` through `@vitejs/plugin-react`:

```ts
react({ babel: { plugins: [['babel-plugin-react-compiler', {}]] } })
```

- This works with `@vitejs/plugin-react` 5. Version 6 (used with Vite 8) changes how Babel plugins are loaded. Check the setup again before upgrading either package.

Rules:

- Do not write `useMemo`, `useCallback`, or `React.memo` by hand. Add one only when React Profiler shows a slow render that the compiler did not fix, and write the reason beside it.
- Render must be pure. Do not mutate props, state, or values from hooks. Do not run side effects in the component body.
- Check new components in React DevTools. A compiled component shows the "Memo ✨" badge. If the badge is missing, find the rule violation and fix it.
- To opt one component out, add the `"use no memo"` directive with a comment that explains why.
- Biome does not check compiler rules. Review for purity by hand.

## Rules for this app

1. **Virtualize long lists.** Any list that can pass about 100 rows uses `@tanstack/react-virtual` inside a `ScrollArea`. This applies to the collection tree (the cloud API allows up to 10,000 nodes) and to the commit history (up to 500 commits).
2. **Split code by route.** Every page is loaded with `React.lazy` and wrapped in `Suspense` with a skeleton fallback. The commit diff and the endpoint documentation views are the heaviest and must not be in the initial bundle.
3. **Keep the bundle within budget.** The initial JavaScript must stay under 150 KB gzip. Check the sizes printed by `bun run build` after adding a dependency. If the budget is exceeded, inspect the bundle with `rollup-plugin-visualizer` before you add more.
4. **Keep heavy work out of render.** Diffing commit snapshots (`compareSnapshots` in the activity feature today) is computed once per commit, cached by query key, and never recomputed on each render. If it takes more than about 50 ms on a large tree, move it to a Web Worker.
5. **Keep input responsive.** Search and filter inputs use `useDeferredValue` for the filtered result. Tab switches and other non-urgent updates use `startTransition`.
6. **Prefetch on intent.** On hover or focus of a workspace row, prefetch its data with `queryClient.prefetchQuery` and preload its route chunk. The page then opens without a loading state.
7. **Invalidate narrowly on sync events.** A `workspace.updated` WebSocket event invalidates only that workspace's keys.
8. **Avoid request waterfalls.** Queries that do not depend on each other start together. Do not nest components so that each one waits for its parent's data before starting its own request.
9. **Do not define components inside components.** Hoist them to module level.
10. **Load fonts without layout shift.** Self-host the font files, declare them with `font-display: swap` in `index.css`, and preload the weight used above the fold.
11. **Read storage once.** Cache `localStorage` reads, such as the language preference, instead of reading on every render.

## Targets

Measure on a production build (`bun run build`, then `vite preview`), with Lighthouse in mobile mode:

- LCP under 2.5 s
- INP under 200 ms
- CLS under 0.1

Use React Profiler for interactions that feel slow.

## Checklist before handoff

1. No new request waterfall.
2. Initial bundle under 150 KB gzip.
3. Lists that can pass about 100 rows are virtualized.
4. New components show the compiler badge.
5. Changed routes meet the Lighthouse targets.
