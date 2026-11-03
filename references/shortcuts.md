# Keyboard shortcuts

Read this when you add, change, or remove a keyboard shortcut or a menu accelerator.

## One registry

Every shortcut is defined once in `shared/shortcuts/shortcuts.ts`:

```ts
export const SHORTCUTS = {
  sendRequest: { id: 'request.send', keys: 'Mod+Enter', scope: 'request', label: SHORTCUT_TEXT.sendRequest },
  newRequest: { id: 'collection.newRequest', keys: 'Mod+N', scope: 'global', label: SHORTCUT_TEXT.newRequest },
  closeTab: { id: 'workspace.closeTab', keys: 'Mod+W', scope: 'global', label: SHORTCUT_TEXT.closeTab },
} as const satisfies Record<string, ShortcutDefinition>
```

- `Mod` is `Cmd` on macOS and `Ctrl` on Windows and Linux. Never hard-code `Ctrl` or `Cmd`.
- `scope` is `global` or a feature name. A scoped shortcut works only while that feature has focus.
- `label` is a text constant. The words live in the locale files.
- No key strings anywhere else in the code.

## Binding

- Renderer shortcuts are bound through one hook, `useShortcut(SHORTCUTS.x, handler)`, called in a ViewModel. Views never listen for keys.
- Menu accelerators in the main process read the same registry, so the menu and the renderer always match. When a menu item triggers a renderer action, main sends one push event and the renderer runs the same handler.
- Do not bind a shortcut inside a text field unless it uses `Mod` (for example `Mod+Enter` to send). Plain keys must keep working for typing.

## Conflicts

- Two shortcuts with the same keys in overlapping scopes are not allowed. A test in `shared/shortcuts/` fails on duplicates.
- Do not override OS and Electron defaults: copy, paste, cut, undo, redo, select all, quit, hide, minimize, and full screen.
- Do not use `F12` or `Mod+Shift+I` in production. They stay with DevTools in development only.

## Display

- Show shortcuts in menus, tooltips, and the command palette with the platform symbols (`⌘ ⇧ ⌥ ⌃` on macOS, `Ctrl+Shift+Alt` elsewhere), from one formatter in `shared/shortcuts/`.
- A shortcut list screen is generated from the registry.

## Checklist

1. Added to the registry with a label constant and `en` and `id` keys.
2. Bound with `useShortcut` in a ViewModel, or as a menu accelerator from the registry.
3. No conflicts, no OS default overridden.
4. Tested on macOS key names and on `Ctrl` key names.
