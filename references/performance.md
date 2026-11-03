# Performance

Read this when you build a list, add a page, add a dependency, write heavy computation, or review for speed.

## Skill

Use **vercel-react-best-practices** (`.agents/skills/vercel-react-best-practices/`).

1. Read its `SKILL.md`.
2. Open only the `rules/<rule-name>.md` files you need.
3. Load its compiled `AGENTS.md` only for a full performance audit. It is large.

The skill targets Next.js. This is an Electron renderer with Vite. This table wins over the skill:

| Skill rule | Here |
|---|---|
| `server-*`, `rendering-hydration-*` | Do not apply. No SSR, no RSC, no hydration. |
| `async-api-routes`, `server-after-nonblocking` | No API routes. The parallel-work principle applies to IPC handlers in `src/main/`. |
| `client-swr-dedup` | Use TanStack Query. See `data-and-state.md`. |
| `bundle-dynamic-imports` | Use `React.lazy` and `Suspense`. |
| `bundle-barrel-imports` | A feature's `index.ts` is allowed (named exports only, no `export *`). No other barrel files. |
| `rerender-memo`, `rerender-simple-expression-in-memo`, `advanced-use-latest`, `advanced-event-handler-refs` | React Compiler handles these. Apply by hand only with a Profiler reason. |
| `rendering-conditional-render` | Use `cond ? <X /> : null` when `cond` can be a number. |

## React Compiler

On for the whole renderer, through `babel-plugin-react-compiler` (exact version) in the renderer's `@vitejs/plugin-react` config in `electron.vite.config.ts`. Recheck the setup before upgrading Vite or `@vitejs/plugin-react`.

- No manual `useMemo`, `useCallback`, or `React.memo` unless the Profiler shows a slow render the compiler missed. Write the reason beside it.
- Render is pure. No mutation of props, state, or hook values. No side effects in the body.
- New components show the "Memo ✨" badge in React DevTools. If not, find the violation.
- Opt out only with `"use no memo"` and a comment explaining why.

## Rules

1. **Virtualize long lists.** A list that can pass about 100 rows uses `@tanstack/react-virtual` in a `ScrollArea`: the collection tree (up to 10,000 nodes) and commit history (up to 500).
2. **Lazy-load heavy views.** Pages load with `React.lazy` and a skeleton `Suspense` fallback. The commit diff and docs views stay out of the startup chunk.
3. **Watch startup.** Check chunk sizes from `bun run build` after adding a dependency. Inspect with `rollup-plugin-visualizer` before adding more if the startup chunk grows noticeably.
4. **Heavy work off render.** Snapshot diffs are computed once per commit and cached by query key. Over about 50 ms on a large tree, move to a Web Worker or the main process.
5. **Responsive input.** Search and filter results use `useDeferredValue`. Tab switches use `startTransition`.
6. **Prefetch on intent.** On hover or focus of a workspace row, `prefetchQuery` its data and preload its chunk.
7. **Narrow invalidation.** A `workspace.updated` event invalidates only that workspace's keys.
8. **No waterfalls.** Independent queries start together.
9. **No components defined inside components.**
10. **Fonts.** Bundle fonts locally with `font-display: swap` in `index.css`.
11. **Read storage once.** Cache `localStorage` reads.
12. **IPC.** Do not call `window.apiDesktop` in a loop. Batch on the main side.

## Checklist

1. No new waterfall.
2. Long lists virtualized.
3. New components show the compiler badge.
4. Slow interactions profiled with React Profiler. Target: input response under 200 ms, no layout shift on load.
