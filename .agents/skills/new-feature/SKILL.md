---
name: new-feature
description: Scaffold a new renderer feature, or add a view to an existing feature, with constants, model, service, query keys, ViewModel, View, Page, locale files, and tests that already follow AGENTS.md. Use whenever you create a feature folder or a new screen in src/renderer/src/features/.
---

# New feature

Creates the MVVM files for one feature and one view, so the structure, imports, i18n, test ids, and tests are right from the start.

## Steps

1. Pick English kebab-case names. Check `AGENTS.md` for the existing feature areas. Add a view to one of them before you create a new feature.
2. Run from the desktop folder:

   ```
   bun .agents/skills/new-feature/scripts/scaffold.mjs <feature>
   bun .agents/skills/new-feature/scripts/scaffold.mjs <feature> --view <view>
   ```

   The script never overwrites a file. It lists what it created, what it skipped, and the manual steps left.
3. Make sure the library components the view uses exist (`Alert`, `Button`, `Skeleton`). If one is missing, add it to the library first, following the `api-ui` skill, then import it in the view.
4. Do the manual steps the script prints:
   - register the i18n namespace if needed
   - wire the page into routing
   - add the page export to `index.ts` if it already existed
5. Work test first (see `references/testing.md`):
   - Replace the placeholder schema in `models/` with the real response shape.
   - Update the ViewModel test for the real behavior, see it fail, then change the service and ViewModel.
   - Replace the placeholder text keys and locale strings. Add each key in `en`, then `id`.
6. Shape the View with the impeccable skill (`references/ui-design.md`). Keep every new interactive element on a `data-testid`.
7. Run the `finish-change` skill.

## What the script creates

```
features/<feature>/
├── index.ts
├── constants/<feature>-text.constants.ts
├── models/<feature>.model.ts
├── services/<feature>.service.ts
├── viewmodels/<feature>.keys.ts
├── viewmodels/use-<view>.viewmodel.ts + .test.ts
├── views/<view>.view.tsx + .test.tsx
└── pages/<view>.page.tsx
shared/i18n/locales/en/<feature>.json
shared/i18n/locales/id/<feature>.json
```

Feature-level files (constants, model, service, keys, index, locales) are created only once. Running with `--view` on an existing feature adds the view-level files.

## Notes

- The service calls `apiCall('/api/<feature>')`. Adjust it to the real `apiCall` signature, or switch to `window.apiDesktop` for main-process data. For a new IPC call, use the `new-ipc-channel` skill first.
- Delete anything the feature does not need, such as the list example, instead of leaving placeholder code behind.
