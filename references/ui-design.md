# UI, design, and styles

Read this before any UI, design, or styling change in the renderer.

## Required skills

**impeccable** (`.agents/skills/impeccable/SKILL.md`), for all UI work:

1. Read `SKILL.md` and run `scripts/impeccable context` from this folder.
2. Load the reference for the task: `reference/craft-floor.md` before editing, `reference/audit.md` for reviews.
3. When done: `./.agents/skills/impeccable/scripts/impeccable detect --json <changed files>`.

If it is missing: `bunx impeccable install -y --project --providers=codex --no-hooks`. Do not copy it by hand. `scripts/bin/` is gitignored.

**shadcn** (`.agents/skills/shadcn/SKILL.md`), for every component change:

1. Read `SKILL.md` and the matching `rules/` files (`composition.md`, `forms.md`, `styling.md`, `icons.md`).
2. Check what is installed: `npx shadcn@latest info --json`.
3. Read the docs before use: `npx shadcn@latest docs <component>`.

## Components: shadcn/ui only

- Views and pages never contain raw `button`, `input`, `select`, `textarea`, `label`, `table`, `hr`, or `a`. Use `Button`, `Input`, `Select`, `Textarea`, `Label`, `Table`, `Separator`, and `Button variant="link"`.
- Notices and errors use `Alert`. Empty states use `Empty`. Panels use `Card`. Status labels use `Badge`. Loading uses `Skeleton`.
- Add components only with `npx shadcn@latest add <name> -y`. They go in `shared/components/ui/`. Never hand-edit them. Wrap one in `shared/components/` if it needs a different look.
- After every `add`, fix the `cn` import to `@/shared/utils/cn`.
- A custom element is allowed only when no shadcn component fits. Say so in the handoff.
- No other UI library.

Enforced by `app/ui-rules.test.ts`.

## Styling

- Tailwind v4 through `@tailwindcss/vite`. The only stylesheet is `src/renderer/src/index.css`, imported once in `main.tsx`.
- `index.css` holds only `@import "tailwindcss"`, the theme tokens (`:root` and `.dark`), the shadcn base layer, and `@font-face` rules.
- No other `.css`, `.scss`, or `.module.css` files.
- Colors come from theme tokens (`bg-background`, `text-muted-foreground`). No hex values in components.
- No inline `style` except for values computed at runtime, such as a resizable panel width.
- Merge classes with `cn()`.
- Light and dark themes share one token set.

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
