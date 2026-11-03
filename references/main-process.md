# Main process and preload

Read this when you add or change IPC, file access, app lifecycle, windows, menus, or any code in `src/main/` or `src/preload/`.
Security rules are in `security.md`. Read both.

## Layout

```
src/main/
├── index.ts                 app lifecycle, window creation, register IPC
├── windows/                 BrowserWindow factories and security handlers
├── ipc/
│   ├── register.ts          registers every handler module
│   └── <domain>.ipc.ts      handlers for one domain: workspace, collection, http, sync, settings
├── services/                Node logic: file system, HTTP execution, storage, OS integration
├── storage/                 persistence and data migrations
└── lib/                     pure helpers with no Electron imports

src/preload/
├── index.ts                 contextBridge.exposeInMainWorld('apiDesktop', api)
└── api.ts                   the api object, one function per channel

src/shared/ipc/
├── channels.ts              channel names, as const
├── <domain>.contract.ts     zod schemas for each channel's input and output
└── result.ts                IpcResult type
```

- `src/shared/ipc/` is imported by main, preload, and renderer. It contains only zod schemas, types, and constants. No Electron or React imports.
- The `@/` alias is renderer-only. Main and preload import `src/shared/` through their own alias set in `electron.vite.config.ts` (e.g. `@shared/`).

## Channels

- Names are `<domain>:<action>`, lowercase: `collection:save`, `http:send`, `settings:get`.
- Every name lives in `channels.ts`. No string literals elsewhere.
- One channel, one purpose. No generic "do anything" channel.
- Request and response use `ipcRenderer.invoke` / `ipcMain.handle`. Push events from main use `webContents.send` with an `on<Event>` subscribe function in preload that returns an unsubscribe function.

## Contract

Each channel has an input schema and an output schema in `<domain>.contract.ts`:

```ts
// src/shared/ipc/collection.contract.ts
export const saveCollectionInput = z.object({
  workspaceId: z.string().min(1),
  collection: collectionSchema,
})
export const saveCollectionOutput = z.object({ savedAt: z.string() })
export type SaveCollectionInput = z.infer<typeof saveCollectionInput>
export type SaveCollectionOutput = z.infer<typeof saveCollectionOutput>
```

## Result shape

Handlers never throw across IPC. Electron strips error details. They return:

```ts
// src/shared/ipc/result.ts
export type IpcResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { message: string; code?: string } }
```

## Handler

```ts
// src/main/ipc/collection.ipc.ts
export const registerCollectionIpc = (): void => {
  ipcMain.handle(CHANNELS.collection.save, async (event, raw): Promise<IpcResult<SaveCollectionOutput>> => {
    assertTrustedSender(event)
    const input = saveCollectionInput.safeParse(raw)
    if (!input.success) return { ok: false, error: { message: 'Invalid input', code: 'INVALID_INPUT' } }
    try {
      const data = await collectionStore.save(input.data)
      return { ok: true, data }
    } catch (error) {
      log.error('collection:save failed', { workspaceId: input.data.workspaceId, error })
      return { ok: false, error: toIpcError(error) }
    }
  })
}
```

- Validate, call a service, return a result. No business logic in the handler.
- Long work (large imports, big responses) runs async and does not block the main thread. Report progress with push events.

## Preload API

```ts
// src/preload/api.ts
export const api = {
  collection: {
    save: (input: SaveCollectionInput): Promise<IpcResult<SaveCollectionOutput>> =>
      ipcRenderer.invoke(CHANNELS.collection.save, input),
  },
}
export type DesktopApi = typeof api
```

`window.apiDesktop` is typed from `DesktopApi` in a global `.d.ts`.

## Renderer side

- Only services call `window.apiDesktop`.
- The service unwraps `IpcResult`: returns `data`, or throws an error with the main process `message` so the ViewModel handles it like an API error (see `error-handling.md`).
- Validate the output with the contract's output schema.

## Persistence

- All file and database access lives in `src/main/storage/`. The renderer never touches the disk.
- Data lives under `app.getPath('userData')`. Never write next to the app binary.
- Writes are atomic: write to a temp file, then rename.
- Every stored format has a `version` field. Migrations live in `storage/migrations/`, run once at startup, in order, and have tests.
- Ask before changing a stored format.

## Lifecycle

- One instance only: `app.requestSingleInstanceLock()`. A second launch focuses the existing window.
- Register IPC before creating the first window.
- Save window size and position, and restore them within the visible screen.
- Set a minimum window width. The UI is checked at that width (see `ui-design.md`).
- On macOS, keep the app running when all windows close, and re-create the window on `activate`.

## Logging

- Use one logger (`electron-log` or the project's wrapper). No `console.log`.
- Log the channel name, ids, and error. Never log tokens, secrets, request bodies, or response bodies.

## Testing

- `src/main/lib/` and `src/main/services/` are unit-tested with Vitest. Mock Electron modules.
- Each handler has a test for valid input, invalid input, and a failing service.
- Each storage migration has a test from the previous version to the new one.
- Full flows are covered by Playwright `_electron` (see `testing.md`).

## Checklist

1. Channel name in `channels.ts`, schemas in the contract file.
2. Handler validates input, checks the sender, returns `IpcResult`.
3. Preload exposes one typed function. Renderer calls it only from a service.
4. Stored format changes have a migration and a test.
5. No secrets in logs.
