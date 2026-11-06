# UI, design, and styles

Read this before any UI, design, or styling change in the renderer.

## Required skills

**impeccable** (`.agents/skills/impeccable/SKILL.md`), for all UI work:

1. Read `SKILL.md` and run `scripts/impeccable context` from this folder.
2. Load the reference for the task: `reference/craft-floor.md` before editing, `reference/audit.md` for reviews.
3. When done: `./.agents/skills/impeccable/scripts/impeccable detect --json <changed files>`.

If it is missing: `bunx impeccable install -y --project --providers=codex --no-hooks`. Do not copy it by hand. `scripts/bin/` is gitignored.

**api-ui** (`.agents/skills/api-ui/SKILL.md`), for every component change: the library's levels, variant rules, and the Radix notes.

## Components: the UI library only

- The UI comes from the API Documentation UI library, imported from `@/shared/ui`. `src/renderer/src/shared/ui/index.ts` re-exports the published package `@respati123/api-documentation-ui`. The source and the docs (Storybook pages) stay in the storybook project.
- Views and pages never contain raw `button`, `input`, `select`, `textarea`, `label`, `table`, `hr`, or `a`. Use the library's `Button`, `Input`, `Select`, `Textarea`, `Label`, `Table`, `Separator`, and `Button variant="link"`.
- Notices and errors use `Alert`. Status labels use `Badge`. Panels use `Card`. Loading uses `Skeleton`.
- Dialogs, selects, menus, and tabs use the library's Radix-based components. Do not rebuild their focus or keyboard behavior in a view.
- Button variants describe importance: `primary` (one per view), `secondary`, `ghost`, `destructive`, `link`, and `send` (the Send action only). Size is separate: `sm`, `md`, `lg`, `icon`.
- Electric green is used only for Send.
- A missing component or a fix is made in the storybook project first, with a story and a test, then published as a new package version and bumped here. Do not add a copy of a component in the app.
- A custom element is allowed only when no library component fits. Say so in the handoff.
- No other UI library.

Enforced by `app/ui-rules.test.ts`, which skips `shared/ui/` (the library re-export).

## Styling

- Tailwind v4 through `@tailwindcss/vite`, for layout and spacing. The only app stylesheet is `src/renderer/src/index.css`, imported once in `main.tsx`.
- The library's tokens and component styles (`style.css` of the package) load with `@/shared/ui`, so `main.tsx` imports nothing extra.
- `index.css` holds `@import "tailwindcss"`, the theme tokens (mapped from `DESIGN.md`), and `@font-face` rules.
- No other `.css`, `.scss`, or `.module.css` files in the app. Component styles live in the library package.
- Colors, type, radius, and spacing come from the theme tokens in `DESIGN.md` (`bg-background`, `text-muted-foreground`, and so on). No hex values in components.
- No inline `style` except for values computed at runtime, such as a resizable panel width or a tree depth.
- Merge classes with `cn()`.
- The app has one dark palette. The `dark:` variants are inert.

## Scrolling

- Every scrollable region uses `ScrollArea` with `type="auto"`, so the scrollbar shows only when content overflows.
- The window never scrolls horizontally. Wide content scrolls inside its own `ScrollArea`.
- Do not set `scroll-behavior` on the whole page.

## Loading

- Skeletons match the final layout. Never a full-screen spinner.
- Do not show a skeleton for requests under about 150 ms. Serve cached data or delay it.
- When a key changes, keep previous data with `keepPreviousData` and show a small inline pending indicator.
- Fade content in over 150 to 200 ms. Respect `prefers-reduced-motion`.
- The ViewModel returns `status`. The View renders the skeleton.

## Errors

A view-level error state has a retry button. Crashes go to an error boundary. See `error-handling.md`.

## Window size check

Check every UI change at the minimum window width set in `src/main/` and at a wide window. No horizontal scroll, no clipped text, in both `id` and `en`.
