---
name: api-ui
description: The API Documentation UI component library used by the desktop renderer, with its atoms, molecules, and organisms, variant rules, and the visual tokens from DESIGN.md. Use for any UI change in src/renderer/src: choosing a component, adding a variant, building a new view, or deciding where a new component belongs.
user-invocable: false
---

# API Documentation UI

The shared component library for the desktop app. The cloud and web apps use the same library later.

## Sources of truth

1. **`DESIGN.md`** in the desktop folder: colors, type, radius, spacing, and the rules for when to use each color.
2. **The library** is developed in `api-documentation/storybook` and published as `@respati123/api-documentation-ui` on GitHub Packages. The desktop app depends on that package, re-exported from `src/renderer/src/shared/ui/index.ts` and imported as `@/shared/ui`. To get a library change, publish a new version and bump the dependency; never edit `shared/ui/` to patch components. Every component has a story, and its docs page is the usage reference.
3. **`docs/atomic-design.md`** in that project: how a component is classified and the variant rules.

When this skill and `DESIGN.md` disagree, `DESIGN.md` wins. Fix the skill.

## Use the library first

Before writing a new control, look for one in the library. Views import components from the library and never write raw `button`, `input`, `select`, `textarea`, `label`, `table`, `hr`, or `a` (see `AGENTS.md`).

## Levels

| Level | Examples | Rule |
|---|---|---|
| Atom | Button, Input, Textarea, Checkbox, Label, Badge, Separator, Skeleton, StatusDot, MethodTag | One control, label, or indicator. Contains no other library component. |
| Molecule | Alert, Card, Table, Tabs, RadioGroup, ScrollArea, Select, DropdownMenu, SegmentedControl, KeyValueRow, UrlField, RequestTab, RequestRow, FolderRow, EnvironmentRow, TestResultRow | Two or more atoms doing one job, reused in several places. |
| Organism | Dialog | A layer or region with its own layout and focus behavior. |

To classify something new, follow the steps in `docs/atomic-design.md`. Do not decide by folder size.

## Variant rules

- **Button** variants describe importance: `primary` (one per view), `secondary` (most actions), `ghost` (low emphasis in rows and bars), `destructive` (irreversible actions), `link` (inline text actions), and `send` (the Send action only).
- **Size** is a separate prop: `sm`, `md` (default), `lg`, and `icon` for icon-only buttons.
- **Loading** is `loading`, not a separate variant. The label keeps its width. Give icon-only buttons an `aria-label`.
- **Badge** variants: `primary`, `secondary`, `outline`, `success`, `warning`, `destructive`. HTTP and test outcomes use `success`, `warning`, or `destructive`.
- **Electric green** is only for `send`. Do not use it for anything else.

## Radix-based components

Dialog, Select, DropdownMenu, Tabs, RadioGroup, ScrollArea, Label, and Separator are built on Radix primitives. Radix handles focus, keyboard, and ARIA. Do not rebuild that behavior in a view.

- A `SelectLabel` must sit inside a `SelectGroup`.
- Give every Dialog a `DialogTitle`.
- Pass `asChild` to a trigger when it wraps a library Button.

## Changing the library

Do not add a new variant or a new visual style inside a view. If the library lacks something, add it to the library first, with a story and a test, then use it. Keep the change small and say so in the handoff.

## Checks

- A new or changed component has a story in its Storybook folder.
- The library's test (`bun run vitest run` in the storybook project) passes.
- The view has a `data-testid` on every interactive element, as `AGENTS.md` requires.
